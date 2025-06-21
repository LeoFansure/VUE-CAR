import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { listTask } from '@/api/task'

export const useTaskStore = defineStore('task', () => {
  // 任务列表
  const taskList = ref([])
  
  // 加载状态
  const loading = ref(false)
  
  // 搜索表单
  const searchForm = reactive({
    taskCode: '',
    creator: '',
    executor: '',
    taskStatus: ''
  })
  
  // 分页信息
  const pagination = reactive({
    pageNum: 1,
    pageSize: 10,
    total: 0
  })
  
  // 加载任务列表
  const loadTaskList = async () => {
    loading.value = true
    try {
      const params = {
        ...searchForm,
        pageNum: pagination.pageNum,
        pageSize: pagination.pageSize
      }
      
      const response = await listTask(params)
      taskList.value = response.data.list || []
      pagination.total = response.data.total || 0
    } catch (error) {
      console.error('加载任务列表失败:', error)
      taskList.value = []
      pagination.total = 0
    } finally {
      loading.value = false
    }
  }
  
  // 搜索任务
  const searchTasks = () => {
    pagination.pageNum = 1
    loadTaskList()
  }
  
  // 重置搜索
  const resetSearch = () => {
    Object.keys(searchForm).forEach(key => {
      searchForm[key] = ''
    })
    pagination.pageNum = 1
    loadTaskList()
  }
  
  // 设置页码
  const setCurrentPage = (page) => {
    pagination.pageNum = page
    loadTaskList()
  }
  
  // 设置每页大小
  const setPageSize = (size) => {
    pagination.pageSize = size
    pagination.pageNum = 1
    loadTaskList()
  }
  
  return {
    taskList,
    loading,
    searchForm,
    pagination,
    loadTaskList,
    searchTasks,
    resetSearch,
    setCurrentPage,
    setPageSize
  }
}) 