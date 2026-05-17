import elUtil from "../../utils/elUtil.js";
import ruleKeyListData from "../../data/ruleKeyListData.js";
import ruleMatchingUtil from "../../utils/ruleMatchingUtil.js";
import {eventEmitter} from "../../model/EventEmitter.js";
import {isHideHotSearchesPanelGm, isHideSearchHistoryPanelGm} from "../../data/localMKData.js";

//处理热搜词
const dealingWithHotSearchTerms = (el, label) => {
    const hotSearchKeyArr = ruleKeyListData.getHotSearchKeyArr();
    const hotSearchKeyCanonicalArr = ruleKeyListData.getHotSearchKeyCanonicalArr();
    let match = ruleMatchingUtil.fuzzyMatch(hotSearchKeyArr, label);
    if (match) {
        el.remove();
        eventEmitter.send('打印信息', `根据模糊热搜关键词-【${match}】-屏蔽-${label}`);
        return;
    }
    match = ruleMatchingUtil.regexMatch(hotSearchKeyCanonicalArr, label);
    if (match) {
        eventEmitter.send('打印信息', `根据正则热搜关键词-【${match}】-屏蔽-${label}`);
        el.remove();
    }
};

/**
 * 开始屏蔽热门搜索
 * @returns {Promise<void>|null}
 */
export const startShieldingHotList = async () => {
    if (isHideHotSearchesPanelGm()) {
        return;
    }
    console.log("检查热搜关键词中...");
    const elList = await elUtil.findElements(".trendings-col>.trending-item,.trendings-single>.trending-item",
        {interval: 2000})
    console.log('热搜元素列表', elList);
    for (let el of elList) {
        const label = el.textContent.trim()
        dealingWithHotSearchTerms(el, label);
    }
}

/**
 * //处理动态首页右侧热搜列表
 * @returns {Promise<void>|null}
 */
const startShieldingHotListDynamic = async () => {
    const elList = await elUtil.findElements('.trending-list>a');
    console.log('动态首页右侧热搜列表', elList);
    for (const el of elList) {
        const label = el.querySelector('.text').textContent.trim();
        dealingWithHotSearchTerms(el, label);
    }
}


/**
 * 设置顶部搜索框中的历史记录面板和热搜面板显示状态
 * 使用 CSS 注入方式，比查找元素更可靠
 */
const setTopSearchPanelDisplay = (hide, name = "搜索历史") => {
    const id = name === "搜索历史" ? 'mk-hide-search-history' : 'mk-hide-search-trending';
    // 覆盖新版和旧版选择器
    const selectors = name === "搜索历史"
        ? `.search-panel>.history, .bili-header__search-panel .history, .search-panel .history-tab`
        : `.search-panel>.trending, .bili-header__search-panel .trending, .search-panel .trending-tab`;
    const cssText = hide ? `${selectors} { display: none !important; }` : '';
    elUtil.installStyle(cssText, {type: 'id', value: id});
    const msg = name === "搜索历史" ? "搜索历史" : "热搜";
    eventEmitter.send('打印信息', `已将顶部搜索框${msg}显示状态设置为${hide ? '隐藏' : '显示'}`)
}

const run = () => {
    setTopSearchPanelDisplay(isHideSearchHistoryPanelGm());
    setTopSearchPanelDisplay(isHideHotSearchesPanelGm(), "热搜");
}


export default {
    startShieldingHotList,
    setTopSearchPanelDisplay,
    run,
    startShieldingHotListDynamic
}
