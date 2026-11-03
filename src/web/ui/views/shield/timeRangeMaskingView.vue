<script setup lang="ts">
import {ref, watch} from 'vue';
import localMKData from "../../../state/localMKData.ts";
import TimeRangeMaskingTableView from "./timeRangeMaskingTableView.vue";
import {ElNotification} from 'element-plus';
import SettingRow from '../../components/SettingRow.vue';
import SettingGroup from '../../components/SettingGroup.vue';

/**
 * 时间范围屏蔽
 */
const status = ref(localMKData.isTimeRangeMaskingStatus());
const showHelp = ref(false);

watch(status, (n) => {
  ElNotification({
    title: '',
    message: n ? '时间范围屏蔽已开启' : '时间范围屏蔽已关闭',
    type: n ? 'success' : 'warning'
  });
  GM_setValue('time_range_masking_status', n);
});
</script>

<template>
  <SettingGroup description="按视频发布时间判定：发布时间落在任一启用的范围内即屏蔽。总开关关闭后所有范围都不生效" title="时间范围屏蔽">
    <SettingRow label="总开关">
      <el-switch v-model="status" size="small"/>
    </SettingRow>
    <TimeRangeMaskingTableView/>
    <button class="gz-time-range__help-toggle" type="button" @click="showHelp = !showHelp">
      {{ showHelp ? '收起说明' : '使用说明' }}
    </button>
    <ul v-if="showHelp" class="gz-time-range__help">
      <li>不能添加与已有范围完全相同、或被已有范围包含的时间段</li>
      <li>修改时间范围和开关状态会自动保存，删除也会立即保存</li>
      <li>每条范围有独立开关，关闭只让这一条失效</li>
    </ul>
  </SettingGroup>
</template>

<style scoped>
.gz-time-range__help-toggle {
  padding: 0 var(--fluent-spacing-horizontal-s);
  border: none;
  background: none;
  font-size: var(--fluent-font-size-base-200);
  color: var(--fluent-color-brand-foreground-1);
  cursor: pointer;
}

.gz-time-range__help {
  margin: 0;
  padding-left: 32px;
  font-size: var(--fluent-font-size-base-200);
  line-height: 1.7;
  color: var(--fluent-color-neutral-foreground-3);
}
</style>
