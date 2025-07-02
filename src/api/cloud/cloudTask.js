import request from '@/utils/cloudRequest'

// 获取云端任务详情
export function getCloudTask(id) {
  return request({
    url: `/api/cloud/task`,
    method: 'get',
    params: { id }
  })
}

// 获取云端任务下所有缺陷
export function getCloudFlawsByTaskId(taskId) {
  return request({
    url: `/api/cloud/flaw/task/${taskId}`,
    method: 'get'
  })
}

// 获取云端任务列表
export function getCloudTaskList(params) {
  return request({
    url: '/api/cloud/task',
    method: 'get',
    params
  })
}

// 更新云端缺陷信息
export function updateCloudFlaw(data) {
  return request({
    url: `/api/cloud/flaw/${data.id}`,
    method: 'put',
    data
  })
}

// 获取云端任务详情（根据ID）
export function getCloudTaskById(id) {
  return request({
    url: `/api/cloud/task/${id}`,
    method: 'get'
  })
} 