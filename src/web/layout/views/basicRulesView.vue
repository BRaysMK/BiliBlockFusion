<script>
import {eventEmitter} from "../../model/EventEmitter.js";
import ruleKeyListData from "../../data/ruleKeyListData.js";
import ruleUtil from "../../utils/ruleUtil.js";
import multipleRuleEditDialog from "../eventEmitter_components/multipleRuleEditDialog.vue";
import ruleSetValueDialog from '../eventEmitter_components/ruleSetValueDialog.vue';
import ruleInformationView from "./ruleInformationView.vue";

export default {
  components: {ruleInformationView, ruleSetValueDialog, multipleRuleEditDialog},
  data() {
    return {
      cascaderVal: ["精确匹配", "precise_uid"],
      cascaderOptions: ruleKeyListData.getSelectOptions(),
      ruleInfoArr: [],
      // 当前选中类型的规则项列表
      currentItems: [],
      // 分隔符
      separator: ',',
      // 输入值
      inputVal: ''
    }
  },
  computed: {
    selectedType() {
      return this.cascaderVal[1];
    },
    selectedModel() {
      return this.cascaderVal[0];
    }
  },
  methods: {
    loadCurrentItems() {
      this.currentItems = GM_getValue(this.selectedType, []);
    },
    addBut() {
      if (this.selectedModel === '组合匹配') {
        const typeMap = this.ruleInfoArr.find(item => item.type === this.selectedType);
        eventEmitter.send('打开多重规则编辑对话框', typeMap);
        return;
      }
      const fragments = [];
      for (let s of this.inputVal.split(this.separator)) {
        s = s.trim();
        if (s === '' || fragments.includes(s)) continue;
        fragments.push(s);
      }
      if (fragments.length === 0) {
        this.$message.warning('未有分割项，请输入');
        return;
      }
      const {successList, failList} = ruleUtil.batchAddRule(fragments, this.selectedType);
      let msg = `成功添加 ${successList.length} 项`;
      if (failList.length > 0) {
        msg += `，失败 ${failList.length} 项: ${failList.join(', ')}`;
      }
      this.$message.success(msg);
      this.inputVal = '';
      this.loadCurrentItems();
      eventEmitter.send('刷新规则信息');
    },
    removeItem(val) {
      const {status, res} = ruleUtil.delRule(this.selectedType, val);
      if (status) {
        this.$message.success(res);
        this.loadCurrentItems();
        eventEmitter.send('刷新规则信息');
      } else {
        this.$message.warning(res);
      }
    },
    clearType() {
      const typeMap = this.ruleInfoArr.find(item => item.type === this.selectedType);
      this.$confirm(`确定清空【${typeMap ? typeMap.name : this.selectedType}】的规则内容吗？`).then(() => {
        ruleKeyListData.clearKeyItem(this.selectedType);
        this.loadCurrentItems();
        this.$message.success(`已清空`);
        eventEmitter.send('刷新规则信息', false);
      });
    },
    delAll() {
      this.$confirm('确定要删除所有规则吗？此操作不可恢复。').then(() => {
        for (let x of this.ruleInfoArr) {
          GM_deleteValue(x.type);
        }
        this.loadCurrentItems();
        this.$message.success("已删除全部规则");
        eventEmitter.send('刷新规则信息', false);
      });
    }
  },
  watch: {
    selectedType() {
      this.loadCurrentItems();
    }
  },
  created() {
    for (let el of ruleKeyListData.getRuleKeyListData()) {
      this.ruleInfoArr.push({
        type: el.key,
        name: el.name,
      });
    }
    this.loadCurrentItems();
  }
}
</script>

<template>
  <div class="basic-rules-container">
    <el-row :gutter="12">
      <el-col :span="14">
        <el-card shadow="never">
          <template #header>
            <span>编辑规则</span>
          </template>
          <el-cascader v-model="cascaderVal" :options="cascaderOptions"
                       :props="{ expandTrigger: 'hover' }" filterable
                       show-all-levels style="width: 100%;">
          </el-cascader>
          <el-divider/>
          <div style="display:flex; gap:6px; align-items:center; margin-bottom:10px;">
            <el-input v-model="separator" size="small" style="width:55px;"
                      placeholder="分隔符"/>
            <el-input v-model="inputVal" size="small" type="textarea" rows="2"
                      placeholder="多项用分隔符隔开"/>
          </div>
          <div style="display:flex; gap:6px; margin-bottom:10px;">
            <el-button size="small" type="primary" @click="addBut">添加</el-button>
            <el-button size="small" type="danger" @click="clearType">清空此规则</el-button>
            <el-button size="small" type="danger" @click="delAll">删除全部</el-button>
          </div>
          <div v-if="currentItems.length > 0" style="margin-top:8px;">
            <div style="font-size:12px;color:#9499A0;margin-bottom:4px;">
              共 {{ currentItems.length }} 项
            </div>
            <div class="edit-rule-tags-scroll">
              <el-tag v-for="v in currentItems" :key="v"
                      closable size="small"
                      @close="removeItem(v)">
                {{ v }}
              </el-tag>
            </div>
          </div>
          <div v-else style="font-size:12px;color:#9499A0;margin-top:8px;">
            暂无规则项
          </div>
        </el-card>
      </el-col>
      <el-col :span="10">
        <el-card shadow="never">
          <template #header>
            <span>规则信息</span>
          </template>
          <ruleInformationView :rule-info-arr="ruleInfoArr"/>
        </el-card>
      </el-col>
    </el-row>
    <ruleSetValueDialog/>
    <multipleRuleEditDialog/>
  </div>
</template>

<style>
/* ---- basicRulesView ---- */
/* unscoped; wrapper .basic-rules-container for isolation */

/* edit rule tags scroll region */
.edit-rule-tags-scroll {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  max-height: 240px;
  overflow-y: auto;
}

.edit-rule-tags-scroll::-webkit-scrollbar {
  width: 4px;
}

.edit-rule-tags-scroll::-webkit-scrollbar-thumb {
  background: rgba(128, 128, 128, 0.3);
  border-radius: 3px;
}
</style>
