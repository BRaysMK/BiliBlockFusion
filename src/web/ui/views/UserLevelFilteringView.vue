<script setup lang="ts">
import {ref, watch} from 'vue';
import {
  getMaximumUserLevelCommentGm,
  getMaximumUserLevelVideoGm,
  getMinimumUserLevelCommentGm,
  getMinimumUserLevelVideoGm,
  isEnableMaximumUserLevelCommentGm,
  isEnableMaximumUserLevelVideoGm,
  isEnableMinimumUserLevelCommentGm,
  isEnableMinimumUserLevelVideoGm
} from "@/state/localMKData.ts";
import {ElMessage} from 'element-plus';
import SettingRow from '../components/SettingRow.vue';

/**
 * 等级限制
 *
 * 上下界互斥：最小等级不能大于等于最大等级。原来四个值挤在两栏里，
 * 校验提示出现时用户看不出是哪一栏触发的，改为逐行呈现。
 */
const minVal = 0;
const maxVal = 7;
const minimumUserLevelVideoVal = ref(getMinimumUserLevelVideoGm());
const maximumUserLevelVideoVal = ref(getMaximumUserLevelVideoGm());
const minimumCommentVal = ref(getMinimumUserLevelCommentGm());
const maximumCommentVal = ref(getMaximumUserLevelCommentGm());
const isEnableMinimumUserLevelVideoVal = ref(isEnableMinimumUserLevelVideoGm());
const isEnableMaximumUserLevelVideoVal = ref(isEnableMaximumUserLevelVideoGm());
const isEnableMinimumUserLevelCommentVal = ref(isEnableMinimumUserLevelCommentGm());
const isEnableMaximumUserLevelCommentVal = ref(isEnableMaximumUserLevelCommentGm());

watch(minimumUserLevelVideoVal, (n) => {
  const max = maximumUserLevelVideoVal.value;
  if (n > max) {
    minimumUserLevelVideoVal.value = max;
    ElMessage.warning('最小等级不能大于最大等级');
    return;
  }
  if (n === max) {
    --minimumUserLevelVideoVal.value;
    ElMessage.warning('最小等级不能等于最大等级');
    return;
  }
  GM_setValue("minimum_user_level_video_gm", n);
});
watch(maximumUserLevelVideoVal, (n) => {
  const min = minimumUserLevelVideoVal.value;
  if (n < min) {
    maximumUserLevelVideoVal.value = min;
    ElMessage.warning('最大等级不能小于最小等级');
    return;
  }
  if (n === min) {
    ++maximumUserLevelVideoVal.value;
    ElMessage.warning('最大等级不能等于最小等级');
    return;
  }
  GM_setValue("maximum_user_level_video_gm", maximumUserLevelVideoVal.value);
});
watch(minimumCommentVal, (n) => {
  const max = maximumCommentVal.value;
  if (n > max) {
    minimumCommentVal.value = max;
    ElMessage.warning('最小等级不能大于最大等级');
    return;
  }
  if (n === max) {
    --minimumCommentVal.value;
    ElMessage.warning('最小等级不能等于最大等级');
    return;
  }
  GM_setValue("minimum_user_level_comment_gm", n);
});
watch(maximumCommentVal, (n) => {
  const min = minimumCommentVal.value;
  if (n < min) {
    maximumCommentVal.value = min;
    ElMessage.warning('最大等级不能小于最小等级');
    return;
  }
  if (n === min) {
    ++maximumCommentVal.value;
    ElMessage.warning('最大等级不能等于最小等级');
    return;
  }
  GM_setValue("maximum_user_level_comment_gm", n);
});
watch(isEnableMinimumUserLevelVideoVal, (n) => {
  GM_setValue("is_enable_minimum_user_level_video_gm", n);
});
watch(isEnableMaximumUserLevelVideoVal, (n) => {
  GM_setValue("is_enable_maximum_user_level_video_gm", n);
});
watch(isEnableMinimumUserLevelCommentVal, (n) => {
  GM_setValue("is_enable_minimum_user_level_comment_gm", n);
});
watch(isEnableMaximumUserLevelCommentVal, (n) => {
  GM_setValue("is_enable_maximum_user_level_comment_gm", n);
});
</script>

<template>
  <SettingRow description="视频卡片上作者的等级低于该值时屏蔽" label="视频·最小等级">
    <el-input-number v-model="minimumUserLevelVideoVal" :disabled="!isEnableMinimumUserLevelVideoVal"
                     :max="maxVal" :min="minVal" controls-position="right" size="small"/>
    <el-switch v-model="isEnableMinimumUserLevelVideoVal" size="small"/>
  </SettingRow>
  <SettingRow description="视频卡片上作者的等级高于该值时屏蔽" label="视频·最大等级">
    <el-input-number v-model="maximumUserLevelVideoVal" :disabled="!isEnableMaximumUserLevelVideoVal"
                     :max="maxVal" :min="1" controls-position="right" size="small"/>
    <el-switch v-model="isEnableMaximumUserLevelVideoVal" size="small"/>
  </SettingRow>
  <SettingRow description="评论区中用户的等级低于该值时屏蔽评论" label="评论·最小等级">
    <el-input-number v-model="minimumCommentVal" :disabled="!isEnableMinimumUserLevelCommentVal"
                     :max="maxVal" :min="3" controls-position="right" size="small"/>
    <el-switch v-model="isEnableMinimumUserLevelCommentVal" size="small"/>
  </SettingRow>
  <SettingRow description="评论区中用户的等级高于该值时屏蔽评论" label="评论·最大等级">
    <el-input-number v-model="maximumCommentVal" :disabled="!isEnableMaximumUserLevelCommentVal"
                     :max="maxVal" :min="3" controls-position="right" size="small"/>
    <el-switch v-model="isEnableMaximumUserLevelCommentVal" size="small"/>
  </SettingRow>
</template>
