<script setup>
import { ref } from 'vue'
import { ElButton, ElIcon } from 'element-plus'
import { useRouter } from 'vue-router'
import { Setting, Document, TrendCharts, VideoCamera, Goods } from '@element-plus/icons-vue'

const router = useRouter()

const goInitView = () => {
    router.push('/initView')
}

const goTaskView = () => {
    router.push('/taskView')
}

const goTaskDetailView = () => {
    router.push('/taskDetailView')
}

const goTaskExecuteView = () => {
    router.push('/taskExecuteView')
}

const goSettingsView = () => {
    router.push('/settingsView')
}
</script>

<template>
  <div class="index-container">
    <div class="header-section">
      <h1 class="main-title">
        <el-icon :size="50"><Goods /></el-icon>
        AGV智能巡检系统
      </h1>
      <p class="subtitle">低保真原型页面导航</p>
      <p class="description">地轨隧道巡线智能巡检系统的交互原型展示。本系统实现了AGV自动巡检、实时监控、故障识别、数据上传等核心功能。</p>
    </div>

    <div class="cards-grid">
      <!-- Card 1: 系统初始化页面 -->
      <div class="card">
        <el-icon :size="48"><Setting /></el-icon>
        <h2 class="card-title">系统初始化页面</h2>
        <p class="card-description">系统启动时的自检页面，检查文件完整性、数据库连接、AGV通信和摄像头状态，确保系统正常运行。</p>
        <div class="card-functions">
          <el-button size="small" plain>系统自检</el-button>
          <el-button size="small" plain>状态展示</el-button>
          <el-button size="small" plain>错误诊断</el-button>
          <el-button size="small" plain>设置入口</el-button>
        </div>
        <el-button class="view-prototype-btn" @click="goInitView">查看原型</el-button>
      </div>

      <!-- Card 2: 任务列表页面 -->
      <div class="card">
        <el-icon :size="48"><Document /></el-icon>
        <h2 class="card-title">任务列表页面</h2>
        <p class="card-description">巡检任务管理中心，支持任务的创建、编辑、删除、搜索和状态管理，提供完整的任务生命周期管理。</p>
        <div class="card-functions">
          <el-button size="small" plain>任务搜索</el-button>
          <el-button size="small" plain>新增任务</el-button>
          <el-button size="small" plain>状态管理</el-button>
          <el-button size="small" plain>数据上传</el-button>
        </div>
        <el-button class="view-prototype-btn" @click="goTaskView">查看原型</el-button>
      </div>

      <!-- Card 3: 任务详情页面 -->
      <div class="card">
        <el-icon :size="48"><TrendCharts /></el-icon>
        <h2 class="card-title">任务详情页面</h2>
        <p class="card-description">已完成任务的详细查看页面，展示故障图片、位置标记、处理结果，支持故障确认和备注功能。</p>
        <div class="card-functions">
          <el-button size="small" plain>故障图片</el-button>
          <el-button size="small" plain>位置标记</el-button>
          <el-button size="small" plain>故障确认</el-button>
          <el-button size="small" plain>进度展示</el-button>
        </div>
        <el-button class="view-prototype-btn" @click="goTaskDetailView">查看原型</el-button>
      </div>

      <!-- Card 4: 任务执行页面 -->
      <div class="card">
        <el-icon :size="48"><VideoCamera /></el-icon>
        <h2 class="card-title">任务执行页面</h2>
        <p class="card-description">实时巡检控制台，显示视频流、AGV状态、实时位置，支持车辆控制和故障实时处理。</p>
        <div class="card-functions">
          <!-- Add specific buttons if visible in a clearer prototype. For now, empty or general buttons. -->
          <el-button size="small" plain>实时监控</el-button>
          <el-button size="small" plain>车辆控制</el-button>
          <el-button size="small" plain>故障处理</el-button>
        </div>
        <el-button class="view-prototype-btn" @click="goTaskExecuteView">查看原型</el-button>
      </div>

      <!-- Card 5: 系统设置页面 -->
      <div class="card">
        <el-icon :size="48"><Setting /></el-icon>
        <h2 class="card-title">系统设置页面</h2>
        <p class="card-description">系统配置管理页面，设置AGV连接参数、摄像头配置、云端平台地址等系统核心参数。</p>
        <div class="card-functions">
          <!-- Add specific buttons if visible in a clearer prototype. For now, empty or general buttons. -->
          <el-button size="small" plain>参数配置</el-button>
          <el-button size="small" plain>平台管理</el-button>
        </div>
        <el-button class="view-prototype-btn" @click="goSettingsView">查看原型</el-button>
      </div>

      <!-- Placeholder for a potential 6th card if needed, based on common grid layouts, though only 5 are clear -->
      <!-- <div class="card">
        <el-icon :size="48"><MoreFilled /></el-icon>
        <h2 class="card-title">更多功能</h2>
        <p class="card-description">这里可以放置更多即将开发或不常用的功能入口。</p>
        <div class="card-functions">
          <el-button size="small" plain>功能A</el-button>
          <el-button size="small" plain>功能B</el-button>
        </div>
        <el-button class="view-prototype-btn">查看更多</el-button>
      </div> -->
    </div>
  </div>
</template>

<style lang="scss" scoped>
.index-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  box-sizing: border-box;
}

.header-section {
  text-align: center;
  color: white;
  margin-bottom: 50px;

  .main-title {
    font-size: 48px;
    margin-bottom: 20px;
    font-weight: 300;
    text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;

    .el-icon {
      margin-right: 15px;
      font-size: 50px;
    }
  }

  .subtitle {
    font-size: 24px;
    margin-bottom: 15px;
    opacity: 0.9;
  }

  .description {
    font-size: 18px;
    margin-bottom: 0;
    max-width: 800px;
    line-height: 1.6;
    opacity: 0.8;
  }
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  max-width: 1200px;
  width: 100%;
}

.card {
  background-color: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 35px rgba(0,0,0,0.2);
  }

  .el-icon {
    color: #667eea;
    margin-bottom: 20px;
  }

  .card-title {
    font-size: 24px;
    color: #333;
    margin-bottom: 10px;
  }

  .card-description {
    font-size: 15px;
    color: #666;
    margin-bottom: 25px;
    line-height: 1.5;
    flex-grow: 1;
  }

  .card-functions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
    margin-bottom: 25px;

    .el-button {
      border-radius: 20px;
      padding: 8px 15px;
      font-size: 13px;
      color: #667eea;
      border-color: #667eea;
      background-color: #f0f4ff;

      &:hover {
        background-color: #667eea;
        color: white;
      }
    }
  }

  .view-prototype-btn {
    width: 80%;
    margin-top: auto;
    background-color: #667eea;
    color: white;
    border-color: #667eea;
    border-radius: 25px;
    font-size: 16px;
    padding: 12px 0;

    &:hover {
      background-color: #764ba2;
      border-color: #764ba2;
    }
  }
}
</style>