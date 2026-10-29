<script setup lang="ts">
/**
 * 关于页：把「关于与反馈」「支持打赏」两个纯静态页收进一个顶层页签，
 * 信息一条不少，顶层页签少一个。
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
