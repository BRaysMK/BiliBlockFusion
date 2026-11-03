<script setup lang="ts">
import {ref} from 'vue';
import {eventEmitter} from "@/core/EventEmitter.ts";
import {ElMessage, ElMessageBox} from 'element-plus';
import type {ContentEditContext} from "@/types/contentViewer.ts";
import {parseEditedContent} from "@/core/util/contentEditUtil.ts";

/**
 * 内容查看抽屉
 *
 * 原为 el-dialog + fullscreen：内容长度不定（规则项、正则、JSON 片段），
 * 弹窗在长内容下要么撑破视口、要么内部滚动条与外层冲突，
 * 且 fullscreen 与 width="30%" 同时存在属于无效配置。
 * 改为右侧抽屉：纵向空间充足、可滚动，长内容阅读体验更好，也符合 Fluent 的侧边面板范式。
 *
 * 默认只读：缓存页塞进来的视频信息 JSON 没有对应存储键，误编辑后无处可存。
 * 只有带 ruleKey 的调用方（规则页）才出现「修改」按钮，进入编辑态后保存回该键。
 */
const drawerVisible = ref(false);
const content = ref('');
/** 只读 / 编辑两态；每次打开都重置为只读，避免上一次的编辑态残留 */
const editing = ref(false);
/** 打开抽屉时的原始内容，用于判断是否有改动以及取消编辑时还原 */
const original = ref('');
const editContext = ref<ContentEditContext | null>(null);

const canEdit = (): boolean => editContext.value !== null;

const handleClose = (done: () => void) => {
  if (!editing.value || content.value === original.value) {
    done();
    return;
  }
  // 只在真的改了内容时才拦一下；只读浏览不需要多问一句
  ElMessageBox.confirm('有未保存的修改，确定关闭吗？', '提示', {
    confirmButtonText: '放弃修改',
    cancelButtonText: '继续编辑',
    type: 'warning',
  }).then(() => done()).catch(() => {
  });
};

const saveBut = () => {
  const context = editContext.value;
  if (context === null) return;
  const result = parseEditedContent(context, content.value);
  if (!result.ok) {
    ElMessageBox.alert(result.message, '内容有误');
    return;
  }
  GM_setValue(context.ruleKey, result.value as never);
  // 回写规范化后的文本（数字项会被统一成数字），避免再次打开时显示与存储不一致
  content.value = JSON.stringify(result.value);
  original.value = content.value;
  editing.value = false;
  ElMessage.success(`已保存${context.ruleName}`);
  eventEmitter.send('刷新规则信息', false);
  eventEmitter.send('通知屏蔽');
};

const editBut = () => {
  editing.value = true;
};

const cancelEditBut = () => {
  content.value = original.value;
  editing.value = false;
};

// ruleKey 可选：只有规则页传，缓存页不传即为只读
eventEmitter.on('展示内容对话框', (newContent: string, context?: ContentEditContext) => {
  content.value = newContent;
  original.value = newContent;
  editContext.value = context ?? null;
  editing.value = false;
  ElMessage('已更新内容');
  drawerVisible.value = true;
});
</script>
<template>
  <el-drawer
      v-model="drawerVisible"
      :before-close="handleClose"
      :title="editContext === null ? '查看内容' : `查看内容 · ${editContext.ruleName}`"
      direction="rtl"
      size="46%">
    <div v-if="canEdit()" class="look-content-hint">
      {{ editing ? '编辑中：保存后立即生效，内容需为 JSON 数组' : '只读预览，点右下角「修改」可编辑' }}
    </div>
    <el-input v-model="content"
              :readonly="!editing"
              :class="{'look-content-textarea--readonly': !editing}"
              autosize
              type="textarea"
              class="look-content-textarea"/>
    <template #footer>
      <template v-if="editing">
        <el-button @click="cancelEditBut">取 消</el-button>
        <el-button type="primary" @click="saveBut">保 存</el-button>
      </template>
      <template v-else>
        <el-button @click="drawerVisible = false">关 闭</el-button>
        <el-button v-if="canEdit()" type="primary" @click="editBut">修 改</el-button>
      </template>
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

/* 只读态用次级表面，和可编辑态区分开 */
.look-content-textarea--readonly :deep(.el-textarea__inner) {
  background: var(--fluent-color-neutral-background-2);
  color: var(--fluent-color-neutral-foreground-2);
}

.look-content-hint {
  margin-bottom: var(--fluent-spacing-vertical-s);
  font-size: var(--fluent-font-size-base-200);
  color: var(--fluent-color-neutral-foreground-3);
}
</style>
