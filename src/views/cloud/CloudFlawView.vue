<template>
  <div class="cloud-flaw-container">
    <!-- 头部 -->
    <div class="header">
      <div class="header-left">
        <h1>缺陷数据管理</h1>
        <p class="subtitle">管理缺陷数据，支持缺陷确认和状态更新</p>
      </div>
      <div class="header-right">
        <el-button @click="backToCloud" type="info" size="large">
          <el-icon><Back /></el-icon>
          返回
        </el-button>
        <el-button @click="showAddDialog" type="primary" size="large">
          <el-icon><Plus /></el-icon>
          新增缺陷
        </el-button>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <el-card class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="缺陷类型">
          <el-input v-model="searchForm.flawType" placeholder="请输入缺陷类型" clearable />
        </el-form-item>
        <el-form-item label="缺陷名称">
          <el-input v-model="searchForm.flawName" placeholder="请输入缺陷名称" clearable />
        </el-form-item>
        <el-form-item label="缺陷等级">
          <el-select v-model="searchForm.flawlevel" placeholder="请选择等级" clearable>
            <el-option label="低" value="低" />
            <el-option label="中" value="中" />
            <el-option label="高" value="高" />
          </el-select>
        </el-form-item>
        <el-form-item label="确认状态">
          <el-select v-model="searchForm.confirmed" placeholder="请选择状态" clearable>
            <el-option label="已确认" :value="true" />
            <el-option label="未确认" :value="false" />
          </el-select>
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

    <!-- 缺陷列表 -->
    <el-card style="width: 100%;">
      <el-table :data="flawList" style="width: 100%; min-width: 1200px;" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="taskId" label="任务ID" width="80" />
        <el-table-column prop="round" label="轮次" width="80" />
        <el-table-column prop="flawType" label="缺陷类型" width="140" />
        <el-table-column prop="flawName" label="缺陷名称" width="180" />
        <el-table-column prop="flawDesc" label="缺陷描述" width="200" show-overflow-tooltip />
        <el-table-column prop="flawDistance" label="距离" width="100" />
        <el-table-column prop="flawlevel" label="缺陷等级" width="100">
          <template #default="scope">
            <el-tag :type="getLevelType(scope.row.flawlevel)">
              {{ scope.row.flawlevel }}
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
        <el-table-column prop="uploaded" label="上传状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.uploaded ? 'success' : 'warning'">
              {{ scope.row.uploaded ? '已上传' : '未上传' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="scope">
            <div style="display: flex; gap: 5px;">
              <el-button @click="viewFlawDetail(scope.row)" type="primary" size="small">
                查看详情
              </el-button>
              <el-button @click="editFlaw(scope.row)" type="warning" size="small">
                编辑
              </el-button>
              <el-button @click="handleConfirmFlaw(scope.row)" type="success" size="small" v-if="!scope.row.confirmed">
                确认
              </el-button>
              <el-button @click="deleteFlaw(scope.row)" type="danger" size="small">
                删除
              </el-button>
            </div>
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

    <!-- 新增/编辑缺陷对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="isEdit ? '编辑缺陷' : '新增缺陷'"
      width="70%"
      :before-close="handleCloseDialog"
    >
      <el-form 
        ref="flawFormRef" 
        :model="flawForm" 
        :rules="flawRules" 
        label-width="120px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="任务ID" prop="taskId">
              <el-input-number v-model="flawForm.taskId" :min="1" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="巡视轮次" prop="round">
              <el-input-number v-model="flawForm.round" :min="1" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="缺陷类型" prop="flawType">
              <el-input v-model="flawForm.flawType" placeholder="请输入缺陷类型" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="缺陷名称" prop="flawName">
              <el-input v-model="flawForm.flawName" placeholder="请输入缺陷名称" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="缺陷描述" prop="flawDesc">
              <el-input v-model="flawForm.flawDesc" type="textarea" placeholder="请输入缺陷描述" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="距离" prop="flawDistance">
              <el-input-number v-model="flawForm.flawDistance" :precision="2" placeholder="距离" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="缺陷等级" prop="flawlevel">
              <el-select v-model="flawForm.flawlevel" placeholder="请选择缺陷等级" style="width: 100%">
                <el-option label="低" value="低" />
                <el-option label="中" value="中" />
                <el-option label="高" value="高" />
                <el-option label="严重" value="严重" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="数量" prop="countNum">
              <el-input-number v-model="flawForm.countNum" :min="1" placeholder="数量" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="备注" prop="remark">
              <el-input v-model="flawForm.remark" type="textarea" placeholder="请输入备注" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitFlaw" :loading="submitting">
            {{ isEdit ? '更新' : '创建' }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 缺陷详情对话框 -->
    <el-dialog 
      v-model="detailDialogVisible" 
      title="缺陷详情"
      width="60%"
    >
      <div v-if="currentFlaw" class="flaw-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="缺陷ID">{{ currentFlaw.id }}</el-descriptions-item>
          <el-descriptions-item label="任务ID">{{ currentFlaw.taskId }}</el-descriptions-item>
          <el-descriptions-item label="巡视轮次">{{ currentFlaw.round }}</el-descriptions-item>
          <el-descriptions-item label="缺陷类型">{{ currentFlaw.flawType }}</el-descriptions-item>
          <el-descriptions-item label="缺陷名称">{{ currentFlaw.flawName }}</el-descriptions-item>
          <el-descriptions-item label="缺陷等级">
            <el-tag :type="getLevelType(currentFlaw.flawlevel)">{{ currentFlaw.flawlevel }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="距离">{{ currentFlaw.flawDistance }}</el-descriptions-item>
          <el-descriptions-item label="长度">{{ currentFlaw.flawLength }}</el-descriptions-item>
          <el-descriptions-item label="面积">{{ currentFlaw.flawArea }}</el-descriptions-item>
          <el-descriptions-item label="数量">{{ currentFlaw.countNum }}</el-descriptions-item>
          <el-descriptions-item label="确认状态">
            <el-tag :type="currentFlaw.confirmed ? 'success' : 'warning'">
              {{ currentFlaw.confirmed ? '已确认' : '未确认' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="上传状态">
            <el-tag :type="currentFlaw.uploaded ? 'success' : 'warning'">
              {{ currentFlaw.uploaded ? '已上传' : '未上传' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="缺陷图片" :span="2">
            <template v-if="currentFlaw.flawImage || currentFlaw.flawImageUrl">
              <img :src="getFlawImageUrl(currentFlaw)" alt="缺陷图片" style="max-width: 400px; max-height: 300px; border-radius: 6px; border: 1px solid #eee;" />
            </template>
            <template v-else>
              暂无图片
            </template>
          </el-descriptions-item>
          <el-descriptions-item label="缺陷描述" :span="2">
            {{ currentFlaw.flawDesc }}
          </el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">
            {{ currentFlaw.remark || '无' }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Back, Plus, Search, Refresh } from '@element-plus/icons-vue'
import { getFlaws, createFlaw, updateFlaw, deleteFlaw as deleteFlawApi, confirmFlaw, getFlawById } from '@/api/cloud/cloud'

const router = useRouter()
const route = useRoute()

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const detailDialogVisible = ref(false)
const isEdit = ref(false)
const flawList = ref([])
const currentFlaw = ref(null)
const flawFormRef = ref()

// 搜索表单
const searchForm = reactive({
  flawType: '',
  flawName: '',
  flawlevel: '',
  confirmed: null
})

// 分页
const pagination = reactive({
  current: 1,
  size: 20,
  total: 0
})

// 缺陷表单
const flawForm = reactive({
  id: null,
  taskId: null,
  round: 1,
  flawType: '',
  flawName: '',
  flawDesc: '',
  flawDistance: 0,
  flawImage: '',
  flawImageUrl: '',
  flawRtsp: '',
  shown: false,
  confirmed: false,
  uploaded: false,
  remark: '',
  flawLength: 0,
  flawArea: 0,
  flawlevel: '中',
  countNum: 1
})

// 表单验证规则
const flawRules = {
  taskId: [
    { required: true, message: '请输入任务ID', trigger: 'blur' }
  ],
  flawType: [
    { required: true, message: '请输入缺陷类型', trigger: 'blur' }
  ],
  flawName: [
    { required: true, message: '请输入缺陷名称', trigger: 'blur' }
  ],
  flawDesc: [
    { required: true, message: '请输入缺陷描述', trigger: 'blur' }
  ],
  flawlevel: [
    { required: true, message: '请选择缺陷等级', trigger: 'change' }
  ]
}

// 加载缺陷列表
const loadFlaws = async () => {
  loading.value = true
  try {
    const params = {
      ...searchForm,
      page: pagination.current,
      size: pagination.size
    }
    const response = await getFlaws(params)
    // 适配后端返回的数据格式
    const flawData = response.data || []
    flawList.value = flawData
    pagination.total = response.total || 0
  } catch (error) {
    console.error('加载缺陷列表失败:', error)
    ElMessage.error('加载缺陷列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.current = 1
  loadFlaws()
}

// 重置搜索
const resetSearch = () => {
  Object.assign(searchForm, {
    flawType: '',
    flawName: '',
    flawlevel: '',
    confirmed: null
  })
  pagination.current = 1
  loadFlaws()
}

// 分页处理
const handleSizeChange = (size) => {
  pagination.size = size
  pagination.current = 1
  loadFlaws()
}

const handleCurrentChange = (current) => {
  pagination.current = current
  loadFlaws()
}

// 显示新增对话框
const showAddDialog = () => {
  isEdit.value = false
  resetFlawForm()
  dialogVisible.value = true
}

// 编辑缺陷
const editFlaw = (flaw) => {
  isEdit.value = true
  Object.assign(flawForm, flaw)
  dialogVisible.value = true
}

// 删除缺陷
const deleteFlaw = async (flaw) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除缺陷 "${flaw.flawName}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    await deleteFlawApi(flaw.id)
    ElMessage.success('删除成功')
    loadFlaws()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除缺陷失败:', error)
      ElMessage.error('删除缺陷失败')
    }
  }
}

// 提交缺陷
const submitFlaw = async () => {
  try {
    await flawFormRef.value.validate()
    submitting.value = true
    
    if (isEdit.value) {
      await updateFlaw(flawForm.id, flawForm)
      ElMessage.success('更新成功')
    } else {
      await createFlaw(flawForm)
      ElMessage.success('创建成功')
    }
    
    dialogVisible.value = false
    loadFlaws()
  } catch (error) {
    console.error('提交缺陷失败:', error)
    ElMessage.error('提交缺陷失败')
  } finally {
    submitting.value = false
  }
}

// 查看缺陷详情
const viewFlawDetail = async (flaw) => {
  try {
    const response = await getFlawById(flaw.id)
    currentFlaw.value = response.data
    detailDialogVisible.value = true
  } catch (error) {
    console.error('获取缺陷详情失败:', error)
    ElMessage.error('获取缺陷详情失败')
  }
}

// 确认缺陷
const handleConfirmFlaw = async (flaw) => {
  try {
    await confirmFlaw(flaw.id)
    ElMessage.success('缺陷确认成功')
    loadFlaws()
  } catch (error) {
    console.error('确认缺陷失败:', error)
    ElMessage.error('确认缺陷失败')
  }
}

// 重置缺陷表单
const resetFlawForm = () => {
  Object.assign(flawForm, {
    id: null,
    taskId: null,
    round: 1,
    flawType: '',
    flawName: '',
    flawDesc: '',
    flawDistance: 0,
    flawImage: '',
    flawImageUrl: '',
    flawRtsp: '',
    shown: false,
    confirmed: false,
    uploaded: false,
    remark: '',
    flawLength: 0,
    flawArea: 0,
    flawlevel: '中',
    countNum: 1
  })
  flawFormRef.value?.clearValidate()
}

// 关闭对话框
const handleCloseDialog = () => {
  dialogVisible.value = false
  resetFlawForm()
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

// 获取缺陷图片url
function getFlawImageUrl(flaw) {
  const baseImageUrl = 'http://localhost:8080/file/';
  if (flaw.flawImage) {
    return baseImageUrl + flaw.flawImage.replace(/^\/+/, '');
  }
  if (flaw.flawImageUrl) {
    return baseImageUrl + flaw.flawImageUrl.replace(/^\/+/, '');
  }
  return '';
}

// 生命周期
onMounted(() => {
  loadFlaws()
  
  // 如果有缺陷ID参数，直接查看该缺陷详情
  const flawId = route.query.flawId
  if (flawId) {
    viewFlawDetail({ id: flawId })
  }
})
</script>

<style scoped>
.cloud-flaw-container {
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

.flaw-detail {
  padding: 20px 0;
}
</style> 