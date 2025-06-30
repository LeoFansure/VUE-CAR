// src/stores/flaw.js

import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'

export const useFlawStore = defineStore('flaw', () => {
  // 弹窗的显示状态
  const visible = ref(false)
  // 当前正在操作的故障对象
  const flaw = ref(null)
  // 弹窗内部表单的数据模型
  const form = reactive({
    // confirmed 允许为 null，代表“疑似”状态
    confirmed: null, 
    remark: ''
  })
  // “保存”按钮的加载状态
  const saving = ref(false)

  // --- Actions ---

  // 设置弹窗是否可见
  const setVisible = (val) => {
    visible.value = val
  }

  // 设置当前要操作的故障对象
  const setFlaw = (val) => {
    flaw.value = val
  }

  // 设置保存按钮的加载状态
  const setSaving = (val) => {
    saving.value = val
  }

  // 根据传入的数据，设置表单的初始值
  const setForm = (data) => {
    // 如果传入的 confirmed 是 undefined，则设为 null (代表疑似)，否则使用原值
    form.confirmed = data.confirmed === undefined ? null : data.confirmed
    form.remark = data.remark || ''
  }
  
  // 重置表单状态，在关闭弹窗时调用
  const resetForm = () => {
    form.confirmed = null
    form.remark = ''
  }

  return {
    visible,
    flaw,
    form,
    saving,
    setVisible,
    setFlaw,
    setSaving,
    setForm,
    resetForm // 导出 resetForm 方法
  }
})