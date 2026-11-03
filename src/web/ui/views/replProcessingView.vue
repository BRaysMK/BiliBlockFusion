<script setup lang="ts">
import {ref, watch} from 'vue';
import {
  enableReplacementProcessing,
  getSubstituteWordsArr,
  isClearCommentEmoticons,
  isReplaceCommentSearchTerms
} from "@/state/localMKData.ts";
import {ElMessage, ElMessageBox, ElNotification} from 'element-plus';
import SettingRow from '../components/SettingRow.vue';
import SettingGroup from '../components/SettingGroup.vue';

/**
 * 内容替换处理布局组件
 */
const tableData = ref<any[]>(getSubstituteWordsArr());
const enableReplacementProcessingVal = ref(enableReplacementProcessing());
const clearCommentEmoticonsVal = ref(isClearCommentEmoticons());
const isReplaceCommentSearchTermsVal = ref(isReplaceCommentSearchTerms());
const showHelp = ref(false);

//验证
const validate = (item: any) => {
  if (item.actionScopes.length === 0) {
    ElMessage.error('请选择作用域再后续处理');
    return;
  }
  if (item.findVal === '') {
    ElMessage.error('请输入查找内容再后续处理');
    return;
  }
  return true;
};
const verifyDuplicate = (val: any) => {
  if (val === '') return;
  const set = new Set();
  for (const v of tableData.value) {
    if (set.has(v.findVal)) {
      ElMessageBox.alert(`已添加过该查找值，不可重复添加【${v.findVal}】`, '错误', {
        type: 'error'
      });
      return;
    }
    set.add(v.findVal);
  }
};
const addBut = () => {
  tableData.value.unshift({
    actionScopes: ['评论内容'],
    findVal: '',
    replaceVal: ''
  });
  ElNotification({title: '', message: '已添加一条替换处理到顶部'});
};
const delItemBut = (row: any, index: number) => {
  if (row.findVal === '' && row.replaceVal === '') {
    tableData.value.splice(index, 1);
    ElNotification({title: '', message: '已删除一条替换处理'});
    return;
  }
  if (validate(row) !== true) return;
  ElMessageBox.confirm('确定删除该条替换处理吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    tableData.value.splice(index, 1);
    ElNotification({title: '', message: '已删除一条替换处理'});
  });
};
const refreshBut = () => {
  tableData.value = getSubstituteWordsArr();
  ElMessage.info('已刷新');
};
const saveBut = () => {
  if (tableData.value.length === 0) {
    ElMessage.error('请先添加数据再保存！');
    return;
  }
  for (let item of tableData.value) {
    if (validate(item) !== true) return;
  }
  const duplicateRemoval = new Set();
  for (const v of tableData.value) {
    if (duplicateRemoval.has(v.findVal)) {
      ElMessageBox.alert(`查找内容不能重复【${v.findVal}】`, '错误', {
        type: 'error'
      });
      return;
    }
    duplicateRemoval.add(v.findVal);
  }
  GM_setValue('substitute_words', tableData.value);
  ElMessage.success('已保存');
};
const actionScopesChange = (newArr: any) => {
  if (newArr.length === 0) return;
  if (newArr.some((v: any) => v === '评论表情')) {
    newArr.splice(0, newArr.length, '评论表情');
  }
};

watch(enableReplacementProcessingVal, (n) => {
  GM_setValue('enable_replacement_processing', n);
});
watch(clearCommentEmoticonsVal, (n) => {
  GM_setValue('is_clear_comment_emoticons', n);
});
watch(isReplaceCommentSearchTermsVal, (n) => {
  GM_setValue('is_replace_comment_search_terms', n);
});
</script>

