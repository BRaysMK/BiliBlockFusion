import elUtil from "../utils/elUtil.js";
import shielding from "../model/shielding/shielding.js";
import defUtil from "../utils/defUtil.js";
import topicDetail from "./topicDetail.js";
import localMKData, {isCloseCommentBlockingGm} from "../data/localMKData.js";
import videoPlayModel from "./videoPlay/videoPlayModel.js";
import {eventEmitter} from "../model/EventEmitter.js";
import comments_shielding from "../model/shielding/comments_shielding.js";
import urlUtil from "../utils/urlUtil.js";
import {valueCache} from "../model/localCache/valueCache.js";

/**
 * 评论添加屏蔽按钮
 * @param commentsData {{}}评论数据
 */
eventEmitter.on('评论添加屏蔽按钮', (commentsData) => {
    shielding.addBlockButton({
        data: commentsData,
        maskingFunc: startShieldingComments
    }, "gz_shielding_comment_button");
})

/**
 * 获取url中的用户等级
 * 硬核会员等级为7，原h转换为7
 * @param src {string}
 * @returns {number}
 */
const getUrlUserLevel = (src) => {
    const levelMath = src?.match(/level_(.+)\.svg/) || null;
    let level = -1
    if (levelMath !== null) {
        const levelRow = levelMath[1];
        if (levelRow === 'h') {
            level = 7;
        } else {
            level = parseInt(levelRow);
        }
    }
    return level;
}

/**
 * 获取旧版用户等级
 * 旧版本的布局需要传入元素进行匹配
 * @param iEl {Element}
 * @returns {number}
 */
const getOldUserLevel = (iEl) => {
    let level
    const levelCLassName = iEl.classList[1];
    if (levelCLassName === 'level-hardcore') {
        level = 7;
    } else {
        const levelMatch = levelCLassName.match(/level-(.+)/)?.[1] || ''
        level = parseInt(levelMatch)
    }
    return level
}

//装扮数据
const decorateData = valueCache.set("decorateData", {});
const getDecorate = (el, uid, name) => {
    const newVar = {dressUpId: -1, collectionActId: -1, decoratePic: null}
    if (el === null || el === undefined) return newVar
    const decorateShadowRoot = el.shadowRoot;
    if (!decorateShadowRoot) return newVar
    const decoratePicEl = decorateShadowRoot.querySelector("img")
    if (decoratePicEl === null || decoratePicEl === undefined) return newVar
    //装扮图片url
    newVar.decoratePic = decoratePicEl.src;
    const decorateAEl = decorateShadowRoot.querySelector("a")
    if (!decorateAEl) return newVar
    const decorateHref = decorateAEl.href;
    const parseUrl = urlUtil.parseUrl(decorateHref);
    //装扮id，如是收藏集均为0
    const itemIdStr = parseUrl.queryParams['item_id'];
    if (itemIdStr) {
        newVar.dressUpId = parseInt(itemIdStr)
    }
    //收藏集活动id
    const actIdStr = parseUrl.queryParams['act_id'];
    if (actIdStr) {
        newVar.collectionActId = parseInt(actIdStr)
    }
    newVar.name = name;
    decorateData[uid] = newVar
    return newVar
}

/**
 * 获取评论列表
 * @returns {Promise<*[]>}
 */
