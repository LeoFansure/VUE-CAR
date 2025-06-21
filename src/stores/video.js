import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useVideoStore = defineStore('video', () => {
  // 播放状态
  const isPlaying = ref(false)
  // 错误信息
  const error = ref('')
  // 音量
  const volume = ref(50)
  // 当前摄像头ID
  const cameraId = ref(1)

  // 设置播放状态
  const setPlaying = (val) => { isPlaying.value = val }
  // 设置错误
  const setError = (val) => { error.value = val }
  // 设置音量
  const setVolume = (val) => { volume.value = val }
  // 设置摄像头ID
  const setCameraId = (val) => { cameraId.value = val }

  return {
    isPlaying,
    error,
    volume,
    cameraId,
    setPlaying,
    setError,
    setVolume,
    setCameraId
  }
}) 