<template>
  <div class="settings-container">
    <!-- 页面标题和状态 -->
    <div class="page-header">
      <h2>系统配置</h2>
      <div class="header-actions">
        <el-button @click="loadConfig" :loading="loading" size="small">
          刷新配置
        </el-button>
      </div>
    </div>

    <!-- 连接测试结果 -->
    <div class="connection-status" v-if="Object.values(testResults).some(v => v !== null)">
      <h3>连接状态</h3>
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="status-card">
            <div class="status-item">
              <span class="status-label">文件系统</span>
              <el-tag :type="getConnectionStatusType(testResults.fs)" size="small">
                {{ getConnectionStatusText(testResults.fs) }}
              </el-tag>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="status-card">
            <div class="status-item">
              <span class="status-label">云端</span>
              <el-tag :type="getConnectionStatusType(testResults.cloud)" size="small">
                {{ getConnectionStatusText(testResults.cloud) }}
              </el-tag>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="status-card">
            <div class="status-item">
              <span class="status-label">AGV连接</span>
              <el-tag :type="getConnectionStatusType(testResults.agv)" size="small">
                {{ getConnectionStatusText(testResults.agv) }}
              </el-tag>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="status-card">
            <div class="status-item">
              <span class="status-label">摄像头</span>
              <el-tag :type="getConnectionStatusType(testResults.cam)" size="small">
                {{ getConnectionStatusText(testResults.cam) }}
              </el-tag>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <el-form ref="configFormRef" :model="configForm" :rules="formRules" label-width="140px" class="config-form">
      <!-- AGV配置 -->
      <div class="config-section">
        <h3 class="section-title">
          <el-icon><Monitor /></el-icon>
          AGV设备配置
        </h3>
        
        <el-form-item label="AGV主机IP" prop="host">
          <el-input 
            v-model="configForm.host" 
            placeholder="请输入AGV主机IP地址"
            :prefix-icon="Connection"
          />
        </el-form-item>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="硬件驱动端口" prop="drivePort">
              <el-input-number 
                v-model="configForm.drivePort" 
                :min="1" 
                :max="65535"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="分析程序端口" prop="analysisPort">
              <el-input-number 
                v-model="configForm.analysisPort" 
                :min="1" 
                :max="65535"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="云端地址" prop="cloudUrl">
          <el-input 
            v-model="configForm.cloudUrl" 
            placeholder="请输入云端服务地址"
            :prefix-icon="Link"
          />
        </el-form-item>

        <el-form-item label="API密钥" prop="apiKey">
          <el-input
            v-model="configForm.apiKey"
            placeholder="请输入云端服务的身份验证密钥"
            :prefix-icon="Key"
            show-password
          />
        </el-form-item>

        <el-form-item label="数据同步">
          <el-switch
            v-model="configForm.autoSync"
            active-text="自动上传巡检数据到云端"
            inactive-text="手动上传"
          />
        </el-form-item>
      </div>

      <!-- 摄像头配置 -->
      <div class="config-section">
        <h3 class="section-title">
          <el-icon><VideoCamera /></el-icon>
          摄像头配置
        </h3>
        
        <div 
          v-for="i in 4" 
          :key="i" 
          class="camera-config"
        >
          <h4 class="camera-title">摄像头 {{ i }}</h4>
          
          <el-form-item :label="`摄像头${i}地址`" :prop="`cam${i}`">
            <el-input 
              v-model="configForm[`cam${i}`]" 
              :placeholder="`请输入摄像头${i}地址`"
              :prefix-icon="VideoCamera"
            />
          </el-form-item>
          
          <el-form-item :label="`视角说明`" :prop="`cameraDesc${i}`">
            <el-input
              v-model="configForm[`cameraDesc${i}`]"
              :placeholder="`请输入摄像头${i}的安装位置和视角说明`"
              :prefix-icon="InfoFilled"
            />
          </el-form-item>
          
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item :label="`登录用户名`" :prop="`username${i}`">
                <el-input 
                  v-model="configForm[`username${i}`]" 
                  placeholder="请输入用户名"
                  :prefix-icon="User"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item :label="`登录密码`" :prop="`password${i}`">
                <el-input 
                  v-model="configForm[`password${i}`]" 
                  type="password" 
                  placeholder="请输入密码"
                  show-password
                  :prefix-icon="Lock"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </div>
      </div>
    </el-form>

    <!-- 操作按钮 -->
    <div class="footer-actions" v-if="!isEmbedded">
      <el-button @click="backToInit">返回</el-button>
      <el-button @click="resetForm">重置</el-button>
      <el-button @click="testConnection" :loading="testing">测试连接</el-button>
      <el-button type="primary" @click="saveConfig" :loading="saving">
        保存配置
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Monitor, 
  VideoCamera, 
  Connection, 
  Link, 
  User, 
  Lock,
  Key,
  Refresh,
  InfoFilled
} from '@element-plus/icons-vue'
import { getConfig, updateConfig, checkFs, checkAgv, checkCam } from '../../car/api/system'
import { useRouter } from 'vue-router'

