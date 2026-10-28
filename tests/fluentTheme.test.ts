import {describe, expect, it, vi} from "vitest";

/**
 * Fluent 2 主题层回归测试
 *
 * 覆盖三件事：
 * 1. 品牌色阶完整（16 档），且亮/暗主题都能正确产出 B 站粉品牌色；
 * 2. 令牌 → CSS 变量 的命名转换正确（camelCase → --fluent-kebab-case）；
 * 3. 中文字体栈已追加（否则中文回退衬线体，观感劣化）。
 */

const stubDom = (): void => {
    vi.stubGlobal("document", {
        getElementById: () => null,
        createElement: () => ({id: "", textContent: "", setAttribute: () => {}}),
        head: {appendChild: () => {}},
        body: {classList: {toggle: () => {}}},
    });
};

describe("Fluent 2 主题层", () => {
    it("品牌色阶是完整的 16 档", async () => {
        const {biliBrand} = await import("../src/web/ui/theme/fluentBrand.ts");
        const levels = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160];
        for (const lv of levels) {
            expect(biliBrand[lv as keyof typeof biliBrand], `缺少 ${lv} 档`).toBeTruthy();
        }
        expect(biliBrand[100]).toBe("#FB7299");
    });

    it("亮/暗主题都产出品牌色，且明暗不同", async () => {
        const {biliLightTheme, biliDarkTheme} = await import("../src/web/ui/theme/fluentBrand.ts");
        expect(biliLightTheme.colorBrandBackground).toBeTruthy();
        expect(biliDarkTheme.colorBrandBackground).toBeTruthy();
        expect(biliLightTheme.colorBrandBackground).not.toBe(biliDarkTheme.colorBrandBackground);
    });

    it("表面层次：画布/一级/次级背景互不相同（Fluent 评审第 2 条）", async () => {
        const {biliLightTheme} = await import("../src/web/ui/theme/fluentBrand.ts");
        const canvas = biliLightTheme.colorNeutralBackground3;
        const surface = biliLightTheme.colorNeutralBackground1;
        const subtle = biliLightTheme.colorNeutralBackground2;
        expect(new Set([canvas, surface, subtle]).size).toBe(3);
    });

    it("中文字体栈已追加（否则中文回退衬线体）", async () => {
        const {biliLightTheme} = await import("../src/web/ui/theme/fluentBrand.ts");
        const font = String(biliLightTheme.fontFamilyBase);
        expect(font).toContain("Microsoft YaHei");
        // 西文栈必须保留，保证数字/英文仍是 Segoe UI 观感
        expect(font).toContain("Segoe UI");
    });

    it("令牌名转换为 --fluent-kebab-case", async () => {
        stubDom();
        const {themeToCssText} = await import("../src/web/ui/theme/fluentVars.ts");
        const css = themeToCssText({
            colorBrandBackground: "#e8507e",
            borderRadiusXLarge: "8px",
        } as any);
        expect(css).toContain("--fluent-color-brand-background:#e8507e");
        expect(css).toContain("--fluent-border-radius-x-large:8px");
    });

    it("数字后缀令牌正确拆分：Background1 → background-1（曾误转 background1）", async () => {
        stubDom();
        const {themeToCssText} = await import("../src/web/ui/theme/fluentVars.ts");
        const css = themeToCssText({colorNeutralBackground1: "#fff", fontSizeBase300: "14px"} as any);
        expect(css).toContain("--fluent-color-neutral-background-1:#fff");
        expect(css).toContain("--fluent-font-size-base-300:14px");
    });

    it("数字型令牌值也要注入：字重 600 不能丢（曾因只处理 string 而缺失）", async () => {
        stubDom();
        const {themeToCssText} = await import("../src/web/ui/theme/fluentVars.ts");
        const css = themeToCssText({fontWeightSemibold: 600} as any);
        expect(css).toContain("--fluent-font-weight-semibold:600");
    });

    it("桥接 CSS 引用的每个变量都能在令牌里解析（防止静默失效）", async () => {
        stubDom();
        const {themeToCssText} = await import("../src/web/ui/theme/fluentVars.ts");
        const {biliLightTheme} = await import("../src/web/ui/theme/fluentBrand.ts");
        // 用 process.cwd() 定位：vitest 以项目根为 cwd，jsdom 环境下 ?raw 导入不可靠
        const {readFileSync} = await import("node:fs");
        const {resolve} = await import("node:path");
        const bridge = readFileSync(resolve(process.cwd(), "src/web/ui/theme/elementPlusBridge.css"), "utf8");
        const referenced = [...new Set([...bridge.matchAll(/var\((--fluent-[a-z0-9-]+)/g)].map(m => m[1]))];
        const defined = new Set(themeToCssText(biliLightTheme).split(";").map(d => d.split(":")[0]));
        const missing = referenced.filter(v => !defined.has(v));
        expect(missing, "桥接引用了不存在的令牌: " + missing.join(", ")).toEqual([]);
        expect(referenced.length).toBeGreaterThan(30);
    });

    it("字号令牌满足可读性下限：正文 14px、次级 12px，无 11px", async () => {
        const {biliLightTheme} = await import("../src/web/ui/theme/fluentBrand.ts");
        expect(biliLightTheme.fontSizeBase300).toBe("14px");
        expect(biliLightTheme.fontSizeBase200).toBe("12px");
        // 全主题不应出现 11px 字号令牌
        const sizes = Object.entries(biliLightTheme)
            .filter(([k]) => k.startsWith("fontSize"))
            .map(([, v]) => String(v));
        expect(sizes).not.toContain("11px");
    });
});