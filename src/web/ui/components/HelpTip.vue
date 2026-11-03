<script setup lang="ts">
/**
 * 说明气泡：ⓘ 图标 + el-tooltip
 *
 * 项目没有引入 @element-plus/icons-vue（图标会多一条 @require，与单文件交付冲突），
 * 所以这里用内联 SVG 自绘。原先这些说明是直接铺在卡片里的正文段落，
 * 一个开关配三行解释，把 613px 宽的内容区撑得又长又难扫读。
 */
withDefaults(defineProps<{
  /** 气泡内容 */
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}>(), {
  placement: 'top',
});
</script>

<template>
  <el-tooltip :content="content" :placement="placement" :show-after="300">
    <el-icon class="gz-help-tip">
      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.2"/>
        <path d="M8 7v4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
        <circle cx="8" cy="4.9" r="0.85" fill="currentColor"/>
      </svg>
    </el-icon>
  </el-tooltip>
</template>

<style scoped>
.gz-help-tip {
  font-size: var(--fluent-font-size-base-200);
  color: var(--fluent-color-neutral-foreground-4);
  cursor: help;
}

.gz-help-tip svg {
  width: 1em;
  height: 1em;
}
</style>
