import elUtil from "../../utils/elUtil.js";
import strFormatUtil from '../../utils/strFormatUtil.js'
import defUtil, {addGzStyle} from "../../utils/defUtil.js";
import video_shielding from "../../model/shielding/video_shielding.js";
import {eventEmitter} from "../../model/EventEmitter.js";
import globalValue from "../../data/globalValue.js";
import {IntervalExecutor} from "../../model/IntervalExecutor.js";
import urlUtil from "../../utils/urlUtil.js";
//获取bewly的shadowRoot元素
let be_wly_el = null;

//排除执行的选项卡
const excludeTabNames = ['正在关注', '订阅剧集', '直播']
//排行左侧选项卡栏，排除的选项卡
const excludeRankingLeftTabNames = ['番剧', '综艺', '电视剧', '纪录片', '中国动画']

/**
 * 获取bewly的shadowRoot元素
 * @returns {Promise<ShadowRoot|Element|Document>}
 */
const getBewlyEl = async () => {
    if (be_wly_el === null) {
        let el = await elUtil.findElement('#bewly', {interval: 500, cachePromise: true, parseShadowRoot: true})
        be_wly_el = el;
        return el
    }
    return be_wly_el
}

//获取bewly的切换按钮的文本内容
const getBEWlyWitcherButtonTextContent = async () => {
    const el = await getBewlyEl()
    return el.querySelector('.bewly-bili-switcher-button').textContent
}

// 判断是否为BewlyCat插件生效的首页
const isBEWLYCatPlugin = async () => {
    const text = await getBEWlyWitcherButtonTextContent()
    return text.includes('BewlyCat');
}

/**
 * 获取排行左侧选项卡
 * @returns {Promise<[{label:string,el:Element|Document}]>}
 */
const getRankingLeftTabs = async () => {
    const beEl = await getBewlyEl()
    const elList = await elUtil.findElements('ul[flex="~ col gap-2"]>li', {doc: beEl})
    const list = [];
    for (let el of elList) {
        const label = el.textContent.trim()
        list.push({label, el})
    }
    return list
}

/**
 * 获取bewly的右侧选项卡
 * @returns {Promise<[{label:string,active:boolean,el:Element|Document}]>}
 */
const getRightTabs = async () => {
    const beEl = await getBewlyEl();
    const els = await elUtil.findElements(".dock-content-inner>.b-tooltip-wrapper", {doc: beEl})
    const list = [];
    for (let el of els) {
        const label = el.querySelector('.b-tooltip').textContent.trim()
        const active = !!el.querySelector('.dock-item.group.active')
        list.push({label, active, el})
    }
    return list;
}

/**
 * 获取视频列表 (适配当前 BewlyBewly 的 Shadow DOM 结构)
 * @returns {Promise<[]>}
 */
const getVideoList = async () => {
    const be_wly_el = await getBewlyEl()
    const elList = await elUtil.findElements('.video-card', {doc: be_wly_el})
    const list = [];
    for (let el of elList) {
        // 标题 + 视频链接: h3.keep-two-lines > a[target="_blank"]
        const titleEl = el.querySelector('h3.keep-two-lines a');
        if (!titleEl) continue;
        const title = titleEl.textContent.trim();
        const videoUrl = titleEl.href;
        const bv = urlUtil.getUrlBV(videoUrl);

        // UP主: a.channel-name
        const authorEl = el.querySelector('a.channel-name');
        if (!authorEl) continue;
        const name = authorEl.textContent.trim();
        const userUrl = authorEl.href;
        const uid = urlUtil.getUrlUID(userUrl);

        // 时长: 封面内带 group-hover:opacity-0 的元素
        const coverEl = el.querySelector('.vertical-card-cover, .horizontal-card-cover');
        let nDuration = -1;
        if (coverEl) {
            const durationEl = coverEl.querySelector('[class*="group-hover:opacity-0"]');
            if (durationEl) {
                nDuration = strFormatUtil.timeStringToSeconds(durationEl.textContent.trim());
            }
        }

        // 播放量/弹幕: 遍历 video-card 内所有含数字的 span,
        // 跳过作者名和分隔符，取前两个
        let nPlayCount = -1, bulletChat = -1;
        const allSpans = el.querySelectorAll('span');
        const numberSpans = [];
        for (const span of allSpans) {
            if (span.closest('a.channel-name')) continue;
            const txt = span.textContent.trim();
            if (txt === '•' || txt === '·' || txt === '' || !/\d/.test(txt)) continue;
            numberSpans.push(txt);
        }
        if (numberSpans.length >= 1) {
            nPlayCount = strFormatUtil.toPlayCountOrBulletChat(numberSpans[0]);
        }
        if (numberSpans.length >= 2) {
            bulletChat = strFormatUtil.toPlayCountOrBulletChat(numberSpans[1]);
        }

        const explicitSubjectEl = coverEl || el;
        const insertionPositionEl = authorEl.parentElement;

        list.push({
            title, name, uid, bv, userUrl, videoUrl, nPlayCount, bulletChat, nDuration, el,
            insertionPositionEl, explicitSubjectEl
        });
    }
    return list
}

