<script setup lang="ts">
import {ref, watch} from 'vue';
import {eventEmitter} from "@/core/EventEmitter.ts";
import localMKData, {
  getRequestFrequencyVal,
  hideBlockButtonGm,
  isCheckNestedDynamicContentGm,
  isEffectiveUIDShieldingOnlyVideo
} from "../../../state/localMKData.ts";
import globalValue from "../../../config/globalValue.ts";
import bvRequestQueue from "../../../core/http/bvRequestQueue.ts";
import SettingRow from '../../components/SettingRow.vue';
import SettingGroup from '../../components/SettingGroup.vue';

/**
 * 条件限制组件
 */
const requestFrequencyVal = ref(getRequestFrequencyVal());
//是否仅首页屏蔽生效
const bOnlyTheHomepageIsBlocked = ref(globalValue.bOnlyTheHomepageIsBlocked);
const isEffectiveUIDShieldingOnlyVideoVal = ref(isEffectiveUIDShieldingOnlyVideo());
//是否模糊和正则匹配词转小写
const bFuzzyAndRegularMatchingWordsToLowercase = ref(localMKData.bFuzzyAndRegularMatchingWordsToLowercase());
const isDisableNetRequestsBvVideoInfo = ref(localMKData.isDisableNetRequestsBvVideoInfo());
const hideBlockButtonVal = ref(hideBlockButtonGm());
const isCheckNestedDynamicContentVal = ref(isCheckNestedDynamicContentGm());

watch(bOnlyTheHomepageIsBlocked, (newVal) => {
  GM_setValue("bOnlyTheHomepageIsBlocked", newVal === true);
});
watch(bFuzzyAndRegularMatchingWordsToLowercase, (newVal) => {
  GM_setValue("bFuzzyAndRegularMatchingWordsToLowercase", newVal === true);
});
watch(isDisableNetRequestsBvVideoInfo, (b) => {
  GM_setValue('isDisableNetRequestsBvVideoInfo', b);
});
watch(isEffectiveUIDShieldingOnlyVideoVal, (b) => {
  GM_setValue('is_effective_uid_shielding_only_video', b);
});
watch(requestFrequencyVal, (n) => {
  //设置请求频率
  GM_setValue('requestFrequencyVal', n > 0 && n <= 5 ? n : 0.2);
  bvRequestQueue.setAllRequestInterval(n * 1000);
});
watch(hideBlockButtonVal, (n) => {
  GM_setValue('hide_block_button_gm', n);
  if (n) {
    document.body.querySelectorAll('.gz_shielding_button').forEach(el => el.remove());
  }
});
watch(isCheckNestedDynamicContentVal, (n) => {
  GM_setValue('is_check_nested_dynamic_content_gm', n);
});

eventEmitter.on('更新根据bv号网络请求获取视频信息状态', (b: boolean) => {
  isDisableNetRequestsBvVideoInfo.value = b;
});
</script>
<template>
  <SettingGroup title="常规">
    <SettingRow description="只在首页生效，其余页面（搜索、空间、动态等）不做屏蔽" label="仅首页屏蔽生效">
      <el-switch v-model="bOnlyTheHomepageIsBlocked" size="small"/>
    </SettingRow>
    <SettingRow description="模糊和正则匹配时先把匹配词转小写再比较，修改后刷新页面生效" label="匹配词转小写">
      <el-switch v-model="bFuzzyAndRegularMatchingWordsToLowercase" size="small"/>
    </SettingRow>
    <SettingRow description="UID 屏蔽只在视频场景生效，不改动评论区与动态，改动实时生效" label="仅 UID 屏蔽（限视频）">
      <el-switch v-model="isEffectiveUIDShieldingOnlyVideoVal" size="small"/>
    </SettingRow>
    <SettingRow description="隐藏页面上由脚本生成的屏蔽按钮" label="不显示屏蔽按钮">
      <el-switch v-model="hideBlockButtonVal" size="small"/>
    </SettingRow>
    <SettingRow description="动态列表里转发的内容也按外层账号的规则检查" label="动态项检查嵌套动态">
      <el-switch v-model="isCheckNestedDynamicContentVal" size="small"/>
    </SettingRow>
  </SettingGroup>

  <SettingGroup
      description="降低对 B 站接口的压力与风控概率。修改在下一轮请求结束后生效"
      title="网络请求">
    <SettingRow description="依赖 bv 详情的规则（播放量、时长、组合规则等）会全部失效。被风控时先开这个"
                label="禁用按 bv 号请求视频信息">
      <el-switch v-model="isDisableNetRequestsBvVideoInfo" size="small"/>
    </SettingRow>
    <SettingRow description="0 表示不限制。设置过低可能导致接口风控" label="请求间隔">
      <el-input-number v-model="requestFrequencyVal"
                       :disabled="isDisableNetRequestsBvVideoInfo"
                       :max="5"
                       :min="0"
                       :step="0.1"
                       class="gz-conditionality__number"
                       controls-position="right"
                       size="small"/>
      <span class="gz-conditionality__unit">秒</span>
    </SettingRow>
  </SettingGroup>
</template>

<style scoped>
.gz-conditionality__number {
  width: 104px;
}

.gz-conditionality__unit {
  font-size: var(--fluent-font-size-base-200);
  color: var(--fluent-color-neutral-foreground-3);
}
</style>
