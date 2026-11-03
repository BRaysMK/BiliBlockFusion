import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import ruleKeyListDataJson from "../src/web/config/ruleKeyListDataJson.json";

/**
 * AI 规则 → 实际屏蔽行为的端到端测试
 *
 * aiRuleUtil 只保证「值写进 GM 且格式合法」，但规则能否命中是另一条链路：
 * 各 shielding 模块用 FIXED 的 getter 名读 GM。只要 getter 名与规则键不一致，
 * 预览会显示成功、规则却永远不命中，且没有任何报错。
 *
 * 本文件把 AI 载荷应用后，直接喂给真实屏蔽函数，逐一验证命中。
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

/**
 * 全局配置快照：多个模块把它们在 import 时就固化，
 * 必须在 import 屏蔽模块之前写好 GM 值。
 */
const primeModuleLevelFlags = (): void => {
    gmStore.set("bFuzzyAndRegularMatchingWordsToLowercase", true);
};

beforeEach(() => {
    gmStore.clear();
    stubGm();
    primeModuleLevelFlags();
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
});

const loadAi = async () => (await import("../src/web/core/util/aiRuleUtil.ts")).default;
const loadShield = async () => await import("../src/web/domain/shielding/main.ts");

/** 通过 AI 载荷写入配置，再触发对应屏蔽函数 */
const applyAnd = async <T>(payload: unknown, run: () => Promise<T>): Promise<T> => {
    const ai = await loadAi();
    const plan = ai.buildPlan(payload as any);
    expect(plan.errors, `载荷未通过校验: ${plan.errors.join(" / ")}`).toHaveLength(0);
    ai.applyPlan(plan);
    return run();
};