<template>
  <SettingGroup title="全局开关">
    <SettingRow description="关闭后下方表格中的所有替换规则都不生效" label="启用替换处理">
      <el-switch v-model="enableReplacementProcessingVal" size="small"/>
    </SettingRow>
    <SettingRow description="移除评论里的表情图片" label="清除评论表情">
      <el-switch v-model="clearCommentEmoticonsVal" size="small"/>
    </SettingRow>
    <SettingRow description="把评论中蓝色关键词（带搜索小图标）替换成普通文本" label="替换评论搜索词">
      <el-switch v-model="isReplaceCommentSearchTermsVal" size="small"/>
    </SettingRow>
  </SettingGroup>

  <SettingGroup>
    <div class="gz-repl__toolbar">
      <button class="gz-repl__help-toggle" type="button" @click="showHelp = !showHelp">
        {{ showHelp ? '收起说明' : '使用说明' }}
      </button>
      <div class="gz-repl__actions">
        <el-button size="small" @click="addBut">添加</el-button>
        <el-button size="small" @click="refreshBut">刷新</el-button>
        <el-button size="small" type="primary" @click="saveBut">保存</el-button>
      </div>
    </div>
    <ul v-if="showHelp" class="gz-repl__help">
      <li>评论内容暂不支持替换表情，暂不支持标题替换</li>
      <li>修改或添加数据后需点「保存」才生效</li>
      <li>支持正则替换，
        <el-link href="https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/String/replaceAll"
                 target="_blank" type="primary">
          参考 replaceAll 用法
        </el-link>
      </li>
      <li>操作评论表情时，作用域需先取消其他选项</li>
      <li>评论表情：查找内容用英文 <code>[]</code> 包裹表情关键词，替换留空表示移除该表情
        <el-link href="https://docs.qq.com/doc/DSlJNR1NVcGR3eEto" target="_blank" type="primary">表情包对照表</el-link>
      </li>
    </ul>
    <!-- 每条规则是「作用域 / 查找 / 替换」三组控件，横向排在一行至少需要 600px，
         452px 的内容区放不下。改成每条一张纵向卡片，字段各自独占整行。 -->
    <div v-if="tableData.length === 0" class="gz-repl__empty">还没有替换规则，点上方「添加」新增一条</div>
    <div v-for="(row, index) in tableData" :key="index" class="gz-repl__item">
      <div class="gz-repl__item-header">
        <el-checkbox-group v-model="row.actionScopes" size="small" @change="actionScopesChange">
          <el-checkbox border disabled value="视频标题">视频标题</el-checkbox>
          <el-checkbox border value="评论内容">评论内容</el-checkbox>
          <el-checkbox border value="评论表情">评论表情</el-checkbox>
        </el-checkbox-group>
        <el-button size="small" type="danger" plain @click="delItemBut(row, index)">删除</el-button>
      </div>
      <div class="gz-repl__item-fields">
        <el-input v-model="row.findVal" clearable maxlength="10" placeholder="查找内容" size="small"
                  @change="verifyDuplicate"/>
        <span class="gz-repl__arrow">→</span>
        <el-input v-model="row.replaceVal" clearable maxlength="10" placeholder="替换为（留空即删除）" size="small"/>
      </div>
    </div>
  </SettingGroup>
</template>

<style scoped>
.gz-repl__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--fluent-spacing-vertical-xs) var(--fluent-spacing-horizontal-s);
}

.gz-repl__actions {
  display: flex;
  gap: var(--fluent-spacing-horizontal-xs);
}

.gz-repl__help-toggle {
  padding: 0;
  border: none;
  background: none;
  font-size: var(--fluent-font-size-base-200);
  color: var(--fluent-color-brand-foreground-1);
  cursor: pointer;
}

.gz-repl__help {
  margin: 0;
  padding: 0 var(--fluent-spacing-horizontal-s) var(--fluent-spacing-vertical-s) var(--fluent-spacing-horizontal-l);
  font-size: var(--fluent-font-size-base-200);
  line-height: 1.7;
  color: var(--fluent-color-neutral-foreground-3);
}

.gz-repl__item {
  margin: 0 var(--fluent-spacing-horizontal-s) var(--fluent-spacing-vertical-s);
  padding: var(--fluent-spacing-vertical-s);
  border: var(--fluent-stroke-width-thin) solid var(--fluent-color-neutral-stroke-2);
  border-radius: var(--fluent-border-radius-medium);
}

.gz-repl__item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--fluent-spacing-horizontal-s);
  margin-bottom: var(--fluent-spacing-vertical-xs);
  flex-wrap: wrap;
}

.gz-repl__item-fields {
  display: flex;
  align-items: center;
  gap: var(--fluent-spacing-horizontal-xs);
}

.gz-repl__arrow {
  color: var(--fluent-color-neutral-foreground-4);
}

.gz-repl__empty {
  padding: var(--fluent-spacing-vertical-m) var(--fluent-spacing-horizontal-s);
  font-size: var(--fluent-font-size-base-200);
  color: var(--fluent-color-neutral-foreground-4);
}
</style>
