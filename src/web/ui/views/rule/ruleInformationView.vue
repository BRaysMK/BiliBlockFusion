<script setup lang="ts">
import {computed, ref} from 'vue';
import {eventEmitter} from "@/core/EventEmitter.ts";
import {ElMessage, ElNotification} from 'element-plus';
import {filterRuleGroups, groupRuleKeyList, type RuleGroup} from "@/core/util/ruleGroupUtil.ts";
import ruleKeyListData from "@/config/ruleKeyListData.ts";
import ruleUtil from "@/core/util/ruleUtil.ts";
import type {ContentEditContext} from "@/types/contentViewer.ts";

/**
 * 规则信息组件
 *
 * 44 个规则键里大多数只是匹配方式不同（用户名/视频tag/动态话题tag…），
 * 平铺渲染时每条都要重复一遍实体名并各占一行，卡片高达 1200px 且扫不出重点。
 * 这里按实体归组，匹配方式做成紧凑标签，只保留真正有内容的项作为默认视图。
 */
const props = withDefaults(defineProps<{
  ruleInfoArr?: any[]
}>(), {
  ruleInfoArr: () => []
});

/** 关键词：匹配实体名或任一原始名称 */
const keyword = ref('');
/** 只显示已有规则的项：默认开启，让空白配置不再占版面 */
const onlyNonEmpty = ref(true);

/** GM 值里存的数量，键为规则键 */
const counts = ref<Record<string, number>>({});

const refreshInfo = (isTip = true) => {
  const next: Record<string, number> = {};
  for (const x of props.ruleInfoArr as any[]) {
    // Vue3 Proxy 响应式：直接赋值即可（无需 $set）
    const len = GM_getValue(x.type, []).length;
    next[x.type] = len;
    x.len = len;
  }
  counts.value = next;
  if (!isTip) return;
  ElNotification({title: 'tip', message: '刷新规则信息成功', type: 'success'});
};
const refreshInfoBut = () => {
  refreshInfo();
};

/** 组内数量合计 */
const groupTotal = (group: RuleGroup): number =>
    group.entries.reduce((sum, entry) => sum + (counts.value[entry.key] ?? 0), 0);

const groups = computed(() => groupRuleKeyList(ruleKeyListData.getRuleKeyListData()));

/** 过滤后的展示列表：关键词 + 「只看有内容」两层筛选 */
const visibleGroups = computed(() => {
  const matched = filterRuleGroups(groups.value, keyword.value);
  if (!onlyNonEmpty.value) return matched;
  return matched.filter(group => groupTotal(group) > 0);
});

/** 启用的实体数 / 总数（标题栏摘要） */
const enabledGroupCount = computed(() => groups.value.filter(group => groupTotal(group) > 0).length);

/** 已配置条数合计 */
const totalCount = computed(() =>
    Object.values(counts.value).reduce((sum, len) => sum + len, 0));

/** 规则键的取值形态：决定抽屉里怎么校验编辑结果 */
const describeEntry = (entryKey: string): ContentEditContext => {
  const item = ruleKeyListData.getRuleKeyListData().find((rule) => rule.key === entryKey);
  return {
    ruleKey: entryKey,
    ruleName: item?.name ?? entryKey,
    integer: ruleUtil.isRuleIntType(entryKey),
    combination: (item?.name ?? '').includes('(组合匹配)'),
  };
};

const lookRuleBut = (entryKey: string): void => {
  // 空规则也允许打开：编辑态里可以直接填内容并保存，比先去别处添加再回来更顺
  const data = GM_getValue(entryKey, []);
  eventEmitter.send('展示内容对话框', JSON.stringify(data), describeEntry(entryKey));
};

refreshInfo(false);
eventEmitter.on('刷新规则信息', (isTip = true) => {
  refreshInfo(isTip);
});
</script>

