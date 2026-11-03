<script setup lang="ts">
import {ref, watch} from 'vue'
import localMKData from "../../../state/localMKData.ts";
import topColumnProcessing from "../../../pages/topColumnProcessing.ts";
import {ElMessage, ElMessageBox} from 'element-plus';
import SettingRow from '../../components/SettingRow.vue';
import SettingGroup from '../../components/SettingGroup.vue';

const hideTheLeftTopColumnsVal = ref<string[]>(localMKData.getHideTheLeftTopColumnsGm());
const topBarColumnShieldingStatusVal = ref(localMKData.isTopBarColumnShieldingStatusGm());

watch(hideTheLeftTopColumnsVal, (newList) => {
  GM_setValue('hide_the_left_top_columns_gm', newList);
  topBarColumnShieldingStatusVal.value && topColumnProcessing.processHideTheTopColumns(false);
});
watch(topBarColumnShieldingStatusVal, (n) => {
  GM_setValue('top_bar_column_shielding_status_gm', n);
  n && topColumnProcessing.processHideTheTopColumns(false);
});

const addBut = () => {
  ElMessageBox.prompt("请输入要屏蔽的栏目名称", 'tip').then(({value}: any) => {
    if (value === null || value.trim() === '') return;
    const valueTrim = value.trim();
    if (hideTheLeftTopColumnsVal.value.some(item => item === valueTrim)) {
      ElMessage.warning('该栏目已存在');
      return;
    }
    hideTheLeftTopColumnsVal.value.push(valueTrim);
  });
};
const handleClose = (tag: any) => {
  ElMessageBox.confirm(`是要移除栏目吗【${tag}】`).then(() => {
  });
  const findIndex = hideTheLeftTopColumnsVal.value.findIndex(item => item === tag);
  if (findIndex !== -1) {
    hideTheLeftTopColumnsVal.value.splice(findIndex, 1);
  }
};
</script>

<template>
  <SettingGroup
      description="左右两侧顶栏栏目都可用。左侧的哔哩哔哩图标填 logo，右侧头像栏填 个人logo"
      title="顶栏栏目屏蔽">
    <SettingRow label="启用顶栏栏目屏蔽">
      <el-switch v-model="topBarColumnShieldingStatusVal" size="small"/>
    </SettingRow>
    <SettingRow stacked>
      <div class="gz-top-column__tags">
        <el-button size="small" @click="addBut">添加栏目</el-button>
        <el-tag v-for="item in hideTheLeftTopColumnsVal" :key="item" closable size="small" @close="handleClose(item)">
          {{ item }}
        </el-tag>
        <span v-if="hideTheLeftTopColumnsVal.length === 0" class="gz-top-column__empty">
          还没有屏蔽任何栏目
        </span>
      </div>
    </SettingRow>
  </SettingGroup>
</template>

<style scoped>
.gz-top-column__tags {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--fluent-spacing-horizontal-xs);
}

.gz-top-column__empty {
  font-size: var(--fluent-font-size-base-200);
  color: var(--fluent-color-neutral-foreground-4);
}
</style>
