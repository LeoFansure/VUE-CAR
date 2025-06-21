<template>
  <div class="task-execute-container">
    <!-- 显示屏示意区 -->
    <div class="screen-indicator" style="text-align:center; margin-bottom:8px;">
      <span style="font-weight:bold; font-size:16px;">显示屏示意区</span>
    </div>
    <!-- 左侧视频区域 -->
    <div class="video-section">
      <!-- 视频播放器容器 -->
      <div class="video-player">
        <VideoPlayer
          :url="videoUrl"
          :camera-id="currentCamera"
          @error="handleVideoError"
          @playing="handleVideoPlaying"
        />
        <!-- 音频调节 -->
        <div class="audio-control" style="margin: 12px 0; text-align:center;">
          <span>音量：</span>
          <el-slider v-model="volume" :min="0" :max="100" style="width: 120px; display:inline-block;" @input="setVolume" :disabled="!taskId" />
        </div>
        <!-- 摄像头切换按钮组 -->
        <div class="camera-controls">
          <el-button-group>
            <el-button 
              v-for="i in 4" 
              :key="i"
              :type="currentCamera === i ? 'primary' : ''"
              @click="switchCamera(i)"
              :disabled="!taskId"
            >
              摄像头{{ i }}
            </el-button>
          </el-button-group>
        </div>
        <!-- 视频控制按钮 -->
        <div class="video-controls">
          <el-button-group>
            <el-button :icon="Refresh" @click="refreshVideo" :disabled="!taskId" />
            <el-button :icon="FullScreen" @click="toggleFullScreen" :disabled="!taskId" />
          </el-button-group>
        </div>
      </div>
    </div>

    <!-- 右侧控制面板 -->
    <div class="control-panel">
      <!-- AGV控制按钮组 -->
      <div class="control-section">
        <h3>AGV控制</h3>
        <div class="control-buttons">
          <el-button 
            type="primary" 
            :icon="ArrowUp"
            @click="controlAGV('forward')"
            :disabled="!taskId"
          >
            前进
          </el-button>
          <el-button 
            type="danger" 
            :icon="VideoPause"
            @click="controlAGV('stop')"
            :disabled="!taskId"
          >
            停止
          </el-button>
          <el-button 
            type="primary" 
            :icon="ArrowDown"
            @click="controlAGV('backward')"
            :disabled="!taskId"
          >
            后退
          </el-button>
        </div>
        <!-- 巡检操作按钮 -->
        <div class="inspect-buttons" style="margin-top: 16px; display: flex; gap: 12px;">
          <el-button type="success" @click="endTaskExecution" :disabled="!taskId">完成巡检</el-button>
          <el-button type="danger" @click="endTaskExecution" :disabled="!taskId">终止巡检</el-button>
        </div>
      </div>

      <!-- 状态信息显示 -->
      <div class="status-section">
        <h3>实时状态</h3>
        <div class="status-info">
          <div class="status-item">
            <span class="label">系统时间：</span>
            <span class="value">{{ currentTime }}</span>
          </div>
          <div class="status-item">
            <span class="label">行驶状态：</span>
            <span class="value">{{ agvStatus }}</span>
          </div>
          <div class="status-item">
            <span class="label">当前位置：</span>
            <span class="value">{{ currentPosition }}</span>
          </div>
          <div class="status-item">
            <span class="label">故障数量：</span>
            <span class="value">{{ flawCount }}</span>
          </div>
        </div>
      </div>

      <!-- 任务信息显示 -->
      <div class="task-section">
        <h3>任务信息</h3>
        <div class="task-info">
          <div class="task-item">
            <span class="label">任务编号：</span>
            <span class="value">{{ taskInfo.taskCode }}</span>
          </div>
          <div class="task-item">
            <span class="label">任务名称：</span>
            <span class="value">{{ taskInfo.taskName }}</span>
          </div>
          <div class="task-item">
            <span class="label">起始地点：</span>
            <span class="value">{{ taskInfo.startPos }}</span>
          </div>
          <div class="task-item">
            <span class="label">任务距离：</span>
            <span class="value">{{ taskInfo.taskTrip }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部进度条 -->
    <div class="progress-section">
      <div class="progress-bar">
        <div 
          class="progress-track"
          :style="{ width: `${progress}%` }"
        ></div>
        <div 
          class="vehicle-marker"
          :style="{ left: `${progress}%` }"
        ></div>
        <div 
          v-for="flaw in flaws" 
          :key="flaw.id"
          class="flaw-marker"
          :style="{ left: `${flaw.position}%` }"
          @click="showFlawDetail(flaw)"
        ></div>
      </div>
      <div class="progress-info">
        <span>巡检进度：{{ progress }}%</span>
      </div>
    </div>

    <!-- 故障详情弹窗 -->
    <FlawDetailDialog
      v-model="showFlawDialog"
      :flaw="currentFlaw"
      @saved="handleFlawSaved"
    />

    <!-- 故障历史表格 -->
    <div class="flaw-history-section" style="margin-top: 20px; background: #fff; border-radius: 8px; padding: 16px;">
      <h3 style="margin-bottom: 12px;">故障历史</h3>
      <el-table :data="flaws" style="width: 100%" size="small" v-if="flaws && flaws.length">
        <el-table-column prop="name" label="故障名称" />
        <el-table-column prop="type" label="故障类型" />
        <el-table-column prop="position" label="故障位置" />
      </el-table>
      <div v-else style="color: #999; text-align: center; padding: 16px 0;">暂无故障历史</div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Refresh,
  FullScreen,
  ArrowUp,
  ArrowDown,
  VideoPause
} from '@element-plus/icons-vue'
import { 
  startTask,
  endTask,
  getTaskInfo,
  controlAGV as controlAGVApi,
  getAGVStatus,
  getFlawList
} from '@/api/task'
import VideoPlayer from '@/components/VideoPlayer.vue'
import FlawDetailDialog from '@/components/FlawDetailDialog.vue'

