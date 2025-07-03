<template>
  <div class="video-player-container">
    <div ref="playerContainer" class="player-container"></div>
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
// src/components/VideoPlayer.vue -> <script setup> (最终优化版)

import { ref, onMounted, onUnmounted, watch } from 'vue'
import { Loading, Warning } from '@element-plus/icons-vue'
import { useVideoStore } from '@/stores/video'
import { useScriptTag } from '@vueuse/core' // 1. 导入 useScriptTag

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

// 2. 配置 useScriptTag
const { load, unload } = useScriptTag(
  '/easyplayer/EasyPlayer-pro.js', // 脚本的URL (从 public 目录)
  () => {
    // 这个函数会在脚本加载并执行成功后被调用
    console.log('EasyPlayer-pro.js script loaded successfully.');
    // 在这里初始化播放器
    initAndPlay();
  },
  { 
    // 配置项
    manual: true, // 设置为手动控制加载时机
    async: false  // 确保脚本同步执行，以便 window.EasyPlayerPro 立即生效
  }
);

const handleError = (err) => { /* ... 逻辑不变 ... */ }
const handlePlay = () => { /* ... 逻辑不变 ... */ }

// 修改: initPlayer 现在只负责创建实例
const initPlayer = () => {
  if (!playerContainer.value || !window.EasyPlayerPro) {
    handleError(new Error('EasyPlayerPro 库未加载或容器不存在!'))
    return false
  }
  
  destroyPlayer();

  player = new window.EasyPlayerPro(playerContainer.value, {
    isLive: true,
    isMute: videoStore.volume === 0,
    stretch: true,
    debug: false,
    loadTimeOut: 10,
    loadTimeReplay: 3,
  });

  player.on('error', handleError)
  player.on('play', handlePlay)
  return true
}

// 新增: 将初始化和播放合并
const initAndPlay = () => {
  if (initPlayer()) {
    if (props.flvUrl) {
      player.play(props.flvUrl)
    } else {
      isLoading.value = false
    }
  }
}

const destroyPlayer = () => {
  if (player) {
    player.destroy()
    player = null
  }
}

const reconnect = () => {
    if (player && props.flvUrl) {
        isLoading.value = true;
        error.value = '';
        player.play(props.flvUrl);
    }
}

// watch flvUrl 的逻辑现在只负责调用 play
watch(() => props.flvUrl, (newUrl) => {
  if (player && newUrl) {
    isLoading.value = true
    error.value = ''
    player.play(newUrl)
  }
})

watch(() => videoStore.volume, (newVolume) => { /* ... 逻辑不变 ... */ });

onMounted(() => {
  isLoading.value = true;
  // 3. 在组件挂载时，手动触发脚本加载
  load();
})

onUnmounted(() => {
  destroyPlayer()
  // 4. 组件卸载时，从DOM中移除<script>标签
  unload();
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