/**
 * 非视频元素隐藏模块 (Non-Video Element Hider)
 *
 * 移植自脚本A (tjxwork) 的 hideNonVideoElements() [L2541]
 * 隐藏首页/搜索页/播放页的广告、直播卡片、课堂推广等非投稿视频内容
 * CSS 类名统一加 bb_ 前缀
 */

const HIDE_CLASS = 'bb_hide_ad';

/**
 * 注入隐藏 CSS 规则
 */
function injectStyle() {
    const styleId = 'bb_non_video_hider_style';
    if (document.getElementById(styleId)) return;

    GM_addStyle(`
        .${HIDE_CLASS} {
            display: none !important;
        }
    `);
}

/**
 * 首页: 隐藏广告、直播、赛事、番剧、课堂等非视频卡片
 */
function hideHomeNonVideo() {
    if (!window.location.href.startsWith('https://www.bilibili.com/')) return;

    document.querySelectorAll(`
        div.floor-single-card,
        div.feed-card:has(a[href^="//cm.bilibili.com/"]),
        div.bili-feed-card:has(a[href^="//cm.bilibili.com/"]),
        div.bili-feed-card:has(a[href^="https://live.bilibili.com/"])
    `).forEach(el => el.classList.add(HIDE_CLASS));
}

/**
 * 搜索页——综合: 隐藏推广视频、广告、直播、课堂卡片
 */
function hideSearchNonVideo() {
    if (!window.location.href.startsWith('https://search.bilibili.com/all')) return;

    document.querySelectorAll(`
        div.bili-video-card:has(a[href^="https://www.bilibili.com/cheese/"]),
        div.bili-video-card:has(a[href^="//cm.bilibili.com/"]),
        div.bili-video-card:has(a[href^="//live.bilibili.com/"])
    `).forEach(el => el.parentNode && el.parentNode.classList.add(HIDE_CLASS));
}

/**
 * 视频播放页: 隐藏广告、游戏推荐、直播卡片等
 */
function hideVideoPlayNonVideo() {
    if (!window.location.href.startsWith('https://www.bilibili.com/video/')) return;

    document.querySelectorAll(`
        div#slide_ad,
        .ad-report,
        div.video-page-game-card-small,
        div.video-page-special-card-small,
        div.video-page-operator-card-small,
        div.pop-live-small-mode,
        div.activity-m-v1,
        div.video-card-ad-small
    `).forEach(el => el.classList.add(HIDE_CLASS));
}

/**
 * 主运行函数
 */
function run() {
    const enabled = GM_getValue('hide_non_video_elements', true);
    if (!enabled) return;

    injectStyle();
    hideHomeNonVideo();
    hideSearchNonVideo();
    hideVideoPlayNonVideo();
}

export default {
    run,
    HIDE_CLASS,
};
