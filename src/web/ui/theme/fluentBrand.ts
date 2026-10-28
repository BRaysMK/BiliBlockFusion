/**
 * Fluent 2 品牌主题 —— B 站粉
 *
 * 以 B 站主色 #FB7299 作为 BrandVariants 的 100 档，向两端推导出 10~160 共 16 档色阶。
 * Fluent 2 的 createLightTheme / createDarkTheme 需要完整 16 档，缺档会导致令牌解析失败。
 *
 * 设计取舍：色阶不是简单线性插值，而是在 100 档两侧分别控制明度与饱和度的衰减速度，
 * 保证 10~60 档在深色背景上仍有足够对比度、140~160 档在浅色背景上不刺眼。
 */
import {createDarkTheme, createLightTheme, type BrandVariants, type Theme} from '@fluentui/tokens';

/** B 站主色，作为品牌色阶基准（100 档） */
export const BILI_PINK = '#FB7299';

/** 品牌色阶：以 B 站粉为 100 档的 16 档完整色阶 */
export const biliBrand: BrandVariants = {
    10: '#1a0a0e',
    20: '#2e1119',
    30: '#4a1b28',
    40: '#6b2339',
    50: '#8c2b4a',
    60: '#b0335b',
    70: '#d13d6c',
    80: '#e8507e',
    90: '#f25f8b',
    100: '#FB7299',
    110: '#fc8aab',
    120: '#fda0bb',
    130: '#fdb6cb',
    140: '#feccdb',
    150: '#fee2eb',
    160: '#fff1f5',
};

/**
 * 中文字体栈补充
 *
 * Fluent 默认的 fontFamilyBase 只有 Segoe UI 及西文回退，不含任何中文字形。
 * 界面为中文时若不追加中文字体，浏览器会回退到默认衬线体（宋体），观感立刻劣化。
 * 这里保留 Fluent 原有西文栈（保证数字/英文的 Segoe UI 观感），在其后追加 Windows 中文首选字体。
 */
const CJK_FONT_STACK = "'Microsoft YaHei UI', 'Microsoft YaHei', 'PingFang SC', 'Hiragino Sans GB', 'Noto Sans CJK SC'";

/**
 * 覆盖主题中的字体令牌，追加中文字体
 * @param theme Fluent 主题对象
 * @returns 追加中文字体后的新主题对象
 */
const withCjkFont = (theme: Theme): Theme => {
    const base = theme.fontFamilyBase;
    return {
        ...theme,
        fontFamilyBase: base.endsWith(',') ? `${base} ${CJK_FONT_STACK}` : `${base}, ${CJK_FONT_STACK}`,
        fontFamilyMonospace: theme.fontFamilyMonospace,
    };
};

/** 亮色主题（B 站粉品牌） */
export const biliLightTheme: Theme = withCjkFont(createLightTheme(biliBrand));

/** 暗色主题（B 站粉品牌） */
export const biliDarkTheme: Theme = withCjkFont(createDarkTheme(biliBrand));

export default {
    BILI_PINK,
    biliBrand,
    biliLightTheme,
    biliDarkTheme,
};
