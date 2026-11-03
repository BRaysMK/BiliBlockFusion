<script setup lang="ts">
import {computed, ref, watch} from 'vue';
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
import SettingRow from '../components/SettingRow.vue';

/**
 * 等级限制
 *
 * 「最小等级必须小于最大等级」这条约束只在两侧都启用时才成立——单侧启用时另一个值
 * 根本不参与判定。约束全部交给 el-input-number 的 :min/:max（EP 内置钳位），
 * 不在 watch 里回写 ref：回写会再次触发 watch，与钳位互相推动形成无限循环，
 * 表现为数值改不动、并且不停弹「不能等于最大等级」的警告。
 */
const LEVEL_MIN = 0;
const LEVEL_MAX = 7;

const minimumUserLevelVideoVal = ref(getMinimumUserLevelVideoGm());
const maximumUserLevelVideoVal = ref(getMaximumUserLevelVideoGm());
const minimumCommentVal = ref(getMinimumUserLevelCommentGm());
const maximumCommentVal = ref(getMaximumUserLevelCommentGm());
const isEnableMinimumUserLevelVideoVal = ref(isEnableMinimumUserLevelVideoGm());
const isEnableMaximumUserLevelVideoVal = ref(isEnableMaximumUserLevelVideoGm());
const isEnableMinimumUserLevelCommentVal = ref(isEnableMinimumUserLevelCommentGm());
const isEnableMaximumUserLevelCommentVal = ref(isEnableMaximumUserLevelCommentGm());

const bothVideoEnabled = computed(() => isEnableMinimumUserLevelVideoVal.value && isEnableMaximumUserLevelVideoVal.value);
const bothCommentEnabled = computed(() => isEnableMinimumUserLevelCommentVal.value && isEnableMaximumUserLevelCommentVal.value);

/** 最小值的上限：仅在两侧都启用时压到「最大 - 1」，否则不受另一侧约束 */
const videoMinUpper = computed(() =>
    bothVideoEnabled.value ? Math.max(LEVEL_MIN, maximumUserLevelVideoVal.value - 1) : LEVEL_MAX);
const videoMaxLower = computed(() =>
    bothVideoEnabled.value ? Math.min(LEVEL_MAX, minimumUserLevelVideoVal.value + 1) : LEVEL_MIN);
const commentMinUpper = computed(() =>
    bothCommentEnabled.value ? Math.max(LEVEL_MIN, maximumCommentVal.value - 1) : LEVEL_MAX);
const commentMaxLower = computed(() =>
    bothCommentEnabled.value ? Math.min(LEVEL_MAX, minimumCommentVal.value + 1) : LEVEL_MIN);

/**
 * 打开开关时把已有值规整到合法区间
 *
 * :min/:max 只在 EP 内部校验值变化时生效，单纯改 prop 不会重新钳位当前值，
 * 所以「先设反向值、再打开开关」会留下一个不合法的组合，在打开这一侧时补一次规整。
 *
 * 注意判断用的是「另一侧当前是否启用」，而不是 bothXxxEnabled——那是个 computed，
 * 此刻本侧的 ref 还没被 v-model 写回，读到的是打开前的状态，会把规整整个跳过。
 */
const enableMaxVideo = (on: boolean): void => {
  if (on && isEnableMinimumUserLevelVideoVal.value
      && maximumUserLevelVideoVal.value <= minimumUserLevelVideoVal.value) {
    maximumUserLevelVideoVal.value = Math.min(LEVEL_MAX, minimumUserLevelVideoVal.value + 1);
  }
};
const enableMinVideo = (on: boolean): void => {
  if (on && isEnableMaximumUserLevelVideoVal.value
      && minimumUserLevelVideoVal.value >= maximumUserLevelVideoVal.value) {
    minimumUserLevelVideoVal.value = Math.max(LEVEL_MIN, maximumUserLevelVideoVal.value - 1);
  }
};
const enableMaxComment = (on: boolean): void => {
  if (on && isEnableMinimumUserLevelCommentVal.value
      && maximumCommentVal.value <= minimumCommentVal.value) {
    maximumCommentVal.value = Math.min(LEVEL_MAX, minimumCommentVal.value + 1);
  }
};
const enableMinComment = (on: boolean): void => {
  if (on && isEnableMaximumUserLevelCommentVal.value
      && minimumCommentVal.value >= maximumCommentVal.value) {
    minimumCommentVal.value = Math.max(LEVEL_MIN, maximumCommentVal.value - 1);
  }
};

