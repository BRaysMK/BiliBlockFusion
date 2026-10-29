import {describe, expect, it} from "vitest";
import fs from "node:fs";
import {resolve} from "node:path";

/**
 * Bewly 首页屏蔽链路回归测试
 *
 * 历史教训（本文件锁定的关键决策）：
 * 1. 卡片选择器：BewlyCat 每次改版都会让旧选择器静默失配，表现为「屏蔽完全不生效」。
 *    新版结构 grid item 是无 class 的包裹层，卡片本体是 .video-card。
 * 2. 移除方式：只删 .video-card 会留下 279px 高的空壳占位，页面出现大片空白、
 *    后续卡片无法顶上来。必须删整个网格项外壳（.grid-adaptive 的直接子元素）。
 * 3. 补载逻辑：曾实现过 startBewlyFeedFill 自动补载，实测会导致无限加载
 *    （冻结 scrollTop 后卡片数恒定不动，证明是滚动触发），已整体移除。
 */

const readBewly = (): string =>
    fs.readFileSync(resolve(process.cwd(), "src/web/pages/home/BEWLYCommon.ts"), "utf8");

describe("Bewly 卡片选择器", () => {
    it("必须包含 .video-card 兜底（新版结构唯一可命中的选择器）", () => {
        const src = readBewly();
        const match = src.match(/const homeVideoCardListSelector = \[([\s\S]*?)\]\.join/);
        expect(match, "未找到 homeVideoCardListSelector 定义").not.toBeNull();
        expect(match![1]).toContain("'.video-card'");
    });

    it("保留旧版结构兼容（1.6.5 / ≤1.7.x / 1.8.0+）", () => {
        const src = readBewly();
        const match = src.match(/const homeVideoCardListSelector = \[([\s\S]*?)\]\.join/);
        const block = match![1];
        expect(block).toContain(".video-card-container");
        expect(block).toContain(".video-card-slot");
        expect(block).toContain(".virtual-item");
    });
});

describe("Bewly 性能优化", () => {
    it("实现了增量扫描：已扫描卡片打标记并跳过", () => {
        const src = readBewly();
        expect(src).toContain("gzScanned");
        // 必须检查标记并跳过
        expect(src).toMatch(/if\s*\([^)]*gzScanned[^)]*===\s*['"]1['"][^)]*\)\s*continue/);
    });

    it("轮询间隔已放宽到 3000ms（配合去重与增量扫描）", () => {
        const src = readBewly();
        expect(src).toContain("timeout: 3000");
    });

    it("补载逻辑已移除（曾导致无限加载）", () => {
        const src = readBewly();
        expect(src).not.toContain("startBewlyFeedFill");
        expect(src).not.toContain("triggerBewlyNativeLoad");
    });
});

describe("BV 去重（video.ts）", () => {
    const readVideo = (): string =>
        fs.readFileSync(resolve(process.cwd(), "src/web/domain/shielding/video.ts"), "utf8");

    it("实现了 processedBVs 已处理集合与上限淘汰", () => {
        const src = readVideo();
        expect(src).toContain("processedBVs");
        expect(src).toContain("MAX_PROCESSED_BVS");
        expect(src).toContain("addProcessedBV");
    });

    it("实现了 processingBVs 并发保护，且在 finally 中释放", () => {
        const src = readVideo();
        expect(src).toContain("processingBVs");
        expect(src).toMatch(/finally\s*\{[\s\S]{0,120}processingBVs\.delete/);
    });

    it("已处理 BV 在同步规则命中与异步链路结束处都被记录", () => {
        const src = readVideo();
        // 统计调用点（排除函数定义行）
        const calls = (src.match(/addProcessedBV\(/g) || []).length;
        // 3 处调用：同步规则命中、异步链路命中、异步链路未命中
        expect(calls).toBeGreaterThanOrEqual(3);
    });
});

describe("屏蔽方式三态（overlay.ts + video.ts）", () => {
    const readOverlay = (): string =>
        fs.readFileSync(resolve(process.cwd(), "src/web/domain/shielding/overlay.ts"), "utf8");
    const readVideo = (): string =>
        fs.readFileSync(resolve(process.cwd(), "src/web/domain/shielding/video.ts"), "utf8");

    it("overlay.ts 提供 createOverlay / findGridItem / removeGridItem", () => {
        const src = readOverlay();
        for (const fn of ["createOverlay", "findGridItem", "removeGridItem"]) {
            expect(src, `缺少 ${fn}`).toContain(fn);
        }
    });

    it("findGridItem 向上找到 .grid-adaptive 的直接子元素（删卡片会留空壳）", () => {
        const src = readOverlay();
        expect(src).toContain(".grid-adaptive");
        expect(src).toMatch(/parentElement\s*!==\s*grid/);
    });

    it("叠加层用 inset:0 自适应，不写死像素宽高", () => {
        const src = readOverlay();
        expect(src).toContain("inset:0");
        // 不应依赖 getBoundingClientRect 的宽高写死
        expect(src).not.toMatch(/width:\s*\$\{rect\.width\}/);
    });

    it("屏蔽处理器按三种模式分派，remove 走 removeGridItem", () => {
        const src = readVideo();
        expect(src).toContain("getShieldModeGm");
        expect(src).toContain("removeGridItem");
        expect(src).toContain("createOverlay");
    });

    it("调用方显式传 hide 时覆盖全局 shield_mode（BLBLGate 依赖）", () => {
        const src = readVideo();
        // 曾因三态重构丢掉 method，导致 BLBLGate 传的 hide 被静默忽略
        expect(src).toMatch(/method === 'hide' \? 'hide' : getShieldModeGm\(\)/);
    });
});
