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
            <div class="subtitle">(当前查看: {{ currentFlaw ? currentFlaw.flawName : '隧道壁面裂缝' }})</div>
          </div>
          <div class="image-display" v-loading="imageLoading">
            <img 
              v-if="currentFlaw && currentFlaw.imageUrl" 
              :src="currentFlaw.imageUrl" 
              alt="故障图片"
              @click="previewImage(currentFlaw.imageUrl)"
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
              <div class="info-value">{{ taskDetail.taskCode || 'TASK20231201001' }}</div>
            </div>
            <div class="info-item">
              <div class="info-label"><el-icon><Calendar /></el-icon> 巡视开始时间</div>
              <div class="info-value">{{ formatDateTime(taskDetail.execTime) || '2023-12-01 09:00:00' }}</div>
            </div>
            <div class="info-item">
              <div class="info-label"><el-icon><Calendar /></el-icon> 巡视结束时间</div>
              <div class="info-value">{{ formatDateTime(taskDetail.endTime) || '2023-12-01 10:30:00' }}</div>
            </div>
            <div class="info-item">
              <div class="info-label"><el-icon><Location /></el-icon> 巡行路线距离</div>
              <div class="info-value">{{ taskDetail.taskTrip || '500' }} 米</div>
            </div>
            <div class="info-item">
              <div class="info-label"><el-icon><Warning /></el-icon> 故障总计</div>
              <div class="info-value">{{ flawList.length || 4 }}</div>
            </div>
            <div class="info-item">
              <div class="info-label"><el-icon><Check /></el-icon> 已确定故障</div>
              <div class="info-value">{{ getConfirmedFlawCount() || 2 }}</div>
            </div>
            <div class="info-item">
              <div class="info-label"><el-icon><QuestionFilled /></el-icon> 疑似故障</div>
              <div class="info-value">{{ getUnconfirmedFlawCount() || 1 }}</div>
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
          >
            <el-table-column label="故障名称" min-width="120">
              <template #default="{ row }">
                <div class="flaw-name">
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
                {{ row.flawPosition }}m
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" align="center">
              <template #default="{ row }">
                <el-button 
                  type="primary" 
                  size="small"
                  @click.stop="openFlawDialog(row)"
                >
                  详情
                </el-button>
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
          @click="selectFlaw(flaw)"
        >
          <el-tooltip 
            :content="flaw.flawName + ' - ' + flaw.flawPosition + 'm'" 
            placement="top"
          >
            <div class="marker-dot"></div>
          </el-tooltip>
        </div>
      </div>
      <div class="distance-label">{{ taskDetail.taskTrip || '500' }}m</div>
    </div>

    <!-- 故障详情弹窗 -->
    <el-dialog
      v-model="showFlawDialog"
      title="故障详情"
      width="600px"
    >
      <div v-if="currentFlaw" class="flaw-dialog-content">
        <div class="flaw-image">
          <img 
            v-if="currentFlaw.imageUrl" 
            :src="currentFlaw.imageUrl" 
            alt="故障图片"
            @click="previewImage(currentFlaw.imageUrl)"
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
            <span class="info-value">{{ currentFlaw.flawPosition }}m</span>
          </div>
          <div class="info-row">
            <span class="info-label">故障状态:</span>
            <span class="info-value">
              <el-select v-model="currentFlaw.status" style="width: 120px">
                <el-option label="已确认故障" value="confirmed" />
                <el-option label="疑似故障" value="suspected" />
                <el-option label="误报" value="false_alarm" />
              </el-select>
            </span>
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
          <el-button @click="showFlawDialog = false">取消</el-button>
          <el-button type="primary" @click="confirmFlaw">确认</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 图片预览 -->
    <el-image-viewer
      v-if="showImageViewer"
      :url-list="[previewImageUrl]"
      @close="showImageViewer = false"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
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

const router = useRouter()

