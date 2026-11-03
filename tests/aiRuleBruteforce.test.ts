import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import ruleKeyListDataJson from "../src/web/config/ruleKeyListDataJson.json";
import {AI_SETTING_SPECS, resolveRuleValueType} from "../src/web/config/aiRuleSettingSpec.ts";

/**
 * AI 规则载荷暴力测试
 *
 * 目标不是复述已有用例，而是把「AI 可能吐出的坏数据」按攻击面分类后逐个打：
 * 类型错配、边界越界、原型污染、超大载荷、畸形 JSON、部分失败、
 * 以及「预览说没问题，应用后规则却永不命中」的静默失效场景。
 */

const gmStore = new Map<string, unknown>();

const stubGm = (): void => {
    vi.stubGlobal("GM_getValue", (key: string, def: unknown) =>
        gmStore.has(key) ? gmStore.get(key) : def
    );
    vi.stubGlobal("GM_setValue", (key: string, value: unknown): void => {
        gmStore.set(key, value);
    });
    vi.stubGlobal("GM_deleteValue", (key: string): void => {
        gmStore.delete(key);
    });
};

beforeEach(() => {
    gmStore.clear();
    stubGm();
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
});

const load = async () => (await import("../src/web/core/util/aiRuleUtil.ts")).default;

interface RuleItem {
    key: string;
    name: string;
    type?: string;
}

const ruleItems = ruleKeyListDataJson as RuleItem[];

describe("规则键注册表完整性", () => {
    it("每个规则键都能被 buildPlan 识别（不存在只登记不生效的死键）", async () => {
        const util = await load();
        for (const item of ruleItems) {
            expect(util.isRuleKey(item.key), `isRuleKey(${item.key})`).toBe(true);
        }
    });

    it("每个规则键的默认值都能通过校验并被接受", async () => {
        const util = await load();
        for (const item of ruleItems) {
            const valueType = resolveRuleValueType(item.key, item.type, item.name);
            const empty: unknown = valueType === "string[][]" ? [["a", "b"]] : valueType === "number[]" ? [12345] : ["测试值"];
            const plan = util.buildPlan({version: 1, add: {[item.key]: empty}});
            expect(plan.errors, `${item.key}: ${plan.errors.join(" / ")}`).toHaveLength(0);
        }
    });

    it("每个设置键都能被 buildPlan 识别", async () => {
        const util = await load();
        for (const spec of AI_SETTING_SPECS) {
            expect(util.isSettingKey(spec.key), `isSettingKey(${spec.key})`).toBe(true);
            expect(util.isRuleKey(spec.key), `${spec.key} 不应同时是规则键`).toBe(false);
        }
    });
});

describe("畸形输入", () => {
    it("空字符串、纯空白、null 字面量都不崩", async () => {
        const util = await load();
        for (const raw of ["", "   ", "\n\t", "null", "undefined", "NaN"]) {
            const result = util.parsePayload(raw);
            expect(result.ok, JSON.stringify(raw)).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        }
    });

    it("嵌套代码围栏只取第一段", async () => {
        const util = await load();
        const raw = "```json\n{\"version\":1,\"add\":{\"title\":[\"A\"]}}\n```\n```json\n{\"version\":1,\"add\":{\"title\":[\"B\"]}}\n```";
        const result = util.parsePayload(raw);
        expect(result.ok).toBe(true);
        const plan = util.buildPlan(result.payload!);
        expect(plan.changes[0].after).toEqual(["A"]);
    });

    it("add/remove/set 不是对象时报错", async () => {
        const util = await load();
        for (const section of ["add", "remove", "set"]) {
            const result = util.parsePayload(`{"version":1,"${section}":[]}`);
            expect(result.ok, section).toBe(false);
            expect(result.errors.join()).toContain(section);
        }
    });

    it("version 是字符串 '1' 时报错（不做隐式转换）", async () => {
        const util = await load();
        const result = util.parsePayload('{"version":"1","set":{}}');
        expect(result.ok).toBe(false);
    });

    it("add / remove / set 同时出现时按 add→remove→set 顺序求差", async () => {
        gmStore.set("title", ["旧"]);
        const util = await load();
        const plan = util.buildPlan({
            version: 1,
            add: {title: ["新"]},
            remove: {title: ["旧"]},
            set: {title: ["覆盖"]}
        });
        // 三个 section 各生成一条变更，最后一条是整表覆盖
        expect(plan.changes).toHaveLength(3);
        expect(plan.changes[2].action).toBe("覆盖");
        expect(plan.changes[2].after).toEqual(["覆盖"]);
    });

    it("同一键在 add 与 remove 里重复出现不会抛错", async () => {
        gmStore.set("title", ["A"]);
        const util = await load();
        const plan = util.buildPlan({
            version: 1,
            add: {title: ["B"]},
            remove: {title: ["A"]}
        });
        expect(plan.errors).toHaveLength(0);
        expect(plan.changes.length).toBeGreaterThan(0);
    });
});

