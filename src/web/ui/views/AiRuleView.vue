<script setup lang="ts">
/**
 * AI 规则页
 *
 * 把「写规则」这件事外包给用户自己选的 AI：
 * 填一句需求 → 复制一段自带完整上下文的 Prompt → 喂给 AI → 把返回的 JSON 粘回来。
 * 面板不接任何在线服务、不存 API Key，只负责生成 Prompt 和校验回填内容。
 */
import {computed, ref} from 'vue';
import {ElMessage, ElMessageBox, ElNotification} from 'element-plus';
import aiRuleUtil from '@/core/util/aiRuleUtil.ts';
import {copyText} from '@/core/util/clipboardUtil.ts';
import defUtil, {saveTextAsFile} from '@/core/util/defUtil.ts';
import {eventEmitter} from '@/core/EventEmitter.ts';
import type {AiRuleChange, AiRulePlan} from '@/types/aiRule.ts';

const requirement = ref('');
const includeCurrent = ref(true);
const promptPreview = ref('');
const showPromptPreview = ref(false);

const pasteContent = ref('');
const plan = ref<AiRulePlan | null>(null);
const applied = ref(0);

const overwriteContent = ref('');

const fileInput = ref<HTMLInputElement>();

const lastBackup = ref(aiRuleUtil.getLastBackup());

const backupText = computed(() => {
    const backup = lastBackup.value;
    if (backup === null) return '';
    const time = new Date(backup.at);
    const valid = !Number.isNaN(time.getTime());
    return `${valid ? time.toLocaleString() : backup.at} 应用了 ${backup.changes.length} 项`;
});

/** 变更值展示：数组过长时截断，避免一条规则把表格撑爆 */
const displayValue = (value: unknown): string => {
    if (value === undefined) return '—';
    const text = JSON.stringify(value);
    if (text === undefined) return String(value);
    return text.length > 120 ? text.slice(0, 117) + '…' : text;
};

const changeCount = computed(() => {
    if (plan.value === null) return {add: 0, remove: 0, overwrite: 0, set: 0, effective: 0};
    const result = {add: 0, remove: 0, overwrite: 0, set: 0, effective: 0};
    for (const change of plan.value.changes) {
        if (change.action === '新增') result.add++;
        else if (change.action === '移除') result.remove++;
        else if (change.action === '覆盖') result.overwrite++;
        else result.set++;
        if (change.effective) result.effective++;
    }
    return result;
});

const buildCurrentPrompt = (): string => aiRuleUtil.buildPrompt({
    includeCurrent: includeCurrent.value,
    requirement: requirement.value,
});

const copyPromptBut = async (): Promise<void> => {
    const prompt = buildCurrentPrompt();
    if (await copyText(prompt)) {
        ElNotification({
            title: '',
            message: 'Prompt 已复制，粘到你常用的 AI 对话框即可',
            type: 'success',
            position: 'bottom-right'
        });
        return;
    }
    // 复制被浏览器拦截时退回到预览，让用户手动全选复制
    promptPreview.value = prompt;
    showPromptPreview.value = true;
    ElMessage.warning('自动复制被浏览器拦截，已在下方展开 Prompt，请手动全选复制');
};

const downloadPromptBut = (): void => {
    saveTextAsFile(buildCurrentPrompt(), `B站屏蔽增强器-AI规则Prompt-${defUtil.toTimeString()}.txt`);
};

const previewPromptBut = (): void => {
    promptPreview.value = buildCurrentPrompt();
    showPromptPreview.value = !showPromptPreview.value;
};

/** 校验并生成预览；有错误时保留预览表让用户看到具体哪一项不对 */
const validateBut = (): void => {
    if (pasteContent.value.trim() === '') {
        ElMessage.warning('请先粘贴 AI 返回的内容');
        return;
    }
    const parsed = aiRuleUtil.parsePayload(pasteContent.value);
    if (!parsed.ok || parsed.payload === undefined) {
        plan.value = {changes: [], errors: parsed.errors, warnings: [], needsReload: false};
        return;
    }
    plan.value = aiRuleUtil.buildPlan(parsed.payload);
};

