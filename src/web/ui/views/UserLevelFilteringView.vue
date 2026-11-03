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
 * 根本不参与判定。约束交给 el-input-number 的 :min/:max（EP 内置钳位），
 * 不在 watch 里回写 ref：回写会再次触发 watch，与钳位互相推动形成无限循环，
 * 表现为数值改不动、并且不停弹「不能等于最大等级」的警告。
 */
const LEVEL_MIN = 0;
const LEVEL_MAX = 7;

/**
 * 读取等级值时的兜底
 *
 * 旧版本在清空输入框时会把 null 写进存储，而 GM_getValue 对「键存在但值为 null」
 * 不会回退默认值：最大等级为 null 时 level > 0 会屏蔽掉所有 1 级以上用户。
 * 兜底值必须与 localMKData 各 getter 的默认值一致，否则脏数据会被读成另一个值。
 */
const readLevel = (value: unknown, fallback: number): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(LEVEL_MAX, Math.max(LEVEL_MIN, Math.trunc(value)));
};

const minimumUserLevelVideoVal = ref(readLevel(getMinimumUserLevelVideoGm(), 0));
const maximumUserLevelVideoVal = ref(readLevel(getMaximumUserLevelVideoGm(), 1));
const minimumCommentVal = ref(readLevel(getMinimumUserLevelCommentGm(), 0));
const maximumCommentVal = ref(readLevel(getMaximumUserLevelCommentGm(), 7));
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
 * 把一对等级值规整成「最小 < 最大」
 *
 * 必须能处理边界：0/0 没有「往回收」的空间（最大 - 1 = -1 会被钳回 0），
 * 7/7 同理（最小 + 1 = 8 会被钳回 7），只靠 clamp 会原地不动、留下 min === max，
 * 那在判定侧等于屏蔽所有人。所以先抬最大等级，抬不动再压最小等级。
 */
const normalizePair = (
    minRef: { value: number },
    maxRef: { value: number },
): void => {
  if (minRef.value < maxRef.value) return;
  maxRef.value = Math.min(LEVEL_MAX, minRef.value + 1);
  if (minRef.value >= maxRef.value) {
    minRef.value = Math.max(LEVEL_MIN, maxRef.value - 1);
  }
};

const normalizeVideo = (): void => {
  if (bothVideoEnabled.value) normalizePair(minimumUserLevelVideoVal, maximumUserLevelVideoVal);
};
const normalizeComment = (): void => {
  if (bothCommentEnabled.value) normalizePair(minimumCommentVal, maximumCommentVal);
};

// 存量组合可能来自旧版本或 AI 规则直接写入，挂载时规整一次；合法值不会产生任何写入
normalizeVideo();
normalizeComment();

/** 清空输入框时 EP 会 emit null，不能让它落盘（见 readLevel 的注释） */
const isValidLevel = (n: number): boolean => typeof n === 'number' && Number.isFinite(n);

watch(minimumUserLevelVideoVal, (n) => {
  if (!isValidLevel(n)) return;
  GM_setValue("minimum_user_level_video_gm", n);
});
watch(maximumUserLevelVideoVal, (n) => {
  if (!isValidLevel(n)) return;
  GM_setValue("maximum_user_level_video_gm", n);
});
watch(minimumCommentVal, (n) => {
  if (!isValidLevel(n)) return;
  GM_setValue("minimum_user_level_comment_gm", n);
});
watch(maximumCommentVal, (n) => {
  if (!isValidLevel(n)) return;
  GM_setValue("maximum_user_level_comment_gm", n);
});

// 开关只做持久化与规整。规整放在这里而不是 computed：v-model 已经在 watch 回调
// 执行前写回了本侧 ref，此时读两个开关得到的就是「打开之后」的状态。
watch(isEnableMinimumUserLevelVideoVal, (on) => {
  GM_setValue("is_enable_minimum_user_level_video_gm", on);
  normalizeVideo();
});
watch(isEnableMaximumUserLevelVideoVal, (on) => {
  GM_setValue("is_enable_maximum_user_level_video_gm", on);
  normalizeVideo();
});
watch(isEnableMinimumUserLevelCommentVal, (on) => {
  GM_setValue("is_enable_minimum_user_level_comment_gm", on);
  normalizeComment();
});
watch(isEnableMaximumUserLevelCommentVal, (on) => {
  GM_setValue("is_enable_maximum_user_level_comment_gm", on);
  normalizeComment();
});
</script>

<template>
  <SettingRow description="视频作者的等级低于该值时屏蔽。与最大等级同时启用时须小于最大等级" label="视频·最小等级">
    <el-input-number v-model="minimumUserLevelVideoVal" :disabled="!isEnableMinimumUserLevelVideoVal"
                     :max="videoMinUpper" :min="LEVEL_MIN" controls-position="right" size="small"
                     value-on-clear="min"/>
    <el-switch v-model="isEnableMinimumUserLevelVideoVal" size="small"/>
  </SettingRow>
  <SettingRow description="视频作者的等级高于该值时屏蔽。与最小等级同时启用时须大于最小等级" label="视频·最大等级">
    <el-input-number v-model="maximumUserLevelVideoVal" :disabled="!isEnableMaximumUserLevelVideoVal"
                     :max="LEVEL_MAX" :min="videoMaxLower" controls-position="right" size="small"
                     value-on-clear="max"/>
    <el-switch v-model="isEnableMaximumUserLevelVideoVal" size="small"/>
  </SettingRow>
  <SettingRow description="评论者的等级低于该值时屏蔽评论。与最大等级同时启用时须小于最大等级" label="评论·最小等级">
    <el-input-number v-model="minimumCommentVal" :disabled="!isEnableMinimumUserLevelCommentVal"
                     :max="commentMinUpper" :min="LEVEL_MIN" controls-position="right" size="small"
                     value-on-clear="min"/>
    <el-switch v-model="isEnableMinimumUserLevelCommentVal" size="small"/>
  </SettingRow>
  <SettingRow description="评论者的等级高于该值时屏蔽评论。与最小等级同时启用时须大于最小等级" label="评论·最大等级">
    <el-input-number v-model="maximumCommentVal" :disabled="!isEnableMaximumUserLevelCommentVal"
                     :max="LEVEL_MAX" :min="commentMaxLower" controls-position="right" size="small"
                     value-on-clear="max"/>
    <el-switch v-model="isEnableMaximumUserLevelCommentVal" size="small"/>
  </SettingRow>
</template>
