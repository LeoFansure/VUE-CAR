<template>
  <div class="task-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="breadcrumb">
        <span>地铁隧道巡线车智能巡检系统</span>
        <el-icon class="breadcrumb-separator"><ArrowRight /></el-icon>
        <span>任务列表</span>
      </div>
      <el-button 
        class="settings-btn" 
        circle
        @click="$router.push('/settingsView')"
        :icon="Setting"
      />
    </div>

    <!-- 搜索表单 -->
    <div class="search-section">
      <el-form 
        :model="searchForm" 
        class="search-form"
        :inline="true"
      >
        <el-form-item label="任务编号">
          <el-input 
            v-model="searchForm.taskCode" 
            placeholder="请输入任务编号"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="创建人">
          <el-input 
            v-model="searchForm.creator" 
            placeholder="请输入创建人"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="执行人">
          <el-input 
            v-model="searchForm.executor" 
            placeholder="请输入执行人"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select 
            v-model="searchForm.taskStatus" 
            placeholder="请选择状态"
            clearable
            style="width: 150px"
          >
            <el-option label="待巡视" value="待巡视" />
            <el-option label="巡视中" value="巡视中" />
            <el-option label="待上传" value="待上传" />
            <el-option label="已完成" value="已完成" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" :icon="Search">
            搜索
          </el-button>
          <el-button @click="resetSearch" :icon="Refresh">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <el-button 
        type="primary" 
        @click="showAddDialog = true"
        :icon="VideoCamera"
      >
        新增任务
      </el-button>
    </div>

    <!-- 任务表格 -->
    <div class="table-section">
      <el-table 
        :data="taskList" 
        v-loading="loading"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column type="index" label="序号" width="70" align="center" />
        <el-table-column prop="taskCode" label="任务编号" width="200">
          <template #default="{ row }">
            <el-link 
              type="primary" 
              @click="viewTaskDetail(row)"
              :underline="false"
            >
              {{ row.taskCode }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="taskName" label="任务名称" min-width="200" />
        <el-table-column prop="startPos" label="起始地点" width="130" />
        <el-table-column prop="taskTrip" label="任务距离" width="130" />
        <el-table-column prop="creator" label="创建人" width="130" />
        <el-table-column prop="executor" label="执行人" width="130" />
        <el-table-column prop="execTime" label="执行时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.execTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="endTime" label="完成时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.endTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="taskStatus" label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag 
              :type="getStatusTagType(row.taskStatus)"
              effect="plain"
            >
              {{ row.taskStatus }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button 
                v-if="row.taskStatus === '待巡视'"
                type="primary" 
                size="small"
                @click="startTask(row)"
              >
                启动
              </el-button>
              <el-button 
                v-if="row.taskStatus === '巡视中'"
                type="success" 
                size="small"
                @click="continueTask(row)"
              >
                继续
              </el-button>
              <el-button 
                v-if="['待上传', '已完成'].includes(row.taskStatus)"
                type="info" 
                size="small"
                @click="viewTaskDetail(row)"
              >
                查看
              </el-button>
              <el-button 
                v-if="row.taskStatus === '待巡视'"
                size="small"
                @click="editTask(row)"
              >
                修改
              </el-button>
              <el-button 
                v-if="row.taskStatus === '待巡视'"
                type="danger" 
                size="small"
                @click="deleteTask(row)"
              >
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.pageNum"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 新增/编辑任务弹窗 -->
    <el-dialog
      v-model="showAddDialog"
      :title="isEdit ? '编辑任务' : '新增任务'"
      width="50%"
      :before-close="handleCloseDialog"
    >
      <el-form
        ref="taskFormRef"
        :model="taskForm"
        :rules="taskFormRules"
        label-width="120px"
      >
        <el-form-item label="任务编号" prop="taskCode">
          <el-input 
            v-model="taskForm.taskCode" 
            :disabled="isEdit"
            placeholder="系统自动生成"
          />
        </el-form-item>
        <el-form-item label="任务名称" prop="taskName">
          <el-input 
            v-model="taskForm.taskName" 
            placeholder="请输入任务名称"
          />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="起始地点" prop="startPos">
              <el-input 
                v-model="taskForm.startPos" 
                placeholder="请输入起始地点"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="任务距离" prop="taskTrip">
              <el-input 
                v-model="taskForm.taskTrip" 
                placeholder="请输入任务距离"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="创建人" prop="creator">
              <el-input 
                v-model="taskForm.creator" 
                placeholder="请输入创建人"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="执行人" prop="executor">
              <el-input 
                v-model="taskForm.executor" 
                placeholder="请输入执行人"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注" prop="remark">
          <el-input 
            v-model="taskForm.remark" 
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCloseDialog">取消</el-button>
          <el-button type="primary" @click="saveTask" :loading="saving">
            {{ isEdit ? '保存' : '创建' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowRight,
  Setting,
  Search,
  Refresh,
  VideoCamera
} from '@element-plus/icons-vue'
import { 
  listTask, 
  addTask, 
  updateTask, 
  delTask, 
  startTask as startTaskApi 
} from '@/api/task'
import { formatDateTime, generateTaskCode } from '@/utils/common'

const router = useRouter()

// 响应式数据
const loading = ref(false)
const saving = ref(false)
const showAddDialog = ref(false)
const isEdit = ref(false)
const taskFormRef = ref(null)

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
  pageSize: 20,
  total: 0
})

// 任务列表
const taskList = ref([])

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
const taskFormRules = {
  taskName: [
    { required: true, message: '请输入任务名称', trigger: 'blur' }
  ],
  startPos: [
    { required: true, message: '请输入起始地点', trigger: 'blur' }
  ],
  taskTrip: [
    { required: true, message: '请输入任务距离', trigger: 'blur' }
  ],
  creator: [
    { required: true, message: '请输入创建人', trigger: 'blur' }
  ],
  executor: [
    { required: true, message: '请输入执行人', trigger: 'blur' }
  ]
}

// 获取状态标签类型
const getStatusTagType = (status) => {
  const statusMap = {
    '待巡视': 'warning',
    '巡视中': 'primary',
    '待上传': 'info',
    '已完成': 'success'
  }
  return statusMap[status] || ''
}

// 获取任务列表
const getTaskList = async () => {
  loading.value = true
  try {
    const params = {
      ...searchForm,
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize
    }
    
    // 过滤空值
    Object.keys(params).forEach(key => {
      if (params[key] === '') {
        delete params[key]
      }
    })
    
    const response = await listTask(params)
    
    taskList.value = response.rows || []
    pagination.total = response.total || 0
    
  } catch (error) {
    ElMessage.error('获取任务列表失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.pageNum = 1
  getTaskList()
}

// 重置搜索
const resetSearch = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key] = ''
  })
  pagination.pageNum = 1
  getTaskList()
}

