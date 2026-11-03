import {describe, expect, it} from "vitest";
import {filterRuleGroups, groupRuleKeyList, MODE_ORDER} from "../src/web/core/util/ruleGroupUtil.ts";
import ruleKeyListDataJson from "../src/web/config/ruleKeyListDataJson.json";

/**
 * 规则信息面板按实体归组的回归测试
 *
 * 面板原来把 44 个规则键平铺成 44 个按钮，每个都重复一遍实体名，卡片高 1200px。
 * 这组用例锁住三件事：
 * 1. 归组不丢项、不并错项——键只是匹配方式不同的才会合到一起；
 * 2. 组内方式顺序固定，不会因 JSON 顺序变化而跳动；
 * 3. 搜索能同时命中实体名与原始全名，大小写不敏感。
 */

const json = ruleKeyListDataJson as { key: string; name: string }[];

describe("规则键按实体归组", () => {
    it("归组前后键的总数一致，一个都不丢", () => {
        const groups = groupRuleKeyList(json);
        const flat = groups.flatMap(group => group.entries.map(entry => entry.key));
        expect(flat.sort()).toEqual(json.map(item => item.key).sort());
    });

    it("只有匹配方式不同的键才会归到同一组", () => {
        const groups = groupRuleKeyList(json);
        // 用户名有 模糊/精确/正则 三种，应合成一组
        const userName = groups.find(group => group.name === "用户名");
        expect(userName).toBeDefined();
        expect(userName!.entries.map(entry => entry.mode)).toEqual(["模糊", "精确", "正则"]);
        // 用户uid 只有精确一种，不与用户名混在一起
        const uid = groups.find(group => group.name === "用户uid");
        expect(uid!.entries).toHaveLength(1);
        expect(uid!.entries[0].key).toBe("precise_uid");
    });

    it("组内按模糊/精确/正则/组合的固定顺序排列，与 JSON 顺序无关", () => {
        const reordered = [...json].reverse();
        const nameOf = (items: typeof json): string[] =>
            groupRuleKeyList(items).find(group => group.name === "视频tag")!
                .entries.map(entry => entry.mode);
        expect(nameOf(reordered)).toEqual(nameOf(json));
        expect(nameOf(json)).toEqual(["模糊", "精确", "正则"]);
        expect(MODE_ORDER.slice(0, 3)).toEqual(["模糊", "精确", "正则"]);
    });

    it("组合匹配的两个键各自成组，实体名不互相吞并", () => {
        const groups = groupRuleKeyList(json);
        const precise = groups.find(group => group.name === "精确视频tag");
        const white = groups.find(group => group.name === "白名单视频tag");
        expect(precise!.entries.map(entry => entry.key)).toEqual(["videoTag_preciseCombination"]);
        expect(white!.entries.map(entry => entry.key)).toEqual(["videoTag_combination_white"]);
    });

    it("原始全名保留在 label 里，供检索与提示使用", () => {
        const groups = groupRuleKeyList(json);
        const entry = groups.find(group => group.name === "用户名")!.entries[0];
        expect(entry.label).toBe("用户名(模糊匹配)");
    });
});

describe("规则分组搜索", () => {
    const groups = groupRuleKeyList(json);

    it("空关键词原样返回全部分组", () => {
        expect(filterRuleGroups(groups, "")).toHaveLength(groups.length);
        expect(filterRuleGroups(groups, "   ")).toHaveLength(groups.length);
    });

    it("命中实体名时该组的所有匹配方式都保留", () => {
        const result = filterRuleGroups(groups, "用户名");
        expect(result).toHaveLength(1);
        expect(result[0].entries).toHaveLength(3);
    });

    it("命中原始全名里的匹配方式时只保留命中的方式", () => {
        const result = filterRuleGroups(groups, "正则");
        const user = result.find(group => group.name === "用户名")!;
        expect(user.entries.map(entry => entry.mode)).toEqual(["正则"]);
        // 没有正则变体的组不该出现
        expect(result.some(group => group.name === "用户uid")).toBe(false);
    });

    it("大小写与首尾空格不敏感", () => {
        expect(filterRuleGroups(groups, "  BV号 ").map(group => group.name)).toEqual(["视频bv号"]);
        expect(filterRuleGroups(groups, "uid").map(group => group.name)).toContain("用户uid");
    });

    it("无匹配时返回空数组", () => {
        expect(filterRuleGroups(groups, "这个词不存在")).toEqual([]);
    });
});