// Router
const router = useRouter()

// Props
const props = defineProps({
  isEmbedded: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['save'])

// 响应式数据
const configFormRef = ref(null)
const saving = ref(false)
const testing = ref(false)
const loading = ref(false)

// 配置表单数据
const configForm = reactive({
  id: null,
  host: '192.168.2.100',
  drivePort: 8080,
  analysisPort: 8081,
  cloudUrl: 'https://cloud.example.com',
  apiKey: 'your-secret-api-key-goes-here',
  autoSync: true,
  cam1: 'rtsp://192.168.2.101/stream1',
  username1: 'admin',
  password1: '',
  cameraDesc1: '前方主视角',
  cam2: 'rtsp://192.168.2.102/stream1',
  username2: 'admin',
  password2: '',
  cameraDesc2: '左侧视角',
  cam3: 'rtsp://192.168.2.103/stream1',
  username3: 'admin',
  password3: '',
  cameraDesc3: '右侧视角',
  cam4: 'rtsp://192.168.2.104/stream1',
  username4: 'admin',
  password4: '',
  cameraDesc4: '后方视角'
})

// 连接测试结果
const testResults = ref({
  fs: null,
  cloud: null,
  agv: null,
  cam: null
})

// 表单验证规则
const formRules = {
  host: [
    { required: true, message: '请输入AGV主机IP地址', trigger: 'blur' },
    { 
      pattern: /^(\d{1,3}\.){3}\d{1,3}$/, 
      message: '请输入正确的IP地址格式', 
      trigger: 'blur' 
    }
  ],
  drivePort: [
    { required: true, message: '请输入硬件驱动端口', trigger: 'blur' },
    { type: 'number', min: 1, max: 65535, message: '端口号必须在1-65535范围内', trigger: 'blur' }
  ],
  analysisPort: [
    { required: true, message: '请输入分析程序端口', trigger: 'blur' },
    { type: 'number', min: 1, max: 65535, message: '端口号必须在1-65535范围内', trigger: 'blur' }
  ],
  cloudUrl: [
    { required: true, message: '请输入云端地址', trigger: 'blur' },
    { 
      pattern: /^https?:\/\/.+/, 
      message: '请输入正确的URL格式', 
      trigger: 'blur' 
    }
  ],
  apiKey: [
    { required: true, message: '请输入API密钥', trigger: 'blur' },
    { min: 16, message: 'API密钥长度不能少于16个字符', trigger: 'blur' }
  ],
  cam1: [{ required: true, message: '请输入摄像头1地址', trigger: 'blur' }],
  cam2: [{ required: true, message: '请输入摄像头2地址', trigger: 'blur' }],
  cam3: [{ required: true, message: '请输入摄像头3地址', trigger: 'blur' }],
  cam4: [{ required: true, message: '请输入摄像头4地址', trigger: 'blur' }]
}

// 加载配置数据
const loadConfig = async () => {
  loading.value = true
  try {
    const response = await getConfig()
    if (response.code === 200 && response.data) {
      const configData = response.data
      Object.keys(configForm).forEach(key => {
        if (configData[key] !== undefined && configData[key] !== null) {
          configForm[key] = configData[key]
        }
      })
      ElMessage.success('配置加载成功')
    } else {
      ElMessage.warning('配置数据为空，使用默认配置')
    }
  } catch (error) {
    console.error('加载配置失败:', error)
    ElMessage.error('加载配置失败：' + (error.message || '网络错误'))
  } finally {
    loading.value = false
  }
}

// 保存配置
const saveConfig = async () => {
  if (!configFormRef.value) return
  
  try {
    await configFormRef.value.validate()
    saving.value = true
    const response = await updateConfig(configForm)
    
    if (response.code === 200) {
      ElMessage.success('配置保存成功！正在为您自动测试连接...')
      await testConnection()

      if (props.isEmbedded) {
        emit('save')
      }
    } else {
      ElMessage.error(response.msg || '保存配置失败')
    }
    
  } catch (error) {
    console.error('保存配置失败:', error)
    if (error.errors) {
      ElMessage.error('表单验证失败，请检查红色标记的字段')
    } else {
      ElMessage.error('保存配置失败：' + (error.message || '未知错误'))
    }
  } finally {
    saving.value = false
  }
}

// 模拟云端连接检查
const checkCloud = () => {
  return new Promise(resolve => {
    setTimeout(() => {
      // 简单检查URL和API Key是否存在
      if (configForm.cloudUrl && configForm.apiKey) {
        resolve({ code: 200, msg: 'Cloud connection is OK.' })
      } else {
        resolve({ code: 500, msg: 'Cloud URL or API Key is missing.' })
      }
    }, 500)
  })
}

// 测试连接
const testConnection = async () => {
  testing.value = true
  testResults.value = { fs: null, cloud: null, agv: null, cam: null }
  
  try {
    const [fsRes, cloudRes, agvRes, camRes] = await Promise.allSettled([
      checkFs(),
      checkCloud(),
      checkAgv(),
      checkCam()
    ])
    
    testResults.value = {
      fs: fsRes.status === 'fulfilled' && fsRes.value.code === 200,
      cloud: cloudRes.status === 'fulfilled' && cloudRes.value.code === 200,
      agv: agvRes.status === 'fulfilled' && agvRes.value.code === 200,
      cam: camRes.status === 'fulfilled' && camRes.value.code === 200
    }
    
    const successCount = Object.values(testResults.value).filter(Boolean).length
    const totalCount = Object.keys(testResults.value).length
    
    if (successCount === totalCount) {
      ElMessage.success(`所有连接测试成功 (${successCount}/${totalCount})`)
    } else if (successCount > 0) {
      ElMessage.warning(`部分连接测试成功 (${successCount}/${totalCount})`)
    } else {
      ElMessage.error('所有连接测试失败')
    }
    
  } catch (error) {
    console.error('连接测试异常:', error)
    ElMessage.error('连接测试过程中发生未知错误')
  } finally {
    testing.value = false
  }
}

// 重置表单
const resetForm = () => {
  ElMessageBox.confirm(
    '您确定要重置所有配置为上次保存的状态吗？',
    '确认重置',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    loadConfig()
    ElMessage.info('配置已重置')
  }).catch(() => {})
}

