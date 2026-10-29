<script setup lang="ts">
import {ref} from 'vue';
import {eventEmitter} from "@/core/EventEmitter.ts";
import {ElMessage, ElMessageBox} from 'element-plus';

/**
 * 内容查看抽屉
 *
 * 原为 el-dialog + fullscreen：内容长度不定（规则项、正则、JSON 片段），
 * 弹窗在长内容下要么撑破视口、要么内部滚动条与外层冲突，
 * 且 fullscreen 与 width="30%" 同时存在属于无效配置。
 * 改为右侧抽屉：纵向空间充足、可滚动，长内容阅读体验更好，也符合 Fluent 的侧边面板范式。
 */
const drawerVisible = ref(false);
const content = ref('');

/** 关闭前确认（内容可能是用户手动编辑的，防止误关丢失） */
const handleClose = (done: () => void) => {
  ElMessageBox.confirm('确认关闭？')
      .then(() => done())
      .catch(() => {
      });
};

eventEmitter.on('展示内容对话框', (newContent: string) => {
  content.value = newContent;
  ElMessage('已更新内容');
  drawerVisible.value = true;
});
</script>
<template>
  <el-drawer
      v-model="drawerVisible"
      :before-close="handleClose"
      title="查看内容"
      direction="rtl"
      size="46%">
    <el-input v-model="content"
              autosize
              type="textarea"
              class="look-content-textarea"/>
    <template #footer>
      <el-button @click="drawerVisible = false">取 消</el-button>
      <el-button type="primary" @click="drawerVisible = false">确 定</el-button>
    </template>
  </el-drawer>
</template>

<style scoped>
/* 抽屉内文本域撑满可用宽度，长内容由自身滚动 */
.look-content-textarea :deep(.el-textarea__inner) {
  font-family: var(--fluent-font-family-monospace, Consolas, monospace);
  font-size: var(--fluent-font-size-base-300, 14px);
  line-height: 1.6;
  min-height: 60vh;
}
</style>
