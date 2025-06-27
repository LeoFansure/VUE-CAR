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
  // 摄像头列表
  const cameraList = ref([])
  // 当前摄像头对象
  const currentCamera = ref(null)
  // 当前流地址
  const streamUrl = ref('')

  // 设置播放状态
  const setPlaying = (val) => { isPlaying.value = val }
  // 设置错误
  const setError = (val) => { error.value = val }
  // 设置音量
  const setVolume = (val) => { volume.value = val }
  // 设置摄像头ID
  const setCameraId = (val) => { cameraId.value = val }
  // 设置摄像头列表
  const setCameraList = (list) => { cameraList.value = list }
  // 设置当前摄像头对象
  const setCurrentCamera = (cam) => { currentCamera.value = cam }
  // 设置流地址
  const setStreamUrl = (url) => { streamUrl.value = url }

  return {
    isPlaying,
    error,
    volume,
    cameraId,
    cameraList,
    currentCamera,
    streamUrl,
    setPlaying,
    setError,
    setVolume,
    setCameraId,
    setCameraList,
    setCurrentCamera,
    setStreamUrl
  }
}) 