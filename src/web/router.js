import bilibiliHome from './pagesModel/home/bilibiliHome.js'
import searchModel from "./pagesModel/search/searchModel.js";
import videoPlayModel from "./pagesModel/videoPlay/videoPlayModel.js";
import collectionVideoPlayPageModel from "./pagesModel/videoPlay/collectionVideoPlayPageModel.js";
import videoPlayWatchLater from "./pagesModel/videoPlay/videoPlayWatchLater.js";
import newHistory from "./pagesModel/history/newHistory.js";
import hotSearch from "./pagesModel/search/hotSearch.js";
import messagePage from "./pagesModel/message/messagePage.js";
import topInput from "./pagesModel/search/topInput.js";
import space from "./pagesModel/space/space.js";
import {eventEmitter} from "./model/EventEmitter.js";
import globalValue from "./data/globalValue.js";
import dynamicPage from "./pagesModel/dynamic/dynamicPage.js";
import videoPlayPageCommon from "./pagesModel/videoPlay/videoPlayPageCommon.js";
import userProfile from "./pagesModel/userProfile.js";
import BEWLYCommon from "./pagesModel/home/BEWLYCommon.js";
import BEWLYSearch from "./pagesModel/search/BEWLYSearch.js";
import searchUserTab from "./pagesModel/search/searchUserTab.js";
import urlUtil from "./utils/urlUtil.js";
import msgWhisper from "./pagesModel/message/msgWhisper.js";
import cssManager from "./model/cssManager.js";
import trendingBlocker from "./pagesModel/search/trendingBlocker.js";
import nonVideoElementHider from "./pagesModel/home/nonVideoElementHider.js";

const homeStaticRoute = (title, url) => {
    const isBewlyPage = BEWLYCommon.isBEWLYPage(url);
    if (isBewlyPage) {
        cssManager.clearBewlyCatStyle()
    }
    if (isBewlyPage && globalValue.compatibleBEWLYBEWLY) {
        BEWLYCommon.run(url)
    }
    if (bilibiliHome.isHome(url, title)) {
        BEWLYCommon.check_BEWLYPage_compatibility()
        eventEmitter.send('通知屏蔽');
        if (globalValue.compatibleBEWLYBEWLY) return;
        bilibiliHome.run();
        trendingBlocker.run();
    }
}

/**
 * 静态路由
 * @param title {string} 标题
 * @param url {string} url地址
 */
const staticRoute = (title, url) => {
    homeStaticRoute(title, url)
    hotSearch.run();
    cssManager.run(url, title);
    nonVideoElementHider.run();
    if (globalValue.bOnlyTheHomepageIsBlocked) return;
    topInput.processTopInputContent()
    hotSearch.startShieldingHotList()
    eventEmitter.send('通知屏蔽')
    if (searchModel.isSearch(url)) {
        searchModel.delFooterContent()
    }
    if (videoPlayModel.isVideoPlayPage(url)) {
        videoPlayModel.findTheExpandButtonForTheListOnTheRightAndBindTheEvent();
        videoPlayModel.run();
        userProfile.run();
        videoPlayPageCommon.insertUserProfileShieldButton();
    }
    if (collectionVideoPlayPageModel.iscCollectionVideoPlayPage(url)) {
        collectionVideoPlayPageModel.findTheExpandButtonForTheListOnTheRightAndBindTheEvent();
        videoPlayPageCommon.insertTagShieldButton()
        userProfile.run()
        videoPlayPageCommon.insertUserProfileShieldButton();
    }
    if (videoPlayWatchLater.isVideoPlayWatchLaterPage(url)) {
        videoPlayWatchLater.findTheExpandButtonForTheListOnTheRightAndBindTheEvent();
        videoPlayPageCommon.insertTagShieldButton()
        userProfile.run()
        videoPlayPageCommon.insertUserProfileShieldButton();
    }
    if (newHistory.isNewHistoryPage(url)) {
        newHistory.startRun()
    }
    if (messagePage.isMessagePage(url)) {
        messagePage.modifyTopItemsZIndex()
        const parseUrl = urlUtil.parseUrl(url);
        msgWhisper.checkMsgListIntervalExecutor.setExecutorStatus(msgWhisper.isChatWindowInterface(parseUrl));
    }
    if (space.isSpacePage()) {
        userProfile.run()
        space.executeSetChargingVideosVisible()
        space.executeSetLiveReplayVideosVisible()
        space.getUserInfo().then(userInfo => {
            console.info('userInfo', userInfo)
        })
    }
    if (dynamicPage.isUrlDynamicHomePage()) {
        dynamicPage.run()
        userProfile.run()
        dynamicPage.runHideBackToOldVersionButFun()
    }
    if (dynamicPage.isUrlDynamicContentPage()) {
        userProfile.run()
    }
    if (BEWLYSearch.isUrlPage(url, title)) {
        BEWLYSearch.run(url)
    }
    if (searchUserTab.isUrlPage(url)) {
        searchUserTab.userListInsertionButton()
    }
}

/**
 * 动态路由
 * @param title {string} 标题
 * @param url {string} url地址
 */
const dynamicRouting = (title, url) => {
    if (globalValue.bOnlyTheHomepageIsBlocked) return;
    if (searchUserTab.isUrlPage(url)) {
        searchUserTab.userListInsertionButton()
    }
    if (messagePage.isMessagePage(url)) {
        const parseUrl = urlUtil.parseUrl(url);
        msgWhisper.checkMsgListIntervalExecutor.setExecutorStatus(msgWhisper.isChatWindowInterface(parseUrl));
    }
    eventEmitter.send('通知屏蔽');
}

export default {
    staticRoute,
    dynamicRouting
}
