<template>
  <el-dialog
    v-model="visible"
    title="故障详情"
    width="600px"
    :before-close="handleClose"
  >
    <div class="flaw-detail">
      <div class="flaw-image">
        <el-image
          :src="flaw.flawImageUrl"
          fit="cover"
          :preview-src-list="[flaw.flawImageUrl]"
        >
          <template #error>
            <div class="image-error">
              <el-icon><Picture /></el-icon>
              <span>图片加载失败</span>
            </div>
          </template>
        </el-image>
      </div>

      <div class="flaw-info">
        <div class="info-item">
          <span class="label">故障名称：</span>
          <span class="value">{{ flaw.flawName }}</span>
        </div>
        <div class="info-item">
          <span class="label">故障类型：</span>
          <span class="value">{{ flaw.flawType }}</span>
        </div>
        <div class="info-item">
          <span class="label">故障位置：</span>
          <span class="value">{{ flaw.flawDistance }}m</span>
        </div>
        <div class="info-item">
          <span class="label">发现时间：</span>
          <span class="value">{{ formatDateTime(flaw.createTime) }}</span>
        </div>
        <div class="info-item">
          <span class="label">故障描述：</span>
          <span class="value">{{ flaw.flawDesc }}</span>
        </div>
      </div>

      <div class="flaw-handling">
        <el-form
          ref="formRef"
          :model="form"
          label-width="100px"
        >
          <el-form-item label="确认故障" prop="confirmed">
            <el-switch v-model="form.confirmed" />
          </el-form-item>

          <el-form-item label="补充说明" prop="remark">
            <el-input
              v-model="form.remark"
              type="textarea"
              :rows="3"
              placeholder="请输入补充说明或现场观察记录"
            />
          </el-form-item>
        </el-form>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">
          保存
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Picture } from '@element-plus/icons-vue'
// 修正: 从 @/api/flaw 导入 updateFlaw
import { updateFlaw } from '@/api/flaw' 
import { formatDateTime } from '@/utils/common' // 假设您有这个工具函数
import { useFlawStore } from '@/stores/flaw'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  flaw: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'saved'])

const formRef = ref(null) // 表单引用

// 使用 pinia store
const flawStore = useFlawStore()
// 从 store 中解构出状态和方法
const { visible, form, saving, setVisible, setForm } = flawStore

// 监听父组件传入的 modelValue 来控制弹窗显示
watch(() => props.modelValue, (val) => {
  setVisible(val)
})

// 监听内部 visible 变化，同步到父组件
watch(() => visible.value, (val) => {
  emit('update:modelValue', val)
})

// 监听传入的 flaw 对象，当它变化时，更新表单
watch(() => props.flaw, (newFlaw) => {
  if (newFlaw) {
    // 使用修改后的 setForm 方法
    setForm({ confirmed: newFlaw.confirmed, remark: newFlaw.remark })
  }
}, { immediate: true, deep: true })

// 关闭弹窗
const handleClose = () => {
  setVisible(false)
}

// 保存处理结果
const handleSave = async () => {
  try {
    // 更新: 提交前不再需要校验，因为开关和文本域通常不需要复杂规则
    flawStore.saving = true
    // 更新: 提交的数据结构与 API 对齐
    const res = await updateFlaw({
      id: props.flaw.id,
      confirmed: form.confirmed,
      remark: form.remark
    })

    // 检查API返回结果
    if (res.code === 200) {
      ElMessage.success('保存成功')
      emit('saved') // 通知父组件保存成功，以便刷新列表
      handleClose()
    } else {
      ElMessage.error('保存失败：' + (res.msg || '未知错误'))
    }
  } catch (error) {
    ElMessage.error('保存失败：' + (error.message || '网络错误'))
  } finally {
    flawStore.saving = false
  }
}
</script>

<style lang="scss" scoped>
/* 样式与原文件保持一致，此处省略以保持简洁 */
.flaw-detail {
  .flaw-image {
    margin-bottom: 20px;
    .el-image {
      width: 100%;
      height: 300px;
      border-radius: 8px;
      overflow: hidden;
      .image-error {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: #f5f7fa;
        color: #909399;
        .el-icon {
          font-size: 48px;
          margin-bottom: 8px;
        }
      }
    }
  }
  .flaw-info {
    margin-bottom: 20px;
    padding: 16px;
    background: #f5f7fa;
    border-radius: 8px;
    .info-item {
      display: flex;
      margin-bottom: 12px;
      &:last-child {
        margin-bottom: 0;
      }
      .label {
        width: 100px;
        color: #606266;
        flex-shrink: 0;
      }
      .value {
        flex: 1;
        color: #303133;
      }
    }
  }
}

.dialog-footer {
  text-align: center;
  .el-button {
    min-width: 80px;
  }
}
</style>