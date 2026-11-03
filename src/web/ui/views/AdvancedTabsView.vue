<script setup lang="ts">
/**
 * 高级页：把低频、配置项多、平时几乎不用的功能收进一个顶层页签。
 * 日常只需要「规则」「页面」「AI 规则」三页，其余都在这里。
 */
import videoMetricsFilterView from "./shield/videoMetricsFilterView.vue";
import otherParameterFilterView from "./otherParameterFilterView.vue";
import timeRangeMaskingView from "./shield/timeRangeMaskingView.vue";
import highLevelRuleView from "./rule/highLevelRuleView.vue";
import CombinationRuleView from "./glory/CombinationRuleView.vue";
import GloryLevelTabView from "./glory/GloryLevelTabView.vue";
import FanCardLevelRestrictionsView from "./glory/FanCardLevelRestrictionsView.vue";
import replProcessingView from "./replProcessingView.vue";
import panelSettingsView from "./settings/panelSettingsView.vue";
import conditionalityView from "./rule/conditionalityView.vue";
import ruleExportImportView from "./rule/ruleExportImportView.vue";
import blacklistManagementView from "./blacklistManagementView.vue";
</script>

<template>
  <el-tabs tab-position="left">
    <el-tab-pane label="阈值与范围" lazy>
      <videoMetricsFilterView/>
      <otherParameterFilterView/>
      <timeRangeMaskingView/>
    </el-tab-pane>
    <el-tab-pane label="高级判定" lazy>
      <highLevelRuleView/>
      <CombinationRuleView/>
    </el-tab-pane>
    <el-tab-pane label="直播等级" lazy>
      <GloryLevelTabView/>
      <FanCardLevelRestrictionsView/>
    </el-tab-pane>
    <el-tab-pane label="替换处理" lazy>
      <replProcessingView/>
    </el-tab-pane>
    <el-tab-pane label="面板与条件" lazy>
      <panelSettingsView/>
      <conditionalityView/>
    </el-tab-pane>
    <el-tab-pane label="数据管理" lazy>
      <ruleExportImportView/>
      <blacklistManagementView/>
    </el-tab-pane>
  </el-tabs>
</template>
