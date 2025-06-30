<template>
  <div class="cloud-task-container">
    <!-- 头部 -->
    <div class="header">
      <div class="header-left">
        <h1>任务数据管理</h1>
        <p class="subtitle">管理已上传的任务数据</p>
      </div>
      <div class="header-right">
        <el-button @click="backToCloud" type="info" size="large">
          <el-icon><Back /></el-icon>
          返回
        </el-button>
        <el-button @click="showAddDialog" type="primary" size="large">
          <el-icon><Plus /></el-icon>
          新增任务
        </el-button>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <el-card class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="任务编号">
          <el-input v-model="searchForm.taskCode" placeholder="请输入任务编号" clearable />
        </el-form-item>
        <el-form-item label="任务名称">
          <el-input v-model="searchForm.taskName" placeholder="请输入任务名称" clearable />
        </el-form-item>
        <el-form-item label="任务状态">
          <el-select v-model="searchForm.taskStatus" placeholder="请选择状态" clearable>
            <el-option label="待巡视" value="待巡视" />
            <el-option label="巡视中" value="巡视中" />
            <el-option label="待上传" value="待上传" />
            <el-option label="已完成" value="已完成" />
          </el-select>
        </el-form-item>
        <el-form-item label="创建人">
          <el-input v-model="searchForm.creator" placeholder="请输入创建人" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="resetSearch">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 任务列表 -->
    <el-card>
      <el-table :data="taskList" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="taskCode" label="任务编号" width="120" />
        <el-table-column prop="taskName" label="任务名称" width="150" />
        <el-table-column prop="startPos" label="起始地点" width="120" />
        <el-table-column prop="taskTrip" label="任务距离" width="100" />
        <el-table-column prop="creator" label="创建人" width="100" />
        <el-table-column prop="executor" label="执行人" width="100" />
        <el-table-column prop="taskStatus" label="任务状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.taskStatus)">
              {{ scope.row.taskStatus }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="round" label="巡视轮次" width="100" />
        <el-table-column prop="uploaded" label="上传状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.uploaded ? 'success' : 'warning'">
              {{ scope.row.uploaded ? '已上传' : '未上传' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="scope">
            <el-button @click="viewTaskDetail(scope.row)" type="primary" size="small">
              查看详情
            </el-button>
            <el-button @click="editTask(scope.row)" type="warning" size="small">
              编辑
            </el-button>
            <el-button @click="viewFlaws(scope.row)" type="info" size="small">
              查看缺陷
            </el-button>
            <el-button @click="handleDeleteTask(scope.row)" type="danger" size="small">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑任务对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="isEdit ? '编辑任务' : '新增任务'"
      width="60%"
      :before-close="handleCloseDialog"
    >
      <el-form 
        ref="taskFormRef" 
        :model="taskForm" 
        :rules="taskRules" 
        label-width="120px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="任务编号" prop="taskCode">
              <el-input v-model="taskForm.taskCode" placeholder="请输入任务编号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="任务名称" prop="taskName">
              <el-input v-model="taskForm.taskName" placeholder="请输入任务名称" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="起始地点" prop="startPos">
              <el-input v-model="taskForm.startPos" placeholder="请输入起始地点" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="任务距离" prop="taskTrip">
              <el-input v-model="taskForm.taskTrip" placeholder="请输入任务距离" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="创建人" prop="creator">
              <el-input v-model="taskForm.creator" placeholder="请输入创建人" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="执行人" prop="executor">
              <el-input v-model="taskForm.executor" placeholder="请输入执行人" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="任务状态" prop="taskStatus">
              <el-select v-model="taskForm.taskStatus" placeholder="请选择任务状态" style="width: 100%">
                <el-option label="待巡视" value="待巡视" />
                <el-option label="巡视中" value="巡视中" />
                <el-option label="待上传" value="待上传" />
                <el-option label="已完成" value="已完成" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="巡视轮次" prop="round">
              <el-input-number v-model="taskForm.round" :min="1" placeholder="巡视轮次" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="备注" prop="remark">
              <el-input v-model="taskForm.remark" type="textarea" placeholder="请输入备注" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitTask" :loading="submitting">
            {{ isEdit ? '更新' : '创建' }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 缺陷列表对话框 -->
    <el-dialog 
      v-model="flawDialogVisible" 
      title="任务缺陷列表"
      width="80%"
    >
      <el-table :data="flawList" style="width: 100%" v-loading="flawLoading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="flawType" label="缺陷类型" width="120" />
        <el-table-column prop="flawName" label="缺陷名称" width="150" />
        <el-table-column prop="flawDesc" label="缺陷描述" />
        <el-table-column prop="flawDistance" label="距离" width="100" />
        <el-table-column prop="level" label="等级" width="100">
          <template #default="scope">
            <el-tag :type="getLevelType(scope.row.level)">
              {{ scope.row.level }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="confirmed" label="确认状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.confirmed ? 'success' : 'warning'">
              {{ scope.row.confirmed ? '已确认' : '未确认' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="scope">
            <el-button @click="handleConfirmFlaw(scope.row)" type="success" size="small" v-if="!scope.row.confirmed">
              确认
            </el-button>
            <el-button @click="editFlaw(scope.row)" type="warning" size="small">
              编辑
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 任务详情对话框 -->
    <el-dialog 
      v-model="taskDetailDialogVisible" 
      title="任务详情"
      width="80%"
    >
      <el-descriptions :column="1">
        <el-descriptions-item label="任务编号">{{ currentTask.taskCode }}</el-descriptions-item>
        <el-descriptions-item label="任务名称">{{ currentTask.taskName }}</el-descriptions-item>
        <el-descriptions-item label="起始地点">{{ currentTask.startPos }}</el-descriptions-item>
        <el-descriptions-item label="任务距离">{{ currentTask.taskTrip }}</el-descriptions-item>
        <el-descriptions-item label="创建人">{{ currentTask.creator }}</el-descriptions-item>
        <el-descriptions-item label="执行人">{{ currentTask.executor }}</el-descriptions-item>
        <el-descriptions-item label="任务状态">
          <el-tag :type="getStatusType(currentTask.taskStatus)">{{ currentTask.taskStatus }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="巡视轮次">{{ currentTask.round }}</el-descriptions-item>
        <el-descriptions-item label="上传状态">
          <el-tag :type="currentTask.uploaded ? 'success' : 'warning'">
            {{ currentTask.uploaded ? '已上传' : '未上传' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDate(currentTask.createTime) }}</el-descriptions-item>
        <el-descriptions-item label="执行时间">{{ formatDate(currentTask.execTime) }}</el-descriptions-item>
        <el-descriptions-item label="完成时间">{{ formatDate(currentTask.endTime) }}</el-descriptions-item>
        <el-descriptions-item label="备注">{{ currentTask.remark }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Back, Plus, Search, Refresh } from '@element-plus/icons-vue'
import { getTasks, createTask, updateTask, deleteTask, getFlawsByTaskId, confirmFlaw } from '../../cloud/api/cloud'

const router = useRouter()
const route = useRoute()

// 响应式数据
const loading = ref(false)
const flawLoading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const flawDialogVisible = ref(false)
const isEdit = ref(false)
const taskList = ref([])
const flawList = ref([])
const taskFormRef = ref()
const taskDetailDialogVisible = ref(false)
const currentTask = ref({})

// 搜索表单
const searchForm = reactive({
  taskCode: '',
  taskName: '',
  taskStatus: '',
  creator: ''
})

// 分页
const pagination = reactive({
  current: 1,
  size: 20,
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
  taskStatus: '待巡视',
  round: 1,
  uploaded: false,
  remark: ''
})

// 表单验证规则
const taskRules = {
  taskCode: [
    { required: true, message: '请输入任务编号', trigger: 'blur' }
  ],
  taskName: [
    { required: true, message: '请输入任务名称', trigger: 'blur' }
  ],
  creator: [
    { required: true, message: '请输入创建人', trigger: 'blur' }
  ],
  taskStatus: [
    { required: true, message: '请选择任务状态', trigger: 'change' }
  ]
}

// 加载任务列表
const loadTasks = async () => {
  loading.value = true
  try {
    const params = {
      ...searchForm,
      page: pagination.current,
      size: pagination.size
    }
    const response = await getTasks(params)
    // 适配后端返回的数据格式
    const taskData = response.data || []
    taskList.value = taskData
    pagination.total = response.total || 0
  } catch (error) {
    console.error('加载任务列表失败:', error)
    ElMessage.error('加载任务列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.current = 1
  loadTasks()
}

// 重置搜索
const resetSearch = () => {
  Object.assign(searchForm, {
    taskCode: '',
    taskName: '',
    taskStatus: '',
    creator: ''
  })
  pagination.current = 1
  loadTasks()
}

// 分页处理
const handleSizeChange = (size) => {
  pagination.size = size
  pagination.current = 1
  loadTasks()
}

const handleCurrentChange = (current) => {
  pagination.current = current
  loadTasks()
}

// 显示新增对话框
const showAddDialog = () => {
  isEdit.value = false
  resetTaskForm()
  dialogVisible.value = true
}

// 编辑任务
const editTask = (task) => {
  isEdit.value = true
  Object.assign(taskForm, task)
  dialogVisible.value = true
}

// 删除任务
const handleDeleteTask = async (task) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除任务 "${task.taskName}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    await deleteTask(task.id)
    ElMessage.success('删除成功')
    loadTasks()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除任务失败:', error)
      ElMessage.error('删除任务失败')
    }
  }
}

// 提交任务
const submitTask = async () => {
  try {
    await taskFormRef.value.validate()
    submitting.value = true
    
    if (isEdit.value) {
      await updateTask(taskForm.id, taskForm)
      ElMessage.success('更新成功')
    } else {
      await createTask(taskForm)
      ElMessage.success('创建成功')
    }
    
    dialogVisible.value = false
    loadTasks()
  } catch (error) {
    console.error('提交任务失败:', error)
    ElMessage.error('提交任务失败')
  } finally {
    submitting.value = false
  }
}

// 查看任务详情
const viewTaskDetail = (task) => {
  currentTask.value = task
  taskDetailDialogVisible.value = true
}

// 查看缺陷
const viewFlaws = async (task) => {
  flawDialogVisible.value = true
  flawLoading.value = true
  try {
    const response = await getFlawsByTaskId(task.id)
    flawList.value = response.data || []
  } catch (error) {
    console.error('加载缺陷列表失败:', error)
    ElMessage.error('加载缺陷列表失败')
  } finally {
    flawLoading.value = false
  }
}

// 确认缺陷
const handleConfirmFlaw = async (flaw) => {
  try {
    await confirmFlaw(flaw.id)
    ElMessage.success('缺陷确认成功')
    // 找到当前操作的任务并重新加载其缺陷列表
    const task = taskList.value.find(t => t.id === flaw.taskId)
    if (task) {
      viewFlaws(task)
    }
  } catch (error) {
    console.error('确认缺陷失败:', error)
    ElMessage.error('确认缺陷失败')
  }
}

// 编辑缺陷
const editFlaw = (flaw) => {
  router.push({
    path: '/cloudFlaw',
    query: { flawId: flaw.id }
  })
}

// 重置任务表单
const resetTaskForm = () => {
  Object.assign(taskForm, {
    id: null,
    taskCode: '',
    taskName: '',
    startPos: '',
    taskTrip: '',
    creator: '',
    executor: '',
    taskStatus: '待巡视',
    round: 1,
    uploaded: false,
    remark: ''
  })
  taskFormRef.value?.clearValidate()
}

// 关闭对话框
const handleCloseDialog = () => {
  dialogVisible.value = false
  resetTaskForm()
}

// 获取状态类型
const getStatusType = (status) => {
  const statusMap = {
    '待巡视': 'info',
    '巡视中': 'warning',
    '待上传': 'primary',
    '已完成': 'success'
  }
  return statusMap[status] || 'info'
}

// 获取等级类型
const getLevelType = (level) => {
  const levelMap = {
    '低': 'info',
    '中': 'warning',
    '高': 'danger'
  }
  return levelMap[level] || 'info'
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('zh-CN')
}

// 导航方法
const backToCloud = () => {
  router.push('/cloudSystem')
}

// 生命周期
onMounted(() => {
  loadTasks()
  
  // 如果有任务ID参数，直接查看该任务的缺陷
  const taskId = route.query.taskId
  if (taskId) {
    viewFlaws({ id: taskId })
  }
})
</script>

<style scoped>
.cloud-task-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.header-left h1 {
  margin: 0;
  color: #303133;
  font-size: 24px;
  font-weight: 600;
}

.subtitle {
  margin: 5px 0 0 0;
  color: #909399;
  font-size: 14px;
}

.header-right {
  display: flex;
  gap: 10px;
}

.search-card {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style> 