const applyBut = async (): Promise<void> => {
    const current = plan.value;
    if (current === null) return;
    if (current.errors.length > 0) {
        ElMessage.warning('还有错误项未处理，无法应用');
        return;
    }
    if (current.changes.filter(change => change.effective).length === 0) {
        ElMessage.info('没有需要应用的改动');
        return;
    }
    try {
        await ElMessageBox.confirm(
            `将应用 ${changeCount.value.effective} 项改动，是否继续？`,
            '确认应用',
            {confirmButtonText: '应用', cancelButtonText: '取消', type: 'warning'}
        );
    } catch {
        return;
    }

    const result = aiRuleUtil.applyPlan(current);
    applied.value = result.applied;
    lastBackup.value = aiRuleUtil.getLastBackup();
    plan.value = null;
    pasteContent.value = '';

    // 规则信息页与各页面的屏蔽结果都需要跟着刷新
    eventEmitter.send('刷新规则信息');
    eventEmitter.send('通知屏蔽');

    ElNotification({
        title: '',
        message: result.needsReload
            ? `已应用 ${result.applied} 项改动，部分设置需刷新页面才完全生效`
            : `已应用 ${result.applied} 项改动`,
        type: 'success',
        position: 'bottom-right'
    });
};

const cancelPlanBut = (): void => {
    plan.value = null;
};

const clearPasteBut = (): void => {
    pasteContent.value = '';
    plan.value = null;
};

const readFileBut = (): void => {
    fileInput.value?.click();
};

const onFileChange = (event: Event): void => {
    defUtil.handleFileReader(event).then(data => {
        pasteContent.value = data.content;
        plan.value = null;
        ElMessage.success('已读取文件内容，请点击「校验并预览」');
    }).catch(() => {
        ElMessage.error('读取文件失败');
    });
    // 同一个文件连续选两次也要触发 change
    (event.target as HTMLInputElement).value = '';
};

const undoBut = async (): Promise<void> => {
    try {
        await ElMessageBox.confirm('将把上次应用的改动全部还原，是否继续？', '撤销上次应用', {
            confirmButtonText: '撤销',
            cancelButtonText: '取消',
            type: 'warning'
        });
    } catch {
        return;
    }
    if (!aiRuleUtil.undoLastApply()) {
        ElMessage.warning('没有可撤销的记录');
        return;
    }
    lastBackup.value = null;
    eventEmitter.send('刷新规则信息');
    eventEmitter.send('通知屏蔽');
    ElNotification({title: '', message: '已撤销上次应用', type: 'success', position: 'bottom-right'});
};

/** 整表覆盖：接受旧导出格式 {key: [...]}，先走同一套校验再预览 */
const overwritePreviewBut = (): void => {
    if (overwriteContent.value.trim() === '') {
        ElMessage.warning('请先粘贴要覆盖的规则内容');
        return;
    }
    plan.value = aiRuleUtil.buildOverwritePlan(overwriteContent.value);
};

const changeRowClass = (change: AiRuleChange): string => change.effective ? '' : 'ai-rule-row--noop';

/** Element Plus 的 row-class-name 回调签名：({row, rowIndex}) => string */
const rowClassName = ({row}: { row: AiRuleChange }): string => changeRowClass(row);
</script>