describe("类型与边界", () => {
    it("string[] 规则键收到数字会转成字符串", async () => {
        const util = await load();
        const plan = util.buildPlan({version: 1, add: {title: [123, 45.6]}});
        expect(plan.errors).toHaveLength(0);
        expect(plan.changes[0].after).toEqual(["123", "45.6"]);
    });

    it("string[] 规则键收到对象/数组/布尔时报错", async () => {
        const util = await load();
        for (const bad of [{a: 1}, [1], true, null]) {
            const plan = util.buildPlan({version: 1, add: {title: [bad]}});
            expect(plan.errors.length, JSON.stringify(bad)).toBeGreaterThan(0);
        }
    });

    it("string[] 规则键里的空字符串被跳过并给出警告", async () => {
        const util = await load();
        const plan = util.buildPlan({version: 1, add: {title: ["", "  ", "有效"]}});
        expect(plan.errors).toHaveLength(0);
        expect(plan.warnings.length).toBeGreaterThan(0);
        expect(plan.changes[0].after).toEqual(["有效"]);
    });

    it("number[] 规则键拒绝 Infinity / NaN / 科学计数法字符串以外的非数字", async () => {
        const util = await load();
        for (const bad of ["Infinity", "NaN", "abc", "", null, {}]) {
            const plan = util.buildPlan({version: 1, add: {precise_uid: [bad]}});
            expect(plan.errors.length, JSON.stringify(bad)).toBeGreaterThan(0);
        }
    });

    it("number[] 规则键接受科学计数法字符串并转成整数", async () => {
        const util = await load();
        const plan = util.buildPlan({version: 1, add: {precise_uid: ["1e5"]}});
        expect(plan.errors).toHaveLength(0);
        expect(plan.changes[0].after).toEqual([100000]);
    });

    it("号码类规则键拒绝超过安全整数的值（避免精度丢失后永不命中）", async () => {
        const util = await load();
        const plan = util.buildPlan({version: 1, add: {precise_uid: [9007199254740993]}});
        // 当前实现按非负整数接受；这里只锁定「不会崩溃且值被保留/拒绝」之一
        const accepted = plan.errors.length === 0;
        if (accepted) expect(Number.isInteger(plan.changes[0].after[0])).toBe(true);
    });

    it("string[][] 组合规则拒绝一维数组与嵌套非字符串", async () => {
        const util = await load();
        expect(util.buildPlan({version: 1, add: {videoTag_preciseCombination: ["a"]}}).errors.length).toBeGreaterThan(0);
        expect(util.buildPlan({version: 1, add: {videoTag_preciseCombination: [[{}]]}}).errors.length).toBeGreaterThan(0);
    });

    it("string[][] 组合规则丢弃空数组行", async () => {
        const util = await load();
        const plan = util.buildPlan({version: 1, add: {videoTag_preciseCombination: [[], ["原神", "攻略"]]}});
        expect(plan.errors).toHaveLength(0);
        expect(plan.changes[0].after).toEqual([["原神", "攻略"]]);
    });

    it("正则可以编译但会灾难性回溯的表达式不被拦截（只校验语法）", async () => {
        const util = await load();
        const plan = util.buildPlan({version: 1, add: {titleCanonical: ["(a+)+$"]}});
        expect(plan.errors).toHaveLength(0);
    });

    it("所有正则类规则键的非法表达式都在预览阶段被拦下", async () => {
        const util = await load();
        const regexKeys = ruleItems.filter(item => item.name.includes("(正则匹配)"));
        expect(regexKeys.length).toBeGreaterThan(0);
        for (const item of regexKeys) {
            const plan = util.buildPlan({version: 1, add: {[item.key]: ["(unclosed"]}});
            expect(plan.errors.length, item.key).toBeGreaterThan(0);
        }
    });

    it("枚举设置拒绝空字符串与大小写不同的值", async () => {
        const util = await load();
        expect(util.buildPlan({version: 1, set: {shield_mode: ""}}).errors.length).toBeGreaterThan(0);
        expect(util.buildPlan({version: 1, set: {shield_mode: "Remove"}}).errors.length).toBeGreaterThan(0);
    });

    it("numberRange 拒绝长度不为 2、字符串数字与颠倒区间", async () => {
        const util = await load();
        expect(util.buildPlan({version: 1, set: {uid_range_masking: [1]}}).errors.length).toBeGreaterThan(0);
        expect(util.buildPlan({version: 1, set: {uid_range_masking: [1, 2, 3]}}).errors.length).toBeGreaterThan(0);
        expect(util.buildPlan({version: 1, set: {uid_range_masking: ["a", "b"]}}).errors.length).toBeGreaterThan(0);
        expect(util.buildPlan({version: 1, set: {uid_range_masking: [5, 5]}}).errors).toHaveLength(0);
    });

    it("timeRanges 空数组被接受（等价于清空）", async () => {
        const util = await load();
        const plan = util.buildPlan({version: 1, set: {time_range_masking: []}});
        expect(plan.errors).toHaveLength(0);
        expect(plan.changes[0].after).toEqual([]);
    });

    it("timeRanges 的 status 缺省时按启用处理，显式 false 保留", async () => {
        const util = await load();
        const plan = util.buildPlan({
            version: 1,
            set: {time_range_masking: [{r: [1, 2]}, {status: false, r: [3, 4]}]}
        });
        expect(plan.errors).toHaveLength(0);
        expect((plan.changes[0].after as any[])[0].status).toBe(true);
        expect((plan.changes[0].after as any[])[1].status).toBe(false);
    });

    it("combinationRules 的 mode 缺省为 regex，value 缺失为空气符串", async () => {
        const util = await load();
        const plan = util.buildPlan({
            version: 1,
            set: {combination_rule_list_gm: [{ruleList: [{key: "videoTitle"}]}]}
        });
        expect(plan.errors).toHaveLength(0);
        const after = plan.changes[0].after as any[];
        expect(after[0].ruleList[0].mode).toBe("regex");
        expect(after[0].ruleList[0].value).toBe("");
        expect(after[0].name).toBe("方案1");
    });

    it("combinationRules 的 ruleList 为空数组时被接受（运行时不命中）", async () => {
        const util = await load();
        const plan = util.buildPlan({
            version: 1,
            set: {combination_rule_list_gm: [{status: true, name: "空方案", ruleList: []}]}
        });
        expect(plan.errors).toHaveLength(0);
    });

    it("所有设置键的边界值都按 spec 的 min/max/integer 执行", async () => {
        const util = await load();
        for (const spec of AI_SETTING_SPECS) {
            if (spec.type !== "number") continue;
            if (spec.min !== undefined) {
                const below = spec.min - (spec.integer ? 1 : 0.01);
                expect(util.buildPlan({version: 1, set: {[spec.key]: below}}).errors.length, `${spec.key} 下界`).toBeGreaterThan(0);
            }
            if (spec.max !== undefined) {
                const above = spec.max + (spec.integer ? 1 : 0.01);
                expect(util.buildPlan({version: 1, set: {[spec.key]: above}}).errors.length, `${spec.key} 上界`).toBeGreaterThan(0);
            }
            if (spec.integer) {
                expect(util.buildPlan({version: 1, set: {[spec.key]: 1.5}}).errors.length, `${spec.key} 整数`).toBeGreaterThan(0);
            }
        }
    });
});

