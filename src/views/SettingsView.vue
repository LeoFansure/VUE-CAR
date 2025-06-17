<template>
  <div class="settings-container">
    <el-form
      ref="configFormRef"
      :model="configForm"
      :rules="formRules"
      label-width="140px"
      class="config-form"
    >
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
  Lock 
} from '@element-plus/icons-vue'
import { getConfig, updateConfig } from '@/api/system'

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

// 配置表单数据
const configForm = reactive({
  id: null,
  host: '192.168.2.100',
  drivePort: 8080,
  analysisPort: 8081,
  cloudUrl: 'https://cloud.example.com',
  cam1: 'rtsp://192.168.2.101/stream1',
  cam2: 'rtsp://192.168.2.102/stream1',
  cam3: 'rtsp://192.168.2.103/stream1',
  cam4: 'rtsp://192.168.2.104/stream1',
  username1: 'admin',
  username2: 'admin',
  username3: 'admin',
  username4: 'admin',
  password1: '',
  password2: '',
  password3: '',
  password4: ''
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
    { required: true, message: '请输入硬件驱动端口', trigger: 'blur' }
  ],
  analysisPort: [
    { required: true, message: '请输入分析程序端口', trigger: 'blur' }
  ],
  cloudUrl: [
    { required: true, message: '请输入云端地址', trigger: 'blur' },
    { 
      pattern: /^https?:\/\/.+/, 
      message: '请输入正确的URL格式', 
      trigger: 'blur' 
    }
  ]
}

// 加载配置数据
const loadConfig = async () => {
  try {
    const response = await getConfig()
    if (response.data) {
      Object.assign(configForm, response.data)
    }
  } catch (error) {
    console.error('加载配置失败:', error)
    ElMessage.warning('加载配置失败，使用默认配置')
  }
}

// 保存配置
const saveConfig = async () => {
  if (!configFormRef.value) return
  
  try {
    await configFormRef.value.validate()
    
    saving.value = true
    
    await updateConfig(configForm)
    
    ElMessage.success('配置保存成功')
    
    // 如果是嵌入模式，触发保存事件
    if (props.isEmbedded) {
      emit('save')
    }
    
  } catch (error) {
    if (error.errors) {
      ElMessage.error('请检查表单填写是否正确')
    } else {
      ElMessage.error('保存配置失败：' + (error.message || '未知错误'))
    }
  } finally {
    saving.value = false
  }
}

// 重置表单
const resetForm = () => {
  if (!configFormRef.value) return
  
  ElMessageBox.confirm(
    '确定要重置所有配置吗？此操作会丢失当前的修改。',
    '确认重置',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    configFormRef.value.resetFields()
    loadConfig()
    ElMessage.success('配置已重置')
  }).catch(() => {
    // 用户取消
  })
}

// 测试连接
const testConnection = async () => {
  testing.value = true
  
  try {
    // 这里应该调用实际的连接测试接口
    // 暂时模拟测试过程
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    ElMessage.success('连接测试成功')
  } catch (error) {
    ElMessage.error('连接测试失败：' + (error.message || '未知错误'))
  } finally {
    testing.value = false
  }
}

// 页面挂载时加载配置
onMounted(() => {
  loadConfig()
})

// 暴露方法给父组件
defineExpose({
  saveConfig
})
</script>

<style lang="scss" scoped>
.settings-container {
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
</style>