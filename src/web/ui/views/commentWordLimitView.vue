<script setup lang="ts">
import {ref, watch} from 'vue';
import localMKData from "../../state/localMKData.ts";
import {ElNotification} from 'element-plus';
import SettingRow from '../components/SettingRow.vue';

/**
 * 评论字数限制
 *
 * 低于 3 视为关闭——阈值本身没有「关」开关，靠这个约定表达。
 */
const value = ref(localMKData.getCommentWordLimitVal());

watch(value, (newVal, oldVal) => {
  if (oldVal <= 3) return;
  if (newVal < 3) {
    ElNotification({
      title: '',
      message: '已关闭屏蔽字数限制功能',
      type: 'warning',
    });
  }
  GM_setValue('comment_word_limit', newVal);
});
</script>

<template>
  <SettingRow description="评论字数超过该值时屏蔽，低于 3 则不生效（相当于关闭）" label="评论字数限制">
    <el-input-number v-model="value" :min="0" controls-position="right" size="small"/>
    <span class="gz-comment-word-limit__unit">字</span>
  </SettingRow>
</template>

<style scoped>
.gz-comment-word-limit__unit {
  font-size: var(--fluent-font-size-base-200);
  color: var(--fluent-color-neutral-foreground-3);
}
</style>
