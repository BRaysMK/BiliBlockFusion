<script setup lang="ts">
import {computed, ref, watch} from 'vue';
import {ElMessage} from 'element-plus';

const props = withDefaults(defineProps<{
  title?: string;
  switchKey?: string;
  partitionListKey?: string;
}>(), {
  title: '',
  switchKey: '',
  partitionListKey: '',
});

const partition = ref('');
const partitionList = ref<any[]>([]);
const switchVal = ref(false);

const showPartitionList = computed(() => {
  if (partition.value === '') return partitionList.value;
  return partitionList.value.filter(item => item.includes(partition.value));
});

watch(switchVal, (newV) => {
  GM_setValue(props.switchKey as string, newV);
});

const addBut = () => {
  if (partition.value === '') {
    ElMessage.warning('请输入分区名称');
    return;
  }
  if (partitionList.value.some((item: any) => item === partition.value)) {
    ElMessage.warning('该分区已存在');
    return;
  }
  if (partitionList.value.length >= 50) {
    ElMessage.warning('最多添加50个白名单分区，请移除不需要的分区再添加');
    return;
  }
  partitionList.value.push(partition.value);
  partition.value = '';
  save();
};
const delBut = (item: any) => {
  // 这里原本写成 some(...) 为真就提示「不存在」并 return，条件反了：
  // 只要分区在列表里就永远删不掉。改为取反。
  if (!partitionList.value.some((someItem: any) => someItem === item)) {
    ElMessage.warning('该分区不存在');
    return;
  }
  partitionList.value = partitionList.value.filter((v: any) => v !== item);
  save();
};
const save = () => {
  GM_setValue(props.partitionListKey, partitionList.value);
  ElMessage.success(`保存${props.title}配置成功`);
};

partitionList.value = GM_getValue(props.partitionListKey, []);
switchVal.value = GM_getValue(props.switchKey, false);
</script>

<template>
  <div class="gz-whitelist">
    <div class="gz-whitelist__header">
      <span class="gz-whitelist__title">{{ title }}</span>
      <el-switch v-model.lazy="switchVal" active-text="启用" size="small"/>
    </div>
    <div class="gz-whitelist__input">
      <el-input v-model.lazy.trim="partition" clearable placeholder="输入分区名称后添加" size="small"/>
      <el-button size="small" @click="addBut">添加</el-button>
    </div>
    <div class="gz-whitelist__tags">
      <el-popconfirm v-for="item in showPartitionList" :key="item"
                     :title="`是要删除tag【${item}】吗？`"
                     @confirm="delBut(item)">
        <template #reference>
          <el-tag size="small">{{ item }}</el-tag>
        </template>
      </el-popconfirm>
      <span v-if="showPartitionList.length === 0" class="gz-whitelist__empty">还没有分区</span>
    </div>
  </div>
</template>

<style scoped>
.gz-whitelist {
  display: flex;
  flex-direction: column;
  gap: var(--fluent-spacing-vertical-xs);
  padding: var(--fluent-spacing-vertical-s) var(--fluent-spacing-horizontal-s);
  border-radius: var(--fluent-border-radius-medium);
  background: var(--fluent-color-neutral-background-2);
}

.gz-whitelist__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--fluent-spacing-horizontal-s);
}

.gz-whitelist__title {
  font-size: var(--fluent-font-size-base-300);
  color: var(--fluent-color-neutral-foreground-2);
}

.gz-whitelist__input {
  display: flex;
  gap: var(--fluent-spacing-horizontal-xs);
}

.gz-whitelist__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--fluent-spacing-horizontal-xs);
}

.gz-whitelist__empty {
  font-size: var(--fluent-font-size-base-200);
  color: var(--fluent-color-neutral-foreground-4);
}
</style>
