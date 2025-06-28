import { createRouter, createWebHistory } from 'vue-router'
// import Index from '../views/Index.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/initView'
    },
    {
      path: '/index',
      name: 'index',
      component: () => import('../views/Index.vue'),
    },
    {
      path: '/globalControl',
      name: 'globalControl',
      component: () => import('../views/GlobalControlView.vue'),
    },
    {
      path: '/initView',
      name: 'initView',
      component: () => import('../views/InitView.vue'),
    },
    {
      path: '/taskView',
      name: 'taskView',
      component: () => import('../views/TaskView.vue'),
    },
    {
      path: '/taskDetailView',
      name: 'taskDetailView',
      component: () => import('../views/TaskDetailView.vue'),
    },
    {
      path: '/taskExecuteView',
      name: 'taskExecuteView',
      component: () => import('../views/TaskExecuteView.vue'),
    },
    {
      path: '/settingsView',
      name: 'settingsView',
      component: () => import('../views/SettingsView.vue'),
    },
    {
      path: '/cloudSystem',
      name: 'cloudSystem',
      component: () => import('../views/CloudSystemView.vue'),
    },
    {
      path: '/cloudConfig',
      name: 'cloudConfig',
      component: () => import('../views/CloudConfigView.vue'),
    },
    {
      path: '/cloudTask',
      name: 'cloudTask',
      component: () => import('../views/CloudTaskView.vue'),
    },
    {
      path: '/cloudFlaw',
      name: 'cloudFlaw',
      component: () => import('../views/CloudFlawView.vue'),
    },
    {
      path: '/cloudTest',
      name: 'cloudTest',
      component: () => import('../views/CloudTestView.vue'),
    }
  ],
})

export default router
