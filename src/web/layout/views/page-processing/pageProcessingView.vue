<script>
import hotSearch from "../../../pagesModel/search/hotSearch.js";
import topInput from "../../../pagesModel/search/topInput.js";
import {eventEmitter} from "../../../model/EventEmitter.js";
import localMKData, {
  isHideHotSearchesPanelGm,
  isHideSearchHistoryPanelGm,
} from "../../../data/localMKData.js";
import space from "../../../pagesModel/space/space.js";

//页面处理处理
export default {
  components: {},
  data() {
    return {
      isRemoveSearchBottomContent: GM_getValue('isRemoveSearchBottomContent', false),
      isClearTopInputTipContent: GM_getValue('isClearTopInputTipContent', false),
      isHideHotSearchesPanelVal: isHideHotSearchesPanelGm(),
      isHideSearchHistoryPanelVal: isHideSearchHistoryPanelGm(),
      isHideAddSeeLaterVal: localMKData.isHideAddSeeLater(),
      isHideChargingDedicatedVideosVal: localMKData.isHideChargingDedicatedVideos(),
      isLiveReplayVideosHideVal: localMKData.isLiveReplayVideosHide()
    }
  },
  methods: {},
  watch: {
    isRemoveSearchBottomContent(b) {
      GM_setValue('isRemoveSearchBottomContent', b)
    },
    isClearTopInputTipContent(b) {
      GM_setValue('isClearTopInputTipContent', b)
      if (b) {
        eventEmitter.send('执行清空顶部搜索框提示内容')
        return
      }
      topInput.setTopInputPlaceholder()
    },
    isHideHotSearchesPanelVal(n) {
      GM_setValue('is_hide_hot_searches_panel_gm', n)
      hotSearch.setTopSearchPanelDisplay(n, '热搜', 4000);
    },
    isHideSearchHistoryPanelVal(n) {
      GM_setValue('is_hide_search_history_panel_gm', n)
      hotSearch.setTopSearchPanelDisplay(n, '搜索历史', 4000);
    },
    isHideAddSeeLaterVal(n) {
      GM_setValue('is_hide_add_see_later', n)
    },
    isHideChargingDedicatedVideosVal(n) {
      GM_setValue('is_hide_charging_dedicated_videos', n)
      space.executeSetChargingVideosVisible(n)
    },
    isLiveReplayVideosHideVal(n) {
      GM_setValue('is_live_replay_videos_hide_gm', n)
      space.executeSetLiveReplayVideosVisible(n)
    }
  }
}
</script>
<template>
  <div>
    <el-card shadow="never">
      <template #header>
        <span>搜索页</span>
      </template>
      <el-switch v-model="isRemoveSearchBottomContent"
                 active-text="屏蔽底部额外内容"/>
    </el-card>
    <el-card shadow="never">
      <template #header>
        <span>顶部搜索框</span>
      </template>
      <el-switch v-model="isClearTopInputTipContent" active-text="清空内容"/>
      <el-switch v-model="isHideHotSearchesPanelVal" active-text="隐藏热搜"/>
      <el-switch v-model="isHideSearchHistoryPanelVal" active-text="隐藏搜索历史"/>
    </el-card>
    <el-card shadow="never">
      <template #header>视频列表项</template>
      <el-switch v-model="isHideAddSeeLaterVal" active-text="隐藏添加至稍后再看按钮" title="刷新页面生效"/>
    </el-card>
    <el-card shadow="never">
      <template #header>用户空间主页</template>
      <el-switch v-model="isHideChargingDedicatedVideosVal" active-text="隐藏投稿选项卡中充电视频"/>
      <el-switch v-model="isLiveReplayVideosHideVal" active-text="隐藏投稿选项卡直播回放"/>
    </el-card>
  </div>
</template>
