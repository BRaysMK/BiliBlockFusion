import {describe, expect, it} from "vitest";

/**
 * BewlyBewly 视频卡片选择器回归测试
 *
 * 背景：BewlyCat 每次改版都会让旧的卡片选择器静默失配，
 * 表现为「屏蔽完全不生效」但页面没有任何报错——排查成本极高。
 * 实测新版（当前）结构：
 *   .grid-adaptive > div(无class) > div > .video-card.group
 * 旧选择器 .grid-adaptive>.video-card-container / .video-card-slot 命中 0 个元素。
 *
 * 本测试锁定选择器必须包含卡片本体兜底，防止再次回归。
 */

describe("BewlyBewly 视频卡片选择器", () => {
    it("选择器必须包含 .video-card 兜底（新版结构唯一可命中的选择器）", async () => {
        const fs = await import("node:fs");
        const {resolve} = await import("node:path");
        const src = fs.readFileSync(
            resolve(process.cwd(), "src/web/pages/home/BEWLYCommon.ts"), "utf8"
        );
        const match = src.match(/const homeVideoCardListSelector = \[([\s\S]*?)\]\.join/);
        expect(match, "未找到 homeVideoCardListSelector 定义").not.toBeNull();
        const selectorBlock = match![1];
        expect(selectorBlock).toContain("'.video-card'");
    });

    it("选择器保留旧版结构兼容（1.6.5 / ≤1.7.x / 1.8.0+）", async () => {
        const fs = await import("node:fs");
        const {resolve} = await import("node:path");
        const src = fs.readFileSync(
            resolve(process.cwd(), "src/web/pages/home/BEWLYCommon.ts"), "utf8"
        );
        const match = src.match(/const homeVideoCardListSelector = \[([\s\S]*?)\]\.join/);
        const selectorBlock = match![1];
        expect(selectorBlock).toContain(".video-card-container");
        expect(selectorBlock).toContain(".video-card-slot");
        expect(selectorBlock).toContain(".virtual-item");
    });

    it("标题与UP主提取兼容新旧两种结构", async () => {
        const fs = await import("node:fs");
        const {resolve} = await import("node:path");
        const src = fs.readFileSync(
            resolve(process.cwd(), "src/web/pages/home/BEWLYCommon.ts"), "utf8"
        );
        // 标题：旧 .video-card-title>a，新 h3.keep-two-lines a
        expect(src).toContain(".video-card-title>a");
        expect(src).toContain("h3.keep-two-lines a");
        // UP 主：旧 .channel-name，新 a.channel-name
        expect(src).toContain("a.channel-name");
    });

    it("屏蔽按钮插入点必须有兜底，不能因结构变更而静默消失", async () => {
        const fs = await import("node:fs");
        const {resolve} = await import("node:path");
        const src = fs.readFileSync(
            resolve(process.cwd(), "src/web/pages/home/BEWLYCommon.ts"), "utf8"
        );
        // 必须有 ?? el 兜底
        expect(src).toMatch(/insertionPositionEl[\s\S]{0,300}\?\?\s*el\b/);
    });
});
