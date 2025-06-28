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
          :src="fullImageUrl"
          fit="cover"
          :preview-src-list="[fullImageUrl]"
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
          <span class="value">{{ formattedCreateTime }}</span>
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
import { ref, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Picture } from '@element-plus/icons-vue'
import { updateFlaw } from '@/api/flaw' 
import { formatDateTime } from '@/utils/common'
import { useFlawStore } from '@/stores/flaw'

const emit = defineEmits(['saved'])
const formRef = ref(null)
const flawStore = useFlawStore()
const { setVisible, setForm, setSaving } = flawStore

// --- 新增: 定义服务器基础地址 ---
const SERVER_BASE_URL = 'http://192.168.2.57/prod-api/file'

// --- 新增: 用于生成完整图片URL的计算属性 ---
const fullImageUrl = computed(() => {
  const flaw = flawStore.flaw
  if (flaw && flaw.flawImageUrl) {
    // 检查URL是否已经是完整的http地址，如果是则直接使用
    if (flaw.flawImageUrl.startsWith('http')) {
      return flaw.flawImageUrl
    }
    // 如果是相对路径，则拼接服务器基础地址
    return `${SERVER_BASE_URL}${flaw.flawImageUrl}`
  }
  return '' // 如果没有图片URL，返回空字符串
})

const formattedCreateTime = computed(() => {
  if (flawStore.flaw && flawStore.flaw.createTime) {
    return formatDateTime(flawStore.flaw.createTime)
  }
  return 'N/A'
})

watch(() => flawStore.flaw, (newFlaw) => {
  if (newFlaw) {
    // console.log('当前故障对象中的图片URL是:', newFlaw.flawImageUrl); // 调试完成后可以删除或注释掉
    setForm({ confirmed: newFlaw.confirmed, remark: newFlaw.remark })
  }
}, { deep: true })

const handleClose = () => {
  setVisible(false)
}

const handleSave = async () => {
  if (!flawStore.flaw) return
  setSaving(true)
  try {
    const res = await updateFlaw({
      id: flawStore.flaw.id,
      confirmed: flawStore.form.confirmed,
      remark: flawStore.form.remark
    })
    if (res.code === 200) {
      ElMessage.success('保存成功')
      emit('saved')
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
/* 您的样式代码保持不变 */
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