import {describe, expect, it} from "vitest";
import {parseEditedContent} from "../src/web/core/util/contentEditUtil.ts";
import type {ContentEditContext} from "../src/web/types/contentViewer.ts";

/**
 * 「查看内容」抽屉编辑回写的校验
 *
 * 抽屉默认只读，点【修改】才解锁编辑；保存前必须按规则键的取值形态校验。
 * 若放任错误类型落盘，屏蔽逻辑用 includes/indexOf 比较时会静默失效——
 * 例如把 uid 存成字符串 "12345"，精确 uid 规则就再也命中不了。
 */

const stringKey: ContentEditContext = {ruleKey: "title", ruleName: "标题(模糊匹配)"};
const intKey: ContentEditContext = {ruleKey: "precise_uid", ruleName: "用户uid(精确匹配)", integer: true};
const combKey: ContentEditContext = {
    ruleKey: "videoTag_preciseCombination",
    ruleName: "精确视频tag(组合匹配)",
    combination: true,
};

describe("抽屉编辑结果校验", () => {
    it("合法的一维字符串数组原样通过", () => {
        const result = parseEditedContent(stringKey, '["搬运","营销号"]');
        expect(result).toEqual({ok: true, value: ["搬运", "营销号"]});
    });

    it("非法 JSON 被拦下", () => {
        const result = parseEditedContent(stringKey, '[搬运, 营销号');
        expect(result.ok).toBe(false);
    });

    it("顶层不是数组时被拦下", () => {
        expect(parseEditedContent(stringKey, '{"a":1}').ok).toBe(false);
        expect(parseEditedContent(stringKey, '"abc"').ok).toBe(false);
    });

    it("数字规则键接受数字字符串，并统一转成数字", () => {
        const result = parseEditedContent(intKey, '["12345",67890]');
        expect(result).toEqual({ok: true, value: [12345, 67890]});
    });

    it("数字规则键拒绝小数与负数", () => {
        expect(parseEditedContent(intKey, "[1.5]").ok).toBe(false);
        expect(parseEditedContent(intKey, "[-1]").ok).toBe(false);
    });

    it("数字规则键拒绝非数字内容，不做静默丢弃", () => {
        expect(parseEditedContent(intKey, '["abc"]').ok).toBe(false);
        expect(parseEditedContent(intKey, "[true]").ok).toBe(false);
    });

    it("组合匹配接受二维字符串数组", () => {
        const result = parseEditedContent(combKey, '[["原神","攻略"]]');
        expect(result).toEqual({ok: true, value: [["原神", "攻略"]]});
    });

    it("组合匹配拒绝一维数组与空内层", () => {
        expect(parseEditedContent(combKey, '["原神"]').ok).toBe(false);
        expect(parseEditedContent(combKey, "[[],[\"原神\"]]").ok).toBe(false);
        expect(parseEditedContent(combKey, "[[]]").ok).toBe(false);
    });

    it("字符串规则键拒绝数字与空串", () => {
        expect(parseEditedContent(stringKey, "[1,2]").ok).toBe(false);
        expect(parseEditedContent(stringKey, '[""]').ok).toBe(false);
        expect(parseEditedContent(stringKey, '["  "]').ok).toBe(false);
    });

    it("空数组允许保存（等价于清空该规则）", () => {
        expect(parseEditedContent(stringKey, "[]")).toEqual({ok: true, value: []});
    });
});
