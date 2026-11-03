<script setup lang="ts">
import {ref} from 'vue'
import defUtil from "../../../core/util/defUtil.ts";
import localMKData from "../../../state/localMKData.ts";
import combinationRulesShielding from "../../../domain/shielding/combinationRules.ts";
import {ElMessageBox, ElNotification} from 'element-plus';
import SettingGroup from '../../components/SettingGroup.vue';

const matchModeOptions = combinationRulesShielding.matchModeOptions;
const fieldOptions = combinationRulesShielding.fieldOptions;
const dataList = ref<any[]>([]);

const addRuleBut = (row: any) => {
  const {temporary} = row;
  const selectedKey = temporary.key;
  row.ruleList.push({key: selectedKey, mode: matchModeOptions[0].value, value: ''});
};
const delRuleBut = (mainRow: any, row: any) => {
  mainRow.ruleList = mainRow.ruleList.filter((item: any) => item !== row);
};
const addPlanBut = () => {
  const size = dataList.value.length;
  const newRow = {
    name: `方案${size + 1}`,
    ruleList: [] as any[],
    status: false,
    temporary: {key: fieldOptions[0].value}
  };
  if (size > 1) {
    const find = dataList.value.find(lastItem => lastItem.status === false && lastItem.ruleList.length === 0);
    if (find) {
      ElMessageBox.alert(`【${find.name}】未启用且为空组合规则,请使用该方案`, {type: "warning"});
      return;
    }
  }
  dataList.value.push(newRow);
};
const delPlanBut = (row: any) => {
  dataList.value = dataList.value.filter(item => item !== row);
  ElNotification({title: '', message: "已删除", position: 'bottom-right'});
};
const savePlanBut = () => {
  const newDataList = defUtil.toRaw(dataList.value).map(({temporary, ...item}: any) => {
    return item;
  });
  GM_setValue('combination_rule_list_gm', newDataList);
  ElNotification({title: '', message: "已保存组合规则方案列表", position: 'bottom-right'});
};
const refresh = (tip = false) => {
  dataList.value = [];
  for (const item of localMKData.getCombinationRuleListGm()) {
    (item as any).temporary = {key: fieldOptions[0].value};
    dataList.value.push(item);
  }
  tip && ElNotification({title: '', message: "刷新方案列表成功", type: "success", position: 'bottom-right'});
};

refresh();
</script>

<template>
  <!-- 原来是 span=18 的表格 + span=6 的说明栏：在 452px 的标签页里说明栏只剩 113px，
       表格里的「字段 / 匹配值 / 操作」三列挤成一条。说明移到分组说明气泡，
       每个方案改成一张纵向卡片，规则列表在卡片内撑满宽度。 -->
  <SettingGroup
      description="方案内规则全部命中才屏蔽；tag 的多个值用英文逗号分隔且需全部命中。依赖 bv 详情请求，禁用后方案全部失效。点击保存后生效"
      title="组合规则方案">
    <div class="gz-comb__toolbar">
      <el-button size="small" @click="addPlanBut">添加方案</el-button>
      <el-button size="small" @click="refresh(true)">刷新</el-button>
      <el-button size="small" type="primary" @click="savePlanBut">保存</el-button>
    </div>

    <div v-if="dataList.length === 0" class="gz-comb__empty">还没有组合规则方案</div>

    <div v-for="row in dataList" :key="row.name" class="gz-comb__plan">
      <div class="gz-comb__plan-header">
        <el-input v-model.trim="row.name" class="gz-comb__name" placeholder="方案名"/>
        <el-switch v-model="row.status" active-text="启用" size="small"/>
        <el-popconfirm :title="`是要删除该方案吗？【${row.name}】`" @confirm="delPlanBut(row)">
          <template #reference>
            <el-button size="small" type="danger" plain>移除方案</el-button>
          </template>
        </el-popconfirm>
      </div>

      <div v-if="row.ruleList.length === 0" class="gz-comb__empty">空组合规则</div>
      <div v-for="rule in row.ruleList" :key="rule.value + rule.key" class="gz-comb__rule">
        <el-select v-model="rule.key" class="gz-comb__field" placeholder="字段" size="small">
          <el-option v-for="item in fieldOptions" :key="item.value" :label="item.label" :value="item.value"/>
        </el-select>
        <el-input v-model.trim="rule.value" class="gz-comb__value" placeholder="匹配值" size="small"/>
        <el-popconfirm title="是要删除该条规则吗？" @confirm="delRuleBut(row, rule)">
          <template #reference>
            <el-button size="small" type="danger" plain>移除</el-button>
          </template>
        </el-popconfirm>
      </div>

      <div class="gz-comb__add">
        <el-select v-model="row.temporary.key" class="gz-comb__field" placeholder="字段" size="small">
          <el-option v-for="item in fieldOptions" :key="item.value" :label="item.label" :value="item.value"/>
        </el-select>
        <el-button size="small" @click="addRuleBut(row)">添加规则</el-button>
      </div>
    </div>
  </SettingGroup>
</template>

<style scoped>
.gz-comb__toolbar {
  display: flex;
  gap: var(--fluent-spacing-horizontal-xs);
  padding: var(--fluent-spacing-vertical-xs) var(--fluent-spacing-horizontal-s);
}

.gz-comb__plan {
  margin: 0 var(--fluent-spacing-horizontal-s) var(--fluent-spacing-vertical-s);
  padding: var(--fluent-spacing-vertical-s);
  border: var(--fluent-stroke-width-thin) solid var(--fluent-color-neutral-stroke-2);
  border-radius: var(--fluent-border-radius-medium);
}

.gz-comb__plan-header {
  display: flex;
  align-items: center;
  gap: var(--fluent-spacing-horizontal-s);
  margin-bottom: var(--fluent-spacing-vertical-s);
}

.gz-comb__name {
  flex: 1 1 auto;
  min-width: 0;
}

.gz-comb__rule {
  display: flex;
  align-items: center;
  gap: var(--fluent-spacing-horizontal-xs);
  margin-bottom: var(--fluent-spacing-vertical-xs);
}

.gz-comb__add {
  display: flex;
  align-items: center;
  gap: var(--fluent-spacing-horizontal-xs);
  padding-top: var(--fluent-spacing-vertical-xs);
  border-top: var(--fluent-stroke-width-thin) dashed var(--fluent-color-neutral-stroke-2);
}

.gz-comb__field {
  flex: 0 0 116px;
}

.gz-comb__value {
  flex: 1 1 auto;
  min-width: 0;
}

.gz-comb__empty {
  padding: var(--fluent-spacing-vertical-xs) var(--fluent-spacing-horizontal-s);
  font-size: var(--fluent-font-size-base-200);
  color: var(--fluent-color-neutral-foreground-4);
}
</style>
