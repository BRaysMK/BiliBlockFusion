<script setup lang="ts">
import {ref, watch} from 'vue';
import hotSearch from "../../../pages/search/hot.ts";
import topInput from "../../../pages/search/topInput.ts";
import {eventEmitter} from "@/core/EventEmitter.ts";
import localMKData, {
  getCommentBlockButtonStyleGm,
  isClearLiveCardGm,
  isDelLiveBottomBannerAdGm,
  isDelLivePageRightSidebarGm,
  isHideHotSearchesPanelGm,
  isHideLiveGiftPanelGm,
  isHideSearchHistoryPanelGm,
  isRoomBackgroundHideGm,
  isSearchResponseRewriteGm,
} from "../../../state/localMKData.ts";
import liveSectionModel from "../../../pages/live/sectionModel.ts";
import liveRoomModel from "../../../pages/live/roomModel.ts";
import liveCommon from "../../../pages/live/common.ts";
import space from "../../../pages/space/main.ts";
import SettingRow from '../../components/SettingRow.vue';
import SettingGroup from '../../components/SettingGroup.vue';

//页面处理处理
const isRemoveSearchBottomContent = ref(GM_getValue('isRemoveSearchBottomContent', false));
const isClearLiveCardVal = ref(isClearLiveCardGm());
const isSearchResponseRewriteVal = ref(isSearchResponseRewriteGm());
const isClearTopInputTipContent = ref(GM_getValue('isClearTopInputTipContent', false));
const isHideHotSearchesPanelVal = ref(isHideHotSearchesPanelGm());
const isHideSearchHistoryPanelVal = ref(isHideSearchHistoryPanelGm());
const isDelLivePageRightSidebarVal = ref(isDelLivePageRightSidebarGm());
const isRoomBackgroundHideVal = ref(isRoomBackgroundHideGm());
const isHideLiveGiftPanelVal = ref(isHideLiveGiftPanelGm());
const isDelLiveBottomBannerAdVal = ref(isDelLiveBottomBannerAdGm());
const isHideAddSeeLaterVal = ref(localMKData.isHideAddSeeLater());
const isHideChargingDedicatedVideosVal = ref(localMKData.isHideChargingDedicatedVideos());
const isLiveReplayVideosHideVal = ref(localMKData.isLiveReplayVideosHide());
const commentBlockButtonStyleVal = ref<'default' | 'hide' | 'more' | 'after'>(getCommentBlockButtonStyleGm());