<template>
  <el-card shadow="never">
    <template #header>
      <div class="gz-rule-info__toolbar">
        <span class="gz-rule-info__title">基础规则信息</span>
        <div class="gz-rule-info__actions">
          <el-input v-model="keyword" size="small" clearable placeholder="搜索规则"
                    class="gz-rule-info__search"/>
          <el-checkbox v-model="onlyNonEmpty" size="small">只看有内容</el-checkbox>
          <el-button size="small" @click="refreshInfoBut">刷新</el-button>
        </div>
      </div>
    </template>

    <div class="gz-rule-info__summary">
      {{ enabledGroupCount }}/{{ groups.length }} 项已启用 · 共 {{ totalCount }} 条
    </div>

    <div v-if="visibleGroups.length === 0" class="gz-rule-info__empty">
      {{ keyword === '' ? '还没有配置任何规则' : `没有匹配「${keyword}」的规则` }}
    </div>

    <div class="gz-rule-info__list">
      <div v-for="group in visibleGroups" :key="group.name" class="gz-rule-info__row">
        <div class="gz-rule-info__name" :title="group.name">{{ group.name }}</div>
        <div class="gz-rule-info__modes">
          <button v-for="entry in group.entries"
                  :key="entry.key"
                  type="button"
                  class="gz-rule-info__chip"
                  :class="{'gz-rule-info__chip--on': (counts[entry.key] ?? 0) > 0}"
                  :title="`${entry.label}：${counts[entry.key] ?? 0} 条（点击查看或修改）`"
                  @click="lookRuleBut(entry.key)">
            <span class="gz-rule-info__mode">{{ entry.mode }}</span>
            <span class="gz-rule-info__count">{{ counts[entry.key] ?? 0 }}</span>
          </button>
        </div>
      </div>
    </div>
  </el-card>
</template>

<style scoped>
/* 标题与操作区同排：标题不换行，操作区超宽时整体折行，避免把标题挤成两行 */
.gz-rule-info__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--fluent-spacing-horizontal-s);
}

.gz-rule-info__title {
  white-space: nowrap;
}

.gz-rule-info__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--fluent-spacing-horizontal-s);
}

.gz-rule-info__search {
  width: 132px;
}

/* 摘要单独一行放在列表上方，弱化处理，不抢列表 */
.gz-rule-info__summary {
  margin-bottom: var(--fluent-spacing-vertical-xs);
  font-size: var(--fluent-font-size-base-200);
  color: var(--fluent-color-neutral-foreground-3);
}

.gz-rule-info__empty {
  padding: var(--fluent-spacing-vertical-l) 0;
  color: var(--fluent-color-neutral-foreground-3);
  font-size: var(--fluent-font-size-base-300);
}

.gz-rule-info__list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* 实体名定宽，右侧匹配方式对齐成一列，纵向扫读时不用来回找 */
.gz-rule-info__row {
  display: flex;
  align-items: center;
  gap: var(--fluent-spacing-horizontal-m);
  min-height: 30px;
  padding: 0 var(--fluent-spacing-horizontal-s);
  border-radius: var(--fluent-border-radius-medium);
}

.gz-rule-info__row:hover {
  background: var(--fluent-color-neutral-background-2);
}

.gz-rule-info__name {
  flex: 0 0 116px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--fluent-font-size-base-300);
  color: var(--fluent-color-neutral-foreground-2);
}

.gz-rule-info__modes {
  display: flex;
  flex-wrap: wrap;
  gap: var(--fluent-spacing-horizontal-xs);
}

/* 胶囊：数量为 0 时整体弱化，有内容才用品牌色，一眼看出哪些规则在生效 */
.gz-rule-info__chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 1px 8px;
  border: var(--fluent-stroke-width-thin) solid var(--fluent-color-neutral-stroke-2);
  border-radius: var(--fluent-border-radius-circular);
  background: var(--fluent-color-neutral-background-1);
  color: var(--fluent-color-neutral-foreground-4);
  font-family: inherit;
  font-size: var(--fluent-font-size-base-200);
  line-height: 20px;
  cursor: pointer;
  transition: background-color var(--fluent-duration-fast) var(--fluent-curve-easy-ease),
              border-color var(--fluent-duration-fast) var(--fluent-curve-easy-ease),
              color var(--fluent-duration-fast) var(--fluent-curve-easy-ease);
}

.gz-rule-info__chip:hover {
  border-color: var(--fluent-color-neutral-stroke-1);
  color: var(--fluent-color-neutral-foreground-2);
}

.gz-rule-info__chip--on {
  border-color: var(--fluent-color-brand-stroke-1);
  background: var(--fluent-color-brand-background-2);
  color: var(--fluent-color-brand-foreground-1);
}

.gz-rule-info__chip--on:hover {
  color: var(--fluent-color-brand-foreground-1);
  border-color: var(--fluent-color-brand-background);
}

.gz-rule-info__count {
  font-variant-numeric: tabular-nums;
  font-weight: var(--fluent-font-weight-semibold);
}
</style>
