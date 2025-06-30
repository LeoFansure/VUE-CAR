import { createRouter, createWebHistory } from 'vue-router'
// import Index from '../views/Index.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/initView'
    },
    // 公共页面
    {
      path: '/initView',
      name: 'initView',
      component: () => import('../views/InitView.vue'),
    },
    // 小车系统相关页面
    {
      path: '/index',
      name: 'index',
      component: () => import('../car/views/Index.vue'),
    },
    {
      path: '/globalControl',
      name: 'globalControl',
      component: () => import('../car/views/GlobalControlView.vue'),
    },
    {
      path: '/taskView',
      name: 'taskView',
      component: () => import('../car/views/TaskView.vue'),
    },
    {
      path: '/taskDetailView',
      name: 'taskDetailView',
      component: () => import('../car/views/TaskDetailView.vue'),
    },
    {
      path: '/taskExecuteView',
      name: 'taskExecuteView',
      component: () => import('../car/views/TaskExecuteView.vue'),
    },
    {
      path: '/settingsView',
      name: 'settingsView',
      component: () => import('../car/views/SettingsView.vue'),
    },
    // 云端系统相关页面
    {
      path: '/cloudSystem',
      name: 'cloudSystem',
      component: () => import('../cloud/views/CloudSystemView.vue'),
    },
    {
      path: '/cloudConfig',
      name: 'cloudConfig',
      component: () => import('../cloud/views/CloudConfigView.vue'),
    },
    {
      path: '/cloudTask',
      name: 'cloudTask',
      component: () => import('../cloud/views/CloudTaskView.vue'),
    },
    {
      path: '/cloudFlaw',
      name: 'cloudFlaw',
      component: () => import('../cloud/views/CloudFlawView.vue'),
    },
    {
      path: '/cloudTest',
      name: 'cloudTest',
      component: () => import('../cloud/views/CloudTestView.vue'),
    },
  ],
})

export default router
