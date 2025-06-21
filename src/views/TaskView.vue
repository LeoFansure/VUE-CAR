<template>
  <div class="task-container">
    <!-- 测试信息 -->
    <div v-if="!taskStore.taskList.length && !taskStore.loading" class="test-info">
      <h3>任务列表页面加载成功！</h3>
      <p>当前没有任务数据，请检查API连接或添加测试数据。</p>
    </div>
    
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
        :model="taskStore.searchForm" 
        class="search-form"
        :inline="true"
      >
        <el-form-item label="任务编号">
          <el-input 
            v-model="taskStore.searchForm.taskCode" 
            placeholder="请输入任务编号"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="创建人">
          <el-input 
            v-model="taskStore.searchForm.creator" 
            placeholder="请输入创建人"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="执行人">
          <el-input 
            v-model="taskStore.searchForm.executor" 
            placeholder="请输入执行人"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select 
            v-model="taskStore.searchForm.taskStatus" 
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
          <el-button type="primary" @click="taskStore.searchTasks" :icon="Search">
            搜索
          </el-button>
          <el-button @click="taskStore.resetSearch" :icon="Refresh">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <el-button 
        type="primary" 
        @click="showTaskDialog = true"
        :icon="VideoCamera"
      >
        新增任务
      </el-button>
    </div>

    <!-- 任务表格 -->
    <div class="table-section">
      <el-table 
        :data="taskStore.taskList" 
        v-loading="taskStore.loading"
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
                @click="startTask(row.id)"
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
                v-if="row.taskStatus === '待上传'"
                type="primary" 
                size="small"
                @click="uploadTask(row.id)"
              >
                上传
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
                @click="openEditTaskDialog(row)"
              >
                修改
              </el-button>
              <el-button 
                v-if="row.taskStatus === '待巡视'"
                type="danger" 
                size="small"
                @click="deleteTask(row.id)"
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
          v-model:current-page="taskStore.pagination.pageNum"
          v-model:page-size="taskStore.pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="taskStore.pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="taskStore.setPageSize"
          @current-change="taskStore.setCurrentPage"
        />
      </div>
    </div>

    <!-- 新增/编辑任务弹窗 -->
    <el-dialog
      v-model="showTaskDialog"
      :title="isEdit ? '编辑任务' : '新增任务'"
      width="50%"
      :before-close="handleCloseDialog"
    >
      <el-form
        ref="taskFormRef"
        :model="currentTask"
        :rules="taskFormRules"
        label-width="120px"
      >
        <el-form-item label="任务编号" prop="taskCode">
          <el-input 
            v-model="currentTask.taskCode" 
            :disabled="isEdit"
            placeholder="系统自动生成"
          />
        </el-form-item>
        <el-form-item label="任务名称" prop="taskName">
          <el-input 
            v-model="currentTask.taskName" 
            placeholder="请输入任务名称"
          />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="起始地点" prop="startPos">
              <el-input 
                v-model="currentTask.startPos" 
                placeholder="请输入起始地点"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="任务距离" prop="taskTrip">
              <el-input 
                v-model="currentTask.taskTrip" 
                placeholder="请输入任务距离"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="创建人" prop="creator">
              <el-input 
                v-model="currentTask.creator" 
                placeholder="请输入创建人"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="执行人" prop="executor">
              <el-input 
                v-model="currentTask.executor" 
                placeholder="请输入执行人"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注" prop="remark">
          <el-input 
            v-model="currentTask.remark" 
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
  addTask as addTaskApi, 
  updateTask, 
  delTask, 
  startTask as startTaskApi,
  uploadTask as uploadTaskApi
} from '@/api/task'
import { formatDateTime, generateTaskCode } from '@/utils/common'
import { useTaskStore } from '@/stores/task';

const router = useRouter()
const taskStore = useTaskStore();

// 响应式数据
const saving = ref(false)
const showTaskDialog = ref(false)
const isEdit = ref(false)
const taskFormRef = ref(null)

