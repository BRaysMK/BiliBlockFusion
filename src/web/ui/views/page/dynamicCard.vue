<script setup lang="ts">
import {ref, watch} from 'vue';
import localMKData, {
  enableDynamicItemsContentBlockingGm,
  hidePersonalInfoCardGm,
  isBlockAppointmentDynamicGm,
  isBlockGoodsDynamicGm,
  isBlockRepostDynamicGm,
  isBlockSpecialColumnForChargingDynamicGm,
  isBlockUPowerLotteryDynamicGm,
  isBlockVideoChargingExclusiveDynamicGm,
  isBlockVoteDynamicGm
} from "../../../state/localMKData.ts";
import dynamicPage from "../../../pages/dynamic/page.ts";
import cssManager from "../../../domain/cssManager.ts";
import SettingRow from '../../components/SettingRow.vue';
import SettingGroup from '../../components/SettingGroup.vue';

const enableDynamicItemsContentBlockingVal = ref(enableDynamicItemsContentBlockingGm());
const isBlockRepostDynamicVal = ref(isBlockRepostDynamicGm());
const isBlockAppointmentDynamicVal = ref(isBlockAppointmentDynamicGm());
const isBlockVoteDynamicVal = ref(isBlockVoteDynamicGm());
const isBlockUPowerLotteryDynamicVal = ref(isBlockUPowerLotteryDynamicGm());
const isBlockGoodsDynamicVal = ref(isBlockGoodsDynamicGm());
const isBlockSpecialColumnForChargingDynamicVal = ref(isBlockSpecialColumnForChargingDynamicGm());
const isBlockVideoChargingExclusiveDynamicVal = ref(isBlockVideoChargingExclusiveDynamicGm());
const hidePersonalInfoCardVal = ref(hidePersonalInfoCardGm());
const isDynamicHomeRightLayHideVal = ref(localMKData.isDynamicHomeRightLayHide());
const hideBackToOldVersionButVal = ref(localMKData.hideBackToOldVersionButGm());

watch(enableDynamicItemsContentBlockingVal, (n) => {
  GM_setValue('enable_dynamic_items_content_blocking_gm', n);
});
watch(isBlockRepostDynamicVal, (n) => {
  GM_setValue('is_block_repost_dynamic_gm', n);
});
watch(isBlockAppointmentDynamicVal, (n) => {
  GM_setValue('is_block_appointment_dynamic_gm', n);
});
watch(isBlockVoteDynamicVal, (n) => {
  GM_setValue('is_block_vote_dynamic_gm', n);
});
watch(isBlockUPowerLotteryDynamicVal, (n) => {
  GM_setValue('is_block_u_power_lottery_dynamic_gm', n);
});
watch(isBlockGoodsDynamicVal, (n) => {
  GM_setValue('is_block_goods_dynamic_gm', n);
});
watch(isBlockSpecialColumnForChargingDynamicVal, (n) => {
  GM_setValue('is_block_special_column_for_charging_dynamic_gm', n);
});
watch(isBlockVideoChargingExclusiveDynamicVal, (n) => {
  GM_setValue('is_block_video_charging_exclusive_dynamic_gm', n);
});
watch(hidePersonalInfoCardVal, (n) => {
  GM_setValue('hide_personal_info_card_gm', n);
  if (dynamicPage.isUrlDynamicHomePage()) {
    dynamicPage.hidePersonalInfoCard(n);
  }
});
watch(isDynamicHomeRightLayHideVal, (n) => {
  GM_setValue('is_dynamic_home_right_lay_hide', n);
  cssManager.setDynamicHomeRightLayHide(n);
});
watch(hideBackToOldVersionButVal, (n) => {
  GM_setValue('hide_back_to_old_version_but_gm', n);
  dynamicPage.runHideBackToOldVersionButFun(n);
});
</script>

<template>
  <SettingGroup title="动态首页">
    <SettingRow description="打开后动态列表里的每一条都会按 uid 白名单与动态内容规则判定" label="启用动态内容屏蔽">
      <el-switch v-model="enableDynamicItemsContentBlockingVal" size="small"/>
    </SettingRow>
    <SettingRow description="动态首页左侧展示关注/粉丝数据的个人信息卡片" label="隐藏个人信息卡片">
      <el-switch v-model="hidePersonalInfoCardVal" size="small"/>
    </SettingRow>
    <SettingRow description="区域为热搜和其上方的社区中心" label="隐藏右侧布局">
      <el-switch v-model="isDynamicHomeRightLayHideVal" size="small"/>
    </SettingRow>
  </SettingGroup>

  <SettingGroup description="按动态的发布类型过滤，勾选后该类动态不再显示" title="按类型屏蔽">
    <SettingRow label="屏蔽转发类型">
      <el-switch v-model="isBlockRepostDynamicVal" size="small"/>
    </SettingRow>
    <SettingRow description="如直播预约动态" label="屏蔽预约类型">
      <el-switch v-model="isBlockAppointmentDynamicVal" size="small"/>
    </SettingRow>
    <SettingRow label="屏蔽投票类型">
      <el-switch v-model="isBlockVoteDynamicVal" size="small"/>
    </SettingRow>
    <SettingRow label="屏蔽充电专属抽奖类型">
      <el-switch v-model="isBlockUPowerLotteryDynamicVal" size="small"/>
    </SettingRow>
    <SettingRow label="屏蔽商品类">
      <el-switch v-model="isBlockGoodsDynamicVal" size="small"/>
    </SettingRow>
    <SettingRow label="屏蔽充电专属专栏">
      <el-switch v-model="isBlockSpecialColumnForChargingDynamicVal" size="small"/>
    </SettingRow>
    <SettingRow label="屏蔽充电专属视频">
      <el-switch v-model="isBlockVideoChargingExclusiveDynamicVal" size="small"/>
    </SettingRow>
    <SettingRow label="屏蔽右下角回到旧版悬浮按钮">
      <el-switch v-model="hideBackToOldVersionButVal" size="small"/>
    </SettingRow>
  </SettingGroup>
</template>
