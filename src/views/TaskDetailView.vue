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
                  {{ row.flawDistance }}m
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
                <el-select v-model="currentFlaw.status" style="width: 120px">
                  <el-option label="已确认故障" value="confirmed" />
                  <el-option label="疑似故障" value="suspected" />
                  <el-option label="误报" value="false_alarm" />
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
    </div>
  </template>
  
  <script setup>
  import { ref, reactive, onMounted } from 'vue'
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
  import { getTask } from '@/api/task'
  import { listFlaw, updateFlaw, checkAllConfirmed } from '@/api/flaw'
  
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
    const totalDistance = taskDetail.value.taskTrip || 0
    if (totalDistance === 0) return '0%'
    const position = (flaw.flawDistance / totalDistance) * 100
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
    currentFlaw.value = JSON.parse(JSON.stringify(flaw))
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
    if (!currentFlaw.value) return
    
    try {
      saving.value = true
      const flawData = {
        id: currentFlaw.value.id,
        status: currentFlaw.value.status
      }
      await updateFlaw(flawData)
      
      // 更新本地数据
      const index = flawList.value.findIndex(item => item.id === currentFlaw.value.id)
      if (index !== -1) {
        flawList.value[index] = { ...flawList.value[index], status: currentFlaw.value.status }
      }
      
      ElMessage.success('故障状态更新成功')
      
      // 检查是否所有故障都已确认
      const { data: allConfirmed } = await checkAllConfirmed(taskDetail.value.id)
      if (allConfirmed) {
        ElMessage.success('所有故障已确认完成')
      }
    } catch (error) {
      ElMessage.error('故障状态更新失败')
      console.error(error)
    } finally {
      saving.value = false
    }
  }
  
  // 更新故障备注
  const updateFlawRemark = async (flawId, remark) => {
    try {
      saving.value = true
      const flawData = {
        id: flawId,
        remark: remark
      }
      await updateFlaw(flawData)
      
      // 更新本地数据
      const index = flawList.value.findIndex(item => item.id === flawId)
      if (index !== -1) {
        flawList.value[index] = { ...flawList.value[index], remark }
      }
      
      ElMessage.success('故障备注更新成功')
    } catch (error) {
      ElMessage.error('故障备注更新失败')
      console.error(error)
    } finally {
      saving.value = false
    }
  }
  
  // 保存故障信息
  const saveFlawInfo = async () => {
    if (!currentFlaw.value) return
    
    try {
      saving.value = true
      
      const flawData = {
        id: currentFlaw.value.id,
        status: currentFlaw.value.status,
        flawDesc: currentFlaw.value.flawDesc,
        remark: currentFlaw.value.remark
      }
      
      await updateFlaw(flawData)
      
      // 更新本地数据
      const index = flawList.value.findIndex(item => item.id === currentFlaw.value.id)
      if (index !== -1) {
        flawList.value[index] = { 
          ...flawList.value[index], 
          status: currentFlaw.value.status,
          flawDesc: currentFlaw.value.flawDesc,
          remark: currentFlaw.value.remark
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
    currentFlaw.value = null
  }
  
  // 加载任务详情
  const loadTaskDetail = async () => {
    const taskId = route.query.id
    
    if (!taskId) {
      ElMessage.error('任务ID不能为空')
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
      const { data } = await listFlaw({ taskId })
      flawList.value = data
    } catch (error) {
      ElMessage.error('获取故障列表失败')
      console.error(error)
    } finally {
      tableLoading.value = false
    }
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