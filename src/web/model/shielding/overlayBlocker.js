/**
 * 叠加层屏蔽模块 (Overlay Blocker)
 *
 * 移植自脚本A (tjxwork) 的 blockedOrUnblocked / addHiddenOrOverlay / removeHiddenOrOverlay
 * CSS 类名统一加 bb_ 前缀，避免与脚本B的 gz_ 前缀冲突。
 *
 * 原脚本A函数 → 合并后函数:
 *   blockedOrUnblocked()          → applyOverlayOrHide()
 *   addHiddenOrOverlay()          → createOverlay()
 *   removeHiddenOrOverlay()       → removeOverlay()
 *   syncBlockedOverlayAndParentNodeRect() → syncOverlaySize()
 */

import { tjxGetOverlaySettings } from './tjxworkCompat.js';

const OVERLAY_CLASS = 'bb_overlay';
const HIDE_AD_CLASS = 'bb_hide_ad';

/**
 * 获取叠加层相关设置
 */
function getSettings() {
    const s = tjxGetOverlaySettings();
    if (!s) {
        // 回退到本地设置: overlayMode = 非隐藏模式
        const hideVideoMode = GM_getValue('hide_video_mode', false);
        return {
            overlayMode: !hideVideoMode,
            hideVideoMode: hideVideoMode,
            onlyDisplayType: GM_getValue('overlay_only_type', false),
        };
    }
    return s;
}

/**
 * 在视频元素上创建屏蔽叠加层
 *
 * @param {Element} el - 视频卡片元素
 * @param {string} blockedReason - 被屏蔽的原因文本
 * @param {boolean} [setTimeoutMode=false] - 是否为延迟模式(视频播放页 card-box)
 */
function createOverlay(el, blockedReason, setTimeoutMode = false) {
    // 已有叠加层则跳过
    if (el.querySelector('.' + OVERLAY_CLASS)) return;

    const settings = getSettings();

    // 隐藏模式：直接设置 display:none
    if (settings.hideVideoMode) {
        // 搜索页特殊处理：修改父元素
        if (window.location.href.startsWith('https://search.bilibili.com/')) {
            el.parentNode.style.display = 'none';
            el.style.display = 'none';
            return;
        }
        // feed-card / bili-feed-card 父级处理
        const feedCard = el.closest('div.feed-card');
        if (feedCard) {
            feedCard.style.display = 'none';
            el.style.display = 'none';
            return;
        }
        const biliFeedCard = el.closest('div.bili-feed-card');
        if (biliFeedCard) {
            biliFeedCard.style.display = 'none';
            el.style.display = 'none';
            return;
        }
        el.style.display = 'none';
        return;
    }

    // 视频播放页 card-box 延迟处理 (避免渲染 Bug)
    if (el.firstElementChild && el.firstElementChild.className === 'card-box' && !setTimeoutMode) {
        el.style.filter = 'blur(5px)';
        setTimeout(() => {
            createOverlay(el, blockedReason, true);
            el.style.filter = 'none';
        }, 3000);
        return;
    }

    // 叠加层模式
    const rect = el.getBoundingClientRect();
    const overlay = document.createElement('div');
    overlay.className = OVERLAY_CLASS;
    overlay.style.cssText = `
        position: absolute;
        width: ${rect.width}px;
        height: ${rect.height}px;
        background-color: rgba(60, 60, 60, 0.85);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10;
        backdrop-filter: blur(6px);
        border-radius: 6px;
    `;

    const text = document.createElement('div');
    if (el.firstElementChild && el.firstElementChild.className === 'card-box') {
        text.style.fontSize = '1.25em';
    }
    text.textContent = blockedReason;
    text.style.color = 'rgb(250,250,250)';
    overlay.appendChild(text);

    el.insertAdjacentElement('afterbegin', overlay);
}

/**
 * 移除视频元素上的屏蔽叠加层/隐藏
 *
 * @param {Element} el - 视频卡片元素
 */
function removeOverlay(el) {
    const settings = getSettings();

    if (settings.hideVideoMode) {
        // 恢复隐藏
        if (window.location.href.startsWith('https://search.bilibili.com/')) {
            el.parentNode.style.display = '';
            el.style.display = '';
            return;
        }
        const feedCard = el.closest('div.feed-card');
        if (feedCard) {
            feedCard.style.display = '';
            el.style.display = '';
            return;
        }
        const biliFeedCard = el.closest('div.bili-feed-card');
        if (biliFeedCard) {
            biliFeedCard.style.display = '';
            el.style.display = '';
            return;
        }
        el.style.display = '';
    } else {
        // 删除叠加层
        const overlay = el.querySelector('.' + OVERLAY_CLASS);
        if (overlay) {
            el.removeChild(overlay);
        }
    }
}

/**
 * 根据屏蔽状态决定添加或移除叠加层
 *
 * @param {Element} el - 视频元素
 * @param {boolean} isBlocked - 是否应被屏蔽
 * @param {boolean} isWhitelist - 是否在白名单
 * @param {string} blockedReason - 屏蔽原因文字
 */
function applyOverlayOrHide(el, isBlocked, isWhitelist, blockedReason) {
    const hasOverlay = el.querySelector('.' + OVERLAY_CLASS);
    const isHidden = el.style.display === 'none';
    const alreadyBlocked = hasOverlay || isHidden;

    // 白名单 + 已屏蔽 → 解除屏蔽
    if (isWhitelist && isBlocked && alreadyBlocked) {
        removeOverlay(el);
        return;
    }
    // 白名单 + 已屏蔽 → 跳过 (已在上面处理)
    // 非白名单 + 已屏蔽 + 已处理 → 跳过
    if (!isWhitelist && isBlocked && alreadyBlocked) {
        return;
    }
    // 非白名单 + 应屏蔽 + 未处理 → 添加屏蔽
    if (!isWhitelist && isBlocked && !alreadyBlocked) {
        createOverlay(el, blockedReason);
    }
}

/**
 * 同步所有叠加层尺寸 (用于窗口 resize)
 */
function syncOverlaySize() {
    document.querySelectorAll('.' + OVERLAY_CLASS).forEach(overlay => {
        const parent = overlay.parentNode;
        if (!parent) return;
        const rect = parent.getBoundingClientRect();
        overlay.style.width = rect.width + 'px';
        overlay.style.height = rect.height + 'px';
    });
}

// ==================== 初始化 ====================

// 窗口 resize 时同步叠加层尺寸 (debounce 避免拖拽窗口时频繁重排)
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(syncOverlaySize, 150);
});

export {
    createOverlay,
    removeOverlay,
    applyOverlayOrHide,
    syncOverlaySize,
    OVERLAY_CLASS,
    HIDE_AD_CLASS,
};

export default {
    createOverlay,
    removeOverlay,
    applyOverlayOrHide,
    syncOverlaySize,
};
