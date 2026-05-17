<script>
import localMKData, {getCommentWordLimitType, isEnableCommentWordLimitGm} from "../../data/localMKData.js";

/**
 * 评论字数限制布局组件
 */
export default {
  data() {
    return {
      isEnabled: isEnableCommentWordLimitGm(),
      value: localMKData.getCommentWordLimitVal(),
      limitType: getCommentWordLimitType()
    }
  },
  watch: {
    isEnabled(newVal) {
      GM_setValue('is_enable_comment_word_limit_gm', newVal)
    },
    value(newVal) {
      GM_setValue('comment_word_limit', newVal)
    },
    limitType(newVal) {
      GM_setValue('comment_word_limit_type', newVal)
    }
  }
}
</script>

<template>
  <div>
    <el-card shadow="never">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>评论字数限制</span>
          <el-switch v-model="isEnabled"/>
        </div>
      </template>
      <div style="margin: 8px 0;">
        <el-radio-group v-model="limitType" :disabled="!isEnabled">
          <el-radio-button label="max">超过限制则屏蔽</el-radio-button>
          <el-radio-button label="min">低于限制则屏蔽</el-radio-button>
        </el-radio-group>
      </div>
      <el-input-number v-model="value" :disabled="!isEnabled"/>
    </el-card>
  </div>
</template>
