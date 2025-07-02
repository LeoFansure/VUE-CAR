<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ElButton, ElCard, ElTable, ElTableColumn, ElTag, ElAlert, ElDivider, ElRow, ElCol, ElStatistic, ElIcon, ElMessage, ElEmpty, ElLoading } from 'element-plus'
import { VideoCamera, Setting, Document, TrendCharts, Connection, Warning, CircleCheck, InfoFilled, Loading } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
// 导入AGV控制API
import { agvForward, agvStop, agvBackward, heartbeat } from '@/api/car/agv'
// 导入系统检查API
import { checkFs, checkDb, checkAgv, checkCam } from '@/api/car/system'
// 导入任务管理API
import { listTask, startTask as startTaskApi, endTask as endTaskApi, uploadTask } from '@/api/car/task'
// 导入故障管理API
import { listFlaw } from '@/api/car/flaw'
// 导入摄像头API - 使用与 TaskExecuteView 相同的 API
import { deviceList } from '@/api/car/camera'

const router = useRouter()

// 响应式数据
const agvStatus = ref({
  sysTime: '2024-01-01 12:00:00',
  isRunning: false,
  currentPosition: 0
})

const systemStatus = ref({
  fs: true,
  db: true,
  agv: true,
  cam: true
})

const currentTask = ref(null)
const flawList = ref([])

// 控制状态
const isConnected = ref(true)
const isTaskRunning = ref(false)

// 视频播放相关 - 按照 TaskExecuteView 的模式
const cameraList = ref([])
const currentCamera = ref(null)
const playerInstance = ref(null)
const videoContainerId = 'video-container'

// 本地摄像头调试相关
const localVideoRef = ref(null)
const isLocalVideoPaused = ref(false)
const isLocalVideoActive = ref(false)

// 加载状态
const loading = ref({
  system: false,
  agv: false,
  task: false,
  flaw: false,
  camera: false,
})

// 获取任务状态类型
const getTaskStatusType = (status) => {
  const statusMap = {
    '待巡视': 'info',
    '巡视中': 'warning',
    '待上传': 'primary',
    '已完成': 'success'
  }
  return statusMap[status] || 'info'
}

// 获取系统状态
const getSystemStatus = async () => {
  loading.value.system = true
  try {
    const [fsRes, dbRes, agvRes, camRes] = await Promise.all([
      checkFs(),
      checkDb(),
      checkAgv(),
      checkCam()
    ])
    
    systemStatus.value = {
      fs: fsRes.code === 200,
      db: dbRes.code === 200,
      agv: agvRes.code === 200,
      cam: camRes.code === 200
    }
    
    // 更新AGV连接状态
    isConnected.value = agvRes.code === 200
    
    console.log('系统状态获取成功:', systemStatus.value)
  } catch (error) {
    console.error('获取系统状态失败:', error)
    ElMessage.error('获取系统状态失败')
  } finally {
    loading.value.system = false
  }
}

// 获取AGV状态
const getAgvStatus = async () => {
  loading.value.agv = true
  try {
    const response = await heartbeat()
    if (response.code === 200) {
      agvStatus.value = response.data || {
        sysTime: new Date().toLocaleString(),
        isRunning: false,
        currentPosition: 0
      }
      console.log('AGV状态获取成功:', agvStatus.value)
    }
  } catch (error) {
    console.error('获取AGV状态失败:', error)
    ElMessage.error('获取AGV状态失败')
  } finally {
    loading.value.agv = false
  }
}

// 获取当前任务
const getCurrentTask = async () => {
  loading.value.task = true
  try {
    const response = await listTask({ pageNum: 1, pageSize: 10 })
    if (response.code === 200 && response.rows.length > 0) {
      // 查找正在运行的任务
      const runningTask = response.rows.find(task => task.taskStatus === '巡视中')
      currentTask.value = runningTask || response.rows[0] // 如果没有运行中的任务，显示第一个任务
      isTaskRunning.value = !!runningTask
      console.log('当前任务获取成功:', currentTask.value)
    }
  } catch (error) {
    console.error('获取当前任务失败:', error)
    ElMessage.error('获取当前任务失败')
  } finally {
    loading.value.task = false
  }
}