//获取历史记录中的视频列表数据
const getHistoryVideoDataList = async () => {
    const beEL = await getBewlyEl()
    const elList = await elUtil.findElements("a.group[flex][cursor-pointer]", {doc: beEL})
    const list = []
    for (let el of elList) {
        const titleEl = el.querySelector('h3.keep-two-lines');
        const videoUrlEl = titleEl.parentElement;
        const userEl = videoUrlEl.nextElementSibling;
        const videoUrl = videoUrlEl.href;
        const bv = urlUtil.getUrlBV(videoUrl)
        const userUrl = userEl.href
        const uid = urlUtil.getUrlUID(userUrl)
        const name = userEl.textContent.trim()
        const title = titleEl?.textContent.trim()
        const tempTime = el.querySelector('div[pos][rounded-8]')?.textContent.trim().split(/[\t\r\f\n\s]*/g).join("")
        const match = tempTime?.match(/\/(.*)/);
        let nDuration = match?.[1]
        nDuration = strFormatUtil.timeStringToSeconds(nDuration)
        list.push({
            title,
            userUrl,
            name,
            uid,
            videoUrl,
            nDuration,
            bv,
            el,
            insertionPositionEl: videoUrlEl.parentElement,
            explicitSubjectEl: el
        })
    }
    return list
}

/**
 * 获取bewly首页中顶部选项卡
 * @returns {Promise<[{label:string,active:boolean,el:Element|Document}]>}
 */
const getHomeTopTabs = async () => {
    const beEl = await getBewlyEl()
    const els = beEl.querySelectorAll('.home-tabs-inside>button')
    const list = [];
    for (let el of els) {
        const label = el.textContent.trim()
        const active = el.classList.contains('tab-activated')
        list.push({label, active, el})
    }
    if (list.some(tab => tab.active === true)) {
        return list
    }
    await defUtil.wait(1000)
    return await getHomeTopTabs()
}

//开始执行屏蔽Bewly拓展中首页个性推荐和视频
const startShieldingVideoList = async () => {
    const list = await getVideoList()
    for (let videoData of list) {
        video_shielding.shieldingVideoDecorated(videoData).catch(() => {
            eventEmitter.send('视频添加屏蔽按钮-BewlyBewly', {
                data: videoData,
                maskingFunc: startShieldingVideoList
            })
        })
    }
}

//间隔执行屏蔽视频列表
const intervalShieldingVideoListExecutor = new IntervalExecutor(startShieldingVideoList, {
    processTips: true,
    intervalName: 'BEWLYCat插件视频列表'
});

//执行屏蔽历史记录中的视频
const startShieldingHistoryVideoList = async () => {
    const list = await getHistoryVideoDataList()
    for (let videoData of list) {
        video_shielding.shieldingVideoDecorated(videoData).catch(() => {
            eventEmitter.send('视频添加屏蔽按钮', {data: videoData, maskingFunc: startShieldingHistoryVideoList})
        })
    }
}

//间隔执行屏蔽历史记录中的视频
const intervalBEWLYShieldingHistoryVideoExecutor = new IntervalExecutor(startShieldingHistoryVideoList, {
    processTips: true,
    intervalName: 'BEWLY历史记录'
})

