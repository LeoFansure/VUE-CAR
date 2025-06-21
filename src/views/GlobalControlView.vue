<script setup>
import { ref, onMounted } from 'vue'
import { ElButton, ElCard, ElTable, ElTableColumn, ElTag, ElAlert, ElDivider, ElRow, ElCol, ElStatistic, ElIcon, ElMessage, ElEmpty } from 'element-plus'
import { VideoCamera, Setting, Document, TrendCharts, Connection, Warning, CircleCheck, InfoFilled } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 响应式数据
const agvStatus = ref({
  sysTime: '2024-01-01 12:00:00',
  isRunning: false,
  currentPosition: 0
})

const systemStatus = ref({
  fs: true,
  db: true,
  agv: true,
  cam: true
})

const currentTask = ref(null)
const flawList = ref([])

// 控制状态
const isConnected = ref(true)
const isTaskRunning = ref(false)
const currentCamera = ref(1)
const audioEnabled = ref(false)

// 摄像头相关
const videoRef = ref(null)
const isVideoPlaying = ref(false)
const videoStream = ref(null)

// 获取任务状态类型
const getTaskStatusType = (status) => {
  const statusMap = {
    '待巡视': 'info',
    '巡视中': 'warning',
    '待上传': 'primary',
    '已完成': 'success'
  }
  return statusMap[status] || 'info'
}

// AGV控制函数
const controlAgv = async (action) => {
  ElMessage.success(`${action === 'forward' ? '前进' : action === 'stop' ? '停止' : '后退'}指令发送成功`)
}

// 切换摄像头
const switchCamera = (cameraId) => {
  currentCamera.value = cameraId
  ElMessage.info(`切换到摄像头 ${cameraId}`)
  // 这里可以添加实际的摄像头切换逻辑
  startVideoStream(cameraId)
}

// 切换音频
const toggleAudio = () => {
  audioEnabled.value = !audioEnabled.value
  ElMessage.info(audioEnabled.value ? '音频已开启' : '音频已关闭')
}

// 启动视频流
const startVideoStream = (cameraId) => {
  // 模拟视频流启动
  isVideoPlaying.value = true
  ElMessage.success(`摄像头 ${cameraId} 视频流已启动`)
}

// 停止视频流
const stopVideoStream = () => {
  isVideoPlaying.value = false
  ElMessage.info('视频流已停止')
}

// 全屏显示
const toggleFullscreen = () => {
  if (videoRef.value) {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      videoRef.value.requestFullscreen()
    }
  }
}

// 截图功能
const takeScreenshot = () => {
  ElMessage.success('截图已保存')
}

// 启动任务
const startTask = async (taskId) => {
  ElMessage.success('任务启动成功')
}

// 结束任务
const endTask = async (taskId, isAbort = false) => {
  ElMessage.success(isAbort ? '任务已中止' : '任务已完成')
}

// 确认故障
const confirmFlaw = async (flawId) => {
  ElMessage.success('故障已确认')
}

// 上传任务数据
const uploadTaskData = async (taskId) => {
  ElMessage.success('数据上传成功')
}

// 页面跳转
const goToPage = (page) => {
  router.push(`/${page}`)
}

// 模拟数据
onMounted(() => {
  console.log('GlobalControlView 组件已挂载')
  
  // 模拟当前任务
  currentTask.value = {
    id: 1,
    taskCode: 'TASK001',
    taskName: '隧道巡检任务',
    executor: '张三',
    taskStatus: '待巡视'
  }
  
  // 模拟故障列表
  flawList.value = [
    {
      id: 1,
      flawType: '裂缝',
      flawName: '隧道壁裂缝',
      flawDistance: 150,
      confirmed: false
    },
    {
      id: 2,
      flawType: '渗水',
      flawName: '顶部渗水',
      flawDistance: 300,
      confirmed: true
    }
  ]
  
  // 启动默认摄像头
  startVideoStream(currentCamera.value)
})
</script>

