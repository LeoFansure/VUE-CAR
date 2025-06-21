<template>
  <div class="task-detail-container">
    <div class="page-header">
      <div class="breadcrumb">
        <span>地铁隧道巡线车智能巡检系统</span>
        <el-icon class="breadcrumb-separator"><ArrowRight /></el-icon>
        <span>任务详情</span>
      </div>
      <el-button 
        class="back-btn" 
        @click="$router.push('/taskView')"
        :icon="Back"
      >
        返回列表
      </el-button>
    </div>

    <div class="content-section">
      <el-card class="task-info-card">
        <template #header>
          <div class="card-header">
            <span>任务基本信息</span>
          </div>
        </template>
        <div class="task-info">
          <p><strong>任务编号：</strong>{{ taskInfo.taskCode || '暂无数据' }}</p>
          <p><strong>任务名称：</strong>{{ taskInfo.taskName || '暂无数据' }}</p>
          <p><strong>起始地点：</strong>{{ taskInfo.startPos || '暂无数据' }}</p>
          <p><strong>任务距离：</strong>{{ taskInfo.taskTrip || '暂无数据' }}</p>
          <p><strong>创建人：</strong>{{ taskInfo.creator || '暂无数据' }}</p>
          <p><strong>执行人：</strong>{{ taskInfo.executor || '暂无数据' }}</p>
          <p><strong>执行时间：</strong>{{ formatDateTime(taskInfo.execTime) }}</p>
          <p><strong>完成时间：</strong>{{ formatDateTime(taskInfo.endTime) }}</p>
          <p><strong>任务状态：</strong>
            <el-tag 
              :type="getStatusTagType(taskInfo.taskStatus)"
              effect="plain"
            >
              {{ taskInfo.taskStatus || '暂无数据' }}
            </el-tag>
          </p>
        </div>
      </el-card>

      <el-card class="flaw-list-card">
        <template #header>
          <div class="card-header">
            <span>故障列表</span>
          </div>
        </template>
        <div class="flaw-list">
          <el-empty v-if="!flawList.length" description="暂无故障数据" />
          <div v-else class="flaw-items">
            <div 
              v-for="flaw in flawList" 
              :key="flaw.id"
              class="flaw-item"
            >
              <div class="flaw-header">
                <span class="flaw-type">{{ flaw.flawType }}</span>
                <span class="flaw-time">{{ formatDateTime(flaw.createTime) }}</span>
              </div>
              <div class="flaw-content">
                <p><strong>位置：</strong>{{ flaw.position }}</p>
                <p><strong>描述：</strong>{{ flaw.description }}</p>
                <p><strong>状态：</strong>
                  <el-tag 
                    :type="flaw.status === '已确认' ? 'success' : 'warning'"
                    size="small"
                  >
                    {{ flaw.status }}
                  </el-tag>
                </p>
              </div>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowRight, Back } from '@element-plus/icons-vue'
import { getTask } from '@/api/task'
import { getFlawList } from '@/api/flaw'
import { formatDateTime } from '@/utils/common'

const route = useRoute()

// 响应式数据
const taskInfo = ref({})
const flawList = ref([])

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

// 加载任务详情
const loadTaskDetail = async () => {
  try {
    const taskId = route.query.id
    if (!taskId) {
      ElMessage.error('任务ID不存在')
      return
    }
    
    const response = await getTask(taskId)
    taskInfo.value = response.data || {}
    
    // 加载故障列表
    const flawResponse = await getFlawList(taskId)
    flawList.value = flawResponse.data || []
    
  } catch (error) {
    ElMessage.error('加载任务详情失败')
    console.error(error)
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
      color: #606266;
    }
  }
  
  .content-section {
    display: grid;
    gap: 24px;
    
    .task-info-card,
    .flaw-list-card {
      .card-header {
        font-weight: 600;
        color: #303133;
      }
    }
    
    .task-info {
      p {
        margin: 12px 0;
        line-height: 1.6;
        
        strong {
          color: #303133;
          margin-right: 8px;
        }
      }
    }
    
    .flaw-list {
      .flaw-items {
        .flaw-item {
          border: 1px solid #ebeef5;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
          background: #fafafa;
          
          &:last-child {
            margin-bottom: 0;
          }
          
          .flaw-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            
            .flaw-type {
              font-weight: 600;
              color: #303133;
            }
            
            .flaw-time {
              color: #909399;
              font-size: 14px;
            }
          }
          
          .flaw-content {
            p {
              margin: 8px 0;
              line-height: 1.5;
              
              strong {
                color: #606266;
                margin-right: 8px;
              }
            }
          }
        }
      }
    }
  }
}
</style>