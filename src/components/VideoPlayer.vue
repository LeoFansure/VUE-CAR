<template>
  <div class="video-player-container">
    <div ref="playerContainer" class="player-container"></div>
    <div v-if="isLoading" class="loading-overlay">
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
// components/VideoPlayer.vue -> <script setup>

import { ref, onMounted, onUnmounted, watch } from 'vue'
import { Loading, Warning } from '@element-plus/icons-vue'
import { useVideoStore } from '../stores/video'

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

const videoStore = useVideoStore()
const { setPlaying, setError } = videoStore

const playerContainer = ref(null)
const error = ref('')
const isLoading = ref(true)
let player = null

const handleError = (err) => {
  const errorMsg = '视频流连接失败或已断开'
  setError(errorMsg)
  error.value = errorMsg
  setPlaying(false)
  isLoading.value = false
  console.error("EasyPlayerPro Error:", err)
}

const handlePlay = () => {
  setError('')
  error.value = ''
  setPlaying(true)
  isLoading.value = false
}

// 初始化播放器，现在只在 onMounted 时调用一次
const initPlayer = () => {
  if (!playerContainer.value || !window.EasyPlayerPro) {
    handleError(new Error('EasyPlayerPro 库未加载或容器不存在!'))
    return
  }

  player = new window.EasyPlayerPro(playerContainer.value, {
    isLive: true,
    isMute: videoStore.volume === 0,
    stretch: true,
    debug: false,
    loadTimeOut: 10,
    loadTimeReplay: 3,
  })

  player.on('error', handleError)
  player.on('play', handlePlay)
}

// 销毁播放器
const destroyPlayer = () => {
  if (player) {
    player.destroy()
    player = null
  }
}

const reconnect = () => {
    if(player && props.flvUrl){
        isLoading.value = true;
        error.value = '';
        player.play(props.flvUrl);
    }
}

// 修改: watch 的逻辑大大简化
watch(() => props.flvUrl, (newUrl) => {
  if (player && newUrl) {
    isLoading.value = true
    error.value = ''
    // 直接调用 play 方法切换视频流，而不是销毁重建
    player.play(newUrl)
  }
})

// 新增: 监听音量变化
watch(() => videoStore.volume, (newVolume) => {
    if (player && typeof player.setVolume === 'function') {
        player.setVolume(newVolume / 100);
    }
});

onMounted(() => {
  // 在挂载时只创建一次播放器实例
  initPlayer()
  // 如果初始就有url，则播放
  if (props.flvUrl) {
    player.play(props.flvUrl)
  } else {
    isLoading.value = false
  }
})

onUnmounted(() => {
  destroyPlayer()
})
</script>

<style lang="scss" scoped>
/* 样式保持不变 */
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
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>