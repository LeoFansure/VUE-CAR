<template>
  <el-dialog
    v-model="flawStore.visible"
    title="故障详情"
    width="600px"
    :before-close="handleClose"
  >
    <div v-if="flawStore.flaw" class="flaw-detail">
      <div class="flaw-image">
        <el-image
          :src="flawStore.flaw.flawImageUrl"
          fit="cover"
          :preview-src-list="[flawStore.flaw.flawImageUrl]"
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
          <span class="value">{{ flawStore.flaw.flawName }}</span>
        </div>
        <div class="info-item">
          <span class="label">故障类型：</span>
          <span class="value">{{ flawStore.flaw.flawType }}</span>
        </div>
        <div class="info-item">
          <span class="label">故障位置：</span>
          <span class="value">{{ flawStore.flaw.flawDistance }}m</span>
        </div>
        <div class="info-item">
          <span class="label">发现时间：</span>
          <span class="value">{{ formatDateTime(flawStore.flaw.createTime) }}</span>
        </div>
        <div class="info-item">
          <span class="label">故障描述：</span>
          <span class="value">{{ flawStore.flaw.flawDesc }}</span>
        </div>
      </div>

      <div class="flaw-handling">
        <el-form
          ref="formRef"
          :model="flawStore.form"
          label-width="100px"
        >
          <el-form-item label="确认故障" prop="confirmed">
            <el-switch v-model="flawStore.form.confirmed" />
          </el-form-item>

          <el-form-item label="补充说明" prop="remark">
            <el-input
              v-model="flawStore.form.remark"
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
        <el-button type="primary" @click="handleSave" :loading="flawStore.saving">
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
import { updateFlaw } from '@/api/flaw' 
import { formatDateTime } from '@/utils/common'
import { useFlawStore } from '@/stores/flaw'

// 修改: 不再需要 props，只需要 emit
const emit = defineEmits(['saved'])

const formRef = ref(null)

const flawStore = useFlawStore()
// 从 store 中解构出方法
const { setVisible, setForm, setSaving } = flawStore

// 修改: 监听 flawStore 中的 flaw 对象变化来更新表单
watch(() => flawStore.flaw, (newFlaw) => {
  if (newFlaw) {
    // 当store中的故障数据变化时，自动填充表单
    setForm({ confirmed: newFlaw.confirmed, remark: newFlaw.remark })
  }
}, { deep: true }) // 使用 deep watch 确保内部属性变化也能被侦测到

// 关闭弹窗
const handleClose = () => {
  setVisible(false)
}

// 保存处理结果
const handleSave = async () => {
  if (!flawStore.flaw) return // 防御性编程

  setSaving(true)
  try {
    const res = await updateFlaw({
      id: flawStore.flaw.id,
      confirmed: flawStore.form.confirmed,
      remark: flawStore.form.remark
    })

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
    setSaving(false)
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