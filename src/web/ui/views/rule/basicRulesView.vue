<script setup lang="ts">
import {ref} from 'vue';
import {eventEmitter} from "../../../core/EventEmitter.ts";
import ruleKeyListData from "../../../config/ruleKeyListData.ts";
import ruleUtil from "../../../core/util/ruleUtil.ts";
import multipleRuleEditDialog from "../../dialogs/multipleRuleEditDialog.vue";
import ruleSetValueDialog from '../../dialogs/ruleSetValueDialog.vue';
import addRuleDialog from '../../components/addRuleDialog.vue'
import ruleInformationView from "./ruleInformationView.vue";
import {ElMessage, ElMessageBox} from 'element-plus';

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
};
const setRuleBut = () => {
  const [model, type] = cascaderVal.value;
  const typeMap = ruleInfoArr.value.find(item => item.type === type);
  if (model === '组合匹配') {
    eventEmitter.send('打开多重规则编辑对话框', typeMap);
    return;
  }
  eventEmitter.send('修改规则对话框', typeMap);
};
const findItemAllBut = () => {
  const [model, type] = cascaderVal.value;
  const typeMap = ruleInfoArr.value.find(item => item.type === type);
  if (model === '组合匹配') {
    eventEmitter.send('打开多重规则编辑对话框', typeMap);
    return;
  }
  eventEmitter.send('event-lookRuleDialog', typeMap);
};
const delAllBut = () => {
  ElMessageBox.confirm('确定要删除所有规则吗？').then(() => {
    for (let x of ruleInfoArr.value) {
      GM_deleteValue(x.type);
    }
    ElMessage.success("删除全部规则成功");
    eventEmitter.send('刷新规则信息', false);
  });
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
const clearItemRuleBut = () => {
  const type = cascaderVal.value[1];
  const find = ruleInfoArr.value.find(item => item.type === type);
  ElMessageBox.confirm(`是要清空${find!.name}的规则内容吗？`, 'tip').then(() => {
    ruleKeyListData.clearKeyItem(type);
    ElMessageBox.alert(`已清空${find!.name}的规则内容`);
  });
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
  <div>
    <el-row>
      <el-col :span="10">
        <el-card shadow="never">
          <template #header>选择规则</template>
          <el-cascader v-model="cascaderVal" :options="cascaderOptions"
                       :props="{ expandTrigger: 'hover' }" filterable
                       show-all-levels style="width: 60%;" @change="handleChangeCascader">
            <template #default="{ node, data }">
              <span>{{ data.label }}</span>
              <span v-if="!node.isLeaf"> ({{ data.children.length }}) </span>
            </template>
          </el-cascader>
          <el-divider/>
          <el-row>
            <el-col :span="12">
              <el-button-group>
                <el-button size="small" @click="batchAddBut">批量添加</el-button>
                <el-button size="small" @click="setRuleBut">修改</el-button>
                <el-button size="small" @click="findItemAllBut">查看项内容</el-button>
                <el-button size="small" @click="delBut">移除</el-button>
              </el-button-group>
            </el-col>
            <el-col :span="12">
              <div class="el-horizontal-right">
                <el-button-group>
                  <el-button type="danger" size="small" @click="clearItemRuleBut">清空项</el-button>
                  <el-button type="danger" size="small" @click="delAllBut">全部移除</el-button>
                </el-button-group>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
      <el-col :span="14">
        <!-- 使用说明默认收起：平铺会挤掉真正需要看的「规则信息」 -->
        <el-card shadow="never">
          <template #header>
            <span>使用说明（点击展开）</span>
          </template>
          <el-collapse>
            <el-collapse-item title="查看使用说明" name="tips">
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
        <ruleInformationView :rule-info-arr="ruleInfoArr"/>
      </el-col>
    </el-row>
    <ruleSetValueDialog/>
    <multipleRuleEditDialog/>
    <addRuleDialog v-model="addRuleDialogVisible" :rule-info="addRuleDialogRuleInfo"/>
  </div>
</template>
