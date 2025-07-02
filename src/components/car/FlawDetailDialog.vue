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
          <el-form-item label="故障状态" prop="confirmed">
            <el-select
              v-model="flawStore.form.confirmed"
              placeholder="请确认故障状态"
              style="width: 100%;"
            >
              <el-option label="故障属实 (确认为故障)" :value="true" />
              <el-option label="不是故障 (确认为误报)" :value="false" />
            </el-select>
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
import { updateFlaw } from '@/api/car/flaw'
import { formatDateTime } from '@/utils/common'
import { useFlawStore } from '@/stores/flaw'

const emit = defineEmits(['saved'])
const formRef = ref(null)
const flawStore = useFlawStore()
// 修改: 导入 resetForm 以便在关闭时调用
const { setVisible, setForm, setSaving, resetForm } = flawStore

const SERVER_BASE_URL = 'http://192.168.2.57/prod-api/file'

const fullImageUrl = computed(() => {
  const flaw = flawStore.flaw
  if (flaw && flaw.flawImageUrl) {
    if (flaw.flawImageUrl.startsWith('http')) return flaw.flawImageUrl
    const baseUrl = SERVER_BASE_URL.endsWith('/') ? SERVER_BASE_URL.slice(0, -1) : SERVER_BASE_URL
    const imageUrl = flaw.flawImageUrl.startsWith('/') ? flaw.flawImageUrl : `/${flaw.flawImageUrl}`
    return `${baseUrl}${imageUrl}`
  }
  return ''
})

const formattedCreateTime = computed(() => {
  if (flawStore.flaw && flawStore.flaw.createTime) {
    return formatDateTime(flawStore.flaw.createTime)
  }
  return 'N/A'
})

watch(() => flawStore.flaw, (newFlaw) => {
  if (newFlaw) {
    setForm({ confirmed: newFlaw.confirmed, remark: newFlaw.remark })
  }
}, { deep: true })

// 修改: 关闭弹窗时，同时重置表单状态
const handleClose = () => {
  setVisible(false)
  resetForm()
}

// 带有完整"探针"的最终版 handleSave 函数
const handleSave = async () => {
  console.log('1. "保存"按钮被点击。');

  if (!flawStore.flaw) {
    console.error('错误：flawStore中没有当前的flaw对象！');
    return;
  }
  console.log('2. flaw对象存在，准备设置saving状态。');

  setSaving(true);
  console.log('3. saving状态已设置为true，按钮应显示加载中。');
  
  const payload = {
    id: flawStore.flaw.id,
    confirmed: flawStore.form.confirmed,
    remark: flawStore.form.remark
  };
  console.log('4. 准备发送给后端的数据(payload):', JSON.stringify(payload));

  try {
    console.log('5. 即将调用 updateFlaw API...');
    const res = await updateFlaw(payload);
    console.log('6. API调用已完成，收到的响应(res):', res);

    if (res.code === 200) {
      console.log('7. 响应码为200，操作成功。准备关闭弹窗并刷新列表。');
      ElMessage.success('保存成功');
      emit('saved');
      handleClose();
    } else {
      console.error('8. 响应码不是200，操作失败。', res);
      ElMessage.error('保存失败：' + (res.msg || '未知错误'));
    }
  } catch (error) {
    console.error('9. API调用时捕获到异常(error):', error);
    ElMessage.error('保存失败：' + (error.message || '网络错误'));
  } finally {
    console.log('10. 执行finally块，取消按钮加载状态。');
    setSaving(false);
  }
}
</script>

<style lang="scss" scoped>
/* 您的样式代码 */
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