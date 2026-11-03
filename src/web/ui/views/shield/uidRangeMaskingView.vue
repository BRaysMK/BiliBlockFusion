<script setup lang="ts">
import {ref, watch} from 'vue';
import localMKData from "../../../state/localMKData.ts";
import {ElMessage, ElMessageBox} from 'element-plus';
import SettingRow from '../../components/SettingRow.vue';

/**
 * uid范围屏蔽
 */
const status = ref(localMKData.isUidRangeMaskingStatus());
const head = ref(0);
const tail = ref(100);

const setRangeBut = () => {
  ElMessageBox.alert('设置成功');
  GM_setValue('uid_range_masking', [head.value, tail.value]);
};

watch(head, (newVal, oldVal) => {
  if (newVal > tail.value) {
    ElMessage('最小值不能大于最大值');
    head.value = oldVal;
  }
});
watch(tail, (newVal, oldVal) => {
  if (newVal < head.value) {
    ElMessage('最大值不能小于最小值');
    tail.value = oldVal;
  }
});
watch(status, (n) => {
  GM_setValue('uid_range_masking_status', n);
});

const arr = localMKData.getUidRangeMasking();
head.value = arr[0];
tail.value = arr[1];
</script>

<template>
  <SettingRow label="启用">
    <el-switch v-model="status" size="small"/>
  </SettingRow>
  <SettingRow label="uid 范围">
    <el-input-number v-model="head" :controls="false" :min="0" class="gz-uid-range__number" size="small"/>
    <span class="gz-uid-range__dash">~</span>
    <el-input-number v-model="tail" :controls="false" :min="0" class="gz-uid-range__number" size="small"/>
    <el-button size="small" type="primary" @click="setRangeBut">设置</el-button>
  </SettingRow>
</template>

<style scoped>
.gz-uid-range__number {
  width: 108px;
}

.gz-uid-range__dash {
  color: var(--fluent-color-neutral-foreground-4);
}
</style>