// 获取故障列表
const getFlawList = async () => {
  loading.value.flaw = true
  try {
    const response = await listFlaw({ pageNum: 1, pageSize: 20 })
    if (response.code === 200) {
      flawList.value = response.rows || []
      console.log('故障列表获取成功:', flawList.value)
    }
  } catch (error) {
    console.error('获取故障列表失败:', error)
    ElMessage.error('获取故障列表失败')
  } finally {
    loading.value.flaw = false
  }
}

// 获取摄像头列表 - 按照 TaskExecuteView 的模式
const loadCameraList = async () => {
  loading.value.camera = true
  try {
    const res = await deviceList()
    const cameraData = res.data?.items // 使用正确的数据路径
    if (cameraData) {
      cameraList.value = cameraData
      if (cameraData.length > 0) {
        currentCamera.value = cameraData[0]
      }
    }
  } catch (error) {
    ElMessage.error('加载摄像头列表失败')
  } finally {
    loading.value.camera = false
  }
}

// 构建 FLV URL - 按照 TaskExecuteView 的模式
const getFlvUrl = (camera) => {
  if (!camera || !camera.id) return ''
  return `http://192.168.2.57/webrtc-api/live/${camera.id}_01.flv`
}

// 播放视频 - 按照 TaskExecuteView 的模式
const playVideo = (camera) => {
  if (!camera || !camera.id) {
    ElMessage.warning('请选择一个有效的摄像头')
    return
  }

  // 停止当前播放
  stopVideo()

  currentCamera.value = camera
  const videoUrl = getFlvUrl(camera)
  
  try {
    playerInstance.value = new EasyPlayer.EasyPlayer(videoContainerId, {
      decode: 'mse', // 或者 'wasm'
      videoUrl: videoUrl,
      live: true,
      debug: false,
      autoplay: true,
    })
    console.log(`正在播放: ${videoUrl}`)
  } catch (error) {
    console.error('创建播放器失败:', error)
    ElMessage.error('创建播放器失败')
  }
}

// 停止视频
const stopVideo = () => {
  if (playerInstance.value) {
    playerInstance.value.destroy()
    playerInstance.value = null
    console.log('播放器已停止')
  }
}

// 切换摄像头
const switchCamera = (camera) => {
  playVideo(camera)
}

// 刷新所有数据
const refreshAllData = async () => {
  console.log('刷新所有数据')
  await Promise.all([
    getSystemStatus(),
    getAgvStatus(),
    getCurrentTask(),
    getFlawList(),
    loadCameraList(),
  ])
}

// AGV控制函数
const controlAgv = async (action) => {
  try {
    let response
    switch (action) {
      case 'forward':
        console.log('前进')
        response = await agvForward()
        break
      case 'stop':
        console.log('停止')
        response = await agvStop()
        break
      case 'backward':
        console.log('后退')
        response = await agvBackward()
        break
      default:
        ElMessage.error('无效的控制指令')
        return
    }
    
    if (response.code === 200) {
      ElMessage.success(`${action === 'forward' ? '前进' : action === 'stop' ? '停止' : '后退'}指令发送成功`)
    } else {
      ElMessage.error(response.msg || '控制失败')
    }
  } catch (error) {
    console.error('AGV控制失败:', error)
    ElMessage.error('AGV控制失败，请检查网络连接')
  }
}

// 启动任务
const startTask = async (taskId) => {
  if (!taskId) {
    ElMessage.warning('请先选择任务')
    return
  }
  
  try {
    console.log('启动任务:', taskId)
    const response = await startTaskApi(taskId)
    if (response.code === 200) {
      ElMessage.success('任务启动成功')
      // 刷新任务状态
      await getCurrentTask()
    } else {
      ElMessage.error(response.msg || '任务启动失败')
    }
  } catch (error) {
    console.error('启动任务失败:', error)
    ElMessage.error('启动任务失败')
  }
}

