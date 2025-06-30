<template>
  <div class="task-execute-app-container">
    <div class="breadcrumb">
      地铁隧道巡线车智能巡检系统 <span>/</span> 任务列表 <span>/</span> 任务巡视
    </div>
    <div class="main-container">
      <div class="content-area">
        <div class="video-area">
          <div style="text-align: center; position: absolute; top: 10px; left: 50%; transform: translateX(-50%); z-index: 10;">
            实时视频流显示区域
            <br />
            <small style="color: #ccc;">摄像头{{ videoStore.cameraId }} - {{ videoStore.currentCamera?.name || '' }}</small>
          </div>
          <VideoPlayer :flvUrl="videoStore.streamUrl" :cameraName="videoStore.currentCamera?.name || ''" />
        
        </div>
        <div class="scale-bar-area">
          <div class="scale-bar-wrapper">
            <div class="scale-bar-text start">0m</div>
            <div class="scale-bar-text end">{{ taskInfo.taskTrip || '500' }}m</div>
            <div class="scale-bar">
              <div class="scale-bar-progress" :style="{ width: progress + '%' }"></div>
            </div>
            <div v-for="flaw in flaws" 
     :key="flaw.id" 
     class="scale-bar-item" 
     :class="getFlawMarkerClass(flaw)" :style="{ left: (flaw.flawDistance / taskInfo.taskTrip * 100) + '%' }" 
     :title="flaw.flawName" 
     @click="showFlawDetail(flaw)">📍</div>
            <div class="scale-bar-item scale-bar-agv" :style="{ left: progress + '%' }" title="当前位置">🚛</div>
          </div>
        </div>
      </div>
      <div class="sidebar">
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
                <el-select v-model="videoStore.cameraId" class="cam-selector console-btn" style="width:180px;" size="large" placeholder="选择摄像头">
                  <el-option v-for="cam in videoStore.cameraList" :key="cam.id" :label="cam.name || `摄像头${cam.id}`" :value="cam.id" />
                </el-select>
              </div>
              <div class="console-item bottom-left">
                <el-button type="success" @click="endTaskExecution" size="large" class="console-btn" :loading="isFinishingTask">完成巡检</el-button>
              </div>
              <div class="console-item bottom-right">
                <el-button type="danger" @click="abortTaskExecution" size="large" class="console-btn">终止巡检</el-button>
              </div>
            </div>
            <div class="agv-move-switch-bar">
              <el-switch
                v-model="agvMoveSwitch"
                active-text="AGV前进"
                inactive-text="AGV停止"
                @change="handleAgvMoveSwitch"
                class="agv-move-switch"
              />
            </div>
          </div>
        </div>
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
              <div class="info-value"><span class="count-animation">{{ currentPosition.toFixed(2) }}</span> 米</div>
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
        <div class="card">
  <div class="card-header">故障历史</div>
  <div class="card-body">
    <el-table 
      :data="flaws" 
      style="width: 100%" 
      size="small" 
      max-height="250"
      @row-click="showFlawDetail"> <el-table-column prop="flawName" label="故障名称" />
      <el-table-column prop="flawType" label="故障类型" />
      <el-table-column prop="flawDistance" label="故障位置(m)" />
    </el-table>
  </div>
</div>
      </div>
    </div>
    <FlawDetailDialog @saved="updateFlawList" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { useFlawStore } from '../../stores/flaw'
import { useVideoStore } from '../../stores/video'
// 修改: 导入新增的API函数
import { getTask, endTask, uploadTask } from '../../car/api/task'
import { listFlaw, liveInfo, checkAllConfirmed } from '../../car/api/flaw'
import { heartbeat, agvForward, agvStop } from '../../car/api/agv'
import { deviceList } from '../../car/api/camera'
import VideoPlayer from '../../components/VideoPlayer.vue'
import FlawDetailDialog from '../../components/FlawDetailDialog.vue'

const route = useRoute()
const router = useRouter()
const flawStore = useFlawStore()
const videoStore = useVideoStore()

const taskId = route.query.id
const pollingIntervals = []

