/**
 * 叠加层屏蔽（Overlay Blocker）
 *
 * 设计来源：原版 BiBiBSPUserVideoMonkeyScript 直接删除/隐藏卡片节点，
 * 但 BewlyBewly 是 Vue 虚拟列表，删除 .video-card 后其外层 Vue 组件外壳
 * <div> 仍保留原高度（实测 302px），导致网格中出现大量空壳占位、
 * 页面出现大片空白，后续卡片无法顶上来。
 *
 * 本模块改为在卡片上覆盖一层半透明遮罩：
 * - 不删除节点、不修改 display，网格布局完全不受影响，后续卡片自然重排；
 * - 遮罩上显示屏蔽原因，比直接消失更易排查；
 * - 幂等：重复调用不会叠加多层遮罩。
 */

/** 遮罩元素的 class，用于识别与移除 */
export const OVERLAY_CLASS = 'gz_overlay';

/**
 * 在视频卡片上创建屏蔽遮罩
 *
 * 实现要点：
 * 1. 卡片实测为 position:static，绝对定位子元素需要一个定位基准，故临时设为 relative；
 * 2. 遮罩用 inset:0 而非固定像素宽高——卡片尺寸随窗口/列数变化，固定像素会失效，
 *    原版需要额外监听 resize 同步尺寸，这里不需要；
 * 3. pointer-events:none 保证遮罩不拦截点击（用户仍可点进卡片查看）；
 * 4. border-radius:inherit 让遮罩圆角与卡片一致。
 *
 * @param el 视频卡片元素
 * @param reason 屏蔽原因文本（如「模糊标题: xxx」）
 */
export const createOverlay = (el: HTMLElement, reason: string): void => {
    // 幂等：已有遮罩直接返回，避免重复叠加
    if (el.querySelector('.' + OVERLAY_CLASS) !== null) return;

    // 绝对定位需要一个定位基准
    if (getComputedStyle(el).position === 'static') {
        el.style.position = 'relative';
    }

    const overlay = document.createElement('div');
    overlay.className = OVERLAY_CLASS;
    overlay.setAttribute('gz_overlay_reason', reason);
    overlay.style.cssText = [
        'position:absolute',
        'inset:0',
        'z-index:10',
        'display:flex',
        'align-items:center',
        'justify-content:center',
        'padding:8px',
        'box-sizing:border-box',
        'background-color:rgba(60,60,60,0.85)',
        'backdrop-filter:blur(6px)',
        '-webkit-backdrop-filter:blur(6px)',
        'border-radius:inherit',
        'color:rgb(250,250,250)',
        'font-size:13px',
        'line-height:1.4',
        'text-align:center',
        'word-break:break-all',
        // 不拦截点击：用户仍可点进卡片
        'pointer-events:none',
    ].join(';');
    overlay.textContent = reason;
    el.appendChild(overlay);
};

/**
 * 移除卡片上的屏蔽遮罩
 *
 * 用于白名单解除屏蔽、规则被删除后恢复等场景。
 * @param el 视频卡片元素
 */
export const removeOverlay = (el: HTMLElement): void => {
    const overlay = el.querySelector('.' + OVERLAY_CLASS);
    if (overlay !== null) {
        overlay.remove();
    }
};

/**
 * 判断卡片是否已有遮罩
 * @param el 视频卡片元素
 * @returns 是否已被叠加层屏蔽
 */
export const hasOverlay = (el: HTMLElement): boolean => {
    return el.querySelector('.' + OVERLAY_CLASS) !== null;
};

/**
 * 找到卡片所在的网格项外壳（.grid-adaptive 的直接子元素）
 *
 * 为什么需要这个：BewlyBewly 的网格项是一个包裹层，结构为
 *   .grid-adaptive > div(网格项) > div > div.video-card
 * 只删除 .video-card 会留下 279px 高的空壳占位，页面出现大片空白、
 * 后续卡片无法顶上来。必须删掉整个网格项，布局才会真正重排。
 *
 * 非 Bewly 页面（没有 .grid-adaptive 祖先）直接返回卡片本身。
 * @param el 视频卡片元素
 * @returns 应当被移除的网格项元素
 */
export const findGridItem = (el: HTMLElement): HTMLElement => {
    const grid = el.closest('.grid-adaptive');
    if (grid === null) return el;
    let node: HTMLElement | null = el;
    // 向上找到 grid 的直接子元素
    while (node !== null && node.parentElement !== grid) {
        node = node.parentElement;
    }
    return node ?? el;
};

/**
 * 移除卡片（含网格项外壳），让后续卡片顶上来
 *
 * 这是「移除模式」的实现：卡片真正从 DOM 消失，网格重新排列，
 * 后面的卡片自动填充空缺。与叠加层模式互斥。
 * @param el 视频卡片元素
 */
export const removeGridItem = (el: HTMLElement): void => {
    findGridItem(el).remove();
};

export default {
    OVERLAY_CLASS,
    createOverlay,
    removeOverlay,
    hasOverlay,
};
