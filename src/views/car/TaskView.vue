<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  ArrowRight, 
  Setting, 
  VideoCamera, 
  Loading,
  ChatDotRound
} from '@element-plus/icons-vue'
import { formatDateTime } from '@/utils/common'
import { listTask, getTask, addTask, updateTask, delTask, startTask, uploadTask, preUploadTask } from '@/api/car/task'
import { importTaskFromCar } from '@/api/cloud/cloud'
import LLM from '@/components/car/LLM.vue'

const router = useRouter()

// 响应式数据
const showLlmDialog = ref(false)
const taskList = ref([])
const tableLoading = ref(false)
const showTaskDialog = ref(false)
const isEdit = ref(false)
const taskFormRef = ref(null)
const formLoading = ref(false)
const startLoading = ref(false)
const showStartAlert = ref(false)
const showStartBtn = ref(false)
const currentTaskId = ref(null)
const showUploadDialog = ref(false)
const uploadLoading = ref(false)
const uploadStatus = ref([])

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

// 任务表单
const taskForm = reactive({
  id: null,
  taskCode: '',
  taskName: '',
  startPos: '',
  taskTrip: '',
  creator: '',
  executor: '',
  remark: ''
})

// 表单验证规则
const taskRules = {
  taskName: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
  taskCode: [{ required: true, message: '请输入任务编号', trigger: 'blur' }],
  startPos: [{ required: true, message: '请输入起始地点', trigger: 'blur' }],
  taskTrip: [{ required: true, message: '请输入任务距离', trigger: 'blur' }],
  creator: [{ required: true, message: '请输入创建人', trigger: 'blur' }],
  executor: [{ required: true, message: '请输入执行人', trigger: 'blur' }]
}

// 是否可以上传
const canUpload = computed(() => {
  return uploadStatus.value.length > 0
})

// 获取任务状态对应的类型
const getStatusType = (status) => {
  switch (status) {
    case '待巡视':
      return 'warning'
    case '巡视中':
      return 'primary'
    case '待上传':
      return 'info'
    case '已完成':
      return 'success'
    default:
      return 'info'
  }
}

// 获取上传百分比
const getUploadPercentage = (status) => {
  if (status === '准备中') return 20
  if (status === '上传中') return 60
  if (status === '已完成') return 100
  return 0
}

// 获取上传状态
const getUploadStatus = (status) => {
  if (status === '已完成') return 'success'
  if (status === '失败') return 'exception'
  return ''
}

// 加载任务列表
const loadTaskList = async () => {
  try {
    tableLoading.value = true
    const params = {
      ...searchForm,
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize
    }
    const res = await listTask(params)
    if (res.code === 200) {
      taskList.value = res.rows || []
      pagination.total = res.total || 0
    } else {
      ElMessage.error(res.msg || '获取任务列表失败')
    }
  } catch (error) {
    console.error('加载任务列表失败', error)
    ElMessage.error('加载任务列表失败')
  } finally {
    tableLoading.value = false
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

// 处理页码变化
const handleCurrentChange = (val) => {
  pagination.pageNum = val
  loadTaskList()
}

// 处理每页条数变化
const handleSizeChange = (val) => {
  pagination.pageSize = val
  pagination.pageNum = 1
  loadTaskList()
}

// 前往设置页面
const goToSettings = () => {
  router.push('/settingsView')
}

// 处理任务编号点击
const handleTaskCodeClick = (row) => {
  switch (row.taskStatus) {
    case '待巡视':
      // 打开编辑对话框，并显示启动按钮
      handleEditTask(row, true)
      break
    case '巡视中':
      // 跳转到任务执行页面
      goToTaskExecute(row)
      break
    case '待上传':
    case '已完成':
      // 跳转到任务详情页面
      goToTaskDetail(row)
      break
    default:
      goToTaskDetail(row)
  }
}

// 前往任务详情页面
const goToTaskDetail = (row) => {
  router.push({
    path: '/taskDetailView',
    query: { id: row.id }
  })
}

// 前往任务执行页面
const goToTaskExecute = (row) => {
  router.push({
    path: '/taskExecuteView',
    query: { id: row.id }
  })
}

// 生成任务编号
const generateTaskCode = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  
  return `TASK-${year}${month}${day}${hours}${minutes}${seconds}`
}

// 处理新增任务
const handleAddTask = () => {
  resetTaskForm()
  isEdit.value = false
  showTaskDialog.value = true
  showStartAlert.value = false
  showStartBtn.value = false
  // 自动生成任务编号
  taskForm.taskCode = generateTaskCode()
}

// 处理编辑任务
const handleEditTask = (row, showStartButton = false) => {
  resetTaskForm()
  isEdit.value = true
  showTaskDialog.value = true
  showStartAlert.value = showStartButton
  showStartBtn.value = showStartButton
  
  // 填充表单数据
  Object.keys(taskForm).forEach(key => {
    if (key in row) {
      taskForm[key] = row[key]
    }
  })
  taskForm.id = row.id
  currentTaskId.value = row.id
}

// 处理删除任务
const handleDeleteTask = (row) => {
  ElMessageBox.confirm(
    `确认删除任务 "${row.taskName}" 吗？`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const res = await delTask(row.id)
      if (res.code === 200) {
        ElMessage.success('删除成功')
        loadTaskList()
      } else {
        ElMessage.error(res.msg || '删除失败')
      }
    } catch (error) {
      console.error('删除任务失败', error)
      ElMessage.error('删除任务失败')
    }
  }).catch(() => {})
}

