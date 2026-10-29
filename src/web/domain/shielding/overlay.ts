/**
 * 叠加层屏蔽（Overlay Blocker）
 *
 * 为什么不用「删节点」：BewlyBewly 是 Vue 虚拟列表，直接删 .video-card 后外层
 * 组件外壳仍保留原高度（实测 279px），网格里出现空壳占位、后续卡片顶不上来。
 * 因此默认改成在卡片上盖一层半透明遮罩：不删节点、不改 display，布局完全不受影响。
 */

/** 遮罩元素的 class，用于识别与移除 */
export const OVERLAY_CLASS = 'gz_overlay';

/**
 * 在视频卡片上创建屏蔽遮罩（幂等：已有遮罩直接返回）
 *
 * 卡片实测为 position:static，绝对定位需要定位基准，故临时设为 relative；
 * 遮罩用 inset:0 而非固定像素宽高，卡片尺寸随窗口/列数变化时无需监听 resize；
 * pointer-events:none 保证遮罩不拦截点击，用户仍可点进卡片。
 *
 * @param el 视频卡片元素
 * @param reason 屏蔽原因文本（如「模糊标题: xxx」）
 */
export const createOverlay = (el: HTMLElement, reason: string): void => {
    if (el.querySelector('.' + OVERLAY_CLASS) !== null) return;

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
        'pointer-events:none',
    ].join(';');
    overlay.textContent = reason;
    el.appendChild(overlay);
};

/**
 * 找到卡片所在的网格项外壳（.grid-adaptive 的直接子元素）
 *
 * BewlyBewly 的网格项是包裹层：.grid-adaptive > div(网格项) > div > div.video-card。
 * 只删 .video-card 会留下 279px 高的空壳占位，必须删整个网格项布局才会重排。
 * 非 Bewly 页面（没有 .grid-adaptive 祖先）直接返回卡片本身。
 */
export const findGridItem = (el: HTMLElement): HTMLElement => {
    const grid = el.closest('.grid-adaptive');
    if (grid === null) return el;
    let node: HTMLElement | null = el;
    while (node !== null && node.parentElement !== grid) {
        node = node.parentElement;
    }
    return node ?? el;
};

/**
 * 移除卡片（含网格项外壳），让后续卡片顶上来
 *
 * 这是「移除模式」的实现：卡片真正从 DOM 消失，网格重新排列。与叠加层模式互斥。
 */
export const removeGridItem = (el: HTMLElement): void => {
    findGridItem(el).remove();
};

export default {
    OVERLAY_CLASS,
    createOverlay,
};
