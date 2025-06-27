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
  flvUrl: {
    type: String,
    required: true
  },
  cameraName: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['error', 'playing'])

const videoStore = useVideoStore()
const { isPlaying, error, setPlaying, setError } = videoStore

const playerContainer = ref(null)
let player = null

const initPlayer = () => {
  if (!playerContainer.value) return
  try {
    // 使用EasyPlayer播放flv流
    if (window.EasyPlayer) {
      player = new window.EasyPlayer({
        container: playerContainer.value,
        url: props.flvUrl,
        live: true,
        autoplay: true,
        video: {
          controls: true,
          poster: '',
        },
        // 可扩展更多参数
      })
      setPlaying(true)
      setError('')
    } else {
      setError('EasyPlayer未加载')
      setPlaying(false)
    }
  } catch (err) {
    setError('视频流连接失败，请检查网络或摄像头状态')
    setPlaying(false)
    emit('error', err)
    ElMessage.error('视频流连接失败')
  }
}

const reconnect = () => {
  setError('')
  destroyPlayer()
  initPlayer()
}

const destroyPlayer = () => {
  if (player && player.destroy) {
    player.destroy()
    player = null
  } else if (playerContainer.value) {
    playerContainer.value.innerHTML = ''
  }
}

watch(() => props.flvUrl, () => {
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