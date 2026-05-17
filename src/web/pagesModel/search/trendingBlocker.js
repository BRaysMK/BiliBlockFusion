/**
 * 热搜屏蔽模块 (Trending Blocker)
 *
 * 移植自脚本A (tjxwork) 的 getTrendingItemElements / handleBlockedTrendingItemElements 等
 * CSS 类名统一加 bb_ 前缀
 */

import { blockExactOrRegex } from '../../utils/universalMatcher.js';
import { tjxGetOverlaySettings } from '../../model/shielding/tjxworkCompat.js';

const OVERLAY_CLASS = 'bb_overlay';

/**
 * 获取所有热搜项元素
 */
function getTrendingItems() {
    return document.querySelectorAll('div.trending-item');
}

/**
 * 对热搜项应用隐藏或叠加层
 */
function applyTrendingBlock(trendingItem, blockedReason) {
    const settings = tjxGetOverlaySettings();
    const hideMode = settings ? settings.hideVideoMode : GM_getValue('hide_video_mode', false);

    if (hideMode) {
        trendingItem.style.display = 'none';
        return;
    }

    // 叠加层模式
    if (trendingItem.querySelector('.' + OVERLAY_CLASS)) return;
    const rect = trendingItem.getBoundingClientRect();

    const overlay = document.createElement('div');
    overlay.className = OVERLAY_CLASS;
    overlay.style.cssText = `
        position: absolute;
        width: ${rect.width}px;
        height: ${rect.height}px;
        transform: translateX(-16px);
        background-color: rgba(60, 60, 60, 0.85);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10;
        backdrop-filter: blur(6px);
        border-radius: 6px;
    `;

    const text = document.createElement('div');
    text.textContent = blockedReason;
    text.style.color = 'rgb(250,250,250)';
    overlay.appendChild(text);

    trendingItem.insertAdjacentElement('afterbegin', overlay);
}

/**
 * 处理单个热搜项的屏蔽检查
 *
 * @param {Element} trendingItem - 热搜项DOM元素
 * @param {string[]} ruleArray - 屏蔽规则数组
 * @param {boolean} useRegex - 是否启用正则
 */
function checkAndBlockTrendingItem(trendingItem, ruleArray, useRegex) {
    // 已处理过则跳过
    if (trendingItem.style.display === 'none' || trendingItem.querySelector('.' + OVERLAY_CLASS)) {
        return;
    }
    const textContent = trendingItem.textContent || '';
    const result = blockExactOrRegex(textContent, ruleArray, useRegex, '热搜屏蔽');
    if (result.state) {
        applyTrendingBlock(trendingItem, result.matching);
    }
}

/**
 * 主运行函数 — 扫描并屏蔽热搜项
 */
function run() {
    const settings = tjxGetOverlaySettings();
    if (!settings) return;

    // 隐藏热搜模块
    if (settings.hideTrending) {
        document.querySelectorAll('div.trending').forEach(el => {
            el.style.display = 'none';
        });
    }

    const items = getTrendingItems();
    if (items.length === 0) return;

    items.forEach(item => {
        // 按关键字屏蔽热搜项
        if (settings.blockedTrending && settings.trendingArray.length > 0) {
            checkAndBlockTrendingItem(item, settings.trendingArray, settings.trendingUseRegex);
        }

        // 按已有的标题项屏蔽热搜项
        if (settings.blockedTrendingByTitleTag) {
            const tjxSettings = GM_getValue('GM_blockedParameter', null);
            if (tjxSettings && tjxSettings.blockedTitle_Array && tjxSettings.blockedTitle_Array.length > 0) {
                checkAndBlockTrendingItem(item, tjxSettings.blockedTitle_Array, tjxSettings.blockedTitle_UseRegular !== false);
            }
        }
    });
}

export default {
    run,
    getTrendingItems,
    checkAndBlockTrendingItem,
};