// 处理启动任务
const handleStartTask = (row) => {
  ElMessageBox.confirm(
    '启动任务后巡线车将开始工作，请确保车辆周围环境安全。是否继续？',
    '启动确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      startLoading.value = true
      const res = await startTask(row.id)
      if (res.code === 200) {
        ElMessage.success('任务启动成功')
              // 跳转到执行页面
      router.push({
        path: '/taskExecuteView',
        query: { id: row.id }
      })
      } else {
        ElMessage.error(res.msg || '任务启动失败')
      }
    } catch (error) {
      console.error('启动任务失败', error)
      console.log("2165489658456856")
      ElMessage.error('启动任务失败')
    } finally {
      startLoading.value = false
    }
  }).catch(() => {})
}

// 处理上传任务
const handleUploadTask = async (row) => {
  showUploadDialog.value = true
  uploadStatus.value = []
  uploadLoading.value = true
  
  try {
    // 获取待上传的数据
    const res = await preUploadTask(row.id)
    if (res.code === 200 && res.data) {
      uploadStatus.value = res.data
      currentTaskId.value = row.id
    } else {
      ElMessage.error(res.msg || '获取上传数据失败')
    }
  } catch (error) {
    console.error('获取上传数据失败', error)
    ElMessage.error('获取上传数据失败')
  } finally {
    uploadLoading.value = false
  }
}

// 确认上传到云端（假设的，未来可扩展）
const confirmCloudUpload = async () => {
  ElMessage.info('云端上传功能待实现');
}

// 本地上传（新增的）
const handleLocalUpload = async () => {
  if (!currentTaskId.value) {
    ElMessage.error('任务ID不存在');
    return;
  }

  try {
    uploadLoading.value = true;
    console.log(currentTaskId.value)
    const res = await importTaskFromCar(currentTaskId.value); 
    if (res.code === 200) {
      ElMessage.success('任务数据已成功上传至本地数据库');
      showUploadDialog.value = false;
      loadTaskList(); // 刷新列表
    } else {
      ElMessage.error(res.msg || '本地上传失败');
    }
  } catch (error) {
    console.error('本地上传失败', error);
    ElMessage.error('本地上传失败');
  } finally {
    uploadLoading.value = false;
  }
}

// 提交任务表单
const submitTaskForm = async () => {
  if (!taskFormRef.value) return
  await taskFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        formLoading.value = true
        const submitData = { ...taskForm }
        // 根据是否编辑调用不同的接口
        const res = isEdit.value
          ? await updateTask(submitData)
          : await addTask(submitData)
        if (res.code === 200) {
          ElMessage.success(isEdit.value ? '修改成功' : '新增成功')
          // 新增或编辑成功后关闭对话框
          showTaskDialog.value = false
          if (!isEdit.value) {
            // 新增任务成功，保存任务ID以便启动
            currentTaskId.value = res.data
          }
          loadTaskList() // 刷新列表
        } else {
          ElMessage.error(res.msg || (isEdit.value ? '修改失败' : '新增失败'))
        }
      } catch (error) {
        console.error(isEdit.value ? '修改任务失败' : '新增任务失败', error)
        ElMessage.error(isEdit.value ? '修改任务失败' : '新增任务失败')
      } finally {
        formLoading.value = false
      }
    }
  })
}

// 重置任务表单
const resetTaskForm = () => {
  if (taskFormRef.value) {
    taskFormRef.value.resetFields()
  }
  
  Object.keys(taskForm).forEach(key => {
    taskForm[key] = key === 'id' ? null : ''
  })
  
  currentTaskId.value = null
}

// 关闭对话框
const handleCloseDialog = () => {
  if (formLoading.value) return
  showTaskDialog.value = false
  resetTaskForm()
}

// 页面加载时获取数据
onMounted(() => {
  loadTaskList()
})

const goCloudSystem = () => {
  router.push({ name: 'cloudSystem' })
}

const goInitView = () => {
  router.push({ name: 'initView' })
}
</script>

