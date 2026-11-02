<script setup lang="ts">
import {ref, watch} from 'vue';
import localMKData from "../../../state/localMKData.ts";
import time_range_masking_table_vue from "./timeRangeMaskingTableView.vue";
import {ElNotification} from 'element-plus';

/**
 * 时间范围屏蔽组件
 */
const status = ref(localMKData.isTimeRangeMaskingStatus());

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
  <div>
    <el-card>
      <template #header>时间范围</template>
      <div>使用说明</div>
      <div>1.不能添加与已有范围完全相同、或被已有范围包含的时间段</div>
      <div>2.修改时间范围和开关状态会自动保存，删除也会立即保存</div>
      <div>3.每条范围有独立开关，关闭只让这一条失效</div>
      <div>4.总开关关闭后所有时间范围都不生效</div>
      <div>5.按视频发布时间判定：发布时间落在任一启用的范围内即屏蔽</div>
      <el-switch v-model="status" active-text="总开关"/>
    </el-card>
    <time_range_masking_table_vue/>
  </div>
</template>
