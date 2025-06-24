<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowRight, ZoomIn, Warning } from '@element-plus/icons-vue'
import { formatDateTime } from '@/utils/common'
import { getTask } from '@/api/task'
import { listFlaw, updateFlaw } from '@/api/flaw'

const route = useRoute()
const router = useRouter()

// 响应式数据
const taskDetail = ref(null)
const flawList = ref([])
const currentFlaw = ref(null)
const showFlawDialog = ref(false)
const loading = ref(false)
const flawLoading = ref(false)
const saveLoading = ref(false)
const selectedFlawId = ref(null)
const imageUrl = ref('')

// 故障确认表单
const flawForm = reactive({
  id: null,
  confirmed: true,
  remark: ''
})

// 计算属性
const confirmedCount = computed(() => {
  return flawList.value.filter(item => item.confirmed).length
})

const unconfirmedCount = computed(() => {
  return flawList.value.filter(item => !item.confirmed && item.flawType !== '误报').length
})

const falseCount = computed(() => {
  return flawList.value.filter(item => item.flawType === '误报').length
})

// 获取任务详情
const loadTaskDetail = async () => {
  const id = route.query.id
  if (!id) {
    ElMessage.error('任务ID不存在')
    router.push('/taskView')
    return
  }

  try {
    loading.value = true
    const res = await getTask(id)
    if (res.code === 200) {
      taskDetail.value = res.data
      await loadFlawList(id)
    } else {
      ElMessage.error(res.msg || '获取任务详情失败')
    }
  } catch (error) {
    console.error('获取任务详情失败', error)
    ElMessage.error('获取任务详情失败')
  } finally {
    loading.value = false
  }
}

// 获取故障列表
const loadFlawList = async (taskId) => {
  try {
    flawLoading.value = true
    const res = await listFlaw({ taskId })
    if (res.code === 200) {
      flawList.value = res.rows || []
      // 如果有故障，默认选中第一个
      if (flawList.value.length > 0) {
        selectFlaw(flawList.value[0])
      }
    } else {
      ElMessage.error(res.msg || '获取故障列表失败')
    }
  } catch (error) {
    console.error('获取故障列表失败', error)
    ElMessage.error('获取故障列表失败')
  } finally {
    flawLoading.value = false
  }
}

// 选择故障
const selectFlaw = (flaw) => {
  currentFlaw.value = flaw
  selectedFlawId.value = flaw.id
  imageUrl.value = flaw.flawImageUrl || ''
}

// 打开故障详情弹窗
const openFlawDialog = (flaw) => {
  currentFlaw.value = flaw
  flawForm.id = flaw.id
  flawForm.confirmed = flaw.confirmed
  flawForm.remark = flaw.remark || ''
  showFlawDialog.value = true
}

// 确认故障
const confirmFlaw = async () => {
  if (!currentFlaw.value) return

  try {
    saveLoading.value = true
    const data = {
      id: flawForm.id,
      confirmed: flawForm.confirmed,
      remark: flawForm.remark
    }
    
    const res = await updateFlaw(data)
    if (res.code === 200) {
      ElMessage.success('保存成功')
      showFlawDialog.value = false
      
      // 更新本地数据
      const index = flawList.value.findIndex(item => item.id === flawForm.id)
      if (index !== -1) {
        flawList.value[index].confirmed = flawForm.confirmed
        flawList.value[index].remark = flawForm.remark
      }
    } else {
      ElMessage.error(res.msg || '保存失败')
    }
  } catch (error) {
    console.error('保存故障信息失败', error)
    ElMessage.error('保存故障信息失败')
  } finally {
    saveLoading.value = false
  }
}

// 返回任务列表
const goBack = () => {
  router.push('/taskView')
}