<template>
  <div class="task-view-container">
    <div class="task-view-header">
      <el-button type="primary" @click="goCloudSystem">进入云端系统</el-button>
      <el-button type="info" @click="goInitView">返回系统初始化页面</el-button>
    </div>
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="breadcrumb">
        <span>地铁隧道巡线车智能巡检系统</span>
        <el-icon class="breadcrumb-separator"><ArrowRight /></el-icon>
        <span>任务列表</span>
      </div>
      <div class="header-buttons">
        <div class="ai-chat-wrapper">
          <el-button 
            class="ai-chat-btn"
            type="primary"
            circle
            @click="showLlmDialog = true"
          >
            <el-icon size="20"><ChatDotRound /></el-icon>
          </el-button>
          <div class="ai-tooltip">AI 智能助手</div>
        </div>
        <el-button 
          class="settings-btn" 
          @click="goToSettings"
        >
          <el-icon><Setting /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- 搜索表单 -->
    <div class="search-form">
      <el-form :model="searchForm" :inline="true">
        <el-form-item label="任务编号">
          <el-input v-model="searchForm.taskCode" placeholder="请输入任务编号" clearable></el-input>
        </el-form-item>
        <el-form-item label="创建人">
          <el-input v-model="searchForm.creator" placeholder="请输入创建人" clearable></el-input>
        </el-form-item>
        <el-form-item label="执行人">
          <el-input v-model="searchForm.executor" placeholder="请输入执行人" clearable></el-input>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.taskStatus" placeholder="请选择" clearable style="width: 120px">
            <el-option label="待巡视" value="待巡视"></el-option>
            <el-option label="巡视中" value="巡视中"></el-option>
            <el-option label="待上传" value="待上传"></el-option>
            <el-option label="已完成" value="已完成"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchTasks">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <el-button type="primary" @click="handleAddTask">
        <el-icon><VideoCamera /></el-icon> 新增任务
      </el-button>
    </div>

    <!-- 任务列表表格 -->
    <div class="table-container">
      <el-table 
        :data="taskList" 
        style="width: 100%"
        v-loading="tableLoading"
        
      >
        <el-table-column type="index" label="序号" width="55" align="center"></el-table-column>
        <el-table-column prop="taskCode" label="任务编号" min-width="150">
          <template #default="{ row }">
            <el-link type="primary" @click="handleTaskCodeClick(row)">{{ row.taskCode }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="taskName" label="任务名称" width="150"></el-table-column>
        <el-table-column prop="startPos" label="起始地点" width="130"></el-table-column>
        <el-table-column label="任务距离" width="130">
          <template #default="{ row }">
            {{ row.taskTrip }} 米
          </template>
        </el-table-column>
        <el-table-column prop="creator" label="创建人" width="100"></el-table-column>
        <el-table-column prop="executor" label="执行人" width="100"></el-table-column>
        <el-table-column label="执行时间" width="180">
          <template #default="{ row }">
            {{ row.execTime ? formatDateTime(row.execTime) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="完成时间" width="180">
          <template #default="{ row }">
            {{ row.endTime ? formatDateTime(row.endTime) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.taskStatus)">{{ row.taskStatus }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <div class="operation-btns">
              <!-- 待巡视状态 -->
              <template v-if="row.taskStatus === '待巡视'">
                <el-button type="primary" size="small" @click="handleStartTask(row)">启动</el-button>
                <el-button type="primary" size="small" plain @click="handleEditTask(row)">修改</el-button>
                <el-button type="danger" size="small" plain @click="handleDeleteTask(row)">删除</el-button>
              </template>
              
              <!-- 巡视中状态 -->
              <template v-else-if="row.taskStatus === '巡视中'">
                <el-button type="primary" size="small" @click="goToTaskExecute(row)">继续巡视</el-button>
              </template>
              
              <!-- 待上传状态 -->
              <template v-else-if="row.taskStatus === '待上传'">
                <el-button type="success" size="small" @click="handleUploadTask(row)">上传</el-button>
                <el-button type="info" size="small" plain @click="goToTaskDetail(row)">查看</el-button>
              </template>
              
              <!-- 已完成状态 -->
              <template v-else>
                <el-button type="info" size="small" plain @click="goToTaskDetail(row)">查看</el-button>
              </template>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="pagination.pageNum"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 任务表单对话框 -->
    <el-dialog
      v-model="showTaskDialog"
      :title="isEdit ? '修改任务' : '新增任务'"
      width="600px"
      :before-close="handleCloseDialog"
    >
      <el-form 
        ref="taskFormRef"
        :model="taskForm"
        :rules="taskRules"
        label-width="100px"
        :disabled="formLoading"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="任务名称" prop="taskName">
              <el-input v-model="taskForm.taskName" placeholder="请输入任务名称" maxlength="100"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="任务编号" prop="taskCode">
              <el-input v-model="taskForm.taskCode" placeholder="系统自动生成" maxlength="50" :readonly="!isEdit"></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="起始地点" prop="startPos">
              <el-input v-model="taskForm.startPos" placeholder="请输入起始地点" maxlength="100">
                <template #append>米</template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="任务距离" prop="taskTrip">
              <el-input v-model="taskForm.taskTrip" placeholder="请输入任务距离">
                <template #append>米</template>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="创建人" prop="creator">
              <el-input v-model="taskForm.creator" placeholder="请输入创建人" maxlength="50"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="执行人" prop="executor">
              <el-input v-model="taskForm.executor" placeholder="请输入执行人" maxlength="50"></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="备注" prop="remark">
          <el-input 
            v-model="taskForm.remark" 
            type="textarea" 
            placeholder="请输入备注" 
            maxlength="500"
            :rows="3"
          ></el-input>
        </el-form-item>

        <div v-if="showStartAlert" class="start-alert">
          <el-alert
            title="点击下方[启动]按钮后巡线车将开始工作，请确保车辆周围环境安全。"
            type="warning"
            show-ic2
            :closable="false"
          />
        </div>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleCloseDialog" :disabled="formLoading">取消</el-button>
          <el-button type="primary" @click="submitTaskForm" :loading="formLoading">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 上传任务对话框 -->
    <el-dialog
      v-model="showUploadDialog"
      title="上传任务数据"
      width="500px"
    >
      <div v-loading="uploadLoading" class="upload-content">
        <div v-if="uploadStatus.length > 0" class="upload-list">
          <div v-for="(item, index) in uploadStatus" :key="index" class="upload-item">
            <div class="upload-item-info">
              <span>{{ item.type }}: {{ item.info }}</span>
              <span class="upload-status" :class="item.status">{{ item.status }}</span>
            </div>
            <el-progress :percentage="getUploadPercentage(item.status)" :status="getUploadStatus(item.status)"></el-progress>
          </div>
        </div>
        <div v-else class="upload-empty">
          <el-icon><Loading /></el-icon>
          <span>正在获取上传数据...</span>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showUploadDialog = false" :disabled="uploadLoading">关闭</el-button>
          <el-button type="primary" @click="handleLocalUpload" :loading="uploadLoading" :disabled="!canUpload">
            本地上传
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- AI 助手对话框 -->
    <LLM v-model="showLlmDialog" />
  </div>
</template>

<style lang="scss" scoped>
.task-view-container {
  padding: 24px;
  background: #f5f5f5;
  min-height: 100vh;
  
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    
    .breadcrumb {
      display: flex;
      align-items: center;
      font-size: 16px;
      color: #606266;
      
      .breadcrumb-separator {
        margin: 0 8px;
        color: #c0c4cc;
      }
    }
    
    .header-buttons {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .ai-chat-wrapper {
      position: relative;
      display: inline-block;
      
      .ai-chat-btn {
        transition: all 0.3s ease;
        
        &:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
        }
      }
      
      .ai-tooltip {
        position: absolute;
        bottom: -45px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 8px 12px;
        border-radius: 8px;
        font-size: 12px;
        white-space: nowrap;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        transform: translateX(-50%) translateY(10px);
        z-index: 1000;
        
        &::before {
          content: '';
          position: absolute;
          top: -6px;
          left: 50%;
          transform: translateX(-50%);
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-bottom: 6px solid #667eea;
        }
      }
      
      &:hover .ai-tooltip {
        opacity: 1;
        visibility: visible;
        transform: translateX(-50%) translateY(0);
      }
    }

    .settings-btn {
      border-radius: 50%;
      padding: 10px;
      height: 40px;
      width: 40px;
    }
  }
  
  .search-form {
    background: #ffffff;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 20px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  }
  
  .toolbar {
    margin-bottom: 20px;
  }
  
  .table-container {
    background: #ffffff;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    margin-bottom: 20px;
    
    .operation-btns {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
  }
  
  .pagination-container {
    display: flex;
    justify-content: center;
    margin-top: 20px;
  }
  
  .start-alert {
    margin: 20px 0;
  }
  
  .upload-content {
    min-height: 200px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    
    .upload-list {
      .upload-item {
        margin-bottom: 20px;
        
        .upload-item-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          
          .upload-status {
            font-weight: bold;
            
            &.准备中 {
              color: #909399;
            }
            
            &.上传中 {
              color: #409eff;
            }
            
            &.已完成 {
              color: #67c23a;
            }
            
            &.失败 {
              color: #f56c6c;
            }
          }
        }
      }
    }
    
    .upload-empty {
      text-align: center;
      color: #909399;
      
      .el-icon {
        font-size: 24px;
        margin-bottom: 10px;
        animation: rotate 2s linear infinite;
      }
      
      @keyframes rotate {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
    }
  }
}

.task-view-header {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
}
</style>