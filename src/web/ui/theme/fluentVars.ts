/**
 * Fluent 2 令牌 → CSS 自定义属性 注入器
 *
 * 把主题对象以 --fluent-* 注入到主面板根节点（不是 :root）：脚本跑在 B 站页面里，
 * 铺到 :root 会污染宿主页面的 CSS 变量，且面板关闭后仍常驻。
 */
import {biliDarkTheme, biliLightTheme} from './fluentBrand.ts';
import type {Theme} from '@fluentui/tokens';

/** 主题模式 */
export type ThemeMode = 'light' | 'dark';

/**
 * 令牌名 camelCase → CSS 变量名 kebab-case
 *
 * 必须把连续大写序列整体当一个词拆（XLarge → x-large）。朴素正则只能拆出第一个大写字母，
 * 会得到 --fluent-border-radius-xlarge，与桥接 CSS 引用的 --fluent-border-radius-x-large 对不上，
 * 表现为圆角静默失效。
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
 * 把亮/暗两套令牌注入为两个作用域的 CSS 规则。
 *
 * body.gz-theme-dark 是兜底：EP 的浮层会被 teleport 到 body，不在面板根节点内。
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
    // 同步 body 上的标记：Element Plus 的弹窗/下拉/气泡会被 teleport 到 body，
    // 不在面板根节点内，必须让 body 也带上同主题作用域，否则浮层拿不到 --fluent-*/--el-* 变量。
    // 浅色时同样要加 gz-theme-light，不能只加深色类，否则浅色下浮层回落到 EP 默认样式。
    document.body.classList.toggle('gz-theme-dark', mode === 'dark');
    document.body.classList.toggle('gz-theme-light', mode === 'light');
};

export default {
    installFluentTokens,
    applyThemeClass,
    themeToCssText,
};