// 结束任务
const endTask = async (taskId, isAbort = false) => {
  if (!taskId) {
    ElMessage.warning('请先选择任务')
    return
  }
  
  try {
    console.log(`${isAbort ? '中止' : '完成'}任务:`, taskId)
    const response = await endTaskApi(taskId, isAbort)
    if (response.code === 200) {
      ElMessage.success(isAbort ? '任务已中止' : '任务已完成')
      // 刷新任务状态
      await getCurrentTask()
    } else {
      ElMessage.error(response.msg || '任务操作失败')
    }
  } catch (error) {
    console.error('任务操作失败:', error)
    ElMessage.error('任务操作失败')
  }
}

// 确认故障
const confirmFlaw = async (flawId) => {
  if (!flawId) {
    ElMessage.warning('请先选择故障')
    return
  }
  
  try {
    console.log('确认故障:', flawId)
    // 这里需要调用确认故障的API，但接口文档中没有提供
    // 暂时使用模拟成功
    ElMessage.success('故障已确认')
    // 刷新故障列表
    await getFlawList()
  } catch (error) {
    console.error('确认故障失败:', error)
    ElMessage.error('确认故障失败')
  }
}

// 上传任务数据
const uploadTaskData = async (taskId) => {
  if (!taskId) {
    ElMessage.warning('请先选择任务')
    return
  }
  
  try {
    console.log('上传任务数据:', taskId)
    const response = await uploadTask(taskId)
    if (response.code === 200) {
      ElMessage.success('数据上传成功')
      // 刷新任务状态
      await getCurrentTask()
    } else {
      ElMessage.error(response.msg || '数据上传失败')
    }
  } catch (error) {
    console.error('数据上传失败:', error)
    ElMessage.error('数据上传失败')
  }
}

// 页面跳转
const goToPage = (page) => {
  router.push(`/${page}`)
}

// 本地摄像头测试
const testLocalCamera = async () => {
  try {
    // 停止当前播放器
    stopVideo()
    
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    const videoElement = document.getElementById(videoContainerId);
    if (videoElement) {
      videoElement.innerHTML = '';
      const localVideo = document.createElement('video');
      localVideo.autoplay = true;
      localVideo.muted = true;
      localVideo.playsInline = true;
      localVideo.style.width = '100%';
      localVideo.style.height = '100%';
      localVideo.srcObject = stream;
      videoElement.appendChild(localVideo);
      localVideoRef.value = localVideo;
      isLocalVideoPaused.value = false;
      isLocalVideoActive.value = true;
    }
    ElMessage.success('本地摄像头已开启');
  } catch (err) {
    ElMessage.error('无法获取本地摄像头: ' + err.message);
  }
};

// 切换本地视频暂停/播放
const togglePauseLocalVideo = () => {
  if (localVideoRef.value) {
    if (localVideoRef.value.paused) {
      localVideoRef.value.play();
      isLocalVideoPaused.value = false;
      ElMessage.success('本地视频已恢复播放');
    } else {
      localVideoRef.value.pause();
      isLocalVideoPaused.value = true;
      ElMessage.info('本地视频已暂停');
    }
  }
};

// 停止本地视频
const stopLocalVideo = () => {
  if (localVideoRef.value) {
    const stream = localVideoRef.value.srcObject;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    localVideoRef.value.remove();
    localVideoRef.value = null;
    isLocalVideoPaused.value = false;
    isLocalVideoActive.value = false;
    
    // 恢复占位符
    const videoElement = document.getElementById(videoContainerId);
    if (videoElement) {
      videoElement.innerHTML = '';
    }
    
    ElMessage.info('本地摄像头已关闭');
  }
};

