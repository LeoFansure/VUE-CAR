import request from '@/utils/request'

// 获取任务列表
export function listTask(params = {}) {
  // 默认按id倒序
  const defaultParams = {
    orderByColumn: 'id',
    isAsc: 'desc',
    ...params
  };
  return request({
    url: '/agv/task/list',
    method: 'get',
    params: defaultParams
  })
}

// 获取任务详情
export function getTask(id) {
  return request({
    url: `/agv/task/${id}`,
    method: 'get'
  })
}

// 获取任务详情（别名，兼容 getTaskInfo 调用）
export const getTaskInfo = getTask;

// 新建任务
export function addTask(data) {
  return request({
    url: '/agv/task',
    method: 'post',
    data
  })
}

// 更新任务
export function updateTask(data) {
  return request({
    url: '/agv/task',
    method: 'put',
    data
  })
}

// 删除任务
export function delTask(id) {
  return request({
    url: `/agv/task/${id}`,
    method: 'delete'
  })
}

// 启动任务
export function startTask(id) {
  return request({
    url: `/agv/task/start/${id}`,
    method: 'post'
  })
}

// 结束任务
export function endTask(id, isAbort = true) {
  return request({
    url: `/agv/task/end/${id}?isAbort=${isAbort}`,
    method: 'post'
  })
}

// 查询待上传的数据
export function preUploadTask(id) {
  return request({
    url: `/agv/task/preupload/${id}`,
    method: 'get'
  })
}

// 上传任务数据
export function uploadTask(id) {
  return request({
    url: `/agv/task/upload/${id}`,
    method: 'post'
  })
}