// 路由相关
const route = useRoute()
const router = useRouter()
const taskId = route.query.id

// 视频相关
const videoContainer = ref(null)
const currentCamera = ref(1)
const videoUrl = ref('')

// 状态数据
const currentTime = ref('')
const agvStatus = ref('停止')
const currentPosition = ref('0m')
const flawCount = ref(0)
const progress = ref(0)

// 任务信息
const taskInfo = reactive({
  taskCode: '',
  taskName: '',
  startPos: '',
  taskTrip: ''
})

// 故障列表
const flaws = ref([])

// 定时器
let statusTimer = null
let timeTimer = null

// 故障详情弹窗
const showFlawDialog = ref(false)
const currentFlaw = ref(null)

// 音量控制
const volume = ref(50)
const setVolume = (val) => {
  // 这里可以与 VideoPlayer 组件联动，如有API可调用
  // 例如：videoRef.value && videoRef.value.setVolume(val/100)
}

// 初始化视频播放器
const initVideoPlayer = () => {
  // 根据当前选中的摄像头生成视频流地址
  videoUrl.value = `${import.meta.env.VITE_VIDEO_SERVER}/index/api/webrtc?app=live&stream=${currentCamera.value}&type=play`
}

// 切换摄像头
const switchCamera = (cameraId) => {
  currentCamera.value = cameraId
  initVideoPlayer()
}

// 刷新视频
const refreshVideo = () => {
  initVideoPlayer()
}

// 切换全屏
const toggleFullScreen = () => {
  const container = videoContainer.value
  if (!document.fullscreenElement) {
    container.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}

// 控制AGV
const controlAGV = async (action) => {
  try {
    await controlAGVApi({
      taskId,
      action
    })
    ElMessage.success('控制指令已发送')
  } catch (error) {
    ElMessage.error('控制指令发送失败')
  }
}

// 显示故障详情
const showFlawDetail = (flaw) => {
  currentFlaw.value = flaw
  showFlawDialog.value = true
}

// 处理故障保存
const handleFlawSaved = () => {
  updateFlawList()
}

// 处理视频错误
const handleVideoError = (error) => {
  console.error('视频播放错误:', error)
}

// 处理视频播放
const handleVideoPlaying = () => {
  console.log('视频开始播放')
}

// 更新系统时间
const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleString()
}

// 更新AGV状态
const updateAGVStatus = async () => {
  try {
    const status = await getAGVStatus(taskId)
    agvStatus.value = status.movementStatus
    currentPosition.value = `${status.position}m`
    progress.value = status.progress
  } catch (error) {
    console.error('获取AGV状态失败:', error)
  }
}

