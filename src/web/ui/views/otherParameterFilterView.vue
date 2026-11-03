<script setup lang="ts">
import externalList from "../../config/otherKeyListDataJson.json";
import commentWordLimitView from "./commentWordLimitView.vue";
import UserLevelFilteringView from "./UserLevelFilteringView.vue";
import SwitchMinMaxInputCard from "../components/SwitchMinMaxInputCard.vue";
import SettingGroup from "../components/SettingGroup.vue";

/**
 * 数量限制：弹幕量 / 播放量 / 时长，以及等级与评论字数限制
 */
const unitMap: Record<string, string> = {
  'minimum_barrage_gm': '个',
  'maximum_barrage_gm': '个',
  'minimum_play_gm': '个',
  'maximum_play_gm': '个',
  'minimum_duration_gm': '秒',
  'maximum_duration_gm': '秒',
};
</script>

<template>
  <SettingGroup
      description="最小值：小于该值就屏蔽；最大值：大于该值就屏蔽。两侧开关都关闭则不做任何限制，指标取自视频卡片上的显示值"
      title="数量限制">
    <SwitchMinMaxInputCard v-for="v in externalList"
                           :key="v.title"
                           :describe="`开关关闭表示该方向不做限制，未启用的方向显示为灰色`"
                           :is-max-key="v.isMaxKey"
                           :is-min-key="v.isMinKey"
                           :max-def-val="v.maxDefVal"
                           :max-input-key="v.maxInputKey"
                           :min-def-val="v.minDefVal"
                           :min-input-key="v.minInputKey"
                           :title="v.title"
                           :unit="unitMap[v.minInputKey] ?? ''"/>
  </SettingGroup>
  <SettingGroup description="等级按 B 站用户等级 0–6 计算；评论字数低于 3 时不生效" title="等级与字数限制">
    <UserLevelFilteringView/>
    <commentWordLimitView/>
  </SettingGroup>
</template>