// 预览图片
const previewImage = (url) => {
  if (!url) {
    ElMessage.warning('无法预览，图片地址为空')
    return
  }
  
  // 这里可以调用图片预览组件
  ElMessageBox.alert(
    `<div style="text-align: center"><img src="${url}" style="max-width: 100%; max-height: 500px;" /></div>`,
    '图片预览',
    {
      dangerouslyUseHTMLString: true,
      showCancelButton: false,
      confirmButtonText: '关闭'
    }
  )
}

// 获取故障类型对应的样式
const getFlawTypeClass = (flaw) => {
  if (flaw.flawType === '误报') return 'false'
  return flaw.confirmed ? 'confirmed' : 'unconfirmed'
}

// 获取故障在进度条上的位置百分比
const getFlawPosition = (distance) => {
  if (!taskDetail.value || !taskDetail.value.taskTrip) return 0
  const totalDistance = parseFloat(taskDetail.value.taskTrip)
  if (totalDistance <= 0) return 0
  
  const position = (parseFloat(distance) / totalDistance) * 100
  return Math.min(Math.max(position, 0), 100) + '%'
}

// 页面加载时获取数据
onMounted(() => {
  loadTaskDetail()
})
</script>

<template>
  <div class="task-detail-container" v-loading="loading">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="breadcrumb">
        <span>地铁隧道巡线车智能巡检系统</span>
        <el-icon class="breadcrumb-separator"><ArrowRight /></el-icon>
        <span>任务列表</span>
        <el-icon class="breadcrumb-separator"><ArrowRight /></el-icon>
        <span>任务详情</span>
      </div>
      <el-button class="back-btn" @click="goBack">
        <el-icon class="el-icon--left"><ArrowRight style="transform: rotate(180deg)" /></el-icon>返回
      </el-button>
    </div>

    <!-- 主体内容 -->
    <div class="main-container">
      <!-- 左侧内容区域 -->
      <div class="content-area">
        <!-- 图片显示区域 -->
        <div class="image-area">
          <div v-if="imageUrl" class="image-wrapper">
            <img :src="imageUrl" alt="故障图片" class="flaw-image" />
            <div class="image-actions">
              <el-button type="primary" circle @click="previewImage(imageUrl)">
                <el-icon><ZoomIn /></el-icon>
              </el-button>
            </div>
          </div>
          <div v-else class="no-image">
            <el-icon><Warning /></el-icon>
            <span>暂无图片</span>
          </div>
        </div>

        <!-- 进度条区域 -->
        <div class="scale-bar-area">
          <div class="scale-bar-wrapper">
            <div class="scale-bar-text start">0m</div>
            <div class="scale-bar-text end">{{ taskDetail?.taskTrip || 0 }}m</div>
            <div class="scale-bar">
              <div class="scale-bar-progress"></div>
              
              <!-- 故障点标记 -->
              <div 
                v-for="flaw in flawList" 
                :key="flaw.id"
                :class="['scale-bar-flaw', getFlawTypeClass(flaw)]"
                :style="{ left: getFlawPosition(flaw.flawDistance) }"
                :title="flaw.flawName"
                @click="selectFlaw(flaw)"
              >
                📍
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧边栏 -->
      <div class="sidebar">
        <!-- 任务信息卡片 -->
        <div class="card">
          <div class="card-header">任务信息</div>
          <div class="card-body">
            <div class="info-item">
              <div class="info-label">📄 巡视任务编号</div>
              <div class="info-value">{{ taskDetail?.taskCode || '-' }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">📝 任务名称</div>
              <div class="info-value">{{ taskDetail?.taskName || '-' }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">⏰ 巡视开始时间</div>
              <div class="info-value">{{ taskDetail?.execTime ? formatDateTime(taskDetail.execTime) : '-' }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">⏰ 巡视结束时间</div>
              <div class="info-value">{{ taskDetail?.endTime ? formatDateTime(taskDetail.endTime) : '-' }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">📍 巡视行驶距离</div>
              <div class="info-value">{{ taskDetail?.taskTrip || 0 }} 米</div>
            </div>
            <div class="info-item">
              <div class="info-label">⚠️ 故障总计</div>
              <div class="info-value">{{ flawList.length }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">✅ 已确定故障</div>
              <div class="info-value confirmed-flaw">{{ confirmedCount }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">❓ 疑似故障</div>
              <div class="info-value unconfirmed-flaw">{{ unconfirmedCount }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">❌ 误报</div>
              <div class="info-value false-flaw">{{ falseCount }}</div>
            </div>
          </div>
        </div>

        <!-- 故障列表卡片 -->
        <div class="card">
          <div class="card-header">故障历史</div>
          <div class="card-body" v-loading="flawLoading">
            <template v-if="flawList.length > 0">
              <table class="flaw-table">
                <thead>
                  <tr>
                    <th>故障名称</th>
                    <th>故障类型</th>
                    <th>故障位置</th>
                  </tr>
                </thead>
                <tbody>
                  <tr 
                    v-for="flaw in flawList" 
                    :key="flaw.id" 
                    :class="getFlawTypeClass(flaw)"
                    @click="selectFlaw(flaw)"
                    :style="{ cursor: 'pointer' }"
                  >
                    <td>
                      <a href="javascript:;" class="link" @click.stop="openFlawDialog(flaw)">{{ flaw.flawName }}</a>
                    </td>
                    <td>{{ flaw.flawType }}</td>
                    <td>{{ flaw.flawDistance }}m</td>
                  </tr>
                </tbody>
              </table>
            </template>
            <template v-else>
              <div class="empty-data">暂无故障数据</div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- 故障详情弹窗 -->
    <el-dialog
      v-model="showFlawDialog"
      title="故障详情"
      width="1150px"
      :close-on-click-modal="false"
    >
      <div class="modal-body">
        <div class="modal-image">
          <img v-if="currentFlaw?.flawImageUrl" :src="currentFlaw.flawImageUrl" alt="故障图片" class="flaw-detail-image" />
          <div v-else class="no-image">
            <el-icon><Warning /></el-icon>
            <span>暂无图片</span>
          </div>
        </div>

        <div class="modal-info">
          <div class="card">
            <div class="card-header">故障信息</div>
            <div class="card-body">
              <div class="info-item">
                <div class="info-label">故障名称</div>
                <div class="info-value">{{ currentFlaw?.flawName || '-' }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">故障类型</div>
                <div class="info-value">{{ currentFlaw?.flawType || '-' }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">故障描述</div>
                <div class="info-value">{{ currentFlaw?.flawDesc || '-' }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">故障位置</div>
                <div class="info-value">{{ currentFlaw?.flawDistance || 0 }}m</div>
              </div>
              <div class="info-item">
                <div class="info-label">是否属实</div>
                <div class="info-value">
                  <el-radio-group v-model="flawForm.confirmed">
                    <el-radio :label="true">是</el-radio>
                    <el-radio :label="false">否</el-radio>
                  </el-radio-group>
                </div>
              </div>
              <div class="info-item">
                <div class="info-label">补充说明</div>
                <div class="info-value">
                  <el-input 
                    v-model="flawForm.remark" 
                    type="textarea" 
                    :rows="4" 
                    placeholder="请输入补充说明"
                    maxlength="500"
                    show-word-limit
                  ></el-input>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showFlawDialog = false">取 消</el-button>
          <el-button type="primary" @click="confirmFlaw" :loading="saveLoading">确 定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.task-detail-container {
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
    
    .back-btn {
      padding: 8px 16px;
    }
  }
  
  .main-container {
    display: flex;
    height: calc(100vh - 120px);
  }
  
  .content-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    margin-right: 20px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }
  
  .image-area {
    flex: 1;
    background: #000;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    
    .image-wrapper {
      width: 100%;
      height: 100%;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      
      .flaw-image {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
      }
      
      .image-actions {
        position: absolute;
        bottom: 20px;
        right: 20px;
      }
    }
    
    .no-image {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #909399;
      
      .el-icon {
        font-size: 48px;
        margin-bottom: 16px;
      }
    }
  }
  
  .scale-bar-area {
    height: 100px;
    background: #fafafa;
    border-top: 1px solid #eee;
    padding: 20px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  
  .scale-bar-wrapper {
    position: relative;
    height: 40px;
  }
  
  .scale-bar {
    width: 100%;
    height: 8px;
    background: #e4e7ed;
    border-radius: 4px;
    position: relative;
    margin: 16px 0;
  }
  
  .scale-bar-progress {
    height: 100%;
    background: #409eff;
    border-radius: 4px;
    width: 100%;
  }
  
  .scale-bar-text {
    position: absolute;
    font-size: 12px;
    color: #666;
  }
  
  .scale-bar-text.start {
    left: 0;
    top: -15px;
  }
  
  .scale-bar-text.end {
    right: 0;
    top: -15px;
  }
  
  .scale-bar-flaw {
    position: absolute;
    top: -8px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    cursor: pointer;
    transform: translateX(-50%);
    z-index: 10;
  }
  
  .scale-bar-flaw.confirmed {
    background: #f56c6c;
    color: white;
  }
  
  .scale-bar-flaw.unconfirmed {
    background: #e6a23c;
    color: white;
  }
  
  .scale-bar-flaw.false {
    background: #909399;
    color: white;
  }
  
  .sidebar {
    width: 400px;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
  }
  
  .card {
    border: 1px solid #eee;
    border-radius: 8px;
    margin-bottom: 20px;
    background: white;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    
    &:last-child {
      margin-bottom: 0;
      flex: 1;
      display: flex;
      flex-direction: column;
    }
  }
  
  .card-header {
    padding: 15px 20px;
    background: #fafafa;
    border-bottom: 1px solid #eee;
    font-weight: bold;
    font-size: 16px;
  }
  
  .card-body {
    padding: 20px;
    
    &:last-child {
      flex: 1;
      overflow-y: auto;
    }
  }
  
  .info-item {
    display: flex;
    margin-bottom: 15px;
    align-items: flex-start;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  .info-label {
    width: 120px;
    color: #666;
    font-size: 14px;
  }
  
  .info-value {
    flex: 1;
    color: #333;
    font-size: 14px;
  }
  
  .confirmed-flaw {
    color: #f56c6c;
    font-weight: bold;
  }
  
  .unconfirmed-flaw {
    color: #e6a23c;
    font-weight: bold;
  }
  
  .false-flaw {
    color: #909399;
    font-weight: bold;
  }
  
  .flaw-table {
    width: 100%;
    border-collapse: collapse;
  }
  
  .flaw-table th,
  .flaw-table td {
    padding: 8px 12px;
    border: 1px solid #eee;
    text-align: left;
    font-size: 13px;
  }
  
  .flaw-table th {
    background: #fafafa;
    font-weight: bold;
  }
  
  .flaw-table tbody tr.confirmed {
    background: #fef0f0;
  }
  
  .flaw-table tbody tr.unconfirmed {
    background: #fdf6ec;
  }
  
  .flaw-table tbody tr.false {
    background: #f4f4f5;
  }
  
  .link {
    color: #409eff;
    text-decoration: none;
    cursor: pointer;
  }
  
  .link:hover {
    text-decoration: underline;
  }
  
  .empty-data {
    text-align: center;
    color: #909399;
    padding: 30px 0;
  }
  
  .modal-body {
    display: flex;
    gap: 20px;
  }
  
  .modal-image {
    width: 800px;
    height: 600px;
    background: #000;
    display: flex;
    align-items: center;
    justify-content: center;
    
    .flaw-detail-image {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
    
    .no-image {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #909399;
      
      .el-icon {
        font-size: 48px;
        margin-bottom: 16px;
      }
    }
  }
  
  .modal-info {
    width: 300px;
  }
}
</style>
