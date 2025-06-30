import request from '../../car/utils/request'

// 查询AGV心跳状态
export function heartbeat() {
  return request({
    url: '/agv/movement/heartbeat',
    method: 'get'
  })
}

// 控制AGV向前移动
export function agvForward() {
  return request({
    url: '/agv/movement/forward',
    method: 'post'
  })
}

// 停止AGV
export function agvStop() {
  return request({
    url: '/agv/movement/stop',
    method: 'post'
  })
}

// 控制AGV向后移动
export function agvBackward() {
  return request({
    url: '/agv/movement/backward',
    method: 'post'
  })
} 