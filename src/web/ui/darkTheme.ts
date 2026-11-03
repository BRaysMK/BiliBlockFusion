/**
 * 主面板主题同步（Fluent 2 令牌驱动）
 *
 * 令牌随产物内联，只切换面板根节点的 .gz-theme-light / .gz-theme-dark 类，不依赖远程资源。
 * 深色检测必须三重兜底：空间页深色时 html/body 上没有 bili_dark 类，只能靠 --bg1 判定。
 */
import {applyThemeClass, installFluentTokens, type ThemeMode} from './theme/fluentVars.ts';

/** 主面板根节点选择器（与 elUtil.createVueDiv 创建的容器对应） */
const PANEL_ROOT_SELECTOR = '[gz-fluent-root]';

/** MutationObserver 实例，避免重复创建 */
let observer: MutationObserver | null = null;

/** 当前主题模式缓存，避免无意义的重复应用 */
let currentMode: ThemeMode | null = null;

/** 主题设置：light / dark 强制固定，auto 跟随 B 站。键名沿用 1.1.0 的 dark_mode_state */
export type ThemeModeSetting = 'light' | 'auto' | 'dark';

const THEME_MODE_KEY = 'dark_mode_state';

const getThemeModeSetting = (): ThemeModeSetting => {
    // GM_getValue 的类型从默认值推成字面量 'auto'，存量值可能是任何字符串，需放宽后再校验
    const mode: string = GM_getValue(THEME_MODE_KEY, 'auto');
    return mode === 'light' || mode === 'dark' ? mode : 'auto';
}

/**
 * 手动切换主题
 *
 * 必须清掉 currentMode 缓存再同步：设置页把「自动」切成与当前实际主题相同的那一档时，
 * 缓存会让 syncTheme 直接返回，面板看起来毫无反应。
 */
const applyThemeMode = (mode: ThemeModeSetting): void => {
    GM_setValue(THEME_MODE_KEY, mode);
    currentMode = null;
    syncTheme();
}

/**
 * 判断当前是否 B 站深色主题
 * @returns 是否深色
 */
const isBiliDark = (): boolean => {
    return document.documentElement.classList.contains('bili_dark')
        || document.body.classList.contains('bili_dark')
        // 新版 B 站/BewlyCat：深色态是 html.dark（不带 bili_dark 前缀）
        || document.documentElement.classList.contains('dark')
        || document.body.classList.contains('dark')
        || isBiliDarkByCssVar();
}

/**
 * 按 --bg1 的亮度判断深色
 *
 * 不能再做精确值比对：新版主题改用 hsl() 写法，BewlyCat 还会覆写成自定义色。
 */
const isBiliDarkByCssVar = (): boolean => {
    const bg1 = getComputedStyle(document.body).getPropertyValue('--bg1').trim().toLowerCase();
    if (bg1 === '') return false;
    // B 站深色主题的 --bg1 历史上是固定值 #17181A；
    // 但新版主题改用 hsl() 写法（如 hsl(230 12% 4%)），且 BewlyCat 会覆写为自定义色，
    // 因此不能再做精确值比对，改为「解析出亮度，低于阈值即判深色」。
    const rgb = cssColorToRgb(bg1);
    if (rgb === null) return false;
    // 相对亮度（ITU-R BT.601），0=黑 255=白
    const luminance = 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2];
    return luminance < 128;
}

/** 把 CSS 颜色字符串解析为 RGB 三元组，支持 #rgb / #rrggbb / rgb() / rgba() / hsl() / hsla() */
const cssColorToRgb = (color: string): [number, number, number] | null => {
    const hex = color.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (hex !== null) {
        const h = hex[1];
        const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
        return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16)];
    }
    const rgb = color.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i);
    if (rgb !== null) {
        return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
    }
    const hsl = color.match(/^hsla?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%/i);
    if (hsl !== null) {
        const [r, g, b] = hslToRgb(Number(hsl[1]), Number(hsl[2]) / 100, Number(hsl[3]) / 100);
        return [r, g, b];
    }
    return null;
}

/** HSL(0-360, 0-1, 0-1) → RGB(0-255) */
const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const hp = ((h % 360) + 360) % 360 / 60;
    const x = c * (1 - Math.abs((hp % 2) - 1));
    let r = 0, g = 0, b = 0;
    if (hp < 1) [r, g, b] = [c, x, 0];
    else if (hp < 2) [r, g, b] = [x, c, 0];
    else if (hp < 3) [r, g, b] = [0, c, x];
    else if (hp < 4) [r, g, b] = [0, x, c];
    else if (hp < 5) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];
    const m = l - c / 2;
    return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

/** 把当前主题应用到主面板根节点；面板尚未挂载时静默跳过 */

const syncTheme = (): void => {
    const setting = getThemeModeSetting();
    const mode: ThemeMode = setting === 'auto' ? (isBiliDark() ? 'dark' : 'light') : setting;
    if (mode === currentMode) return;
    const root = document.querySelector<HTMLElement>(PANEL_ROOT_SELECTOR);
    if (root === null) return;
    applyThemeClass(root, mode);
    currentMode = mode;
}

/**
 * 启动主题同步：注入令牌样式 + 监听 bili_dark 类变化 + 跟随 B 站主题实时切换
 */
const startThemeSync = (): void => {
    // 令牌样式随产物内联，注入一次即可
    installFluentTokens();

    if (observer) return;
    observer = new MutationObserver(() => {
        syncTheme();
    });
    observer.observe(document.documentElement, {attributes: true, attributeFilter: ['class']});
    observer.observe(document.body, {attributes: true, attributeFilter: ['class']});

    // 初始同步（面板可能尚未挂载，故用轮询兜底直到根节点出现）
    syncTheme();
    if (document.querySelector(PANEL_ROOT_SELECTOR) === null) {
        const timer = setInterval(() => {
            if (document.querySelector(PANEL_ROOT_SELECTOR) !== null) {
                syncTheme();
                clearInterval(timer);
            }
        }, 200);
        // 最多等 10 秒，避免页面异常时轮询常驻
        setTimeout(() => clearInterval(timer), 10000);
    }
}

export default {
    isBiliDark,
    isBiliDarkByCssVar,
    startThemeSync,
    getThemeModeSetting,
    applyThemeMode,
}