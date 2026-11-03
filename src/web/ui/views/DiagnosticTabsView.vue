<script setup lang="ts">
/**
 * 诊断与关于页：把排查类（输出信息 / 缓存管理 / 调试测试）和信息类（关于 / 打赏）功能
 * 收进一个顶层页签。调试测试只在开发构建或开启 ws 调试时出现。
 */
import outputInformationView from "./debug/outputInformationView.vue";
import cacheManagementView from "./debug/cacheManagementView.vue";
import debuggerManagementView from "./debug/debuggerManagementView.vue";
import aboutAndFeedbackView from "./aboutAndFeedbackView.vue";
import donateLayoutView from "./settings/donateLayoutView.vue";
import debuggerManagement from "../../domain/debuggerManagement.ts";

/** 开发构建或已开启 ws 调试通道时显示调试页签 */
const showDebugger = __DEV__ || debuggerManagement.isWsService();
</script>

<template>
  <el-tabs tab-position="left">
    <el-tab-pane label="输出信息">
      <outputInformationView/>
    </el-tab-pane>
    <el-tab-pane label="缓存管理" lazy>
      <cacheManagementView/>
    </el-tab-pane>
    <el-tab-pane v-if="showDebugger" label="调试测试" lazy>
      <debuggerManagementView/>
    </el-tab-pane>
    <el-tab-pane label="关于与反馈" lazy>
      <aboutAndFeedbackView/>
    </el-tab-pane>
    <el-tab-pane label="支持打赏" lazy>
      <donateLayoutView/>
    </el-tab-pane>
  </el-tabs>
</template>
