<template>
  <div class="task-detail-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="breadcrumb">
        <span>地铁隧道巡线车智能巡检系统</span>
        <el-icon class="breadcrumb-separator"><ArrowRight /></el-icon>
        <span>任务列表</span>
        <el-icon class="breadcrumb-separator"><ArrowRight /></el-icon>
        <span>任务详情</span>
      </div>
      <el-button 
        class="back-btn" 
        @click="goBack"
      >
        <el-icon><Back /></el-icon>
        返回
      </el-button>
    </div>

    <div class="task-detail-content">
      <!-- 左侧故障图片显示区域 -->
      <div class="fault-image-area">
        <div class="image-container">
          <div class="image-title">
            故障图片显示区域
            <div class="subtitle">(当前查看: {{ currentFlaw ? currentFlaw.flawName : '请选择故障' }})</div>
          </div>
          <div class="image-display" v-loading="imageLoading">
            <img 
              v-if="currentFlaw && currentFlaw.flawImageUrl" 
              :src="currentFlaw.flawImageUrl" 
              alt="故障图片"
              @click="previewImage(currentFlaw.flawImageUrl)"
            />
            <div v-else class="no-image">
              <el-icon><Picture /></el-icon>
              <span>暂无图片</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧任务信息和故障列表 -->
      <div class="task-info-area">
        <div class="task-info-card">
          <h2 class="section-title">任务信息</h2>
          <div class="info-list">
            <div class="info-item">
              <div class="info-label"><el-icon><Ticket /></el-icon> 巡视任务编号</div>
              <div class="info-value">{{ taskDetail.taskCode }}</div>
            </div>
            <div class="info-item">
              <div class="info-label"><el-icon><Calendar /></el-icon> 巡视开始时间</div>
              <div class="info-value">{{ formatDateTime(taskDetail.execTime) }}</div>
            </div>
            <div class="info-item">
              <div class="info-label"><el-icon><Calendar /></el-icon> 巡视结束时间</div>
              <div class="info-value">{{ formatDateTime(taskDetail.endTime) }}</div>
            </div>
            <div class="info-item">
              <div class="info-label"><el-icon><Location /></el-icon> 巡行路线距离</div>
              <div class="info-value">{{ taskDetail.taskTrip }} 米</div>
            </div>
            <div class="info-item">
              <div class="info-label"><el-icon><Warning /></el-icon> 故障总计</div>
              <div class="info-value">{{ flawList.length }}</div>
            </div>
            <div class="info-item">
              <div class="info-label"><el-icon><Check /></el-icon> 已确定故障</div>
              <div class="info-value">{{ getConfirmedFlawCount() }}</div>
            </div>
            <div class="info-item">
              <div class="info-label"><el-icon><QuestionFilled /></el-icon> 疑似故障</div>
              <div class="info-value">{{ getUnconfirmedFlawCount() }}</div>
            </div>
          </div>
        </div>

        <div class="fault-list-card">
          <h2 class="section-title">故障历史</h2>
          <el-table 
            :data="flawList" 
            style="width: 100%"
            :highlight-current-row="true"
            @row-click="selectFlaw"
            v-loading="tableLoading"
          >
            <el-table-column label="故障名称" min-width="120">
              <template #default="{ row }">
                <div class="flaw-name" style="cursor:pointer;color:#409EFF" @click.stop="openFlawDialog(row)">
                  {{ row.flawName }}
                </div>
              </template>
            </el-table-column>
            <el-table-column label="故障类型" width="100">
              <template #default="{ row }">
                {{ row.flawType }}
              </template>
            </el-table-column>
            <el-table-column label="故障位置" width="100">
              <template #default="{ row }">
                {{ row.flawDistance }}m
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>

    <!-- 底部进度条 -->
    <div class="progress-section">
      <div class="distance-label">0m</div>
      <div class="progress-bar">
        <div 
          v-for="(flaw, index) in flawList" 
          :key="index"
          class="flaw-marker"
          :class="getFlawMarkerClass(flaw)"
          :style="{ left: calculateFlawPosition(flaw) }"
          @click="onFlawMarkerClick(flaw)"
          @dblclick="onFlawMarkerDblClick(flaw)"
        >
          <el-tooltip 
            :content="flaw.flawName + ' - ' + flaw.flawDistance + 'm'" 
            placement="top"
          >
            <div class="marker-dot"></div>
          </el-tooltip>
        </div>
      </div>
      <div class="distance-label">{{ taskDetail.taskTrip }}m</div>
    </div>

    <!-- 故障详情弹窗 -->
    <el-dialog
      v-model="showFlawDialog"
      title="故障详情"
      width="600px"
      :before-close="handleCloseDialog"
    >
      <div v-if="currentFlaw" class="flaw-dialog-content">
        <div class="flaw-image">
          <img 
            v-if="currentFlaw.flawImageUrl" 
            :src="currentFlaw.flawImageUrl" 
            alt="故障图片"
            @click="previewImage(currentFlaw.flawImageUrl)"
          />
          <div v-else class="no-image">
            <el-icon><Picture /></el-icon>
            <span>暂无图片</span>
          </div>
        </div>
        
        <div class="flaw-info">
          <div class="info-row">
            <span class="info-label">故障名称:</span>
            <span class="info-value">{{ currentFlaw.flawName }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">故障类型:</span>
            <span class="info-value">{{ currentFlaw.flawType }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">故障位置:</span>
            <span class="info-value">{{ currentFlaw.flawDistance }}m</span>
          </div>
          <div class="info-row">
            <span class="info-label">故障状态:</span>
            <span class="info-value">
              <el-select v-model="currentFlaw.confirmed" style="width: 120px">
                <el-option label="故障属实" :value="true" />
                <el-option label="不是故障" :value="false" />
              </el-select>
            </span>
          </div>
          <div class="info-row">
            <span class="info-label">故障描述:</span>
            <div class="info-value">
              <el-input
                v-model="currentFlaw.flawDesc"
                type="textarea"
                :rows="2"
                placeholder="请输入故障描述"
              />
            </div>
          </div>
          <div class="info-row">
            <span class="info-label">故障备注:</span>
            <div class="info-value remark-area">
              <el-input
                v-model="currentFlaw.remark"
                type="textarea"
                :rows="3"
                placeholder="请输入故障备注"
              />
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCloseDialog">取消</el-button>
          <el-button type="primary" @click="saveFlawInfo" :loading="saving">确认</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 图片预览 -->
    <el-image-viewer
      v-if="showImageViewer"
      :url-list="[previewImageUrl]"
      @close="showImageViewer = false"
    />

    <!-- 任务列表弹窗 -->
    <el-dialog
      v-model="showTaskListDialog"
      title="选择任务"
      width="700px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <el-table
        :data="taskList"
        style="width: 100%"
        v-loading="taskListLoading"
        @row-dblclick="chooseTask"
      >
        <el-table-column prop="taskCode" label="任务编号" width="140" />
        <el-table-column label="开始时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.execTime) }}
          </template>
        </el-table-column>
        <el-table-column label="距离" width="100">
          <template #default="{ row }">
            {{ row.taskTrip }}m
          </template>
        </el-table-column>
        <el-table-column label="任务状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.taskStatus === '已完成' ? 'success' : (row.taskStatus === '待上传' ? 'warning' : 'info')">
              {{ row.taskStatus }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" align="center">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click.stop="chooseTask(row)">选择</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  ArrowRight, 
  Back, 
  Picture, 
  Ticket, 
  Calendar, 
  Location, 
  Warning,
  Check,
  QuestionFilled
} from '@element-plus/icons-vue'
import { formatDateTime } from '@/utils/common'
import { getTask, listTask } from '@/api/car/task'
import { listFlaw, updateFlaw, checkAllConfirmed } from '@/api/car/flaw'

const route = useRoute()
const router = useRouter()

// 响应式数据
const taskDetail = ref({})
const flawList = ref([])
const currentFlaw = ref(null)
const showFlawDialog = ref(false)
const imageLoading = ref(false)
const tableLoading = ref(false)
const saving = ref(false)
const showImageViewer = ref(false)
const previewImageUrl = ref('')

// 任务选择弹窗相关数据
const taskList = ref([])
const showTaskListDialog = ref(false)
const taskListLoading = ref(false)

// 图片基础地址（根据实际后端配置修改）
const baseImageUrl = 'http://192.168.2.57/prod-api/file/'

// 获取已确认故障数量
const getConfirmedFlawCount = () => {
  return flawList.value.filter(flaw => flaw.confirmed === true).length
}

// 获取疑似故障数量
const getUnconfirmedFlawCount = () => {
  return flawList.value.filter(flaw => flaw.confirmed === null).length
}

// 计算故障在进度条上的位置
const calculateFlawPosition = (flaw) => {
  const totalDistance = taskDetail.value.taskTrip || 0
  if (totalDistance === 0) return '0%'
  const position = (flaw.flawDistance / totalDistance) * 100
  return `${position}%`
}

// 获取故障标记的样式类
const getFlawMarkerClass = (flaw) => {
    if (flaw.confirmed === true) {
      return 'confirmed'
    } else if (flaw.confirmed === false) {
      return 'false-alarm'
    } else {
      return 'suspected'
    }
}

// 获取完整图片url，只用 flawImage 字段
const getFlawImageUrl = (flaw) => {
  if (flaw.flawImage) {
    // 避免重复斜杠
    return baseImageUrl.replace(/\/$/, '') + '/' + flaw.flawImageUrl.replace(/^\//, '')
  }
  return ''
}

// 选择故障
const selectFlaw = (flaw) => {
  imageLoading.value = true
  currentFlaw.value = { ...JSON.parse(JSON.stringify(flaw)), flawImageUrl: getFlawImageUrl(flaw) }
  setTimeout(() => {
    imageLoading.value = false
  }, 500)
}

// 打开故障详情弹窗
const openFlawDialog = (flaw) => {
  currentFlaw.value = {
    id: flaw.id,
    flawType: flaw.flawType,
    flawName: flaw.flawName,
    flawDesc: flaw.flawDesc,
    flawDistance: flaw.flawDistance,
    remark: flaw.remark,
    confirmed: flaw.confirmed,
    flawImageUrl: getFlawImageUrl(flaw)
  }
  showFlawDialog.value = true
}

// 保存故障信息
const saveFlawInfo = async () => {
  if (!currentFlaw.value) return
  try {
    saving.value = true
    const flawData = {
      id: currentFlaw.value.id,
      flawType: currentFlaw.value.flawType,
      flawName: currentFlaw.value.flawName,
      flawDesc: currentFlaw.value.flawDesc,
      confirmed: currentFlaw.value.confirmed,
      remark: currentFlaw.value.remark
    }
    await updateFlaw(flawData)
    // 更新本地数据
    const index = flawList.value.findIndex(item => item.id === currentFlaw.value.id)
    if (index !== -1) {
      flawList.value[index] = {
        ...flawList.value[index],
        ...flawData
      }
    }
    ElMessage.success('故障信息更新成功')
    showFlawDialog.value = false
  } catch (error) {
    ElMessage.error('故障信息更新失败')
    console.error(error)
  } finally {
    saving.value = false
  }
}

// 预览图片
const previewImage = (imageUrl) => {
  if (!imageUrl) return
  previewImageUrl.value = imageUrl
  console.log('当前选中故障 currentFlaw:', imageUrl)
  showImageViewer.value = true
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 关闭弹窗
const handleCloseDialog = () => {
  if (saving.value) return
  showFlawDialog.value = false
}

// 加载任务列表
const loadTaskList = async () => {
  try {
    taskListLoading.value = true
    const response = await listTask({ pageNum: 1, pageSize: 1000 })
    if (response.code === 200) {
      taskList.value = response.rows || response.data || []
    }
  } catch (error) {
    ElMessage.error('获取任务列表失败')
    console.error(error)
  } finally {
    taskListLoading.value = false
  }
}

// 选择任务
const chooseTask = (task) => {
  if (!task || !task.id) return
  if (task.taskStatus === '待巡视' || task.taskStatus === '巡视中') {
    ElMessage.warning('该任务未完成，不能选择')
    return
  }
  showTaskListDialog.value = false
  router.push({ name: 'taskDetailView', query: { id: task.id } })
}

// 加载任务详情
const loadTaskDetail = async () => {
  const taskId = route.query.id

  // 如果没有传入任务 ID，则弹出任务选择窗口
  if (!taskId) {
    await loadTaskList()
    showTaskListDialog.value = true
    return
  }

  try {
    const { data } = await getTask(taskId)
    taskDetail.value = data
    
    // 加载故障列表
    await loadFlawList(taskId)
    
    // 默认选中第一个故障
    if (flawList.value.length > 0) {
      selectFlaw(flawList.value[0])
    }
    
  } catch (error) {
    ElMessage.error('获取任务详情失败')
    console.error(error)
  }
}

// 加载故障列表
const loadFlawList = async (taskId) => {
  try {
    tableLoading.value = true
    const response = await listFlaw({ pageNum: 1, pageSize: 100 })
    if (response.code === 200) {
      // 后端分页结构返回 rows，否则可能直接返回 data
      const allFlaws = response.rows || response.data || []
      flawList.value = allFlaws.filter(flaw => flaw.taskId == taskId)
    }
  } catch (error) {
    ElMessage.error('获取故障列表失败')
    console.error(error)
  } finally {
    tableLoading.value = false
  }
}

// 监听路由参数变化，动态加载任务详情
watch(
  () => route.query.id,
  (newId, oldId) => {
    if (newId && newId !== oldId) {
      loadTaskDetail()
    }
  }
)

// 页面加载时获取数据
onMounted(() => {
  loadTaskDetail()
})

let clickTimer = null
const onFlawMarkerClick = (flaw) => {
  if (clickTimer) clearTimeout(clickTimer)
  clickTimer = setTimeout(() => {
    selectFlaw(flaw)
    clickTimer = null
  }, 250)
}
const onFlawMarkerDblClick = (flaw) => {
  if (clickTimer) clearTimeout(clickTimer)
  openFlawDialog(flaw)
}
</script>

<style lang="scss" scoped>
.task-detail-container {
  padding: 24px;
  background: #f5f5f5;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  
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
  }
  
  .task-detail-content {
    display: flex;
    gap: 24px;
    flex: 1;
    margin-bottom: 24px;
    
    .fault-image-area {
      flex: 1;
      background: #000;
      border-radius: 8px;
      overflow: hidden;
      
      .image-container {
        height: 100%;
        display: flex;
        flex-direction: column;
        
        .image-title {
          padding: 16px;
          color: #fff;
          font-size: 18px;
          font-weight: bold;
          background: rgba(0, 0, 0, 0.5);
          
          .subtitle {
            font-size: 14px;
            font-weight: normal;
            margin-top: 4px;
            color: #ccc;
          }
        }
        
        .image-display {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          
          img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
            cursor: pointer;
          }
          
          .no-image {
            display: flex;
            flex-direction: column;
            align-items: center;
            color: #909399;
            
            .el-icon {
              font-size: 64px;
              margin-bottom: 16px;
            }
          }
        }
      }
    }
    
    .task-info-area {
      width: 400px;
      display: flex;
      flex-direction: column;
      gap: 24px;
      
      .task-info-card, .fault-list-card {
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
        padding: 20px;
        
        .section-title {
          margin-top: 0;
          margin-bottom: 16px;
          font-size: 18px;
          font-weight: bold;
          color: #303133;
          border-bottom: 1px solid #ebeef5;
          padding-bottom: 12px;
        }
      }
      
      .task-info-card {
        .info-list {
          .info-item {
            display: flex;
            margin-bottom: 12px;
            
            .info-label {
              width: 140px;
              color: #909399;
              display: flex;
              align-items: center;
              
              .el-icon {
                margin-right: 8px;
              }
            }
            
            .info-value {
              flex: 1;
              color: #303133;
              font-weight: 500;
            }
          }
        }
      }
      
      .fault-list-card {
        flex: 1;
        display: flex;
        flex-direction: column;
        
        .el-table {
          flex: 1;
          
          .flaw-name {
            font-weight: 500;
          }
        }
      }
    }
  }
  
  .progress-section {
    display: flex;
    align-items: center;
    margin-top: auto;
    padding: 16px 0;
    
    .distance-label {
      width: 60px;
      text-align: center;
      color: #606266;
    }
    
    .progress-bar {
      flex: 1;
      height: 12px;
      background: #e4e7ed;
      border-radius: 6px;
      position: relative;
      margin: 0 16px;
      
      .flaw-marker {
        position: absolute;
        transform: translateX(-50%);
        top: -8px;
        cursor: pointer;
        
        .marker-dot {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 2px solid #fff;
        }
        
        &.confirmed .marker-dot {
          background-color: #f56c6c;
        }
        
        &.suspected .marker-dot {
          background-color: #e6a23c;
        }
        
        &.false-alarm .marker-dot {
          background-color: #909399;
        }
      }
    }
  }
}

.flaw-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  
  .flaw-image {
    height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f5f7fa;
    border-radius: 4px;
    overflow: hidden;
    
    img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      cursor: pointer;
    }
    
    .no-image {
      display: flex;
      flex-direction: column;
      align-items: center;
      color: #909399;
      
      .el-icon {
        font-size: 48px;
        margin-bottom: 12px;
      }
    }
  }
  
  .flaw-info {
    .info-row {
      display: flex;
      margin-bottom: 16px;
      
      .info-label {
        width: 100px;
        color: #909399;
      }
      
      .info-value {
        flex: 1;
        
        &.remark-area {
          margin-top: 8px;
        }
      }
    }
  }
}

.dialog-footer {
  text-align: right;
  
  .el-button {
    min-width: 80px;
  }
}
</style>