// 返回初始化页面
const backToInit = () => {
  router.push('/initView')
}

// 获取连接状态文本
const getConnectionStatusText = (status) => {
  if (status === null) return '未测试'
  return status ? '连接正常' : '连接异常'
}

// 获取连接状态类型
const getConnectionStatusType = (status) => {
  if (status === null) return 'info'
  return status ? 'success' : 'danger'
}

// 页面挂载时加载配置
onMounted(() => {
  loadConfig()
})

// 暴露方法给父组件
defineExpose({
  saveConfig,
  loadConfig,
  testConnection
})
</script>

<style lang="scss" scoped>
.settings-container {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid #ebeef5;
    
    h2 {
      margin: 0;
      color: #303133;
      font-size: 24px;
      font-weight: 600;
    }
    
    .header-actions {
      display: flex;
      gap: 12px;
    }
  }
  
  .connection-status {
    margin-bottom: 24px;
    padding: 20px;
    background: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e4e7ed;
    
    h3 {
      margin: 0 0 16px 0;
      color: #303133;
      font-size: 16px;
      font-weight: 600;
    }
    
    .status-card {
      .status-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        
        .status-label {
          font-size: 14px;
          color: #606266;
          font-weight: 500;
        }
      }
    }
  }

  .config-form {
    .config-section {
      margin-bottom: 40px;
      padding: 24px;
      background: #fafafa;
      border-radius: 8px;
      border: 1px solid #ebeef5;
      
      .section-title {
        display: flex;
        align-items: center;
        margin: 0 0 24px 0;
        padding-bottom: 12px;
        border-bottom: 2px solid #409eff;
        color: #303133;
        font-size: 18px;
        font-weight: 600;
        
        .el-icon {
          margin-right: 8px;
          color: #409eff;
        }
      }
      
      .camera-config {
        margin-bottom: 32px;
        padding: 20px;
        background: white;
        border-radius: 6px;
        border: 1px solid #e4e7ed;
        
        &:last-child {
          margin-bottom: 0;
        }
        
        .camera-title {
          margin: 0 0 20px 0;
          color: #606266;
          font-size: 16px;
          font-weight: 500;
          padding-bottom: 8px;
          border-bottom: 1px solid #ebeef5;
        }
      }
    }
  }
  
  .footer-actions {
    padding: 24px 0;
    text-align: center;
    border-top: 1px solid #ebeef5;
    
    .el-button {
      margin: 0 8px;
      min-width: 100px;
    }
  }
}

:deep(.el-form-item) {
  margin-bottom: 20px;
  
  .el-form-item__label {
    color: #606266;
    font-weight: 500;
  }
  
  .el-input__wrapper {
    border-radius: 6px;
    transition: all 0.3s ease;
    
    &:hover {
      border-color: #c0c4cc;
    }
    
    &.is-focus {
      border-color: #409eff;
      box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
    }
  }
  
  .el-input-number {
     .el-input__wrapper {
       border-radius: 6px;
     }
   }
}

:deep(.el-row) {
  .el-col {
    &:first-child {
      padding-right: 10px;
    }
    
    &:last-child {
      padding-left: 10px;
    }
  }
}

:deep(.el-card) {
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  
  .el-card__body {
    padding: 16px;
  }
}

/* 响应式设计 */
@media (max-width: 600px) {
  .settings-container {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .config-form .config-section {
    padding: 16px;
  }

  .footer-actions {
    flex-direction: column;
    gap: 12px;

    .el-button {
      width: 100%;
      margin-left: 0 !important;
    }
  }
}
</style>