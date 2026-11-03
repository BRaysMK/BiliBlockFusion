<script setup lang="ts">
import {ref, watch} from 'vue';
import globalValue from "../../../config/globalValue.ts";
import localMKData, {bGateClearListNonVideoGm} from "../../../state/localMKData.ts";
import SettingRow from '../../components/SettingRow.vue';
import SettingGroup from '../../components/SettingGroup.vue';

//是否适配bilibili-app-commerce脚本(Bilibili-Gate脚本)
const adaptationBAppRecommend = ref(globalValue.adaptationBAppCommerce);
const bGateClearListNonVideoV = ref(bGateClearListNonVideoGm());
//是否兼容BewlyBewly插件
const compatible_BEWLY_BEWLY = ref(globalValue.compatibleBEWLYBEWLY);
//是否全部兼容新版评论区
const discardOldCommentAreasV = ref(localMKData.isDiscardOldCommentAreas());

watch(adaptationBAppRecommend, (newVal) => {
  //设置是否适配Bilibili-Gate脚本，原bilibili-app-recommend脚本
  GM_setValue("adaptation-b-app-recommend", newVal === true);
});
watch(bGateClearListNonVideoV, (n) => {
  GM_setValue('b_gate_clear_list_non_video_gm', n);
});
watch(compatible_BEWLY_BEWLY, (newVal) => {
  //设置是否兼容BewlyBewly插件
  GM_setValue("compatible_BEWLY_BEWLY", newVal === true);
});
watch(discardOldCommentAreasV, (newVal) => {
  GM_setValue("discardOldCommentAreas", newVal === true);
});
</script>

<template>
  <SettingGroup description="没安装对应脚本或插件时不要开启，否则会改变本脚本自身的判定" title="Bilibili-Gate 脚本">
    <SettingRow label="首页屏蔽适配">
      <el-switch v-model="adaptationBAppRecommend" size="small"/>
    </SettingRow>
    <SettingRow description="清空推荐列表里的非视频元素，刷新页面后生效" label="清空列表非视频元素">
      <el-switch v-model="bGateClearListNonVideoV" size="small"/>
    </SettingRow>
  </SettingGroup>

  <SettingGroup description="仅兼容 BewlyCat，不向前兼容旧版 BewlyBewly" title="BewlyCat 插件">
    <SettingRow label="首页适配">
      <el-switch v-model="compatible_BEWLY_BEWLY" size="small"/>
    </SettingRow>
  </SettingGroup>

  <SettingGroup title="评论区">
    <SettingRow description="评论区改用新版获取方式，不再处理旧版接口。改动后需刷新页面" label="弃用旧版评论区处理">
      <el-switch v-model="discardOldCommentAreasV" size="small"/>
    </SettingRow>
  </SettingGroup>
</template>
