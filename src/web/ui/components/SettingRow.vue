<script setup lang="ts">
import HelpTip from './HelpTip.vue';

/**
 * 设置行：高级页所有配置项的统一形态
 *
 * 主面板内容区只有 613px 宽，原来每个视图都用自己的卡片 + 段落说明 + 滑块拼版，
 * 于是出现「卡片套卡片」「一条公式占三行」「滑块和数字框表达同一个值」。
 * 这里把配置项压成固定一行：左侧名称、右侧控件、说明收进 ⓘ 气泡。
 */
withDefaults(defineProps<{
  /** 配置项名称；stacked 行可以省略，此时只渲染控件 */
  label?: string;
  /** 补充说明，收进 ⓘ 气泡；不传则不显示图标 */
  description?: string;
  /** 控件区无法与名称同排时（如整行宽度的表格）改为上下堆叠 */
  stacked?: boolean;
}>(), {
  label: '',
  description: '',
  stacked: false,
});
</script>

<template>
  <div class="gz-setting-row" :class="{'gz-setting-row--stacked': stacked}">
    <div v-if="label !== '' || description !== ''" class="gz-setting-row__label">
      <span v-if="label !== ''">{{ label }}</span>
      <HelpTip v-if="description !== ''" :content="description"/>
    </div>
    <div class="gz-setting-row__control">
      <slot/>
    </div>
  </div>
</template>

<style scoped>
.gz-setting-row {
  display: flex;
  align-items: center;
  gap: var(--fluent-spacing-horizontal-m);
  min-height: 40px;
  padding: 0 var(--fluent-spacing-horizontal-s);
  border-radius: var(--fluent-border-radius-medium);
}

.gz-setting-row:hover {
  background: var(--fluent-color-neutral-background-2);
}

/* 纵向堆叠：名称在上、控件在下，给整行宽度的表格用 */
.gz-setting-row--stacked {
  flex-direction: column;
  align-items: stretch;
  gap: var(--fluent-spacing-vertical-xs);
  padding: var(--fluent-spacing-vertical-s) var(--fluent-spacing-horizontal-s);
}

.gz-setting-row__label {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1 1 auto;
  /* 名称必须单行：内容区只有 613px，控件一多就会把中文名称挤成一列单字。
     宁可让控件收窄，也不让名称换行。 */
  min-width: 0;
  white-space: nowrap;
  font-size: var(--fluent-font-size-base-300);
  color: var(--fluent-color-neutral-foreground-2);
}

.gz-setting-row__control {
  display: flex;
  align-items: center;
  gap: var(--fluent-spacing-horizontal-s);
  flex: 0 0 auto;
}

.gz-setting-row--stacked .gz-setting-row__control {
  width: 100%;
}
</style>
