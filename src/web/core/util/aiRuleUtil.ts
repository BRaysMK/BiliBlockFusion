import ruleKeyListData from "../../config/ruleKeyListData.ts";
import {AI_RULE_DESCRIPTIONS, AI_SETTING_SPECS, resolveRuleValueType} from "../../config/aiRuleSettingSpec.ts";
import type {
    AiRuleBackup,
    AiRuleChange,
    AiRulePayload,
    AiRulePlan,
    AiRuleValueType,
    AiSettingSpec
} from "../../types/aiRule.ts";

/**
 * AI 规则接口的核心逻辑
 *
 * 拆成纯函数（不碰 DOM、不弹窗）以便单测：生成 Prompt、导出当前配置、
 * 解析 AI 回填内容、校验求差、应用与撤销。
 */

const BACKUP_KEY = 'ai_rule_last_backup';
const PAYLOAD_VERSION = 1;

interface RuleKeyEntry {
    key: string;
    name: string;
    valueType: AiRuleValueType;
    description: string;
}

const settingMap = new Map<string, AiSettingSpec>(AI_SETTING_SPECS.map(spec => [spec.key, spec]));
const ruleMap = new Map<string, RuleKeyEntry>(
    ruleKeyListData.getRuleKeyListData().map(item => {
        const valueType = resolveRuleValueType(item.key, item.type, item.name);
        return [item.key, {
            key: item.key,
            name: item.name,
            valueType,
            description: AI_RULE_DESCRIPTIONS[item.key] ?? item.name,
        }];
    })
);

const getRuleEntries = (): RuleKeyEntry[] => Array.from(ruleMap.values());

const isRuleKey = (key: string): boolean => ruleMap.has(key);

const isSettingKey = (key: string): boolean => settingMap.has(key);

// ============================================================================
// 生成 Prompt
// ============================================================================

const RULE_TYPE_HINT: Record<AiRuleValueType, string> = {
    'string[]': '字符串数组',
    'number[]': '数字数组',
    'string[][]': '二维字符串数组',
};

const buildRuleTable = (): string => {
    const lines = [
        '| key | 名称 | 值类型 | 说明 |',
        '| --- | --- | --- | --- |',
    ];
    for (const entry of getRuleEntries()) {
        lines.push(`| \`${entry.key}\` | ${entry.name} | ${entry.valueType} | ${entry.description} |`);
    }
    return lines.join('\n');
};

const buildSettingValueHint = (spec: AiSettingSpec): string => {
    switch (spec.type) {
        case 'boolean':
            return 'true / false';
        case 'number': {
            const bounds: string[] = [];
            if (spec.min !== undefined) bounds.push(`≥${spec.min}`);
            if (spec.max !== undefined) bounds.push(`≤${spec.max}`);
            if (spec.integer) bounds.push('整数');
            return bounds.length > 0 ? `数字（${bounds.join('，')}）` : '数字';
        }
        case 'enum':
            return (spec.options ?? []).join(' / ');
        case 'numberRange':
            return '[最小, 最大]';
        case 'timeRanges':
            return '[{"status":true,"r":[开始毫秒,结束毫秒]}]';
        case 'combinationRules':
            return '[{"status":true,"name":"方案名","ruleList":[{"key":"videoTitle","mode":"regex","value":"..."}]}]';
        default:
            return '';
    }
};

const buildSettingTable = (): string => {
    const lines = [
        '| key | 名称 | 取值 | 说明 |',
        '| --- | --- | --- | --- |',
    ];
    for (const spec of AI_SETTING_SPECS) {
        const reload = spec.requiresReload ? '（改动后需刷新页面）' : '';
        lines.push(`| \`${spec.key}\` | ${spec.label} | ${buildSettingValueHint(spec)} | ${spec.description}${reload} |`);
    }
    return lines.join('\n');
};

/** 导出当前配置。规则只含非空项；设置只含与默认值不同的项，避免 Prompt 被默认值淹没 */
const exportCurrentConfig = (): { rules: Record<string, unknown>; settings: Record<string, unknown> } => {
    const rules: Record<string, unknown> = {};
    for (const entry of getRuleEntries()) {
        const value: unknown = GM_getValue(entry.key, []);
        if (Array.isArray(value) && value.length > 0) rules[entry.key] = value;
    }
    const settings: Record<string, unknown> = {};
    for (const spec of AI_SETTING_SPECS) {
        const value: unknown = GM_getValue(spec.key, spec.default);
        if (!isSameValue(value, spec.default)) settings[spec.key] = value;
    }
    return {rules, settings};
};

