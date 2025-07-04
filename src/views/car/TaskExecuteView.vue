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
            <div class="console-row">
              <el-button type="primary" @click="refreshVideo">刷新监控</el-button>
              <el-button type="success" @click="endTaskExecution" :loading="isFinishingTask">完成巡检</el-button>
              <el-button type="danger" @click="abortTaskExecution">终止巡检</el-button>
            </div>
            <div class="console-row">
              <el-select v-model="videoStore.cameraId" class="cam-selector" placeholder="选择摄像头" style="width: 140px; margin-right: 12px;">
                <el-option v-for="cam in videoStore.cameraList" :key="cam.id" :label="cam.name || `摄像头${cam.id}`" :value="cam.id" />
              </el-select>
              <el-button-group class="agv-controls" style="box-shadow: none; background: transparent; border: none;">
                <el-tooltip content="后退" placement="top">
                  <el-button
                    circle
                    :type="agvMoveState === 'backward' ? 'warning' : 'default'"
                    @click="handleAgvMove('backward')"
                    style="margin: 0 4px; font-size: 18px; min-width: 36px; height: 36px;"
                  >
                    <span class="icon"><<</span>
                  </el-button>
                </el-tooltip>
                <el-tooltip content="停止" placement="top">
                  <el-button
                    :type="agvMoveState === 'stop' ? 'danger' : 'default'"
                    @click="handleAgvMove('stop')"
                    style="margin: 0 4px; font-size: 18px; border-radius: 12px; min-width: 36px; height: 36px;"
                  >
                    <span class="icon">◉</span>
                  </el-button>
                </el-tooltip>
                <el-tooltip content="前进" placement="top">
                  <el-button
                    circle
                    :type="agvMoveState === 'forward' ? 'success' : 'default'"
                    @click="handleAgvMove('forward')"
                    style="margin: 0 4px; font-size: 18px; min-width: 36px; height: 36px;"
                  >
                    <span class="icon">>></span>
                  </el-button>
                </el-tooltip>
              </el-button-group>
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
import { useFlawStore } from '@/stores/flaw'
import { useVideoStore } from '@/stores/video'
// 修改: 导入新增的API函数
import { getTask, endTask, uploadTask } from '@/api/car/task'
import { listFlaw, liveInfo, checkAllConfirmed } from '@/api/car/flaw'
import { heartbeat, agvForward, agvStop, agvBackward } from '@/api/car/agv'
import { deviceList } from '@/api/car/camera'
import VideoPlayer from '@/components/car/VideoPlayer.vue'
import FlawDetailDialog from '@/components/car/FlawDetailDialog.vue'

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
const agvMoveState = ref('stop') // 可选值: 'stop', 'forward', 'backward'
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
// src/views/TaskExecuteView.vue -> <script setup>

