import {describe, expect, it} from "vitest";
import {MAIN_TABS, normalizeMainTabName} from "../src/web/core/util/mainTabUtil.ts";

/**
 * 顶层页签名迁移
 *
 * 页签从 8 个收敛到 5 个后，老用户 GM 里存的是旧名字。
 * 映射错了会让面板打开在空白页（el-tabs 匹配不到 name 时不显示任何内容）。
 */
describe("主面板页签名", () => {
    it("当前页签名原样返回", () => {
        for (const name of MAIN_TABS) {
            expect(normalizeMainTabName(name)).toBe(name);
        }
    });

    it("旧页签名映射到最接近的新页签", () => {
        expect(normalizeMainTabName('规则管理')).toBe('规则');
        expect(normalizeMainTabName('页面处理')).toBe('页面');
        expect(normalizeMainTabName('兼容设置')).toBe('页面');
        expect(normalizeMainTabName('排除页面')).toBe('页面');
        expect(normalizeMainTabName('面板设置')).toBe('高级');
        expect(normalizeMainTabName('条件限制')).toBe('高级');
        expect(normalizeMainTabName('诊断')).toBe('诊断与关于');
        expect(normalizeMainTabName('关于')).toBe('诊断与关于');
        expect(normalizeMainTabName('弹幕词管理')).toBe('诊断与关于');
    });

    it("无法识别的值回落到「规则」而不是空白页", () => {
        expect(normalizeMainTabName(undefined)).toBe('规则');
        expect(normalizeMainTabName(null)).toBe('规则');
        expect(normalizeMainTabName('')).toBe('规则');
        expect(normalizeMainTabName('某个已删除的页签')).toBe('规则');
        expect(normalizeMainTabName(42)).toBe('规则');
    });

    it("五个顶层页签名字唯一", () => {
        expect(new Set(MAIN_TABS).size).toBe(MAIN_TABS.length);
        expect(MAIN_TABS).toHaveLength(5);
    });
});
