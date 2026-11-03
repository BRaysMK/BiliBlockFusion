<script setup lang="ts">
import {ref, watch} from 'vue';
import {isLiveSectionResponseRewriteGm, isRoomListAdaptiveGm} from "@/state/localMKData.ts";
import liveSectionModel from "../../../pages/live/sectionModel.ts";
import cssManager from "../../../domain/cssManager.ts";
import PartitionTagWhiterListPanel from "./PatitionTagWhiterListPanel.vue";
import SettingRow from '../../components/SettingRow.vue';
import SettingGroup from '../../components/SettingGroup.vue';

const isRoomListAdaptiveVal = ref(isRoomListAdaptiveGm());
const isLiveSectionResponseRewriteVal = ref(isLiveSectionResponseRewriteGm());

watch(isRoomListAdaptiveVal, (n) => {
  GM_setValue('is_room_list_adaptive_gm', n);
  if (liveSectionModel.isLiveSection()) {
    cssManager.liveStreamPartitionStyle(n);
  }
});
watch(isLiveSectionResponseRewriteVal, (n) => {
  GM_setValue('is_live_section_response_rewrite_gm', n);
});
</script>

<template>
  <SettingGroup title="直播分区">
    <SettingRow label="房间列表自适应">
      <el-switch v-model="isRoomListAdaptiveVal" size="small"/>
    </SettingRow>
    <SettingRow
        description="渲染前就过滤命中规则的直播间，避免列表先撑开再塌陷。列表过短时右下角按钮变红，点一下补满一屏。改动后需刷新"
        label="响应层过滤直播间列表">
      <el-switch v-model="isLiveSectionResponseRewriteVal" size="small"/>
    </SettingRow>
  </SettingGroup>

  <SettingGroup description="仅展示列表中的分区。启用后若列表留空，顶部面板会被清空" title="顶部分区面板白名单">
    <div class="gz-live-partition__panels">
      <PartitionTagWhiterListPanel partition-list-key="mobile_game_list_gm" switch-key="mobile_game_status_gm"
                                   title="手游分区"/>
      <PartitionTagWhiterListPanel partition-list-key="online_game_list_gm" switch-key="online_game_status_gm"
                                   title="网游分区"/>
      <PartitionTagWhiterListPanel partition-list-key="console_game_list_gm" switch-key="console_game_status_gm"
                                   title="单机游戏"/>
    </div>
  </SettingGroup>
</template>

<style scoped>
/* 三块白名单面板原来并排，452px 内容区里每块只剩 140px；改为纵向排列 */
.gz-live-partition__panels {
  display: flex;
  flex-direction: column;
  gap: var(--fluent-spacing-vertical-s);
  padding: var(--fluent-spacing-vertical-xs) var(--fluent-spacing-horizontal-s);
}
</style>
