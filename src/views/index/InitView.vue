<template>
  <div class="init-bg">
    <div class="init-card no-select">
      <div class="header">
        <h1>AGV智能巡检系统</h1>
      </div>
      <el-collapse
        v-model="activeNames"
        class="check-list"
        accordion
        style="width: 100%; margin: 0 auto;"
      >
        <el-collapse-item
          v-for="(check, index) in checkItems"
          :key="index"
          :name="index.toString()"
          :disabled="check.status !== 'error'"
        >
          <template #title>
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
              <span class="check-title" :class="check.status">{{ check.title }}</span>
            </div>
          </template>
          <div class="check-content">
            <div class="details-content">
              {{ check.details }}
            </div>
          </div>
        </el-collapse-item>
      </el-collapse>
      <div class="operate-btn-group">
        <el-button
          circle
          size="large"
          @click="showSettings = true"
          :icon="Setting"
          class="setting-btn"
        />
        <el-button
          type="success"
          size="large"
          :disabled="!allChecksPassed"
          @click="goTaskView"
          class="enter-btn"
        >
          进入系统
        </el-button>
        <el-button
          v-if="!allChecksPassed && !isChecking"
          type="primary"
          size="large"
          @click="startCheck"
          :loading="isChecking"
          class="retry-btn"
        >
          重新检测
        </el-button>
      </div>
      <el-dialog
        v-model="showSettings"
        width="600px"
        :before-close="handleCloseSettings"
      >
        <SettingsView :isEmbedded="true" @save="handleSettingsSave" />
      </el-dialog>
    </div>
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

const showSettings = ref(false)
const isChecking = ref(false)
const activeNames = ref([])

const checkItems = reactive([
  {
    title: '正在检查系统文件完整性',
    status: 'pending',
    details: '请确保小车本地文件系统可用。',
    checkFn: checkFs
  },
  {
    title: '正在检测数据库系统连接',
    status: 'pending',
    details: '请确保小车本地数据库服务已启动。',
    checkFn: checkDb
  },
  {
    title: '正在与车辆控制系统通信',
    status: 'pending',
    details: '请检查小车AGV硬件连接是否正常。',
    checkFn: checkAgv
  },
  {
    title: '正在检测摄像头通道状态',
    status: 'pending',
    details: '请检查摄像头IP及账号密码是否正确。',
    checkFn: checkCam
  }
])

const allChecksPassed = computed(() => {
  return checkItems.every(item => item.status === 'success')
})

const getIconClass = (status) => {
  return {
    loading: status === 'loading',
    success: status === 'success',
    error: status === 'error',
    pending: status === 'pending'
  }
}

const startCheck = async () => {
  if (isChecking.value) return
  isChecking.value = true
  activeNames.value = []
  let firstErrorIndex = null
  checkItems.forEach(item => {
    item.status = 'pending'
  })
  for (let i = 0; i < checkItems.length; i++) {
    const item = checkItems[i]
    item.status = 'loading'
    try {
      await item.checkFn()
      item.status = 'success'
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (error) {
      item.status = 'error'
      if (error.response?.data?.msg) {
        item.details = error.response.data.msg
      }
      if (firstErrorIndex === null) {
        firstErrorIndex = i
      }
    }
  }
  if (firstErrorIndex !== null) {
    activeNames.value = [firstErrorIndex.toString()]
  }
  isChecking.value = false
  if (allChecksPassed.value) {
    ElMessage.success('系统检查完成，所有小车组件正常运行')
  } else {
    ElMessage.warning('系统检查完成，发现异常项目，请查看详情')
  }
}

const goTaskView = () => {
  if (allChecksPassed.value) {
    router.push({ name: 'taskView' })
  }
}

const handleCloseSettings = () => {
  showSettings.value = false
}

const handleSettingsSave = () => {
  showSettings.value = false
  ElMessage.success('设置已保存，请重新进行系统检查')
  setTimeout(() => {
    startCheck()
  }, 1000)
}

onMounted(() => {
  startCheck()
})
</script>

<style lang="scss" scoped>
.init-bg {
  min-height: 100vh;
  width: 100vw;
  background: #f7f7f7;
  display: flex;
  align-items: center;
  justify-content: center;
}
.init-card {
  width: 400px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
  padding: 40px 32px 32px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.header {
  width: 100%;
  text-align: center;
  margin-bottom: 32px;
  h1 {
    font-size: 26px;
    font-weight: 700;
    color: #222;
    margin: 0 0 8px 0;
    letter-spacing: 1px;
  }
}
.check-list {
  width: 100%;
  margin-bottom: 32px;
  .el-collapse-item__header {
    user-select: none;
    background: #fff;
    color: #222;
    font-size: 16px;
    border-radius: 8px;
    border: 1px solid #e5e6eb;
    margin-bottom: 8px;
    padding: 0 20px;
    min-height: 48px;
    display: flex;
    align-items: center;
  }
  .el-collapse-item__wrap {
    background: #fff;
    border-radius: 0 0 8px 8px;
    border: 1px solid #e5e6eb;
    border-top: none;
    margin-bottom: 8px;
  }
}
.check-header {
  display: flex;
  align-items: center;
  .check-icon {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 12px;
    font-size: 16px;
    font-weight: bold;
    transition: all 0.3s ease;
    &.pending, &.loading {
      background: #f5f7fa;
      color: #409eff;
      border: 1.5px solid #dbeafe;
    }
    &.success {
      background: #f6ffed;
      color: #52c41a;
      border: 1.5px solid #b7eb8f;
    }
    &.error {
      background: #fff1f0;
      color: #f5222d;
      border: 1.5px solid #ffa39e;
    }
  }
  .check-title {
    font-size: 16px;
    color: #222;
    font-weight: 500;
    &.error {
      color: #f5222d;
    }
    &.success {
      color: #52c41a;
    }
    &.loading, &.pending {
      color: #409eff;
    }
  }
}
.check-content {
  border-top: 1px solid #ebeef5;
  padding: 12px 20px 12px 36px;
  background: #fafbfc;
  border-radius: 0 0 8px 8px;
  .details-content {
    color: #888;
    font-size: 13px;
    line-height: 1.7;
    white-space: pre-line;
    text-align: left;
  }
}
.operate-btn-group {
  width: 100%;
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: center;
  margin-top: 16px;
  .setting-btn {
    background: #fff;
    border: 1.5px solid #e5e6eb;
    color: #888;
    box-shadow: none;
    margin-right: 8px;
  }
  .enter-btn {
    background: #52c41a;
    border: none;
    color: #fff;
    border-radius: 8px;
    min-width: 110px;
    font-weight: 600;
    letter-spacing: 1px;
    transition: background 0.2s;
  }
  .enter-btn:disabled,
  .enter-btn[disabled] {
    background: #b7ebc6 !important;
    color: #fff !important;
    cursor: not-allowed !important;
    border: none;
  }
  .retry-btn {
    background: #409eff;
    border: none;
    color: #fff;
    border-radius: 8px;
    min-width: 110px;
    font-weight: 600;
    letter-spacing: 1px;
  }
  .el-button.is-circle {
    border-radius: 50%;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
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
.no-select {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
</style> 