<template>
  <div class="ai-rule-view">
    <el-card shadow="never">
      <template #header>
        <span>① 告诉 AI 你要什么，然后复制 Prompt</span>
      </template>
      <el-input
          v-model="requirement"
          :autosize="{minRows: 2, maxRows: 6}"
          placeholder="用一句话描述需求，例如：屏蔽标题里带「搬运」的视频，另外把 uid 12345 和 67890 拉黑"
          type="textarea"/>
      <div class="ai-rule-actions">
        <el-checkbox v-model="includeCurrent">包含我当前的规则与设置（AI 能判断哪些已存在）</el-checkbox>
        <div>
          <el-button type="primary" @click="copyPromptBut">复制 Prompt</el-button>
          <el-button @click="downloadPromptBut">下载 .txt</el-button>
          <el-button text @click="previewPromptBut">
            {{ showPromptPreview ? '收起预览' : '预览 Prompt' }}
          </el-button>
        </div>
      </div>
      <div class="ai-rule-tip">
        复制后粘到任意 AI 对话框（网页版、手机 App 都行）。Prompt 里已经包含全部规则清单、输出格式和约束，
        不需要你另外解释。
      </div>
      <el-input
          v-if="showPromptPreview"
          :model-value="promptPreview"
          :autosize="{minRows: 12, maxRows: 30}"
          readonly
          type="textarea"/>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <span>② 把 AI 返回的内容粘回来</span>
      </template>
      <el-input
          v-model="pasteContent"
          :autosize="{minRows: 10, maxRows: 40}"
          placeholder="把 AI 回复的整个 json 代码块粘到这里。代码块前后的说明文字可以保留，会自动识别"
          type="textarea"/>
      <div class="ai-rule-actions">
        <el-button @click="readFileBut">读取文件</el-button>
        <el-button @click="clearPasteBut">清空</el-button>
        <el-button type="primary" @click="validateBut">校验并预览</el-button>
      </div>
      <input ref="fileInput" accept=".json,.txt,application/json,text/plain"
             style="display: none" type="file" @change="onFileChange">
    </el-card>

    <el-card v-if="plan !== null" shadow="never">
      <template #header>
        <span>③ 预览与应用</span>
      </template>

      <el-alert v-if="plan.errors.length > 0" :closable="false" type="error" show-icon>
        <template #title>以下内容有误，修正后才能应用</template>
        <ul class="ai-rule-issues">
          <li v-for="error in plan.errors" :key="error">{{ error }}</li>
        </ul>
      </el-alert>
      <el-alert v-if="plan.warnings.length > 0" :closable="false" type="warning" show-icon>
        <template #title>以下内容已自动修正，请确认是否符合预期</template>
        <ul class="ai-rule-issues">
          <li v-for="warning in plan.warnings" :key="warning">{{ warning }}</li>
        </ul>
      </el-alert>

      <div v-if="plan.changes.length > 0" class="ai-rule-summary">
        新增 {{ changeCount.add }} 项 / 移除 {{ changeCount.remove }} 项 /
        覆盖 {{ changeCount.overwrite }} 项 / 设置 {{ changeCount.set }} 项，
        实际会写入 {{ changeCount.effective }} 项
      </div>
      <el-table v-if="plan.changes.length > 0" :data="plan.changes" :row-class-name="rowClassName"
                border max-height="360">
        <el-table-column label="操作" width="80">
          <template #default="{row}">{{ row.action }}</template>
        </el-table-column>
        <el-table-column label="配置项" width="220">
          <template #default="{row}">
            <div>{{ row.label }}</div>
            <div class="ai-rule-key">{{ row.key }}</div>
          </template>
        </el-table-column>
        <el-table-column label="变更前">
          <template #default="{row}">{{ displayValue(row.before) }}</template>
        </el-table-column>
        <el-table-column label="变更后">
          <template #default="{row}">{{ displayValue(row.after) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{row}">
            <el-tag v-if="row.effective" size="small" type="success">将改动</el-tag>
            <el-tag v-else size="small" type="info">无变化</el-tag>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-else-if="plan.errors.length === 0" description="没有需要应用的改动"/>

      <div class="ai-rule-actions">
        <el-button :disabled="plan.errors.length > 0 || changeCount.effective === 0" type="primary" @click="applyBut">
          应用改动
        </el-button>
        <el-button @click="cancelPlanBut">取消</el-button>
      </div>
    </el-card>

    <el-card v-if="lastBackup !== null" shadow="never">
      <template #header>
        <span>④ 上次应用</span>
      </template>
      <div class="ai-rule-actions">
        <span>{{ backupText }}</span>
        <el-button type="warning" @click="undoBut">撤销上次应用</el-button>
      </div>
    </el-card>

    <el-collapse>
      <el-collapse-item title="高级：整表覆盖（用完整规则表替换，适合从别处搬配置或恢复备份）" name="overwrite">
        <div class="ai-rule-tip">
          接受导出功能生成的格式：最外层是对象，key 为规则键，value 为规则列表。
          只会覆盖内容里出现的键，没提到的规则保持不变。这里不做智能校验以外的推断，
          提交前同样会显示预览。
        </div>
        <el-input
            v-model="overwriteContent"
            :autosize="{minRows: 8, maxRows: 30}"
            placeholder='例如 {"title":["搬运"],"precise_uid":[12345]}'
            type="textarea"/>
        <div class="ai-rule-actions">
          <el-button @click="overwritePreviewBut">校验并预览</el-button>
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<style scoped>
.ai-rule-view {
  display: flex;
  flex-direction: column;
  gap: var(--fluent-spacing-vertical-m, 12px);
}

.ai-rule-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--fluent-spacing-horizontal-s, 8px);
  margin-top: var(--fluent-spacing-vertical-s, 8px);
}

.ai-rule-tip {
  margin: var(--fluent-spacing-vertical-s, 8px) 0;
  color: var(--fluent-color-neutral-foreground-3);
  font-size: var(--fluent-font-size-base-200, 12px);
  line-height: 1.6;
}

.ai-rule-summary {
  margin: var(--fluent-spacing-vertical-s, 8px) 0;
  font-weight: var(--fluent-font-weight-semibold, 600);
}

.ai-rule-key {
  color: var(--fluent-color-neutral-foreground-3);
  font-family: var(--fluent-font-family-monospace, monospace);
  font-size: var(--fluent-font-size-base-100, 11px);
}

.ai-rule-issues {
  margin: 0;
  padding-left: 18px;
  line-height: 1.7;
}

:deep(.ai-rule-row--noop) {
  color: var(--fluent-color-neutral-foreground-3);
}
</style>