watch(isRemoveSearchBottomContent, (b) => {
  GM_setValue('isRemoveSearchBottomContent', b);
});
watch(isClearLiveCardVal, (b) => {
  GM_setValue('is_clear_live_card_gm', b);
});
watch(isSearchResponseRewriteVal, (b) => {
  GM_setValue('is_search_response_rewrite_gm', b);
});
watch(isClearTopInputTipContent, (b) => {
  GM_setValue('isClearTopInputTipContent', b);
  if (b) {
    eventEmitter.send('执行清空顶部搜索框提示内容');
    return;
  }
  topInput.setTopInputPlaceholder();
});
watch(isHideHotSearchesPanelVal, (n) => {
  GM_setValue('is_hide_hot_searches_panel_gm', n);
  hotSearch.setTopSearchPanelDisplay(n, '热搜', 4000);
});
watch(isHideSearchHistoryPanelVal, (n) => {
  GM_setValue('is_hide_search_history_panel_gm', n);
  hotSearch.setTopSearchPanelDisplay(n, '搜索历史', 4000);
});
watch(isDelLivePageRightSidebarVal, (n) => {
  GM_setValue('is_del_live_page_right_sidebar_gm', n);
  if (liveSectionModel.isLiveSection() || liveRoomModel.isLiveRoom()) {
    liveCommon.setLivePageRightSidebarHide(n);
  }
});
watch(isRoomBackgroundHideVal, (n) => {
  GM_setValue('is_room_background_hide_gm', n);
  if (liveRoomModel.isLiveRoom()) {
    liveRoomModel.setRoomBackgroundDisplay(n);
  }
});
watch(isHideLiveGiftPanelVal, (n) => {
  GM_setValue('is_hide_live_gift_panel_gm', n);
  if (liveRoomModel.isLiveRoom()) {
    liveRoomModel.setGiftControlPanelDisplay(n);
  }
});
watch(isDelLiveBottomBannerAdVal, (n) => {
  GM_setValue('is_del_live_bottom_banner_ad_val_gm', n);
  if (liveRoomModel.isLiveRoom() && !liveRoomModel.isLiveRoomActivity()) {
    liveRoomModel.delLivePageBottomBannerAd();
  }
});
watch(isHideAddSeeLaterVal, (n) => {
  GM_setValue('is_hide_add_see_later', n);
});
watch(isHideChargingDedicatedVideosVal, (n) => {
  GM_setValue('is_hide_charging_dedicated_videos', n);
  space.executeSetChargingVideosVisible(n);
});
watch(isLiveReplayVideosHideVal, (n) => {
  GM_setValue('is_live_replay_videos_hide_gm', n);
  space.executeSetLiveReplayVideosVisible(n);
});
watch(commentBlockButtonStyleVal, (n) => {
  GM_setValue('comment_block_button_style_gm', n);
  // 切换后由 commentSectionModel 清理旧形态入口并重扫，保证实时生效
  eventEmitter.send('event-评论屏蔽按钮样式变更');
});
</script>
<template>
  <SettingGroup title="搜索页">
    <SettingRow label="屏蔽底部额外内容">
      <el-switch v-model="isRemoveSearchBottomContent" size="small"/>
    </SettingRow>
    <SettingRow description="搜索结果列表里混入的直播卡片，视频与其他选项卡一并生效" label="屏蔽推荐直播类">
      <el-switch v-model="isClearLiveCardVal" size="small"/>
    </SettingRow>
    <SettingRow description="在接口响应阶段提前过滤可识别的视频与直播，未知结构仍走页面流程。改动后需刷新搜索页"
                label="响应过滤搜索结果（实验）">
      <el-switch v-model="isSearchResponseRewriteVal" size="small"/>
    </SettingRow>
  </SettingGroup>

  <SettingGroup title="顶部搜索框">
    <SettingRow label="清空提示内容">
      <el-switch v-model="isClearTopInputTipContent" size="small"/>
    </SettingRow>
    <SettingRow label="隐藏热搜">
      <el-switch v-model="isHideHotSearchesPanelVal" size="small"/>
    </SettingRow>
    <SettingRow label="隐藏搜索历史">
      <el-switch v-model="isHideSearchHistoryPanelVal" size="small"/>
    </SettingRow>
  </SettingGroup>

  <SettingGroup title="直播页">
    <SettingRow description="分区页与直播间通用" label="屏蔽右侧侧边栏">
      <el-switch v-model="isDelLivePageRightSidebarVal" size="small"/>
    </SettingRow>
  </SettingGroup>

  <SettingGroup title="直播间">
    <SettingRow label="移除背景">
      <el-switch v-model="isRoomBackgroundHideVal" size="small"/>
    </SettingRow>
    <SettingRow label="隐藏礼物栏">
      <el-switch v-model="isHideLiveGiftPanelVal" size="small"/>
    </SettingRow>
    <SettingRow description="礼物栏下方的横幅广告" label="移除底部横幅广告">
      <el-switch v-model="isDelLiveBottomBannerAdVal" size="small"/>
    </SettingRow>
  </SettingGroup>

  <SettingGroup title="视频列表项">
    <SettingRow description="刷新页面生效" label="隐藏「添加至稍后再看」按钮">
      <el-switch v-model="isHideAddSeeLaterVal" size="small"/>
    </SettingRow>
  </SettingGroup>

  <SettingGroup title="用户空间主页">
    <SettingRow description="投稿选项卡中的充电专属视频" label="隐藏充电视频">
      <el-switch v-model="isHideChargingDedicatedVideosVal" size="small"/>
    </SettingRow>
    <SettingRow description="投稿选项卡中的直播回放" label="隐藏直播回放">
      <el-switch v-model="isLiveReplayVideosHideVal" size="small"/>
    </SettingRow>
  </SettingGroup>

  <SettingGroup title="评论区">
    <SettingRow description="屏蔽按钮的显示位置，所有页面的评论区通用。切换后立即重扫" label="评论屏蔽按钮位置">
      <el-select v-model="commentBlockButtonStyleVal" class="gz-page__select" size="small">
        <el-option label="用户名后面（默认）" value="default"/>
        <el-option label="隐藏" value="hide"/>
        <el-option label="三点菜单中" value="more"/>
        <el-option label="楼中层评论后面" value="after"/>
      </el-select>
    </SettingRow>
  </SettingGroup>
</template>

<style scoped>
.gz-page__select {
  width: 168px;
}
</style>
