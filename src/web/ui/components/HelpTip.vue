<script setup lang="ts">
/**
 * 说明气泡：ⓘ 图标 + el-tooltip
 *
 * 项目没有引入 @element-plus/icons-vue（图标会多一条 @require，与单文件交付冲突），
 * 所以这里用内联 SVG 自绘。原先这些说明是直接铺在卡片里的正文段落，
 * 一个开关配三行解释，把 613px 宽的内容区撑得又长又难扫读。
 *
 * 只把图标作为触发元素：说明文字挂在整行/整块 div 上时，鼠标掠过就会被弹出。
 */
withDefaults(defineProps<{
  /** 气泡内容，一句话说清；细节放页内说明区 */
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  /** 长文案改成多行显示（默认单行内折行） */
  multiline?: boolean;
}>(), {
  placement: 'top',
  multiline: false,
});
</script>

<template>
  <el-tooltip :content="content" :placement="placement" :show-after="300" :popper-style="multiline ? 'white-space: pre-line' : undefined">
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
  flex: 0 0 auto;
  font-size: var(--fluent-font-size-base-200);
  color: var(--fluent-color-neutral-foreground-4);
  cursor: help;
}

.gz-help-tip:hover {
  color: var(--fluent-color-neutral-foreground-2);
}

.gz-help-tip svg {
  width: 1em;
  height: 1em;
}
</style>
