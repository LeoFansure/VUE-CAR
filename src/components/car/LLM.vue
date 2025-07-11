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

// 使用环境变量中的BASE_API获取Dify Chatbot URL
const difyChatbotUrl = ref(`${import.meta.env.VITE_BASE_API}`)

</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    width="500px"
    top="10vh"
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
  </el-dialog>
</template>

<style scoped>
.iframe-container {
  height: 700px;
  width: 99%;
}

.iframe-container iframe {
  height: 100%;
  width: 100%;
  border-radius: 0 0 var(--el-dialog-border-radius) var(--el-dialog-border-radius);
}

.llm-dialog :deep(.el-dialog__body) {
  padding: 0;
}
</style>

