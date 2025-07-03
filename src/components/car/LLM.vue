<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// TODO: 请将下面的 URL 替换为您自己的 Dify Chatbot 地址
// 您可以从 Dify 应用的发布 -> 嵌入到网站 -> iFrame 中获取
const difyChatbotUrl = ref('http://localhost/v1')

</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    title="AGV智能助手"
    width="40%"
    :modal="false"
    draggable
    class="llm-dialog"
  >
    <div class="iframe-container">
      <iframe
        :src="difyChatbotUrl"
        frameborder="0"
        allow="microphone"
      ></iframe>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">关闭</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style scoped>
.iframe-container {
  height: 60vh;
  width: 100%;
}

.iframe-container iframe {
  height: 100%;
  width: 100%;
}

.llm-dialog :deep(.el-dialog__body) {
  padding: 0;
}
</style>
