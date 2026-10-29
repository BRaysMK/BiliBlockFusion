<script setup lang="ts">
/**
 * 关于页（合并自「支持打赏」与「关于和问题反馈」）
 *
 * 合并理由：两者都是纯信息展示、无交互逻辑的静态内容（63 行 + 104 行），
 * 原先各占一个顶层页签，挤占了本已拥挤的 12 个页签。
 * 合并后用左侧子页签组织，信息一条不少，顶层页签少一个。
 */
import aboutAndFeedbackView from "./aboutAndFeedbackView.vue";
import donateLayoutView from "./settings/donateLayoutView.vue";
</script>

<template>
  <el-tabs tab-position="left">
    <el-tab-pane label="关于与反馈" lazy>
      <aboutAndFeedbackView/>
    </el-tab-pane>
    <el-tab-pane label="支持打赏" lazy>
      <donateLayoutView/>
    </el-tab-pane>
  </el-tabs>
</template>
