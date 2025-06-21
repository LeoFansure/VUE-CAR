<template>
  <el-dialog
    v-model="visible"
    title="故障详情"
    width="600px"
    :before-close="handleClose"
  >
    <div class="flaw-detail">
      <!-- 故障图片 -->
      <div class="flaw-image">
        <el-image
          :src="flaw.imageUrl"
          fit="cover"
          :preview-src-list="[flaw.imageUrl]"
        >
          <template #error>
            <div class="image-error">
              <el-icon><Picture /></el-icon>
              <span>图片加载失败</span>
            </div>
          </template>
        </el-image>
      </div>
      
      <!-- 故障信息 -->
      <div class="flaw-info">
        <div class="info-item">
          <span class="label">故障编号：</span>
          <span class="value">{{ flaw.flawCode }}</span>
        </div>
        <div class="info-item">
          <span class="label">故障类型：</span>
          <span class="value">{{ flaw.flawType }}</span>
        </div>
        <div class="info-item">
          <span class="label">故障位置：</span>
          <span class="value">{{ flaw.position }}m</span>
        </div>
        <div class="info-item">
          <span class="label">发现时间：</span>
          <span class="value">{{ formatDateTime(flaw.detectTime) }}</span>
        </div>
        <div class="info-item">
          <span class="label">故障描述：</span>
          <span class="value">{{ flaw.description }}</span>
        </div>
      </div>
      
      <!-- 故障处理 -->
      <div class="flaw-handling">
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-width="100px"
        >
          <el-form-item label="处理状态" prop="status">
            <el-select v-model="form.status" placeholder="请选择处理状态">
              <el-option label="待处理" value="pending" />
              <el-option label="处理中" value="processing" />
              <el-option label="已处理" value="resolved" />
              <el-option label="已忽略" value="ignored" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="处理备注" prop="remark">
            <el-input
              v-model="form.remark"
              type="textarea"
              :rows="3"
              placeholder="请输入处理备注"
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
import { updateFlaw } from '@/api/task'
import { formatDateTime } from '@/utils/common'
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

// 使用 pinia store
const flawStore = useFlawStore()
const { visible, form, saving, setVisible, setForm, resetForm } = flawStore

// 监听visible变化
watch(() => props.modelValue, (val) => {
  setVisible(val)
})

watch(() => visible.value, (val) => {
  emit('update:modelValue', val)
})

// 监听flaw变化
watch(() => props.flaw, (val) => {
  if (val) {
    setForm({ status: val.status, remark: val.remark })
  }
}, { immediate: true })

// 关闭弹窗
const handleClose = () => {
  setVisible(false)
}

// 保存处理结果
const handleSave = async () => {
  if (!form) return
  try {
    await (typeof form.validate === 'function' ? form.validate() : Promise.resolve())
    flawStore.saving = true
    await updateFlaw({
      id: props.flaw.id,
      status: form.status,
      remark: form.remark
    })
    ElMessage.success('保存成功')
    emit('saved')
    handleClose()
  } catch (error) {
    if (error.errors) {
      ElMessage.error('请检查表单填写是否正确')
    } else {
      ElMessage.error('保存失败：' + (error.message || '未知错误'))
    }
  } finally {
    flawStore.saving = false
  }
}
</script>

<style lang="scss" scoped>
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
      }
      
      .value {
        flex: 1;
        color: #303133;
      }
    }
  }
  
  .flaw-handling {
    .el-form {
      .el-form-item {
        margin-bottom: 20px;
        
        &:last-child {
          margin-bottom: 0;
        }
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