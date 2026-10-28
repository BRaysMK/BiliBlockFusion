/**
 * Fluent 2 令牌 → CSS 自定义属性 注入器
 *
 * 目的：把 Fluent 主题对象（459 个令牌）以 --fluent-* 形式注入到主面板根节点，
 * 让纯 CSS（含 Element Plus 变量映射）能消费 Fluent 令牌，而无需在每个组件里写 JS 样式。
 *
 * 注入位置的选择：
 * 不注入到 :root，而是注入到主面板根节点。原因是脚本运行在 B 站页面里，
 * 若把 --fluent-* 铺到 :root 会污染宿主页面（B 站自身也有一套 CSS 变量），
 * 且主面板关闭时仍常驻。注入到面板根节点可随面板一起销毁/重建。
 */
import {biliDarkTheme, biliLightTheme} from './fluentBrand.ts';
import type {Theme} from '@fluentui/tokens';

/** 主题模式 */
export type ThemeMode = 'light' | 'dark';

/**
 * 令牌名 camelCase → CSS 变量名 kebab-case
 *
 * 注意：Fluent 令牌名里含「大写缩写词」（XLarge / XXL / XXXL），
 * 朴素的正则 `([a-z0-9])([A-Z])` 只能拆出第一个大写字母，
 * 会把 borderRadiusXLarge 变成 --fluent-border-radius-xlarge，
 * 与桥接 CSS 里引用的 --fluent-border-radius-x-large 对不上（圆角静默失效）。
 * 因此需要把连续大写序列整体作为一个词拆开。
 *
 * 例：colorBrandBackground → --fluent-color-brand-background
 *     borderRadiusXLarge   → --fluent-border-radius-x-large
 *     spacingHorizontalXXL → --fluent-spacing-horizontal-xxl
 * @param tokenName Fluent 令牌名
 * @returns CSS 自定义属性名
 */
const toCssVarName = (tokenName: string): string => {
    const kebab = tokenName
        // 连续大写序列后接小写：XXLarge -> XX-Large
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
        // 小写后接大写：brandBackground -> brand-Background
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        // 字母后接数字：Background1 -> Background-1（Fluent 用数字做档位后缀）
        .replace(/([A-Za-z])([0-9])/g, '$1-$2')
        // 数字后接字母：300XL 这类极少见，保守处理
        .replace(/([0-9])([A-Za-z])/g, '$1-$2');
    return '--fluent-' + kebab.toLowerCase().replace(/-+/g, '-');
};

/**
 * 把主题对象序列化为 CSS 自定义属性声明块
 * @param theme Fluent 主题对象
 * @returns 形如 "--fluent-color-brand-background:#e8507e;--fluent-..." 的声明串
 */
export const themeToCssText = (theme: Theme): string => {
    const parts: string[] = [];
    for (const [name, value] of Object.entries(theme)) {
        // 令牌值可能是字符串（颜色/尺寸）或数字（字重 600、行高 1.5 等），
        // 只跳过对象/函数等非标量值
        if (typeof value !== 'string' && typeof value !== 'number') continue;
        parts.push(`${toCssVarName(name)}:${value}`);
    }
    return parts.join(';');
};

/** 亮/暗两套主题的 CSS 声明串（模块加载期只计算一次） */
const LIGHT_CSS = themeToCssText(biliLightTheme);
const DARK_CSS = themeToCssText(biliDarkTheme);

/** 注入的 style 节点 id */
const STYLE_ID = 'gz-fluent-tokens';

/**
 * 把亮/暗两套 Fluent 令牌注入为两个作用域下的 CSS 规则
 *
 * 作用域约定：
 * - .gz-theme-light / .gz-theme-dark 挂在主面板根节点上，面板内所有后代元素继承；
 * - 深色模式下 Element Plus 的浮层（弹窗/下拉/气泡）会被 teleport 到 body，
 *   不在面板根节点内，因此额外提供 body.gz-theme-dark 作用域兜底。
 *
 * @param target 注入的样式容器，默认 document.head
 */
export const installFluentTokens = (target: HTMLElement | Document = document.head): void => {
    if (document.getElementById(STYLE_ID) !== null) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
        `.gz-theme-light{${LIGHT_CSS}}`,
        `.gz-theme-dark,body.gz-theme-dark{${DARK_CSS}}`,
    ].join('\n');
    (target === document ? document.head : target).appendChild(style);
};

/**
 * 给面板根节点应用主题 class
 * @param el 面板根节点
 * @param mode 主题模式
 */
export const applyThemeClass = (el: HTMLElement, mode: ThemeMode): void => {
    el.classList.toggle('gz-theme-dark', mode === 'dark');
    el.classList.toggle('gz-theme-light', mode === 'light');
    // 同步 body 上的标记，供 teleport 到 body 的 EP 浮层（弹窗/下拉）取到深色令牌
    document.body.classList.toggle('gz-theme-dark', mode === 'dark');
};

export default {
    installFluentTokens,
    applyThemeClass,
    themeToCssText,
};