// 任务表单
const currentTask = reactive({
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

// 查看任务详情
const viewTaskDetail = (row) => {
  router.push({
    path: '/taskDetailView',
    query: { id: row.id }
  })
}

// 启动任务
const startTask = async (taskId) => {
  try {
    const taskToStart = taskStore.taskList.find(task => task.id === taskId);
    if (!taskToStart) {
      ElMessage.error('任务不存在');
      return;
    }

    await ElMessageBox.confirm(
      `确定要启动任务 "${taskToStart.taskName}" 吗？`,
      '确认启动',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await startTaskApi(taskId)
    ElMessage.success('任务启动成功')
    
    // 跳转到任务执行页面
    router.push({
      path: '/taskExecuteView',
      query: { id: taskId }
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

// 打开编辑任务弹窗
const openEditTaskDialog = (row) => {
  isEdit.value = true
  Object.assign(currentTask, row)
  showTaskDialog.value = true
}

// 删除任务
const deleteTask = async (taskId) => {
  try {
    const taskToDelete = taskStore.taskList.find(task => task.id === taskId);
    if (!taskToDelete) {
      ElMessage.error('任务不存在');
      return;
    }

    await ElMessageBox.confirm(
      `确定要删除任务 "${taskToDelete.taskName}" 吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await delTask(taskId)
    ElMessage.success('删除成功')
    taskStore.loadTaskList()
    
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
      console.error(error)
    }
  }
}

// 新增任务
const addTask = async () => {
  try {
    // 新增时生成任务编号
    if (!currentTask.taskCode) {
      currentTask.taskCode = generateTaskCode()
    }
    await addTaskApi(currentTask)
    ElMessage.success('创建成功')
    return true;
  } catch (error) {
    ElMessage.error('创建失败')
    console.error(error)
    return false;
  }
}

// 编辑任务
const editTask = async () => {
  try {
    await updateTask(currentTask)
    ElMessage.success('修改成功')
    return true;
  } catch (error) {
    ElMessage.error('修改失败')
    console.error(error)
    return false;
  }
}

// 保存任务
const saveTask = async () => {
  if (!taskFormRef.value) return
  
  try {
    await taskFormRef.value.validate()
    
    saving.value = true
    
    let success = false;
    if (isEdit.value) {
      success = await editTask();
    } else {
      success = await addTask();
    }
    
    if (success) {
      handleCloseDialog()
      taskStore.loadTaskList()
    }
    
  } catch (error) {
    if (error.errors) {
      ElMessage.error('请检查表单填写是否正确')
    } else {
      // This catch block will now only handle validation errors or unexpected errors
      // Specific add/edit errors are handled within addTask/editTask
      console.error(error)
    }
  } finally {
    saving.value = false
  }
}

// 关闭弹窗
const handleCloseDialog = () => {
  showTaskDialog.value = false
  isEdit.value = false
  
  // 重置表单
  if (taskFormRef.value) {
    taskFormRef.value.resetFields()
  }
  
  Object.keys(currentTask).forEach(key => {
    currentTask[key] = key === 'id' ? null : ''
  })
}

// 上传任务数据
const uploadTask = async (taskId) => {
  try {
    const taskToUpload = taskStore.taskList.find(task => task.id === taskId);
    if (!taskToUpload) {
      ElMessage.error('任务不存在');
      return;
    }
    ElMessage.info(`开始上传任务 [${taskToUpload.taskName}] 的数据`);
    await uploadTaskApi(taskId); 
    ElMessage.success('任务数据上传成功');
    taskStore.loadTaskList(); // Refresh list after upload
  } catch (error) {
    ElMessage.error('任务数据上传失败');
    console.error(error);
  }
};

// 页面加载时获取数据
onMounted(() => {
  console.log('TaskView 组件已加载')
  console.log('taskStore:', taskStore)
  taskStore.loadTaskList()
})
</script>

<style lang="scss" scoped>
.task-container {
  padding: 24px;
  background: #f5f5f5;
  min-height: 100vh;
  
  .test-info {
    background: #e1f3d8;
    border: 1px solid #b3d8a4;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 24px;
    text-align: center;
    
    h3 {
      color: #67c23a;
      margin: 0 0 8px 0;
    }
    
    p {
      color: #606266;
      margin: 0;
    }
  }
  
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