<template>
  <div class="cloud-system-container">
    <!-- 头部 -->
    <div class="header">
      <div class="header-left">
        <h1>云端管理系统</h1>
        <p class="subtitle">AGV智能巡检系统 - 云端数据管理中心</p>
      </div>
      <div class="header-right">
        <el-button @click="backToInit" type="info" size="large">
          <el-icon><Back /></el-icon>
          返回
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-container">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon config">
                <el-icon><Setting /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ stats.configCount }}</div>
                <div class="stat-label">系统配置</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon task">
                <el-icon><List /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ stats.taskCount }}</div>
                <div class="stat-label">归档任务总数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon flaw">
                <el-icon><Warning /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ stats.flawCount }}</div>
                <div class="stat-label">缺陷总数</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 功能模块 -->
    <div class="modules-container">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-card class="module-card" @click="goToConfig">
            <div class="module-content">
              <div class="module-icon">
                <el-icon size="48"><Setting /></el-icon>
              </div>
              <h3>系统配置管理</h3>
              <p>管理系统配置信息，包括AGV主机、摄像头等设备配置</p>
              <el-button type="primary" size="large" @click.stop="goToConfig">
                进入管理
              </el-button>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="module-card" @click="goToTask">
            <div class="module-content">
              <div class="module-icon">
                <el-icon size="48"><List /></el-icon>
              </div>
              <h3>任务数据管理</h3>
              <p>查看和管理已上传的任务数据，支持增删改查操作</p>
              <el-button type="primary" size="large" @click.stop="goToTask">
                进入管理
              </el-button>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="module-card" @click="goToFlaw">
            <div class="module-content">
              <div class="module-icon">
                <el-icon size="48"><Warning /></el-icon>
              </div>
              <h3>缺陷数据管理</h3>
              <p>查看和管理缺陷数据，支持缺陷确认和状态更新</p>
              <el-button type="primary" size="large" @click.stop="goToFlaw">
                进入管理
              </el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 最近归档任务 -->
    <div class="recent-tasks-container">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>最近归档任务</span>
          </div>
        </template>
        <el-table :data="recentTasks" style="width: 100%">
          <el-table-column prop="taskCode" label="任务编号" width="180" />
          <el-table-column prop="taskName" label="任务名称" />
          <el-table-column prop="taskTrip" label="任务距离(米)" width="120" />
          <el-table-column prop="creator" label="创建人" width="100" />
          <el-table-column prop="executor" label="执行人" width="100" />
          <el-table-column prop="execTime" label="执行时间" width="180">
            <template #default="scope">
              {{ formatDate(scope.row.execTime) }}
            </template>
          </el-table-column>
          <el-table-column prop="endTime" label="完成时间" width="180">
            <template #default="scope">
              {{ formatDate(scope.row.endTime) }}
            </template>
          </el-table-column>
          <el-table-column prop="round" label="巡视轮次" width="100" />
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="scope">
              <el-button @click="viewTaskDetail(scope.row)" type="primary" size="small">
                查看详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <div class="welcome-section">
      <h1>云端管理系统</h1>
      <p>独立运行的数据管理系统，管理本地数据库中的巡检数据</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Back, Setting, List, Upload, Warning } from '@element-plus/icons-vue'
import { getTasks, getSysConfigs, getFlaws } from '../../cloud/api/cloud'

const router = useRouter()

// 响应式数据
const stats = ref({
  configCount: 0,
  taskCount: 0,
  flawCount: 0
})

const recentTasks = ref([])

// 获取统计数据
const loadStats = async () => {
  try {
    const [configRes, taskRes, flawRes] = await Promise.all([
      getSysConfigs(),
      getTasks(),
      getFlaws()
    ])
    
    if (configRes.code === 200) stats.value.configCount = configRes.data.length
    if (taskRes.code === 200) {
      stats.value.taskCount = taskRes.data.length
      recentTasks.value = taskRes.data
        .sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
        .slice(0, 5)
    }
    if (flawRes.code === 200) stats.value.flawCount = flawRes.data.length
  } catch (error) {
    console.error('加载统计数据失败:', error)
    ElMessage.error('加载统计数据失败')
  }
}

// 获取状态类型
const getStatusType = (status) => {
  const statusMap = {
    '待巡视': 'info',
    '巡视中': 'warning',
    '待上传': 'primary',
    '已完成': 'success'
  }
  return statusMap[status] || 'info'
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString();
}

// 导航方法
const backToInit = () => {
  router.push('/initView')
}

const goToConfig = () => {
  router.push('/cloudConfig')
}

const goToTask = () => {
  router.push('/cloudTask')
}

const goToFlaw = () => {
  router.push('/cloudFlaw')
}

const viewTaskDetail = (task) => {
  router.push({ path: `/cloud/task/detail/${task.id}` })
}

// 生命周期
onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.cloud-system-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.header-left h1 {
  margin: 0;
  color: #303133;
  font-size: 28px;
  font-weight: 600;
}

.subtitle {
  margin: 5px 0 0 0;
  color: #909399;
  font-size: 14px;
}

.stats-container {
  margin-bottom: 30px;
}

.stat-card {
  height: 120px;
}

.stat-content {
  display: flex;
  align-items: center;
  height: 100%;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
  color: white;
  font-size: 24px;
}

.stat-icon.config {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.task {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.uploaded {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.flaw {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
  line-height: 1;
}

.stat-label {
  margin-top: 5px;
  color: #909399;
  font-size: 14px;
}

.modules-container {
  margin-bottom: 30px;
}

.module-card {
  height: 280px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.module-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.module-content {
  text-align: center;
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.module-icon {
  color: #409eff;
  margin-bottom: 20px;
}

.module-content h3 {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 20px;
}

.module-content p {
  margin: 0 0 30px 0;
  color: #606266;
  line-height: 1.6;
  flex: 1;
}

.recent-tasks-container {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header span {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.welcome-section {
  margin-top: 30px;
  text-align: center;
}

.welcome-section h1 {
  margin-bottom: 10px;
  color: #303133;
  font-size: 28px;
  font-weight: 600;
}

.welcome-section p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}
</style> 