import {describe, expect, it} from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";

/**
 * 油猴菜单回归测试
 *
 * 菜单项曾多达 6 条（主面板 + 5 条外链），而外链在面板「关于」页全部已有入口。
 * 这里锁定菜单只保留主面板一项，防止外链再次堆回来。
 */
describe("油猴菜单只保留主面板", () => {
    const src = readFileSync(resolve(process.cwd(), "src/web/menu.ts"), "utf8");

    it("GM_registerMenuCommand 恰好注册 1 项", () => {
        const calls = src.match(/GM_registerMenuCommand\s*\(/g) ?? [];
        expect(calls).toHaveLength(1);
    });

    it("唯一菜单项是「主面板」且发送主面板开关事件", () => {
        expect(src).toContain("GM_registerMenuCommand('主面板'");
        expect(src).toContain("eventEmitter.send('主面板开关')");
    });

    it("不再打开任何外部链接", () => {
        expect(src).not.toContain("GM_openInTab");
        expect(src).not.toContain("http");
    });
});
