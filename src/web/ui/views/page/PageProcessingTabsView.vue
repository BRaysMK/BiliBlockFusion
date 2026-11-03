<script setup lang="ts">
/**
 * 「页面」顶层页：各页面自己的处理开关，外加兼容设置与排除页面。
 * 平铺成一个左侧页签列表，不再嵌套第二层左侧页签。
 */
import PageProcessingView from "./pageProcessingView.vue";
import LivePartitionPageProcessingTabVIew from "./LivePartitionPageProcessingTabVIew.vue";
import dynamicCard from "./dynamicCard.vue";
import PlayPageProcessingTab from "./PlayPageProcessingTab.vue";
import HomePageProcessingTab from "./HomePageProcessingTab.vue";
import TopColumnProcessingTab from "./TopColumnProcessingTab.vue";
import compatibleSettingView from "../settings/compatibleSettingView.vue";
import excludeURLsView from "../settings/excludeURLsView.vue";
</script>

<template>
  <el-tabs tab-position="left">
    <el-tab-pane label="默认设置" lazy>
      <PageProcessingView/>
    </el-tab-pane>
    <el-tab-pane label="首页" lazy>
      <HomePageProcessingTab/>
    </el-tab-pane>
    <el-tab-pane label="直播分区" lazy>
      <LivePartitionPageProcessingTabVIew/>
    </el-tab-pane>
    <el-tab-pane label="播放页" lazy>
      <PlayPageProcessingTab/>
    </el-tab-pane>
    <el-tab-pane label="动态" lazy>
      <dynamicCard/>
    </el-tab-pane>
    <el-tab-pane label="顶栏" lazy>
      <TopColumnProcessingTab/>
    </el-tab-pane>
    <el-tab-pane label="兼容设置" lazy>
      <compatibleSettingView/>
    </el-tab-pane>
    <el-tab-pane label="排除页面" lazy>
      <excludeURLsView/>
    </el-tab-pane>
  </el-tabs>
</template>