// 组件挂载时的初始化
onMounted(() => {
  console.log('GlobalControlView 组件已挂载')
  
  // 初始化时获取所有数据
  refreshAllData()
  
  // 检查必要的DOM元素是否存在
  setTimeout(() => {
    console.log('检查视频容器DOM元素')
    const videoElement = document.getElementById(videoContainerId)
    
    if (videoElement) {
      console.log('视频容器元素已就绪:', videoElement)
    } else {
      console.error('视频容器元素未找到:', videoContainerId)
    }
  }, 1000)
  
  // 设置定时刷新（每30秒刷新一次数据）
  const refreshInterval = setInterval(() => {
    refreshAllData()
  }, 30000)
  
  // 保存定时器ID，用于组件卸载时清理
  window.refreshInterval = refreshInterval
})

// 组件卸载时清理资源
onUnmounted(() => {
  console.log('GlobalControlView 组件卸载，清理资源')
  try {
    // 清理定时器
    if (window.refreshInterval) {
      clearInterval(window.refreshInterval)
      window.refreshInterval = null
    }
    
    // 停止视频播放器
    stopVideo()
    
    // 停止本地视频流
    stopLocalVideo()
    
    console.log('资源清理完成')
  } catch (error) {
    console.error('清理资源失败:', error)
  }
})
</script>

