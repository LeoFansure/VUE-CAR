<template>
  <div class="video-player-container">
    <div ref="playerContainer" class="player-container"></div>
    <div v-if="!isPlaying" class="loading-overlay">
      <el-icon class="loading-icon"><Loading /></el-icon>
      <span>正在加载视频流...</span>
    </div>
    <div v-if="error" class="error-overlay">
      <el-icon class="error-icon"><Warning /></el-icon>
      <span>{{ error }}</span>
      <el-button type="primary" size="small" @click="reconnect">
        重新连接
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { Loading, Warning } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useVideoStore } from '@/stores/video'

const props = defineProps({
  url: {
    type: String,
    required: true
  },
  cameraId: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['error', 'playing'])

// 使用 pinia store
const videoStore = useVideoStore()
const { isPlaying, error, setPlaying, setError, volume } = videoStore

const playerContainer = ref(null)
let player = null

// 初始化播放器
const initPlayer = () => {
  if (!playerContainer.value) return
  try {
    player = new ZLMRTCClient({
      element: playerContainer.value,
      debug: false,
      zlmediakitUrl: props.url,
      video: {
        codec: 'h264',
        width: 1920,
        height: 1080
      },
      audio: {
        codec: 'aac',
        sampleRate: 44100,
        channels: 2
      }
    })
    player.on('error', handleError)
    player.on('playing', handlePlaying)
    player.on('ended', handleEnded)
    player.play()
  } catch (err) {
    handleError(err)
  }
}

const reconnect = () => {
  setError('')
  destroyPlayer()
  initPlayer()
}

const destroyPlayer = () => {
  if (player) {
    player.off('error', handleError)
    player.off('playing', handlePlaying)
    player.off('ended', handleEnded)
    player.destroy()
    player = null
  }
}

const handleError = (err) => {
  setError('视频流连接失败，请检查网络或摄像头状态')
  setPlaying(false)
  emit('error', err)
  ElMessage.error('视频流连接失败')
}

const handlePlaying = () => {
  setPlaying(true)
  setError('')
  emit('playing')
}

const handleEnded = () => {
  setPlaying(false)
  setError('视频流已断开')
  emit('error', new Error('视频流已断开'))
}

watch(() => props.url, () => {
  reconnect()
})

watch(() => props.cameraId, () => {
  reconnect()
})

onMounted(() => {
  initPlayer()
})

onUnmounted(() => {
  destroyPlayer()
})
</script>

<style lang="scss" scoped>
.video-player-container {
  width: 100%;
  height: 100%;
  position: relative;
  background: #000;
  
  .player-container {
    width: 100%;
    height: 100%;
  }
  
  .loading-overlay,
  .error-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    
    .loading-icon,
    .error-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    
    span {
      margin-bottom: 16px;
    }
  }
  
  .loading-icon {
    animation: rotate 1s linear infinite;
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
</style> 