const endTaskExecution = async () => {
  isFinishingTask.value = true;
  try {
    const checkRes = await checkAllConfirmed(taskId);

    // 如果检查不通过
    if (checkRes.code !== 200 || (Array.isArray(checkRes.data) && checkRes.data.length > 0)) {
      try {
        // 弹出一个带有选项的确认框
        await ElMessageBox.confirm(
          '检测到尚有疑似故障未被确认。您希望如何操作？', 
          '存在未确认故障', 
          {
            distinguishCancelAndClose: true,
            confirmButtonText: '完成任务', // 按钮1
            cancelButtonText: '继续处理', // 按钮2
            type: 'warning',
          }
        );
        // 如果用户点击了"强制完成任务"，代码会继续向下执行
        ElMessage.warning('用户选择强制完成，将继续执行任务完成流程...');
      } catch (action) {
        // 如果用户点击了"返回处理故障"或关闭了弹窗
        if (action === 'cancel') {
          ElMessage.info('操作已取消，请继续处理故障。');
          isFinishingTask.value = false;
          return; // 中断整个流程
        }
      }
    }

    // --- 只有在检查通过，或用户选择"强制完成"后，才会执行到这里 ---

    // 弹出最终的确认框
    await ElMessageBox.confirm('确定要完成本次巡检任务吗?', '提示', { type: 'success' });

    ElMessage.info('正在结束任务...');
    await endTask(taskId, false);

    ElMessage.success('任务已成功结束，准备上传数据...');
    await uploadTask(taskId);

    ElMessage.success('任务数据上传成功！即将返回任务列表。');
    router.push('/taskView');

  } catch (error) {
    handleApiError(error);
  } finally {
    isFinishingTask.value = false;
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


//const updateTime = () => { currentTime.value = new Date().toLocaleString() }

// 新的AGV移动控制处理函数
const handleAgvMove = async (command) => {
  // 如果已经是目标状态，则不执行任何操作，防止重复点击
  //if (agvMoveState.value === command) return;

  try {
    let apiCall;
    let successMessage = '';

    if (command === 'forward') {
      apiCall = agvForward();
      successMessage = 'AGV已启动前进';
    } else if (command === 'backward') {
      apiCall = agvBackward();
      successMessage = 'AGV已启动后退';
    } else { // command === 'stop'
      apiCall = agvStop();
      successMessage = 'AGV已停止';
    }

    // 等待API调用完成
    await apiCall;

    // 仅在API调用成功后更新前端UI状态
    agvMoveState.value = command;
    ElMessage.success(successMessage);

  } catch (error) {
    // 如果指令失败，前端状态不改变，并提示用户
    handleApiError(error, 'AGV控制指令发送失败');
  }
};

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

  const response = { code: null, rows: [], data: [] };
  
    if (response.code === 200) {
      // 后端分页结构返回 rows，否则可能直接返回 data
      const allFlaws = response.rows || response.data || []
      flawList.value = allFlaws.filter(flaw => flaw.taskId == taskId)
    }
  
}

// 新增: 高频轮询实时"新增"的故障，用于主动弹窗
const pollForNewFlaws = async () => {
  if (!taskId) return;
  try {
    const res = await liveInfo(taskId);
    if (res?.code === 200 && res.data && Array.isArray(res.data)) {
      res.data.forEach(async (serverFlaw) => {
        const existingFlawIndex = flaws.value.findIndex(f => f.id === serverFlaw.id);

        // 情况一：这是一个全新的故障
        if (existingFlawIndex === -1) {
          // 只有当它未被提示过时，才弹窗
          if (serverFlaw.shown === false) {
            flaws.value.push(serverFlaw); // 添加到列表中
            showFlawDetail(serverFlaw);
            ElMessage.warning(`检测到新的疑似故障：${serverFlaw.flawName}`);
            // 立即更新后端的 shown 状态
            try {
              await updateFlaw({ id: serverFlaw.id, shown: true });
            } catch (updateError) {
              console.error(`Failed to mark flaw ${serverFlaw.id} as shown:`, updateError);
            }
          }
        } 
        // 情况二：这是一个已存在的故障，我们需要更新它的状态
        else {
          // 为了确保Vue能够检测到深层对象的属性变化，
          // 最稳妥的方式是创建一个新对象来替换旧对象。
          const oldFlaw = flaws.value[existingFlawIndex];
          // 合并新旧数据，确保所有字段都被更新
          flaws.value[existingFlawIndex] = { ...oldFlaw, ...serverFlaw };
        }
      });
    }
  } catch (error) {
    console.error('Polling for new flaws failed:', error);
  }
};

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
    currentTime.value = res.data.sysTime;
    currentPosition.value = res.data.currentPosition || 0;
    if (taskInfo.taskTrip > 0) {
      const calculatedProgress = (currentPosition.value / taskInfo.taskTrip) * 100;
      // 新增：使用 Math.min() 取计算结果和100之间的较小值
      progress.value = Math.min(calculatedProgress, 100);
    }
  }
};

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

onMounted(async() => {
  if (!taskId) {
    ElMessage.error('无效的任务ID，即将返回任务列表')
    router.push('/taskView')
    return
  }

  
  loadTaskInfo()
  loadCameraList()
  updateFlawList() // 立即执行一次全量
  updateAGVStatus()
  //updateTime()
  
  // 设置定时轮询
 // pollingIntervals.push(setInterval(updateTime, 1000))
  pollingIntervals.push(setInterval(updateAGVStatus, 1000))
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
.console-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
}
.console-row + .console-row {
    margin-top: 20px;
}
.console-row .el-button {
    flex: 1;
}
.cam-selector {
    flex-grow: 0;
    width: 160px !important;
    margin-right: 24px;
}
.cam-selector .el-select-dropdown__item {
    padding-left: 18px !important;
}
.agv-controls {
    flex-grow: 1;
    display: flex;
    box-shadow: none;
    background: transparent;
    border: none;
    gap: 2px;
    justify-content: flex-end;
}
.agv-controls .el-button {
    border: none !important;
    box-shadow: none !important;
    background: transparent;
    color: #409eff;
    border-radius: 22px;
    font-weight: 600;
    font-size: 18px;
    min-width: 60px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: box-shadow 0.2s, background 0.2s;
}
.agv-controls .el-button.primary, .agv-controls .el-button:focus, .agv-controls .el-button:hover {
    background: #409eff;
    color: #fff;
    border: none !important;
}
.agv-controls .el-button .icon {
    margin-right: 4px;
    font-size: 18px;
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
.agv-move-control-bar {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 24px;
  margin-bottom: 8px;
}

/* 调整 el-switch 样式以匹配原型 */
.agv-move-switch {
  transform: scale(1.5); /* 放大开关 */
}
:deep(.agv-move-switch .el-switch__label) {
  font-size: 14px; /* 调整字体大小 */
}
.agv-controls .el-button:hover,
.agv-controls .el-button:focus {
  background: #f2f6fc !important; /* 柔和的淡灰色，如需完全透明可改为transparent */
  color: #409eff !important;
  box-shadow: 0 2px 12px rgba(64,158,255,0.10);
  border: none !important;
}
.agv-controls .el-button:active {
  background: #e6f0fa !important;
}
</style>