<script setup lang="ts">
import HelpTip from './HelpTip.vue';

/**
 * 设置分组：一组 SettingRow 的容器
 *
 * 用带标题的浅色分组代替原来「卡片套卡片」——外层卡片已经提供了表面层次，
 * 内层再套 el-card 只会多出一层描边和阴影，在 613px 宽度下显得非常拥挤。
 */
withDefaults(defineProps<{
  title?: string;
  /** 分组级说明，收进标题旁的 ⓘ */
  description?: string;
}>(), {
  title: '',
  description: '',
});
</script>

<template>
  <section class="gz-setting-group">
    <header v-if="title !== ''" class="gz-setting-group__header">
      <span>{{ title }}</span>
      <HelpTip v-if="description !== ''" :content="description"/>
    </header>
    <slot/>
  </section>
</template>

<style scoped>
.gz-setting-group {
  padding: var(--fluent-spacing-vertical-s) 0;
}

.gz-setting-group + .gz-setting-group {
  border-top: var(--fluent-stroke-width-thin) solid var(--fluent-color-neutral-stroke-2);
}

.gz-setting-group__header {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: var(--fluent-spacing-vertical-xs) var(--fluent-spacing-horizontal-s);
  font-size: var(--fluent-font-size-base-200);
  font-weight: var(--fluent-font-weight-semibold);
  color: var(--fluent-color-neutral-foreground-3);
}

</style>
