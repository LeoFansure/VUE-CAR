<template>
  <div class="task-execute-app-container">
    <!-- 面包屑 -->
    <div class="breadcrumb">
      地铁隧道巡线车智能巡检系统 <span>/</span> 任务列表 <span>/</span> 任务巡视
    </div>
    <div class="main-container">
      <!-- 左侧内容区 -->
      <div class="content-area">
        <!-- 视频区 -->
        <div class="video-area">
          <div style="text-align: center;">
            实时视频流显示区域
            <br />
            <small style="color: #ccc;">摄像头{{ videoStore.cameraId }} - {{ cameraNames[videoStore.cameraId-1] }}</small>
          </div>
          <VideoPlayer :url="videoUrl" :camera-id="videoStore.cameraId" />
          <div class="audio-stream" style="background: rgba(0,0,0,0.5); padding: 10px; border-radius: 4px;">
            <span>音量：</span>
            <el-slider v-model="videoStore.volume" :min="0" :max="100" style="width: 120px; display:inline-block;" />
          </div>
        </div>
        <!-- 进度条区 -->
        <div class="scale-bar-area">
          <div class="scale-bar-wrapper">
            <div class="scale-bar-text start">0m</div>
            <div class="scale-bar-text end">{{ taskInfo.taskTrip || '500' }}m</div>
            <div class="scale-bar">
              <div class="scale-bar-progress" :style="{ width: progress + '%' }"></div>
            </div>
            <!-- 故障点标记 -->
            <div v-for="flaw in flaws" :key="flaw.id" class="scale-bar-item" :class="flaw.status === 'confirmed' ? 'scale-bar-flaw' : 'scale-bar-flaw unconfirmed'" :style="{ left: flaw.position + '%' }" :title="flaw.name" @click="showFlawDetail(flaw)">📍</div>
            <!-- AGV位置 -->
            <div class="scale-bar-item scale-bar-agv" :style="{ left: progress + '%' }" title="当前位置">🚛</div>
          </div>
        </div>
      </div>
      <!-- 右侧侧边栏 -->
      <div class="sidebar">
        <!-- 控制台 -->
        <div class="card">
          <div class="card-header">
            控制台
            <el-switch v-model="showConsole" active-color="#67c23a" inactive-color="#dcdfe6" style="margin-left: 12px;" />
          </div>
          <div class="card-body" v-if="showConsole">
            <div class="console-grid large">
              <div class="console-item top-left">
                <el-button type="primary" @click="refreshVideo" size="large" class="console-btn">刷新监控</el-button>
              </div>
              <div class="console-item top-right">
                <el-select v-model="videoStore.cameraId" class="cam-selector console-btn" style="width:180px;" size="large">
                  <el-option v-for="(name, idx) in cameraNames" :key="idx" :label="name" :value="idx+1" />
                </el-select>
              </div>
              <div class="console-item bottom-left">
                <el-button type="success" @click="endTaskExecution" size="large" class="console-btn">完成巡检</el-button>
              </div>
              <div class="console-item bottom-right">
                <el-button type="danger" @click="abortTaskExecution" size="large" class="console-btn">终止巡检</el-button>
              </div>
            </div>
          </div>
        </div>
        <!-- 车辆状态 -->
        <div class="card">
          <div class="card-header">
            车辆状态
            <el-switch v-model="showStatus" active-color="#67c23a" inactive-color="#dcdfe6" style="margin-left: 12px;" />
          </div>
          <div class="card-body" v-if="showStatus">
            <div class="info-item">
              <div class="info-label">📄 巡视任务编号</div>
              <div class="info-value">{{ taskInfo.taskCode }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">⏰ 车辆系统时间</div>
              <div class="info-value">{{ currentTime }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">📍 已行驶距离</div>
              <div class="info-value"><span class="count-animation">{{ currentPosition }}</span> 米</div>
            </div>
            <div class="info-item">
              <div class="info-label">⚠️ 故障总计</div>
              <div class="info-value">{{ flawCount }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">✅ 已确定故障</div>
              <div class="info-value confirmed-flaw">{{ confirmedFlawCount }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">❓ 疑似故障</div>
              <div class="info-value unconfirmed-flaw">{{ unconfirmedFlawCount }}</div>
            </div>
          </div>
        </div>
        <!-- 故障历史 -->
        <div class="card">
          <div class="card-header">故障历史</div>
          <div class="card-body">
            <el-table :data="flaws" style="width: 100%" size="small">
              <el-table-column prop="name" label="故障名称" />
              <el-table-column prop="type" label="故障类型" />
              <el-table-column prop="position" label="故障位置" />
            </el-table>
          </div>
        </div>
      </div>
    </div>
    <!-- 故障详情弹窗 -->
    <FlawDetailDialog v-model="flawStore.visible" :flaw="flawStore.flaw" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { useFlawStore } from '@/stores/flaw'
import { useVideoStore } from '@/stores/video'
import { getTaskInfo, getFlawList, getAGVStatus, endTask } from '@/api/task'
import VideoPlayer from '@/components/VideoPlayer.vue'
import FlawDetailDialog from '@/components/FlawDetailDialog.vue'

const route = useRoute()
const router = useRouter()
const flawStore = useFlawStore()
const videoStore = useVideoStore()

const cameraNames = ['前方视角', '后方视角', '左侧视角', '右侧视角']

const taskId = route.query.id
const taskInfo = reactive({ taskCode: '', taskTrip: 500 })
const flaws = ref([])
const progress = ref(0)
const currentTime = ref('')
const currentPosition = ref(0)
const flawCount = ref(0)
const confirmedFlawCount = ref(0)
const unconfirmedFlawCount = ref(0)
const showConsole = ref(true)
const showStatus = ref(true)

const videoUrl = computed(() => {
  // 这里应根据实际后端返回的视频流地址拼接
  return `/api/video/stream?camera=${videoStore.cameraId}`
})

const showFlawDetail = (flaw) => {
  flawStore.setFlaw(flaw)
  flawStore.setVisible(true)
}

const refreshVideo = () => {
  // 触发 VideoPlayer 重新加载
  videoStore.setError('')
}

const endTaskExecution = async () => {
  await endTask(taskId)
  ElMessage.success('任务已完成')
  router.push('/taskView')
}
const abortTaskExecution = async () => {
  await endTask(taskId, false)
  ElMessage.success('任务已终止')
  router.push('/taskView')
}

const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleString()
}

const updateAGVStatus = async () => {
  if (!taskId) return
  const status = await getAGVStatus(taskId)
  currentPosition.value = status.position
  progress.value = status.progress
}

const updateFlawList = async () => {
  if (!taskId) return
  const res = await getFlawList(taskId)
  flaws.value = res.data || []
  flawCount.value = flaws.value.length
  confirmedFlawCount.value = flaws.value.filter(f => f.status === 'confirmed').length
  unconfirmedFlawCount.value = flaws.value.filter(f => f.status !== 'confirmed').length
}

const loadTaskInfo = async () => {
  if (!taskId) return
  const res = await getTaskInfo(taskId)
  Object.assign(taskInfo, res.data)
}

onMounted(() => {
  updateTime()
  setInterval(updateTime, 1000)
  loadTaskInfo()
  updateFlawList()
  updateAGVStatus()
  setInterval(updateAGVStatus, 3000)
  setInterval(updateFlawList, 5000)
})
</script>

<style scoped>
/* 以下为 ref.md 中的主要样式，已直接复制到此处 */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}
body {
    font-family: Arial, sans-serif;
    background: #f5f5f5;
    height: 100vh;
    overflow: hidden;
}
.task-execute-app-container {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: white;
}
.breadcrumb {
    padding: 20px;
    color: #666;
    font-size: 14px;
    border-bottom: 1px solid #eee;
}
.breadcrumb span {
    margin: 0 5px;
}
.main-container {
    flex: 1;
    display: flex;
    height: calc(100vh - 60px);
}
.content-area {
    flex: 1;
    display: flex;
    flex-direction: column;
}
.video-area {
    flex: 1;
    background: #000;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 18px;
}
.audio-stream {
    position: absolute;
    bottom: 10px;
    right: 10px;
    width: 200px;
}
.scale-bar-area {
    height: 120px;
    background: #fafafa;
    border-top: 1px solid #eee;
    padding: 20px;
    display: flex;
    flex-direction: column;
    justify-content: center;
}
.scale-bar-wrapper {
    position: relative;
    height: 60px;
}
.scale-bar {
    width: 100%;
    height: 8px;
    background: #e4e7ed;
    border-radius: 4px;
    position: relative;
    margin: 26px 0;
}
.scale-bar-progress {
    height: 100%;
    background: #409eff;
    border-radius: 4px;
    width: 30%;
    transition: width 1s ease;
}
.scale-bar-text {
    position: absolute;
    font-size: 12px;
    color: #666;
}
.scale-bar-text.start {
    left: 0;
    top: 0;
}
.scale-bar-text.end {
    right: 0;
    top: 0;
}
.scale-bar-item {
    position: absolute;
    top: 18px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    cursor: pointer;
    transform: translateX(-50%);
}
.scale-bar-flaw {
    background: #f56c6c;
    color: white;
}
.scale-bar-flaw.unconfirmed {
    background: #e6a23c;
    color: white;
}
.scale-bar-agv {
    background: #67c23a;
    color: white;
    font-size: 14px;
    animation: pulse 2s infinite;
}
@keyframes pulse {
    0% { transform: translateX(-50%) scale(1); }
    50% { transform: translateX(-50%) scale(1.1); }
    100% { transform: translateX(-50%) scale(1); }
}
.sidebar {
    width: 400px;
    background: white;
    border-left: 1px solid #eee;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
}
.card {
    border: 1px solid #eee;
    border-radius: 8px;
    margin: 10px;
    background: white;
}
.card-header {
    padding: 15px 20px;
    background: #fafafa;
    border-bottom: 1px solid #eee;
    font-weight: bold;
    font-size: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.card-body {
    padding: 20px;
}
.console-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 16px;
  height: 160px;
  position: relative;
}
.console-item {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}
.console-item.top-left {
  grid-row: 1;
  grid-column: 1;
  justify-content: flex-start;
}
.console-item.top-right {
  grid-row: 1;
  grid-column: 2;
  justify-content: flex-end;
}
.console-item.bottom-left {
  grid-row: 2;
  grid-column: 1;
  justify-content: flex-start;
}
.console-item.bottom-right {
  grid-row: 2;
  grid-column: 2;
  justify-content: flex-end;
}
.el-button[size="large"] {
  min-width: 110px;
  font-size: 16px;
  padding: 12px 0;
}
.el-select[size="large"] .el-input__inner {
  font-size: 16px;
  height: 40px;
}
.info-item {
    display: flex;
    margin-bottom: 15px;
    align-items: center;
}
.info-label {
    width: 140px;
    color: #666;
    font-size: 14px;
}
.info-value {
    flex: 1;
    color: #333;
    font-size: 14px;
}
.confirmed-flaw {
    color: #f56c6c;
    font-weight: bold;
}
.unconfirmed-flaw {
    color: #e6a23c;
    font-weight: bold;
}
.count-animation {
    display: inline-block;
    animation: countUp 3s ease-out;
}
@keyframes countUp {
    from { opacity: 0.5; }
    to { opacity: 1; }
}
.flaw-table {
    width: 100%;
    border-collapse: collapse;
}
.flaw-table th,
.flaw-table td {
    padding: 8px 12px;
    border: 1px solid #eee;
    text-align: left;
    font-size: 12px;
}
.flaw-table th {
    background: #fafafa;
    font-weight: bold;
}
.flaw-table tbody tr.confirmed {
    background: #fef0f0;
}
.flaw-table tbody tr.unconfirmed {
    background: #fdf6ec;
}
.link {
    color: #409eff;
    text-decoration: none;
    cursor: pointer;
}
.link:hover {
    text-decoration: underline;
}
.console-grid.large {
  min-height: 200px;
  gap: 8px;
  padding: 0 0 0 0px;
  margin-left: -12px;
  width: calc(100% + 12px);
}
.console-item.top-left,
.console-item.bottom-left {
  justify-content: flex-start;
  padding-left: 0;
}
.console-item.top-right,
.console-item.bottom-right {
  justify-content: flex-end;
  padding-right: 0;
}
.console-btn {
  min-width: 150px !important;
  max-width: 200px !important;
  min-height: 50px !important;
  max-height: 56px !important;
  font-size: 18px !important;
  padding: 0 12px !important;
  border-radius: 10px !important;
  box-sizing: border-box;
}
.el-select.console-btn .el-input__inner {
  font-size: 18px;
  height: 50px;
  border-radius: 10px;
}
</style>