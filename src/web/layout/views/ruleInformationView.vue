<script>
import {eventEmitter} from "../../model/EventEmitter.js";

/**
 * 规则信息组件
 */
export default {
  props: {
    ruleInfoArr: {
      type: Array
    }
  },
  methods: {
    refreshInfo(isTip = true) {
      for (let x of this.ruleInfoArr) {
        x.len = GM_getValue(x.type, []).length;
      }
      if (!isTip) return;
      this.$notify({title: 'tip', message: '刷新规则信息成功', type: 'success'})
    },
    refreshInfoBut() {
      this.refreshInfo()
    },
    lookRuleBut(item) {
      if (item.len === 0) {
        this.$message.warning('当前规则信息为空')
        return;
      }
      const data = GM_getValue(item.type, []);
      eventEmitter.send('展示内容对话框', JSON.stringify(data))
    }
  },
  created() {
    this.refreshInfo(false);
    eventEmitter.on('刷新规则信息', (isTip = true) => {
      this.refreshInfo(isTip);
    })
  }
};
</script>

<template>
  <div>
    <div class="el-horizontal-outside" style="margin-bottom:8px;">
      <span style="font-weight:500;font-size:13px;color:#9499A0;">共 {{ ruleInfoArr.length }} 项</span>
      <el-button size="mini" @click="refreshInfoBut">刷新</el-button>
    </div>
    <div class="rule-info-scroll" style="display: flex;flex-wrap: wrap;gap:4px;">
      <el-button v-for="item in ruleInfoArr" :key="item.name" size="small" @click="lookRuleBut(item)">
        {{ item.name }}
        <el-tag :effect="item.len>0?'dark':'plain'" size="mini">
          {{ item.len }}
        </el-tag>
      </el-button>
    </div>
  </div>
</template>

<style scoped>
.rule-info-scroll {
  max-height: 280px;
  overflow-y: auto;
  align-content: flex-start;
}
.rule-info-scroll::-webkit-scrollbar {
  width: 4px;
}
.rule-info-scroll::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 3px;
}
</style>
