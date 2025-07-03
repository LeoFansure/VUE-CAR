import { createRouter, createWebHistory } from 'vue-router'
import BigScreen from '@/views/index/InitView.vue'
import Index from '@/views/car/Index.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'BigScreen',
      component: BigScreen
    },
    // 公共页面
    {
      path: '/initView',
      name: 'initView',
      component: () => import('@/views/index/InitView.vue'),
    },
    // 小车系统相关页面
    {
      path: '/index',
      name: 'index',
      component: () => import('@/views/car/Index.vue'),
    },
    {
      path: '/globalControl',
      name: 'globalControl',
      component: () => import('@/views/car/GlobalControlView.vue'),
    },
    {
      path: '/taskView',
      name: 'taskView',
      component: () => import('@/views/car/TaskView.vue'),
    },
    {
      path: '/taskDetailView',
      name: 'taskDetailView',
      component: () => import('@/views/car/TaskDetailView.vue'),
    },
    {
      path: '/taskExecuteView',
      name: 'taskExecuteView',
      component: () => import('@/views/car/TaskExecuteView.vue'),
    },
    {
      path: '/settingsView',
      name: 'settingsView',
      component: () => import('@/views/car/SettingsView.vue'),
    },
    // 云端系统相关页面
    {
      path: '/cloudSystem',
      name: 'cloudSystem',
      component: () => import('@/views/cloud/CloudSystemView.vue'),
    },
    {
      path: '/cloudConfig',
      name: 'cloudConfig',
      component: () => import('@/views/cloud/CloudConfigView.vue'),
    },
    {
      path: '/cloudTask',
      name: 'cloudTask',
      component: () => import('@/views/cloud/CloudTaskView.vue'),
    },
    {
      path: '/cloudFlaw',
      name: 'cloudFlaw',
      component: () => import('@/views/cloud/CloudFlawView.vue'),
    },
    {
      path: '/cloudTest',
      name: 'cloudTest',
      // component: () => import('@/views/cloud/CloudTestView.vue'),
    },
    {
      path: '/cloud/task/detail/:id',
      name: 'cloudTaskDetail',
      component: () => import('@/views/cloud/CloudTaskDetailView.vue'),
    }
  ],
})

export default router
