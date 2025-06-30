import request from '../../car/utils/request'

// 获取缺陷列表
export function listFlaw(params) {
  return request({
    url: '/agv/flaw/list',
    method: 'get',
    params
  })
}

// 获取缺陷详情
export function getFlaw(id) {
  return request({
    url: `/agv/flaw/${id}`,
    method: 'get'
  })
}

// 新增缺陷
export function addFlaw(data) {
  return request({
    url: '/agv/flaw',
    method: 'post',
    data
  })
}

// 更新缺陷
export function updateFlaw(data) {
  return request({
    url: '/agv/flaw',
    method: 'put',
    data
  })
}

// 删除缺陷
export function delFlaw(id) {
  return request({
    url: `/agv/flaw/${id}`,
    method: 'delete'
  })
}

// 轮询获取任务实时缺陷信息
export function liveInfo(id) {
  return request({
    url: `/agv/flaw/live/${id}`,
    method: 'get'
  })
}

// 检查任务缺陷是否已全部确认
export function checkAllConfirmed(id) {
  return request({
    url: `/agv/flaw/check/${id}`,
    method: 'get'
  })
} 