// --- 响应式状态定义 ---
const taskInfo = reactive({ taskCode: '', taskName: '', taskTrip: 500 })
const flaws = ref([])
const progress = ref(0)
const currentTime = ref('')
const currentPosition = ref(0)
const showConsole = ref(true)
const showStatus = ref(true)
const agvMoveSwitch = ref(false)
const isFinishingTask = ref(false) // 新增: 用于完成按钮的loading状态

// --- 计算属性 ---
const flawCount = computed(() => flaws.value.length)
const confirmedFlawCount = computed(() => flaws.value.filter(f => f.confirmed).length)
// 将 !f.confirmed 修改为 f.confirmed === null，使其逻辑与 TaskDetailView 一致
const unconfirmedFlawCount = computed(() => flaws.value.filter(f => f.confirmed === null).length)

// --- 方法定义 ---

const showFlawDetail = (flaw) => {
  flawStore.setFlaw(flaw)
  flawStore.setVisible(true)
}

const refreshVideo = () => {
  // ... (方法无变化)
  if (videoStore.currentCamera) {
    const url = getFlvUrl(videoStore.currentCamera)
    videoStore.setStreamUrl(url)
    ElMessage.success('视频监控已刷新')
  } else {
    ElMessage.warning('请先选择一个摄像头')
  }
}

// 修改: 完整地实现了"完成巡检"的业务流程
const endTaskExecution = async () => {
  isFinishingTask.value = true
  try {
    // 1. 前置校验: 检查是否所有故障都已确认
    const checkRes = await checkAllConfirmed(taskId)
    if (checkRes.code !== 200 || !checkRes.data) {
      ElMessageBox.alert('尚有疑似故障未确认，请处理完毕后再完成任务。', '操作中断', { type: 'warning' })
      isFinishingTask.value = false
      return
    }

    // 2. 弹出确认框
    await ElMessageBox.confirm('确定要完成本次巡检任务吗?', '提示', { type: 'success' })

    // 3. 结束任务
    ElMessage.info('正在结束任务...')
    await endTask(taskId, false)
    ElMessage.success('任务已成功结束，准备上传数据...')

    // 4. 上传数据
    await uploadTask(taskId)
    ElMessage.success('任务数据上传成功！即将返回任务列表。')

    // 5. 跳转
    router.push('/taskView')
  } catch (error) {
    // catch中捕获的是用户点击取消或API调用失败
    if (error !== 'cancel') {
      ElMessage.error('操作失败: ' + (error.message || '未知错误'))
    }
  } finally {
    isFinishingTask.value = false
  }
}

// 终止巡检逻辑无变化
const abortTaskExecution = async () => {
  await ElMessageBox.confirm('确定要终止本次巡检任务吗？此操作不可逆！', '警告', {
    confirmButtonText: '确定终止',
    cancelButtonText: '取消',
    type: 'warning',
  })
  try {
    await endTask(taskId, true)
    ElMessage.error('任务已终止')
    router.push('/taskView')
  } catch (error) {
     if (error !== 'cancel') {
      ElMessage.error('操作失败: ' + (error.message || '未知错误'))
    }
  }
}


const updateTime = () => { currentTime.value = new Date().toLocaleString() }

const handleAgvMoveSwitch = async (val) => {
  try {
    if (val) {
      await agvForward()
      ElMessage.success('AGV已启动前进')
    } else {
      await agvStop()
      ElMessage.info('AGV已停止')
    }
  } catch (error) {
    ElMessage.error('AGV控制指令发送失败')
    agvMoveSwitch.value = !val
  }
}

const getFlvUrl = (camera) => {
  if (!camera || !camera.id) return ''
  return `http://192.168.2.57/webrtc-api/live/${camera.id}_01.flv`
}


// --- API 数据加载 ---
const loadTaskInfo = async () => {
  if (!taskId) return
  const res = await getTask(taskId)
  if (res?.code === 200 && res.data) {
    Object.assign(taskInfo, res.data)
  }
}



const updateFlawList = async () => {
  
    if (response.code === 200) {
      // 后端分页结构返回 rows，否则可能直接返回 data
      const allFlaws = response.rows || response.data || []
      flawList.value = allFlaws.filter(flaw => flaw.taskId == taskId)
    }
  
}

