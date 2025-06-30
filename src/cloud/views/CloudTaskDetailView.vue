<template>
  <div class="task-detail-view-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="breadcrumb">
        <el-icon class="back-icon" @click="goBack"><ArrowLeft /></el-icon>
        <span>云端归档任务详情</span>
      </div>
    </div>

    <!-- 任务信息 -->
    <el-card class="task-info-card" v-if="task" v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>任务基本信息</span>
        </div>
      </template>
      <el-descriptions :column="3" border>
        <el-descriptions-item label="任务编号">{{ task.taskCode }}</el-descriptions-item>
        <el-descriptions-item label="任务名称">{{ task.taskName }}</el-descriptions-item>
        <el-descriptions-item label="任务状态">
          <el-tag type="success">{{ task.taskStatus }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="起始地点">{{ task.startPos }} 米</el-descriptions-item>
        <el-descriptions-item label="任务距离">{{ task.taskTrip }} 米</el-descriptions-item>
        <el-descriptions-item label="巡视轮次">{{ task.round }}</el-descriptions-item>
        <el-descriptions-item label="创建人">{{ task.creator }}</el-descriptions-item>
        <el-descriptions-item label="执行人">{{ task.executor }}</el-descriptions-item>
        <el-descriptions-item label="备注">{{ task.remark || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDateTime(task.createTime) }}</el-descriptions-item>
        <el-descriptions-item label="执行时间">{{ formatDateTime(task.execTime) }}</el-descriptions-item>
        <el-descriptions-item label="完成时间">{{ formatDateTime(task.endTime) }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 缺陷列表 -->
    <el-card class="flaw-list-card" v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>关联缺陷列表</span>
        </div>
      </template>
      <el-table :data="flawList" style="width: 100%">
        <el-table-column type="index" label="序号" width="55" align="center"></el-table-column>
        <el-table-column prop="flawType" label="缺陷类型" />
        <el-table-column prop="flawName" label="缺陷名称" />
        <el-table-column prop="flawDistance" label="距离(米)" />
        <el-table-column prop="level" label="缺陷等级">
          <template #default="{ row }">
            <el-tag :type="getLevelType(row.level)">{{ row.level }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="confirmed" label="是否确认">
          <template #default="{ row }">
            <el-tag :type="row.confirmed ? 'success' : 'warning'">
              {{ row.confirmed ? '已确认' : '未确认' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="发现时间">
           <template #default="scope">{{ formatDateTime(scope.row.createTime) }}</template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { ArrowLeft } from '@element-plus/icons-vue';
import { getTaskById, getFlawsByTaskId } from '../../cloud/api/cloud';

const route = useRoute();
const router = useRouter();

const task = ref(null);
const flawList = ref([]);
const loading = ref(false);
const taskId = ref(route.params.id);

const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString();
};

const getLevelType = (level) => {
  if (level === '高' || level === '严重') return 'danger';
  if (level === '中') return 'warning';
  return 'info';
};

const loadData = async () => {
  if (!taskId.value) {
    ElMessage.error('无效的任务ID');
    return;
  }
  loading.value = true;
  try {
    const [taskRes, flawRes] = await Promise.all([
      getTaskById(taskId.value),
      getFlawsByTaskId(taskId.value)
    ]);

    if (taskRes.code === 200 && taskRes.data) {
      task.value = taskRes.data;
    } else {
      ElMessage.error(taskRes.message || '获取任务详情失败');
    }

    if (flawRes.code === 200 && flawRes.data) {
      flawList.value = flawRes.data;
    } else {
      ElMessage.error(flawRes.message || '获取缺陷列表失败');
    }
  } catch (error) {
    console.error('加载数据失败:', error);
    ElMessage.error('加载数据失败');
  } finally {
    loading.value = false;
  }
};

const goBack = () => {
  router.push('/cloudSystem');
};

onMounted(() => {
  loadData();
});
</script>

<style lang="scss" scoped>
.task-detail-view-container {
  padding: 24px;
}
.page-header {
  margin-bottom: 24px;
}
.breadcrumb {
  display: flex;
  align-items: center;
  font-size: 16px;
  cursor: pointer;
}
.back-icon {
  margin-right: 8px;
}
.task-info-card, .flaw-list-card {
  margin-bottom: 24px;
}
</style> 