const buildFormatSection = (): string => [
    '# 输出格式（严格）',
    '只输出一个 ```json 代码块，块内是如下对象，代码块之外不要写任何文字：',
    '```json',
    '{',
    '  "version": 1,',
    '  "add":    { "<规则键>": [值, ...] },   // 追加并去重',
    '  "remove": { "<规则键>": [值, ...] },   // 按值删除',
    '  "set":    { "<任意键>": 值 }           // 规则键=整表替换，设置键=直接赋值',
    '}',
    '```',
    '- add / remove 只能用于「规则键」；设置键只能出现在 set 里。',
    '- 不需要改动的部分整段省略，不要写空对象占位。',
].join('\n');

const buildExampleSection = (): string => [
    '# 示例',
    '需求：屏蔽标题里带「搬运」的视频，另外把 uid 12345 和 67890 加入屏蔽',
    '输出：',
    '```json',
    '{"version":1,"add":{"title":["搬运"],"precise_uid":[12345,67890]}}',
    '```',
    '',
    '需求：以后都不用遮罩方式屏蔽，点赞率低于 10% 的也屏蔽掉',
    '输出：',
    '```json',
    '{"version":1,"set":{"shield_mode":"remove","video_like_rate":0.1,"video_like_rate_blocking_status":true}}',
    '```',
].join('\n');

const buildConstraintSection = (): string => [
    '# 硬性约束',
    '1. 只能用下面清单里出现过的 key，不要发明 key；不确定的需求宁可不写，也不要猜。',
    '2. 正则值必须能被 JavaScript 的 new RegExp() 编译；不要用 (?P<name>…) 这类 Python 专属语法，也不要带 /.../gi 两侧的斜杠。',
    '3. 值类型为 number[] 的规则键（uid、房间号、装扮 id）必须写 JSON 数字，不能写字符串。',
    '4. 时间一律用 13 位毫秒时间戳。',
    '5. 中文内容原样保留，不要翻译、不要转拼音。',
    '6. 一次把需求涉及的所有改动都给出，不要分多次输出，也不要让用户补充后再给。',
].join('\n');

export interface BuildPromptOptions {
    /** 是否把当前规则与当前设置一并写进 Prompt */
    includeCurrent: boolean;
    /** 用户填写的需求；为空时交给 AI 从对话里取 */
    requirement: string;
}

/** 生成一段可以直接粘进任意 AI 对话框的完整 Prompt */
const buildPrompt = (options: BuildPromptOptions): string => {
    const sections: string[] = [
        '# 角色',
        '你是「哔哩哔哩屏蔽增强器」这个 Tampermonkey 用户脚本的规则配置助手。'
        + '你的唯一任务是把用户的自然语言需求翻译成本脚本能识别的规则 JSON。'
        + '不要解释、不要寒暄、不要写脚本代码、不要建议用户自己去改界面。',
        '',
        '# 脚本能做什么',
        '它对 B 站的视频、评论、直播间、动态、弹幕、热搜、页面元素做多维屏蔽。'
        + '规则分四种匹配方式：模糊（包含即命中，忽略大小写）、精确（整值相等）、'
        + '正则（JS 的 String.search）、组合（多个 tag 同时命中才屏蔽）。'
        + '除此之外还有阈值、范围、枚举三类设置项。',
        '',
        buildFormatSection(),
        '',
        '# 配置项清单（只能使用这里的 key）',
        '',
        '## 规则键',
        buildRuleTable(),
        '',
        '## 设置键',
        buildSettingTable(),
        '',
        buildConstraintSection(),
        '',
        buildExampleSection(),
    ];

    if (options.includeCurrent) {
        const current = exportCurrentConfig();
        sections.push(
            '',
            '# 当前配置（供你判断哪些是新增、哪些已存在）',
            '## 现有规则（只列非空项）',
            '```json',
            JSON.stringify(current.rules, null, 2),
            '```',
            '## 现有设置（只列与默认值不同的项）',
            '```json',
            JSON.stringify(current.settings, null, 2),
            '```',
        );
    }

    const requirement = options.requirement.trim();
    sections.push(
        '',
        '# 我的需求',
        requirement === '' ? '请根据我在对话中补充的需求生成配置。' : requirement,
    );

    return sections.join('\n');
};