// 响应式数据
const taskDetail = ref({})
const flawList = ref([
  {
    id: 1,
    flawName: '隧道壁面裂缝',
    flawType: '结构缺陷',
    flawPosition: 100,
    imageUrl: 'https://example.com/flaw1.jpg',
    status: 'confirmed',
    remark: '壁面出现明显裂缝，需要修复'
  },
  {
    id: 2,
    flawName: '渗水点',
    flawType: '渗漏问题',
    flawPosition: 225,
    imageUrl: 'https://example.com/flaw2.jpg',
    status: 'confirmed',
    remark: '隧道顶部有渗水现象'
  },
  {
    id: 3,
    flawName: '设备损坏',
    flawType: '设备故障',
    flawPosition: 350,
    imageUrl: 'https://example.com/flaw3.jpg',
    status: 'suspected',
    remark: '可能存在设备损坏，需要进一步确认'
  },
  {
    id: 4,
    flawName: '螺栓松动',
    flawType: '设施损伤',
    flawPosition: 425,
    imageUrl: 'https://example.com/flaw4.jpg',
    status: 'false_alarm',
    remark: '经检查确认为误报'
  }
])
const currentFlaw = ref(null)
const showFlawDialog = ref(false)
const imageLoading = ref(false)
const showImageViewer = ref(false)
const previewImageUrl = ref('')

// 获取已确认故障数量
const getConfirmedFlawCount = () => {
  return flawList.value.filter(flaw => flaw.status === 'confirmed').length
}

// 获取疑似故障数量
const getUnconfirmedFlawCount = () => {
  return flawList.value.filter(flaw => flaw.status === 'suspected').length
}

// 计算故障在进度条上的位置
const calculateFlawPosition = (flaw) => {
  const totalDistance = taskDetail.value.taskTrip || 500
  const position = (flaw.flawPosition / totalDistance) * 100
  return `${position}%`
}

// 获取故障标记的样式类
const getFlawMarkerClass = (flaw) => {
  if (flaw.status === 'confirmed') {
    return 'confirmed'
  } else if (flaw.status === 'suspected') {
    return 'suspected'
  } else {
    return 'false-alarm'
  }
}

// 选择故障
const selectFlaw = (flaw) => {
  imageLoading.value = true
  currentFlaw.value = flaw
  
  // 模拟图片加载
  setTimeout(() => {
    imageLoading.value = false
  }, 500)
}

// 打开故障详情弹窗
const openFlawDialog = (flaw) => {
  currentFlaw.value = JSON.parse(JSON.stringify(flaw))
  showFlawDialog.value = true
}

// 确认故障
const confirmFlaw = async () => {
  try {
    // 这里应该调用API更新故障信息
    // await updateFlawRemark(currentFlaw.value.id, currentFlaw.value)
    
    // 更新本地数据
    const index = flawList.value.findIndex(item => item.id === currentFlaw.value.id)
    if (index !== -1) {
      flawList.value[index] = { ...currentFlaw.value }
    }
    
    ElMessage.success('故障信息更新成功')
    showFlawDialog.value = false
  } catch (error) {
    ElMessage.error('故障信息更新失败')
    console.error(error)
  }
}

// 预览图片
const previewImage = (imageUrl) => {
  previewImageUrl.value = imageUrl
  showImageViewer.value = true
}

// 加载任务详情
const loadTaskDetail = async () => {
  const taskId = route.query.id
  
  if (!taskId) {
    ElMessage.error('任务ID不能为空')
    return
  }
  
  try {
    // 这里应该调用API获取任务详情
    // const response = await getTaskDetail(taskId)
    // taskDetail.value = response.data
    
    // 模拟数据
    taskDetail.value = {
      id: taskId,
      taskCode: 'TASK20231201001',
      taskName: '隧道巡检任务',
      startPos: '起始点',
      taskTrip: 500,
      creator: '管理员',
      executor: '操作员A',
      execTime: '2023-12-01 09:00:00',
      endTime: '2023-12-01 10:30:00',
      taskStatus: '已完成'
    }
    
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
    // 这里应该调用API获取故障列表
    // const response = await getFlawList(taskId)
    // flawList.value = response.data
    
    // 使用模拟数据，已在上面定义
  } catch (error) {
    ElMessage.error('获取故障列表失败')
    console.error(error)
  }
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 页面加载时获取数据
onMounted(() => {
  loadTaskDetail()
})
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