<template>
  <div class="global-control-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>全局控制中心</h1>
      <p>AGV智能巡检系统实时监控与控制</p>
    </div>

    <el-row :gutter="20">
      <!-- 左侧：数据监控区域 -->
      <el-col :span="12">
        <el-card class="monitor-card">
          <template #header>
            <div class="card-header">
              <el-icon><Connection /></el-icon>
              <span>数据监控</span>
            </div>
          </template>

          <!-- 系统状态 -->
          <div class="status-section">
            <h3>系统状态</h3>
            <el-row :gutter="10">
              <el-col :span="6">
                <el-statistic title="文件系统" :value="systemStatus.fs ? '正常' : '异常'">
                  <template #prefix>
                    <el-icon :color="systemStatus.fs ? '#67C23A' : '#F56C6C'">
                      <CircleCheck v-if="systemStatus.fs" />
                      <Warning v-else />
                    </el-icon>
                  </template>
                </el-statistic>
              </el-col>
              <el-col :span="6">
                <el-statistic title="数据库" :value="systemStatus.db ? '正常' : '异常'">
                  <template #prefix>
                    <el-icon :color="systemStatus.db ? '#67C23A' : '#F56C6C'">
                      <CircleCheck v-if="systemStatus.db" />
                      <Warning v-else />
                    </el-icon>
                  </template>
                </el-statistic>
              </el-col>
              <el-col :span="6">
                <el-statistic title="AGV连接" :value="systemStatus.agv ? '正常' : '异常'">
                  <template #prefix>
                    <el-icon :color="systemStatus.agv ? '#67C23A' : '#F56C6C'">
                      <CircleCheck v-if="systemStatus.agv" />
                      <Warning v-else />
                    </el-icon>
                  </template>
                </el-statistic>
              </el-col>
              <el-col :span="6">
                <el-statistic title="摄像头" :value="systemStatus.cam ? '正常' : '异常'">
                  <template #prefix>
                    <el-icon :color="systemStatus.cam ? '#67C23A' : '#F56C6C'">
                      <CircleCheck v-if="systemStatus.cam" />
                      <Warning v-else />
                    </el-icon>
                  </template>
                </el-statistic>
              </el-col>
            </el-row>
          </div>

          <el-divider />

          <!-- AGV状态 -->
          <div class="status-section">
            <h3>AGV实时状态</h3>
            <el-alert
              :title="isConnected ? 'AGV已连接' : 'AGV连接异常'"
              :type="isConnected ? 'success' : 'error'"
              :closable="false"
              show-icon
            />
            <div class="agv-info">
              <p><strong>系统时间：</strong>{{ agvStatus.sysTime }}</p>
              <p><strong>运行状态：</strong>
                <el-tag :type="agvStatus.isRunning ? 'success' : 'info'">
                  {{ agvStatus.isRunning ? '运行中' : '已停止' }}
                </el-tag>
              </p>
              <p><strong>当前位置：</strong>{{ agvStatus.currentPosition }} 米</p>
            </div>
          </div>

          <el-divider />

          <!-- 当前任务 -->
          <div class="status-section">
            <h3>当前任务</h3>
            <div v-if="currentTask" class="task-info">
              <p><strong>任务编号：</strong>{{ currentTask.taskCode }}</p>
              <p><strong>任务名称：</strong>{{ currentTask.taskName }}</p>
              <p><strong>执行人：</strong>{{ currentTask.executor }}</p>
              <p><strong>状态：</strong>
                <el-tag :type="getTaskStatusType(currentTask.taskStatus)">
                  {{ currentTask.taskStatus }}
                </el-tag>
              </p>
            </div>
            <el-empty v-else description="暂无运行中的任务" />
          </div>

          <el-divider />

          <!-- 故障列表 -->
          <div class="status-section">
            <h3>最新故障</h3>
            <el-table :data="flawList" height="200" size="small">
              <el-table-column prop="flawType" label="类型" width="80" />
              <el-table-column prop="flawName" label="故障名称" />
              <el-table-column prop="flawDistance" label="距离" width="80">
                <template #default="scope">
                  {{ scope.row.flawDistance }}m
                </template>
              </el-table-column>
              <el-table-column prop="confirmed" label="状态" width="80">
                <template #default="scope">
                  <el-tag :type="scope.row.confirmed ? 'success' : 'warning'" size="small">
                    {{ scope.row.confirmed ? '已确认' : '待确认' }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：控制操作区域 -->
      <el-col :span="12">
        <el-card class="control-card">
          <template #header>
            <div class="card-header">
              <el-icon><Setting /></el-icon>
              <span>控制操作</span>
            </div>
          </template>

          <!-- 摄像头视频显示 -->
          <div class="video-section">
            <h3>摄像头监控</h3>
            <div class="video-container">
              <div class="video-display" ref="videoRef">
                <div v-if="!isVideoPlaying" class="video-placeholder">
                  <el-icon :size="48"><VideoCamera /></el-icon>
                  <p>摄像头 {{ currentCamera }} 视频流</p>
                  <p class="video-status">视频状态: {{ isVideoPlaying ? '播放中' : '已停止' }}</p>
                </div>
                <div v-else class="video-stream">
                  <div class="video-overlay">
                    <div class="camera-info">
                      <el-tag type="primary">摄像头 {{ currentCamera }}</el-tag>
                      <el-tag :type="audioEnabled ? 'success' : 'info'">
                        {{ audioEnabled ? '音频开启' : '音频关闭' }}
                      </el-tag>
                    </div>
                  </div>
                  <!-- 这里可以放置实际的视频元素 -->
                  <div class="video-content">
                    <div class="video-frame">
                      <div class="video-placeholder-content">
                        <el-icon :size="64"><VideoCamera /></el-icon>
                        <p>实时视频流</p>
                        <p class="camera-details">摄像头 {{ currentCamera }} - 隧道巡检监控</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 视频控制按钮 -->
              <div class="video-controls">
                <el-button 
                  :type="isVideoPlaying ? 'danger' : 'success'"
                  @click="isVideoPlaying ? stopVideoStream() : startVideoStream(currentCamera)"
                >
                  {{ isVideoPlaying ? '停止' : '播放' }}
                </el-button>
                <el-button @click="toggleFullscreen">
                  全屏
                </el-button>
                <el-button @click="takeScreenshot">
                  截图
                </el-button>
              </div>
            </div>
          </div>

          <el-divider />

          <!-- AGV移动控制 -->
          <div class="control-section">
            <h3>AGV移动控制</h3>
            <div class="control-buttons">
              <el-button 
                type="primary" 
                size="large" 
                @click="controlAgv('forward')"
              >
                前进
              </el-button>
              <el-button 
                type="danger" 
                size="large" 
                @click="controlAgv('stop')"
              >
                停止
              </el-button>
              <el-button 
                type="warning" 
                size="large" 
                @click="controlAgv('backward')"
              >
                后退
              </el-button>
            </div>
          </div>

          <el-divider />

          <!-- 摄像头控制 -->
          <div class="control-section">
            <h3>摄像头控制</h3>
            <div class="camera-controls">
              <div class="camera-buttons">
                <el-button 
                  v-for="i in 4" 
                  :key="i"
                  :type="currentCamera === i ? 'primary' : 'default'"
                  @click="switchCamera(i)"
                >
                  摄像头{{ i }}
                </el-button>
              </div>
              <div class="audio-control">
                <el-button 
                  :type="audioEnabled ? 'success' : 'default'"
                  @click="toggleAudio"
                >
                  {{ audioEnabled ? '关闭音频' : '开启音频' }}
                </el-button>
              </div>
            </div>
          </div>

          <el-divider />

          <!-- 任务控制 -->
          <div class="control-section">
            <h3>任务控制</h3>
            <div class="task-controls">
              <el-button 
                type="success" 
                @click="startTask(currentTask?.id)"
              >
                启动任务
              </el-button>
              <el-button 
                type="warning" 
                @click="endTask(currentTask?.id, false)"
              >
                完成任务
              </el-button>
              <el-button 
                type="danger" 
                @click="endTask(currentTask?.id, true)"
              >
                中止任务
              </el-button>
            </div>
          </div>

          <el-divider />

          <!-- 故障处理 -->
          <div class="control-section">
            <h3>故障处理</h3>
            <div class="flaw-controls">
              <el-button 
                type="primary" 
                @click="() => ElMessage.info('故障列表已刷新')"
              >
                刷新故障列表
              </el-button>
              <el-button 
                type="success" 
                @click="confirmFlaw(flawList[0]?.id)"
                :disabled="!flawList.length || flawList[0]?.confirmed"
              >
                确认最新故障
              </el-button>
            </div>
          </div>

          <el-divider />

          <!-- 数据上传 -->
          <div class="control-section">
            <h3>数据上传</h3>
            <div class="upload-controls">
              <el-button 
                type="primary" 
                @click="uploadTaskData(currentTask?.id)"
              >
                上传任务数据
              </el-button>
            </div>
          </div>

          <el-divider />

          <!-- 页面导航 -->
          <div class="control-section">
            <h3>页面导航</h3>
            <div class="navigation-buttons">
              <el-button @click="goToPage('initView')" type="info">
                <el-icon><Setting /></el-icon>
                系统初始化
              </el-button>
              <el-button @click="goToPage('taskView')" type="primary">
                <el-icon><Document /></el-icon>
                任务列表
              </el-button>
              <el-button @click="goToPage('taskDetailView')" type="success">
                <el-icon><TrendCharts /></el-icon>
                任务详情
              </el-button>
              <el-button @click="goToPage('taskExecuteView')" type="warning">
                <el-icon><VideoCamera /></el-icon>
                任务执行
              </el-button>
              <el-button @click="goToPage('settingsView')" type="danger">
                <el-icon><Setting /></el-icon>
                系统设置
              </el-button>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style lang="scss" scoped>
.global-control-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;

  .page-header {
    text-align: center;
    margin-bottom: 30px;
    
    h1 {
      font-size: 32px;
      color: #303133;
      margin-bottom: 10px;
    }
    
    p {
      font-size: 16px;
      color: #909399;
    }
  }

  .monitor-card, .control-card {
    height: calc(100vh - 200px);
    overflow-y: auto;

    .card-header {
      display: flex;
      align-items: center;
      font-size: 18px;
      font-weight: bold;
      
      .el-icon {
        margin-right: 8px;
        font-size: 20px;
      }
    }
  }

  .status-section, .control-section, .video-section {
    margin-bottom: 20px;

    h3 {
      font-size: 16px;
      color: #303133;
      margin-bottom: 15px;
      border-left: 4px solid #409EFF;
      padding-left: 10px;
    }
  }

  .video-section {
    .video-container {
      .video-display {
        width: 100%;
        height: 300px;
        background: #000;
        border-radius: 8px;
        overflow: hidden;
        position: relative;
        margin-bottom: 15px;

        .video-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #fff;
          
          .el-icon {
            color: #409EFF;
            margin-bottom: 10px;
          }
          
          p {
            margin: 5px 0;
            font-size: 14px;
          }
          
          .video-status {
            color: #909399;
            font-size: 12px;
          }
        }

        .video-stream {
          position: relative;
          height: 100%;

          .video-overlay {
            position: absolute;
            top: 10px;
            left: 10px;
            z-index: 10;

            .camera-info {
              display: flex;
              gap: 10px;
            }
          }

          .video-content {
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;

            .video-frame {
              width: 100%;
              height: 100%;
              background: linear-gradient(45deg, #1a1a1a, #2a2a2a);
              display: flex;
              align-items: center;
              justify-content: center;

              .video-placeholder-content {
                text-align: center;
                color: #fff;

                .el-icon {
                  color: #409EFF;
                  margin-bottom: 15px;
                }

                p {
                  margin: 5px 0;
                  font-size: 16px;
                }

                .camera-details {
                  color: #909399;
                  font-size: 12px;
                }
              }
            }
          }
        }
      }

      .video-controls {
        display: flex;
        gap: 10px;
        justify-content: center;
        margin-bottom: 15px;
      }
    }
  }

  .agv-info, .task-info {
    p {
      margin: 8px 0;
      font-size: 14px;
      
      strong {
        color: #606266;
      }
    }
  }

  .control-buttons, .task-controls, .flaw-controls, .upload-controls {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .camera-controls {
    .camera-buttons {
      display: flex;
      gap: 10px;
      margin-bottom: 15px;
      flex-wrap: wrap;
    }
    
    .audio-control {
      margin-top: 10px;
    }
  }

  .navigation-buttons {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    
    .el-button {
      display: flex;
      align-items: center;
      
      .el-icon {
        margin-right: 5px;
      }
    }
  }

  .el-statistic {
    text-align: center;
  }

  .el-table {
    border-radius: 8px;
    overflow: hidden;
  }
}
</style> 