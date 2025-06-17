import request from '@/utils/request'

// 检查文件系统可用性
export function checkFs() {
  return request({
    url: '/system/check/fs',
    method: 'get'
  })
}

// 检查数据库连接
export function checkDb() {
  return request({
    url: '/system/check/db',
    method: 'get'
  })
}

// 检查AGV连接
export function checkAgv() {
  return request({
    url: '/system/check/agv',
    method: 'get'
  })
}

// 检查摄像头连接
export function checkCam() {
  return request({
    url: '/system/check/cam',
    method: 'get'
  })
}

// 获取系统配置
export function getConfig() {
  return request({
    url: '/agv/config',
    method: 'get'
  })
}

// 更新系统配置
export function updateConfig(data) {
  return request({
    url: '/agv/config',
    method: 'put',
    data
  })
} 