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
    } 
  ],
})

export default router
