import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'

export const useFlawStore = defineStore('flaw', () => {
  // 弹窗显示状态
  const visible = ref(false)
  // 当前操作的故障对象
  const flaw = ref(null)
  // 保存按钮的加载状态
  const saving = ref(false)

  
  const form = reactive({
    confirmed: false, 
    remark: ''
  })

  // 设置弹窗的显示/隐藏
  const setVisible = (val) => {
    visible.value = val
  }

  // 设置当前要操作的故障对象
  const setFlaw = (val) => {
    flaw.value = val
  }


  const setForm = (data) => {
    // 如果传入的 data.confirmed 是 null 或 undefined，则默认为 false
    form.confirmed = data.confirmed || false
    form.remark = data.remark || ''
  }

  // 新增: 为 saving 状态添加一个 setter
  const setSaving = (val) => { saving.value = val }
 
  const resetForm = () => {
    form.confirmed = false
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