const getCommentSectionList = async (retryCount = 0) => {
    const MAX_RETRY = 10;
    const commentApps = await elUtil.findElements("bili-comments",
        {interval: 500});
    const commentsData = [];
    for (let commentApp of commentApps) {
        const comments = await elUtil.findElements("#feed>bili-comment-thread-renderer",
            {doc: commentApp.shadowRoot, interval: 500});
        let isLoaded = false;
        for (let el of comments) {
            try {
                //楼主层
                const commentRoot = el.shadowRoot.getElementById("comment");
                if (!commentRoot || !commentRoot.shadowRoot) {
                    console.warn('评论区楼主层元素结构异常，跳过该评论', el)
                    continue
                }
                const theOPEl = commentRoot.shadowRoot;
                const userInfoEl = theOPEl.querySelector("bili-comment-user-info");
                if (!userInfoEl || !userInfoEl.shadowRoot) continue
                const theOPUserInfo = userInfoEl.shadowRoot.getElementById("info");
                if (!theOPUserInfo) continue
                const userNameEl = theOPUserInfo.querySelector("#user-name>a");
                if (!userNameEl) continue
                const userLevelSrc = theOPUserInfo.querySelector('#user-level>img')?.src || null
                const level = getUrlUserLevel(userLevelSrc)
                //检查内容是否加载完毕
                const richTextEl = theOPEl.querySelector("#content>bili-rich-text");
                if (!richTextEl || !richTextEl.shadowRoot) continue
                isLoaded = richTextEl.shadowRoot.querySelector("#contents>*") !== null;
                if (!isLoaded) {
                    break;
                }
                const theOPContentEl = richTextEl.shadowRoot.querySelector("#contents");
                if (!theOPContentEl) continue
                const theOPClone = theOPContentEl.cloneNode(true);
                theOPClone.querySelectorAll('style').forEach(s => s.remove());
                const theOPContent = theOPClone.textContent.trim();
                const userName = userNameEl.textContent.trim();
                const userUrl = userNameEl.href;
                const uid = urlUtil.getUrlUID(userUrl);
                const decorateEl = theOPEl.querySelector("#ornament>bili-comment-user-sailing-card")
                const {dressUpId, collectionActId, decoratePic} = getDecorate(decorateEl, uid, userName)
                //楼中层内容
                const replies = [];
                commentsData.push({
                    name: userName, userUrl, uid, level, dressUpId, collectionActId, decoratePic,
                    content: theOPContent,
                    replies,
                    el,
                    insertionPositionEl: theOPUserInfo,
                    explicitSubjectEl: theOPEl.querySelector("#body"),
                    contentsEl: theOPContentEl
                });
                //楼中层
                const repliesRenderer = el.shadowRoot.querySelector("bili-comment-replies-renderer");
                if (!repliesRenderer || !repliesRenderer.shadowRoot) continue
                const inTheBuildingEls = repliesRenderer.shadowRoot.querySelectorAll("bili-comment-reply-renderer");
                for (let inTheBuildingEl of inTheBuildingEls) {
                    try {
                        const inTheContentEl = inTheBuildingEl.shadowRoot;
                        if (!inTheContentEl) continue
                        const biliCommentUserInfo = inTheContentEl.querySelector("bili-comment-user-info");
                        if (!biliCommentUserInfo || !biliCommentUserInfo.shadowRoot) continue
                        biliCommentUserInfo.style.display = 'block'
                        const inTheBuildingUserInfo = biliCommentUserInfo.shadowRoot.getElementById("info");
                        if (!inTheBuildingUserInfo) continue
                        const inTheBuildingUserNameEl = inTheBuildingUserInfo.querySelector("#user-name>a");
                        if (!inTheBuildingUserNameEl) continue
                        const inTheBuildingUserName = inTheBuildingUserNameEl.textContent.trim();
                        const inTheBuildingUserUrl = inTheBuildingUserNameEl.href;
                        const inTheBuildingUid = urlUtil.getUrlUID(inTheBuildingUserUrl);
                        //评论内容元素
                        const biliRichTextEL = inTheContentEl.querySelector("bili-rich-text");
                        if (!biliRichTextEL || !biliRichTextEL.shadowRoot) continue
                        const contentsEl = biliRichTextEL.shadowRoot.querySelector("#contents");
                        if (!contentsEl) continue
                        const replyClone = contentsEl.cloneNode(true);
                        replyClone.querySelectorAll('style').forEach(s => s.remove());
                        const inTheBuildingContent = replyClone.textContent.trim();
                        const userLevelSrc = inTheBuildingUserInfo.querySelector('#user-level>img')?.src || null;
                        const level = getUrlUserLevel(userLevelSrc)
                        const decorateDatum = decorateData[inTheBuildingUid];
                        let dressUpId = -1, collectionActId = -1, decoratePic = null;
                        if (decorateDatum) {
                            dressUpId = decorateDatum.dressUpId;
                            collectionActId = decorateDatum.collectionActId;
                            decoratePic = decorateDatum.decoratePic;
                        }
                        replies.push({
                            name: inTheBuildingUserName,
                            userUrl: inTheBuildingUserUrl,
                            uid: inTheBuildingUid, dressUpId, collectionActId, decoratePic,
                            level,
                            content: inTheBuildingContent,
                            el: inTheBuildingEl,
                            insertionPositionEl: inTheBuildingUserInfo,
                            explicitSubjectEl: inTheBuildingEl,
                            contentsEl
                        })
                    } catch (e) {
                        console.error('解析楼中层评论时出错:', e)
                    }
                }
            } catch (e) {
                console.error('解析楼主层评论时出错:', e)
            }
        }
        if (!isLoaded && retryCount < MAX_RETRY) {
            await defUtil.wait(500);
            return getCommentSectionList(retryCount + 1)
        }
    }
    return commentsData;
}

