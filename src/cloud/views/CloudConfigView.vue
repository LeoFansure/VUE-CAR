<template>
  <div class="cloud-config">
    <div class="header">
      <h2>系统配置管理</h2>
      <el-button type="primary" @click="showAddDialog">
        <el-icon><Plus /></el-icon>
        新增配置
      </el-button>
    </div>

    <el-table :data="configList" v-loading="loading" style="width: 100%">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="agvhost" label="AGV主机IP" width="150" />
      <el-table-column prop="drivePort" label="驱动端口" width="100" />
      <el-table-column prop="analysisPort" label="分析端口" width="100" />
      <el-table-column prop="cloudUrl" label="云端地址" width="200" />
      <el-table-column label="摄像头配置" width="300">
        <template #default="scope">
          <div v-if="scope.row.cam1">摄像头1: {{ scope.row.cam1 }}</div>
          <div v-if="scope.row.cam2">摄像头2: {{ scope.row.cam2 }}</div>
          <div v-if="scope.row.cam3">摄像头3: {{ scope.row.cam3 }}</div>
          <div v-if="scope.row.cam4">摄像头4: {{ scope.row.cam4 }}</div>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="scope">
          <el-button @click="showEditDialog(scope.row)" type="primary" size="small">
            编辑
          </el-button>
          <el-button @click="handleDeleteConfig(scope.row)" type="danger" size="small">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      width="800px"
      :before-close="handleClose"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="AGV主机IP" prop="agvhost">
              <el-input v-model="form.agvhost" placeholder="请输入AGV主机IP" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="驱动端口" prop="drivePort">
              <el-input-number v-model="form.drivePort" :min="1" :max="65535" placeholder="驱动端口" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="分析端口" prop="analysisPort">
              <el-input-number v-model="form.analysisPort" :min="1" :max="65535" placeholder="分析端口" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="云端地址" prop="cloudUrl">
              <el-input v-model="form.cloudUrl" placeholder="请输入云端地址" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">摄像头配置</el-divider>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="摄像头1地址" prop="cam1">
              <el-input v-model="form.cam1" placeholder="摄像头1地址" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="摄像头1用户名" prop="username1">
              <el-input v-model="form.username1" placeholder="摄像头1用户名" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="摄像头1密码" prop="password1">
              <el-input v-model="form.password1" type="password" placeholder="摄像头1密码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="摄像头2地址" prop="cam2">
              <el-input v-model="form.cam2" placeholder="摄像头2地址" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="摄像头2用户名" prop="username2">
              <el-input v-model="form.username2" placeholder="摄像头2用户名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="摄像头2密码" prop="password2">
              <el-input v-model="form.password2" type="password" placeholder="摄像头2密码" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="摄像头3地址" prop="cam3">
              <el-input v-model="form.cam3" placeholder="摄像头3地址" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="摄像头3用户名" prop="username3">
              <el-input v-model="form.username3" placeholder="摄像头3用户名" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="摄像头3密码" prop="password3">
              <el-input v-model="form.password3" type="password" placeholder="摄像头3密码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="摄像头4地址" prop="cam4">
              <el-input v-model="form.cam4" placeholder="摄像头4地址" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="摄像头4用户名" prop="username4">
              <el-input v-model="form.username4" placeholder="摄像头4用户名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="摄像头4密码" prop="password4">
              <el-input v-model="form.password4" type="password" placeholder="摄像头4密码" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleClose">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getSysConfigs, createSysConfig, updateSysConfig, deleteSysConfig } from '../../cloud/api/cloud'

// 响应式数据
const loading = ref(false)
const configList = ref([])
const dialogVisible = ref(false)
const dialogTitle = ref('')
const submitting = ref(false)
const formRef = ref()

// 表单数据
const form = reactive({
  id: null,
  agvhost: '',
  drivePort: null,
  analysisPort: null,
  cloudUrl: '',
  cam1: '',
  cam2: '',
  cam3: '',
  cam4: '',
  username1: '',
  username2: '',
  username3: '',
  username4: '',
  password1: '',
  password2: '',
  password3: '',
  password4: ''
})

// 表单验证规则
const rules = {
  agvhost: [
    { required: true, message: '请输入AGV主机IP', trigger: 'blur' }
  ],
  drivePort: [
    { required: true, message: '请输入驱动端口', trigger: 'blur' }
  ],
  analysisPort: [
    { required: true, message: '请输入分析端口', trigger: 'blur' }
  ],
  cloudUrl: [
    { required: true, message: '请输入云端地址', trigger: 'blur' }
  ]
}

// 加载配置列表
const loadConfigs = async () => {
  loading.value = true
  try {
    const response = await getSysConfigs()
    configList.value = response.data || []
  } catch (error) {
    console.error('加载配置列表失败:', error)
    ElMessage.error('加载配置列表失败')
  } finally {
    loading.value = false
  }
}

// 显示新增对话框
const showAddDialog = () => {
  dialogTitle.value = '新增配置'
  resetForm()
  dialogVisible.value = true
}

// 显示编辑对话框
const showEditDialog = (config) => {
  dialogTitle.value = '编辑配置'
  Object.assign(form, config)
  dialogVisible.value = true
}

// 重置表单
const resetForm = () => {
  Object.assign(form, {
    id: null,
    agvhost: '',
    drivePort: null,
    analysisPort: null,
    cloudUrl: '',
    cam1: '',
    cam2: '',
    cam3: '',
    cam4: '',
    username1: '',
    username2: '',
    username3: '',
    username4: '',
    password1: '',
    password2: '',
    password3: '',
    password4: ''
  })
  formRef.value?.resetFields()
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitting.value = true
    
    if (form.id) {
      // 编辑
      await updateSysConfig(form.id, form)
      ElMessage.success('更新成功')
    } else {
      // 新增
      await createSysConfig(form)
      ElMessage.success('创建成功')
    }
    
    dialogVisible.value = false
    loadConfigs()
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('提交失败')
  } finally {
    submitting.value = false
  }
}

// 删除配置
const handleDeleteConfig = async (config) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除配置 "${config.agvhost}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    await deleteSysConfig(config.id)
    ElMessage.success('删除成功')
    loadConfigs()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除配置失败:', error)
      ElMessage.error('删除配置失败')
    }
  }
}

// 关闭对话框
const handleClose = () => {
  dialogVisible.value = false
  resetForm()
}

// 页面加载时获取数据
onMounted(() => {
  loadConfigs()
})
</script>

<style scoped>
.cloud-config {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h2 {
  margin: 0;
  color: #303133;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style> 