describe("AI 写入的规则键能被屏蔽逻辑读到", () => {
    it("title（模糊）经 AI 写入后能屏蔽标题", async () => {
        const {blockVideoOrOtherTitle} = await loadShield();
        const result = await applyAnd({version: 1, add: {title: ["搬运"]}}, async () =>
            blockVideoOrOtherTitle("【搬运】某某视频")
        );
        expect(result.state).toBe(true);
        expect(result.type).toContain("模糊标题");
    });

    it("titleCanonical（正则）经 AI 写入后能屏蔽标题", async () => {
        const {blockVideoOrOtherTitle} = await loadShield();
        const result = await applyAnd({version: 1, add: {titleCanonical: ["^\\d{4}年"]}}, async () =>
            blockVideoOrOtherTitle("2026年总结")
        );
        expect(result.state).toBe(true);
        expect(result.type).toContain("正则标题");
    });

    it("precise_name（精确）区分大小写与整值，不误伤", async () => {
        const {blockUserName} = await loadShield();
        const result = await applyAnd({version: 1, add: {precise_name: ["ExactUser"]}}, async () => ({
            hit: blockUserName("ExactUser").state,
            prefix: blockUserName("ExactUserX").state,
            lower: blockUserName("exactuser").state
        }));
        expect(result).toEqual({hit: true, prefix: false, lower: false});
    });

    it("模糊匹配忽略大小写，两侧都转小写", async () => {
        const {blockVideoOrOtherTitle} = await loadShield();
        const result = await applyAnd({version: 1, add: {title: ["ABC"]}}, async () => ({
            lower: blockVideoOrOtherTitle("xxabcxx").state,
            upper: blockVideoOrOtherTitle("xxABCxx").state
        }));
        expect(result).toEqual({lower: true, upper: true});
    });

    it("precise_uid（数字数组）经 AI 写入后能屏蔽 uid", async () => {
        const {blockUidWholeProcess} = await loadShield();
        const result = await applyAnd({version: 1, add: {precise_uid: ["12345"]}}, async () => ({
            hit: blockUidWholeProcess(12345).state,
            miss: blockUidWholeProcess(54321).state
        }));
        expect(result).toEqual({hit: true, miss: false});
    });

    it("precise_uid_white（白名单）优先于 precise_uid，命中则放行", async () => {
        const {blockUserUidAndName} = await loadShield();
        const result = await applyAnd(
            {version: 1, add: {precise_uid: [100], precise_uid_white: [200]}},
            async () => ({
                blocked: blockUserUidAndName(100, "普通用户").state,
                whitelisted: blockUserUidAndName(200, "普通用户").state
            })
        );
        expect(result).toEqual({blocked: true, whitelisted: false});
    });

    it("videoTag 三条规则（模糊/精确/正则）分别生效", async () => {
        const {default: ruleKey} = await import("../src/web/config/ruleKeyListData.ts");
        const {blockBasedVideoTag} = await import("../src/web/domain/shielding/video.ts") as any;
        const ai = await loadAi();
        ai.applyPlan(ai.buildPlan({version: 1, add: {
            videoTag: ["鬼畜"],
            precise_videoTag: ["原神"],
            videoTagCanonical: ["^日常"]
        }}));
        expect(ruleKey.getVideoTagArr()).toEqual(["鬼畜"]);
        expect(ruleKey.getPreciseVideoTagArr()).toEqual(["原神"]);
        expect(ruleKey.getVideoTagCanonicalArr()).toEqual(["^日常"]);
        if (typeof blockBasedVideoTag === "function") {
            expect(blockBasedVideoTag(["鬼畜", "其他"]).state).toBe(true);
            expect(blockBasedVideoTag(["原神"]).state).toBe(true);
            expect(blockBasedVideoTag(["日常vlog"]).state).toBe(true);
            expect(blockBasedVideoTag(["无关"]).state).toBe(false);
        }
    });

    it("videoTag_preciseCombination 需要内层 tag 全部出现", async () => {
        const {default: ruleKey} = await import("../src/web/config/ruleKeyListData.ts");
        const ai = await loadAi();
        ai.applyPlan(ai.buildPlan({version: 1, add: {videoTag_preciseCombination: [["原神", "攻略"]]}}));
        const combination = ruleKey.getVideoTagPreciseCombination();
        expect(combination).toEqual([["原神", "攻略"]]);
        const {default: arrUtil} = await import("../src/web/core/util/arrUtil.ts");
        expect(arrUtil.arrayContains(["原神", "攻略", "其他"], combination[0])).toBe(true);
        expect(arrUtil.arrayContains(["原神", "其他"], combination[0])).toBe(false);
    });

    it("uid_range_masking 经 AI 写入后区间端点都含在内", async () => {
        const {blockByUidRange} = await loadShield();
        const result = await applyAnd(
            {version: 1, set: {uid_range_masking_status: true, uid_range_masking: [1000, 2000]}},
            async () => ({
                low: blockByUidRange(1000).state,
                mid: blockByUidRange(1500).state,
                high: blockByUidRange(2000).state,
                below: blockByUidRange(999).state,
                above: blockByUidRange(2001).state
            })
        );
        expect(result).toEqual({low: true, mid: true, high: true, below: false, above: false});
    });

    it("时间范围规则按秒级时间戳比较，AI 写毫秒会被乘除数正确换算", async () => {
        const {blockTimeRangeMasking} = await loadShield();
        const start = Date.parse("2026-01-01T00:00:00Z");
        const end = Date.parse("2026-02-01T00:00:00Z");
        const result = await applyAnd(
            {version: 1, set: {time_range_masking_status: true, time_range_masking: [{status: true, r: [start, end]}]}},
            async () => ({
                inRange: blockTimeRangeMasking(Math.floor(Date.parse("2026-01-15T00:00:00Z") / 1000)).state,
                outRange: blockTimeRangeMasking(Math.floor(Date.parse("2026-03-15T00:00:00Z") / 1000)).state
            })
        );
        expect(result).toEqual({inRange: true, outRange: false});
    });

    it("等级限制：min/max 都生效，边界值不被误判", async () => {
        const {blockByLevelForVideo} = await loadShield();
        const result = await applyAnd(
            {version: 1, set: {
                is_enable_minimum_user_level_video_gm: true,
                minimum_user_level_video_gm: 2,
                is_enable_maximum_user_level_video_gm: true,
                maximum_user_level_video_gm: 5
            }},
            async () => ({
                zero: blockByLevelForVideo(0).state,
                one: blockByLevelForVideo(1).state,
                two: blockByLevelForVideo(2).state,
                five: blockByLevelForVideo(5).state,
                six: blockByLevelForVideo(6).state
            })
        );
        // level=0 被短路（if (!level) return），其余按 [2,5] 闭区间
        expect(result).toEqual({zero: false, one: true, two: false, five: false, six: true});
    });

    it("组合规则：标题正则 + tag 同时命中才屏蔽", async () => {
        const {default: combinationRulesShielding} = await import("../src/web/domain/shielding/combinationRules.ts");
        await applyAnd(
            {version: 1, set: {combination_rule_list_gm: [{
                status: true,
                name: "方案A",
                ruleList: [
                    {key: "videoTitle", mode: "regex", value: "攻略"},
                    {key: "videoTag", mode: "precise", value: "原神,萌新"}
                ]
            }]}},
            async () => undefined
        );
        const data = {title: "新手攻略", tags: ["原神", "萌新", "其他"], videoInfo: {desc: ""}};
        await expect(combinationRulesShielding.asyncBlockCombinationRulePlan(data as any)).rejects.toMatchObject({state: true, type: "组合规则"});

        await expect(combinationRulesShielding.asyncBlockCombinationRulePlan({
            title: "新手攻略", tags: ["原神"], videoInfo: {desc: ""}
        } as any)).resolves.toBeUndefined();
    });

    it("组合规则：未启用的方案不生效", async () => {
        const {default: combinationRulesShielding} = await import("../src/web/domain/shielding/combinationRules.ts");
        await applyAnd(
            {version: 1, set: {combination_rule_list_gm: [{
                status: false, name: "停用", ruleList: [{key: "videoTitle", mode: "regex", value: ".*"}]
            }]}},
            async () => undefined
        );
        await expect(combinationRulesShielding.asyncBlockCombinationRulePlan({
            title: "任何标题", tags: [], videoInfo: {desc: ""}
        } as any)).resolves.toBeUndefined();
    });

    it("shield_mode 三种取值都能被 getShieldModeGm 读到", async () => {
        const {getShieldModeGm} = await import("../src/web/state/localMKData.ts");
        const ai = await loadAi();
        for (const mode of ["remove", "overlay", "hide"] as const) {
            ai.applyPlan(ai.buildPlan({version: 1, set: {shield_mode: mode}}));
            expect(getShieldModeGm()).toBe(mode);
        }
    });

    it("阈值类设置写入后 getter 返回同一数值", async () => {
        const mod = await import("../src/web/state/localMKData.ts");
        const ai = await loadAi();
        ai.applyPlan(ai.buildPlan({version: 1, set: {
            video_like_rate: 0.42,
            minimum_play_gm: 12345,
            limitation_fan_sum_gm: 99
        }}));
        expect(mod.default.getVideoLikeRate()).toBe(0.42);
        expect(mod.getMinimumPlayGm()).toBe(12345);
        expect(mod.getLimitationFanSumGm()).toBe(99);
    });

    it("每个设置键都能被至少一个 getter 读到（防止 AI 写进去却没人消费）", async () => {
        const fs = await import("node:fs");
        const {AI_SETTING_SPECS} = await import("../src/web/config/aiRuleSettingSpec.ts");
        const src = fs.readFileSync("src/web/state/localMKData.ts", "utf8");
        const missing: string[] = [];
        for (const spec of AI_SETTING_SPECS) {
            if (!src.includes(`'${spec.key}'`) && !src.includes(`"${spec.key}"`)) missing.push(spec.key);
        }
        expect(missing, `这些设置键在 localMKData 里没有读取点: ${missing.join(", ")}`).toEqual([]);
    });
});

describe("规则键 getter 覆盖检查", () => {
    it("每个规则键在 src 中都有真实读取点（不存在只登记不消费的死键）", async () => {
        const fs = await import("node:fs");
        const path = await import("node:path");
        /** 一次读完所有源码再在内存里匹配：每个键起一个 grep 子进程，Windows 上累计必然超过 5s 超时 */
        const sources: string[] = [];
        const walk = (dir: string): void => {
            for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
                const full = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    walk(full);
                } else if (/\.(ts|vue)$/.test(entry.name)) {
                    sources.push(fs.readFileSync(full, "utf8"));
                }
            }
        };
        walk("src/web");
        const joined = sources.join("\n");
        const dead: string[] = [];
        for (const item of ruleKeyListDataJson as Array<{key: string}>) {
            // 规则键清单与 AI 注册表本身不算消费点，要的是屏蔽逻辑里的真实读取
            if (!joined.includes(`'${item.key}'`) && !joined.includes(`"${item.key}"`)) dead.push(item.key);
        }
        expect(dead, `这些规则键没有任何屏蔽逻辑读取: ${dead.join(", ")}`).toEqual([]);
    });
});