//获取旧评论列表，适用于旧版本评论区，新版评论区使用shadowRoot
const getOldCommentSectionList = async () => {
    let results = await elUtil.findElements(".reply-list>.reply-item", {timeout: 5000});
    /**
     *
     * @type {[{}]}
     */
    const commentsData = [];
    for (let el of results) {
        //楼主层
        const theOPEl = el.querySelector(".root-reply-container");
        const theOPUserInfoEl = theOPEl.querySelector(".user-name");
        const userName = theOPUserInfoEl.textContent.trim();
        const uid = parseInt(theOPUserInfoEl.getAttribute("data-user-id"));
        const userUrl = `https://space.bilibili.com/${uid}`;
        const theOPContent = theOPEl.querySelector(".reply-content").textContent.trim();
        const userInfoEl = el.querySelector(".user-info");
        const iEl = userInfoEl.querySelector('i');
        const level = getOldUserLevel(iEl)
        const replies = [];
        commentsData.push({
            name: userName,
            userUrl,
            uid,
            content: theOPContent,
            level,
            replies,
            el,
            insertionPositionEl: userInfoEl,
            explicitSubjectEl: el.querySelector(".content-warp")
        });
        //楼中层内容
        const inTheBuildingEls = el.querySelectorAll(".sub-reply-container>.sub-reply-list>.sub-reply-item");
        for (let inTheBuildingEl of inTheBuildingEls) {
            const subUserNameEl = inTheBuildingEl.querySelector(".sub-user-name");
            const uid = parseInt(subUserNameEl.getAttribute("data-user-id"));
            const userName = subUserNameEl.textContent.trim();
            const userUrl = `https://space.bilibili.com/${uid}`;
            const subContent = inTheBuildingEl.querySelector(".reply-content").textContent.trim();
            const subUserInfoEl = inTheBuildingEl.querySelector(".sub-user-info");
            const iEl = subUserInfoEl.querySelector('i');
            const level = getOldUserLevel(iEl)
            const replyContentContainerEl = inTheBuildingEl.querySelector('span.reply-content-container');
            replyContentContainerEl.style.display = 'block'
            replies.push({
                name: userName,
                userUrl,
                uid,
                level,
                content: subContent,
                el: inTheBuildingEl,
                insertionPositionEl: subUserInfoEl,
                explicitSubjectEl: inTheBuildingEl
            })
        }
    }
    return commentsData;
}

//执行屏蔽评论
const startShieldingComments = async () => {
    /*
    1.如果当前是视频播放页并且配置了移除底部评论区时不执行该页的屏蔽评论功能
    2.如果开启了关闭评论区屏蔽功能，则不执行屏蔽评论功能
     */
    if (videoPlayModel.isVideoPlayPage() && localMKData.isDelBottomComment() || isCloseCommentBlockingGm()) {
        return
    }
    let list;
    const href = window.location.href;
    if (localMKData.isDiscardOldCommentAreas()) {
        //新版评论区
        list = await getCommentSectionList();
    } else if (href.includes("https://space.bilibili.com/") || topicDetail.isTopicDetailPage(href)) {
        //评论_旧版本，适用于部分旧版评论区
        list = await getOldCommentSectionList();
    } else {
        //新版评论区
        list = await getCommentSectionList();
    }
    comments_shielding.shieldingCommentsAsync(list);
}

eventEmitter.on('event-检查评论区屏蔽', () => {
    startShieldingComments()
})


/**
 * 评论区模块
 */
export default {}