// 更新故障列表
const updateFlawList = async () => {
  try {
    const response = await getFlawList(taskId)
    flaws.value = response.data
    flawCount.value = response.data.length
  } catch (error) {
    console.error('获取故障列表失败:', error)
  }
}

// 加载任务信息
const loadTaskInfo = async () => {
  try {
    const response = await getTaskInfo(taskId)
    Object.assign(taskInfo, response.data)
  } catch (error) {
    ElMessage.error('加载任务信息失败')
    router.push('/taskView')
  }
}

// 开始任务
const startTaskExecution = async () => {
  try {
    await startTask(taskId)
    ElMessage.success('任务已开始')
    
    // 启动状态轮询
    statusTimer = setInterval(updateAGVStatus, 3000)
    timeTimer = setInterval(updateTime, 1000)
    
    // 初始化视频播放器
    initVideoPlayer()
  } catch (error) {
    ElMessage.error('启动任务失败')
  }
}

// 结束任务
const endTaskExecution = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要结束当前任务吗？',
      '确认结束',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await endTask(taskId)
    ElMessage.success('任务已结束')
    router.push('/taskView')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('结束任务失败')
    }
  }
}

// 页面加载时初始化
onMounted(async () => {
  if (!taskId) {
    ElMessage.warning('未指定任务ID，部分功能不可用')
    // 不跳转，允许页面展示
    // 可选：初始化视频播放器等通用内容
    initVideoPlayer()
    updateTime()
    return
  }
  await loadTaskInfo()
  await startTaskExecution()
})

// 页面卸载时清理
onUnmounted(() => {
  if (statusTimer) {
    clearInterval(statusTimer)
  }
  if (timeTimer) {
    clearInterval(timeTimer)
  }
})
</script>

<style lang="scss" scoped>
.task-execute-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
  
  .video-section {
    flex: 1;
    padding: 20px;
    display: flex;
    flex-direction: column;
    
    .video-player {
      flex: 1;
      background: #000;
      border-radius: 8px;
      overflow: hidden;
      position: relative;
      
      .video-container {
        width: 100%;
        height: 100%;
      }
      
      .camera-controls {
        position: absolute;
        top: 20px;
        left: 20px;
        z-index: 10;
      }
      
      .video-controls {
        position: absolute;
        top: 20px;
        right: 20px;
        z-index: 10;
      }
    }
  }
  
  .control-panel {
    width: 400px;
    background: white;
    padding: 20px;
    border-left: 1px solid #e4e7ed;
    display: flex;
    flex-direction: column;
    gap: 20px;
    
    .control-section,
    .status-section,
    .task-section {
      h3 {
        margin: 0 0 16px 0;
        padding-bottom: 8px;
        border-bottom: 1px solid #ebeef5;
        color: #303133;
        font-size: 16px;
      }
    }
    
    .control-buttons {
      display: flex;
      flex-direction: column;
      gap: 12px;
      
      .el-button {
        width: 100%;
      }
    }
    
    .status-info,
    .task-info {
      .status-item,
      .task-item {
        display: flex;
        margin-bottom: 12px;
        
        .label {
          width: 100px;
          color: #606266;
        }
        
        .value {
          flex: 1;
          color: #303133;
        }
      }
    }
  }
  
  .progress-section {
    height: 80px;
    background: white;
    padding: 20px;
    border-top: 1px solid #e4e7ed;
    
    .progress-bar {
      height: 20px;
      background: #f5f7fa;
      border-radius: 10px;
      position: relative;
      margin-bottom: 12px;
      
      .progress-track {
        height: 100%;
        background: #409eff;
        border-radius: 10px;
        transition: width 0.3s ease;
      }
      
      .vehicle-marker {
        width: 20px;
        height: 20px;
        background: #67c23a;
        border-radius: 50%;
        position: absolute;
        top: 50%;
        transform: translate(-50%, -50%);
        transition: left 0.3s ease;
      }
      
      .flaw-marker {
        width: 12px;
        height: 12px;
        background: #f56c6c;
        border-radius: 50%;
        position: absolute;
        top: 50%;
        transform: translate(-50%, -50%);
        cursor: pointer;
        
        &:hover {
          transform: translate(-50%, -50%) scale(1.2);
        }
      }
    }
    
    .progress-info {
      text-align: center;
      color: #606266;
    }
  }
}
</style>