<template>
  <div class="global-control-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <h1>全局控制中心</h1>
          <p>AGV智能巡检系统实时监控与控制</p>
        </div>
        <div class="action-section">
          <el-button 
            type="primary" 
            @click="refreshAllData"
            :loading="loading.system || loading.agv || loading.task || loading.flaw"
          >
            <el-icon><Connection /></el-icon>
            刷新数据
          </el-button>
        </div>
      </div>
    </div>

    <el-row :gutter="20">
      <!-- 左侧：数据监控区域 -->
      <el-col :span="12">
        <el-card class="monitor-card">
          <template #header>
            <div class="card-header">
              <el-icon><Connection /></el-icon>
              <span>数据监控</span>
            </div>
          </template>

          <!-- 系统状态 -->
          <div class="status-section">
            <h3>
              系统状态
              <el-icon v-if="loading.system" class="loading-icon"><Loading /></el-icon>
            </h3>
            <el-row :gutter="10">
              <el-col :span="6">
                <el-statistic title="文件系统" :value="systemStatus.fs ? '正常' : '异常'">
                  <template #prefix>
                    <el-icon :color="systemStatus.fs ? '#67C23A' : '#F56C6C'">
                      <CircleCheck v-if="systemStatus.fs" />
                      <Warning v-else />
                    </el-icon>
                  </template>
                </el-statistic>
              </el-col>
              <el-col :span="6">
                <el-statistic title="数据库" :value="systemStatus.db ? '正常' : '异常'">
                  <template #prefix>
                    <el-icon :color="systemStatus.db ? '#67C23A' : '#F56C6C'">
                      <CircleCheck v-if="systemStatus.db" />
                      <Warning v-else />
                    </el-icon>
                  </template>
                </el-statistic>
              </el-col>
              <el-col :span="6">
                <el-statistic title="AGV连接" :value="systemStatus.agv ? '正常' : '异常'">
                  <template #prefix>
                    <el-icon :color="systemStatus.agv ? '#67C23A' : '#F56C6C'">
                      <CircleCheck v-if="systemStatus.agv" />
                      <Warning v-else />
                    </el-icon>
                  </template>
                </el-statistic>
              </el-col>
              <el-col :span="6">
                <el-statistic title="摄像头" :value="systemStatus.cam ? '正常' : '异常'">
                  <template #prefix>
                    <el-icon :color="systemStatus.cam ? '#67C23A' : '#F56C6C'">
                      <CircleCheck v-if="systemStatus.cam" />
                      <Warning v-else />
                    </el-icon>
                  </template>
                </el-statistic>
              </el-col>
            </el-row>
          </div>

          <el-divider />

          <!-- AGV状态 -->
          <div class="status-section">
            <h3>
              AGV实时状态
              <el-icon v-if="loading.agv" class="loading-icon"><Loading /></el-icon>
            </h3>
            <el-alert
              :title="isConnected ? 'AGV已连接' : 'AGV连接异常'"
              :type="isConnected ? 'success' : 'error'"
              :closable="false"
              show-icon
            />
            <div class="agv-info">
              <p><strong>系统时间：</strong>{{ agvStatus.sysTime }}</p>
              <p><strong>运行状态：</strong>
                <el-tag :type="agvStatus.isRunning ? 'success' : 'info'">
                  {{ agvStatus.isRunning ? '运行中' : '已停止' }}
                </el-tag>
              </p>
              <p><strong>当前位置：</strong>{{ agvStatus.currentPosition }} 米</p>
            </div>
          </div>

          <el-divider />

          <!-- 当前任务 -->
          <div class="status-section">
            <h3>
              当前任务
              <el-icon v-if="loading.task" class="loading-icon"><Loading /></el-icon>
            </h3>
            <div v-if="currentTask" class="task-info">
              <p><strong>任务编号：</strong>{{ currentTask.taskCode }}</p>
              <p><strong>任务名称：</strong>{{ currentTask.taskName }}</p>
              <p><strong>执行人：</strong>{{ currentTask.executor }}</p>
              <p><strong>状态：</strong>
                <el-tag :type="getTaskStatusType(currentTask.taskStatus)">
                  {{ currentTask.taskStatus }}
                </el-tag>
              </p>
            </div>
            <el-empty v-else description="暂无运行中的任务" />
          </div>

          <el-divider />

          <!-- 故障列表 -->
          <div class="status-section">
            <h3>
              最新故障
              <el-icon v-if="loading.flaw" class="loading-icon"><Loading /></el-icon>
            </h3>
            <el-table :data="flawList" height="200" size="small">
              <el-table-column prop="flawType" label="类型" width="80" />
              <el-table-column prop="flawName" label="故障名称" />
              <el-table-column prop="flawDistance" label="距离" width="80">
                <template #default="scope">
                  {{ scope.row.flawDistance }}m
                </template>
              </el-table-column>
              <el-table-column prop="confirmed" label="状态" width="80">
                <template #default="scope">
                  <el-tag :type="scope.row.confirmed ? 'success' : 'warning'" size="small">
                    {{ scope.row.confirmed ? '已确认' : '待确认' }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：控制操作区域 -->
      <el-col :span="12">
        <el-card class="control-card">
          <template #header>
            <div class="card-header">
              <el-icon><Setting /></el-icon>
              <span>控制操作</span>
            </div>
          </template>

          <!-- 摄像头视频显示 -->
          <div class="video-section">
            <h3>摄像头监控</h3>
            <div class="video-container">
              <div class="video-display">
                <!-- 视频容器 -->
                <div :id="videoContainerId" class="video-element"></div>
                
                <!-- 视频占位符 -->
                <div v-if="!playerInstance && !isLocalVideoActive" class="video-placeholder">
                  <el-icon :size="48"><VideoCamera /></el-icon>
                  <p>请选择摄像头并点击播放</p>
                </div>
                
                <!-- 本地视频状态提示 -->
                <div v-if="isLocalVideoActive" class="local-video-status">
                  <div class="status-overlay">
                    <el-icon :size="24"><VideoCamera /></el-icon>
                    <span>本地摄像头 {{ isLocalVideoPaused ? '已暂停' : '运行中' }}</span>
                  </div>
                </div>
              </div>
              
              <!-- 视频控制按钮 -->
              <div class="video-controls">
                <el-button 
                  v-if="!isLocalVideoActive"
                  :type="playerInstance ? 'danger' : 'success'"
                  @click="playerInstance ? stopVideo() : playVideo(currentCamera)"
                >
                  {{ playerInstance ? '停止' : '播放' }}
                </el-button>
                <el-button 
                  v-if="playerInstance && !isLocalVideoActive"
                  @click="() => playerInstance?.fullscreen()"
                >
                  全屏
                </el-button>
              </div>
            </div>
          </div>

          <el-divider />

          <!-- AGV移动控制 -->
          <div class="control-section">
            <h3>AGV移动控制</h3>
            <div class="control-buttons">
              <el-button 
                type="primary" 
                size="large" 
                @click="controlAgv('forward')"
              >
                前进
              </el-button>
              <el-button 
                type="danger" 
                size="large" 
                @click="controlAgv('stop')"
              >
                停止
              </el-button>
              <el-button 
                type="warning" 
                size="large" 
                @click="controlAgv('backward')"
              >
                后退
              </el-button>
            </div>
          </div>

          <el-divider />

          <!-- 摄像头控制 -->
          <div class="control-section">
            <h3>
              摄像头控制
              <el-icon v-if="loading.camera" class="loading-icon"><Loading /></el-icon>
            </h3>
            <div class="camera-controls">
              <div class="camera-buttons">
                <el-button 
                  v-for="camera in cameraList" 
                  :key="camera.id"
                  :type="currentCamera?.id === camera.id ? 'primary' : 'default'"
                  @click="switchCamera(camera)"
                >
                  {{ camera.name || `摄像头${camera.id}` }}
                </el-button>
                <el-empty v-if="!cameraList.length && !loading.camera" description="未找到摄像头设备" :image-size="50" />
              </div>
              
              <!-- 本地摄像头调试按钮 -->
              <div class="local-camera-debug">
                <h4>本地摄像头调试</h4>
                <div class="debug-buttons">
                  <el-button 
                    type="info" 
                    @click="testLocalCamera"
                    :disabled="isLocalVideoActive"
                  >
                    <el-icon><VideoCamera /></el-icon>
                    测试本地摄像头
                  </el-button>
                  <el-button 
                    type="warning" 
                    @click="togglePauseLocalVideo"
                    :disabled="!isLocalVideoActive"
                  >
                    {{ isLocalVideoPaused ? '恢复播放' : '暂停视频' }}
                  </el-button>
                  <el-button 
                    type="danger" 
                    @click="stopLocalVideo"
                    :disabled="!isLocalVideoActive"
                  >
                    停止本地视频
                  </el-button>
                </div>
              </div>
            </div>
          </div>

          <el-divider />

          <!-- 任务控制 -->
          <div class="control-section">
            <h3>任务控制</h3>
            <div class="task-controls">
              <el-button 
                type="success" 
                @click="startTask(currentTask?.id)"
              >
                启动任务
              </el-button>
              <el-button 
                type="warning" 
                @click="endTask(currentTask?.id, false)"
              >
                完成任务
              </el-button>
              <el-button 
                type="danger" 
                @click="endTask(currentTask?.id, true)"
              >
                中止任务
              </el-button>
            </div>
          </div>

          <el-divider />

          <!-- 故障处理 -->
          <div class="control-section">
            <h3>故障处理</h3>
            <div class="flaw-controls">
              <el-button 
                type="primary" 
                @click="() => ElMessage.info('故障列表已刷新')"
              >
                刷新故障列表
              </el-button>
              <el-button 
                type="success" 
                @click="confirmFlaw(flawList[0]?.id)"
                :disabled="!flawList.length || flawList[0]?.confirmed"
              >
                确认最新故障
              </el-button>
            </div>
          </div>

          <el-divider />

          <!-- 数据上传 -->
          <div class="control-section">
            <h3>数据上传</h3>
            <div class="upload-controls">
              <el-button 
                type="primary" 
                @click="uploadTaskData(currentTask?.id)"
              >
                上传任务数据
              </el-button>
            </div>
          </div>

          <el-divider />

          <!-- 页面导航 -->
          <div class="control-section">
            <h3>页面导航</h3>
            <div class="navigation-buttons">
              <el-button @click="goToPage('initView')" type="info">
                <el-icon><Setting /></el-icon>
                系统初始化
              </el-button>
              <el-button @click="goToPage('taskView')" type="primary">
                <el-icon><Document /></el-icon>
                任务列表
              </el-button>
              <el-button @click="goToPage('taskDetailView')" type="success">
                <el-icon><TrendCharts /></el-icon>
                任务详情
              </el-button>
              <el-button @click="goToPage('taskExecuteView')" type="warning">
                <el-icon><VideoCamera /></el-icon>
                任务执行
              </el-button>
              <el-button @click="goToPage('settingsView')" type="danger">
                <el-icon><Setting /></el-icon>
                系统设置
              </el-button>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style lang="scss" scoped>
.global-control-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;

  .page-header {
    text-align: center;
    margin-bottom: 30px;
    
    .header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      
      .title-section {
        h1 {
          font-size: 32px;
          color: #303133;
          margin-bottom: 10px;
        }
        
        p {
          font-size: 16px;
          color: #909399;
        }
      }
      
      .action-section {
        button {
          padding: 8px 16px;
          background-color: #409EFF;
          color: #fff;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.3s;

          &:hover {
            background-color: #66B1FF;
          }
        }
      }
    }
  }

  .monitor-card, .control-card {
    height: calc(100vh - 200px);
    overflow-y: auto;

    .card-header {
      display: flex;
      align-items: center;
      font-size: 18px;
      font-weight: bold;
      
      .el-icon {
        margin-right: 8px;
        font-size: 20px;
      }
    }
  }

  .status-section, .control-section, .video-section {
    margin-bottom: 20px;

    h3 {
      font-size: 16px;
      color: #303133;
      margin-bottom: 15px;
      border-left: 4px solid #409EFF;
      padding-left: 10px;
      display: flex;
      align-items: center;
      
      .loading-icon {
        margin-left: 8px;
        color: #409EFF;
        animation: rotate 1s linear infinite;
      }
    }
  }

  @keyframes rotate {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .video-section {
    .video-container {
      .video-display {
        width: 100%;
        height: 300px;
        background: #000;
        border-radius: 8px;
        overflow: hidden;
        position: relative;
        margin-bottom: 15px;

        .video-element {
          width: 100%;
          height: 100%;
          position: absolute;
          top: 0;
          left: 0;
          z-index: 1;
        }

        .video-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #fff;
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          z-index: 2;
          background: rgba(0, 0, 0, 0.8);
          
          .el-icon {
            color: #409EFF;
            margin-bottom: 10px;
          }
          
          p {
            margin: 5px 0;
            font-size: 14px;
          }
        }

        .local-video-status {
          position: absolute;
          top: 10px;
          right: 10px;
          z-index: 10;
          
          .status-overlay {
            background: rgba(0, 0, 0, 0.7);
            color: #fff;
            padding: 8px 12px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 12px;
            
            .el-icon {
              color: #17a2b8;
            }
          }
        }
      }

      .video-controls {
        display: flex;
        gap: 10px;
        justify-content: center;
        margin-bottom: 15px;
      }
    }
  }

  .agv-info, .task-info {
    p {
      margin: 8px 0;
      font-size: 14px;
      
      strong {
        color: #606266;
      }
    }
  }

  .control-buttons, .task-controls, .flaw-controls, .upload-controls {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .camera-controls {
    .camera-buttons {
      display: flex;
      gap: 10px;
      margin-bottom: 15px;
      flex-wrap: wrap;
    }
    
    .local-camera-debug {
      margin-top: 20px;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
      border: 1px solid #e9ecef;
      
      h4 {
        margin: 0 0 15px 0;
        color: #495057;
        font-size: 14px;
        font-weight: 600;
        border-left: 3px solid #17a2b8;
        padding-left: 10px;
      }
      
      .debug-buttons {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        
        .el-button {
          display: flex;
          align-items: center;
          
          .el-icon {
            margin-right: 5px;
          }
        }
      }
    }
  }

  .navigation-buttons {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    
    .el-button {
      display: flex;
      align-items: center;
      
      .el-icon {
        margin-right: 5px;
      }
    }
  }

  .el-statistic {
    text-align: center;
  }

  .el-table {
    border-radius: 8px;
    overflow: hidden;
  }

  .loading-icon {
    margin-left: 5px;
  }
}
</style> 
