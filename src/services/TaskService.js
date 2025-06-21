import { 
  listTask, 
  getTask, 
  addTask, 
  updateTask, 
  delTask, 
  startTask, 
  endTask, 
  uploadTask,
  preUploadTask,
  getAGVStatus,
  getFlawList
} from '@/api/task'

/**
 * 任务服务类
 * 封装任务相关的业务逻辑
 */
class TaskService {
  constructor() {
    // 模拟数据存储
    this.mockTasks = [
      {
        id: 1,
        taskCode: 'TASK20241201001',
        taskName: '地铁1号线隧道巡检任务',
        startPos: '起点站A',
        taskTrip: '500',
        creator: '张三',
        executor: '李四',
        execTime: '2024-12-01 09:00:00',
        endTime: null,
        createTime: '2024-12-01 08:30:00',
        taskStatus: '待巡视',
        round: 1,
        uploaded: false,
        remark: '首次巡检任务'
      },
      {
        id: 2,
        taskCode: 'TASK20241201002',
        taskName: '地铁2号线隧道巡检任务',
        startPos: '起点站B',
        taskTrip: '800',
        creator: '王五',
        executor: '赵六',
        execTime: '2024-12-01 10:00:00',
        endTime: '2024-12-01 11:30:00',
        createTime: '2024-12-01 09:30:00',
        taskStatus: '已完成',
        round: 1,
        uploaded: true,
        remark: '已完成巡检'
      }
    ]
    this.nextId = 3
  }

  /**
   * 获取任务列表
   * @param {Object} params - 查询参数
   * @returns {Promise} 任务列表数据
   */
  async getTaskList(params = {}) {
    try {
      const response = await listTask(params)
      
      // 根据1.md规范，分页数据格式为 { total, rows, code, msg }
      // 普通数据格式为 { code, msg, data }
      let taskList = []
      let total = 0
      
      if (response.data && response.data.rows) {
        // 分页格式
        taskList = response.data.rows || []
        total = response.data.total || 0
      } else if (response.data && Array.isArray(response.data)) {
        // 直接数组格式
        taskList = response.data
        total = response.data.length
      } else if (response.data && response.data.list) {
        // 兼容其他格式
        taskList = response.data.list || []
        total = response.data.total || 0
      }
      
      return {
        success: true,
        data: {
          list: taskList,
          total: total
        },
        message: response.msg || '获取任务列表成功'
      }
    } catch (error) {
      console.error('获取任务列表失败，使用模拟数据:', error)
      
      // 使用模拟数据
      let filteredTasks = [...this.mockTasks]
      
      // 应用搜索过滤
      if (params.taskCode) {
        filteredTasks = filteredTasks.filter(task => 
          task.taskCode.includes(params.taskCode)
        )
      }
      if (params.creator) {
        filteredTasks = filteredTasks.filter(task => 
          task.creator.includes(params.creator)
        )
      }
      if (params.executor) {
        filteredTasks = filteredTasks.filter(task => 
          task.executor.includes(params.executor)
        )
      }
      if (params.taskStatus) {
        filteredTasks = filteredTasks.filter(task => 
          task.taskStatus === params.taskStatus
        )
      }
      
      // 应用分页
      const pageNum = params.pageNum || 1
      const pageSize = params.pageSize || 10
      const start = (pageNum - 1) * pageSize
      const end = start + pageSize
      const pagedTasks = filteredTasks.slice(start, end)
      
      return {
        success: true,
        data: {
          list: pagedTasks,
          total: filteredTasks.length
        },
        message: '获取任务列表成功（模拟数据）'
      }
    }
  }

  /**
   * 获取任务详情
   * @param {string|number} id - 任务ID
   * @returns {Promise} 任务详情数据
   */
  async getTaskDetail(id) {
    try {
      const response = await getTask(id)
      return {
        success: true,
        data: response.data,
        message: response.msg || '获取任务详情成功'
      }
    } catch (error) {
      console.error('获取任务详情失败，使用模拟数据:', error)
      
      // 使用模拟数据
      const task = this.mockTasks.find(t => t.id == id)
      if (task) {
        return {
          success: true,
          data: task,
          message: '获取任务详情成功（模拟数据）'
        }
      } else {
        return {
          success: false,
          data: null,
          message: '任务不存在'
        }
      }
    }
  }

  /**
   * 新增任务
   * @param {Object} taskData - 任务数据
   * @returns {Promise} 新增结果
   */
  async createTask(taskData) {
    try {
      const response = await addTask(taskData)
      return {
        success: true,
        data: response.data,
        message: response.msg || '任务创建成功'
      }
    } catch (error) {
      console.error('创建任务失败，使用模拟数据:', error)
      
      // 使用模拟数据
      const newTask = {
        ...taskData,
        id: this.nextId++,
        createTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
        taskStatus: taskData.taskStatus || '待巡视',
        round: taskData.round || 1,
        uploaded: false
      }
      
      this.mockTasks.push(newTask)
      
      return {
        success: true,
        data: newTask,
        message: '任务创建成功（模拟数据）'
      }
    }
  }

