<script setup lang="ts">
import {ref, watch} from 'vue';
import SettingRow from './SettingRow.vue';

/**
 * 视频指标过滤项
 *
 * 存储里比率是 0–1 的小数，界面按百分比呈现——用户理解的是「点赞率 5%」，
 * 而不是「0.05」。换算只发生在这一层，GM 键名与存储格式保持不变。
 */
const props = withDefaults(defineProps<{
  /** 配置项名称 */
  headerTitle?: string;
  /** 指标说明，收进 ⓘ 气泡 */
  describe?: string;
  /** 指标类型 mk-key */
  mkTypeRateKey?: string;
  /** 指标状态 mk-key */
  mkRateStatusKey?: string;
  /** 百分比上限，默认 100 */
  maxPercent?: number;
}>(), {
  headerTitle: '',
  describe: '',
  mkTypeRateKey: '',
  mkRateStatusKey: '',
  maxPercent: 100,
});

const rateBlockingStatus = ref(GM_getValue(props.mkRateStatusKey, false));
/** 界面上的百分比整数；存储仍是 0–1 小数 */
const percentVal = ref(Math.round(Number(GM_getValue(props.mkTypeRateKey, 0.05)) * 100));

// 0.05 乘 100 在浮点下是 5.000000000000001，四舍五入后再除回去才是可预期的精度
watch(percentVal, (n) => {
  GM_setValue(props.mkTypeRateKey, Number(((n ?? 0) / 100).toFixed(4)));
});
watch(rateBlockingStatus, (n) => {
  GM_setValue(props.mkRateStatusKey, n);
});
</script>

<template>
  <SettingRow :description="describe" :label="headerTitle">
    <span class="gz-metrics-filter__number">
      <el-input-number v-model="percentVal"
                       :disabled="!rateBlockingStatus"
                       :max="maxPercent"
                       :min="0"
                       :step="1"
                       controls-position="right"
                       size="small"/>
      <span class="gz-metrics-filter__unit">%</span>
    </span>
    <el-switch v-model="rateBlockingStatus" size="small"/>
  </SettingRow>
</template>

<style scoped>
.gz-metrics-filter__number {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.gz-metrics-filter__number :deep(.el-input-number) {
  width: 88px;
}

.gz-metrics-filter__unit {
  font-size: var(--fluent-font-size-base-200);
  color: var(--fluent-color-neutral-foreground-3);
}
</style>
