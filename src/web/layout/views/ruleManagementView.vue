<script>
import videoMetricsFilterView from "./videoMetricsFilterView.vue";
import highLevelRuleView from "./highLevelRuleView.vue";
import basicRulesView from "../views/basicRulesView.vue";
import ruleExportImportView from './ruleExportImportView.vue'
import otherParameterFilterView from './otherParameterFilterView.vue'
import viewRulesRuleDialog from "../eventEmitter_components/viewRulesRuleDialog.vue";


export default {
  components: {
    ruleExportImportView,
    otherParameterFilterView,
    basicRulesView,
    highLevelRuleView,
    videoMetricsFilterView,
    viewRulesRuleDialog,
  }
}
</script>

<template>
  <div>
    <el-tabs tab-position="left">
      <el-tab-pane label="基础规则">
        <basicRulesView/>
      </el-tab-pane>
      <el-tab-pane label="高级规则" lazy>
        <highLevelRuleView/>
      </el-tab-pane>
      <el-tab-pane label="其他规则" lazy>
        <otherParameterFilterView/>
      </el-tab-pane>
      <el-tab-pane label="指标屏蔽" lazy>
        <videoMetricsFilterView/>
      </el-tab-pane>
      <el-tab-pane label="导出导入" lazy>
        <ruleExportImportView/>
      </el-tab-pane>
    </el-tabs>
    <viewRulesRuleDialog/>
  </div>
</template>
