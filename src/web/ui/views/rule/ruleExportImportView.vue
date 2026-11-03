<script setup lang="ts">
import {computed, reactive, ref} from 'vue';
import defUtil, {saveTextAsFile} from "../../../core/util/defUtil.ts";
import ruleUtil from "@/core/util/ruleUtil.ts";
import {eventEmitter} from "@/core/EventEmitter.ts";
import ruleKeyListData from "../../../config/ruleKeyListData.ts";
import {ElMessage, ElMessageBox} from 'element-plus';
import SettingGroup from '../../components/SettingGroup.vue';

/**
 * 规则导入导出
 *
 * 原来三张卡片各有一组导出按钮（基础规则 3 个 + 指定规则 2 个），
 * 同一件事「导出成文件 / 复制到剪贴板 / 打到控制台」散在两处。
 * 现在收敛为：选择范围（全部 / 指定规则）+ 一个导出下拉。
 */
const ruleContentImport = ref("");
const select = reactive({
  val: [] as any[],
  options: [] as any[],
});
const file = ref<HTMLInputElement>();
const showImportHelp = ref(false);

/** 导出全部规则时为 true；否则只导出 select.val 选中的类型 */
const exportAll = computed(() => select.val.length === 0);

const getSelectValRuleContent = () => {
  const val = select.val;
  if (val.length === 0) return false;
  const map: Record<string, any> = {};
  for (const valKey of val) {
    const find = select.options.find(item => item.key === valKey);
    if (find === undefined) continue;
    const {key} = find;
    const ruleItemList = GM_getValue(key, []);
    if (ruleItemList.length === 0) continue;
    map[key] = ruleItemList;
  }
  if (Object.keys(map).length === 0) {
    ElMessage.warning(`选定的规则类型都为空`);
    return false;
  }
  return map;
};

/** 导出内容：全部导出时是「键 → 规则列表」的对象，与导入格式一致 */
const getExportPayload = (): Record<string, unknown> | false => {
  if (exportAll.value) return ruleUtil.getRuleContent(false) as Record<string, unknown>;
  return getSelectValRuleContent();
};

const overwriteImportRulesBut = () => {
  ElMessageBox.confirm('是否要覆盖导入规则？').then(() => {
    const trim = ruleContentImport.value.trim();
    if (ruleUtil.overwriteImportRules(trim)) {
      ElMessageBox.alert('已覆盖导入成功！');
      eventEmitter.send('刷新规则信息');
    }
  });
};
const appendImportRulesBut = () => {
  ElMessageBox.confirm('是否要追加导入规则？').then(() => {
    const trim = ruleContentImport.value.trim();
    if (ruleUtil.appendImportRules(trim)) {
      ElMessage('已追加导入成功！');
      eventEmitter.send('刷新规则信息');
    }
  });
};
const handleFileUpload = (event: any) => {
  defUtil.handleFileReader(event).then(data => {
    const {content} = data;
    try {
      JSON.parse(content);
    } catch (e) {
      ElMessage('文件内容有误');
      return;
    }
    ruleContentImport.value = content;
    ElMessage('读取到内容，请按需覆盖或追加');
  });
};
const inputFIleRuleBut = () => {
  file.value!.click();
};

const exportFileBut = () => {
  const payload = getExportPayload();
  if (payload === false) return;
  ElMessageBox.prompt('请输入文件名', '保存为', {
    inputValue: 'b站屏蔽器规则-' + defUtil.toTimeString()
  }).then(({value}: any) => {
    if (value.trim() === '') {
      ElMessageBox.alert('文件名不能为空');
      return;
    }
    saveTextAsFile(JSON.stringify(payload, null, 4), value.trim() + '.json');
  });
};
const exportClipboardBut = () => {
  const payload = getExportPayload();
  if (payload === false) return;
  navigator.clipboard.writeText(JSON.stringify(payload, null, 4)).then(() => {
    ElMessage.success('已复制到剪贴板');
  }).catch(() => {
    // 油猴沙箱/非安全上下文下 clipboard 可能不可用，退回到输入框
    ruleContentImport.value = JSON.stringify(payload, null, 4);
    ElMessage.warning('剪贴板不可用，已放到下方导入框');
  });
};
const exportConsoleBut = () => {
  const payload = getExportPayload();
  if (payload === false) return;
  console.log(payload);
  ElMessage.info('已导出到控制台，F12 查看');
};
const exportToInputBut = () => {
  const payload = getExportPayload();
  if (payload === false) return;
  ruleContentImport.value = JSON.stringify(payload, null, 4);
  ElMessage('已导出到下方输入框');
};

const exportCommandMap: Record<string, () => void> = {
  file: exportFileBut,
  clipboard: exportClipboardBut,
  input: exportToInputBut,
  console: exportConsoleBut,
};

const handleExportCommand = (command: string): void => {
  exportCommandMap[command]?.();
};

for (const v of ruleKeyListData.getRuleKeyListData()) {
  select.options.push(v);
}
</script>

<template>
  <SettingGroup description="按上面的选择范围导出：不选规则类型即导出全部规则"
                title="导出">
    <div class="gz-export__row">
      <el-select v-model="select.val" class="gz-export__select" clearable filterable multiple
                 placeholder="全部规则（可多选指定类型）">
        <el-option v-for="item in select.options" :key="item.key" :label="item.name" :value="item.key"/>
      </el-select>
      <el-dropdown trigger="click" @command="handleExportCommand">
        <el-button size="small" type="primary">导出</el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="file">下载为 json 文件</el-dropdown-item>
            <el-dropdown-item command="clipboard">复制到剪贴板</el-dropdown-item>
            <el-dropdown-item command="input">放到下方导入框</el-dropdown-item>
            <el-dropdown-item command="console">打印到控制台</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </SettingGroup>

  <SettingGroup description="最外层必须是对象（花括号），格式为 { 规则键: [规则列表] }" title="导入">
    <div class="gz-export__row">
      <el-button size="small" @click="inputFIleRuleBut">读取外部规则文件</el-button>
      <el-button size="small" type="danger" plain @click="overwriteImportRulesBut">覆盖导入</el-button>
      <el-button size="small" type="primary" @click="appendImportRulesBut">追加导入</el-button>
    </div>
    <div class="gz-export__textarea">
      <el-input v-model="ruleContentImport"
                :autosize="{ minRows: 6, maxRows: 16}"
                placeholder="要导入的规则内容（JSON）"
                type="textarea"/>
    </div>
  </SettingGroup>
  <input ref="file" accept="application/json" style="display: none" type="file" @change="handleFileUpload">
</template>

<style scoped>
.gz-export__row {
  display: flex;
  align-items: center;
  gap: var(--fluent-spacing-horizontal-s);
  padding: var(--fluent-spacing-vertical-xs) var(--fluent-spacing-horizontal-s);
}

.gz-export__select {
  flex: 1 1 auto;
  min-width: 0;
}

.gz-export__textarea {
  padding: var(--fluent-spacing-vertical-xs) var(--fluent-spacing-horizontal-s) var(--fluent-spacing-vertical-s);
}
</style>
