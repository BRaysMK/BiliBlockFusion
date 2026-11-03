<script setup lang="ts">
import {ref, watch} from 'vue';
import {getExcludeURLsGm, isExcludeURLSwitchGm} from "@/state/localMKData.ts";
import {ElMessage} from 'element-plus';
import SettingRow from '../../components/SettingRow.vue';
import SettingGroup from '../../components/SettingGroup.vue';

const excludeURLSwitchVal = ref(isExcludeURLSwitchGm());
const data = ref(getExcludeURLsGm());
const testInputRegVal = ref("");
const testInputVal = ref('');

const tableAddItemBut = () => {
  data.value.push({state: false, regularURL: "", desc: ""});
};
const tableDelItemBut = (index: number) => {
  data.value.splice(index, 1);
};
const refreshBut = () => {
  data.value = getExcludeURLsGm();
  ElMessage.success("刷新成功");
};
const saveBut = () => {
  for (let v of data.value) {
    if (v.regularURL === "") {
      ElMessage.error("正则地址不能为空");
      return;
    }
  }
  GM_setValue("exclude_urls_gm", data.value);
  ElMessage.success("保存成功");
};
const tableVerificationItemUrlBut = (url: string) => {
  if (window.location.href.search(url) !== -1) {
    ElMessage.success('匹配成功！');
  } else {
    ElMessage.warning('匹配失败！');
  }
};
const testVerificationBut = () => {
  const inputVal = testInputVal.value;
  const inputRegVal = testInputRegVal.value;
  if (inputVal.length === 0 || inputRegVal.length === 0) {
    ElMessage.warning('请正确填写内容');
    return;
  }
  if (inputVal.search(inputRegVal) !== -1) {
    ElMessage.success('匹配成功！');
  } else {
    ElMessage.warning('匹配失败！');
  }
};

watch(excludeURLSwitchVal, (n) => {
  GM_setValue("is_exclude_url_switch_gm", n);
});
</script>

<template>
  <SettingGroup description="被排除的页面里本脚本大部分功能会失效，改动后建议刷新页面" title="排除页面">
    <SettingRow label="启用排除设置">
      <el-switch v-model="excludeURLSwitchVal" size="small"/>
    </SettingRow>
    <SettingRow stacked>
      <div class="gz-exclude__test">
        <el-input v-model.trim="testInputRegVal" placeholder="正则地址" size="small"/>
        <el-input v-model.trim="testInputVal" placeholder="测试地址" size="small"/>
        <el-button size="small" @click="testVerificationBut">测试验证</el-button>
      </div>
    </SettingRow>
  </SettingGroup>

  <SettingGroup title="排除规则">
    <el-table :data="data" border size="small">
      <el-table-column label="启用" width="56">
        <template #default="scope">
          <el-switch v-model="scope.row.state" size="small"/>
        </template>
      </el-table-column>
      <el-table-column label="正则地址">
        <template #default="scope">
          <el-input v-model.trim="scope.row.regularURL" size="small"/>
        </template>
      </el-table-column>
      <el-table-column label="描述" width="120">
        <template #default="scope">
          <el-input v-model.trim="scope.row.desc" size="small"/>
        </template>
      </el-table-column>
      <el-table-column align="center" width="132">
        <template #header>
          <el-button size="small" @click="tableAddItemBut">添加</el-button>
          <el-button size="small" @click="refreshBut">刷新</el-button>
          <el-button size="small" type="success" @click="saveBut">保存</el-button>
        </template>
        <template #default="scope">
          <div class="gz-exclude__row-buttons">
            <el-button size="small" title="以当前网页地址验证匹配结果"
                       @click="tableVerificationItemUrlBut(scope.row.regularURL)">验证</el-button>
            <el-button size="small" type="danger" @click="tableDelItemBut(scope.$index)">删除</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>
  </SettingGroup>
</template>

<style scoped>
.gz-exclude__test {
  display: flex;
  align-items: center;
  gap: var(--fluent-spacing-horizontal-xs);
}

.gz-exclude__row-buttons {
  display: flex;
  gap: var(--fluent-spacing-horizontal-xs);
}

/* 表格操作列里的按钮自带外边距，会把 132px 撑破 */
.gz-exclude__row-buttons :deep(.el-button + .el-button) {
  margin-left: 0;
}
</style>
