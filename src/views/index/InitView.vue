<template>
  <div class="init-container">
    <div class="header">
      <h1>AGV智能巡检系统</h1>
      <p class="subtitle">请先完成小车系统自检，确保各项功能正常</p>
    </div>
    
    <div class="check-list">
      <div 
        v-for="(check, index) in checkItems" 
        :key="index"
        class="check-item"
        :class="{ expanded: check.expanded }"
        @click="toggleExpand(index)"
      >
        <div class="check-header">
          <div class="check-icon" :class="getIconClass(check.status)">
            <el-icon v-if="check.status === 'loading'" class="rotating">
              <Loading />
            </el-icon>
            <el-icon v-else-if="check.status === 'success'">
              <Check />
            </el-icon>
            <el-icon v-else-if="check.status === 'error'">
              <Close />
            </el-icon>
            <span v-else>{{ index + 1 }}</span>
          </div>
          <span class="check-title">{{ check.title }}</span>
          <div class="check-status">
            <span v-if="check.status === 'loading'" class="status-text loading">检查中...</span>
            <span v-else-if="check.status === 'success'" class="status-text success">正常</span>
            <span v-else-if="check.status === 'error'" class="status-text error">异常</span>
            <span v-else class="status-text pending">等待检查</span>
          </div>
        </div>
        <div v-if="check.expanded && check.details" class="check-content">
          <div class="details-content">
            {{ check.details }}
          </div>
        </div>
      </div>
    </div>

    <div class="operate-btn-group">
      <el-button 
        circle 
        size="large" 
        @click="showSettings = true"
        :icon="Setting"
      />
      <el-button 
        type="primary" 
        size="large"
        @click="goTaskView"
      >
        进入任务列表
      </el-button>
      <el-button 
        type="warning" 
        size="large"
        @click="startCheck"
        :loading="isChecking"
      >
        重新检测
      </el-button>
    </div>

    <!-- 设置弹窗 -->
    <el-dialog 
      v-model="showSettings" 
      title="系统设置" 
      width="60%"
      :before-close="handleCloseSettings"
    >
      <SettingsView :isEmbedded="true" @save="handleSettingsSave" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Loading, Check, Close, Setting } from '@element-plus/icons-vue'
import { checkFs, checkDb, checkAgv, checkCam } from '@/api/car/system'
import SettingsView from '@/views/car/SettingsView.vue'

const router = useRouter()

// 响应式数据
const showSettings = ref(false)
const isChecking = ref(false)

// 检查项配置（仅小车系统相关）
const checkItems = reactive([
  {
    title: '检查文件系统可用性',
    status: 'pending',
    details: '请确保小车本地文件系统可用。',
    expanded: false,
    checkFn: checkFs
  },
  {
    title: '检查数据库连接',
    status: 'pending',
    details: '请确保小车本地数据库服务已启动。',
    expanded: false,
    checkFn: checkDb
  },
  {
    title: '检查AGV连接',
    status: 'pending',
    details: '请检查小车AGV硬件连接是否正常。',
    expanded: false,
    checkFn: checkAgv
  },
  {
    title: '检查摄像头连接',
    status: 'pending',
    details: '请检查小车摄像头设备及网络连接。',
    expanded: false,
    checkFn: checkCam
  }
])

// 计算属性
const allChecksPassed = computed(() => {
  return checkItems.every(item => item.status === 'success')
})

// 获取图标样式类
const getIconClass = (status) => {
  return {
    loading: status === 'loading',
    success: status === 'success', 
    error: status === 'error',
    pending: status === 'pending'
  }
}

// 切换展开状态
const toggleExpand = (index) => {
  checkItems[index].expanded = !checkItems[index].expanded
}

