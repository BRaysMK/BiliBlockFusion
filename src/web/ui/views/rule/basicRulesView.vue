<script setup lang="ts">
import {ref} from 'vue';
import {eventEmitter} from "../../../core/EventEmitter.ts";
import ruleKeyListData from "../../../config/ruleKeyListData.ts";
import ruleUtil from "../../../core/util/ruleUtil.ts";
import multipleRuleEditDialog from "../../dialogs/multipleRuleEditDialog.vue";
import ruleSetValueDialog from '../../dialogs/ruleSetValueDialog.vue';
import addRuleDialog from '../../components/addRuleDialog.vue'
import ruleInformationView from "./ruleInformationView.vue";

const cascaderVal = ref(["精确匹配", "precise_uid"]);
const cascaderOptions = ruleKeyListData.getSelectOptions();
//规则信息
const ruleInfoArr = ref<any[]>([]);
const addRuleDialogVisible = ref(false);
const addRuleDialogRuleInfo = ref({
  type: '',
  name: ''
});

const handleChangeCascader = (val: any) => {
  console.log(val);
};const setRuleBut = () => {
  const [model, type] = cascaderVal.value;
  const typeMap = ruleInfoArr.value.find(item => item.type === type);
  if (model === '组合匹配') {
    eventEmitter.send('打开多重规则编辑对话框', typeMap);
    return;
  }
  eventEmitter.send('修改规则对话框', typeMap);
};
const delBut = () => {
  const [model, type] = cascaderVal.value;
  const typeMap = ruleInfoArr.value.find(item => item.type === type);
  if (model === '组合匹配') {
    eventEmitter.send('打开多重规则编辑对话框', typeMap);
    return;
  }
  ruleUtil.showDelRuleInput(type);
};
const batchAddBut = () => {
  const [model, type] = cascaderVal.value;
  if (model === '组合匹配') {
    const typeMap = ruleInfoArr.value.find(item => item.type === type);
    eventEmitter.send('打开多重规则编辑对话框', typeMap);
    return;
  }
  addRuleDialogVisible.value = true;
  addRuleDialogRuleInfo.value = {
    type: type,
    name: ruleInfoArr.value.find(item => item.type === type)!.name
  };
};

for (let newRuleKeyListElement of ruleKeyListData.getRuleKeyListData()) {
  ruleInfoArr.value.push({
    type: newRuleKeyListElement.key,
    name: newRuleKeyListElement.name,
  });
}
</script>

<template>
  <div class="gz-basic-rule">
    <!-- 选择规则压成一条工具栏：原来独立成卡再并排两栏，面板只有 613px 宽，
         两栏各剩 238/333px，规则名被截断、按钮换行，纵向还被拉长 -->
    <el-card shadow="never" class="gz-basic-rule__toolbar">
      <div class="gz-basic-rule__row">
        <el-cascader v-model="cascaderVal" :options="cascaderOptions"
                     :props="{ expandTrigger: 'hover' }" filterable
                     show-all-levels class="gz-basic-rule__cascader" @change="handleChangeCascader">
          <template #default="{ node, data }">
            <span>{{ data.label }}</span>
            <span v-if="!node.isLeaf"> ({{ data.children.length }}) </span>
          </template>
        </el-cascader>
        <el-button-group>
          <el-button size="small" @click="batchAddBut">批量添加</el-button>
          <el-button size="small" @click="setRuleBut">修改</el-button>
          <el-button size="small" @click="delBut">移除</el-button>
        </el-button-group>
      </div>
    </el-card>

    <ruleInformationView :rule-info-arr="ruleInfoArr"/>

    <!-- 使用说明移到底部并默认收起：排在规则信息之前会把真正要看的列表挤出首屏 -->
    <el-card shadow="never">
      <el-collapse>
        <el-collapse-item title="使用说明（点击展开）" name="tips">
          <gz-space align-items="flex-start" direction="vertical">
            <span>1. 下拉框支持搜索：点开下拉后直接输入文字即可筛选规则类型</span>
            <span>2. 优先用 uid 精确屏蔽：用户名可以随时改，改了就绕过了用户名规则</span>
            <span>3. 模糊匹配 = 包含即命中；精确匹配 = 整值相同；正则匹配 = 按正则表达式匹配</span>
            <span>4. 添加正则规则前建议先在线验证，避免写出无效表达式
              <el-link href="https://www.jyshare.com/front-end/854/" target="_blank"
                       type="primary">>>>正则表达式在线测试<<<
              </el-link>
            </span>
            <span>5. 规则改动保存后即时生效，无需刷新页面（正则转小写开关除外，需刷新）</span>
            <span>6. 视频分区（含子分区）按视频 tag 处理，要按分区屏蔽请用「视频tag」规则</span>
            <span>7. 「精确视频tag(组合匹配)」中的组合不能再出现在「视频tag(精确/模糊匹配)」里，反之亦然</span>
            <span>8. 装扮 id / 装扮收藏集 id 只在评论区生效，用评论旁的快捷屏蔽按钮添加最省事</span>
            <span>9. 部分规则需要请求 B 站接口。提示「禁用根据bv号网络请求获取视频信息」时说明接口被风控，
              稍等片刻（或半小时）再关闭该禁用，不要立刻重试</span>
          </gz-space>
        </el-collapse-item>
      </el-collapse>
    </el-card>

    <ruleSetValueDialog/>
    <multipleRuleEditDialog/>
    <addRuleDialog v-model="addRuleDialogVisible" :rule-info="addRuleDialogRuleInfo"/>
  </div>
</template>

<style scoped>
.gz-basic-rule__toolbar :deep(.el-card__body) {
  padding: var(--fluent-spacing-vertical-m) var(--fluent-spacing-horizontal-l);
}

/* 窄面板下自动换行：一行放不下时按钮组整体折到下一行，不挤压下拉框 */
.gz-basic-rule__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--fluent-spacing-horizontal-s);
}

.gz-basic-rule__cascader {
  flex: 1 1 200px;
  min-width: 180px;
}
</style>