// 分页大小改变
const handleSizeChange = (size) => {
  pagination.pageSize = size
  pagination.pageNum = 1
  getTaskList()
}

// 页码改变
const handleCurrentChange = (page) => {
  pagination.pageNum = page
  getTaskList()
}

// 查看任务详情
const viewTaskDetail = (row) => {
  router.push({
    path: '/taskDetailView',
    query: { id: row.id }
  })
}

// 启动任务
const startTask = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要启动任务 "${row.taskName}" 吗？`,
      '确认启动',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await startTaskApi(row.id)
    ElMessage.success('任务启动成功')
    
    // 跳转到任务执行页面
    router.push({
      path: '/taskExecuteView',
      query: { id: row.id }
    })
    
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('启动任务失败')
      console.error(error)
    }
  }
}

// 继续任务
const continueTask = (row) => {
  router.push({
    path: '/taskExecuteView',
    query: { id: row.id }
  })
}

// 编辑任务
const editTask = (row) => {
  isEdit.value = true
  Object.assign(taskForm, row)
  showAddDialog.value = true
}

// 删除任务
const deleteTask = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除任务 "${row.taskName}" 吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await delTask(row.id)
    ElMessage.success('删除成功')
    getTaskList()
    
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
      console.error(error)
    }
  }
}

// 保存任务
const saveTask = async () => {
  if (!taskFormRef.value) return
  
  try {
    await taskFormRef.value.validate()
    
    saving.value = true
    
    if (isEdit.value) {
      await updateTask(taskForm)
      ElMessage.success('修改成功')
    } else {
      // 新增时生成任务编号
      if (!taskForm.taskCode) {
        taskForm.taskCode = generateTaskCode()
      }
      await addTask(taskForm)
      ElMessage.success('创建成功')
    }
    
    handleCloseDialog()
    getTaskList()
    
  } catch (error) {
    if (error.errors) {
      ElMessage.error('请检查表单填写是否正确')
    } else {
      ElMessage.error(isEdit.value ? '修改失败' : '创建失败')
      console.error(error)
    }
  } finally {
    saving.value = false
  }
}

// 关闭弹窗
const handleCloseDialog = () => {
  showAddDialog.value = false
  isEdit.value = false
  
  // 重置表单
  if (taskFormRef.value) {
    taskFormRef.value.resetFields()
  }
  
  Object.keys(taskForm).forEach(key => {
    taskForm[key] = key === 'id' ? null : ''
  })
}

// 页面加载时获取数据
onMounted(() => {
  getTaskList()
})
</script>

<style lang="scss" scoped>
.task-container {
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
    
    .settings-btn {
      color: #606266;
    }
  }
  
  .search-section {
    background: white;
    padding: 24px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    margin-bottom: 16px;
    
    .search-form {
      .el-form-item {
        margin-bottom: 16px;
      }
    }
  }
  
  .toolbar {
    margin-bottom: 16px;
  }
  
  .table-section {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    overflow: hidden;
    
    .pagination {
      padding: 16px 24px;
      text-align: right;
      border-top: 1px solid #ebeef5;
    }
  }
  
  .action-buttons {
    display: flex;
    gap: 8px;
    justify-content: center;
    flex-wrap: wrap;
    
    .el-button {
      margin: 0;
    }
  }
}

:deep(.el-table) {
  .el-table__header {
    background: #fafafa;
    
    th {
      background: #fafafa !important;
      color: #303133;
      font-weight: 600;
    }
  }
  
  .el-table__row {
    &:hover {
      td {
        background: #f5f7fa !important;
      }
    }
  }
}

:deep(.el-dialog) {
  border-radius: 8px;
  
  .el-dialog__header {
    border-bottom: 1px solid #ebeef5;
    
    .el-dialog__title {
      font-size: 18px;
      font-weight: 600;
    }
  }
}

.dialog-footer {
  text-align: center;
  
  .el-button {
    min-width: 80px;
  }
}
</style>