import cloudRequest from '@/utils/cloudRequest'

// 系统配置相关API
export const getSysConfigs = () => {
  return cloudRequest({
    url: '/api/cloud/sysconfig',
    method: 'get'
  })
}

export const getSysConfigById = (id) => {
  return cloudRequest({
    url: `/api/cloud/sysconfig/${id}`,
    method: 'get'
  })
}

export const createSysConfig = (data) => {
  return cloudRequest({
    url: '/api/cloud/sysconfig',
    method: 'post',
    data
  })
}

export const updateSysConfig = (id, data) => {
  return cloudRequest({
    url: `/api/cloud/sysconfig/${id}`,
    method: 'put',
    data
  })
}

export const deleteSysConfig = (id) => {
  return cloudRequest({
    url: `/api/cloud/sysconfig/${id}`,
    method: 'delete'
  })
}

// 任务相关API
export const getTasks = (params) => {
  return cloudRequest({
    url: '/api/cloud/task',
    method: 'get',
    params
  })
}

export const getTaskById = (id) => {
  return cloudRequest({
    url: `/api/cloud/task/${id}`,
    method: 'get'
  })
}

export const createTask = (data) => {
  return cloudRequest({
    url: '/api/cloud/task',
    method: 'post',
    data
  })
}

export const updateTask = (id, data) => {
  return cloudRequest({
    url: `/api/cloud/task/${id}`,
    method: 'put',
    data
  })
}

export const deleteTask = (id) => {
  return cloudRequest({
    url: `/api/cloud/task/${id}`,
    method: 'delete'
  })
}

export const uploadTask = (id) => {
  return cloudRequest({
    url: `/api/cloud/task/${id}/upload`,
    method: 'post'
  })
}

// 缺陷相关API
export const getFlaws = (params) => {
  return cloudRequest({
    url: '/api/cloud/flaw',
    method: 'get',
    params
  })
}

export const getFlawById = (id) => {
  return cloudRequest({
    url: `/api/cloud/flaw/${id}`,
    method: 'get'
  })
}

export const getFlawsByTaskId = (taskId) => {
  return cloudRequest({
    url: `/api/cloud/flaw/task/${taskId}`,
    method: 'get'
  })
}

export const createFlaw = (data) => {
  return cloudRequest({
    url: '/api/cloud/flaw',
    method: 'post',
    data
  })
}

export const updateFlaw = (id, data) => {
  return cloudRequest({
    url: `/api/cloud/flaw/${id}`,
    method: 'put',
    data
  })
}

export const deleteFlaw = (id) => {
  return cloudRequest({
    url: `/api/cloud/flaw/${id}`,
    method: 'delete'
  })
}

export const confirmFlaw = (id) => {
  return cloudRequest({
    url: `/api/cloud/flaw/${id}/confirm`,
    method: 'post'
  })
}

// 从车载系统导入任务数据
export const importTaskFromCar = (taskId) => {
  return cloudRequest({
    url: `/api/cloud/import/task/${taskId}`,
    method: 'post'
  })
} 