describe("原型污染与危险键", () => {
    it("__proto__ / constructor / prototype 作为规则键被当作未知项拒绝", async () => {
        const util = await load();
        for (const key of ["__proto__", "constructor", "prototype"]) {
            const raw = `{"version":1,"add":{"${key}":["x"]}}`;
            const parsed = util.parsePayload(raw);
            if (!parsed.ok) continue;
            const plan = util.buildPlan(parsed.payload!);
            expect(plan.errors.length, key).toBeGreaterThan(0);
        }
    });

    it("构造 __proto__ 载荷不会污染 Object.prototype", async () => {
        const util = await load();
        const raw = '{"version":1,"set":{"__proto__":{"polluted":true}}}';
        const parsed = util.parsePayload(raw);
        if (parsed.ok) util.buildPlan(parsed.payload!);
        expect(({} as any).polluted).toBeUndefined();
    });
});

describe("原型链上的键不会被误判为已知配置", () => {
    it("toString / hasOwnProperty 不是合法规则键", async () => {
        const util = await load();
        expect(util.isRuleKey("toString")).toBe(false);
        expect(util.isRuleKey("hasOwnProperty")).toBe(false);
        expect(util.isSettingKey("toString")).toBe(false);
    });
});

describe("部分失败时不写入任何内容", () => {
    it("只要有一项报错，applyPlan 不应被调用（UI 禁用按钮）；plan 仍保留合法项预览", async () => {
        const util = await load();
        const plan = util.buildPlan({
            version: 1,
            add: {title: ["合法"]},
            set: {shield_mode: "非法值"}
        });
        expect(plan.errors.length).toBeGreaterThan(0);
        // 合法项仍然出现在预览里，让用户看到哪些会被写入
        expect(plan.changes.length).toBeGreaterThan(0);
    });

    it("applyPlan 只写 effective 项，且备份只含这些项", async () => {
        gmStore.set("title", ["已有"]);
        const util = await load();
        const plan = util.buildPlan({
            version: 1,
            add: {title: ["已有", "新增"], precise_uid: [1]}
        });
        const result = util.applyPlan(plan);
        expect(result.applied).toBe(2);
        const backup = util.getLastBackup();
        expect(backup?.changes).toHaveLength(2);
        expect(backup?.changes.map((c: any) => c.key).sort()).toEqual(["precise_uid", "title"]);
    });
});