// ============================================================================
// 解析
// ============================================================================

const tryParse = (text: string): unknown | undefined => {
    try {
        return JSON.parse(text);
    } catch {
        return undefined;
    }
};

/**
 * 从 AI 回复里抠出 JSON。
 *
 * AI 普遍会把结果包进 ```json 围栏，或在前后加一句「好的，以下是配置」。
 * 依次尝试：整体解析 → 第一个代码围栏内的内容 → 第一个 { 到最后一个 }。
 * 只做提取，不做任何语义修正；语义校验交给 buildPlan。
 */
const extractJson = (raw: string): unknown | undefined => {
    const text = raw.trim();
    if (text === '') return undefined;

    const direct = tryParse(text);
    if (direct !== undefined) return direct;

    const fence = /```(?:json|JSON)?\s*([\s\S]*?)```/.exec(text);
    if (fence !== null) {
        const fromFence = tryParse(fence[1].trim());
        if (fromFence !== undefined) return fromFence;
    }

    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end > start) {
        return tryParse(text.slice(start, end + 1));
    }
    return undefined;
};

export interface ParseResult {
    ok: boolean;
    payload?: AiRulePayload;
    errors: string[];
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const parsePayload = (raw: string): ParseResult => {
    const parsed = extractJson(raw);
    if (parsed === undefined) {
        return {ok: false, errors: ['没有找到合法的 JSON。请把 AI 返回的整个 json 代码块原样粘贴进来。']};
    }
    if (!isPlainObject(parsed)) {
        return {ok: false, errors: ['载荷最外层必须是对象（花括号）。']};
    }
    if (parsed.version !== PAYLOAD_VERSION) {
        return {ok: false, errors: [`载荷 version 必须是 ${PAYLOAD_VERSION}，实际是 ${JSON.stringify(parsed.version)}。`]};
    }
    const errors: string[] = [];
    for (const section of ['add', 'remove', 'set'] as const) {
        const value = parsed[section];
        if (value === undefined) continue;
        if (!isPlainObject(value)) errors.push(`"${section}" 必须是对象。`);
    }
    const known = ['version', 'add', 'remove', 'set'];
    for (const key of Object.keys(parsed)) {
        if (!known.includes(key)) errors.push(`无法识别顶层字段 "${key}"，只支持 version / add / remove / set。`);
    }
    if (errors.length > 0) return {ok: false, errors};
    return {ok: true, payload: parsed as unknown as AiRulePayload, errors: []};
};

// ============================================================================
// 校验与求差
// ============================================================================

/** 深比较：只用于判断 GM 里的值是否真的会变，够用即可 */
const isSameValue = (left: unknown, right: unknown): boolean => {
    if (left === right) return true;
    if (Array.isArray(left) && Array.isArray(right)) {
        if (left.length !== right.length) return false;
        return left.every((item, index) => isSameValue(item, right[index]));
    }
    if (isPlainObject(left) && isPlainObject(right)) {
        const leftKeys = Object.keys(left);
        const rightKeys = Object.keys(right);
        if (leftKeys.length !== rightKeys.length) return false;
        return leftKeys.every(key => isSameValue(left[key], right[key]));
    }
    return false;
};

const toNumber = (value: unknown): number | null => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    if (typeof value === 'string' && value.trim() !== '') {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
};

const isValidRegex = (value: string): string | null => {
    try {
        new RegExp(value);
        return null;
    } catch (e) {
        return (e as Error).message;
    }
};

/**
 * 校验单个规则值。
 *
 * 返回规范化后的值或错误信息。int 类型不会静默强转字符串——
 * 严格数值匹配对 "123" 和 123 的结果不同，留下字符串会让规则永远不命中。
 */
const normalizeRuleValue = (
    entry: RuleKeyEntry,
    rawValue: unknown,
    warnings: string[]
): {ok: true; value: unknown} | {ok: false; error: string} => {
    const label = `${entry.name}(${entry.key})`;
    if (!Array.isArray(rawValue)) {
        return {ok: false, error: `${label} 的值必须是数组。`};
    }

    if (entry.valueType === 'string[][]') {
        const rows: string[][] = [];
        for (const row of rawValue) {
            if (!Array.isArray(row)) {
                return {ok: false, error: `${label} 是组合匹配，值必须是二维数组，每一项是字符串数组。`};
            }
            const inner: string[] = [];
            for (const cell of row) {
                if (typeof cell !== 'string' && typeof cell !== 'number') {
                    return {ok: false, error: `${label} 的组合内只能包含字符串。`};
                }
                inner.push(String(cell));
            }
            if (inner.length > 0) rows.push(inner);
        }
        return {ok: true, value: rows};
    }

    if (entry.valueType === 'number[]') {
        const numbers: number[] = [];
        for (const item of rawValue) {
            const num = toNumber(item);
            if (num === null) {
                return {ok: false, error: `${label} 只能包含数字，收到 ${JSON.stringify(item)}。`};
            }
            if (!Number.isInteger(num) || num < 0) {
                return {ok: false, error: `${label} 只能包含非负整数，收到 ${JSON.stringify(item)}。`};
            }
            numbers.push(num);
        }
        return {ok: true, value: numbers};
    }

    const strings: string[] = [];
    for (const item of rawValue) {
        if (typeof item === 'string') {
            if (item.trim() === '') {
                warnings.push(`${label} 里有空字符串，已跳过。`);
                continue;
            }
            strings.push(item);
        } else if (typeof item === 'number') {
            strings.push(String(item));
        } else {
            return {ok: false, error: `${label} 只能包含字符串，收到 ${JSON.stringify(item)}。`};
        }
    }

    // 正则类规则键直接编译一遍，把错误提前暴露在预览阶段而不是运行时的页面控制台
    if (entry.name.includes('(正则匹配)')) {
        for (const pattern of strings) {
            const error = isValidRegex(pattern);
            if (error !== null) {
                return {ok: false, error: `${label} 的正则 ${JSON.stringify(pattern)} 无法编译：${error}`};
            }
        }
    }

    return {ok: true, value: strings};
};

/** 校验单个设置值，返回规范化后的值 */
const normalizeSettingValue = (
    spec: AiSettingSpec,
    rawValue: unknown,
    warnings: string[]
): {ok: true; value: unknown} | {ok: false; error: string} => {
    const label = `${spec.label}(${spec.key})`;
    switch (spec.type) {
        case 'boolean': {
            if (typeof rawValue === 'boolean') return {ok: true, value: rawValue};
            // AI 常把布尔写成字符串，这里放宽不阻断，但要提示
            if (rawValue === 'true' || rawValue === 'false') {
                warnings.push(`${label} 收到字符串 "${rawValue}"，已按布尔 ${rawValue} 处理。`);
                return {ok: true, value: rawValue === 'true'};
            }
            return {ok: false, error: `${label} 必须是 true 或 false，收到 ${JSON.stringify(rawValue)}。`};
        }
        case 'number': {
            const num = toNumber(rawValue);
            if (num === null) return {ok: false, error: `${label} 必须是数字，收到 ${JSON.stringify(rawValue)}。`};
            if (spec.integer && !Number.isInteger(num)) {
                return {ok: false, error: `${label} 必须是整数，收到 ${num}。`};
            }
            if (spec.min !== undefined && num < spec.min) {
                return {ok: false, error: `${label} 不能小于 ${spec.min}，收到 ${num}。`};
            }
            if (spec.max !== undefined && num > spec.max) {
                return {ok: false, error: `${label} 不能大于 ${spec.max}，收到 ${num}。`};
            }
            return {ok: true, value: num};
        }
        case 'enum': {
            if (typeof rawValue !== 'string' || !(spec.options ?? []).includes(rawValue)) {
                return {
                    ok: false,
                    error: `${label} 只能是 ${(spec.options ?? []).join(' / ')} 之一，收到 ${JSON.stringify(rawValue)}。`
                };
            }
            return {ok: true, value: rawValue};
        }
        case 'numberRange': {
            if (!Array.isArray(rawValue) || rawValue.length !== 2) {
                return {ok: false, error: `${label} 必须是 [最小, 最大] 两个数字。`};
            }
            const min = toNumber(rawValue[0]);
            const max = toNumber(rawValue[1]);
            if (min === null || max === null) {
                return {ok: false, error: `${label} 的上下限都必须是数字。`};
            }
            if (min > max) {
                return {ok: false, error: `${label} 的最小值不能大于最大值（收到 [${min}, ${max}]）。`};
            }
            return {ok: true, value: [min, max]};
        }
        case 'timeRanges': {
            if (!Array.isArray(rawValue)) {
                return {ok: false, error: `${label} 必须是数组。`};
            }
            const ranges: Array<{status: boolean; r: [number, number]}> = [];
            for (const item of rawValue) {
                if (!isPlainObject(item) || !Array.isArray(item.r) || item.r.length !== 2) {
                    return {ok: false, error: `${label} 每项必须是 {"status":布尔,"r":[开始毫秒,结束毫秒]}。`};
                }
                const start = toNumber(item.r[0]);
                const end = toNumber(item.r[1]);
                if (start === null || end === null) {
                    return {ok: false, error: `${label} 的时间必须是 13 位毫秒时间戳。`};
                }
                if (start > end) {
                    return {ok: false, error: `${label} 的开始时间不能晚于结束时间。`};
                }
                ranges.push({status: item.status !== false, r: [start, end]});
            }
            return {ok: true, value: ranges};
        }
        case 'combinationRules': {
            if (!Array.isArray(rawValue)) {
                return {ok: false, error: `${label} 必须是数组。`};
            }
            const fieldKeys = ['videoTitle', 'videoTag', 'videoDesc'];
            const plans: Array<{status: boolean; name: string; ruleList: Array<{key: string; mode: string; value: string}>}> = [];
            for (const item of rawValue) {
                if (!isPlainObject(item) || !Array.isArray(item.ruleList)) {
                    return {ok: false, error: `${label} 每项必须是 {"status","name","ruleList":[...]}。`};
                }
                const ruleList: Array<{key: string; mode: string; value: string}> = [];
                for (const rule of item.ruleList) {
                    if (!isPlainObject(rule) || typeof rule.key !== 'string' || !fieldKeys.includes(rule.key)) {
                        return {
                            ok: false,
                            error: `${label} 的 ruleList 里 key 只能是 ${fieldKeys.join(' / ')}。`
                        };
                    }
                    ruleList.push({
                        key: rule.key,
                        mode: typeof rule.mode === 'string' ? rule.mode : 'regex',
                        value: String(rule.value ?? ''),
                    });
                }
                plans.push({
                    status: item.status !== false,
                    name: String(item.name ?? `方案${plans.length + 1}`),
                    ruleList,
                });
            }
            return {ok: true, value: plans};
        }
        default:
            return {ok: false, error: `${label} 的类型未知。`};
    }
};

const labelOf = (key: string): string => {
    const rule = ruleMap.get(key);
    if (rule !== undefined) return rule.name;
    const setting = settingMap.get(key);
    return setting !== undefined ? setting.label : key;
};

/** 把载荷摊平成逐项变更，并验证可行性 */
const buildPlan = (payload: AiRulePayload): AiRulePlan => {
    const changes: AiRuleChange[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];
    let needsReload = false;

    const addChanges = (section: 'add' | 'remove' | 'set'): void => {
        const map = payload[section];
        if (map === undefined) return;
        for (const [key, rawValue] of Object.entries(map)) {
            const label = labelOf(key);
            const ruleEntry = ruleMap.get(key);
            const setting = settingMap.get(key);

            if (ruleEntry === undefined && setting === undefined) {
                errors.push(`未知配置项 "${key}"。请只使用 Prompt 清单里列出的 key。`);
                continue;
            }

            if (section === 'set') {
                if (ruleEntry !== undefined) {
                    const normalized = normalizeRuleValue(ruleEntry, rawValue, warnings);
                    if (!normalized.ok) {
                        errors.push(normalized.error);
                        continue;
                    }
                    const before = GM_getValue(key, []) as unknown;
                    changes.push({
                        action: '覆盖',
                        key,
                        label,
                        before,
                        after: normalized.value,
                        effective: !isSameValue(before, normalized.value),
                    });
                    continue;
                }
                const normalized = normalizeSettingValue(setting!, rawValue, warnings);
                if (!normalized.ok) {
                    errors.push(normalized.error);
                    continue;
                }
                const before = GM_getValue(key, setting!.default) as unknown;
                if (setting!.requiresReload) needsReload = true;
                changes.push({
                    action: '设置',
                    key,
                    label,
                    before,
                    after: normalized.value,
                    effective: !isSameValue(before, normalized.value),
                    actionsReload: setting!.requiresReload,
                });
                continue;
            }

            // add / remove 只对规则键合法
            if (ruleEntry === undefined) {
                errors.push(`"${key}" 是设置项，不能放在 ${section} 里；设置项请用 set。`);
                continue;
            }
            const normalized = normalizeRuleValue(ruleEntry, rawValue, warnings);
            if (!normalized.ok) {
                errors.push(normalized.error);
                continue;
            }
            const incoming = normalized.value as Array<unknown>;
            const before = (GM_getValue(key, []) as Array<unknown>) ?? [];
            if (!Array.isArray(before)) {
                errors.push(`本地存储的 ${label} 不是数组，无法在它基础上做 ${section}。请改用 set。`);
                continue;
            }
            let after: Array<unknown>;
            if (section === 'add') {
                const existing = new Set(before.map(item => JSON.stringify(item)));
                const appended = incoming.filter(item => !existing.has(JSON.stringify(item)));
                if (appended.length === 0) continue; // 全部已存在 → 无变化，不展示
                after = before.concat(appended);
            } else {
                const removing = new Set(incoming.map(item => JSON.stringify(item)));
                after = before.filter(item => !removing.has(JSON.stringify(item)));
                if (after.length === before.length) continue; // 待删值都不存在 → 无变化
            }
            changes.push({
                action: section === 'add' ? '新增' : '移除',
                key,
                label,
                before,
                after,
                effective: true,
            });
        }
    };

    addChanges('add');
    addChanges('remove');
    addChanges('set');

    return {changes, errors, warnings, needsReload};
};

// ============================================================================
// 应用与撤销
// ============================================================================

export interface ApplyResult {
    applied: number;
    needsReload: boolean;
}

/** 应用预览里的改动。只在 errors 为空时调用，这里不再做校验 */
const applyPlan = (plan: AiRulePlan): ApplyResult => {
    const effective = plan.changes.filter(change => change.effective);
    const backup: AiRuleBackup = {
        at: new Date().toISOString(),
        changes: effective.map(change => ({key: change.key, before: change.before, after: change.after})),
    };
    if (effective.length > 0) {
        GM_setValue(BACKUP_KEY, backup);
    }
    for (const change of effective) {
        // 值已在 buildPlan 里规范化过，这里的 unknown 只是类型擦除
        GM_setValue(change.key, change.after as never);
    }
    return {applied: effective.length, needsReload: plan.needsReload};
};

/** 读取备份信息（供 UI 展示「上次应用」） */
const getLastBackup = (): AiRuleBackup | null => {
    const value: unknown = GM_getValue(BACKUP_KEY, null);
    if (!isPlainObject(value)) return null;
    if (!Array.isArray(value.changes)) return null;
    return value as unknown as AiRuleBackup;
};

/** 撤销最近一次应用，返回是否真的回滚过 */
const undoLastApply = (): boolean => {
    const backup = getLastBackup();
    if (backup === null || backup.changes.length === 0) return false;
    for (const change of backup.changes) {
        GM_setValue(change.key, change.before as never);
    }
    GM_deleteValue(BACKUP_KEY);
    return true;
};

/** 整表覆盖：接受既有导出格式 {key: [...]}，只覆盖出现过的键 */
const buildOverwritePlan = (content: string): AiRulePlan => {
    const parsed = extractJson(content);
    if (parsed === undefined || !isPlainObject(parsed)) {
        return {changes: [], errors: ['内容不是合法的 JSON 对象。'], warnings: [], needsReload: false};
    }
    return buildPlan({version: PAYLOAD_VERSION, set: parsed});
};

export default {
    buildPrompt,
    exportCurrentConfig,
    parsePayload,
    buildPlan,
    applyPlan,
    getLastBackup,
    undoLastApply,
    buildOverwritePlan,
    isRuleKey,
    isSettingKey,
    getRuleEntries,
    AI_SETTING_SPECS,
};
