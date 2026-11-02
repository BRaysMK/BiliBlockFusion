import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";

/**
 * 规则匹配回归测试：
 * 覆盖「规则配置了却永远不生效 / 命中范围错乱」的几处历史缺陷，
 * 这些缺陷都不会抛错，只表现为静默漏屏蔽或过度屏蔽。
 */

const gmStore = new Map<string, unknown>();

const stubGmGlobals = (): void => {
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
    stubGmGlobals();
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
});

describe("uid 范围屏蔽", () => {
    it("只屏蔽区间内的 uid", async () => {
        gmStore.set("uid_range_masking_status", true);
        gmStore.set("uid_range_masking", [1000, 2000]);
        const {blockByUidRange} = await import("../src/web/domain/shielding/main.ts");
        expect(blockByUidRange(1500).state).toBe(true);
        expect(blockByUidRange(1000).state).toBe(true);
        expect(blockByUidRange(2000).state).toBe(true);
        // 区间外（旧实现 head >= uid 会把这里也判成命中）
        expect(blockByUidRange(999).state).toBe(false);
        expect(blockByUidRange(2001).state).toBe(false);
    });
});

describe("时间范围屏蔽", () => {
    it("发布时间落在范围内才屏蔽", async () => {
        const start = new Date("2026-01-01T00:00:00Z").getTime();
        const end = new Date("2026-02-01T00:00:00Z").getTime();
        gmStore.set("time_range_masking_status", true);
        gmStore.set("time_range_masking", [{status: true, r: [start, end]}]);
        const {blockTimeRangeMasking} = await import("../src/web/domain/shielding/main.ts");
        const inRange = Math.floor(new Date("2026-01-15T00:00:00Z").getTime() / 1000);
        const before = Math.floor(new Date("2025-12-15T00:00:00Z").getTime() / 1000);
        const after = Math.floor(new Date("2026-03-01T00:00:00Z").getTime() / 1000);
        expect(blockTimeRangeMasking(inRange).state).toBe(true);
        expect(blockTimeRangeMasking(before).state).toBe(false);
        expect(blockTimeRangeMasking(after).state).toBe(false);
    });

    it("单条范围关闭时不生效", async () => {
        const start = new Date("2026-01-01T00:00:00Z").getTime();
        const end = new Date("2026-02-01T00:00:00Z").getTime();
        gmStore.set("time_range_masking_status", true);
        gmStore.set("time_range_masking", [{status: false, r: [start, end]}]);
        const {blockTimeRangeMasking} = await import("../src/web/domain/shielding/main.ts");
        const inRange = Math.floor(new Date("2026-01-15T00:00:00Z").getTime() / 1000);
        expect(blockTimeRangeMasking(inRange).state).toBe(false);
    });
});

describe("动态内容屏蔽", () => {
    it("内容为空且有视频标题时返回视频标题的匹配结果", async () => {
        gmStore.set("dynamic_video", ["视频关键词"]);
        const {blockDynamicItemContent} = await import("../src/web/domain/shielding/main.ts");
        const res = blockDynamicItemContent("", "含视频关键词的标题");
        expect(res.state).toBe(true);
        expect(res.type).toBe("动态视频(模糊匹配)");
    });

    it("内容与视频标题都未命中时返回未命中而不是 undefined", async () => {
        const {blockDynamicItemContent} = await import("../src/web/domain/shielding/main.ts");
        const res = blockDynamicItemContent("", "普通标题");
        expect(res).toBeDefined();
        expect(res.state).toBe(false);
    });
});

describe("话题 tag 屏蔽", () => {
    it("精确/模糊/正则三条规则都能命中动态话题", async () => {
        gmStore.set("precise_tag", ["原神"]);
        gmStore.set("tag", ["崩坏"]);
        gmStore.set("tagCanonical", ["^星.*穹$"]);
        const {blockTopicTag} = await import("../src/web/domain/shielding/main.ts");
        expect(blockTopicTag("原神").type).toBe("精确话题tag");
        expect(blockTopicTag("崩坏星穹铁道").type).toBe("模糊话题tag");
        expect(blockTopicTag("星穹").type).toBe("正则话题tag");
        expect(blockTopicTag("无关话题").state).toBe(false);
        expect(blockTopicTag(null).state).toBe(false);
    });
});

describe("模糊匹配大小写", () => {
    it("规则与待匹配值都忽略大小写", async () => {
        const {default: ruleMatchingUtil} = await import("../src/web/core/util/ruleMatchingUtil.ts");
        expect(ruleMatchingUtil.fuzzyMatch(["Python"], "learn python")).toBe("Python");
        expect(ruleMatchingUtil.fuzzyMatch(["python"], "Learn PYTHON")).toBe("python");
    });
});

describe("正则匹配不做隐式预处理", () => {
    it("带空格的规则能匹配带空格的值", async () => {
        const {default: ruleMatchingUtil} = await import("../src/web/core/util/ruleMatchingUtil.ts");
        expect(ruleMatchingUtil.regexMatch(["foo bar"], "a foo bar b")).toBe("foo bar");
        expect(ruleMatchingUtil.regexMatch(["\\s+"], "a b")).toBe("\\s+");
    });
});

describe("组合规则字段", () => {
    it("标题规则不再被视频 tag 校验拖累", async () => {
        const {default: combinationRules} = await import("../src/web/domain/shielding/combinationRules.ts");
        gmStore.set("combination_rule_list_gm", [{
            name: "标题方案",
            status: true,
            ruleList: [{key: "videoTitle", mode: "regex", value: "测试"}]
        }]);
        // tags 为空：旧实现会在这里判定失败，导致标题规则永远不生效
        const res = await combinationRules.asyncBlockCombinationRulePlan({
            title: "测试视频",
            tags: [],
            videoInfo: {desc: "简介"}
        } as any).then(() => false).catch(() => true);
        expect(res).toBe(true);
    });

    it("未知字段不参与命中判定", async () => {
        const {default: combinationRules} = await import("../src/web/domain/shielding/combinationRules.ts");
        gmStore.set("combination_rule_list_gm", [{
            name: "未知字段方案",
            status: true,
            ruleList: [{key: "unknownField", mode: "regex", value: ""}]
        }]);
        const blocked = await combinationRules.asyncBlockCombinationRulePlan({
            title: "任意标题",
            tags: ["任意tag"],
            videoInfo: {desc: "任意简介"}
        } as any).then(() => false).catch(() => true);
        expect(blocked).toBe(false);
    });
});

describe("直播间 id 屏蔽", () => {
    it("字符串与数字类型的房间号都能命中", async () => {
        gmStore.set("precise_liveRoomId", [123456]);
        const {blockLiveRoomId} = await import("../src/web/domain/shielding/live.ts");
        expect(blockLiveRoomId("123456").state).toBe(true);
        expect(blockLiveRoomId(123456).state).toBe(true);
        expect(blockLiveRoomId("999").state).toBe(false);
    });
});
