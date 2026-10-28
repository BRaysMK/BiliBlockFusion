/**
 * 主面板主题同步（Fluent 2 令牌驱动）
 *
 * B 站深色主题通过 html/body 上的 bili_dark 类标记，但部分页面（如空间页）没有该类，
 * 而是靠 B 站自己的深色 CSS 变量驱动，因此检测需三重兜底。
 *
 * 与旧实现的差异：
 * - 旧实现用 @resource 远程拉取 Element Plus 的深色 CSS 并把 html.dark 改写成 :root 注入；
 * - 新实现改用 Fluent 2 令牌（亮/暗两套 459 个令牌随产物内联），只切换面板根节点的
 *   .gz-theme-light / .gz-theme-dark 类，不再依赖远程资源，离线可用且无 @resource 声明。
 *
 * 深色检测逻辑（三重兜底）保持不变——这是踩过坑的资产：
 * 空间页深色时 html/body 上没有 bili_dark 类，只能靠 --bg1 的固定值判定。
 */
import {applyThemeClass, installFluentTokens, type ThemeMode} from './theme/fluentVars.ts';

/** 主面板根节点选择器（与 elUtil.createVueDiv 创建的容器对应） */
const PANEL_ROOT_SELECTOR = '[gz-fluent-root]';

/** MutationObserver 实例，避免重复创建 */
let observer: MutationObserver | null = null;

/** 当前主题模式缓存，避免无意义的重复应用 */
let currentMode: ThemeMode | null = null;

/**
 * 判断当前是否 B 站深色主题
 * @returns 是否深色
 */
const isBiliDark = (): boolean => {
    return document.documentElement.classList.contains('bili_dark')
        || document.body.classList.contains('bili_dark')
        || isBiliDarkByCssVar();
}

/**
 * B 站深色主题统一 CSS 变量特征检测
 *
 * 部分页面（如空间页 space.bilibili.com）深色时 html/body 上没有 bili_dark 类，
 * 而是通过 B 站深色主题 CSS 变量驱动（--bg1 等）。实测深色时 --bg1 恒为 #17181A，
 * 跨页面一致，可作为无类页面下的可靠深色标记。
 * @returns 是否命中 B 站深色变量特征
 */
const isBiliDarkByCssVar = (): boolean => {
    const bg1 = getComputedStyle(document.body).getPropertyValue('--bg1').trim().toLowerCase();
    // B 站深色主题的 --bg1 固定值：#17181A
    return bg1 === '#17181a';
}

/**
 * 把当前主题应用到主面板根节点
 *
 * 面板尚未挂载时静默跳过：init 流程里主题同步可能先于 Vue 挂载完成。
 */
const syncTheme = (): void => {
    const mode: ThemeMode = isBiliDark() ? 'dark' : 'light';
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
}
