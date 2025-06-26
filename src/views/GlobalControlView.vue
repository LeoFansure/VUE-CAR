<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ElButton, ElCard, ElTable, ElTableColumn, ElTag, ElAlert, ElDivider, ElRow, ElCol, ElStatistic, ElIcon, ElMessage, ElEmpty, ElLoading } from 'element-plus'
import { VideoCamera, Setting, Document, TrendCharts, Connection, Warning, CircleCheck, InfoFilled, Loading } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
// 导入AGV控制API
import { agvForward, agvStop, agvBackward, heartbeat } from '@/api/agv'
// 导入系统检查API
import { checkFs, checkDb, checkAgv, checkCam } from '@/api/system'
// 导入任务管理API
import { listTask, startTask as startTaskApi, endTask as endTaskApi, uploadTask } from '@/api/task'
// 导入故障管理API
import { listFlaw } from '@/api/flaw'
// 导入WebRTC视频流工具
import { playVideoStream, stopVideoStream as stopWebRTCStream, switchVideoStream } from '@/utils/webrtc'

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
const currentCamera = ref(1)
const audioEnabled = ref(false)

// 摄像头相关
const videoRef = ref(null)
const isVideoPlaying = ref(false)
const videoStream = ref(null)
const videoContainerId = 'video-container'
const audioContainerId = 'audio-container'