  /**
   * 更新任务
   * @param {Object} taskData - 任务数据
   * @returns {Promise} 更新结果
   */
  async updateTask(taskData) {
    try {
      const response = await updateTask(taskData)
      return {
        success: true,
        data: response.data,
        message: response.msg || '任务更新成功'
      }
    } catch (error) {
      console.error('更新任务失败，使用模拟数据:', error)
      
      // 使用模拟数据
      const index = this.mockTasks.findIndex(t => t.id == taskData.id)
      if (index !== -1) {
        this.mockTasks[index] = { ...this.mockTasks[index], ...taskData }
        return {
          success: true,
          data: this.mockTasks[index],
          message: '任务更新成功（模拟数据）'
        }
      } else {
        return {
          success: false,
          data: null,
          message: '任务不存在'
        }
      }
    }
  }

  /**
   * 删除任务
   * @param {string|number} id - 任务ID
   * @returns {Promise} 删除结果
   */
  async deleteTask(id) {
    try {
      const response = await delTask(id)
      return {
        success: true,
        data: response.data,
        message: response.msg || '任务删除成功'
      }
    } catch (error) {
      console.error('删除任务失败，使用模拟数据:', error)
      
      // 使用模拟数据
      const index = this.mockTasks.findIndex(t => t.id == id)
      if (index !== -1) {
        this.mockTasks.splice(index, 1)
        return {
          success: true,
          data: null,
          message: '任务删除成功（模拟数据）'
        }
      } else {
        return {
          success: false,
          data: null,
          message: '任务不存在'
        }
      }
    }
  }

  /**
   * 启动任务
   * @param {string|number} id - 任务ID
   * @returns {Promise} 启动结果
   */
  async startTask(id) {
    try {
      const response = await startTask(id)
      return {
        success: true,
        data: response.data,
        message: response.msg || '任务启动成功'
      }
    } catch (error) {
      console.error('启动任务失败，使用模拟数据:', error)
      
      // 使用模拟数据
      const task = this.mockTasks.find(t => t.id == id)
      if (task) {
        task.taskStatus = '巡视中'
        task.execTime = new Date().toISOString().replace('T', ' ').substring(0, 19)
        return {
          success: true,
          data: task,
          message: '任务启动成功（模拟数据）'
        }
      } else {
        return {
          success: false,
          data: null,
          message: '任务不存在'
        }
      }
    }
  }

  /**
   * 结束任务
   * @param {string|number} id - 任务ID
   * @param {boolean} isAbort - 是否中止
   * @returns {Promise} 结束结果
   */
  async endTask(id, isAbort = false) {
    try {
      const response = await endTask(id, isAbort)
      return {
        success: true,
        data: response.data,
        message: response.msg || (isAbort ? '任务已中止' : '任务已完成')
      }
    } catch (error) {
      console.error('结束任务失败，使用模拟数据:', error)
      
      // 使用模拟数据
      const task = this.mockTasks.find(t => t.id == id)
      if (task) {
        task.taskStatus = isAbort ? '待巡视' : '待上传'
        task.endTime = new Date().toISOString().replace('T', ' ').substring(0, 19)
        return {
          success: true,
          data: task,
          message: (isAbort ? '任务已中止' : '任务已完成') + '（模拟数据）'
        }
      } else {
        return {
          success: false,
          data: null,
          message: '任务不存在'
        }
      }
    }
  }

  /**
   * 上传任务数据
   * @param {string|number} id - 任务ID
   * @returns {Promise} 上传结果
   */
  async uploadTaskData(id) {
    try {
      const response = await uploadTask(id)
      return {
        success: true,
        data: response.data,
        message: response.msg || '任务数据上传成功'
      }
    } catch (error) {
      console.error('上传任务数据失败，使用模拟数据:', error)
      
      // 使用模拟数据
      const task = this.mockTasks.find(t => t.id == id)
      if (task) {
        task.taskStatus = '已完成'
        task.uploaded = true
        return {
          success: true,
          data: task,
          message: '任务数据上传成功（模拟数据）'
        }
      } else {
        return {
          success: false,
          data: null,
          message: '任务不存在'
        }
      }
    }
  }

  /**
   * 查询待上传数据
   * @param {string|number} id - 任务ID
   * @returns {Promise} 查询结果
   */
  async getPreUploadData(id) {
    try {
      const response = await preUploadTask(id)
      return {
        success: true,
        data: response.data,
        message: response.msg || '查询待上传数据成功'
      }
    } catch (error) {
      console.error('查询待上传数据失败:', error)
      return {
        success: false,
        data: null,
        message: error.message || '查询待上传数据失败'
      }
    }
  }

  /**
   * 获取AGV状态
   * @param {string|number} taskId - 任务ID
   * @returns {Promise} AGV状态数据
   */
  async getAGVStatus(taskId) {
    try {
      const response = await getAGVStatus(taskId)
      return {
        success: true,
        data: response.data,
        message: response.msg || '获取AGV状态成功'
      }
    } catch (error) {
      console.error('获取AGV状态失败:', error)
      return {
        success: false,
        data: null,
        message: error.message || '获取AGV状态失败'
      }
    }
  }

  /**
   * 获取故障列表
   * @param {string|number} taskId - 任务ID
   * @returns {Promise} 故障列表数据
   */
  async getFlawList(taskId) {
    try {
      const response = await getFlawList(taskId)
      return {
        success: true,
        data: response.data,
        message: response.msg || '获取故障列表成功'
      }
    } catch (error) {
      console.error('获取故障列表失败:', error)
      return {
        success: false,
        data: null,
        message: error.message || '获取故障列表失败'
      }
    }
  }
}

// 创建单例实例
const taskService = new TaskService()

export default taskService 