// 开始系统检查
const startCheck = async () => {
  if (isChecking.value) return
  
  isChecking.value = true
  
  // 重置所有检查项状态
  checkItems.forEach(item => {
    item.status = 'pending'
    item.expanded = false
  })

  // 逐个执行检查
  for (let i = 0; i < checkItems.length; i++) {
    const item = checkItems[i]
    item.status = 'loading'
    
    try {
      await item.checkFn()
      item.status = 'success'
      await new Promise(resolve => setTimeout(resolve, 500)) // 延迟500ms显示效果
    } catch (error) {
      item.status = 'error'
      item.expanded = true
      
      // 更新错误详情
      if (error.response?.data?.msg) {
        item.details = error.response.data.msg
      }
    }
  }
  
  isChecking.value = false
  
  // 检查完成提示
  if (allChecksPassed.value) {
    ElMessage.success('系统检查完成，所有小车组件正常运行')
  } else {
    ElMessage.warning('系统检查完成，发现异常项目，请查看详情')
  }
}

// 进入任务列表
const goTaskView = () => {
  router.push({ name: 'taskView' })
}

// 关闭设置弹窗
const handleCloseSettings = () => {
  showSettings.value = false
}

// 设置保存回调
const handleSettingsSave = () => {
  showSettings.value = false
  ElMessage.success('设置已保存，请重新进行系统检查')
  // 设置保存后重新检查
  setTimeout(() => {
    startCheck()
  }, 1000)
}

// 页面加载时自动开始检查
onMounted(() => {
  startCheck()
})
</script>

<style lang="scss" scoped>
.init-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  
  .header {
    text-align: center;
    margin-bottom: 60px;
    
    h1 {
      font-size: 48px;
      color: white;
      margin: 0 0 16px 0;
      font-weight: 300;
      text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
    
    .subtitle {
      font-size: 18px;
      color: rgba(255,255,255,0.9);
      margin: 0;
    }
  }
  
  .check-list {
    width: 100%;
    max-width: 800px;
    margin-bottom: 50px;
  }
  
  .check-item {
    background: white;
    border-radius: 12px;
    margin-bottom: 16px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    transition: all 0.3s ease;
    cursor: pointer;
    
    &:hover {
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
      transform: translateY(-2px);
    }
    
    .check-header {
      padding: 24px;
      display: flex;
      align-items: center;
      
      .check-icon {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 20px;
        font-size: 16px;
        font-weight: bold;
        transition: all 0.3s ease;
        
        &.pending {
          background: #f5f5f5;
          color: #999;
          border: 2px solid #ddd;
        }
        
        &.loading {
          background: #e8f4fd;
          color: #409eff;
          border: 2px solid #409eff;
        }
        
        &.success {
          background: #f0f9ff;
          color: #67c23a;
          border: 2px solid #67c23a;
        }
        
        &.error {
          background: #fef0f0;
          color: #f56c6c;
          border: 2px solid #f56c6c;
        }
      }
      
      .check-title {
        flex: 1;
        font-size: 16px;
        color: #303133;
        font-weight: 500;
      }
      
      .check-status {
        .status-text {
          font-size: 14px;
          padding: 4px 12px;
          border-radius: 20px;
          
          &.pending {
            background: #f4f4f5;
            color: #909399;
          }
          
          &.loading {
            background: #e8f4fd;
            color: #409eff;
          }
          
          &.success {
            background: #f0f9ff;
            color: #67c23a;
          }
          
          &.error {
            background: #fef0f0;
            color: #f56c6c;
          }
        }
      }
    }
    
    .check-content {
      border-top: 1px solid #ebeef5;
      padding: 20px 24px;
      background: #fafafa;
      border-radius: 0 0 12px 12px;
      
      .details-content {
        color: #606266;
        font-size: 14px;
        line-height: 1.6;
      }
    }
  }
  
  .operate-btn-group {
    display: flex;
    gap: 20px;
    align-items: center;
    flex-wrap: wrap;
    justify-content: center;
    
    .el-button {
      min-width: 140px;
      height: 50px;
      font-size: 16px;
      font-weight: 500;
      border-radius: 8px;
      transition: all 0.3s ease;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      }
    }
  }
}

.rotating {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

:deep(.el-dialog) {
  border-radius: 12px;
  
  .el-dialog__header {
    padding: 24px 24px 0;
    
    .el-dialog__title {
      font-size: 20px;
      font-weight: 600;
    }
  }
  
  .el-dialog__body {
    padding: 20px 24px 24px;
  }
}
</style> 