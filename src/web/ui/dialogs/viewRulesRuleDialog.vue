<script setup lang="ts">
import {ref} from 'vue';
import {eventEmitter} from "@/core/EventEmitter.ts";
import {ElMessage, ElMessageBox} from 'element-plus';

/**
 * 查看规则内容抽屉
 *
 * 原为 el-dialog + fullscreen + modal=false：规则项数量不定（可能上百条），
 * 弹窗铺满整屏时遮住页面、又因 modal=false 没有视觉边界，观感混乱。
 * 改为右侧抽屉：内容纵向排布、标签自动换行、可滚动，且不遮挡页面其余部分。
 */
const drawerVisible = ref(false);
const typeMap = ref<Record<string, any>>({});
const showTags = ref<any[]>([]);

const updateShowRuleTags = () => {
  showTags.value = GM_getValue(typeMap.value.type, []);
};
const handleTagClose = (tag: any, index: number) => {
  if (tag === '') return;
  ElMessageBox.confirm(`确定要删除 ${tag} 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    showTags.value.splice(index, 1);
    GM_setValue(typeMap.value.type, showTags.value);
    ElMessage.success(`已移除 ${tag}`);
    eventEmitter.send('刷新规则信息', false);
  });
};
const closedHandle = () => {
  typeMap.value = {};
  showTags.value.splice(0, showTags.value.length);
};

eventEmitter.on('event-lookRuleDialog', (newTypeMap) => {
  typeMap.value = newTypeMap;
  drawerVisible.value = true;
  updateShowRuleTags();
});
</script>
<template>
  <el-drawer :close-on-click-modal="false" :close-on-press-escape="false"
             v-model="drawerVisible"
             title="查看规则内容" direction="rtl" size="46%"
             @closed="closedHandle">
    <el-card shadow="never">
      <template #header>规则信息</template>
      <div class="rule-meta">
        <el-tag>{{ typeMap.name + '|' + typeMap.type }}</el-tag>
        <el-tag type="info">{{ showTags.length }} 个</el-tag>
      </div>
    </el-card>
    <el-card shadow="never">
      <template #header>规则项</template>
      <div class="rule-tags">
        <el-tag v-for="(item,index) in showTags" :key="index" closable @close="handleTagClose(item,index)">
          {{ item }}
        </el-tag>
      </div>
      <el-empty v-if="showTags.length === 0" description="暂无规则项" :image-size="60"/>
    </el-card>
  </el-drawer>
</template>

<style scoped>
.rule-meta {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* 规则项标签自动换行、纵向滚动，长列表不会撑破抽屉 */
.rule-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-height: 60vh;
  overflow-y: auto;
}
</style>