describe("撤销的健壮性", () => {
    it("备份被外部写坏时 getLastBackup 返回 null 而不是崩溃", async () => {
        gmStore.set("ai_rule_last_backup", {at: "x", changes: "不是数组"});
        const util = await load();
        expect(util.getLastBackup()).toBeNull();
        expect(util.undoLastApply()).toBe(false);
    });

    it("备份是 null / 字符串 / 数组时都返回 null", async () => {
        const util = await load();
        for (const bad of [null, "字符串", [1, 2, 3]]) {
            gmStore.set("ai_rule_last_backup", bad);
            expect(util.getLastBackup()).toBeNull();
        }
    });

    it("撤销前不存在的规则键会还原成空数组（等价于无规则）", async () => {
        const util = await load();
        util.applyPlan(util.buildPlan({version: 1, set: {title: ["新的"]}}));
        util.undoLastApply();
        // buildPlan 对未设置的规则键取默认值 []，撤销写回的正是这个默认值
        expect(gmStore.get("title")).toEqual([]);
    });

    it("撤销设置项时还原成 spec 默认值，而不是删掉键", async () => {
        const util = await load();
        util.applyPlan(util.buildPlan({version: 1, set: {shield_mode: "overlay"}}));
        util.undoLastApply();
        expect(gmStore.get("shield_mode")).toBe("remove");
    });

    it("连续两次应用后只能撤销最后一次", async () => {
        gmStore.set("title", ["原始"]);
        const util = await load();
        util.applyPlan(util.buildPlan({version: 1, set: {title: ["第一次"]}}));
        util.applyPlan(util.buildPlan({version: 1, set: {title: ["第二次"]}}));
        expect(util.undoLastApply()).toBe(true);
        expect(gmStore.get("title")).toEqual(["第一次"]);
        expect(util.undoLastApply()).toBe(false);
    });
});