// 新增: 高频轮询实时"新增"的故障，用于主动弹窗
const pollForNewFlaws = async () => {
  if (!taskId) return
  try {
    const res = await liveInfo(taskId)
    if (res?.code === 200 && res.data && Array.isArray(res.data)) {
      res.data.forEach(async newFlaw => { // <--- 将 forEach 改为异步
        const isExisting = flaws.value.some(f => f.id === newFlaw.id)
        if (!isExisting && newFlaw.shown === false) {
          flaws.value.push(newFlaw)
          showFlawDetail(newFlaw)
          ElMessage.warning(`检测到新的疑似故障：${newFlaw.flawName}`)

          // 新增：立即调用 updateFlaw API，将shown 状态更新为 true
          try {
            await updateFlaw({ id: newFlaw.id, shown: true })
          } catch (updateError) {
            console.error(`Failed to mark flaw ${newFlaw.id} as shown:`, updateError)
          }
        }
      })
    }
  } catch (error) {
    console.error('Polling for new flaws failed:', error);
  }
}

// 新增：根据故障状态返回CSS类名，以支持三态显示
const getFlawMarkerClass = (flaw) => {
  if (flaw.confirmed === true) {
    return 'scale-bar-flaw confirmed' // 已确认 (红色)
  }
  if (flaw.confirmed === false) {
    return 'scale-bar-flaw false-alarm' // 误报 (灰色)
  }
  return 'scale-bar-flaw unconfirmed' // 疑似 (橙色)
}

const updateAGVStatus = async () => {
  const res = await heartbeat()
  if (res?.code === 200 && res.data) {
    currentPosition.value = res.data.currentPosition || 0
    if (taskInfo.taskTrip > 0) {
      progress.value = (currentPosition.value / taskInfo.taskTrip) * 100
    }
  }
}

const loadCameraList = async () => {
  try {
    const res = await deviceList()
    const cameraData = res.data?.items // <--- 修改为正确的路径
    if (cameraData) {
      videoStore.setCameraList(cameraData)
      if (cameraData.length > 0) {
        const firstCam = cameraData[0]
        videoStore.setCameraId(firstCam.id)
        videoStore.setCurrentCamera(firstCam)
        videoStore.setStreamUrl(getFlvUrl(firstCam))
      }
    }
  } catch (error) {
    ElMessage.error('加载摄像头列表失败')
  }
}

// --- 生命周期钩子 ---
watch(() => videoStore.cameraId, (val) => {
  const cam = videoStore.cameraList.find(c => c.id === val)
  if (cam) {
    videoStore.setCurrentCamera(cam)
    videoStore.setStreamUrl(getFlvUrl(cam))
  }
})

onMounted(() => {
  if (!taskId) {
    ElMessage.error('无效的任务ID，即将返回任务列表')
    router.push('/taskView')
    return
  }
  loadTaskInfo()
  loadCameraList()
  updateFlawList() // 立即执行一次全量
  updateAGVStatus()
  updateTime()
  
  // 设置定时轮询
  pollingIntervals.push(setInterval(updateTime, 1000))
  pollingIntervals.push(setInterval(updateAGVStatus, 3000))
  // 新增: 高频轮询实时故障
  pollingIntervals.push(setInterval(pollForNewFlaws, 3000)) 
  // 修改: 降低全量故障列表的更新频率
  pollingIntervals.push(setInterval(updateFlawList, 15000)) 
})

onUnmounted(() => {
  pollingIntervals.forEach(clearInterval)
})

</script>

<style scoped>
/* 样式与原文件保持一致，此处省略以保持简洁 */
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
  position: relative;
  grid-template-areas:
    "top-left top-right"
    "bottom-left bottom-right";
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
.console-item.center {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
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
.agv-move-switch-bar {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 24px;
  margin-bottom: 8px;
}
.el-switch.agv-move-switch {
  --el-switch-on-color: #67c23a;
  --el-switch-off-color: #dcdfe6;
}

/* 调整 el-switch 样式以匹配原型 */
.agv-move-switch {
  transform: scale(1.5); /* 放大开关 */
}
:deep(.agv-move-switch .el-switch__label) {
  font-size: 14px; /* 调整字体大小 */
}

</style>