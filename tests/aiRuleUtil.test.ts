import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";

/**
 * AI 规则载荷的解析、校验、应用与撤销
 *
 * 关键防线在这里：AI 生成的内容不可信，任何一条不合法的值都必须在预览阶段
 * 被拦下，而不是写进 GM 之后变成一条永远不命中的规则。
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

const load = async () => (await import("../src/web/core/util/aiRuleUtil.ts")).default;

describe("parsePayload 容错提取", () => {
    it("裸 JSON 直接解析", async () => {
        const util = await load();
        const result = util.parsePayload('{"version":1,"add":{"title":["搬运"]}}');
        expect(result.ok).toBe(true);
        expect(result.payload?.add).toEqual({title: ["搬运"]});
    });

    it("带 ```json 围栏也能解析", async () => {
        const util = await load();
        const result = util.parsePayload('```json\n{"version":1,"add":{"title":["搬运"]}}\n```');
        expect(result.ok).toBe(true);
        expect(result.payload?.add).toEqual({title: ["搬运"]});
    });

    it("围栏前后夹带解释文字也能解析", async () => {
        const util = await load();
        const text = '好的，以下是配置：\n\n```json\n{"version":1,"add":{"title":["搬运"]}}\n```\n\n如需调整请告诉我。';
        const result = util.parsePayload(text);
        expect(result.ok).toBe(true);
        expect(result.payload?.add).toEqual({title: ["搬运"]});
    });

    it("没有围栏但有前后说明时按最外层花括号提取", async () => {
        const util = await load();
        const text = '这是结果 {"version":1,"set":{"shield_mode":"hide"}} 希望有帮助';
        const result = util.parsePayload(text);
        expect(result.ok).toBe(true);
        expect(result.payload?.set).toEqual({shield_mode: "hide"});
    });

    it("完全不是 JSON 时报错", async () => {
        const util = await load();
        const result = util.parsePayload('抱歉，我无法完成这个请求。');
        expect(result.ok).toBe(false);
        expect(result.errors[0]).toContain('没有找到合法的 JSON');
    });

    it("顶层是数组时报错", async () => {
        const util = await load();
        const result = util.parsePayload('[{"version":1}]');
        expect(result.ok).toBe(false);
        expect(result.errors[0]).toContain('最外层必须是对象');
    });

    it("version 缺失时报错", async () => {
        const util = await load();
        const result = util.parsePayload('{"add":{"title":["x"]}}');
        expect(result.ok).toBe(false);
        expect(result.errors[0]).toContain('version');
    });

    it("未知顶层字段时报错", async () => {
        const util = await load();
        const result = util.parsePayload('{"version":1,"delete":{"title":["x"]}}');
        expect(result.ok).toBe(false);
        expect(result.errors.join()).toContain('无法识别顶层字段');
    });
});

describe("buildPlan 校验", () => {
    it("未知配置项报错", async () => {
        const util = await load();
        const plan = util.buildPlan({version: 1, add: {notARealKey: ["x"]}});
        expect(plan.errors[0]).toContain('未知配置项');
        expect(plan.changes).toHaveLength(0);
    });

    it("add 用于设置键时报错并提示改用 set", async () => {
        const util = await load();
        const plan = util.buildPlan({version: 1, add: {shield_mode: ["overlay"]}});
        expect(plan.errors[0]).toContain('是设置项');
        expect(plan.errors[0]).toContain('set');
    });

    it("int 规则键收到非数字报错", async () => {
        const util = await load();
        const plan = util.buildPlan({version: 1, add: {precise_uid: ["abc"]}});
        expect(plan.errors[0]).toContain('只能包含数字');
    });

    it("int 规则键收到负数或小数报错", async () => {
        const util = await load();
        expect(util.buildPlan({version: 1, add: {precise_uid: [-1]}}).errors[0]).toContain('非负整数');
        expect(util.buildPlan({version: 1, add: {precise_uid: [1.5]}}).errors[0]).toContain('非负整数');
    });

    it("int 规则键收到数字字符串会转成数字（AI 常见写法）", async () => {
        const util = await load();
        const plan = util.buildPlan({version: 1, add: {precise_uid: ["12345"]}});
        expect(plan.errors).toHaveLength(0);
        expect(plan.changes[0].after).toEqual([12345]);
    });

    it("正则规则键的非法表达式报错", async () => {
        const util = await load();
        const plan = util.buildPlan({version: 1, add: {titleCanonical: ['(?P<name>x)']}});
        expect(plan.errors[0]).toContain('无法编译');
    });

    it("枚举值越界报错并列出可选值", async () => {
        const util = await load();
        const plan = util.buildPlan({version: 1, set: {shield_mode: 'invisible'}});
        expect(plan.errors[0]).toContain('只能是');
        expect(plan.errors[0]).toContain('remove');
    });

    it("number 越界报错", async () => {
        const util = await load();
        const plan = util.buildPlan({version: 1, set: {video_like_rate: 5}});
        expect(plan.errors[0]).toContain('不能大于');
    });

    it("布尔键收到字符串 true 时强转并给出警告", async () => {
        const util = await load();
        const plan = util.buildPlan({version: 1, set: {video_like_rate_blocking_status: 'true'}});
        expect(plan.errors).toHaveLength(0);
        expect(plan.warnings[0]).toContain('已按布尔');
        expect(plan.changes[0].after).toBe(true);
    });

    it("时间范围缺 r 字段报错", async () => {
        const util = await load();
        const plan = util.buildPlan({version: 1, set: {time_range_masking: [{status: true}]}});
        expect(plan.errors[0]).toContain('status');
    });

    it("时间范围起止颠倒报错", async () => {
        const util = await load();
        const plan = util.buildPlan({
            version: 1,
            set: {time_range_masking: [{status: true, r: [2000, 1000]}]}
        });
        expect(plan.errors[0]).toContain('开始时间不能晚于结束时间');
    });

    it("组合规则的 key 非法时报错", async () => {
        const util = await load();
        const plan = util.buildPlan({
            version: 1,
            set: {
                combination_rule_list_gm: [
                    {status: true, name: '方案1', ruleList: [{key: 'videoAuthor', mode: 'regex', value: 'x'}]}
                ]
            }
        });
        expect(plan.errors[0]).toContain('videoTitle');
    });

    it("uid 范围最小值大于最大值报错", async () => {
        const util = await load();
        const plan = util.buildPlan({version: 1, set: {uid_range_masking: [100, 10]}});
        expect(plan.errors[0]).toContain('最小值不能大于最大值');
    });
});

describe("buildPlan 求差", () => {
    it("add 追加去重", async () => {
        gmStore.set('title', ['已有']);
        const util = await load();
        const plan = util.buildPlan({version: 1, add: {title: ['已有', '新增']}});
        expect(plan.changes).toHaveLength(1);
        expect(plan.changes[0].after).toEqual(['已有', '新增']);
        expect(plan.changes[0].action).toBe('新增');
    });

    it("add 的值全部已存在时不计入变更", async () => {
        gmStore.set('title', ['已有']);
        const util = await load();
        const plan = util.buildPlan({version: 1, add: {title: ['已有']}});
        expect(plan.changes).toHaveLength(0);
        expect(plan.errors).toHaveLength(0);
    });

    it("remove 只删存在的值", async () => {
        gmStore.set('title', ['A', 'B']);
        const util = await load();
        const plan = util.buildPlan({version: 1, remove: {title: ['B', '不存在']}});
        expect(plan.changes[0].after).toEqual(['A']);
    });

    it("remove 的目标都不存在时不计入变更", async () => {
        gmStore.set('title', ['A']);
        const util = await load();
        const plan = util.buildPlan({version: 1, remove: {title: ['X']}});
        expect(plan.changes).toHaveLength(0);
    });

    it("set 对规则键是整表替换", async () => {
        gmStore.set('title', ['旧1', '旧2']);
        const util = await load();
        const plan = util.buildPlan({version: 1, set: {title: ['新']}});
        expect(plan.changes[0].action).toBe('覆盖');
        expect(plan.changes[0].after).toEqual(['新']);
    });

    it("set 的值与当前完全相同时标记为无变化", async () => {
        gmStore.set('precise_uid', [1, 2]);
        const util = await load();
        const plan = util.buildPlan({version: 1, set: {precise_uid: [1, 2]}});
        expect(plan.changes[0].effective).toBe(false);
    });

    it("布尔设置与默认值相同也标记为无变化", async () => {
        const util = await load();
        const plan = util.buildPlan({version: 1, set: {video_like_rate_blocking_status: false}});
        expect(plan.changes[0].effective).toBe(false);
        expect(plan.changes[0].before).toBe(false);
    });
});

describe("applyPlan / undoLastApply", () => {
    it("应用后 GM 值正确", async () => {
        gmStore.set('title', ['已有']);
        const util = await load();
        const plan = util.buildPlan({
            version: 1,
            add: {title: ['新增']},
            set: {shield_mode: 'hide', video_like_rate: 0.1}
        });
        const result = util.applyPlan(plan);
        expect(result.applied).toBe(3);
        expect(gmStore.get('title')).toEqual(['已有', '新增']);
        expect(gmStore.get('shield_mode')).toBe('hide');
        expect(gmStore.get('video_like_rate')).toBe(0.1);
    });

    it("无变化的项不写入", async () => {
        gmStore.set('precise_uid', [1]);
        const util = await load();
        const plan = util.buildPlan({version: 1, set: {precise_uid: [1]}});
        const result = util.applyPlan(plan);
        expect(result.applied).toBe(0);
    });

    it("撤销能把所有键还原到应用前", async () => {
        gmStore.set('title', ['原本']);
        gmStore.set('shield_mode', 'remove');
        const util = await load();
        const plan = util.buildPlan({
            version: 1,
            set: {title: ['新的'], shield_mode: 'overlay'}
        });
        util.applyPlan(plan);
        expect(gmStore.get('title')).toEqual(['新的']);

        expect(util.undoLastApply()).toBe(true);
        expect(gmStore.get('title')).toEqual(['原本']);
        expect(gmStore.get('shield_mode')).toBe('remove');
    });

    it("没有备份时撤销返回 false", async () => {
        const util = await load();
        expect(util.undoLastApply()).toBe(false);
    });

    it("撤销后备份被清除，不能重复撤销", async () => {
        gmStore.set('title', ['原本']);
        const util = await load();
        util.applyPlan(util.buildPlan({version: 1, set: {title: ['新的']}}));
        expect(util.undoLastApply()).toBe(true);
        expect(util.undoLastApply()).toBe(false);
    });
});

describe("整表覆盖", () => {
    it("只覆盖内容里出现的键，其余保持不变", async () => {
        gmStore.set('title', ['旧']);
        gmStore.set('name', ['保留我']);
        const util = await load();
        const plan = util.buildOverwritePlan('{"title":["新"]}');
        expect(plan.errors).toHaveLength(0);
        util.applyPlan(plan);
        expect(gmStore.get('title')).toEqual(['新']);
        expect(gmStore.get('name')).toEqual(['保留我']);
    });

    it("非法内容返回错误而不是抛异常", async () => {
        const util = await load();
        expect(util.buildOverwritePlan('不是 json').errors.length).toBeGreaterThan(0);
        expect(util.buildOverwritePlan('[1,2,3]').errors.length).toBeGreaterThan(0);
    });

    it("含未知键时报错，不写入", async () => {
        const util = await load();
        const plan = util.buildOverwritePlan('{"nope":["x"]}');
        expect(plan.errors[0]).toContain('未知配置项');
    });
});
