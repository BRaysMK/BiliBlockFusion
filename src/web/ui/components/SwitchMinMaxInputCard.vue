<script setup lang="ts">
import {ref, watch} from 'vue';
import SettingRow from './SettingRow.vue';

/**
 * 最小/最大值限制项
 *
 * 最小值和最大值是一对互斥方向，放在同一行里才看得出「区间」的语义；
 * 原来一个值一张卡片，六张卡片纵向排开，用户要来回滚动才能确认上下界。
 */
const props = withDefaults(defineProps<{
  /** 配置项名称，如「弹幕量限制」 */
  title?: string;
  /** 上下界说明，收进 ⓘ 气泡 */
  describe?: string;
  /** 数值单位，显示在数字框后 */
  unit?: string;
  minDefVal?: number;
  maxDefVal?: number;
  minInputKey: string;
  maxInputKey: string;
  isMaxKey: string;
  isMinKey: string;
}>(), {
  title: '默认标题',
  describe: '',
  unit: '',
  minDefVal: 0,
  maxDefVal: 1,
});

const localIsMaxVal = ref(GM_getValue(props.isMaxKey, false));
const localIsMinVal = ref(GM_getValue(props.isMinKey, false));
const localMinInputVal = ref(GM_getValue(props.minInputKey, props.minDefVal));
const localMaxInputVal = ref(GM_getValue(props.maxInputKey, props.maxDefVal));

watch(localIsMaxVal, (n) => {
  GM_setValue(props.isMaxKey, n);
});
watch(localIsMinVal, (n) => {
  GM_setValue(props.isMinKey, n);
});
watch(localMinInputVal, (n) => {
  GM_setValue(props.minInputKey, n);
});
watch(localMaxInputVal, (n) => {
  GM_setValue(props.maxInputKey, n);
});
</script>

<template>
  <SettingRow :description="describe" :label="title">
    <span class="gz-min-max__field">
      <el-switch v-model="localIsMinVal" size="small" title="启用最小值"/>
      <el-input-number v-model="localMinInputVal"
                       :disabled="!localIsMinVal"
                       :max="localMaxInputVal - 1"
                       :min="0"
                       controls-position="right"
                       size="small"/>
    </span>
    <span class="gz-min-max__dash">~</span>
    <span class="gz-min-max__field">
      <el-input-number v-model="localMaxInputVal"
                       :disabled="!localIsMaxVal"
                       :min="localMinInputVal + 1"
                       controls-position="right"
                       size="small"/>
      <el-switch v-model="localIsMaxVal" size="small" title="启用最大值"/>
    </span>
    <span v-if="unit !== ''" class="gz-min-max__unit">{{ unit }}</span>
  </SettingRow>
</template>

<style scoped>
.gz-min-max__field {
  display: inline-flex;
  align-items: center;
  gap: var(--fluent-spacing-horizontal-xs);
}

/* 默认 el-input-number 宽 150px，两个并排就吃满内容区，名称被挤成竖排。
   这里收窄数字框，步进按钮仍保留在右侧。 */
.gz-min-max__field :deep(.el-input-number) {
  width: 92px;
}

.gz-min-max__dash {
  color: var(--fluent-color-neutral-foreground-4);
}

.gz-min-max__unit {
  font-size: var(--fluent-font-size-base-200);
  color: var(--fluent-color-neutral-foreground-3);
}
</style>
