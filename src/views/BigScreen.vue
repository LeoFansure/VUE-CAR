<template>
  <div class="big-screen-container">
    <div class="title">智能巡检综合管理平台</div>
    <div class="button-group">
      <el-button class="big-btn" type="primary" size="large" @click="goCloud">进入云端系统</el-button>
      <el-button class="big-btn" type="success" size="large" @click="goCar">进入小车系统</el-button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
const goCloud = () => {
  router.push({ name: 'cloudSystem' })
}
const goCar = () => {
  router.push({ name: 'initView' })
}
</script>

<style scoped>
.big-screen-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f2027, #2c5364 80%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.title {
  color: #fff;
  font-size: 48px;
  font-weight: bold;
  margin-bottom: 80px;
  letter-spacing: 8px;
  text-shadow: 0 8px 32px #000a, 0 1px 0 #fff3;
}
.button-group {
  display: flex;
  gap: 60px;
}
.big-btn {
  width: 260px;
  height: 100px;
  font-size: 32px;
  border-radius: 20px;
  box-shadow: 0 8px 32px #0005;
  letter-spacing: 4px;
  transition: transform 0.2s;
}
.big-btn:hover {
  transform: scale(1.08);
  filter: brightness(1.1);
}
</style> 