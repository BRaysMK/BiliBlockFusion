<script setup lang="ts">
/**
 * 诊断页：把「输出信息」「缓存管理」「调试测试」三个排查类功能收进一个顶层页签，
 * 减少顶层页签数量，同时保留全部排查能力。
 */
import outputInformationView from "./debug/outputInformationView.vue";
import cacheManagementView from "./debug/cacheManagementView.vue";
import debuggerManagementView from "./debug/debuggerManagementView.vue";
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
  </el-tabs>
</template>
