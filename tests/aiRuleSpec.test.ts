import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {AI_RULE_DESCRIPTIONS, AI_SETTING_SPECS, resolveRuleValueType} from "../src/web/config/aiRuleSettingSpec.ts";
import ruleKeyListDataJson from "../src/web/config/ruleKeyListDataJson.json";

/**
 * AI 规则注册表自检
 *
 * 这些用例防止「清单漏项」——Prompt 里的清单就是 AI 的唯一信息来源，
 * 任何一个键缺失或被写错，AI 都会凭空发明 key 或漏掉用户想要的能力。
 */

const gmStore = new Map<string, unknown>();

beforeEach(() => {
    gmStore.clear();
    vi.stubGlobal("GM_getValue", (key: string, def: unknown) =>
        gmStore.has(key) ? gmStore.get(key) : def
    );
    vi.stubGlobal("GM_setValue", (key: string, value: unknown): void => {
        gmStore.set(key, value);
    });
    vi.stubGlobal("GM_deleteValue", (key: string): void => {
        gmStore.delete(key);
    });
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
});

interface RuleKeyItem {
    key: string;
    name: string;
    type?: string;
}

const ruleItems = ruleKeyListDataJson as RuleKeyItem[];

describe("配置项注册表", () => {
    it("44 个规则键全部出现在规则键表里", async () => {
        const {default: aiRuleUtil} = await import("../src/web/core/util/aiRuleUtil.ts");
        const entries = aiRuleUtil.getRuleEntries();
        expect(entries).toHaveLength(ruleItems.length);
        expect(ruleItems.length).toBe(44);
        for (const item of ruleItems) {
            expect(entries.some(entry => entry.key === item.key)).toBe(true);
        }
    });

    it("规则键与设置键不重名", async () => {
        const {default: aiRuleUtil} = await import("../src/web/core/util/aiRuleUtil.ts");
        const ruleKeys = new Set(aiRuleUtil.getRuleEntries().map(entry => entry.key));
        for (const spec of AI_SETTING_SPECS) {
            expect(ruleKeys.has(spec.key)).toBe(false);
        }
    });

    it("设置键不重复", () => {
        const keys = AI_SETTING_SPECS.map(spec => spec.key);
        expect(new Set(keys).size).toBe(keys.length);
    });

    it("枚举的 default 落在 options 内", () => {
        for (const spec of AI_SETTING_SPECS) {
            if (spec.type !== 'enum') continue;
            expect(spec.options, spec.key).toBeDefined();
            expect(spec.options, spec.key).toContain(spec.default as string);
        }
    });

    it("number 的 default 落在 min/max 内且满足整数约束", () => {
        for (const spec of AI_SETTING_SPECS) {
            if (spec.type !== 'number') continue;
            const value = spec.default as number;
            expect(typeof value, spec.key).toBe('number');
            if (spec.min !== undefined) expect(value, spec.key).toBeGreaterThanOrEqual(spec.min);
            if (spec.max !== undefined) expect(value, spec.key).toBeLessThanOrEqual(spec.max);
            if (spec.integer) expect(Number.isInteger(value), spec.key).toBe(true);
        }
    });

    it("每条设置项都有说明文字", () => {
        for (const spec of AI_SETTING_SPECS) {
            expect(spec.description.trim(), spec.key).not.toBe('');
        }
    });

    it("值类型推断与规则 JSON 中的 type 字段一致", () => {
        for (const item of ruleItems) {
            const valueType = resolveRuleValueType(item.key, item.type, item.name);
            if (item.type === 'int') {
                expect(valueType, item.key).toBe('number[]');
            } else if (item.key === 'videoTag_preciseCombination' || item.key === 'videoTag_combination_white') {
                expect(valueType, item.key).toBe('string[][]');
            } else {
                expect(valueType, item.key).toBe('string[]');
            }
        }
    });

    it("正则类规则键在 Prompt 里可被识别（名称带(正则匹配)）", () => {
        const regexKeys = ruleItems.filter(item => item.name.includes('(正则匹配)'));
        expect(regexKeys.length).toBeGreaterThan(0);
        for (const item of regexKeys) {
            expect(resolveRuleValueType(item.key, item.type, item.name)).toBe('string[]');
        }
    });

    it("描述覆盖表的每个键都真实存在（防止改名后留下死条目）", () => {
        const keys = new Set(ruleItems.map(item => item.key));
        for (const key of Object.keys(AI_RULE_DESCRIPTIONS)) {
            expect(keys.has(key), key).toBe(true);
        }
    });
});

describe("Prompt 生成", () => {
    it("包含输出格式、约束和示例三段", async () => {
        const {default: aiRuleUtil} = await import("../src/web/core/util/aiRuleUtil.ts");
        const prompt = aiRuleUtil.buildPrompt({includeCurrent: false, requirement: ''});
        expect(prompt).toContain('# 输出格式（严格）');
        expect(prompt).toContain('# 硬性约束');
        expect(prompt).toContain('# 示例');
        expect(prompt).toContain('只输出一个 ```json 代码块');
    });

    it("44 个规则键与全部设置键都出现在 Prompt 里", async () => {
        const {default: aiRuleUtil} = await import("../src/web/core/util/aiRuleUtil.ts");
        const prompt = aiRuleUtil.buildPrompt({includeCurrent: false, requirement: ''});
        for (const item of ruleItems) {
            expect(prompt, item.key).toContain(`\`${item.key}\``);
        }
        for (const spec of AI_SETTING_SPECS) {
            expect(prompt, spec.key).toContain(`\`${spec.key}\``);
        }
    });

    it("用户填写的需求原样出现在末尾", async () => {
        const {default: aiRuleUtil} = await import("../src/web/core/util/aiRuleUtil.ts");
        const requirement = '屏蔽标题带「搬运」的视频，uid 12345 拉黑';
        const prompt = aiRuleUtil.buildPrompt({includeCurrent: false, requirement});
        expect(prompt.trimEnd().endsWith(requirement)).toBe(true);
    });

    it("需求为空时给出兜底句式", async () => {
        const {default: aiRuleUtil} = await import("../src/web/core/util/aiRuleUtil.ts");
        const prompt = aiRuleUtil.buildPrompt({includeCurrent: false, requirement: '   '});
        expect(prompt).toContain('请根据我在对话中补充的需求生成配置');
    });

    it("不含当前配置时不出现「现有规则」段", async () => {
        const {default: aiRuleUtil} = await import("../src/web/core/util/aiRuleUtil.ts");
        const prompt = aiRuleUtil.buildPrompt({includeCurrent: false, requirement: ''});
        expect(prompt).not.toContain('## 现有规则');
    });

    it("包含当前配置时只列出非空规则与偏离默认值的设置", async () => {
        gmStore.set('title', ['搬运']);
        gmStore.set('precise_uid', [12345]);
        gmStore.set('shield_mode', 'overlay');
        const {default: aiRuleUtil} = await import("../src/web/core/util/aiRuleUtil.ts");
        const prompt = aiRuleUtil.buildPrompt({includeCurrent: true, requirement: '看看'});
        expect(prompt).toContain('## 现有规则');
        expect(prompt).toContain('"title"');
        expect(prompt).toContain('"precise_uid"');
        // 默认值相同的设置不该出现，否则 Prompt 会被默认值淹没
        expect(prompt).toContain('"shield_mode": "overlay"');
        expect(prompt).not.toContain('"video_like_rate": 0.05');
    });
});