//添加顶部选项卡栏的监听器
const homeTopTabsInsertListener = () => {
    //监听顶部选项卡栏，个性推荐、正在关注该栏
    getHomeTopTabs().then(list => {
        for (let {el, label} of list) {
            el.addEventListener('click', () => {
                console.log('点击了' + label)
                if (excludeTabNames.includes(label)) {
                    intervalShieldingVideoListExecutor.stop()
                    return
                }
                if (label === '排行') {
                    rankingLeftTabsInsertListener()
                }
                intervalShieldingVideoListExecutor.start()
            })
        }
    })
}

/**
 * 添加排行左侧选项卡栏的监听器
 */
const rankingLeftTabsInsertListener = () => {
    getRankingLeftTabs().then(list => {
        for (let {el, label} of list) {
            el.addEventListener('click', () => {
                console.log('点击了' + label)
                if (excludeRankingLeftTabNames.includes(label)) {
                    intervalShieldingVideoListExecutor.stop()
                    return
                }
                intervalShieldingVideoListExecutor.start()
            })
        }
    })
}

//添加右侧选项卡栏的监听器
const rightTabsInsertListener = () => {
    getRightTabs().then(list => {
            for (let {el, label, active} of list) {
                el.addEventListener('click', () => {
                        console.log('右侧选项卡栏点击了' + label, active)
                        if (label === '首页') {
                            homeTopTabsInsertListener()
                            intervalShieldingVideoListExecutor.start()
                        } else {
                            intervalShieldingVideoListExecutor.stop()
                        }
                        if (label === '观看历史') {
                            intervalBEWLYShieldingHistoryVideoExecutor.start()
                        } else {
                            intervalBEWLYShieldingHistoryVideoExecutor.stop()
                        }
                    }
                )
            }
        }
    )
}

/**
 * 搜索框插入监听器
 * @returns null
 */
const searchBoxInsertListener = async () => {
    const beEl = await getBewlyEl()
    const input = await elUtil.findElement('[placeholder="搜索观看历史"]', {doc: beEl})
    input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.keyCode === 13) {
            console.log('回车键被按下');
            if (input['value'].length === 0) return
            setTimeout(startShieldingHistoryVideoList, 1500)
        }
    });
}

/**
 * 检查页面的 bewly插件兼容性
 * @returns {Promise<void>|null}
 */
const check_BEWLYPage_compatibility = async () => {
    const el = await elUtil.findElement('#bewly', {interval: 200, cachePromise: true, timeout: 5000})
    if (el) {
        if (!globalValue.compatibleBEWLYBEWLY) {
            eventEmitter.send('el-alert', '检测到使用Bewly插件但未开启兼容选项，需要启用相关兼容选项才可正常使用')
        }
    } else {
        //如果页面中没有 bewly插件标志，且开启了兼容选项
        if (globalValue.compatibleBEWLYBEWLY) {
            eventEmitter.send('el-alert', '检测到未使用Bewly插件却开启了兼容选项，请关闭兼容选项')
        }
    }
}


export default {
    /**
     * 是否是bewly插件主要页面
     * @param {string} url
     */
    isBEWLYPage(url) {
        return url.includes('www.bilibili.com/?page=') ||
            url === 'https://www.bilibili.com/'
            || url.startsWith('https://www.bilibili.com/?spm_id_from=')
    },
    getBewlyEl,
    run(url) {
        const parseUrl = urlUtil.parseUrl(url);
        const {page} = parseUrl.queryParams
        getBewlyEl().then(el => {
            addGzStyle(el, el);
        })
        if (page === 'Home' ||
            url.startsWith('https://www.bilibili.com/?spm_id_from=') ||
            url === 'https://www.bilibili.com/'
        ) {
            intervalShieldingVideoListExecutor.start()
            homeTopTabsInsertListener()
        }
        if (page === 'History') {
            intervalBEWLYShieldingHistoryVideoExecutor.start()
            searchBoxInsertListener()
        }
        rightTabsInsertListener()
    },
    check_BEWLYPage_compatibility
}