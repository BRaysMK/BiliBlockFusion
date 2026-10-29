<script setup lang="ts">
/**
 * 诊断页（合并自「输出信息」「缓存管理」「调试测试」）
 *
 * 合并理由：三者都是排查类功能（616 + 242 + 77 行），普通用户日常不会同时打开，
 * 但都需要「出问题时能快速找到」。合并为一个「诊断」页签后用子页签组织，
 * 顶层页签从 12 个降到 10 个，同时保留全部排查能力。
 *
 * 其中「调试测试」仅在开发构建或 ws 开关开启时显示（沿用 App.vue 的 ws_panel_show 逻辑）。
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
