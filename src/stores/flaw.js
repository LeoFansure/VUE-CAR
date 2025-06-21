import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'

export const useFlawStore = defineStore('flaw', () => {
  // 弹窗显示状态
  const visible = ref(false)
  // 当前故障对象
  const flaw = ref(null)
  // 表单数据
  const form = reactive({
    status: '',
    remark: ''
  })
  // 保存按钮加载状态
  const saving = ref(false)

  // 设置弹窗显示
  const setVisible = (val) => { visible.value = val }
  // 设置当前故障
  const setFlaw = (val) => { flaw.value = val }
  // 设置表单
  const setForm = (data) => {
    form.status = data.status || ''
    form.remark = data.remark || ''
  }
  // 重置表单
  const resetForm = () => {
    form.status = ''
    form.remark = ''
  }

  return {
    visible,
    flaw,
    form,
    saving,
    setVisible,
    setFlaw,
    setForm,
    resetForm
  }
}) 