watch(minimumUserLevelVideoVal, (n) => {
  GM_setValue("minimum_user_level_video_gm", n);
});
watch(maximumUserLevelVideoVal, (n) => {
  GM_setValue("maximum_user_level_video_gm", n);
});
watch(minimumCommentVal, (n) => {
  GM_setValue("minimum_user_level_comment_gm", n);
});
watch(maximumCommentVal, (n) => {
  GM_setValue("maximum_user_level_comment_gm", n);
});

// 开关只做持久化，规整逻辑在 enableXxx 里，两者分开：
// watch 回调拿到的 on 是写入后的值，可以安全地用它判断是否刚被打开
watch(isEnableMinimumUserLevelVideoVal, (on) => {
  GM_setValue("is_enable_minimum_user_level_video_gm", on);
  enableMinVideo(on);
});
watch(isEnableMaximumUserLevelVideoVal, (on) => {
  GM_setValue("is_enable_maximum_user_level_video_gm", on);
  enableMaxVideo(on);
});
watch(isEnableMinimumUserLevelCommentVal, (on) => {
  GM_setValue("is_enable_minimum_user_level_comment_gm", on);
  enableMinComment(on);
});
watch(isEnableMaximumUserLevelCommentVal, (on) => {
  GM_setValue("is_enable_maximum_user_level_comment_gm", on);
  enableMaxComment(on);
});
</script>

<template>
  <SettingRow description="视频作者的等级低于该值时屏蔽。与最大等级同时启用时须小于最大等级" label="视频·最小等级">
    <el-input-number v-model="minimumUserLevelVideoVal" :disabled="!isEnableMinimumUserLevelVideoVal"
                     :max="videoMinUpper" :min="LEVEL_MIN" controls-position="right" size="small"/>
    <el-switch v-model="isEnableMinimumUserLevelVideoVal" size="small"/>
  </SettingRow>
  <SettingRow description="视频作者的等级高于该值时屏蔽。与最小等级同时启用时须大于最小等级" label="视频·最大等级">
    <el-input-number v-model="maximumUserLevelVideoVal" :disabled="!isEnableMaximumUserLevelVideoVal"
                     :max="LEVEL_MAX" :min="videoMaxLower" controls-position="right" size="small"/>
    <el-switch v-model="isEnableMaximumUserLevelVideoVal" size="small"/>
  </SettingRow>
  <SettingRow description="评论者的等级低于该值时屏蔽评论。与最大等级同时启用时须小于最大等级" label="评论·最小等级">
    <el-input-number v-model="minimumCommentVal" :disabled="!isEnableMinimumUserLevelCommentVal"
                     :max="commentMinUpper" :min="LEVEL_MIN" controls-position="right" size="small"/>
    <el-switch v-model="isEnableMinimumUserLevelCommentVal" size="small"/>
  </SettingRow>
  <SettingRow description="评论者的等级高于该值时屏蔽评论。与最小等级同时启用时须大于最小等级" label="评论·最大等级">
    <el-input-number v-model="maximumCommentVal" :disabled="!isEnableMaximumUserLevelCommentVal"
                     :max="LEVEL_MAX" :min="commentMaxLower" controls-position="right" size="small"/>
    <el-switch v-model="isEnableMaximumUserLevelCommentVal" size="small"/>
  </SettingRow>
</template>
