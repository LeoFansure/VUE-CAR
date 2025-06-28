import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'

// 创建axios实例 - 云端系统使用本地后端
const cloudService = axios.create({
  baseURL: 'http://localhost:8080',
  timeout: 30000
})

// 请求拦截器
cloudService.interceptors.request.use(
  config => {
    return config
  },
  error => {
    console.log(error)
    return Promise.reject(error)
  }
)

// 响应拦截器
cloudService.interceptors.response.use(
  response => {
    const res = response.data
    
    // 如果code不是200，则判断为错误
    if (res.code !== 200) {
      ElMessage({
        message: res.msg || 'Error',
        type: 'error',
        duration: 5 * 1000
      })
      return Promise.reject(new Error(res.msg || 'Error'))
    } else {
      return res
    }
  },
  error => {
    console.log('err' + error)
    ElMessage({
      message: error.message,
      type: 'error',
      duration: 5 * 1000
    })
    return Promise.reject(error)
  }
)

export default cloudService 