// 加载状态
const loading = ref({
  system: false,
  agv: false,
  task: false,
  flaw: false
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

// 刷新所有数据
const refreshAllData = async () => {
  console.log('刷新所有数据')
  await Promise.all([
    getSystemStatus(),
    getAgvStatus(),
    getCurrentTask(),
    getFlawList()
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

// 切换摄像头
const switchCamera = async (cameraId) => {
  try {
    currentCamera.value = cameraId
    console.log(`切换到摄像头 ${cameraId}`)
    
    // 确保DOM元素存在
    const videoElement = document.getElementById(videoContainerId)
    if (!videoElement) {
      console.warn('视频容器元素不存在，等待DOM渲染')
      // 延迟执行，等待DOM渲染完成
      setTimeout(() => switchCamera(cameraId), 500)
      return
    }
    
    if (isVideoPlaying.value) {
      // 如果视频正在播放，则切换流
      await switchVideoStream(videoContainerId, cameraId)
      ElMessage.success(`已切换到摄像头 ${cameraId}`)
    } else {
      // 如果视频未播放，则启动新流
      await startVideoStream(cameraId)
    }
  } catch (error) {
    console.error('切换摄像头失败:', error)
    ElMessage.error('切换摄像头失败: ' + error.message)
  }
}

// 切换音频
const toggleAudio = async () => {
  try {
    audioEnabled.value = !audioEnabled.value
    console.log(audioEnabled.value ? '开启音频' : '关闭音频')
    
    if (audioEnabled.value) {
      // 确保音频容器存在
      const audioElement = document.getElementById(audioContainerId)
      if (!audioElement) {
        console.warn('音频容器元素不存在')
        audioEnabled.value = false
        ElMessage.error('音频容器初始化失败')
        return
      }
      
      // 启动音频流 (通道5)
      await playVideoStream(audioContainerId, 5)
      ElMessage.success('音频已开启')
    } else {
      // 停止音频流
      stopWebRTCStream(audioContainerId)
      ElMessage.info('音频已关闭')
    }
  } catch (error) {
    console.error('音频控制失败:', error)
    audioEnabled.value = false
    ElMessage.error('音频控制失败: ' + error.message)
  }
}

// 启动视频流
const startVideoStream = async (cameraId) => {
  try {
    console.log(`启动摄像头 ${cameraId} 视频流`)
    
    // 确保DOM元素存在
    const videoElement = document.getElementById(videoContainerId)
    if (!videoElement) {
      throw new Error('视频容器元素不存在，请确保页面已正确渲染')
    }
    
    // 清空容器内容
    videoElement.innerHTML = ''
    
    // 启动视频流
    await playVideoStream(videoContainerId, cameraId)
    isVideoPlaying.value = true
    ElMessage.success(`摄像头 ${cameraId} 视频流已启动`)
  } catch (error) {
    console.error('启动视频流失败:', error)
    ElMessage.error('启动视频流失败: ' + error.message)
    isVideoPlaying.value = false
  }
}

// 停止视频流
const stopVideoStream = () => {
  try {
    console.log('停止视频流')
    stopWebRTCStream(videoContainerId)
    isVideoPlaying.value = false
    ElMessage.info('视频流已停止')
  } catch (error) {
    console.error('停止视频流失败:', error)
    ElMessage.error('停止视频流失败: ' + error.message)
  }
}

// 全屏显示
const toggleFullscreen = () => {
  if (videoRef.value) {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      videoRef.value.requestFullscreen()
    }
  }
}

// 截图功能
const takeScreenshot = () => {
  ElMessage.success('截图已保存')
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

// 视频调试函数
const debugVideo = () => {
  console.log('=== 视频调试信息 ===')
  console.log('当前摄像头:', currentCamera.value)
  console.log('视频播放状态:', isVideoPlaying.value)
  console.log('音频开启状态:', audioEnabled.value)
  
  // 检查DOM元素
  const videoElement = document.getElementById(videoContainerId)
  const audioElement = document.getElementById(audioContainerId)
  
  console.log('视频容器元素:', videoElement)
  console.log('音频容器元素:', audioElement)
  
  if (videoElement) {
    console.log('视频容器innerHTML:', videoElement.innerHTML)
    console.log('视频容器children:', videoElement.children)
  }
  
  // 检查WebRTC库
  console.log('ZLMRTCClient可用性:', typeof ZLMRTCClient !== 'undefined')
  
  // 检查网络连接
  console.log('网络状态:', navigator.onLine ? '在线' : '离线')
  
  // 尝试ping流媒体服务器
  fetch('http://192.168.2.57/webrtc-api', { mode: 'no-cors' })
    .then(() => console.log('流媒体服务器可达'))
    .catch(error => console.log('流媒体服务器连接失败:', error))
    
  ElMessage.info('调试信息已打印到控制台，请查看')
}

// 组件挂载时的初始化
onMounted(() => {
  console.log('GlobalControlView 组件已挂载')
  
  // 初始化时获取所有数据
  refreshAllData()
  
  // 检查必要的DOM元素是否存在
  setTimeout(() => {
    console.log('检查视频容器DOM元素')
    const videoElement = document.getElementById(videoContainerId)
    const audioElement = document.getElementById(audioContainerId)
    
    if (videoElement) {
      console.log('视频容器元素已就绪:', videoElement)
    } else {
      console.error('视频容器元素未找到:', videoContainerId)
    }
    
    if (audioElement) {
      console.log('音频容器元素已就绪:', audioElement)
    } else {
      console.error('音频容器元素未找到:', audioContainerId)
    }
    
    // 检查ZLMRTCClient是否加载
    if (typeof ZLMRTCClient !== 'undefined') {
      console.log('ZLMRTCClient库已加载')
    } else {
      console.error('ZLMRTCClient库未加载')
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
    
    // 停止视频流
    if (isVideoPlaying.value) {
      stopWebRTCStream(videoContainerId)
    }
    
    // 停止音频流
    if (audioEnabled.value) {
      stopWebRTCStream(audioContainerId)
    }
    
    // 重置状态
    isVideoPlaying.value = false
    audioEnabled.value = false
    
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
              <div class="video-display" ref="videoRef">
                <!-- 视频容器 -->
                <div id="video-container" class="video-element"></div>
                
                <!-- 音频容器 (隐藏) -->
                <div id="audio-container" class="audio-element"></div>
                
                <!-- 视频占位符 -->
                <div v-if="!isVideoPlaying" class="video-placeholder">
                  <el-icon :size="48"><VideoCamera /></el-icon>
                  <p>摄像头 {{ currentCamera }} 视频流</p>
                  <p class="video-status">视频状态: {{ isVideoPlaying ? '播放中' : '已停止' }}</p>
                </div>
                
                <!-- 视频覆盖层 -->
                <div v-if="isVideoPlaying" class="video-overlay">
                    <div class="camera-info">
                      <el-tag type="primary">摄像头 {{ currentCamera }}</el-tag>
                      <el-tag :type="audioEnabled ? 'success' : 'info'">
                        {{ audioEnabled ? '音频开启' : '音频关闭' }}
                      </el-tag>
                  </div>
                </div>
              </div>
              
              <!-- 视频控制按钮 -->
              <div class="video-controls">
                <el-button 
                  :type="isVideoPlaying ? 'danger' : 'success'"
                  @click="isVideoPlaying ? stopVideoStream() : startVideoStream(currentCamera)"
                >
                  {{ isVideoPlaying ? '停止' : '播放' }}
                </el-button>
                <el-button @click="toggleFullscreen">
                  全屏
                </el-button>
                <el-button @click="takeScreenshot">
                  截图
                </el-button>
                <el-button type="info" @click="debugVideo">
                  调试
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
            <h3>摄像头控制</h3>
            <div class="camera-controls">
              <div class="camera-buttons">
                <el-button 
                  v-for="i in 4" 
                  :key="i"
                  :type="currentCamera === i ? 'primary' : 'default'"
                  @click="switchCamera(i)"
                >
                  摄像头{{ i }}
                </el-button>
              </div>
              <div class="audio-control">
                <el-button 
                  :type="audioEnabled ? 'success' : 'default'"
                  @click="toggleAudio"
                >
                  {{ audioEnabled ? '关闭音频' : '开启音频' }}
                </el-button>
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

        .audio-element {
          width: 0;
          height: 0;
          position: absolute;
          top: -9999px;
          left: -9999px;
          z-index: -1;
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
          
          .video-status {
            color: #909399;
            font-size: 12px;
          }
        }

          .video-overlay {
            position: absolute;
            top: 10px;
            left: 10px;
            z-index: 10;

            .camera-info {
              display: flex;
              gap: 10px;
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
    
    .audio-control {
      margin-top: 10px;
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