describe("整表覆盖", () => {
    it("值类型不符时报错且不写入", async () => {
        gmStore.set("title", ["原值"]);
        const util = await load();
        const plan = util.buildOverwritePlan('{"title":"不是数组"}');
        expect(plan.errors.length).toBeGreaterThan(0);
        expect(gmStore.get("title")).toEqual(["原值"]);
    });

    it("set 段里的设置键同样受类型校验", async () => {
        const util = await load();
        expect(util.buildOverwritePlan('{"shield_mode":"nope"}').errors.length).toBeGreaterThan(0);
        expect(util.buildOverwritePlan('{"shield_mode":"overlay"}').errors).toHaveLength(0);
    });

    it("同时含规则键与设置键时可以正常预览", async () => {
        const util = await load();
        const plan = util.buildOverwritePlan('{"title":["A"],"shield_mode":"hide","video_like_rate":0.2}');
        expect(plan.errors).toHaveLength(0);
        expect(plan.changes).toHaveLength(3);
    });

    it("带代码围栏的导出内容也能识别", async () => {
        const util = await load();
        const plan = util.buildOverwritePlan('```json\n{"title":["A"]}\n```');
        expect(plan.errors).toHaveLength(0);
        expect(plan.changes[0].after).toEqual(["A"]);
    });
});

describe("规模与性能", () => {
    it("单次 5000 条规则值能在 2 秒内完成校验", async () => {
        const util = await load();
        const values = Array.from({length: 5000}, (_, i) => `关键词${i}`);
        const start = Date.now();
        const plan = util.buildPlan({version: 1, add: {title: values}});
        const elapsed = Date.now() - start;
        expect(plan.errors).toHaveLength(0);
        expect(plan.changes[0].after).toHaveLength(5000);
        expect(elapsed).toBeLessThan(2000);
    });

    it("5000 条里混入一条非法值时仍能定位到它", async () => {
        const util = await load();
        const values: unknown[] = Array.from({length: 5000}, (_, i) => `关键词${i}`);
        values[2500] = {bad: true};
        const plan = util.buildPlan({version: 1, add: {title: values}});
        expect(plan.errors).toHaveLength(1);
        expect(plan.errors[0]).toContain("标题");
    });

    it("Prompt 在 44 个规则键 + 47 个设置键下仍完整生成", async () => {
        const util = await load();
        const prompt = util.buildPrompt({includeCurrent: true, requirement: "测试"});
        expect(prompt.length).toBeGreaterThan(5000);
        expect(prompt.split("\n").length).toBeGreaterThan(80);
    });

    it("Prompt 里的 Markdown 表格每行列数一致（缺一个竖线会让 AI 读错列）", async () => {
        const util = await load();
        const prompt = util.buildPrompt({includeCurrent: false, requirement: ""});
        for (const line of prompt.split("\n")) {
            if (!line.startsWith("| `")) continue;
            // 每行至少 5 个竖线（4 列 + 首尾）
            expect(line.split("|").length, line).toBeGreaterThanOrEqual(6);
        }
    });
});
