<template>
  <div class="cloud-test-container">
    <el-card class="test-card">
      <template #header>
        <div class="card-header">
          <span>云端系统连接测试</span>
        </div>
      </template>
      
      <div class="test-section">
        <h3>1. 基础连接测试</h3>
        <el-button 
          type="info" 
          @click="testSimpleConnection"
          :loading="simpleLoading"
        >
          测试基础连接
        </el-button>
        <div v-if="simpleResult" class="result-display">
          <el-alert
            :title="simpleResult.message"
            :type="simpleResult.code === 200 ? 'success' : 'error'"
            :description="simpleResult.data"
            show-icon
          />
        </div>
      </div>

      <div class="test-section">
        <h3>2. 数据库连接测试</h3>
        <el-button 
          type="primary" 
          @click="testDatabaseConnection"
          :loading="dbLoading"
        >
          测试数据库连接
        </el-button>
        <div v-if="dbResult" class="result-display">
          <el-alert
            :title="dbResult.message"
            :type="dbResult.code === 200 ? 'success' : 'error'"
            :description="dbResult.data"
            show-icon
          />
        </div>
      </div>

      <div class="test-section">
        <h3>3. API接口测试</h3>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-button 
              @click="testSysConfig"
              :loading="sysConfigLoading"
            >
              系统配置接口
            </el-button>
          </el-col>
          <el-col :span="8">
            <el-button 
              @click="testTask"
              :loading="taskLoading"
            >
              任务接口
            </el-button>
          </el-col>
          <el-col :span="8">
            <el-button 
              @click="testFlaw"
              :loading="flawLoading"
            >
              缺陷接口
            </el-button>
          </el-col>
        </el-row>
        
        <div v-if="apiResults.length > 0" class="result-display">
          <div v-for="(result, index) in apiResults" :key="index" class="api-result">
            <el-alert
              :title="`${result.name}: ${result.success ? '成功' : '失败'}`"
              :type="result.success ? 'success' : 'error'"
              :description="result.message"
              show-icon
            />
          </div>
        </div>
      </div>

      <div class="test-section">
        <h3>4. 系统状态</h3>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="后端服务地址">
            http://localhost:8080
          </el-descriptions-item>
          <el-descriptions-item label="数据库类型">
            金仓数据库
          </el-descriptions-item>
          <el-descriptions-item label="数据库名">
            CAR_CLOUD
          </el-descriptions-item>
          <el-descriptions-item label="数据库端口">
            54321
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <div class="test-section">
        <h3>5. 快速操作</h3>
        <el-button type="success" @click="runAllTests">
          运行所有测试
        </el-button>
        <el-button @click="clearResults">
          清除结果
        </el-button>
        <el-button @click="goToCloudSystem">
          进入云端系统
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script>
import '../../cloud/utils/cloudRequest'

export default {
  name: 'CloudTestView',
  data() {
    return {
      simpleLoading: false,
      dbLoading: false,
      sysConfigLoading: false,
      taskLoading: false,
      flawLoading: false,
      simpleResult: null,
      dbResult: null,
      apiResults: []
    }
  },
  methods: {
    async testSimpleConnection() {
      this.simpleLoading = true
      try {
        const response = await cloudService.get('/api/cloud/test-simple')
        this.simpleResult = {
          code: response.code,
          message: response.message,
          data: response.data
        }
      } catch (error) {
        this.simpleResult = {
          code: 500,
          message: '基础连接测试失败',
          data: error.message
        }
      } finally {
        this.simpleLoading = false
      }
    },

    async testDatabaseConnection() {
      this.dbLoading = true
      try {
        const response = await cloudService.get('/api/cloud/test-connection')
        this.dbResult = {
          code: response.code,
          message: response.message,
          data: response.data
        }
      } catch (error) {
        this.dbResult = {
          code: 500,
          message: '数据库连接失败',
          data: error.message
        }
      } finally {
        this.dbLoading = false
      }
    },

    async testSysConfig() {
      this.sysConfigLoading = true
      try {
        const response = await cloudService.get('/api/cloud/sysconfig')
        this.apiResults.push({
          name: '系统配置接口',
          success: true,
          message: `获取到 ${response.data.length} 条配置记录`
        })
      } catch (error) {
        this.apiResults.push({
          name: '系统配置接口',
          success: false,
          message: error.message
        })
      } finally {
        this.sysConfigLoading = false
      }
    },

    async testTask() {
      this.taskLoading = true
      try {
        const response = await cloudService.get('/api/cloud/task')
        this.apiResults.push({
          name: '任务接口',
          success: true,
          message: `获取到 ${response.data.length} 条任务记录`
        })
      } catch (error) {
        this.apiResults.push({
          name: '任务接口',
          success: false,
          message: error.message
        })
      } finally {
        this.taskLoading = false
      }
    },

    async testFlaw() {
      this.flawLoading = true
      try {
        const response = await cloudService.get('/api/cloud/flaw')
        this.apiResults.push({
          name: '缺陷接口',
          success: true,
          message: `获取到 ${response.data.length} 条缺陷记录`
        })
      } catch (error) {
        this.apiResults.push({
          name: '缺陷接口',
          success: false,
          message: error.message
        })
      } finally {
        this.flawLoading = false
      }
    },

    async runAllTests() {
      await this.testSimpleConnection()
      await this.testDatabaseConnection()
      await this.testSysConfig()
      await this.testTask()
      await this.testFlaw()
    },

    clearResults() {
      this.simpleResult = null
      this.dbResult = null
      this.apiResults = []
    },

    goToCloudSystem() {
      this.$router.push('/cloud-system')
    }
  }
}
</script>

<style scoped>
.cloud-test-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.test-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.test-section {
  margin-bottom: 30px;
}

.test-section h3 {
  margin-bottom: 15px;
  color: #303133;
  border-left: 4px solid #409eff;
  padding-left: 10px;
}

.result-display {
  margin-top: 15px;
}

.api-result {
  margin-bottom: 10px;
}

.el-button {
  margin-right: 10px;
  margin-bottom: 10px;
}
</style> 