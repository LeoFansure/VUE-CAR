<script setup>
import { ref } from 'vue'
import { ElButton } from 'element-plus'
import { useRouter } from 'vue-router'

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
    <ElButton @click="goInitView">系统初始化</ElButton>
    <ElButton @click="goTaskView" type="primary">任务列表</ElButton>
    <ElButton @click="goTaskDetailView" type="success">任务详情</ElButton>
    <ElButton @click="goTaskExecuteView" type="warning">任务执行</ElButton>
    <ElButton @click="goSettingsView" type="danger">系统设置</ElButton>
  </div>
</template>

<style lang="scss" scoped>
.index-container {
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  
  .welcome-content {
    text-align: center;
    color: white;
    
    h1 {
      font-size: 48px;
      margin-bottom: 20px;
      font-weight: 300;
      text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
    
    p {
      font-size: 20px;
      margin-bottom: 40px;
      opacity: 0.9;
    }
  }
}
</style>