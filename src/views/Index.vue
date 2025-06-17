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
    <div>
        <ElButton @click="goInitView">系统初始化</ElButton>
        <ElButton @click="goTaskView" type="primary">任务列表</ElButton>
        <ElButton @click="goTaskDetailView" type="success">任务详情</ElButton>
        <ElButton @click="goTaskExecuteView" type="warning">任务执行</ElButton>
        <ElButton @click="goSettingsView" type="danger">系统设置</ElButton>
    </div>
</template>


<style lang="scss" scoped>

</style>