// ==UserScript==
// @name              BiliBlockFusion
// @namespace         https://github.com/BRaysMK/BiliBlockFusion
// @version           1.1.0
// @description       Bilibili comprehensive content filtering script. Block videos by title/uploader/tag/duration/views, plus comments, dynamic feeds, and trending search filtering.
// @author            BRaysMK
// @icon              https://www.bilibili.com/favicon.ico
// @license           Apache-2.0
// @homepageURL       https://github.com/BRaysMK/BiliBlockFusion
// @supportURL        https://github.com/BRaysMK/BiliBlockFusion/issues
// @run-at            document-start
// @match             *://www.bilibili.com/*
// @match             *://search.bilibili.com/*
// @match             *://message.bilibili.com/*
// @match             *://t.bilibili.com/*
// @match             *://space.bilibili.com/*
// @match             *://live.bilibili.com/*
// @match             *://account.bilibili.com/*
// @match             *://link.bilibili.com/*
// @match             *://localhost:5173/*
// @exclude           *://message.bilibili.com/pages/nav/header_sync
// @exclude           *://message.bilibili.com/pages/nav/index_new_pc_sync
// @exclude           *://live.bilibili.com/blackboard/dropdown-menu.html
// @exclude           *://live.bilibili.com/p/html/live-web-mng/*
// @exclude           *://www.bilibili.com/correspond/*
// @exclude           http://localhost:3001/
// @grant             GM_setValue
// @grant             GM_getValue
// @grant             GM_deleteValue
// @grant             GM_addStyle
// @grant             GM_unregisterMenuCommand
// @grant             GM_registerMenuCommand
// @grant             GM_openInTab
// @grant             GM_xmlhttpRequest
// @grant             GM_getResourceText
// @grant             unsafeWindow
// @require           https://unpkg.com/vue@2.7.16/dist/vue.min.js
// @require           https://unpkg.com/element-ui@2.15.14/lib/index.js
// @require           https://unpkg.com/dexie@4.2.0/dist/dexie.min.js
// @name:zh-CN        BiliBlockFusion — B站综合内容过滤
// @description:zh-CN Bilibili 综合内容过滤脚本，支持按标题/UP主/标签/分区/时长/播放量等屏蔽视频，以及评论、动态、热搜的过滤。
// ==/UserScript==
            (function(Vue,Dexie){'use strict';var __typeError$6 = (msg) => {
  throw TypeError(msg);
};
var __accessCheck$6 = (obj, member, msg) => member.has(obj) || __typeError$6("Cannot " + msg);
var __privateGet$6 = (obj, member, getter) => (__accessCheck$6(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd$6 = (obj, member, value) => member.has(obj) ? __typeError$6("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateMethod$1 = (obj, member, method) => (__accessCheck$6(obj, member, "access private method"), method);
var _regularEvents, _callbackEvents, _EventEmitter_instances, handlePendingEvents_fn, executePreHandle_fn;
class EventEmitter {
  constructor() {
    __privateAdd$6(this, _EventEmitter_instances);
    
    __privateAdd$6(this, _regularEvents, {
      events: {},
      futures: {},
      parametersDebounce: {},
      preHandles: {}
    });
    
    __privateAdd$6(this, _callbackEvents, {
      events: {},
      callbackInterval: 1500
    });
  }
  
  on(eventName, callback, overrideEvents = false) {
    const events = __privateGet$6(this, _regularEvents).events;
    if (events[eventName]) {
      if (overrideEvents) {
        events[eventName] = callback;
        __privateMethod$1(this, _EventEmitter_instances, handlePendingEvents_fn).call(this, eventName, callback);
      }
      return this;
    }
    events[eventName] = callback;
    __privateMethod$1(this, _EventEmitter_instances, handlePendingEvents_fn).call(this, eventName, callback);
    return this;
  }
  
  onPreHandle(eventName, callback) {
    const preHandles = __privateGet$6(this, _regularEvents).preHandles;
    preHandles[eventName] = callback;
    return this;
  }
  
  handler(eventName, callback) {
    const handlerEvents = __privateGet$6(this, _callbackEvents).events;
    if (handlerEvents[eventName]) {
      throw new Error("该事件名已经存在，请更换事件名");
    }
    handlerEvents[eventName] = callback;
  }
  
  invoke(eventName, ...data) {
    return new Promise((resolve) => {
      const handlerEvents = __privateGet$6(this, _callbackEvents).events;
      if (handlerEvents[eventName]) {
        resolve(handlerEvents[eventName](...data));
        return;
      }
      const i1 = setInterval(() => {
        if (handlerEvents[eventName]) {
          clearInterval(i1);
          resolve(handlerEvents[eventName](...data));
        }
      }, __privateGet$6(this, _callbackEvents).callbackInterval);
    });
  }
  
  send(eventName, ...data) {
    const ordinaryEvents = __privateGet$6(this, _regularEvents);
    const events = ordinaryEvents.events;
    const event = events[eventName];
    if (event) {
      const preHandleData = __privateMethod$1(this, _EventEmitter_instances, executePreHandle_fn).call(this, eventName, data);
      event.apply(null, preHandleData);
      return this;
    }
    const futures = ordinaryEvents.futures;
    if (futures[eventName]) {
      futures[eventName].push(data);
      return this;
    }
    futures[eventName] = [];
    futures[eventName].push(data);
    return this;
  }
  
  sendDebounce(eventName, ...data) {
    const parametersDebounce = __privateGet$6(this, _regularEvents).parametersDebounce;
    let timeOutConfig = parametersDebounce[eventName];
    if (timeOutConfig) {
      clearTimeout(timeOutConfig.timeOut);
      timeOutConfig.timeOut = null;
    } else {
      timeOutConfig = parametersDebounce[eventName] = { wait: 1500, timeOut: null };
    }
    timeOutConfig.timeOut = setTimeout(
      () => {
        this.send(eventName, ...data);
      },
      timeOutConfig.wait
    );
    return this;
  }
  
  setDebounceWaitTime(eventName, wait) {
    const timeOutConfig = __privateGet$6(this, _regularEvents).parametersDebounce[eventName];
    if (timeOutConfig) {
      timeOutConfig.wait = wait;
    } else {
      __privateGet$6(this, _regularEvents).parametersDebounce[eventName] = {
        wait,
        timeOut: null
      };
    }
    return this;
  }
  
  emit(eventName, ...data) {
    const callback = __privateGet$6(this, _regularEvents).events[eventName];
    if (callback) {
      callback.apply(null, data);
    }
    return this;
  }
  
  off(eventName) {
    const events = __privateGet$6(this, _regularEvents).events;
    if (events[eventName]) {
      delete events[eventName];
      return true;
    }
    const handlerEvents = __privateGet$6(this, _callbackEvents).events;
    if (handlerEvents[eventName]) {
      delete handlerEvents[eventName];
      return true;
    }
    return false;
  }
  
  setInvokeInterval(interval) {
    __privateGet$6(this, _callbackEvents).callbackInterval = interval;
  }
  
  getEvents() {
    return {
      regularEvents: __privateGet$6(this, _regularEvents),
      callbackEvents: __privateGet$6(this, _callbackEvents)
    };
  }
}
_regularEvents = new WeakMap();
_callbackEvents = new WeakMap();
_EventEmitter_instances = new WeakSet();
handlePendingEvents_fn = function(eventName, callback) {
  const futureEvents = __privateGet$6(this, _regularEvents).futures;
  if (futureEvents[eventName]) {
    for (const eventData of futureEvents[eventName]) {
      const preHandleData = __privateMethod$1(this, _EventEmitter_instances, executePreHandle_fn).call(this, eventName, eventData);
      callback.apply(null, preHandleData);
    }
    delete futureEvents[eventName];
  }
};
executePreHandle_fn = function(eventName, data) {
  const preHandles = __privateGet$6(this, _regularEvents).preHandles;
  const callback = preHandles[eventName];
  if (callback) {
    return callback.apply(null, data);
  }
  return data;
};
const eventEmitter = new EventEmitter();GM_registerMenuCommand("主面板", () => {
  eventEmitter.send("主面板开关");
}, "Q");const setBorderColor = (color) => {
  GM_setValue("borderColor", color);
};
const defBorderColor = "rgb(0, 243, 255)";
const getBorderColor = () => {
  return GM_getValue("borderColor", defBorderColor);
};
const setOutputInformationFontColor = (color) => {
  GM_setValue("output_information_font_color", color);
};
const defOutputInformationFontColor = "rgb(119,128,248)";
const getOutputInformationFontColor = () => {
  return GM_getValue("output_information_font_color", defOutputInformationFontColor);
};
const setHighlightInformationColor = (color) => {
  GM_setValue("highlight_information_color", color);
};
const defHighlightInformationColor = "rgb(234, 93, 93)";
const getHighlightInformationColor = () => {
  return GM_getValue("highlight_information_color", defHighlightInformationColor);
};
const setDefaultColorInfo = () => {
  setBorderColor(defBorderColor);
  setOutputInformationFontColor(defOutputInformationFontColor);
  setHighlightInformationColor(defHighlightInformationColor);
};
const getBOnlyTheHomepageIsBlocked = () => {
  return GM_getValue("bOnlyTheHomepageIsBlocked", false);
};
const isShowRightTopMainButSwitch = () => {
  return GM_getValue("showRightTopMainButSwitch", true) === true;
};
const isFirstFullDisplay = () => {
  return GM_getValue("isFirstFullDisplay", true) === true;
};
const isHalfHiddenIntervalAfterInitialDisplay = () => {
  return GM_getValue("is_half_hidden_interval_after_initial_display", true) === true;
};
const isCompatible_BEWLY_BEWLY = () => {
  return GM_getValue("compatible_BEWLY_BEWLY", false) === true;
};
const isDiscardOldCommentAreas = () => {
  return GM_getValue("discardOldCommentAreas", true) === true;
};
const isDelPlayerPageRightVideoList = () => {
  return GM_getValue("isDelPlayerPageRightVideoList", false) === true;
};
const bFuzzyAndRegularMatchingWordsToLowercase$1 = () => {
  return GM_getValue("bFuzzyAndRegularMatchingWordsToLowercase", false);
};
const getRequestFrequencyVal = () => {
  return GM_getValue("requestFrequencyVal", 0.2);
};
const isDisableNetRequestsBvVideoInfo = () => {
  return GM_getValue("isDisableNetRequestsBvVideoInfo", false);
};
const isBlockFollowed = () => {
  return GM_getValue("blockFollowed", false);
};
const isUpOwnerExclusive = () => {
  return GM_getValue("is_up_owner_exclusive", false);
};
const isGenderRadioVal = () => {
  return GM_getValue("genderRadioVal", "不处理");
};
const isVipTypeRadioVal = () => {
  return GM_getValue("vipTypeRadioVal", "不处理");
};
const isSeniorMember = () => {
  return GM_getValue("is_senior_member", false);
};
const isCopyrightRadio = () => {
  return GM_getValue("copyrightRadioVal", "不处理");
};
const isDelBottomComment = () => {
  return GM_getValue("isDelBottomComment", false);
};
const isBlockVerticalVideo = () => {
  return GM_getValue("blockVerticalVideo", false);
};
const isCheckTeamMember = () => {
  return GM_getValue("checkTeamMember", false);
};
const getVideoLikeRate = () => {
  return GM_getValue("video_like_rate", 0.05);
};
const isVideoLikeRateBlockingStatus = () => {
  return GM_getValue("video_like_rate_blocking_status", false);
};
const isCoinLikesRatioRateBlockingStatus = () => {
  return GM_getValue("coin_likes_ratio_rate_blocking_status", false);
};
const getCoinLikesRatioRate = () => {
  return GM_getValue("coin_likes_ratio_rate", 0.05);
};
const isInteractiveRateBlockingStatus = () => {
  return GM_getValue("interactive_rate_blocking_status", false);
};
const getInteractiveRate = () => {
  return GM_getValue("interactive_rate", 0.05);
};
const isTripleRateBlockingStatus = () => {
  return GM_getValue("triple_rate_blocking_status", false);
};
const getTripleRate = () => {
  return GM_getValue("triple_rate", 0.05);
};
const getUidRangeMasking = () => {
  return GM_getValue("uid_range_masking", [0, 100]);
};
const isUidRangeMaskingStatus = () => {
  return GM_getValue("uid_range_masking_status", false);
};
const isTimeRangeMaskingStatus = () => {
  return GM_getValue("time_range_masking_status", false);
};
const getTimeRangeMaskingArr = () => {
  return GM_getValue("time_range_masking", []);
};
const isDelPlayerEndingPanel = () => {
  return GM_getValue("is_del_player_ending_panel", false);
};
const getCommentWordLimitType = () => {
  return GM_getValue("comment_word_limit_type", "max");
};
const isEnableCommentWordLimitGm = () => {
  return GM_getValue("is_enable_comment_word_limit_gm", false);
};
const getCommentWordLimitVal = () => {
  return GM_getValue("comment_word_limit", 10);
};
const isEffectiveUIDShieldingOnlyVideo = () => {
  return GM_getValue("is_effective_uid_shielding_only_video", false);
};
const isSeniorMemberOnly = () => {
  return GM_getValue("is_senior_member_only", false);
};
const isExcludeURLSwitchGm = () => {
  return GM_getValue("is_exclude_url_switch_gm", false);
};
const getExcludeURLsGm = () => {
  return GM_getValue("exclude_urls_gm", []);
};
const isHideHotSearchesPanelGm = () => {
  return GM_getValue("is_hide_hot_searches_panel_gm", false);
};
const isHideSearchHistoryPanelGm = () => {
  return GM_getValue("is_hide_search_history_panel_gm", false);
};
const isCloseCommentBlockingGm = () => {
  return GM_getValue("is_close_comment_blocking_gm", false);
};
const isHideCarouselImageGm = () => {
  return GM_getValue("is_hide_carousel_image_gm", false);
};
const isHideHomeTopHeaderBannerImageGm = () => {
  return GM_getValue("is_hide_home_top_header_banner_image_gm", false);
};
const isHideHomeTopHeaderChannelGm = () => {
  return GM_getValue("is_hide_home_top_header_channel_gm", false);
};
const getLimitationFanSumGm = () => {
  return GM_getValue("limitation_fan_sum_gm", 0);
};
const isFansNumBlockingStatusGm = () => {
  return GM_getValue("is_fans_num_blocking_status_gm", false);
};
const getLimitationVideoSubmitSumGm = () => {
  return GM_getValue("limitation_video_submit_sum_gm", 0);
};
const isLimitationVideoSubmitStatusGm = () => {
  return GM_getValue("is_limitation_video_submit_status_gm", false);
};
const enableDynamicItemsContentBlockingGm = () => {
  return GM_getValue("enable_dynamic_items_content_blocking_gm", false);
};
const hideBlockButtonGm = () => {
  return GM_getValue("hide_block_button_gm", false);
};
const isCheckNestedDynamicContentGm = () => {
  return GM_getValue("is_check_nested_dynamic_content_gm", false);
};
const isBlockRepostDynamicGm = () => {
  return GM_getValue("is_block_repost_dynamic_gm", false);
};
const isBlockAppointmentDynamicGm = () => {
  return GM_getValue("is_block_appointment_dynamic_gm", false);
};
const isBlockVoteDynamicGm = () => {
  return GM_getValue("is_block_vote_dynamic_gm", false);
};
const isBlockUPowerLotteryDynamicGm = () => {
  return GM_getValue("is_block_u_power_lottery_dynamic_gm", false);
};
const isBlockGoodsDynamicGm = () => {
  return GM_getValue("is_block_goods_dynamic_gm", false);
};
const isBlockSpecialColumnForChargingDynamicGm = () => {
  return GM_getValue("is_block_special_column_for_charging_dynamic_gm", false);
};
const isBlockVideoChargingExclusiveDynamicGm = () => {
  return GM_getValue("is_block_video_charging_exclusive_dynamic_gm", false);
};
const getDrawerShortcutKeyGm = () => {
  return GM_getValue("drawer_shortcut_key_gm", "`");
};
const getExpiresMaxAgeGm = () => {
  return GM_getValue("expires_max_age_gm", 7);
};
const getMinimumUserLevelVideoGm = () => {
  return GM_getValue("minimum_user_level_video_gm", 0);
};
const getMaximumUserLevelVideoGm = () => {
  return GM_getValue("maximum_user_level_video_gm", 1);
};
const getMinimumUserLevelCommentGm = () => {
  return GM_getValue("minimum_user_level_comment_gm", 0);
};
const getMaximumUserLevelCommentGm = () => {
  return GM_getValue("maximum_user_level_comment_gm", 0);
};
const isEnableMinimumUserLevelVideoGm = () => {
  return GM_getValue("is_enable_minimum_user_level_video_gm", false);
};
const isEnableMaximumUserLevelVideoGm = () => {
  return GM_getValue("is_enable_maximum_user_level_video_gm", false);
};
const isEnableMinimumUserLevelCommentGm = () => {
  return GM_getValue("is_enable_minimum_user_level_comment_gm", false);
};
const isEnableMaximumUserLevelCommentGm = () => {
  return GM_getValue("is_enable_maximum_user_level_comment_gm", false);
};
const getMinimumPlayGm = () => {
  return GM_getValue("minimum_play_gm", 100);
};
const getMaximumPlayGm = () => {
  return GM_getValue("maximum_play_gm", 1e4);
};
const isMinimumPlayGm = () => {
  return GM_getValue("is_minimum_play_gm", false);
};
const isMaximumPlayGm = () => {
  return GM_getValue("is_maximum_play_gm", false);
};
const getMinimumBarrageGm = () => {
  return GM_getValue("minimum_barrage_gm", 20);
};
const getMaximumBarrageGm = () => {
  return GM_getValue("maximum_barrage_gm", 1e3);
};
const isMinimumBarrageGm = () => {
  return GM_getValue("is_minimum_barrage_gm", false);
};
const isMaximumBarrageGm = () => {
  return GM_getValue("is_maximum_barrage_gm", false);
};
const getMinimumDurationGm = () => {
  return GM_getValue("minimum_duration_gm", 30);
};
const getMaximumDurationGm = () => {
  return GM_getValue("maximum_duration_gm", 3e3);
};
const isMinimumDurationGm = () => {
  return GM_getValue("is_minimum_duration_gm", false);
};
const isMaximumDurationGm = () => {
  return GM_getValue("is_maximum_duration_gm", false);
};
const hidePersonalInfoCardGm = () => {
  return GM_getValue("hide_personal_info_card_gm", false);
};
const isVideosInFeaturedCommentsBlockedGm = () => {
  return GM_getValue("is_videos_in_featured_comments_blocked_gm", false);
};
const isFollowers7DaysOnlyVideosBlockedGm = () => {
  return GM_getValue("is_followers_7_days_only_videos_blocked_gm", false);
};
const isCommentDisabledVideosBlockedGm = () => {
  return GM_getValue("is_comment_disabled_videos_blocked_gm", false);
};
const getReleaseTypeCardsGm = () => {
  return GM_getValue("release_type_cards_gm", []);
};
const isAutomaticScrollingGm = () => {
  return GM_getValue("is_automatic_scrolling_gm", true);
};
const isOverlayMode = () => {
  return !GM_getValue("hide_video_mode", false);
};
const isHideVideoMode = () => {
  return GM_getValue("hide_video_mode", false);
};
const isHideNonVideoElements = () => {
  return GM_getValue("hide_non_video_elements", true);
};
const isBlockTrending = () => {
  return GM_getValue("block_trending", false);
};
const getBlockedTrendingItems = () => {
  return GM_getValue("blocked_trending_items", []);
};
const isTrendingUseRegex = () => {
  return GM_getValue("trending_use_regex", true);
};
const getFavoriteCoinRatioVal = () => {
  return GM_getValue("favorite_coin_ratio", 10);
};
const isFavoriteCoinRatioBlocking = () => {
  return GM_getValue("favorite_coin_ratio_blocking", false);
};
const isBlockVideoPartitions = () => {
  return GM_getValue("block_video_partitions", false);
};
const getOverlayOnlyType = () => {
  return GM_getValue("overlay_only_type", false);
};
const isHideBlockedWords = () => {
  return GM_getValue("hide_blocked_words", false);
};
const isConsoleOutputLog = () => {
  return GM_getValue("console_output_log", false);
};
var localMKData = {
  getTripleRate,
  isTripleRateBlockingStatus,
  setBorderColor,
  getBorderColor,
  setOutputInformationFontColor,
  getOutputInformationFontColor,
  setHighlightInformationColor,
  getHighlightInformationColor,
  getBOnlyTheHomepageIsBlocked,
  setDefaultColorInfo,
  isCompatible_BEWLY_BEWLY,
  isDiscardOldCommentAreas,
  isShowRightTopMainButSwitch,
  isFirstFullDisplay,
  isHalfHiddenIntervalAfterInitialDisplay,
  isDelPlayerPageRightVideoList,
  bFuzzyAndRegularMatchingWordsToLowercase: bFuzzyAndRegularMatchingWordsToLowercase$1,
  isDisableNetRequestsBvVideoInfo,
  isBlockFollowed,
  isUpOwnerExclusive,
  isGenderRadioVal,
  isVipTypeRadioVal,
  isSeniorMember,
  isCopyrightRadio,
  isDelBottomComment,
  isBlockVerticalVideo,
  isCheckTeamMember,
  getVideoLikeRate,
  isVideoLikeRateBlockingStatus,
  isCoinLikesRatioRateBlockingStatus,
  getCoinLikesRatioRate,
  isInteractiveRateBlockingStatus,
  getInteractiveRate,
  getUidRangeMasking,
  isUidRangeMaskingStatus,
  isTimeRangeMaskingStatus,
  isDelPlayerEndingPanel,
  getTimeRangeMaskingArr,
  getCommentWordLimitVal,
  isHideAddSeeLater() {
    return GM_getValue("is_hide_add_see_later", false);
  },
  isDynamicHomeRightLayHide() {
    return GM_getValue("is_dynamic_home_right_lay_hide", false);
  },
  hideBackToOldVersionButGm() {
    return GM_getValue("hide_back_to_old_version_but_gm", false);
  },
  isShowBackToTopBtn() {
    return GM_getValue("is_show_back_to_top_btn", false);
  },
  isHideChargingDedicatedVideos() {
    return GM_getValue("is_hide_charging_dedicated_videos", false);
  },
  isLiveReplayVideosHide() {
    return GM_getValue("is_live_replay_videos_hide_gm", false);
  },
  isOverlayMode,
  isHideVideoMode,
  isHideNonVideoElements,
  isBlockTrending,
  getBlockedTrendingItems,
  isTrendingUseRegex,
  getFavoriteCoinRatioVal,
  isFavoriteCoinRatioBlocking,
  isBlockVideoPartitions,
  getOverlayOnlyType,
  isHideBlockedWords,
  isConsoleOutputLog
};const group_url = "http://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=tFU0xLt1uO5u5CXI2ktQRLh_XGAHBl7C&authKey=KAf4rICQYjfYUi66WelJAGhYtbJLILVWumOm%2BO9nM5fNaaVuF9Iiw3dJoPsVRUak&noverify=0&group_code=876295632";
const scriptCat_js_url = "https://scriptcat.org/zh-CN/script-show-page/1029";
const compatibleBEWLYBEWLY = localMKData.isCompatible_BEWLY_BEWLY();
const bOnlyTheHomepageIsBlocked = localMKData.getBOnlyTheHomepageIsBlocked();
const returnTempVal = { state: false };
const promiseResolve = Promise.resolve();
const promiseReject = Promise.reject();
var globalValue = {
  group_url,
  scriptCat_js_url,
  compatibleBEWLYBEWLY,
  bOnlyTheHomepageIsBlocked
};const start = () => {
  let loop = false;
  let msg;
  if (!Vue) {
    loop = true;
    msg = "Vue is not defined，Vue未定义，请检查是否引入了Vue";
  }
  if (!Dexie) {
    loop = true;
    msg = "Dexie is not defined，Dexie未定义，请检查是否引入了Dexie";
  }
  if (loop) {
    if (confirm("外部库验证失败:" + msg + `
请联系作者核查问题
可通过点击确定按钮跳转。
        
脚本主页信息中，有相关解决文档
        
或通过脚本信息底下联系方式联系作者解决`)) {
      GM_openInTab(globalValue.scriptCat_js_url);
      GM_openInTab(globalValue.group_url);
    }
    throw new Error(`外部库验证失败:${msg}`);
  }
};
start();var defCss = `
.el-vertical-center {
    display: flex;
    justify-content: center;
}
.el-horizontal-center {
    display: flex;
    align-items: center;
}
.el-horizontal-right {
    display: flex;
    justify-content: flex-end;
}
.el-horizontal-left {
    display: flex;
    justify-content: flex-start;
}
.el-horizontal-outside {
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.height-auto.el-divider.el-divider--vertical {
    height: auto !important;
}
.margin-top-bottom10.el-divider.el-divider--horizontal {
    margin: 10px 0;
}
`;var gzStyleCss = `
button[gz_type] {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  -webkit-appearance: none;
  text-align: center;
  box-sizing: border-box;
  outline: none;
  margin: 0;
  font-weight: 500;
  font-size: 13px;
  letter-spacing: 0.3px;
  -moz-user-select: none;
  -webkit-user-select: none;
  -ms-user-select: none;
  user-select: none;
  
  padding: 6px 16px;
  border-radius: 20px;
  border: 1px solid rgba(251, 114, 153, 0.25);
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #FB7299;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
button[gz_type]:hover {
  background: #FB7299;
  color: #fff;
  border-color: #FB7299;
  box-shadow: 0 4px 12px rgba(251, 114, 153, 0.3);
  transform: translateY(-1px);
}
button[gz_type]:active {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(251, 114, 153, 0.25);
}
button[gz_type="primary"] {
  background: linear-gradient(135deg, #FB7299 0%, #fc8aab 100%);
  color: #fff;
  border-color: transparent;
  box-shadow: 0 2px 8px rgba(251, 114, 153, 0.3);
}
button[gz_type="primary"]:hover {
  background: linear-gradient(135deg, #FB7299 0%, #fd9bb7 100%);
  box-shadow: 0 4px 16px rgba(251, 114, 153, 0.4);
  color: #fff;
}
button[gz_type="success"] {
  background: rgba(110, 207, 112, 0.1);
  color: #4caf50;
  border-color: rgba(76, 175, 80, 0.25);
}
button[gz_type="success"]:hover {
  background: #4caf50;
  color: #fff;
  border-color: #4caf50;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}
button[gz_type="info"] {
  background: rgba(0, 161, 214, 0.08);
  color: #00A1D6;
  border-color: rgba(0, 161, 214, 0.2);
}
button[gz_type="info"]:hover {
  background: #00A1D6;
  color: #fff;
  border-color: #00A1D6;
  box-shadow: 0 4px 12px rgba(0, 161, 214, 0.3);
}
button[gz_type="warning"] {
  background: rgba(230, 162, 60, 0.1);
  color: #e6a23c;
  border-color: rgba(230, 162, 60, 0.25);
}
button[gz_type="warning"]:hover {
  background: #e6a23c;
  color: #fff;
  border-color: #e6a23c;
  box-shadow: 0 4px 12px rgba(230, 162, 60, 0.3);
}
button[gz_type="danger"] {
  background: rgba(245, 108, 108, 0.08);
  color: #f56c6c;
  border-color: rgba(245, 108, 108, 0.2);
}
button[gz_type="danger"]:hover {
  background: #f56c6c;
  color: #fff;
  border-color: #f56c6c;
  box-shadow: 0 4px 12px rgba(245, 108, 108, 0.3);
}
button[border] {
  border-radius: 24px;
  padding: 10px 22px;
  font-size: 14px;
}
input[gz_type] {
  font-family: inherit;
  font-size: 14px;
  padding: 8px 12px;
  margin: 10px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  outline: none;
  background: #fff;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
input[gz_type]:focus {
  border-color: #FB7299;
  box-shadow: 0 0 0 3px rgba(251, 114, 153, 0.12);
}
select {
  font-family: inherit;
  font-size: 14px;
  padding: 8px 12px;
  margin: 10px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  outline: none;
  background-color: #fff;
  color: #18191C;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
select:focus {
  border-color: #FB7299;
  box-shadow: 0 0 0 3px rgba(251, 114, 153, 0.12);
}
select:disabled {
  background-color: #f5f5f5;
  border-color: rgba(0, 0, 0, 0.06);
  color: #9499A0;
}
button[gz_type]:focus,
button[gz_type]:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(251, 114, 153, 0.25);
}
.bb-dark button[gz_type] {
  background: rgba(40, 41, 45, 0.92);
  border-color: rgba(251, 114, 153, 0.2);
  color: #fc8aab;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
}
.bb-dark button[gz_type]:hover {
  background: #FB7299;
  color: #fff;
  border-color: #FB7299;
  box-shadow: 0 4px 12px rgba(251, 114, 153, 0.35);
}
.bb-dark button[gz_type="primary"] {
  background: linear-gradient(135deg, #FB7299 0%, #fc8aab 100%);
  color: #fff;
}
.bb-dark button[gz_type="success"] {
  background: rgba(110, 207, 112, 0.08);
  color: #6ecf70;
  border-color: rgba(110, 207, 112, 0.2);
}
.bb-dark button[gz_type="success"]:hover {
  background: #4caf50;
  color: #fff;
}
.bb-dark button[gz_type="info"] {
  background: rgba(0, 161, 214, 0.08);
  color: #00A1D6;
  border-color: rgba(0, 161, 214, 0.15);
}
.bb-dark button[gz_type="info"]:hover {
  background: #00A1D6;
  color: #fff;
}
.bb-dark button[gz_type="warning"] {
  background: rgba(230, 162, 60, 0.08);
  color: #e6a23c;
  border-color: rgba(230, 162, 60, 0.2);
}
.bb-dark button[gz_type="warning"]:hover {
  background: #e6a23c;
  color: #fff;
}
.bb-dark button[gz_type="danger"] {
  background: rgba(245, 108, 108, 0.08);
  color: #f56c6c;
  border-color: rgba(245, 108, 108, 0.2);
}
.bb-dark button[gz_type="danger"]:hover {
  background: #f56c6c;
  color: #fff;
}
.bb-dark input[gz_type] {
  background: #2A2B2F;
  border-color: rgba(255, 255, 255, 0.08);
  color: #E8E8EA;
}
.bb-dark input[gz_type]:focus {
  border-color: #FB7299;
  box-shadow: 0 0 0 3px rgba(251, 114, 153, 0.15);
}
.bb-dark select {
  background: #2A2B2F;
  border-color: rgba(255, 255, 255, 0.08);
  color: #E8E8EA;
}
.bb-dark select:focus {
  border-color: #FB7299;
  box-shadow: 0 0 0 3px rgba(251, 114, 153, 0.15);
}
.bb-dark select:disabled {
  background: #1E1F22;
  border-color: rgba(255, 255, 255, 0.04);
  color: #5A5A60;
}
@media (prefers-color-scheme: dark) {
  button[gz_type] {
    background: rgba(40, 41, 45, 0.92);
    border-color: rgba(251, 114, 153, 0.2);
    color: #fc8aab;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  }
  button[gz_type]:hover {
    background: #FB7299;
    color: #fff;
    border-color: #FB7299;
    box-shadow: 0 4px 12px rgba(251, 114, 153, 0.35);
  }
  button[gz_type="primary"] {
    background: linear-gradient(135deg, #FB7299 0%, #fc8aab 100%);
    color: #fff;
  }
  button[gz_type="success"] {
    background: rgba(110, 207, 112, 0.08);
    color: #6ecf70;
    border-color: rgba(110, 207, 112, 0.2);
  }
  button[gz_type="success"]:hover {
    background: #4caf50;
    color: #fff;
  }
  button[gz_type="info"] {
    background: rgba(0, 161, 214, 0.08);
    color: #00A1D6;
    border-color: rgba(0, 161, 214, 0.15);
  }
  button[gz_type="info"]:hover {
    background: #00A1D6;
    color: #fff;
  }
  button[gz_type="warning"] {
    background: rgba(230, 162, 60, 0.08);
    color: #e6a23c;
    border-color: rgba(230, 162, 60, 0.2);
  }
  button[gz_type="warning"]:hover {
    background: #e6a23c;
    color: #fff;
  }
  button[gz_type="danger"] {
    background: rgba(245, 108, 108, 0.08);
    color: #f56c6c;
    border-color: rgba(245, 108, 108, 0.2);
  }
  button[gz_type="danger"]:hover {
    background: #f56c6c;
    color: #fff;
  }
  input[gz_type] {
    background: #2A2B2F;
    border-color: rgba(255, 255, 255, 0.08);
    color: #E8E8EA;
  }
  input[gz_type]:focus {
    border-color: #FB7299;
    box-shadow: 0 0 0 3px rgba(251, 114, 153, 0.15);
  }
  select {
    background: #2A2B2F;
    border-color: rgba(255, 255, 255, 0.08);
    color: #E8E8EA;
  }
  select:focus {
    border-color: #FB7299;
    box-shadow: 0 0 0 3px rgba(251, 114, 153, 0.15);
  }
  select:disabled {
    background: #1E1F22;
    border-color: rgba(255, 255, 255, 0.04);
    color: #5A5A60;
  }
}
`;var __typeError$5 = (msg) => {
  throw TypeError(msg);
};
var __accessCheck$5 = (obj, member, msg) => member.has(obj) || __typeError$5("Cannot " + msg);
var __privateGet$5 = (obj, member, getter) => (__accessCheck$5(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd$5 = (obj, member, value) => member.has(obj) ? __typeError$5("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var _mapCache;
class ValueCache {
  constructor() {
    __privateAdd$5(this, _mapCache,  new Map());
  }
  
  set(key, value) {
    __privateGet$5(this, _mapCache).set(key, value);
    return value;
  }
  
  get(key, defaultValue = null) {
    const newVar = __privateGet$5(this, _mapCache).get(key);
    if (newVar) {
      return newVar;
    }
    return defaultValue;
  }
  
  getAll() {
    return __privateGet$5(this, _mapCache);
  }
}
_mapCache = new WeakMap();
const valueCache = new ValueCache();const wait = (milliseconds = 1e3) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};
const fileDownload = (content, fileName) => {
  const element = document.createElement("a");
  element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(content));
  element.setAttribute("download", fileName);
  element.style.display = "none";
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};
function saveTextAsFile(text, filename = "data.txt") {
  const blob = new Blob([text], { type: "text/plain" });
  const downloadLink = document.createElement("a");
  downloadLink.href = URL.createObjectURL(blob);
  downloadLink.download = filename;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  setTimeout(() => {
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(downloadLink.href);
  }, 100);
}
const handleFileReader = (event) => {
  return new Promise((resolve, reject) => {
    const file = event.target.files[0];
    if (!file) {
      reject("未读取到文件");
      return;
    }
    let reader = new FileReader();
    reader.onload = (e) => {
      const fileContent = e.target.result;
      resolve({ file, content: fileContent });
      reader = null;
    };
    reader.readAsText(file);
  });
};
const isIterable = (obj) => {
  return obj != null && typeof obj[Symbol.iterator] === "function";
};
const toTimeString = () => {
  return ( new Date()).toLocaleString();
};
function debounce(func, wait2 = 1e3) {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait2);
  };
}
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
const getLocalStorage = (key, isList = false, defaultValue = null) => {
  const item = localStorage.getItem(key);
  if (item === null) {
    return defaultValue;
  }
  if (isList) {
    try {
      return JSON.parse(item);
    } catch (e) {
      console.error(`读取localStorage时尝试转换${key}的值失败`, e);
      return defaultValue;
    }
  }
  return item;
};
const formatTimestamp = (timestamp, options = {}) => {
  if (!timestamp || isNaN(timestamp)) return "Invalid Timestamp";
  const ts = String(timestamp).length === 10 ? +timestamp * 1e3 : +timestamp;
  const timezoneOffset = (options.timezone || 0) * 60 * 60 * 1e3;
  const date = new Date(ts + timezoneOffset);
  if (isNaN(date.getTime())) return "Invalid Date";
  const timeObj = {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    hours: date.getUTCHours(),
    minutes: date.getUTCMinutes(),
    seconds: date.getUTCSeconds()
  };
  if (options.returnObject) return timeObj;
  const format = options.format || "YYYY-MM-DD HH:mm:ss";
  const pad = (n) => n.toString().padStart(2, "0");
  return format.replace(/YYYY/g, timeObj.year).replace(/YY/g, String(timeObj.year).slice(-2)).replace(/MM/g, pad(timeObj.month)).replace(/M/g, timeObj.month).replace(/DD/g, pad(timeObj.day)).replace(/D/g, timeObj.day).replace(/HH/g, pad(timeObj.hours)).replace(/H/g, timeObj.hours).replace(/mm/g, pad(timeObj.minutes)).replace(/m/g, timeObj.minutes).replace(/ss/g, pad(timeObj.seconds)).replace(/s/g, timeObj.seconds);
};
const calculateLikeRate = (likeCount, viewCount) => {
  if (viewCount === 0) {
    return 0;
  }
  return parseInt(likeCount / viewCount * 100);
};
const calculateInteractionRate = (danmaku, reply, view) => {
  return parseInt((danmaku + reply) / view * 100);
};
const calculateTripleRate = (favorite, coin, share, view) => {
  return parseInt((favorite + coin + share) / view * 100);
};
const calculateCoinLikesRatioRate = (coin, like) => {
  return parseInt(coin / like * 100);
};
const addGzStyle = (el, insertionPosition = document.head) => {
  const styleEl = el.querySelector("style[gz_style]");
  if (styleEl !== null) {
    console.log("已有gz_style样式，故不再插入该样式内容");
    return;
  }
  const style = document.createElement("style");
  style.setAttribute("gz_style", "");
  style.textContent = gzStyleCss;
  insertionPosition.appendChild(style);
};
function initVueApp(el, App, props = {}) {
  return new Vue({
    render: (h) => h(App, { props })
  }).$mount(el);
}
function getFutureTimestamp(days = 0, hours = 0, minutes = 0, seconds = 0) {
  const now =  new Date();
  const ms = days * 24 * 60 * 60 * 1e3 + hours * 60 * 60 * 1e3 + minutes * 60 * 1e3 + seconds * 1e3;
  const future = new Date(now.getTime() + ms);
  return future.getTime();
}
const getJQuery = async () => {
  return new Promise((resolve) => {
    const $ = valueCache.get("$");
    if ($) {
      resolve($);
      return;
    }
    const i1 = setInterval(() => {
      const $2 = unsafeWindow["$"];
      if ($2) {
        valueCache.set("$", $2);
        clearInterval(i1);
        resolve($2);
      }
    }, 1e3);
  });
};
var defUtil = {
  wait,
  fileDownload,
  toTimeString,
  getJQuery,
  debounce,
  throttle,
  handleFileReader,
  isIterable,
  getLocalStorage,
  formatTimestamp,
  calculateLikeRate,
  calculateInteractionRate,
  calculateTripleRate,
  calculateCoinLikesRatioRate
};var script$x = {
  data() {
    return {
      showRightTopMainButSwitch: localMKData.isShowRightTopMainButSwitch(),
      isFirstFullDisplay: localMKData.isFirstFullDisplay(),
      isHalfHiddenIntervalAfterInitialDisplay: localMKData.isHalfHiddenIntervalAfterInitialDisplay(),
      drawerShortcutKeyVal: getDrawerShortcutKeyGm(),
      isListeningForKey: false,
      isShowBackToTopVal: localMKData.isShowBackToTopBtn(),
      darkModeState: GM_getValue("dark_mode_state", "auto")
    };
  },
  methods: {
    startListeningForKey() {
      this.isListeningForKey = true;
    },
    setShortcutKey(key) {
      if (!this.isListeningForKey) return;
      this.isListeningForKey = false;
      if (this.drawerShortcutKeyVal === key) {
        this.$message("不需要重复设置");
        return;
      }
      GM_setValue("drawer_shortcut_key_gm", key);
      this.$notify({ message: "已设置打开关闭主面板快捷键", type: "success" });
      this.drawerShortcutKeyVal = key;
    }
  },
  watch: {
    showRightTopMainButSwitch(newVal) {
      GM_setValue("showRightTopMainButSwitch", newVal === true);
      eventEmitter.send("显隐主面板开关", newVal);
    },
    isFirstFullDisplay(newVal) {
      GM_setValue("isFirstFullDisplay", newVal === true);
    },
    isHalfHiddenIntervalAfterInitialDisplay(newBool) {
      GM_setValue("is_half_hidden_interval_after_initial_display", newBool === true);
    },
    isShowBackToTopVal(newVal) {
      GM_setValue("is_show_back_to_top_btn", newVal);
      eventEmitter.send("e:设置顶部按钮状态", newVal);
    },
    darkModeState(newVal) {
      GM_setValue("dark_mode_state", newVal);
      window.dispatchEvent(new CustomEvent("bb-dark-mode-change"));
      eventEmitter.send("toggle-dark-mode", newVal);
    }
  },
  created() {
    eventEmitter.on("event-keydownEvent", (event) => {
      if (this.isListeningForKey) {
        this.setShortcutKey(event.key);
      }
    });
  }
};function normalizeComponent(template, style, script, scopeId, isFunctionalTemplate, moduleIdentifier , shadowMode, createInjector, createInjectorSSR, createInjectorShadow) {
    const options = typeof script === 'function' ? script.options : script;
    if (template && template.render) {
        options.render = template.render;
        options.staticRenderFns = template.staticRenderFns;
        options._compiled = true;
    }
    if (scopeId) {
        options._scopeId = scopeId;
    }
    let hook;
    if (style) {
        hook = function (context) {
                style.call(this, createInjector(context));
            };
    }
    if (hook) {
        if (options.functional) {
            const originalRender = options.render;
            options.render = function renderWithStyleInjection(h, context) {
                hook.call(context);
                return originalRender(h, context);
            };
        }
        else {
            const existing = options.beforeCreate;
            options.beforeCreate = existing ? [].concat(existing, hook) : [hook];
        }
    }
    return script;
}
const __vue_script__$x = script$x;
var __vue_render__$x = function () {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _c(
    "div",
    [
      _c(
        "el-card",
        {
          attrs: { shadow: "never" },
          scopedSlots: _vm._u([
            {
              key: "header",
              fn: function () {
                return [_c("span", [_vm._v("外观")])]
              },
              proxy: true,
            },
          ]),
        },
        [
          _vm._v(" "),
          _c(
            "el-radio-group",
            {
              attrs: { size: "small" },
              model: {
                value: _vm.darkModeState,
                callback: function ($$v) {
                  _vm.darkModeState = $$v;
                },
                expression: "darkModeState",
              },
            },
            [
              _c("el-radio-button", { attrs: { label: "light" } }, [
                _vm._v("亮色"),
              ]),
              _vm._v(" "),
              _c("el-radio-button", { attrs: { label: "auto" } }, [
                _vm._v("自动"),
              ]),
              _vm._v(" "),
              _c("el-radio-button", { attrs: { label: "dark" } }, [
                _vm._v("暗色"),
              ]),
            ],
            1
          ),
        ],
        1
      ),
      _vm._v(" "),
      _c(
        "el-card",
        {
          attrs: { shadow: "never" },
          scopedSlots: _vm._u([
            {
              key: "header",
              fn: function () {
                return [_c("span", [_vm._v("页面右侧悬浮按钮")])]
              },
              proxy: true,
            },
          ]),
        },
        [
          _vm._v(" "),
          _c(
            "div",
            {
              staticStyle: {
                display: "flex",
                "flex-wrap": "wrap",
                gap: "8px 16px",
              },
            },
            [
              _c("el-switch", {
                attrs: { "active-text": "显示按钮" },
                model: {
                  value: _vm.showRightTopMainButSwitch,
                  callback: function ($$v) {
                    _vm.showRightTopMainButSwitch = $$v;
                  },
                  expression: "showRightTopMainButSwitch",
                },
              }),
              _vm._v(" "),
              _c(
                "el-tooltip",
                {
                  attrs: { content: "页面加载完是否完整展示按钮，否则半隐藏" },
                },
                [
                  _c("el-switch", {
                    attrs: { "active-text": "初次完整显示" },
                    model: {
                      value: _vm.isFirstFullDisplay,
                      callback: function ($$v) {
                        _vm.isFirstFullDisplay = $$v;
                      },
                      expression: "isFirstFullDisplay",
                    },
                  }),
                ],
                1
              ),
              _vm._v(" "),
              _c(
                "el-tooltip",
                { attrs: { content: "完整展示后间隔10秒半隐藏" } },
                [
                  _c("el-switch", {
                    attrs: { "active-text": "间隔后半隐藏" },
                    model: {
                      value: _vm.isHalfHiddenIntervalAfterInitialDisplay,
                      callback: function ($$v) {
                        _vm.isHalfHiddenIntervalAfterInitialDisplay = $$v;
                      },
                      expression: "isHalfHiddenIntervalAfterInitialDisplay",
                    },
                  }),
                ],
                1
              ),
              _vm._v(" "),
              _c("el-switch", {
                attrs: { "active-text": "显示回到顶部" },
                model: {
                  value: _vm.isShowBackToTopVal,
                  callback: function ($$v) {
                    _vm.isShowBackToTopVal = $$v;
                  },
                  expression: "isShowBackToTopVal",
                },
              }),
            ],
            1
          ),
        ]
      ),
      _vm._v(" "),
      _c(
        "el-card",
        {
          attrs: { shadow: "never" },
          scopedSlots: _vm._u([
            {
              key: "header",
              fn: function () {
                return [_c("span", [_vm._v("快捷键")])]
              },
              proxy: true,
            },
          ]),
        },
        [
          _vm._v(" "),
          _c(
            "div",
            {
              staticStyle: {
                display: "flex",
                "align-items": "center",
                gap: "8px",
                "flex-wrap": "wrap",
              },
            },
            [
              _c(
                "span",
                { staticStyle: { "font-size": "12px", color: "#9499A0" } },
                [_vm._v("展开/关闭主面板：")]
              ),
              _vm._v(" "),
              _c("el-tag", { attrs: { size: "small" } }, [
                _vm._v(_vm._s(_vm.drawerShortcutKeyVal || "未设置")),
              ]),
              _vm._v(" "),
              !_vm.isListeningForKey
                ? _c(
                    "el-button",
                    {
                      attrs: { size: "small" },
                      on: { click: _vm.startListeningForKey },
                    },
                    [_vm._v("设置快捷键")]
                  )
                : _c(
                    "el-tag",
                    {
                      attrs: { size: "small", type: "danger", effect: "dark" },
                    },
                    [_vm._v("请按下需要设置的键位...")]
                  ),
            ],
            1
          ),
        ]
      ),
    ],
    1
  )
};
var __vue_staticRenderFns__$x = [];
__vue_render__$x._withStripped = true;
  
  const __vue_inject_styles__$x = undefined;
  
  const __vue_scope_id__$x = undefined;
  
  const __vue_module_identifier__$x = undefined;
  
  const __vue_is_functional_template__$x = false;
  
  
  
  
  
  
  
  const __vue_component__$x = normalizeComponent(
    { render: __vue_render__$x, staticRenderFns: __vue_staticRenderFns__$x },
    __vue_inject_styles__$x,
    __vue_script__$x,
    __vue_scope_id__$x,
    __vue_is_functional_template__$x,
    __vue_module_identifier__$x,
    false,
    undefined);var script$w = {
  data() {
    return {
      compatible_BEWLY_BEWLY: globalValue.compatibleBEWLYBEWLY,
      discardOldCommentAreasV: localMKData.isDiscardOldCommentAreas()
    };
  },
  watch: {
    compatible_BEWLY_BEWLY(newVal) {
      GM_setValue("compatible_BEWLY_BEWLY", newVal === true);
    },
    discardOldCommentAreasV(newVal) {
      GM_setValue("discardOldCommentAreas", newVal === true);
    }
  }
};
const __vue_script__$w = script$w;
var __vue_render__$w = function () {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _c(
    "div",
    [
      _c(
        "el-card",
        {
          scopedSlots: _vm._u([
            {
              key: "header",
              fn: function () {
                return [_vm._v("说明")]
              },
              proxy: true,
            },
          ]),
        },
        [
          _vm._v(" "),
          _c("div", [
            _vm._v(
              "如果用户没有安装并使用对应脚本或插件，就不要开启相关兼容选项"
            ),
          ]),
        ]
      ),
      _vm._v(" "),
      _c(
        "el-card",
        {
          scopedSlots: _vm._u([
            {
              key: "header",
              fn: function () {
                return [_vm._v("Bewly插件(BewlyCat)原BewlyBewly")]
              },
              proxy: true,
            },
          ]),
        },
        [
          _vm._v(" "),
          _c("div", [
            _vm._v("\n      兼容BewlyCat的版本可看使用文档，不往前兼容\n    "),
          ]),
          _vm._v(" "),
          _c("el-switch", {
            attrs: { "active-text": "首页适配" },
            model: {
              value: _vm.compatible_BEWLY_BEWLY,
              callback: function ($$v) {
                _vm.compatible_BEWLY_BEWLY = $$v;
              },
              expression: "compatible_BEWLY_BEWLY",
            },
          }),
        ],
        1
      ),
      _vm._v(" "),
      _c(
        "el-card",
        {
          scopedSlots: _vm._u([
            {
              key: "header",
              fn: function () {
                return [_vm._v("评论区")]
              },
              proxy: true,
            },
          ]),
        },
        [
          _vm._v(
            "\n    使用之后需刷新对应页面才可生效，勾选即评论区使用新版获取方式，不再使用旧版方式\n    "
          ),
          _c(
            "div",
            [
              _c("el-switch", {
                attrs: { "active-text": "弃用旧版评论区处理" },
                model: {
                  value: _vm.discardOldCommentAreasV,
                  callback: function ($$v) {
                    _vm.discardOldCommentAreasV = $$v;
                  },
                  expression: "discardOldCommentAreasV",
                },
              }),
            ],
            1
          ),
        ]
      ),
    ],
    1
  )
};
var __vue_staticRenderFns__$w = [];
__vue_render__$w._withStripped = true;
  
  const __vue_inject_styles__$w = undefined;
  
  const __vue_scope_id__$w = undefined;
  
  const __vue_module_identifier__$w = undefined;
  
  const __vue_is_functional_template__$w = false;
  
  
  
  
  
  
  
  const __vue_component__$w = normalizeComponent(
    { render: __vue_render__$w, staticRenderFns: __vue_staticRenderFns__$w },
    __vue_inject_styles__$w,
    __vue_script__$w,
    __vue_scope_id__$w,
    __vue_is_functional_template__$w,
    __vue_module_identifier__$w,
    false,
    undefined);var script$v = {
  data() {
    return {
      dialogVisible: false,
      content: ""
    };
  },
  methods: {
    handleClose(done) {
      this.$confirm("确认关闭？").then((_) => {
        done();
      }).catch((_) => {
      });
    }
  },
  created() {
    eventEmitter.on("展示内容对话框", (newContent) => {
      this.content = newContent;
      this.$message("已更新内容");
      this.dialogVisible = true;
    });
  }
};
const __vue_script__$v = script$v;
var __vue_render__$v = function () {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _c(
    "div",
    [
      _c(
        "el-dialog",
        {
          attrs: {
            "before-close": _vm.handleClose,
            fullscreen: true,
            visible: _vm.dialogVisible,
            title: "提示",
            width: "30%",
          },
          on: {
            "update:visible": function ($event) {
              _vm.dialogVisible = $event;
            },
          },
        },
        [
          _c("el-input", {
            attrs: { autosize: "", type: "textarea" },
            model: {
              value: _vm.content,
              callback: function ($$v) {
                _vm.content = $$v;
              },
              expression: "content",
            },
          }),
          _vm._v(" "),
          _c(
            "span",
            {
              staticClass: "dialog-footer",
              attrs: { slot: "footer" },
              slot: "footer",
            },
            [
              _c(
                "el-button",
                {
                  on: {
                    click: function ($event) {
                      _vm.dialogVisible = false;
                    },
                  },
                },
                [_vm._v("取 消")]
              ),
              _vm._v(" "),
              _c(
                "el-button",
                {
                  attrs: { type: "primary" },
                  on: {
                    click: function ($event) {
                      _vm.dialogVisible = false;
                    },
                  },
                },
                [_vm._v("确 定")]
              ),
            ],
            1
          ),
        ],
        1
      ),
    ],
    1
  )
};
var __vue_staticRenderFns__$v = [];
__vue_render__$v._withStripped = true;
  
  const __vue_inject_styles__$v = undefined;
  
  const __vue_scope_id__$v = undefined;
  
  const __vue_module_identifier__$v = undefined;
  
  const __vue_is_functional_template__$v = false;
  
  
  
  
  
  
  
  const __vue_component__$v = normalizeComponent(
    { render: __vue_render__$v, staticRenderFns: __vue_staticRenderFns__$v },
    __vue_inject_styles__$v,
    __vue_script__$v,
    __vue_scope_id__$v,
    __vue_is_functional_template__$v,
    __vue_module_identifier__$v,
    false,
    undefined);const isDOMElement = (obj) => {
  return obj !== null && typeof obj === "object" && "nodeType" in obj;
};
const inProgressCache =  new Map();
const validationElFun = (config, selector) => {
  const element = config.doc.querySelector(selector);
  if (element === null) return null;
  return config.parseShadowRoot && element.shadowRoot ? element.shadowRoot : element;
};
const __privateValidationElFun = (config, selector) => {
  const result = config.validationElFun(config, selector);
  return isDOMElement(result) ? result : null;
};
const findElement = async (selector, config = {}) => {
  const defConfig = {
    doc: document,
    interval: 1e3,
    timeout: -1,
    parseShadowRoot: false,
    cacheInProgress: true,
    validationElFun
  };
  config = { ...defConfig, ...config };
  const result = __privateValidationElFun(config, selector);
  if (result !== null) return result;
  const cacheKey = `findElement:${selector}`;
  if (config.cacheInProgress) {
    const cachedPromise = inProgressCache.get(cacheKey);
    if (cachedPromise) {
      return cachedPromise;
    }
  }
  const p = new Promise((resolve) => {
    let timeoutId, IntervalId;
    IntervalId = setInterval(() => {
      const result2 = __privateValidationElFun(config, selector);
      if (result2 === null) return;
      resolve(result2);
    }, config.interval);
    const cleanup = () => {
      if (IntervalId) clearInterval(IntervalId);
      if (timeoutId) clearTimeout(timeoutId);
      if (config.cacheInProgress) {
        inProgressCache.delete(cacheKey);
      }
    };
    if (config.timeout > 0) {
      timeoutId = setTimeout(() => {
        resolve(null);
        cleanup();
      }, config.timeout);
    }
  });
  if (config.cacheInProgress) {
    inProgressCache.set(cacheKey, p);
  }
  return p;
};
const findElementChain = (selector, config = {}) => {
  const paths = [];
  const chainObj = {
    
    find(childSelector, childConfig = {}) {
      if (config.allparseShadowRoot) {
        childConfig.parseShadowRoot = true;
      }
      childSelector.trim();
      if (childSelector === "" || childSelector.search(/^\d/) !== -1) {
        throw new Error("非法的元素选择器");
      }
      const separator = config.separator ?? childConfig.separator;
      if (separator === void 0 || separator === null || separator.trim() === "") {
        paths.push({ selector: childSelector, config: childConfig });
      } else {
        const selectorArr = childSelector.split(separator);
        if (selectorArr.length === 1) {
          paths.push({ selector: childSelector, config: childConfig });
        } else {
          for (let s of selectorArr) {
            s = s.trim();
            if (s === "") continue;
            childConfig.originalSelector = childSelector;
            paths.push({ selector: s, config: childConfig });
          }
        }
      }
      return this;
    },
    
    get() {
      return new Promise(async (resolve) => {
        let currentDoc = null;
        for ({ selector, config } of paths) {
          const resolvedConfig = { ...config };
          if (config.doc === null || config.doc === void 0) {
            resolvedConfig.doc = currentDoc ?? document;
          } else {
            resolvedConfig.doc = config.doc;
          }
          const res = await findElement(selector, resolvedConfig);
          if (res === null) {
            continue;
          }
          currentDoc = res;
        }
        resolve(currentDoc);
      });
    }
  };
  chainObj.find(selector, config);
  return chainObj;
};
const findElements = async (selector, config = {}) => {
  const defConfig = { doc: document, interval: 1e3, timeout: -1, parseShadowRoot: false };
  config = { ...defConfig, ...config };
  return new Promise((resolve) => {
    const i1 = setInterval(() => {
      const els = config.doc.querySelectorAll(selector);
      if (els.length > 0) {
        const list = [];
        for (const el of els) {
          if (config.parseShadowRoot) {
            const shadowRoot = el?.shadowRoot;
            list.push(shadowRoot ? shadowRoot : el);
            continue;
          }
          list.push(el);
        }
        resolve(list);
        clearInterval(i1);
      }
    }, config.interval);
    if (config.timeout > 0) {
      setTimeout(() => {
        clearInterval(i1);
        resolve([]);
      }, config.timeout);
    }
  });
};
const findElementsAndBindEvents = (css, callback, config = {}) => {
  config = {
    ...{
      interval: 2e3,
      timeOut: 3e3
    },
    config
  };
  setTimeout(() => {
    findElement(css, { interval: config.interval }).then((el) => {
      el.addEventListener("click", () => {
        callback();
      });
    });
  }, config.timeOut);
};
const hoverTimeoutEvents =  new Map();
const addHoverTimeoutEvent = (el, callback, timeout = 2e3) => {
  if (typeof el === "string") {
    el = document.querySelector(el);
  }
  if (el === null) return false;
  const attribute = el.getAttribute("data-hover-timeout");
  if (attribute !== null) return false;
  el.setAttribute("data-hover-timeout", "");
  let time = null;
  const mouseenter = (e) => {
    time = setTimeout(() => {
      callback(e);
    }, timeout);
  };
  const mouseleave = () => {
    if (time === null) {
      return;
    }
    clearTimeout(time);
  };
  hoverTimeoutEvents.set(el, { mouseenter, mouseleave });
  el.addEventListener("mouseenter", mouseenter);
  el.addEventListener("mouseleave", mouseleave);
  return true;
};
const removeHoverTimeoutEvent = (el) => {
  const attribute = el.getAttribute("data-hover-timeout");
  if (attribute === null) return false;
  el.removeEventListener("mouseenter", hoverTimeoutEvents.get(el).mouseenter);
  el.removeEventListener("mouseleave", hoverTimeoutEvents.get(el).mouseleave);
  return true;
};
const createVueDiv = (el = null, cssTests = null) => {
  const panelDiv = document.createElement("div");
  if (cssTests !== null) {
    panelDiv.style.cssText = cssTests;
  }
  const vueDiv = document.createElement("div");
  panelDiv.appendChild(vueDiv);
  if (el !== null) {
    el.appendChild(panelDiv);
  }
  return { panelDiv, vueDiv };
};
var elUtil = {
  findElement,
  isDOMElement,
  addHoverTimeoutEvent,
  removeHoverTimeoutEvent,
  findElements,
  findElementChain,
  findElementsAndBindEvents,
  
  installStyle(cssText, selectorOptions = null) {
    const { type = "class", value = "", doc = document.head } = selectorOptions ? selectorOptions : {};
    let selector = "";
    switch (type) {
      case "class":
        selector = `.${value}`;
        break;
      case "id":
        selector = `#${value}`;
        break;
      default:
        selector = `[${type}="${value}"]`;
    }
    let styleEl = value === "" ? null : doc.querySelector(selector);
    if (styleEl === null) {
      styleEl = document.createElement("style");
      switch (type) {
        case "class":
          styleEl.className = value;
          break;
        case "id":
          styleEl.id = value;
          break;
        default:
          styleEl.setAttribute(type, value);
          break;
      }
      doc.appendChild(styleEl);
    }
    styleEl.textContent = cssText;
  },
  createVueDiv,
  byXpathEl(xpath, doc = document) {
    return document.evaluate(xpath, doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  },
  
  async byXpathElAsync(xpath, doc = document, timeout = 1e3) {
    return new Promise((resolve) => {
      let xpathEl = this.byXpathEl(xpath, doc);
      if (xpathEl !== null) {
        return resolve(xpathEl);
      }
      const interval = setInterval(() => {
        xpathEl = this.byXpathEl(xpath, doc);
        if (xpathEl === null) return;
        resolve(xpathEl);
        clearInterval(interval);
      }, timeout);
    });
  },
  byXpathEls(xpath, doc = document) {
    const xPathResult = document.evaluate(xpath, doc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    const elList = [];
    for (let i = 0; i < xPathResult.snapshotLength; i++) {
      const items = xPathResult.snapshotItem(i);
      if (items === null) continue;
      elList.push(items);
    }
    return elList;
  },
  byXpathNumber(xpath, doc = document) {
    return document.evaluate(xpath, doc, null, XPathResult.NUMBER_TYPE, null).numberValue;
  },
  byXpathString(xpath, doc = document) {
    return document.evaluate(xpath, doc, null, XPathResult.STRING_TYPE, null).stringValue;
  },
  byXpathBoolean(xpath, doc = document) {
    return document.evaluate(xpath, doc, null, XPathResult.BOOLEAN_TYPE, null).booleanValue;
  }
};var ruleKeyListDataJson = [
  {
    "key": "name",
    "name": "用户名(模糊匹配)"
  },
  {
    "key": "precise_name",
    "name": "用户名(精确匹配)"
  },
  {
    "key": "nameCanonical",
    "name": "用户名(正则匹配)"
  },
  {
    "key": "precise_uid",
    "type": "int",
    "name": "用户uid(精确匹配)"
  },
  {
    "key": "precise_uid_white",
    "type": "int",
    "name": "用户uid白名单(精确匹配)"
  },
  {
    "key": "title",
    "name": "标题(模糊匹配)"
  },
  {
    "key": "titleCanonical",
    "name": "标题(正则匹配)"
  },
  {
    "key": "commentOn",
    "name": "评论关键词(模糊匹配)"
  },
  {
    "key": "commentOnCanonical",
    "name": "评论关键词(正则匹配)"
  },
  {
    "key": "dynamic",
    "name": "动态关键词(模糊匹配)"
  },
  {
    "key": "dynamicCanonical",
    "name": "动态关键词(正则匹配)"
  },
  {
    "key": "dynamic_video",
    "name": "动态视频关键词(模糊匹配)"
  },
  {
    "key": "dynamic_videoCanonical",
    "name": "动态视频关键词(正则匹配)"
  },
  {
    "key": "precise_tag",
    "name": "话题tag标签(精确匹配)"
  },
  {
    "key": "tag",
    "name": "话题tag标签(模糊匹配)"
  },
  {
    "key": "tagCanonical",
    "name": "话题tag标签(正则匹配)"
  },
  {
    "key": "videoTag",
    "name": "视频tag(模糊匹配)"
  },
  {
    "key": "precise_videoTag",
    "name": "视频tag(精确匹配)"
  },
  {
    "key": "videoTagCanonical",
    "name": "视频tag(正则匹配)"
  },
  {
    "key": "videoTag_preciseCombination",
    "name": "精确视频tag(组合匹配)"
  },
  {
    "key": "videoTag_combination_white",
    "name": "白名单视频tag(组合匹配)"
  },
  {
    "key": "hotSearchKey",
    "name": "热搜关键词(模糊匹配)"
  },
  {
    "key": "hotSearchKeyCanonical",
    "name": "热搜关键词(正则匹配)"
  },
  {
    "key": "precise_avatarPendantName",
    "name": "头像挂件名(精确匹配)"
  },
  {
    "key": "avatarPendantName",
    "name": "头像挂件名(模糊匹配)"
  },
  {
    "key": "signature",
    "name": "用户签名(模糊匹配)"
  },
  {
    "key": "signatureCanonical",
    "name": "用户签名(正则匹配)"
  },
  {
    "key": "videoDesc",
    "name": "视频简介(模糊匹配)"
  },
  {
    "key": "videoDescCanonical",
    "name": "视频简介(正则匹配)"
  },
  {
    "key": "precise_video_bv",
    "name": "视频bv号(精确匹配)"
  },
  {
    "key": "argue_msg",
    "name": "争议警告消息(模糊匹配)"
  },
  {
    "key": "argue_msg_precise",
    "name": "争议警告消息(精确匹配)"
  },
  {
    "key": "precise_decoration_id",
    "type": "int",
    "name": "装扮id(精确匹配)"
  },
  {
    "key": "precise_decoration_collection_id",
    "type": "int",
    "name": "装扮收藏集id(精确匹配)"
  }
];const getSelectOptions = () => {
  const options = [
    {
      value: "模糊匹配",
      label: "模糊匹配",
      children: []
    },
    {
      value: "正则匹配",
      label: "正则匹配",
      children: []
    },
    {
      value: "组合匹配",
      label: "组合匹配",
      children: []
    },
    {
      value: "精确匹配",
      label: "精确匹配",
      children: []
    }
  ];
  for (let { name, key } of ruleKeyListDataJson) {
    let children;
    if (name.includes("(模糊匹配)")) {
      children = options[0].children;
    }
    if (name.includes("(正则匹配)")) {
      children = options[1].children;
    }
    if (name.includes("(组合匹配)")) {
      children = options[2].children;
    }
    if (name.includes("(精确匹配)")) {
      children = options[3].children;
    }
    children.push({
      value: key,
      label: name
    });
  }
  return options;
};
const getRuleKeyListData = () => {
  return ruleKeyListDataJson;
};
const getRuleKeyList = () => {
  return ruleKeyListDataJson.map((item) => {
    return item.key;
  });
};
const getNameArr = () => {
  return GM_getValue("name", []);
};
const getPreciseNameArr = () => {
  return GM_getValue("precise_name", []);
};
const getNameCanonical = () => {
  return GM_getValue("nameCanonical", []);
};
const getPreciseUidArr = () => {
  return GM_getValue("precise_uid", []);
};
const getPreciseUidWhiteArr = () => {
  return GM_getValue("precise_uid_white", []);
};
const getTitleArr = () => {
  return GM_getValue("title", []);
};
const getTitleCanonicalArr = () => {
  return GM_getValue("titleCanonical", []);
};
const getCommentOnArr = () => {
  return GM_getValue("commentOn", []);
};
const getCommentOnCanonicalArr = () => {
  return GM_getValue("commentOnCanonical", []);
};
const getPreciseTagArr = () => {
  return GM_getValue("precise_tag", []);
};
const getTagArr = () => {
  return GM_getValue("tag", []);
};
const getTagCanonicalArr = () => {
  return GM_getValue("tagCanonical", []);
};
const getVideoTagArr = () => {
  return GM_getValue("videoTag", []);
};
const getPreciseVideoTagArr = () => {
  return GM_getValue("precise_videoTag", []);
};
const getVideoTagCanonicalArr = () => {
  return GM_getValue("videoTagCanonical", []);
};
const getHotSearchKeyArr = () => {
  return GM_getValue("hotSearchKey", []);
};
const getHotSearchKeyCanonicalArr = () => {
  return GM_getValue("hotSearchKeyCanonical", []);
};
const clearKeyItem = (ruleKey) => {
  GM_deleteValue(ruleKey);
};
const getVideoTagPreciseCombination = () => {
  return GM_getValue("videoTag_preciseCombination", []);
};
const getPreciseVideoBV = () => {
  return GM_getValue("precise_video_bv", []);
};
var ruleKeyListData = {
  getNameArr,
  getPreciseNameArr,
  getNameCanonical,
  getPreciseUidArr,
  getPreciseUidWhiteArr,
  getTitleArr,
  getTitleCanonicalArr,
  getCommentOnArr,
  getCommentOnCanonicalArr,
  getRuleKeyListData,
  getPreciseTagArr,
  getTagArr,
  getTagCanonicalArr,
  getVideoTagArr,
  getPreciseVideoTagArr,
  getVideoTagCanonicalArr,
  getHotSearchKeyArr,
  getHotSearchKeyCanonicalArr,
  clearKeyItem,
  getSelectOptions,
  getVideoTagPreciseCombination,
  getRuleKeyList,
  getPreciseVideoBV,
  
  getVideoTagCombinationWhite() {
    return GM_getValue("videoTag_combination_white", []);
  }
};const exactMatch = (ruleList, value) => {
  if (ruleList === null || ruleList === void 0) return false;
  if (!Array.isArray(ruleList)) return false;
  return ruleList.some((item) => item === value);
};
const bFuzzyAndRegularMatchingWordsToLowercase = localMKData.bFuzzyAndRegularMatchingWordsToLowercase();
const regexMatch = (ruleList, value) => {
  if (ruleList === null || ruleList === void 0) return null;
  if (!Array.isArray(ruleList)) return null;
  if (bFuzzyAndRegularMatchingWordsToLowercase) {
    value = value.toLowerCase();
  }
  value = value.split(/[\t\r\f\n\s]*/g).join("");
  const find = ruleList.find((item) => {
    try {
      return value.search(item) !== -1;
    } catch (e) {
      const msg = `正则匹配失败，请检查规则列表中的正则表达式是否正确，错误信息：${e.message}`;
      eventEmitter.send("正则匹配时异常", { e, msg });
      return false;
    }
  });
  return find === void 0 ? null : find;
};
const fuzzyMatch = (ruleList, value) => {
  if (ruleList === null || ruleList === void 0 || value === null) return null;
  if (!Array.isArray(ruleList)) return null;
  const find = ruleList.find((item) => value.toLowerCase().includes(item));
  return find === void 0 ? null : find;
};
var ruleMatchingUtil = {
  exactMatch,
  regexMatch,
  fuzzyMatch
};const dealingWithHotSearchTerms = (el, label) => {
  const hotSearchKeyArr = ruleKeyListData.getHotSearchKeyArr();
  const hotSearchKeyCanonicalArr = ruleKeyListData.getHotSearchKeyCanonicalArr();
  let match = ruleMatchingUtil.fuzzyMatch(hotSearchKeyArr, label);
  if (match) {
    el.remove();
    eventEmitter.send("打印信息", `根据模糊热搜关键词-【${match}】-屏蔽-${label}`);
    return;
  }
  match = ruleMatchingUtil.regexMatch(hotSearchKeyCanonicalArr, label);
  if (match) {
    eventEmitter.send("打印信息", `根据正则热搜关键词-【${match}】-屏蔽-${label}`);
    el.remove();
  }
};
const startShieldingHotList = async () => {
  if (isHideHotSearchesPanelGm()) {
    return;
  }
  console.log("检查热搜关键词中...");
  const elList = await elUtil.findElements(
    ".trendings-col>.trending-item,.trendings-single>.trending-item",
    { interval: 2e3 }
  );
  console.log("热搜元素列表", elList);
  for (let el of elList) {
    const label = el.textContent.trim();
    dealingWithHotSearchTerms(el, label);
  }
};
const startShieldingHotListDynamic = async () => {
  const elList = await elUtil.findElements(".trending-list>a");
  console.log("动态首页右侧热搜列表", elList);
  for (const el of elList) {
    const label = el.querySelector(".text").textContent.trim();
    dealingWithHotSearchTerms(el, label);
  }
};
const setTopSearchPanelDisplay = (hide, name = "搜索历史") => {
  const id = name === "搜索历史" ? "mk-hide-search-history" : "mk-hide-search-trending";
  const selectors = name === "搜索历史" ? `.search-panel>.history, .bili-header__search-panel .history, .search-panel .history-tab` : `.search-panel>.trending, .bili-header__search-panel .trending, .search-panel .trending-tab`;
  const cssText = hide ? `${selectors} { display: none !important; }` : "";
  elUtil.installStyle(cssText, { type: "id", value: id });
  const msg = name === "搜索历史" ? "搜索历史" : "热搜";
  eventEmitter.send("打印信息", `已将顶部搜索框${msg}显示状态设置为${hide ? "隐藏" : "显示"}`);
};
const run$5 = () => {
  setTopSearchPanelDisplay(isHideSearchHistoryPanelGm());
  setTopSearchPanelDisplay(isHideHotSearchesPanelGm(), "热搜");
};
var hotSearch = {
  startShieldingHotList,
  setTopSearchPanelDisplay,
  run: run$5,
  startShieldingHotListDynamic
};const setTopInputPlaceholder = async () => {
  if (globalValue.compatibleBEWLYBEWLY) {
    return;
  }
  const placeholder = valueCache.get("topInputPlaceholder");
  if (placeholder === null) {
    return;
  }
  const targetInput = await elUtil.findElement(".nav-search-input");
  targetInput.placeholder = placeholder;
  eventEmitter.send("el-notify", {
    title: "tip",
    message: "已恢复顶部搜索框提示内容"
  });
};
const processTopInputContent = async () => {
  if (globalValue.compatibleBEWLYBEWLY) {
    return;
  }
  if (!GM_getValue("isClearTopInputTipContent", false)) {
    return;
  }
  const targetInput = await elUtil.findElement(".nav-search-input");
  if (targetInput.placeholder === "") {
    await defUtil.wait(1500);
    await processTopInputContent();
    return;
  }
  valueCache.set("topInputPlaceholder", targetInput.placeholder);
  targetInput.placeholder = "";
  eventEmitter.send("el-msg", "清空了搜索框提示内容");
};
eventEmitter.on("执行清空顶部搜索框提示内容", () => {
  processTopInputContent();
});
var topInput = { processTopInputContent, setTopInputPlaceholder };const isRuleIntType = (type) => {
  const keyListData = ruleKeyListData.getRuleKeyListData();
  const find = keyListData.find((item) => item.key === type);
  if (find === void 0) {
    throw new Error("规则类型错误");
  }
  return find.type === "int";
};
const verificationInputValue = (ruleValue, type) => {
  if (ruleValue === null) return { status: false, res: "内容不能为空" };
  if (isRuleIntType(type)) {
    ruleValue = parseInt(ruleValue);
    if (isNaN(ruleValue)) {
      return {
        status: false,
        res: "请输入数字！"
      };
    }
  } else {
    ruleValue.trim();
  }
  if (ruleValue === "") {
    return { status: false, res: "内容不能为空" };
  }
  return { status: true, res: ruleValue };
};
const addRule = (ruleValue, type) => {
  const verificationRes = verificationInputValue(ruleValue, type);
  if (!verificationRes.status) {
    return verificationRes;
  }
  const arr = GM_getValue(type, []);
  if (arr.includes(verificationRes.res)) {
    return { status: false, res: "已存在此内容" };
  }
  arr.push(verificationRes.res);
  GM_setValue(type, arr);
  return { status: true, res: "添加成功" };
};
const batchAddRule = (ruleValues, type) => {
  const successList = [];
  const failList = [];
  const arr = GM_getValue(type, []);
  const isIntType = isRuleIntType(type);
  for (let v of ruleValues) {
    if (isIntType) {
      if (isNaN(v)) {
        failList.push(v);
        continue;
      }
      v = parseInt(v);
    }
    if (arr.includes(v)) {
      failList.push(v);
      continue;
    }
    arr.push(v);
    successList.push(v);
  }
  if (successList.length > 0) {
    GM_setValue(type, arr);
  }
  return {
    successList,
    failList
  };
};
const delRule = (type, value) => {
  const verificationRes = verificationInputValue(value, type);
  if (!verificationRes.status) {
    return verificationRes;
  }
  const { res } = verificationRes;
  const arr = GM_getValue(type, []);
  const indexOf = arr.indexOf(res);
  if (indexOf === -1) {
    return { status: false, res: "不存在此内容" };
  }
  arr.splice(indexOf, 1);
  GM_setValue(type, arr);
  return { status: true, res: "移除成功" };
};
const showDelRuleInput = async (type) => {
  let ruleValue;
  try {
    const { value } = await eventEmitter.invoke("el-prompt", "请输入要删除的规则内容", "删除指定规则");
    ruleValue = value;
  } catch (e) {
    return;
  }
  const { status, res } = delRule(type, ruleValue);
  eventEmitter.send("el-msg", res);
  status && eventEmitter.send("刷新规则信息");
};
const getRuleContent = (isToStr = true, space = 0) => {
  const ruleMap = {};
  for (let ruleKeyListDatum of ruleKeyListData.getRuleKeyListData()) {
    const key = ruleKeyListDatum.key;
    const data = GM_getValue(key, []);
    if (data.length === 0) continue;
    ruleMap[key] = data;
  }
  if (isToStr) {
    return JSON.stringify(ruleMap, null, space);
  }
  return ruleMap;
};
const verificationRuleMap = (keyArr, content) => {
  let parse;
  try {
    parse = JSON.parse(content);
  } catch (e) {
    alert("规则内容有误");
    return false;
  }
  const newRule = {};
  for (const key in parse) {
    if (!Array.isArray(parse[key])) {
      continue;
    }
    if (parse[key].length === 0) {
      continue;
    }
    newRule[key] = parse[key];
  }
  if (Object.keys(newRule).length === 0) {
    alert("规则内容为空");
    return false;
  }
  return newRule;
};
const overwriteImportRules = (content) => {
  const map = verificationRuleMap(ruleKeyListData.getRuleKeyList(), content);
  if (map === false) return false;
  for (let key of Object.keys(map)) {
    GM_setValue(key, map[key]);
  }
  return true;
};
const appendImportRules = (content) => {
  const map = verificationRuleMap(ruleKeyListData.getRuleKeyList(), content);
  if (map === false) return false;
  for (let key of Object.keys(map)) {
    const arr = GM_getValue(key, []);
    for (let item of map[key]) {
      if (!arr.includes(item)) {
        arr.push(item);
      }
    }
    GM_setValue(key, arr);
  }
  return true;
};
const addRulePreciseUid = (uid, isTip = true) => {
  const results = addRule(uid, "precise_uid");
  if (isTip) {
    eventEmitter.send("el-notify", {
      title: "添加精确uid操作提示",
      message: results.res,
      type: "success"
    });
    return results;
  }
  return results;
};
const addRulePreciseBv = (bv, isTip = true) => {
  const results = addRule(bv, "precise_video_bv");
  if (isTip) {
    eventEmitter.send("el-notify", {
      title: "添加精确bv操作提示",
      message: results.res,
      type: "success"
    });
    return results;
  }
  return results;
};
const delRUlePreciseUid = (uid, isTip = true) => {
  const results = delRule("precise_uid", uid);
  if (isTip) {
    eventEmitter.send("el-alert", results.res);
    return null;
  }
  return results;
};
const addRulePreciseName = (name, tip = true) => {
  const results = addRule(name, "precise_name");
  if (tip) {
    eventEmitter.send("el-msg", results.res);
  }
  return results;
};
const findRuleItemValue = (type, value) => {
  return GM_getValue(type, []).find((item) => item === value) || null;
};
const addItemRule = (arr, key, coverage = true) => {
  const complianceList = [];
  for (let v of arr) {
    const { status, res } = verificationInputValue(v, key);
    if (!status) return { status: false, msg: `内容中有误:${res}` };
    complianceList.push(v);
  }
  if (coverage) {
    GM_setValue(key, complianceList);
    return { status: true, msg: `添加成功-覆盖模式，数量：${complianceList.length}` };
  }
  const oldArr = GM_getValue(key, []);
  const newList = complianceList.filter((item) => !oldArr.includes(item));
  if (newList.length === 0) {
    return { status: false, msg: "内容重复" };
  }
  GM_setValue(key, oldArr.concat(newList));
  return { status: true, msg: "添加成功-追加模式，新增数量：" + newList.length };
};
const addPreciseUidItemRule = (uidArr, isTip = true, coverage = true) => {
  const { status, msg } = addItemRule(uidArr, "precise_uid", coverage);
  if (isTip) {
    eventEmitter.send("el-alert", msg);
    return status;
  }
  return { status, msg };
};
var ruleUtil = {
  addRule,
  batchAddRule,
  delRule,
  showDelRuleInput,
  getRuleContent,
  overwriteImportRules,
  appendImportRules,
  addRulePreciseUid,
  addRulePreciseName,
  delRUlePreciseUid,
  findRuleItemValue,
  addItemRule,
  addPreciseUidItemRule,
  addRulePreciseBv,
  isRuleIntType
};var __typeError$4 = (msg) => {
  throw TypeError(msg);
};
var __accessCheck$4 = (obj, member, msg) => member.has(obj) || __typeError$4("Cannot " + msg);
var __privateGet$4 = (obj, member, getter) => (__accessCheck$4(obj, member, "read from private field"), member.get(obj));
var __privateAdd$4 = (obj, member, value) => member.has(obj) ? __typeError$4("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var _elEvents;
class ElEventEmitter {
  constructor() {
    __privateAdd$4(this, _elEvents,  new Map());
  }
  
  addEvent(el, eventName, callback, repeated = false) {
    const elEvents = __privateGet$4(this, _elEvents);
    if (!elEvents.has(el)) {
      elEvents.set(el, { events: [], attrs: [] });
    }
    const { events, attrs } = elEvents.get(el);
    if (!repeated) {
      if (attrs.includes(eventName)) {
        return;
      }
    }
    attrs.push(eventName);
    events.push({ eventName, callback });
    el.setAttribute(`gz-event`, JSON.stringify(attrs));
    el.addEventListener(eventName, callback);
  }
  
  hasEventName(el, eventName) {
    const elEvents = __privateGet$4(this, _elEvents);
    if (elEvents.has(el)) {
      return true;
    }
    const { attrs } = elEvents.get(el);
    return attrs.includes(eventName);
  }
}
_elEvents = new WeakMap();
const elEventEmitter = new ElEventEmitter();const addBlockButton = (data, className = "gz_def_shielding_button", position = []) => {
  if (hideBlockButtonGm()) return;
  const { insertionPositionEl, explicitSubjectEl, cssMap, cssText } = data.data;
  if (className === "" || className === null || className === void 0) {
    className = "gz_def_shielding_button";
  }
  const butEl = insertionPositionEl.querySelector("." + className);
  if (butEl) return;
  const buttonEL = document.createElement("button");
  buttonEL.setAttribute("gz_type", "");
  if (className !== "") {
    buttonEL.className = className;
  }
  buttonEL.textContent = "屏蔽";
  if (position.length !== 0) {
    buttonEL.style.position = "absolute";
  }
  if (position.includes("right")) {
    buttonEL.style.right = "0";
  }
  if (position.includes("bottom")) {
    buttonEL.style.bottom = "0";
  }
  if (cssText) {
    buttonEL.style.cssText = cssText;
  }
  if (cssMap) {
    for (let key of Object.keys(cssMap)) {
      buttonEL.style[key] = cssMap[key];
    }
  }
  if (explicitSubjectEl) {
    const { mouseoverFun } = data;
    buttonEL.style.display = "none";
    elEventEmitter.addEvent(explicitSubjectEl, "mouseout", () => buttonEL.style.display = "none");
    elEventEmitter.addEvent(explicitSubjectEl, "mouseover", () => {
      if (mouseoverFun) {
        mouseoverFun(buttonEL);
      } else {
        buttonEL.style.display = "";
      }
    });
  }
  insertionPositionEl.appendChild(buttonEL);
  buttonEL.addEventListener("click", (event) => {
    event.stopImmediatePropagation();
    event.preventDefault();
    const { updateFunc, data: { el } } = data;
    let localData;
    if (updateFunc) {
      localData = updateFunc(el);
    } else {
      localData = data.data;
    }
    const {
      uid = -1,
      name = null,
      bv = null,
      title = "",
      decoratePic = null,
      collectionActId = -1,
      dressUpId = -1
    } = localData;
    const showList = [];
    if (uid !== -1) {
      showList.push({ label: `uid精确屏蔽-用户uid=${uid}-name=${name}`, value: "uid" });
    } else {
      showList.push({ label: `用户名精确屏蔽(不推荐)-用户name=${name}`, value: "name" });
    }
    if (decoratePic !== null && collectionActId !== -1) {
      showList.push({ label: `装扮收藏集id屏蔽-id=${collectionActId}`, value: "collectionActId" });
    }
    if (decoratePic !== null && dressUpId !== -1) {
      showList.push({ label: `装扮id屏蔽-id=${dressUpId}`, value: "dressUpId" });
    }
    eventEmitter.send("sheet-dialog", {
      title: "屏蔽选项",
      list: showList,
      optionsClick: (item) => {
        const { value } = item;
        let results;
        switch (value) {
          case "uid":
            if (uid === -1) {
              eventEmitter.send("el-msg", "该页面数据不存在uid字段");
              return;
            }
            results = ruleUtil.addRulePreciseUid(uid);
            break;
          case "name":
            results = ruleUtil.addRulePreciseName(name);
            break;
          case "collectionActId":
            results = ruleUtil.addRule(collectionActId, "precise_decoration_collection_id");
            break;
          case "dressUpId":
            results = ruleUtil.addRule(dressUpId, "precise_decoration_id");
            break;
          default:
            eventEmitter.invoke("el-confirm", "不推荐用户使用精确用户名来屏蔽，确定继续吗？").then(() => {
              if (ruleUtil.addRulePreciseName(name).status) {
                data.maskingFunc();
              }
            });
        }
        if (results.status) {
          data.maskingFunc();
        }
      }
    });
  });
};
const addTopicDetailVideoBlockButton = (data) => {
  addBlockButton(data, "gz_shielding_button");
};
const addTopicDetailContentsBlockButton = (data) => {
  const position = data.data.position;
  const loop = position !== void 0;
  addBlockButton(data, "gz_shielding_topic_detail_button", loop ? position : []);
};
const blockUserUid = (uid) => {
  if (ruleMatchingUtil.exactMatch(ruleKeyListData.getPreciseUidArr(), uid)) {
    return { state: true, type: "精确uid", matching: uid };
  }
  return returnTempVal;
};
const blockCheckWhiteUserUid = (uid) => {
  return ruleMatchingUtil.exactMatch(ruleKeyListData.getPreciseUidWhiteArr(), uid);
};
const blockExactAndFuzzyMatching = (val, config) => {
  if (!val) {
    return returnTempVal;
  }
  const {
    exactKey,
    exactTypeName,
    exactRuleArr = GM_getValue(exactKey, [])
  } = config;
  if (exactKey) {
    if (ruleMatchingUtil.exactMatch(exactRuleArr, val)) {
      return { state: true, type: exactTypeName, matching: val };
    }
  }
  let matching;
  const {
    fuzzyKey,
    fuzzyTypeName,
    fuzzyRuleArr = GM_getValue(fuzzyKey, [])
  } = config;
  if (fuzzyKey) {
    matching = ruleMatchingUtil.fuzzyMatch(fuzzyRuleArr, val);
    if (matching) {
      return { state: true, type: fuzzyTypeName, matching };
    }
  }
  const {
    regexKey,
    regexTypeName,
    regexRuleArr = GM_getValue(regexKey, [])
  } = config;
  if (regexKey) {
    matching = ruleMatchingUtil.regexMatch(regexRuleArr, val);
    if (matching) {
      return { state: true, type: regexTypeName, matching };
    }
  }
  return returnTempVal;
};
const blockComment = (comment) => {
  return blockExactAndFuzzyMatching(comment, {
    fuzzyKey: "commentOn",
    fuzzyTypeName: "模糊评论",
    regexKey: "commentOnCanonical",
    regexTypeName: "正则评论"
  });
};
const blockAvatarPendant = (name) => {
  return blockExactAndFuzzyMatching(name, {
    exactKey: "precise_avatarPendantName",
    exactTypeName: "精确头像挂件名",
    fuzzyKey: "avatarPendantName",
    fuzzyTypeName: "模糊头像挂件名"
  });
};
const asyncBlockAvatarPendant = async (name) => {
  const res = blockAvatarPendant(name);
  if (res.state) return Promise.reject(res);
};
const blockSignature = (signature) => {
  return blockExactAndFuzzyMatching(signature, {
    fuzzyKey: "signature",
    fuzzyTypeName: "模糊用户签名",
    regexKey: "signatureCanonical",
    regexTypeName: "正则用户签名"
  });
};
const asyncBlockSignature = async (signature) => {
  const res = blockSignature(signature);
  if (res.state) return Promise.reject(res);
};
const blockVideoDesc = (desc) => {
  return blockExactAndFuzzyMatching(desc, {
    fuzzyKey: "videoDesc",
    fuzzyTypeName: "视频简介(模糊匹配)",
    regexKey: "videoDescCanonical",
    regexTypeName: "视频简介(正则匹配)"
  });
};
const asyncBlockVideoDesc = async (desc) => {
  const res = blockVideoDesc(desc);
  if (res.state) return Promise.reject(res);
};
const blockGender = (gender) => {
  const val = localMKData.isGenderRadioVal();
  const state = val === gender && val !== "不处理";
  if (state) {
    return { state: true, type: "性别屏蔽", matching: val };
  }
  return returnTempVal;
};
const asyncBlockGender = async (gender) => {
  const res = blockGender(gender);
  if (res.state) {
    return Promise.reject(res);
  }
};
const blockUserVip = (vipId) => {
  const val = localMKData.isVipTypeRadioVal();
  const vipMap = {
    0: "无",
    1: "月大会员",
    2: "年度及以上大会员"
  };
  if (val === vipMap[vipId]) {
    return { state: true, type: "会员类型屏蔽", matching: val };
  }
  return returnTempVal;
};
const asyncBlockUserVip = async (vipId) => {
  const res = blockUserVip(vipId);
  if (res.state) {
    return Promise.reject(res);
  }
};
const blockSeniorMember = (num) => {
  if (num === 1 && localMKData.isSeniorMember()) {
    return { state: true, type: "屏蔽硬核会员" };
  }
  return returnTempVal;
};
const asyncBlockSeniorMember = async (num) => {
  const res = blockSeniorMember(num);
  if (res.state) {
    return Promise.reject(res);
  }
};
const blockVideoCopyright = (num) => {
  const val = localMKData.isCopyrightRadio();
  const tempMap = {
    1: "原创",
    2: "转载"
  };
  if (val === tempMap[num]) {
    return { state: true, type: "视频类型屏蔽", matching: val };
  }
  return returnTempVal;
};
const asyncBlockVideoCopyright = async (num) => {
  const res = blockVideoCopyright(num);
  if (res.state) {
    return Promise.reject(res);
  }
};
const blockVerticalVideo = (dimension) => {
  if (!localMKData.isBlockVerticalVideo()) {
    return returnTempVal;
  }
  if (!dimension) {
    return returnTempVal;
  }
  const vertical = dimension.width < dimension.height;
  if (vertical) {
    return { state: true, type: "竖屏视频屏蔽", matching: vertical };
  }
  return returnTempVal;
};
const asyncBlockVerticalVideo = async (dimension) => {
  const res = blockVerticalVideo(dimension);
  if (res.state) return Promise.reject(res);
};
const blockVideoLikeRate = (like, view) => {
  if (!like || !view || !localMKData.isVideoLikeRateBlockingStatus()) {
    return returnTempVal;
  }
  const mk_likeRate = parseInt(localMKData.getVideoLikeRate() * 100);
  if (isNaN(mk_likeRate)) {
    return returnTempVal;
  }
  const likeRate = defUtil.calculateLikeRate(like, view);
  if (likeRate <= mk_likeRate) {
    return {
      state: true,
      type: "视频点赞率屏蔽",
      matching: mk_likeRate + "%",
      msg: `视频的点赞率为${likeRate}%，低于用户指定的限制${mk_likeRate}%，屏蔽该视频`
    };
  }
  return returnTempVal;
};
const asyncBlockVideoLikeRate = async (like, view) => {
  const res = blockVideoLikeRate(like, view);
  if (res.state) return Promise.reject(res);
};
const blockVideoInteractiveRate = (danmaku, reply, view) => {
  if (!danmaku || !view || !localMKData.isInteractiveRateBlockingStatus()) {
    return returnTempVal;
  }
  const mk_interactionRate = parseInt(localMKData.getInteractiveRate() * 100);
  const interactionRate = defUtil.calculateInteractionRate(danmaku, reply, view);
  if (interactionRate <= mk_interactionRate) {
    return {
      state: true,
      type: "视频互动率屏蔽",
      matching: mk_interactionRate + "%",
      msg: `视频的互动率为${interactionRate}%，低于用户指定的限制${mk_interactionRate}%，屏蔽该视频`
    };
  }
  return returnTempVal;
};
const asyncBlockVideoInteractiveRate = async (danmaku, reply, view) => {
  const res = blockVideoInteractiveRate(danmaku, reply, view);
  if (res.state) return Promise.reject(res);
};
const blockVideoTripleRate = (favorite, coin, share, view) => {
  if (!favorite || !coin || !share || !view || !localMKData.isTripleRateBlockingStatus()) {
    return returnTempVal;
  }
  const mk_tripleRate = parseInt(localMKData.getTripleRate() * 100);
  const tripleRate = defUtil.calculateTripleRate(favorite, coin, share, view);
  if (tripleRate <= mk_tripleRate) {
    return {
      state: true,
      type: "视频三连率屏蔽",
      matching: mk_tripleRate + "%",
      msg: `视频的三连率为${tripleRate}%，低于用户指定的限制${mk_tripleRate}%，屏蔽该视频`
    };
  }
  return returnTempVal;
};
const asyncBlockVideoTripleRate = async (favorite, coin, share, view) => {
  const res = blockVideoTripleRate(favorite, coin, share, view);
  if (res.state) return Promise.reject(res);
};
const blockVideoCoinLikesRatioRate = (coin, like) => {
  if (!coin || !like || !localMKData.isCoinLikesRatioRateBlockingStatus()) {
    return returnTempVal;
  }
  const mk_coinLikesRatioRate = parseInt(localMKData.getCoinLikesRatioRate() * 100);
  const coinLikesRatioRate = defUtil.calculateCoinLikesRatioRate(coin, like);
  if (coinLikesRatioRate <= mk_coinLikesRatioRate) {
    return {
      state: true,
      type: "视频投币/点赞比（内容价值）屏蔽",
      matching: mk_coinLikesRatioRate + "%",
      msg: `视频的投币/点赞比（内容价值）为${coinLikesRatioRate}%，低于用户指定的限制${mk_coinLikesRatioRate}%，屏蔽该视频`
    };
  }
  return returnTempVal;
};
const asyncBlockVideoCoinLikesRatioRate = async (coin, like) => {
  const res = blockVideoCoinLikesRatioRate(coin, like);
  if (res.state) return Promise.reject(res);
};
const blockByLevelForVideo = (level) => {
  if (isEnableMinimumUserLevelVideoGm()) {
    const min = getMinimumUserLevelVideoGm();
    if (level < min) {
      return { state: true, type: "最小用户等级过滤-视频", matching: min };
    }
  }
  if (isEnableMaximumUserLevelVideoGm()) {
    const max = getMaximumUserLevelVideoGm();
    if (level > max) {
      return { state: true, type: "最大用户等级过滤-视频", matching: max };
    }
  }
  return returnTempVal;
};
const blockByLevelForComment = (level) => {
  if (level === -1) return returnTempVal;
  if (isEnableMinimumUserLevelCommentGm()) {
    const min = getMinimumUserLevelCommentGm();
    if (level < min) {
      return { state: true, type: "最小用户等级过滤-评论", matching: min };
    }
  }
  if (isEnableMaximumUserLevelCommentGm()) {
    const max = getMaximumUserLevelCommentGm();
    if (level > max) {
      return { state: true, type: "最大用户等级过滤-评论", matching: max };
    }
  }
  return returnTempVal;
};
const asyncBlockByLevel = async (level) => {
  const res = blockByLevelForVideo(level);
  if (res.state) return Promise.reject(res);
};
const blockUserUidAndName = (uid, name) => {
  if (!uid || !name) {
    return returnTempVal;
  }
  let returnVal = blockUidWholeProcess(uid);
  if (returnVal.state) {
    return returnVal;
  }
  returnVal = blockUserName(name);
  if (returnVal.state) {
    return returnVal;
  }
  return returnTempVal;
};
const asyncBlockUserUidAndName = async (uid, name) => {
  const res = blockUserUidAndName(uid, name);
  if (res.state) {
    return Promise.reject(res);
  }
};
const blockVideoTeamMember = (teamMember) => {
  if (!teamMember) {
    return returnTempVal;
  }
  for (let u of teamMember) {
    const returnVal = blockUserUidAndName(u.mid, u.name);
    if (returnVal.state) {
      return returnVal;
    }
  }
  return returnTempVal;
};
const asyncBlockVideoTeamMember = async (teamMember) => {
  const res = blockVideoTeamMember(teamMember);
  if (res.state) return Promise.reject(res);
};
const blockUserName = (name) => {
  return blockExactAndFuzzyMatching(name, {
    exactKey: "precise_name",
    exactTypeName: "精确用户名",
    fuzzyKey: "name",
    fuzzyTypeName: "模糊用户名",
    regexKey: "nameCanonical",
    regexTypeName: "正则用户名"
  });
};
const blockVideoOrOtherTitle = (title) => {
  return blockExactAndFuzzyMatching(title, {
    fuzzyKey: "title",
    fuzzyTypeName: "模糊标题",
    regexKey: "titleCanonical",
    regexTypeName: "正则标题"
  });
};
const blockBasedVideoTag = (tags) => {
  const preciseVideoTagArr = ruleKeyListData.getPreciseVideoTagArr();
  const videoTagArr = ruleKeyListData.getVideoTagArr();
  if (preciseVideoTagArr.length <= 0 && videoTagArr.length <= 0) {
    return returnTempVal;
  }
  for (let tag of tags) {
    if (ruleMatchingUtil.exactMatch(preciseVideoTagArr, tag)) {
      return { state: true, type: "精确视频tag", matching: tag };
    }
    let fuzzyMatch = ruleMatchingUtil.fuzzyMatch(videoTagArr, tag);
    if (fuzzyMatch) {
      return { state: true, type: "模糊视频tag", matching: fuzzyMatch };
    }
    fuzzyMatch = ruleMatchingUtil.regexMatch(ruleKeyListData.getVideoTagCanonicalArr(), tag);
    if (fuzzyMatch) {
      return { state: true, type: "正则视频tag", matching: fuzzyMatch };
    }
  }
  return returnTempVal;
};
const asyncBlockBasedVideoTag = async (tags) => {
  const res = blockBasedVideoTag(tags);
  if (res.state) return Promise.reject(res);
};
const blockByUidRange = (uid) => {
  if (!localMKData.isUidRangeMaskingStatus()) {
    return returnTempVal;
  }
  const [head, tail] = localMKData.getUidRangeMasking();
  if (head >= uid && uid <= tail) {
    return { state: true, type: "uid范围屏蔽", matching: `${head}=>${uid}<=${tail}` };
  }
  return returnTempVal;
};
const blockUidWholeProcess = (uid) => {
  if (!uid || blockCheckWhiteUserUid(uid)) return returnTempVal;
  let returnVal = blockUserUid(uid);
  if (returnVal.state) {
    return returnVal;
  }
  return blockByUidRange(uid);
};
const asyncBlockFollowedVideo = (following) => {
  if (following && localMKData.isBlockFollowed()) {
    return Promise.reject({ state: true, type: "已关注" });
  }
};
const asyncBlockChargeVideo = (isUpOwnerExclusive) => {
  if (isUpOwnerExclusive && localMKData.isUpOwnerExclusive()) {
    return Promise.reject({ state: true, type: "充电专属视频" });
  }
};
const blockTimeRangeMasking = (timestamp) => {
  if (!timestamp || !localMKData.isTimeRangeMaskingStatus()) {
    return returnTempVal;
  }
  const timeRangeMaskingArr = localMKData.getTimeRangeMaskingArr();
  if (timeRangeMaskingArr.length === 0) {
    return returnTempVal;
  }
  for (let { status, r: [startTimestamp, endTimestamp] } of timeRangeMaskingArr) {
    if (!status) continue;
    const startSecondsTimestamp = Math.floor(startTimestamp / 1e3);
    const endSecondsTimestamp = Math.floor(endTimestamp / 1e3);
    if (startSecondsTimestamp >= timestamp <= endSecondsTimestamp) {
      const startToTime = new Date(startTimestamp).toLocaleString();
      const endToTime = new Date(endTimestamp).toLocaleString();
      const timestampToTime = new Date(timestamp * 1e3).toLocaleString();
      return { state: true, type: "时间范围屏蔽", matching: `${startToTime}=>${timestampToTime}<=${endToTime}` };
    }
  }
  return returnTempVal;
};
const asyncBlockTimeRangeMasking = async (timestamp) => {
  const res = blockTimeRangeMasking(timestamp);
  if (res.state) return Promise.reject(res);
};
const blockSeniorMemberOnly = (level) => {
  if (!isSeniorMemberOnly() || level === -1) {
    return returnTempVal;
  }
  if (level === 7) {
    return { state: true, type: "保留硬核会员" };
  }
  return { state: true, type: "非硬核会员" };
};
const blockLimitationFanSum = (fansNum) => {
  if (fansNum < 0 || !isFansNumBlockingStatusGm()) {
    return returnTempVal;
  }
  const limitFansNum = getLimitationFanSumGm();
  if (fansNum <= limitFansNum) {
    return { state: true, type: "粉丝数限制", matching: `限制数[${limitFansNum}],${fansNum}<=${limitFansNum}` };
  }
  return returnTempVal;
};
const asyncBlockLimitationFanSum = async (fansNum) => {
  const res = blockLimitationFanSum(fansNum);
  if (res.state) return Promise.reject(res);
};
const blockUserVideoNumLimit = (num) => {
  if (!isLimitationVideoSubmitStatusGm()) return returnTempVal;
  const sumGm = getLimitationVideoSubmitSumGm();
  if (sumGm >= num) {
    return { state: true, type: "用户投稿视频数量限制", matching: `用户投稿视频数量[${num}],${sumGm}>=${num}` };
  }
  return returnTempVal;
};
const asyncBlockUserVideoNumLimit = async (num) => {
  const res = blockUserVideoNumLimit(num);
  if (res.state) return Promise.reject(res);
};
const blockVideoFavoriteCoinRatio = (favorite, coin, view, pubdate) => {
  if (!favorite || !coin || !view) return returnTempVal;
  if (!localMKData.isFavoriteCoinRatioBlocking()) return returnTempVal;
  if (view < 5e3 || favorite < 50) return returnTempVal;
  if (pubdate) {
    const nowSec = Math.floor(Date.now() / 1e3);
    if (nowSec - pubdate < 7200) return returnTempVal;
  }
  const ratio = parseFloat((favorite / coin).toFixed(2));
  const mkRatio = localMKData.getFavoriteCoinRatioVal();
  if (ratio > mkRatio) {
    return { state: true, type: "收藏投币比屏蔽", matching: String(ratio) };
  }
  return returnTempVal;
};
const asyncBlockVideoFavoriteCoinRatio = async (favorite, coin, view, pubdate) => {
  const res = blockVideoFavoriteCoinRatio(favorite, coin, view, pubdate);
  if (res.state) return Promise.reject(res);
};
const blockVideoPartition = (partition) => {
  return blockExactAndFuzzyMatching(partition, {
    fuzzyKey: "videoPartition",
    fuzzyTypeName: "视频分区(模糊匹配)",
    regexKey: "videoPartitionCanonical",
    regexTypeName: "视频分区(正则匹配)"
  });
};
const asyncBlockVideoPartition = async (partition) => {
  const res = blockVideoPartition(partition);
  if (res.state) return Promise.reject(res);
};
const blockDynamicItemContent = (content, videoTitle = null, ruleArrMap = {}) => {
  let res;
  if (content !== "") {
    res = blockExactAndFuzzyMatching(content, {
      fuzzyKey: "dynamic",
      fuzzyTypeName: "动态内容(模糊匹配)",
      regexKey: "dynamicCanonical",
      regexTypeName: "动态内容(正则匹配)",
      ...ruleArrMap
    });
    if (res.state) return res;
  }
  if (videoTitle) {
    res = blockExactAndFuzzyMatching(videoTitle, {
      fuzzyKey: "dynamic_video",
      fuzzyTypeName: "动态视频(模糊匹配)",
      regexKey: "dynamic_videoCanonical",
      regexTypeName: "动态视频(正则匹配)"
    });
  }
  return res;
};
var shielding = {
  addTopicDetailVideoBlockButton,
  addTopicDetailContentsBlockButton,
  blockExactAndFuzzyMatching,
  addBlockButton,
  blockVideoFavoriteCoinRatio,
  blockVideoPartition,
  blockDecoration(value) {
    const list = GM_getValue("precise_decoration_id", []);
    const match = ruleMatchingUtil.exactMatch(list, value);
    if (match) {
      return { state: true, type: "精确装扮ID", matching: value };
    }
    return returnTempVal;
  },
  blockDecorationCollection(value) {
    const list = GM_getValue("precise_decoration_collection_id", []);
    const exactMatch = ruleMatchingUtil.exactMatch(list, value);
    if (exactMatch) {
      return { state: true, type: "精确装扮合集ID", matching: value };
    }
    return returnTempVal;
  }
};const getDynamicCardModulesData = (vueData) => {
  const data = {};
  const { module_author, module_dynamic } = vueData.modules;
  data.name = module_author.name;
  data.uid = module_author.mid;
  data.desc = module_dynamic.desc?.text ?? "";
  const topic = module_dynamic["topic"];
  if (topic !== null) {
    data.topic = topic.name;
  }
  const major = module_dynamic["major"];
  const additional = module_dynamic["additional"];
  if (additional !== null) {
    switch (additional.type) {
      case "ADDITIONAL_TYPE_RESERVE":
        const reserve = additional["reserve"];
        data.reserveTitle = reserve.title;
        break;
      case "ADDITIONAL_TYPE_VOTE":
        const vote = additional["vote"];
        data.voteTitle = vote.desc;
        break;
      case "ADDITIONAL_TYPE_UPOWER_LOTTERY":
        const uPowerLottery = additional["upower_lottery"];
        data.uPowerLotteryTitle = uPowerLottery.title;
        data.uPowerLotteryDesc = uPowerLottery.desc.text;
        console.warn("充电专属抽奖信息，待观察", uPowerLottery);
        break;
      case "ADDITIONAL_TYPE_GOODS":
        data.goods = additional["goods"];
        break;
      default:
        console.warn("相关内容卡片信息,待观察", vueData);
        break;
    }
  }
  if (major !== null) {
    switch (major["type"]) {
      case "MAJOR_TYPE_ARCHIVE":
        const archive = major["archive"];
        data.videoTitle = archive.title;
        data.videoDesc = archive.desc;
        const badge = archive.badge;
        data.videoBadgeText = badge.text;
        data.videoChargingExclusive = badge.text === "充电专属";
        break;
      case "MAJOR_TYPE_OPUS":
        const opus = major["opus"];
        const opusTitle = opus.title ?? "";
        const opusDesc = opus.summary.text ?? "";
        data.opusTitle = opusTitle;
        data.opusDesc = opusDesc;
        data.desc += opusTitle + opusDesc;
        break;
      case "MAJOR_TYPE_BLOCKED":
        const blocked = major["blocked"];
        data.blockedTitle = blocked.title;
        const iconBadgeText = module_author?.["icon_badge"]?.text;
        if (iconBadgeText) {
          data.iconBadgeText = iconBadgeText;
          if (iconBadgeText === "充电专属") {
            data.specialColumnForCharging = true;
          }
        }
        break;
      default:
        console.warn("动态主体类型,待观察", vueData);
        break;
    }
  }
  return data;
};
const getDataList$2 = async () => {
  const elList = await elUtil.findElements(".bili-dyn-list__items>.bili-dyn-list__item");
  const list = [];
  for (let el of elList) {
    const dynItemEl = el.querySelector(".bili-dyn-item");
    const vueExample = dynItemEl?.__vue__;
    let data = { el };
    const vueData = vueExample?.data ?? null;
    data.vueExample = vueExample;
    data.vueData = vueData;
    if (vueData.visible === false) {
      continue;
    }
    const modulesData = getDynamicCardModulesData(vueData);
    data = { ...data, ...modulesData };
    switch (vueData.type) {
      case "DYNAMIC_TYPE_FORWARD":
        const { orig } = vueData;
        data.orig = getDynamicCardModulesData(orig);
        break;
    }
    list.push(data);
  }
  return list;
};
const checkEachItem = (dynamicData, ruleArrMap) => {
  const { desc, name, uid = -1, videoTitle = null, orig = null } = dynamicData;
  const blockRepostDynamicGm = isBlockRepostDynamicGm();
  if (orig && blockRepostDynamicGm) {
    eventEmitter.send("打印信息", `用户${name}-动态内容${desc}-规则转发类动态`);
    return true;
  }
  if (uid !== -1) {
    if (blockCheckWhiteUserUid(uid)) return false;
  }
  if (desc === "" && videoTitle === null) return false;
  if (dynamicData["reserveTitle"] && isBlockAppointmentDynamicGm()) {
    eventEmitter.send("打印信息", `用户${name}-动态内容${desc}-屏蔽预约类动态`);
    return true;
  }
  if (dynamicData["uPowerLotteryTitle"] && isBlockUPowerLotteryDynamicGm()) {
    eventEmitter.send("打印信息", `用户${name}-动态内容${desc}-屏蔽充电专属抽奖类动态`);
    return true;
  }
  if (dynamicData["voteTitle"] && isBlockVoteDynamicGm()) {
    eventEmitter.send("打印信息", `用户${name}-动态内容${desc}-屏蔽投票类动态`);
    return true;
  }
  if (dynamicData["goods"] && isBlockGoodsDynamicGm()) {
    eventEmitter.send("打印信息", `用户${name}-动态内容${desc}-屏蔽商品类动态`);
    return true;
  }
  if (dynamicData["specialColumnForCharging"] && isBlockSpecialColumnForChargingDynamicGm()) {
    eventEmitter.send("打印信息", `用户${name}-动态内容${desc}-屏蔽充电专属专栏动态`);
    return true;
  }
  if (dynamicData["videoChargingExclusive"] && isBlockVideoChargingExclusiveDynamicGm()) {
    eventEmitter.send("打印信息", `用户${name}-动态内容${desc}-屏蔽充电专属视频动态`);
    return true;
  }
  let { state, matching, type } = blockDynamicItemContent(desc, videoTitle, ruleArrMap);
  if (!state) {
    return false;
  }
  eventEmitter.send("打印信息", `用户${name}-动态内容${desc}-${type}-规则${matching}`);
  return true;
};
const commonCheckDynamicList = async () => {
  const dataList = await getDataList$2();
  console.log("动态列表", dataList);
  const ruleArrMap = {
    fuzzyRuleArr: GM_getValue("dynamic", []),
    regexRuleArr: GM_getValue("dynamicCanonical", [])
  };
  const checkNestedDynamicContentGm = isCheckNestedDynamicContentGm();
  for (const v of dataList) {
    if (checkEachItem(v, ruleArrMap)) {
      v.el.remove();
      continue;
    }
    const { orig = null } = v;
    if (orig === null || !checkNestedDynamicContentGm) {
      continue;
    }
    if (checkEachItem(orig, ruleArrMap)) {
      v.el.remove();
    }
  }
};
var dynamicCommon = {
  commonCheckDynamicList
};var urlUtil = {
  
  parseUrl(urlString) {
    const url = new URL(urlString);
    const pathSegments = url.pathname.split("/").filter((segment) => segment !== "");
    const searchParams = new URLSearchParams(url.search.slice(1));
    const queryParams = {};
    for (const [key, value] of searchParams.entries()) {
      queryParams[key] = value;
    }
    return {
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port,
      pathname: url.pathname,
      pathSegments,
      search: url.search,
      queryParams,
      hash: url.hash
    };
  },
  getUrlRoomId(url) {
    const match = url.match(/live\.bilibili\.com\/(\d+)/);
    if (match === null) {
      return -1;
    }
    return parseInt(match[1]);
  },
  
  getUrlUID(url) {
    let uid;
    if (url.startsWith("http")) {
      const parseUrl = this.parseUrl(url);
      uid = parseUrl.pathSegments[0]?.trim();
      return parseInt(uid);
    }
    const isDoYouHaveAnyParameters = url.indexOf("?");
    const lastIndexOf = url.lastIndexOf("/");
    if (isDoYouHaveAnyParameters === -1) {
      if (url.endsWith("/")) {
        const nTheIndexOfTheLastSecondOccurrenceOfTheSlash = url.lastIndexOf("/", url.length - 2);
        uid = url.substring(nTheIndexOfTheLastSecondOccurrenceOfTheSlash + 1, url.length - 1);
      } else {
        uid = url.substring(lastIndexOf + 1);
      }
    } else {
      uid = url.substring(lastIndexOf + 1, isDoYouHaveAnyParameters);
    }
    return parseInt(uid);
  },
  
  getUrlBV(url) {
    let match = url.match(/video\/(.+)\//);
    if (match === null) {
      match = url.match(/video\/(.+)\?/);
    }
    if (match === null) {
      match = url.match(/video\/(.+)/);
    }
    if (match !== null) {
      return match?.[1]?.trim();
    }
    const { queryParams: { bvid = null } } = this.parseUrl(url);
    return bvid;
  }
};const isSpacePage = (url = window.location.href) => {
  return url.startsWith("https://space.bilibili.com/");
};
const isUserSpaceDynamicPage = (url) => {
  return url.search("space.bilibili.com/\\d+/dynamic") !== -1;
};
const isPersonalHomepage = async () => {
  const keyStr = "isPersonalHomepage";
  const cache = valueCache.get(keyStr);
  if (cache) {
    return cache;
  }
  const elList = await elUtil.findElements(".nav-tab__item .nav-tab__item-text", { timeout: 2500 });
  if (elList.length > 0) {
    const bool = elList.some((el2) => el2.textContent.trim() === "设置");
    valueCache.set("space_version", "new");
    return valueCache.set(keyStr, bool);
  }
  const el = await elUtil.findElement(".n-tab-links>.n-btn.n-setting>.n-text", { timeout: 1500 });
  valueCache.set("space_version", "old");
  return valueCache.set(keyStr, el);
};
const getUserInfo = async () => {
  const spaceUserInfo = valueCache.get("space_userInfo");
  if (spaceUserInfo) {
    return spaceUserInfo;
  }
  await isPersonalHomepage();
  const nameData = {};
  nameData.uid = urlUtil.getUrlUID(window.location.href);
  if (valueCache.get("space_version", "new") === "new") {
    nameData.name = await elUtil.findElement(".nickname").then((el) => el.textContent.trim());
  } else {
    nameData.name = await elUtil.findElement("#h-name").then((el) => el.textContent.trim());
  }
  if (!nameData.name) {
    const title = document.title;
    nameData.name = title.match(/(.+)的个人空间/)[1];
  }
  valueCache.set("space_userInfo", nameData);
  return nameData;
};
const checkUserSpaceShieldingDynamicContentThrottle = defUtil.throttle(async () => {
  const personalHomepage = await isPersonalHomepage();
  if (personalHomepage) return;
  dynamicCommon.commonCheckDynamicList();
}, 2e3);
var space = {
  isPersonalHomepage,
  isSpacePage,
  getUserInfo,
  isUserSpaceDynamicPage,
  checkUserSpaceShieldingDynamicContentThrottle,
  isUserSpaceUploadPage(url) {
    return url.startsWith("https://space.bilibili.com/") && url.includes("/upload/video");
  },
  
  setChargingVideosVisible(visible) {
    elUtil.installStyle(visible ? `.upload-video-card:has(.sic-BDC-battery_charge_simple_fill){display:none;}` : "", {
      type: "css-data",
      value: "充电视频"
    });
  },
  executeSetChargingVideosVisible(bool = null) {
    if (!this.isUserSpaceUploadPage(location.href)) return;
    if (bool === null) {
      this.setChargingVideosVisible(localMKData.isHideChargingDedicatedVideos());
      return;
    }
    this.setChargingVideosVisible(bool);
  },
  
  setLiveReplayVideosVisible(visible) {
    elUtil.installStyle(visible ? `.upload-video-card:has([title*="直播回放"]){display:none;}` : "", {
      type: "css-data",
      value: "直播回放"
    });
  },
  executeSetLiveReplayVideosVisible(bool = null) {
    if (!this.isUserSpaceUploadPage(location.href)) return;
    if (bool === null) {
      this.setLiveReplayVideosVisible(localMKData.isLiveReplayVideosHide());
      return;
    }
    this.setLiveReplayVideosVisible(bool);
  }
};var script$u = {
  components: {},
  data() {
    return {
      isRemoveSearchBottomContent: GM_getValue("isRemoveSearchBottomContent", false),
      isClearTopInputTipContent: GM_getValue("isClearTopInputTipContent", false),
      isHideHotSearchesPanelVal: isHideHotSearchesPanelGm(),
      isHideSearchHistoryPanelVal: isHideSearchHistoryPanelGm(),
      isHideAddSeeLaterVal: localMKData.isHideAddSeeLater(),
      isHideChargingDedicatedVideosVal: localMKData.isHideChargingDedicatedVideos(),
      isLiveReplayVideosHideVal: localMKData.isLiveReplayVideosHide()
    };
  },
  methods: {},
  watch: {
    isRemoveSearchBottomContent(b) {
      GM_setValue("isRemoveSearchBottomContent", b);
    },
    isClearTopInputTipContent(b) {
      GM_setValue("isClearTopInputTipContent", b);
      if (b) {
        eventEmitter.send("执行清空顶部搜索框提示内容");
        return;
      }
      topInput.setTopInputPlaceholder();
    },
    isHideHotSearchesPanelVal(n) {
      GM_setValue("is_hide_hot_searches_panel_gm", n);
      hotSearch.setTopSearchPanelDisplay(n, "热搜", 4e3);
    },
    isHideSearchHistoryPanelVal(n) {
      GM_setValue("is_hide_search_history_panel_gm", n);
      hotSearch.setTopSearchPanelDisplay(n, "搜索历史", 4e3);
    },
    isHideAddSeeLaterVal(n) {
      GM_setValue("is_hide_add_see_later", n);
    },
    isHideChargingDedicatedVideosVal(n) {
      GM_setValue("is_hide_charging_dedicated_videos", n);
      space.executeSetChargingVideosVisible(n);
    },
    isLiveReplayVideosHideVal(n) {
      GM_setValue("is_live_replay_videos_hide_gm", n);
      space.executeSetLiveReplayVideosVisible(n);
    }
  }
};
const __vue_script__$u = script$u;
var __vue_render__$u = function () {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _c(
    "div",
    [
      _c(
        "el-card",
        {
          attrs: { shadow: "never" },
          scopedSlots: _vm._u([
            {
              key: "header",
              fn: function () {
                return [_c("span", [_vm._v("搜索页")])]
              },
              proxy: true,
            },
          ]),
        },
        [
          _vm._v(" "),
          _c("el-switch", {
            attrs: { "active-text": "屏蔽底部额外内容" },
            model: {
              value: _vm.isRemoveSearchBottomContent,
              callback: function ($$v) {
                _vm.isRemoveSearchBottomContent = $$v;
              },
              expression: "isRemoveSearchBottomContent",
            },
          }),
        ],
        1
      ),
      _vm._v(" "),
      _c(
        "el-card",
        {
          attrs: { shadow: "never" },
          scopedSlots: _vm._u([
            {
              key: "header",
              fn: function () {
                return [_c("span", [_vm._v("顶部搜索框")])]
              },
              proxy: true,
            },
          ]),
        },
        [
          _vm._v(" "),
          _c("el-switch", {
            attrs: { "active-text": "清空内容" },
            model: {
              value: _vm.isClearTopInputTipContent,
              callback: function ($$v) {
                _vm.isClearTopInputTipContent = $$v;
              },
              expression: "isClearTopInputTipContent",
            },
          }),
          _vm._v(" "),
          _c("el-switch", {
            attrs: { "active-text": "隐藏热搜" },
            model: {
              value: _vm.isHideHotSearchesPanelVal,
              callback: function ($$v) {
                _vm.isHideHotSearchesPanelVal = $$v;
              },
              expression: "isHideHotSearchesPanelVal",
            },
          }),
          _vm._v(" "),
          _c("el-switch", {
            attrs: { "active-text": "隐藏搜索历史" },
            model: {
              value: _vm.isHideSearchHistoryPanelVal,
              callback: function ($$v) {
                _vm.isHideSearchHistoryPanelVal = $$v;
              },
              expression: "isHideSearchHistoryPanelVal",
            },
          }),
        ],
        1
      ),
      _vm._v(" "),
      _c(
        "el-card",
        {
          attrs: { shadow: "never" },
          scopedSlots: _vm._u([
            {
              key: "header",
              fn: function () {
                return [_vm._v("视频列表项")]
              },
              proxy: true,
            },
          ]),
        },
        [
          _vm._v(" "),
          _c("el-switch", {
            attrs: {
              "active-text": "隐藏添加至稍后再看按钮",
              title: "刷新页面生效",
            },
            model: {
              value: _vm.isHideAddSeeLaterVal,
              callback: function ($$v) {
                _vm.isHideAddSeeLaterVal = $$v;
              },
              expression: "isHideAddSeeLaterVal",
            },
          }),
        ],
        1
      ),
      _vm._v(" "),
      _c(
        "el-card",
        {
          attrs: { shadow: "never" },
          scopedSlots: _vm._u([
            {
              key: "header",
              fn: function () {
                return [_vm._v("用户空间主页")]
              },
              proxy: true,
            },
          ]),
        },
        [
          _vm._v(" "),
          _c("el-switch", {
            attrs: { "active-text": "隐藏投稿选项卡中充电视频" },
            model: {
              value: _vm.isHideChargingDedicatedVideosVal,
              callback: function ($$v) {
                _vm.isHideChargingDedicatedVideosVal = $$v;
              },
              expression: "isHideChargingDedicatedVideosVal",
            },
          }),
          _vm._v(" "),
          _c("el-switch", {
            attrs: { "active-text": "隐藏投稿选项卡直播回放" },
            model: {
              value: _vm.isLiveReplayVideosHideVal,
              callback: function ($$v) {
                _vm.isLiveReplayVideosHideVal = $$v;
              },
              expression: "isLiveReplayVideosHideVal",
            },
          }),
        ],
        1
      ),
    ],
    1
  )
};
var __vue_staticRenderFns__$u = [];
__vue_render__$u._withStripped = true;
  
  const __vue_inject_styles__$u = undefined;
  
  const __vue_scope_id__$u = undefined;
  
  const __vue_module_identifier__$u = undefined;
  
  const __vue_is_functional_template__$u = false;
  
  
  
  
  
  
  
  const __vue_component__$u = normalizeComponent(
    { render: __vue_render__$u, staticRenderFns: __vue_staticRenderFns__$u },
    __vue_inject_styles__$u,
    __vue_script__$u,
    __vue_scope_id__$u,
    __vue_is_functional_template__$u,
    __vue_module_identifier__$u,
    false,
    undefined);var videoCardHideAddSeeLaterButCss = `
.bili-watch-later.bili-watch-later--pip, .watch-later-video.van-watchlater.black {
    display: none !important;
}
`;var BEWLYHomeCss = `
body > #app {
    display: none;
}`;var cssManager = {
  run() {
    if (localMKData.isHideAddSeeLater()) {
      elUtil.installStyle(videoCardHideAddSeeLaterButCss, {
        type: "class",
        value: "video_card_hide_add_see_later_but"
      });
    }
  },
  clearBewlyCatStyle() {
    let loop = false;
    for (let el of document.querySelectorAll('style[rel="stylesheet"]')) {
      if (el.textContent.includes("body > *:not(#bewly):not(script):not(style)")) {
        loop = true;
        console.log("已删除bewlyCat暴力隐藏样式表", el, el.textContent);
        el.remove();
      }
    }
    if (loop) {
      elUtil.installStyle(BEWLYHomeCss);
    }
  },
  hideHomeTopHeaderChannel(hide) {
    const styleTxt = hide ? `
        .bili-header__channel{
        height: 36px!important;
        visibility: hidden;
        }
        
        .header-channel{
        display: none;
        }
        ` : `.bili-header__channel{
        height: 120px!important;
        visibility: visible;
        }
        
        .header-channel{
        display: block;
        }
        `;
    elUtil.installStyle(styleTxt, { type: "class", value: "mk-hide-home-top-header-channel" });
  },
  updateCssVModal() {
    elUtil.installStyle(`.v-modal  {
    z-index: auto !important;
}`, { type: "class", value: "mk-css-v-modal" });
  },
  setDynamicHomeRightLayHide(hide = true) {
    const cssText = hide ? `.bili-dyn-home--member > aside.right {display: none;}` : "";
    elUtil.installStyle(cssText, { type: "class", value: "mk-css-dynamic-home-right-lay-hide" });
  }
};const isUrlDynamicHomePage = () => {
  return window.location.href.includes("t.bilibili.com") && document.title === "动态首页-哔哩哔哩";
};
const isUrlDynamicContentPage = () => {
  const href = window.location.href;
  const title = document.title;
  return (href.includes("t.bilibili.com") || href.includes("www.bilibili.com/opus")) && (title.endsWith("的动态-哔哩哔哩") || title.includes("的动态 - 哔哩哔哩"));
};
const debounceCheckDynamicList = defUtil.debounce(() => {
  if (!enableDynamicItemsContentBlockingGm()) return;
  dynamicCommon.commonCheckDynamicList();
}, 1e3);
const hidePersonalInfoCard = (show) => {
  const cssText = show ? `
        .left>section,
        aside.left>section,
        .bili-dyn-home--member aside.left section,
        .bili-dyn-sidebar section,
        .bili-dyn-home--member .user-info-card,
        .user-info-card
        { display: none !important; }
    ` : "";
  elUtil.installStyle(cssText, { type: "id", value: "mk-hide-personal-info-card" });
};
const run$4 = () => {
  debounceCheckDynamicList();
  elUtil.findElement("div.bili-dyn-up-list__content").then((el) => {
    console.log("已找到动态首页中顶部用户tabs栏", el);
    el.addEventListener("click", (event) => {
      const target = event.target;
      if (target["className"] === "shim") return;
      debounceCheckDynamicList();
    });
  });
  hotSearch.startShieldingHotListDynamic();
  if (hidePersonalInfoCardGm()) {
    hidePersonalInfoCard(true);
  }
  if (localMKData.isDynamicHomeRightLayHide()) {
    cssManager.setDynamicHomeRightLayHide();
  }
};
var dynamicPage = {
  isUrlDynamicHomePage,
  isUrlDynamicContentPage,
  run: run$4,
  hidePersonalInfoCard,
  debounceCheckDynamicList,
  runHideBackToOldVersionButFun(hide = false) {
    if (!(hide || localMKData.hideBackToOldVersionButGm())) return;
    elUtil.byXpathElAsync('//div[@class="bili-dyn-sidebar"]/div[@class="bili-dyn-sidebar__btn" and span[text()="回到旧版"]]').then((el) => {
      el.remove();
      eventEmitter.send("打印信息", "已隐藏回到旧版按钮");
    });
  }
};var script$t = {
  data() {
    return {
      enableDynamicItemsContentBlockingVal: enableDynamicItemsContentBlockingGm(),
      isBlockRepostDynamicVal: isBlockRepostDynamicGm(),
      isBlockAppointmentDynamicVal: isBlockAppointmentDynamicGm(),
      isBlockVoteDynamicVal: isBlockVoteDynamicGm(),
      isBlockUPowerLotteryDynamicVal: isBlockUPowerLotteryDynamicGm(),
      isBlockGoodsDynamicVal: isBlockGoodsDynamicGm(),
      isBlockSpecialColumnForChargingDynamicVal: isBlockSpecialColumnForChargingDynamicGm(),
      isBlockVideoChargingExclusiveDynamicVal: isBlockVideoChargingExclusiveDynamicGm(),
      hidePersonalInfoCardVal: hidePersonalInfoCardGm(),
      isDynamicHomeRightLayHideVal: localMKData.isDynamicHomeRightLayHide(),
      hideBackToOldVersionButVal: localMKData.hideBackToOldVersionButGm()
    };
  },
  watch: {
    enableDynamicItemsContentBlockingVal(n) {
      GM_setValue("enable_dynamic_items_content_blocking_gm", n);
    },
    isBlockRepostDynamicVal(n) {
      GM_setValue("is_block_repost_dynamic_gm", n);
    },
    isBlockAppointmentDynamicVal(n) {
      GM_setValue("is_block_appointment_dynamic_gm", n);
    },
    isBlockVoteDynamicVal(n) {
      GM_setValue("is_block_vote_dynamic_gm", n);
    },
    isBlockUPowerLotteryDynamicVal(n) {
      GM_setValue("is_block_u_power_lottery_dynamic_gm", n);
    },
    isBlockGoodsDynamicVal(n) {
      GM_setValue("is_block_goods_dynamic_gm", n);
    },
    isBlockSpecialColumnForChargingDynamicVal(n) {
      GM_setValue("is_block_special_column_for_charging_dynamic_gm", n);
    },
    isBlockVideoChargingExclusiveDynamicVal(n) {
      GM_setValue("is_block_video_charging_exclusive_dynamic_gm", n);
    },
    hidePersonalInfoCardVal(n) {
      GM_setValue("hide_personal_info_card_gm", n);
      if (dynamicPage.isUrlDynamicHomePage()) {
        dynamicPage.hidePersonalInfoCard(n);
      }
    },
    isDynamicHomeRightLayHideVal(n) {
      GM_setValue("is_dynamic_home_right_lay_hide", n);
      cssManager.setDynamicHomeRightLayHide(n);
    },
    hideBackToOldVersionButVal(n) {
      GM_setValue("hide_back_to_old_version_but_gm", n);
      dynamicPage.runHideBackToOldVersionButFun(n);
    }
  }
};
const __vue_script__$t = script$t;
var __vue_render__$t = function () {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _c(
    "div",
    [
      _c(
        "el-card",
        {
          scopedSlots: _vm._u([
            {
              key: "header",
              fn: function () {
                return [_vm._v("动态首页")]
              },
              proxy: true,
            },
          ]),
        },
        [
          _vm._v(" "),
          _c(
            "el-tooltip",
            {
              attrs: {
                content:
                  "启用该项后，对应页面中的动态会对uid白名单处理，和动态内容处理",
              },
            },
            [
              _c("el-switch", {
                attrs: { "active-text": "启用动态内容屏蔽" },
                model: {
                  value: _vm.enableDynamicItemsContentBlockingVal,
                  callback: function ($$v) {
                    _vm.enableDynamicItemsContentBlockingVal = $$v;
                  },
                  expression: "enableDynamicItemsContentBlockingVal",
                },
              }),
            ],
            1
          ),
          _vm._v(" "),
          _c(
            "el-tooltip",
            {
              attrs: {
                content: "动态首页中左侧的个人信息卡片，展示关注粉丝动态该卡片",
              },
            },
            [
              _c("el-switch", {
                attrs: { "active-text": "隐藏个人信息卡片" },
                model: {
                  value: _vm.hidePersonalInfoCardVal,
                  callback: function ($$v) {
                    _vm.hidePersonalInfoCardVal = $$v;
                  },
                  expression: "hidePersonalInfoCardVal",
                },
              }),
            ],
            1
          ),
          _vm._v(" "),
          _c("el-switch", {
            attrs: {
              "active-text": "隐藏右侧布局(热搜)",
              title: "区域为热搜和其上方的社区中心",
            },
            model: {
              value: _vm.isDynamicHomeRightLayHideVal,
              callback: function ($$v) {
                _vm.isDynamicHomeRightLayHideVal = $$v;
              },
              expression: "isDynamicHomeRightLayHideVal",
            },
          }),
        ],
        1
      ),
      _vm._v(" "),
      _c(
        "el-card",
        {
          scopedSlots: _vm._u([
            {
              key: "header",
              fn: function () {
                return [_vm._v("动态")]
              },
              proxy: true,
            },
          ]),
        },
        [
          _vm._v(" "),
          _c("el-switch", {
            attrs: { "active-text": "屏蔽转发类型" },
            model: {
              value: _vm.isBlockRepostDynamicVal,
              callback: function ($$v) {
                _vm.isBlockRepostDynamicVal = $$v;
              },
              expression: "isBlockRepostDynamicVal",
            },
          }),
          _vm._v(" "),
          _c(
            "el-tooltip",
            { attrs: { content: "如直播预约动态" } },
            [
              _c("el-switch", {
                attrs: { "active-text": "屏蔽预约类型" },
                model: {
                  value: _vm.isBlockAppointmentDynamicVal,
                  callback: function ($$v) {
                    _vm.isBlockAppointmentDynamicVal = $$v;
                  },
                  expression: "isBlockAppointmentDynamicVal",
                },
              }),
            ],
            1
          ),
          _vm._v(" "),
          _c("el-switch", {
            attrs: { "active-text": "屏蔽投票类型" },
            model: {
              value: _vm.isBlockVoteDynamicVal,
              callback: function ($$v) {
                _vm.isBlockVoteDynamicVal = $$v;
              },
              expression: "isBlockVoteDynamicVal",
            },
          }),
          _vm._v(" "),
          _c("el-switch", {
            attrs: { "active-text": "屏蔽充电专属抽奖类型" },
            model: {
              value: _vm.isBlockUPowerLotteryDynamicVal,
              callback: function ($$v) {
                _vm.isBlockUPowerLotteryDynamicVal = $$v;
              },
              expression: "isBlockUPowerLotteryDynamicVal",
            },
          }),
          _vm._v(" "),
          _c("el-switch", {
            attrs: { "active-text": "屏蔽商品类" },
            model: {
              value: _vm.isBlockGoodsDynamicVal,
              callback: function ($$v) {
                _vm.isBlockGoodsDynamicVal = $$v;
              },
              expression: "isBlockGoodsDynamicVal",
            },
          }),
          _vm._v(" "),
          _c("el-switch", {
            attrs: { "active-text": "屏蔽充电专属专栏" },
            model: {
              value: _vm.isBlockSpecialColumnForChargingDynamicVal,
              callback: function ($$v) {
                _vm.isBlockSpecialColumnForChargingDynamicVal = $$v;
              },
              expression: "isBlockSpecialColumnForChargingDynamicVal",
            },
          }),
          _vm._v(" "),
          _c("el-switch", {
            attrs: { "active-text": "屏蔽充电专属视频" },
            model: {
              value: _vm.isBlockVideoChargingExclusiveDynamicVal,
              callback: function ($$v) {
                _vm.isBlockVideoChargingExclusiveDynamicVal = $$v;
              },
              expression: "isBlockVideoChargingExclusiveDynamicVal",
            },
          }),
          _vm._v(" "),
          _c("el-switch", {
            attrs: { "active-text": "屏蔽右下角的回到旧版悬浮按钮" },
            model: {
              value: _vm.hideBackToOldVersionButVal,
              callback: function ($$v) {
                _vm.hideBackToOldVersionButVal = $$v;
              },
              expression: "hideBackToOldVersionButVal",
            },
          }),
        ],
        1
      ),
    ],
    1
  )
};
var __vue_staticRenderFns__$t = [];
__vue_render__$t._withStripped = true;
  
  const __vue_inject_styles__$t = undefined;
  
  const __vue_scope_id__$t = undefined;
  
  const __vue_module_identifier__$t = undefined;
  
  const __vue_is_functional_template__$t = false;
  
  
  
  
  
  
  
  const __vue_component__$t = normalizeComponent(
    { render: __vue_render__$t, staticRenderFns: __vue_staticRenderFns__$t },
    __vue_inject_styles__$t,
    __vue_script__$t,
    __vue_scope_id__$t,
    __vue_is_functional_template__$t,
    __vue_module_identifier__$t,
    false,
    undefined);var script$s = Vue.defineComponent({
  name: "PlayPageProcessingTab",
  data() {
    return {
      isDelPlayerPageAd: GM_getValue("isDelPlayerPageAd", false),
      isDelPlayerPageRightGameAd: GM_getValue("isDelPlayerPageRightGameAd", false),
      isDelPlayerPageRightVideoList: localMKData.isDelPlayerPageRightVideoList(),
      isDelBottomComment: localMKData.isDelBottomComment(),
      isDelPlayerEndingPanelVal: localMKData.isDelPlayerEndingPanel(),
      isCloseCommentBlockingVal: isCloseCommentBlockingGm()
    };
  },
  watch: {
    isDelPlayerPageAd(b) {
      GM_setValue("isDelPlayerPageAd", b);
    },
    isDelPlayerPageRightGameAd(b) {
      GM_setValue("isDelPlayerPageRightGameAd", b);
    },
    isDelPlayerPageRightVideoList(b) {
      GM_setValue("isDelPlayerPageRightVideoList", b);
    },
    isDelBottomComment(b) {
      GM_setValue("isDelBottomComment", b);
    },
    isDelPlayerEndingPanelVal(n) {
      GM_setValue("is_del_player_ending_panel", n);
    },
    isCloseCommentBlockingVal(n) {
      GM_setValue("is_close_comment_blocking_gm", n);
    }
  }
});const isOldIE = typeof navigator !== 'undefined' &&
    /msie [6-9]\\b/.test(navigator.userAgent.toLowerCase());
function createInjector(context) {
    return (id, style) => addStyle(id, style);
}
let HEAD;
const styles = {};
function addStyle(id, css) {
    const group = isOldIE ? css.media || 'default' : id;
    const style = styles[group] || (styles[group] = { ids: new Set(), styles: [] });
    if (!style.ids.has(id)) {
        style.ids.add(id);
        let code = css.source;
        if (css.map) {
            code += '\n';
            code +=
                '\n';
        }
        if (!style.element) {
            style.element = document.createElement('style');
            style.element.type = 'text/css';
            if (css.media)
                style.element.setAttribute('media', css.media);
            if (HEAD === undefined) {
                HEAD = document.head || document.getElementsByTagName('head')[0];
            }
            HEAD.appendChild(style.element);
        }
        if ('styleSheet' in style.element) {
            style.styles.push(code);
            style.element.styleSheet.cssText = style.styles
                .filter(Boolean)
                .join('\n');
        }
        else {
            const index = style.ids.size - 1;
            const textNode = document.createTextNode(code);
            const nodes = style.element.childNodes;
            if (nodes[index])
                style.element.removeChild(nodes[index]);
            if (nodes.length)
                style.element.insertBefore(textNode, nodes[index]);
            else
                style.element.appendChild(textNode);
        }
    }
}
const __vue_script__$s = script$s;
var __vue_render__$s = function () {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _c(
    "div",
    [
      _c(
        "el-card",
        {
          attrs: { shadow: "never" },
          scopedSlots: _vm._u([
            {
              key: "header",
              fn: function () {
                return [_c("span", [_vm._v("播放页")])]
              },
              proxy: true,
            },
          ]),
        },
        [
          _vm._v(" "),
          _c("el-switch", {
            attrs: { "active-text": "屏蔽页面元素广告" },
            model: {
              value: _vm.isDelPlayerPageAd,
              callback: function ($$v) {
                _vm.isDelPlayerPageAd = $$v;
              },
              expression: "isDelPlayerPageAd",
            },
          }),
          _vm._v(" "),
          _c("el-switch", {
            attrs: { "active-text": "屏蔽右侧游戏推荐" },
            model: {
              value: _vm.isDelPlayerPageRightGameAd,
              callback: function ($$v) {
                _vm.isDelPlayerPageRightGameAd = $$v;
              },
              expression: "isDelPlayerPageRightGameAd",
            },
          }),
          _vm._v(" "),
          _c(
            "el-tooltip",
            { attrs: { content: "移除整个推荐列表，状态刷新生效" } },
            [
              _c("el-switch", {
                attrs: { "active-text": "移除右侧推荐列表" },
                model: {
                  value: _vm.isDelPlayerPageRightVideoList,
                  callback: function ($$v) {
                    _vm.isDelPlayerPageRightVideoList = $$v;
                  },
                  expression: "isDelPlayerPageRightVideoList",
                },
              }),
            ],
            1
          ),
          _vm._v(" "),
          _c(
            "el-tooltip",
            { attrs: { content: "状态刷新生效" } },
            [
              _c("el-switch", {
                attrs: { "active-text": "移除评论区" },
                model: {
                  value: _vm.isDelBottomComment,
                  callback: function ($$v) {
                    _vm.isDelBottomComment = $$v;
                  },
                  expression: "isDelBottomComment",
                },
              }),
            ],
            1
          ),
          _vm._v(" "),
          _c(
            "el-tooltip",
            {
              attrs: {
                content:
                  "视频播放完之后会在播放器上显示推荐内容，开启之后移除播放器上整个推荐内容",
              },
            },
            [
              _c("el-switch", {
                attrs: { "active-text": "移除播放完推荐层" },
                model: {
                  value: _vm.isDelPlayerEndingPanelVal,
                  callback: function ($$v) {
                    _vm.isDelPlayerEndingPanelVal = $$v;
                  },
                  expression: "isDelPlayerEndingPanelVal",
                },
              }),
            ],
            1
          ),
          _vm._v(" "),
          _c(
            "el-tooltip",
            { attrs: { content: "开启后评论屏蔽功能关闭" } },
            [
              _c("el-switch", {
                attrs: { "active-text": "关闭评论屏蔽" },
                model: {
                  value: _vm.isCloseCommentBlockingVal,
                  callback: function ($$v) {
                    _vm.isCloseCommentBlockingVal = $$v;
                  },
                  expression: "isCloseCommentBlockingVal",
                },
              }),
            ],
            1
          ),
        ],
        1
      ),
    ],
    1
  )
};
var __vue_staticRenderFns__$s = [];
__vue_render__$s._withStripped = true;
  
  const __vue_inject_styles__$s = function (inject) {
    if (!inject) return
    inject("data-v-5eee202c_0", { source: "\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n", map: {"version":3,"sources":[],"names":[],"mappings":"","file":"PlayPageProcessingTab.vue"}, media: undefined });
  };
  
  const __vue_scope_id__$s = "data-v-5eee202c";
  
  const __vue_module_identifier__$s = undefined;
  
  const __vue_is_functional_template__$s = false;
  
  
  
  
  
  const __vue_component__$s = normalizeComponent(
    { render: __vue_render__$s, staticRenderFns: __vue_staticRenderFns__$s },
    __vue_inject_styles__$s,
    __vue_script__$s,
    __vue_scope_id__$s,
    __vue_is_functional_template__$s,
    __vue_module_identifier__$s,
    false,
    createInjector);const toPlayCountOrBulletChat = (str) => {
  if (!str) {
    return -1;
  }
  str = str.split(/[\t\r\f\n\s]*/g).join("");
  const replace = str.replace(/[^\d.]/g, "");
  if (str.endsWith("万") || str.endsWith("万次") || str.endsWith("万弹幕")) {
    return parseFloat(replace) * 1e4;
  }
  if (str.endsWith("次") || str.endsWith("弹幕")) {
    return parseInt(replace);
  }
  return parseInt(str);
};
const timeStringToSeconds = (timeStr) => {
  if (!timeStr) {
    return -1;
  }
  const parts = timeStr.split(":");
  switch (parts.length) {
    case 1:
      return Number(parts[0]);
    case 2:
      return Number(parts[0]) * 60 + Number(parts[1]);
    case 3:
      return Number(parts[0]) * 3600 + Number(parts[1]) * 60 + Number(parts[2]);
    default:
      throw new Error("Invalid time format");
  }
};
var strFormatUtil = {
  toPlayCountOrBulletChat,
  timeStringToSeconds
};const regexCache =  new Map();
const getCachedRegExp = (pattern) => {
  let compiled = regexCache.get(pattern);
  if (!compiled) {
    compiled = new RegExp(pattern);
    regexCache.set(pattern, compiled);
  }
  return compiled;
};
function blockExactOrRegex(val, ruleArray, useRegex, typeName) {
  if (!val || !ruleArray || ruleArray.length === 0) {
    return returnTempVal;
  }
  if (useRegex) {
    const hit = ruleArray.find((item) => {
      try {
        return getCachedRegExp(item).test(val);
      } catch (e) {
        console.warn(`正则匹配异常 [${typeName}]:`, e.message);
        return false;
      }
    });
    if (hit) return { state: true, type: typeName, matching: hit };
  } else {
    const hit = ruleArray.find((item) => item === val);
    if (hit) return { state: true, type: typeName, matching: hit };
  }
  return returnTempVal;
}function getTJXSettings() {
  return GM_getValue("GM_blockedParameter", null);
}
function tjxGetOverlaySettings() {
  const s = getTJXSettings();
  if (!s) return null;
  return {
    overlayMode: !s.hideVideoMode_Switch,
    hideVideoMode: s.hideVideoMode_Switch || false,
    onlyDisplayType: s.blockedOverlayOnlyDisplaysType_Switch || false,
    hideNonVideoElements: s.hideNonVideoElements_Switch !== false,
    hideTrending: s.hideTrending_Switch || false,
    blockedTrendingByTitleTag: s.blockedTrendingItemByTitleTag_Switch || false,
    blockedTrending: s.blockedTrendingItem_Switch || false,
    trendingUseRegex: s.blockedTrendingItem_UseRegular !== false,
    trendingArray: s.blockedTrendingItem_Array || [],
    hideBlockedWords: s.hideBlockedWordsInMenu_Switch || false,
    consoleLog: s.consoleOutputLog_Switch || false
  };
}const OVERLAY_CLASS$1 = "bb_overlay";
function getSettings() {
  const s = tjxGetOverlaySettings();
  if (!s) {
    const hideVideoMode = GM_getValue("hide_video_mode", false);
    return {
      overlayMode: !hideVideoMode,
      hideVideoMode,
      onlyDisplayType: GM_getValue("overlay_only_type", false)
    };
  }
  return s;
}
function createOverlay(el, blockedReason, setTimeoutMode = false) {
  if (el.querySelector("." + OVERLAY_CLASS$1)) return;
  const settings = getSettings();
  if (settings.hideVideoMode) {
    if (window.location.href.startsWith("https://search.bilibili.com/")) {
      el.parentNode.style.display = "none";
      el.style.display = "none";
      return;
    }
    const feedCard = el.closest("div.feed-card");
    if (feedCard) {
      feedCard.style.display = "none";
      el.style.display = "none";
      return;
    }
    const biliFeedCard = el.closest("div.bili-feed-card");
    if (biliFeedCard) {
      biliFeedCard.style.display = "none";
      el.style.display = "none";
      return;
    }
    el.style.display = "none";
    return;
  }
  if (el.firstElementChild && el.firstElementChild.className === "card-box" && !setTimeoutMode) {
    el.style.filter = "blur(5px)";
    setTimeout(() => {
      createOverlay(el, blockedReason, true);
      el.style.filter = "none";
    }, 3e3);
    return;
  }
  const rect = el.getBoundingClientRect();
  const overlay = document.createElement("div");
  overlay.className = OVERLAY_CLASS$1;
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
  const text = document.createElement("div");
  if (el.firstElementChild && el.firstElementChild.className === "card-box") {
    text.style.fontSize = "1.25em";
  }
  text.textContent = blockedReason;
  text.style.color = "rgb(250,250,250)";
  overlay.appendChild(text);
  el.insertAdjacentElement("afterbegin", overlay);
}
function syncOverlaySize() {
  document.querySelectorAll("." + OVERLAY_CLASS$1).forEach((overlay) => {
    const parent = overlay.parentNode;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    overlay.style.width = rect.width + "px";
    overlay.style.height = rect.height + "px";
  });
}
let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(syncOverlaySize, 150);
});const arraysLooseEqual = (arr1, arr2) => {
  if (arr1.length !== arr2.length) return false;
  const countMap = {};
  const getKey = (value) => {
    if (typeof value === "number" && Number.isNaN(value)) return "__NaN";
    return JSON.stringify(value);
  };
  for (const elem of arr1) {
    const key = getKey(elem);
    countMap[key] = (countMap[key] || 0) + 1;
  }
  for (const elem of arr2) {
    const key = getKey(elem);
    if (!countMap[key]) return false;
    countMap[key]--;
  }
  return true;
};
const arrayContains = (a, b) => {
  if (b.length === 0) return true;
  if (a.length < b.length) return false;
  const countMap = {};
  const getKey = (value) => {
    if (typeof value === "number" && Number.isNaN(value)) return "__NaN";
    return JSON.stringify(value);
  };
  for (const elem of a) {
    const key = getKey(elem);
    countMap[key] = (countMap[key] || 0) + 1;
  }
  for (const elem of b) {
    const key = getKey(elem);
    if (!countMap[key] || countMap[key] <= 0) return false;
    countMap[key]--;
  }
  return true;
};
var arrUtil = {
  arraysLooseEqual,
  arrayContains
};var video_zone = {
  "动画": [
    "MAD·AMV",
    "MMD·3D",
    "短片·手书",
    "配音",
    "手办·模玩",
    "特摄",
    "动漫杂谈"
  ],
  "番剧": [
    "资讯",
    "官方延伸",
    "完结动画"
  ],
  "国创": [
    "国产动画",
    "国产原创相关",
    "布袋戏",
    "资讯"
  ],
  "音乐": [
    "原创音乐",
    "翻唱",
    "VOCALOID·UTAU",
    "演奏",
    "MV",
    "音乐现场",
    "音乐综合",
    "乐评盘点",
    "音乐教学"
  ],
  "舞蹈": [
    "宅舞",
    "舞蹈综合",
    "舞蹈教程",
    "街舞",
    "明星舞蹈",
    "国风舞蹈"
  ],
  "游戏": [
    "单机游戏",
    "电子竞技",
    "手机游戏",
    "网络游戏",
    "桌游棋牌",
    "GMV",
    "音游"
  ],
  "知识": [
    "科学科普",
    "社科·法律·心理(原社科人文、原趣味科普人文)",
    "人文历史",
    "财经商业",
    "校园学习",
    "职业职场",
    "设计·创意",
    "野生技术协会",
    "演讲·公开课(已下线)",
    "星海(已下线)"
  ],
  "科技": [
    "数码(原手机平板)",
    "软件应用",
    "计算机技术",
    "科工机械 (原工业·工程·机械)",
    "极客DIY",
    "电脑装机(已下线)",
    "摄影摄像(已下线)"
  ],
  "运动": [
    "篮球",
    "足球",
    "健身",
    "竞技体育",
    "运动文化"
  ],
  "汽车": [
    "汽车知识科普",
    "赛车",
    "改装玩车",
    "新能源车",
    "房车",
    "摩托车",
    "购车攻略",
    "汽车生活",
    "汽车文化(已下线)",
    "汽车极客(已下线)"
  ],
  "生活": [
    "搞笑",
    "出行",
    "三农",
    "家居房产",
    "手工",
    "绘画",
    "日常",
    "亲子",
    "美食圈(重定向)",
    "动物圈(重定向)",
    "运动(重定向)",
    "汽车(重定向)"
  ],
  "美食": [
    "美食制作(原[生活]->[美食圈])",
    "美食侦探",
    "美食测评",
    "田园美食"
  ],
  "动物圈": [
    "喵星人",
    "汪星人",
    "动物二创",
    "野生动物",
    "小宠异宠"
  ],
  "鬼畜": [
    "鬼畜调教",
    "音MAD",
    "人力VOCALOID",
    "鬼畜剧场"
  ],
  "时尚": [
    "美妆护肤",
    "仿妆cos",
    "穿搭",
    "时尚潮流",
    "健身(重定向)"
  ],
  "资讯": [
    "热点",
    "环球",
    "社会"
  ],
  "广告": [],
  "娱乐": [
    "综艺",
    "娱乐杂谈",
    "粉丝创作",
    "明星综合"
  ],
  "影视": [
    "影视杂谈",
    "影视剪辑",
    "小剧场",
    "预告·资讯"
  ],
  "纪录片": [
    "人文·历史",
    "科学·探索·自然",
    "军事"
  ],
  "电影": [
    "华语电影",
    "欧美电影",
    "日本电影"
  ],
  "电视剧": [
    "国产剧"
  ]
};const findKey = (itemKey) => {
  for (let key in video_zone) {
    const arr = video_zone[key];
    if (arr.some((i) => i === itemKey)) return key;
  }
  return null;
};
var video_zoneData = { findKey };var __typeError$3 = (msg) => {
  throw TypeError(msg);
};
var __accessCheck$3 = (obj, member, msg) => member.has(obj) || __typeError$3("Cannot " + msg);
var __privateGet$3 = (obj, member, getter) => (__accessCheck$3(obj, member, "read from private field"), member.get(obj));
var __privateAdd$3 = (obj, member, value) => member.has(obj) ? __typeError$3("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var _XOR_CODE, _MASK_CODE, _MAX_AID, _BASE, _data;
class BilibiliEncoder {
  constructor() {
    __privateAdd$3(this, _XOR_CODE, 23442827791579n);
    __privateAdd$3(this, _MASK_CODE, 2251799813685247n);
    __privateAdd$3(this, _MAX_AID, 1n << 51n);
    __privateAdd$3(this, _BASE, 58n);
    __privateAdd$3(this, _data, "FcwAPNKTMug3GV5Lj7EJnHpWsx4tb8haYeviqBz6rkCy12mUSDQX9RdoZf");
  }
  av2bv(aid) {
    const bytes = ["B", "V", "1", "0", "0", "0", "0", "0", "0", "0", "0", "0"];
    let bvIndex = bytes.length - 1;
    let tmp = (__privateGet$3(this, _MAX_AID) | BigInt(aid)) ^ __privateGet$3(this, _XOR_CODE);
    while (tmp > 0) {
      bytes[bvIndex] = __privateGet$3(this, _data)[Number(tmp % BigInt(__privateGet$3(this, _BASE)))];
      tmp = tmp / __privateGet$3(this, _BASE);
      bvIndex -= 1;
    }
    [bytes[3], bytes[9]] = [bytes[9], bytes[3]];
    [bytes[4], bytes[7]] = [bytes[7], bytes[4]];
    return bytes.join("");
  }
  bv2av(bvid) {
    const bvidArr = Array.from(bvid);
    [bvidArr[3], bvidArr[9]] = [bvidArr[9], bvidArr[3]];
    [bvidArr[4], bvidArr[7]] = [bvidArr[7], bvidArr[4]];
    bvidArr.splice(0, 3);
    const tmp = bvidArr.reduce((pre, bvidChar) => pre * __privateGet$3(this, _BASE) + BigInt(__privateGet$3(this, _data).indexOf(bvidChar)), 0n);
    return Number(tmp & __privateGet$3(this, _MASK_CODE) ^ __privateGet$3(this, _XOR_CODE));
  }
}
_XOR_CODE = new WeakMap();
_MASK_CODE = new WeakMap();
_MAX_AID = new WeakMap();
_BASE = new WeakMap();
_data = new WeakMap();
const bilibiliEncoder = new BilibiliEncoder();const fetchGetBarrageBlockingWords = () => {
  return new Promise((resolve, reject) => {
    fetch("https://api.bilibili.com/x/dm/filter/user", {
      credentials: "include"
    }).then((response) => response.json()).then(({ code, data, message }) => {
      if (code !== 0) {
        reject({ state: false, msg: `请求相应内容失败：msg=${message} code=` + code });
        return;
      }
      const { rule } = data;
      const list = [];
      for (let r of rule) {
        const { type, filter, ctime } = r;
        if (type === 2) {
          continue;
        }
        list.push({ type, filter, ctime });
      }
      resolve({ state: true, data, list, msg: "获取成功" });
    });
  });
};
const fetchGetAttentionInfo = (uid) => {
  return new Promise((resolve, reject) => {
    fetch(
      "https://api.bilibili.com/x/space/acc/relation?mid=" + uid,
      { credentials: "include" }
    ).then((response) => response.json()).then((data) => {
      if (data.code === 0) {
        if (data["be_relation"].mtime === 0) ;
        resolve({ state: true, data: data.data, msg: "获取成功" });
      }
      reject({ state: false, data, msg: "获取失败" });
    }).catch((error) => {
      reject({ state: false, msg: "请求失败", error });
    });
  });
};
const fetchGetVideoInfo = async (bvId) => {
  const response = await fetch(`https://api.bilibili.com/x/web-interface/view/detail?bvid=${bvId}`);
  if (response.status !== 200) {
    eventEmitter.send("请求获取视频信息失败", response, bvId);
    return { state: false, msg: "网络请求失败", data: response };
  }
  const { code, data, message } = await response.json();
  const defData = { state: false, msg: "默认失败信息" };
  if (code !== 0) {
    defData.msg = message;
    return defData;
  }
  defData.state = true;
  defData.msg = "获取成功";
  const {
    View: {
      staff,
      tname,
      tname_v2,
      desc,
      pubdate,
      ctime,
      copyright,
      is_upower_exclusive,
      duration,
      dimension,
      stat: {
        view,
        danmaku,
        reply,
        favorite,
        coin,
        share,
        like
      },
      argue_info: {
        argue_msg
      }
    },
    Card: {
      follower,
      like_num,
      archive_count,
      following,
      article_count,
      card: {
        friend,
        mid: uid,
        name,
        sex,
        level_info: {
          current_level
        },
        pendant,
        nameplate,
        Official,
        official_verify,
        vip,
        sign,
        is_senior_member
      }
    },
    Tags,
    participle
  } = data;
  const videoInfo = {
    staff,
    tname,
    tname_v2,
    desc,
    pubdate,
    ctime,
    copyright,
    is_upower_exclusive,
    duration,
    view,
    danmaku,
    reply,
    favorite,
    coin,
    share,
    participle,
    dimension,
    like,
    argue_msg
  };
  const userInfo = {
    follower,
    friend,
    like_num,
    archive_count,
    article_count,
    Official,
    official_verify,
    vip,
    uid: parseInt(uid),
    name,
    sex,
    current_level,
    pendant,
    nameplate,
    following,
    sign,
    is_senior_member
  };
  const tags = [];
  for (let tag of Tags) {
    tags.push(tag["tag_name"]);
  }
  tags.unshift(tname, tname_v2);
  const findKey = video_zoneData.findKey(tname);
  if (findKey) {
    tags.unshift(findKey);
  }
  defData.data = { videoInfo, userInfo, tags };
  return defData;
};
const fetchGetVideoReplyBoxDescription = async (bv) => {
  const avid = bilibiliEncoder.bv2av(bv);
  return new Promise((resolve, reject) => {
    fetch(
      `https://api.bilibili.com/x/v2/reply/subject/description?oid=${avid}&type=1`,
      { credentials: "include" }
    ).then((response) => response.json()).then((res) => {
      try {
        const { data, code, message } = res;
        const { child_text, disabled = false } = data["base"]["input"];
        if (code !== 0) {
          reject({ state: false, message });
          return;
        }
        resolve({ state: true, message, childText: child_text, disabled });
      } catch (e) {
        reject({ state: false, e });
      }
    }).catch((e) => {
      reject({ state: false, e });
    });
  });
};
window.fetchGetVideoInfo = fetchGetVideoInfo;
window.fetchGetVideoReplyBoxDescription = fetchGetVideoReplyBoxDescription;
var bFetch = {
  fetchGetVideoInfo,
  fetchGetBarrageBlockingWords,
  fetchGetAttentionInfo
};var __typeError$2 = (msg) => {
  throw TypeError(msg);
};
var __accessCheck$2 = (obj, member, msg) => member.has(obj) || __typeError$2("Cannot " + msg);
var __privateGet$2 = (obj, member, getter) => (__accessCheck$2(obj, member, "read from private field"), member.get(obj));
var __privateAdd$2 = (obj, member, value) => member.has(obj) ? __typeError$2("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet$2 = (obj, member, value, setter) => (__accessCheck$2(obj, member, "write to private field"), member.set(obj, value), value);
var __privateMethod = (obj, member, method) => (__accessCheck$2(obj, member, "access private method"), method);
var _cacheMap, _queue, _processing, _interval$1, _fetchBvData, _BvRequestQueue_instances, startProcessing_fn, processNext_fn;
class BvRequestQueue {
  constructor(options = {}) {
    __privateAdd$2(this, _BvRequestQueue_instances);
    __privateAdd$2(this, _cacheMap,  new Map());
    __privateAdd$2(this, _queue, []);
    __privateAdd$2(this, _processing, false);
    __privateAdd$2(this, _interval$1, 1e3);
    
    __privateAdd$2(this, _fetchBvData, null);
    __privateSet$2(this, _interval$1, options.interval ?? 1e3);
    __privateSet$2(this, _fetchBvData, options.fetchBvData ?? __privateGet$2(this, _fetchBvData));
  }
  setInterval(interval) {
    __privateSet$2(this, _interval$1, interval);
  }
  addBv(bv) {
    if (__privateGet$2(this, _cacheMap).has(bv)) {
      return __privateGet$2(this, _cacheMap).get(bv);
    }
    const promise = new Promise((resolve, reject) => {
      __privateGet$2(this, _queue).push({ bv, resolve, reject });
      if (!__privateGet$2(this, _processing)) {
        __privateMethod(this, _BvRequestQueue_instances, startProcessing_fn).call(this);
      }
    });
    __privateGet$2(this, _cacheMap).set(bv, promise);
    return promise;
  }
}
_cacheMap = new WeakMap();
_queue = new WeakMap();
_processing = new WeakMap();
_interval$1 = new WeakMap();
_fetchBvData = new WeakMap();
_BvRequestQueue_instances = new WeakSet();
startProcessing_fn = function() {
  __privateSet$2(this, _processing, true);
  __privateMethod(this, _BvRequestQueue_instances, processNext_fn).call(this);
};
processNext_fn = async function() {
  if (__privateGet$2(this, _queue).length === 0) {
    __privateSet$2(this, _processing, false);
    return;
  }
  const { bv, resolve, reject } = __privateGet$2(this, _queue).shift();
  try {
    const result = await __privateGet$2(this, _fetchBvData).call(this, bv);
    resolve(result);
  } catch (error) {
    __privateGet$2(this, _cacheMap).delete(bv);
    reject(error);
  } finally {
    if (__privateGet$2(this, _queue).length > 0) {
      await new Promise((r) => setTimeout(r, __privateGet$2(this, _interval$1)));
      __privateMethod(this, _BvRequestQueue_instances, processNext_fn).call(this);
    } else {
      __privateSet$2(this, _processing, false);
    }
  }
};
const videoInfoRequestQueue = new BvRequestQueue({
  fetchBvData: (bv) => {
    return new Promise((resolve, reject) => {
      bFetch.fetchGetVideoInfo(bv).then((res) => resolve(res)).catch((error) => reject(error));
    });
  }
});
const fetchGetVideoReplyBoxDescRequestQueue = new BvRequestQueue({
  fetchBvData: (bv) => {
    return new Promise((resolve, reject) => {
      bFetch.fetchGetVideoReplyBoxDescription(bv).then((res) => {
        resolve(res);
      }).catch((error) => reject(error));
    });
  }
});
const setAllRequestInterval = (interval) => {
  videoInfoRequestQueue.setInterval(interval);
  fetchGetVideoReplyBoxDescRequestQueue.setInterval(interval);
};
setAllRequestInterval(getRequestFrequencyVal() * 1e3);
var bvRequestQueue = {
  videoInfoRequestQueue,
  fetchGetVideoReplyBoxDescRequestQueue,
  setAllRequestInterval
};const mk_db = new Dexie("mk-db");
mk_db.version(1).stores({
  videoInfos: "bv,tags,userInfo,videoInfo,expiresMaxAge"
});
mk_db.version(2).stores({
  videoInfos: "bv, expiresMaxAge"
});
const addVideoData = async (bv, data) => {
  const { tags, userInfo, videoInfo } = data;
  try {
    await mk_db.videoInfos.add({
      bv,
      tags,
      userInfo,
      videoInfo,
      expiresMaxAge: getFutureTimestamp(getExpiresMaxAgeGm())
    });
  } catch (e) {
    console.warn(`添加视频数据失败`, bv, data, e);
    return false;
  }
  return true;
};
const bulkImportVideoInfos = async (friendsData) => {
  try {
    const lastKeyItem = await mk_db.videoInfos.bulkPut(friendsData);
    console.info("批量导入成功，最后一个插入的主键:", lastKeyItem);
    return { state: true, lastKeyItem };
  } catch (error) {
    console.error("批量导入时出错:", error);
    return { state: false, error };
  }
};
const getVideoInfo = async () => {
  return await mk_db.videoInfos.toArray();
};
const getVideoInfoCount = async () => {
  return await mk_db.videoInfos.count();
};
const findVideoInfoByBv = async (bv) => {
  const data = await mk_db.videoInfos.get(bv);
  return data ? data : null;
};
const clearVideoInfosTable = async () => {
  try {
    await mk_db.videoInfos.clear();
    return true;
  } catch (e) {
    console.log("清除videoInfos表失败", e);
    return false;
  }
};
const checkVideoInfoExpire = async () => {
  console.log("开始检查视频缓存表过期数据");
  const currentTimestamp = ( new Date()).getTime();
  const sentinels = await mk_db.videoInfos.where("expiresMaxAge").equals(-1).toArray();
  for (const item of sentinels) {
    await mk_db.videoInfos.update(item.bv, { expiresMaxAge: getFutureTimestamp(7) });
    console.log(`更新bv号为${item.bv}的过期时间戳为7天后`, item);
  }
  await mk_db.videoInfos.where("expiresMaxAge").below(currentTimestamp).delete();
  console.log("检查视频缓存表过期数据结束");
};
setTimeout(async () => {
  await checkVideoInfoExpire();
}, 1e3 * 15);
const delVideoInfoItem = async (bv) => {
  try {
    const item = await findVideoInfoByBv(bv);
    if (!item) return false;
    await mk_db.videoInfos.delete(bv);
    return true;
  } catch (e) {
    return false;
  }
};
const bulkDelVideoInfoItem = async (bvArr) => {
  const data = { state: false, success: [], fail: [] };
  try {
    const existingItem = await mk_db.videoInfos.bulkGet(bvArr);
    const existingKeys = existingItem.filter((item) => item).map((item) => item.bv);
    if (existingKeys.length === 0) {
      data.fail = bvArr;
      return data;
    }
    data.state = true;
    data.success.push(...existingKeys);
    if (existingKeys.length !== bvArr.length) {
      data.fail.push(...bvArr.filter((item) => !existingKeys.includes(item)));
    }
    await mk_db.videoInfos.bulkDelete(bvArr);
    return data;
  } catch (e) {
    console.log("批量删除数据库中指定bv号失败:", e);
    return data;
  }
};
var bvDexie = {
  addVideoData,
  findVideoInfoByBv,
  clearVideoInfosTable,
  bulkImportVideoInfos,
  getVideoInfo,
  getVideoInfoCount,
  delVideoInfoItem,
  bulkDelVideoInfoItem
};var __defProp$1 = Object.defineProperty;
var __typeError$1 = (msg) => {
  throw TypeError(msg);
};
var __defNormalProp$1 = (obj, key, value) => key in obj ? __defProp$1(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField$1 = (obj, key, value) => __defNormalProp$1(obj, key + "" , value);
var __accessCheck$1 = (obj, member, msg) => member.has(obj) || __typeError$1("Cannot " + msg);
var __privateGet$1 = (obj, member, getter) => (__accessCheck$1(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd$1 = (obj, member, value) => member.has(obj) ? __typeError$1("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet$1 = (obj, member, value, setter) => (__accessCheck$1(obj, member, "write to private field"), member.set(obj, value), value);
var _cachePr;
class VideoCacheManager {
  constructor() {
    __privateAdd$1(this, _cachePr, null);
    
    __publicField$1(this, "updateCacheDebounce", defUtil.debounce(() => {
      this.updateCache();
    }, 3e3));
  }
  async getCache() {
    if (__privateGet$1(this, _cachePr) !== null) {
      return __privateGet$1(this, _cachePr);
    }
    const p = new Promise((resolve) => {
      bvDexie.getVideoInfo().then((res) => resolve(res));
    });
    __privateSet$1(this, _cachePr, p);
    return p;
  }
  async updateCache() {
    __privateSet$1(this, _cachePr, null);
    await this.getCache().then((list) => {
      const msg = `已更新videoInfoCache，当前缓存数量：${list.length}`;
      console.log(msg);
      eventEmitter.send("event-update-out-info", { id: "更新videoInfoCache", msg });
      return list;
    });
  }
  async find(bv) {
    return await bvDexie.findVideoInfoByBv(bv);
  }
}
_cachePr = new WeakMap();
const videoCacheManager = new VideoCacheManager();const asyncBlockVideoTagPreciseCombination = async (tags) => {
  if (tags.length <= 0) return;
  const mkArrTags = ruleKeyListData.getVideoTagPreciseCombination();
  for (let mkTags of mkArrTags) {
    if (arrUtil.arrayContains(tags, mkTags)) return Promise.reject({
      state: true,
      type: "多重tag屏蔽",
      matching: mkTags
    });
  }
};
const blockVideoBV = (bv) => {
  const bvs = ruleKeyListData.getPreciseVideoBV();
  if (bvs.includes(bv)) {
    return { state: true, type: "精确bv号屏蔽", matching: bv };
  }
  return returnTempVal;
};
const blockVideoDuration = (duration) => {
  if (duration !== -1) {
    if (isMinimumDurationGm()) {
      const min = getMinimumDurationGm();
      if (min > duration && min !== -1) {
        return { state: true, type: "最小时长", matching: min };
      }
    }
    if (isMaximumDurationGm()) {
      const max = getMaximumDurationGm();
      if (max < duration && max !== -1) {
        return { state: true, type: "最大时长", matching: max };
      }
    }
  }
  return returnTempVal;
};
const blockVideoBulletChat = (bulletChat) => {
  if (bulletChat !== -1) {
    if (isMinimumBarrageGm()) {
      const min = getMinimumBarrageGm();
      if (min > bulletChat && min !== -1) {
        return { state: true, type: "最小弹幕数", matching: min };
      }
    }
    if (isMaximumBarrageGm()) {
      const max = getMaximumBarrageGm();
      if (max < bulletChat && max !== -1) {
        return { state: true, type: "最大弹幕数", matching: max };
      }
    }
  }
  return returnTempVal;
};
const blockVideoPlayCount = (playCount) => {
  if (playCount === -1) return returnTempVal;
  if (isMinimumPlayGm()) {
    const min = getMinimumPlayGm();
    if (min > playCount && min !== -1) {
      return { state: true, type: "最小播放量", matching: min };
    }
  }
  if (isMaximumPlayGm()) {
    const max = getMaximumPlayGm();
    if (max < playCount && max !== -1) {
      return { state: true, type: "最大播放量", matching: max };
    }
  }
  return returnTempVal;
};
const blockArgueMsgContent = (argueMsg) => {
  if (argueMsg === void 0 || argueMsg.trim().length <= 0) return returnTempVal;
  const argueMsgList = GM_getValue("argue_msg", []);
  let match = ruleMatchingUtil.fuzzyMatch(argueMsgList, argueMsg);
  if (match !== null) {
    return { state: true, type: "争议消息内容模糊屏蔽", matching: match };
  }
  const argueMsgPreciseList = GM_getValue("argue_msg_precise", []);
  match = ruleMatchingUtil.exactMatch(argueMsgPreciseList, argueMsg);
  if (match) {
    return { state: true, type: "争议消息内容精确屏蔽", matching: match };
  }
  return returnTempVal;
};
const asyncBlockArgueMsgContent = async (argueMsg) => {
  const res = blockArgueMsgContent(argueMsg);
  if (res.state) {
    return Promise.reject(res);
  }
  return res;
};
const shieldingVideo = (videoData) => {
  const {
    title,
    uid = -1,
    name,
    nDuration = -1,
    nBulletChat = -1,
    nPlayCount = -1,
    bv = null
  } = videoData;
  let returnVal = blockUserUidAndName(uid, name);
  if (returnVal.state) return returnVal;
  if (isEffectiveUIDShieldingOnlyVideo()) return returnTempVal;
  returnVal = blockVideoOrOtherTitle(title);
  if (returnVal.state) return returnVal;
  returnVal = blockVideoBV(bv);
  if (returnVal.state) return returnVal;
  returnVal = blockVideoDuration(nDuration);
  if (returnVal.state) return returnVal;
  returnVal = blockVideoBulletChat(nBulletChat);
  if (returnVal.state) return returnVal;
  returnVal = blockVideoPlayCount(nPlayCount);
  if (returnVal.state) return returnVal;
  return returnTempVal;
};
const processedBVs =  new Set();
const MAX_PROCESSED_BVS = 1e3;
const processingBVs =  new Set();
const isVideoBvProcessed = (bv) => processedBVs.has(bv);
const addProcessedBV = (bv) => {
  processedBVs.add(bv);
  if (processedBVs.size > MAX_PROCESSED_BVS) {
    let count = 0;
    for (const key of processedBVs) {
      if (count++ >= processedBVs.size - MAX_PROCESSED_BVS) break;
      processedBVs.delete(key);
    }
  }
};
const shieldingVideoDecorated = async (videoData, method = "remove") => {
  const { el, bv = "-1" } = videoData;
  if (el.style.display === "none") return promiseResolve;
  if (bv !== "-1" && processedBVs.has(bv)) return promiseReject;
  const { state, type, matching = null } = shieldingVideo(videoData);
  if (state) {
    addProcessedBV(bv);
    eventEmitter.send("event-屏蔽视频元素", { res: { state, type, matching }, method, videoData });
    return promiseResolve;
  }
  if (bv === "-1") return promiseReject;
  if (processingBVs.has(bv)) return promiseReject;
  processingBVs.add(bv);
  try {
    let videoRes = await videoCacheManager.find(bv);
    if (videoRes === null) {
      const disableNetRequestsBvVideoInfo = localMKData.isDisableNetRequestsBvVideoInfo();
      if (disableNetRequestsBvVideoInfo) {
        return promiseReject;
      } else {
        const httpRes = await bvRequestQueue.videoInfoRequestQueue.addBv(bv);
        const { msg, data } = httpRes;
        if (!httpRes.state) {
          console.warn("获取视频信息失败:" + msg);
          return promiseReject;
        }
        videoRes = data;
        if (await bvDexie.addVideoData(bv, data)) {
          console.log("mk-db-添加视频信息到数据库成功", "获取视频信息成功:" + msg, data, videoData);
          videoCacheManager.updateCacheDebounce();
        }
      }
    }
    const verificationIns = await shieldingOtherVideoParameter(videoRes, videoData);
    if (verificationIns.state) {
      addProcessedBV(bv);
      eventEmitter.send("event-屏蔽视频元素", { res: verificationIns, method, videoData });
      return promiseResolve;
    }
    addProcessedBV(bv);
    return promiseReject;
  } finally {
    processingBVs.delete(bv);
  }
};
eventEmitter.on("event-屏蔽视频元素", ({ res, method = "remove", videoData }) => {
  if (!res) return;
  const { type, matching } = res;
  const { el } = videoData;
  if (!GM_getValue("hide_video_mode", false)) {
    const onlyDisplayType = GM_getValue("overlay_only_type", false);
    const reason = onlyDisplayType ? type : `${type}: ${matching}`;
    createOverlay(el, reason);
    eventEmitter.send("event-打印屏蔽视频信息", type, matching, videoData);
    return;
  }
  if (method === "remove") {
    el?.remove();
  } else {
    el.style.display = "none";
  }
  eventEmitter.send("event-打印屏蔽视频信息", type, matching, videoData);
});
const shieldingOtherVideoParameter = async (result, videoData) => {
  const { tags = [], userInfo, videoInfo } = result;
  return asyncBlockUserUidAndName(userInfo.uid, userInfo.name).then(() => {
    if (!isEffectiveUIDShieldingOnlyVideo()) {
      return;
    }
    return Promise.reject({ type: "中断", msg: "仅生效UID屏蔽(限视频)" });
  }).then(() => {
    if (tags.length === 0) return;
    const mkArrTags = ruleKeyListData.getVideoTagCombinationWhite();
    for (let mkArrTag of mkArrTags) {
      if (arrUtil.arrayContains(tags, mkArrTag)) {
        return Promise.reject({ type: "中断", msg: "视频标签组合白名单" });
      }
    }
  }).then(() => asyncBlockVideoTagPreciseCombination(tags)).then(() => asyncBlockBasedVideoTag(tags)).then(() => asyncBlockLimitationFanSum(userInfo.follower)).then(() => asyncBlockVerticalVideo(videoInfo.dimension)).then(() => asyncBlockVideoCopyright(videoInfo.copyright)).then(() => asyncBlockChargeVideo(videoInfo?.is_upower_exclusive)).then(() => asyncBlockFollowedVideo(videoInfo?.following)).then(() => asyncBlockSeniorMember(userInfo.is_senior_member)).then(() => asyncBlockVideoTeamMember(userInfo.mid)).then(() => asyncBlockVideoLikeRate(videoInfo.like, videoInfo.view)).then(() => asyncBlockVideoInteractiveRate(videoInfo.danmaku, videoInfo.reply, videoInfo.view)).then(() => asyncBlockVideoTripleRate(videoInfo.favorite, videoInfo.coin, videoInfo.share, videoInfo.view)).then(() => asyncBlockVideoCoinLikesRatioRate(videoInfo.coin, videoInfo.like)).then(() => asyncBlockVideoFavoriteCoinRatio(videoInfo.favorite, videoInfo.coin, videoInfo.view, videoInfo.pubdate)).then(() => asyncBlockVideoPartition(videoInfo?.tname)).then(() => asyncBlockTimeRangeMasking(videoInfo.pubdate)).then(() => asyncBlockVideoDesc(videoInfo?.desc)).then(() => asyncBlockSignature(videoInfo?.sign)).then(() => asyncBlockAvatarPendant(userInfo?.pendant?.name)).then(() => asyncBlockByLevel(userInfo?.current_level || -1)).then(() => asyncBlockGender(userInfo?.sex)).then(() => asyncBlockUserVip(userInfo.vip.type)).then(() => asyncBlockUserVideoNumLimit(userInfo.archive_count)).then(async () => {
    const videosInFeaturedCommentsBlockedVal = isVideosInFeaturedCommentsBlockedGm();
    const followers7DaysOnlyVideosBlockedVal = isFollowers7DaysOnlyVideosBlockedGm();
    const commentDisabledVideosBlockedVal = isCommentDisabledVideosBlockedGm();
    if (videosInFeaturedCommentsBlockedVal === false && followers7DaysOnlyVideosBlockedVal === false && commentDisabledVideosBlockedVal === false) {
      return;
    }
    const res = await bvRequestQueue.fetchGetVideoReplyBoxDescRequestQueue.addBv(videoData.bv);
    const { childText, disabled, message, state } = res;
    if (!state) {
      console.warn("获取视频评论输入框失败:" + message);
      return;
    }
    if (commentDisabledVideosBlockedVal && disabled) {
      return Promise.reject({ state, type: "禁止评论类视频" });
    }
    if (childText === "关注UP主7天以上的人可发评论" && followers7DaysOnlyVideosBlockedVal) {
      return Promise.reject({ state, type: "7天关注才可评论类视频" });
    }
    if (childText === "评论被up主精选后，对所有人可见" && videosInFeaturedCommentsBlockedVal) {
      return Promise.reject({ state, type: "精选评论类视频" });
    }
  }).then(() => asyncBlockArgueMsgContent(videoInfo["argue_msg"])).then(() => {
    return returnTempVal;
  }).catch((v) => {
    const { msg, type } = v;
    if (msg) {
      console.warn("warn-type-msg", msg);
    }
    if (type === "中断") return returnTempVal;
    return v;
  });
};
eventEmitter.on("添加热门视频屏蔽按钮", (data) => {
  shielding.addBlockButton(data, "gz_shielding_button", ["right", "bottom"]);
});
eventEmitter.on("视频添加屏蔽按钮-BewlyBewly", (data) => {
  shielding.addBlockButton(data, "gz_shielding_button", ["right", "bottom"]);
});
eventEmitter.on("视频添加屏蔽按钮", (data) => {
  shielding.addBlockButton(data, "gz_shielding_button", ["right"]);
});
var video_shielding = {
  shieldingVideoDecorated,
  isVideoBvProcessed
};const isHome = (url, title) => {
  if (title !== "哔哩哔哩 (゜-゜)つロ 干杯~-bilibili") {
    return false;
  }
  if (url === "https://www.bilibili.com/") {
    return true;
  }
  if (url.includes("https://www.bilibili.com/?spm_id_from=")) {
    return true;
  }
  return url.includes("https://www.bilibili.com/?page=");
};
const deDesktopDownloadTipEl = async () => {
  const el = await elUtil.findElement(".desktop-download-tip");
  el?.remove();
  const log = "已删除下载提示";
  console.log(log, el);
};
const hideHomeCarouselImage = (hide, immediately = false) => {
  const selector = ".container.is-version8>.recommended-swipe";
  if (immediately) {
    try {
      document.body.querySelector(selector).style.display = hide ? "none" : "";
    } catch (e) {
      console.log("隐藏首页轮播图失败", e);
    }
    return;
  }
  elUtil.findElement(selector).then((el) => {
    el.style.display = hide ? "none" : "";
  });
};
const hideHomeTopHeaderBannerImage = (hide) => {
  elUtil.findElement(".bili-header__banner").then((el) => {
    if (hide) {
      el.style.cssText = `
                visibility: hidden;
                height: 0 !important;
                min-height: 45px !important;
            `;
    } else {
      el.style.cssText = `
                visibility: visible;
                height: auto!important;
                min-height: 155px;
            `;
    }
  });
};
const getVideoData = (el) => {
  const title = el.querySelector(".bili-video-card__info--tit").title;
  const name = el.querySelector(".bili-video-card__info--author").textContent.trim();
  let nPlayCount = el.querySelector(".bili-video-card__stats--text")?.textContent.trim();
  nPlayCount = strFormatUtil.toPlayCountOrBulletChat(nPlayCount);
  let nBulletChat = el.querySelector(".bili-video-card__stats--text")?.textContent.trim();
  nBulletChat = strFormatUtil.toPlayCountOrBulletChat(nBulletChat);
  let nDuration = el.querySelector(".bili-video-card__stats__duration")?.textContent.trim();
  nDuration = strFormatUtil.timeStringToSeconds(nDuration);
  const userUrl = el.querySelector(".bili-video-card__info--owner").getAttribute("href");
  const uid = urlUtil.getUrlUID(userUrl);
  return {
    title,
    name,
    uid,
    nPlayCount,
    nBulletChat,
    nDuration,
    userUrl
  };
};
const getHomeVideoELList = async () => {
  const elList = await elUtil.findElements(".container.is-version8>.feed-card,.container.is-version8>.bili-feed-card");
  let list = [];
  for (let el of elList) {
    try {
      const tempData = getVideoData(el);
      const { userUrl } = tempData;
      if (!userUrl.includes("//space.bilibili.com/")) {
        el?.remove();
        const log = "遍历换一换视频列表下面列表时检测到异常内容，已将该元素移除";
        eventEmitter.send("打印信息", log);
        console.log(log, el);
        continue;
      }
      const videoUrl = el.querySelector(".bili-video-card__info--tit>a")?.href;
      const items = {
        ...tempData,
        ...{
          videoUrl,
          el,
          insertionPositionEl: el.querySelector(".bili-video-card__info--bottom"),
          explicitSubjectEl: el.querySelector(".bili-video-card__info")
        }
      };
      if (videoUrl?.includes("www.bilibili.com/video")) {
        items.bv = urlUtil.getUrlBV(videoUrl);
      }
      list.push(items);
    } catch (e) {
      el?.remove();
      console.log("遍历视频列表中检测到异常内容，已将该元素移除;");
    }
  }
  return list;
};
const startClearExcessContentList = () => {
  document.querySelectorAll(".adcard,.fixed-card").forEach((el) => el.remove());
  const releaseTypeCards = getReleaseTypeCardsGm();
  for (let el of document.querySelectorAll(".floor-single-card")) {
    const badgeEl = el.querySelector(".cover-container .badge>.floor-title");
    if (badgeEl === null) {
      continue;
    }
    const badge = badgeEl.textContent.trim();
    if (releaseTypeCards.includes(badge)) {
      continue;
    }
    el?.remove();
    console.log(`已清除视频列表中的${badge}类卡片`, el);
  }
};
const startShieldingHomeVideoList = async () => {
  const homeVideoELList = await getHomeVideoELList();
  for (const videoData of homeVideoELList) {
    eventEmitter.send("视频添加屏蔽按钮", { data: videoData, maskingFunc: startShieldingHomeVideoList });
    if (videoData.bv && video_shielding.isVideoBvProcessed(videoData.bv)) continue;
    video_shielding.shieldingVideoDecorated(videoData);
  }
  startClearExcessContentList();
};
const startDebounceShieldingHomeVideoList = defUtil.debounce(startShieldingHomeVideoList, 800);
const scrollMouseUpAndDown = async () => {
  const el = document.body.querySelector("#home-bottom-div");
  el.scrollIntoView({ behavior: "smooth", block: "end" });
  await defUtil.wait(1200);
  document.querySelector(".browser-tip").scrollIntoView({ behavior: "smooth" });
};
const checkVideoListCount = () => {
  setInterval(async () => {
    console.log("开始检查视频列表数量");
    const elList = document.body.querySelectorAll(".container.is-version8>div:is(.feed-card,.bili-feed-card)");
    if (elList.length === 0) return;
    if (elList.length <= 9) {
      await scrollMouseUpAndDown();
    }
    startClearExcessContentList();
  }, 3e3);
};
const run$3 = () => {
  deDesktopDownloadTipEl();
  if (isHideCarouselImageGm()) {
    hideHomeCarouselImage(true);
  }
  if (isHideHomeTopHeaderBannerImageGm()) {
    hideHomeTopHeaderBannerImage(true);
  }
  if (isHideHomeTopHeaderChannelGm()) {
    cssManager.hideHomeTopHeaderChannel(true);
  }
  GM_addStyle(`
    .recommended-container_floor-aside .container>*:nth-of-type(7) {
  
  
    margin-top: auto !important;
}
@media (min-width: 1560px) and (max-width: 2059.9px) {
    .recommended-container_floor-aside .container>*:nth-of-type(n + 8) {
        margin-top: auto !important;
    }
}
    `);
  elUtil.findElement(".load-more-anchor~.bili-video-card:last-child").then((el) => {
    let current = el;
    for (let i = 0; i < 12; i++) {
      const clone = current.cloneNode(true);
      current.insertAdjacentElement("afterend", clone);
      current = clone;
    }
    console.log("已插入12个空元素至视频列表尾部，最后插入的元素", current);
  });
  const bottomDiv = document.createElement("div");
  bottomDiv.id = "home-bottom-div";
  bottomDiv.style.all = "initial";
  document.body.appendChild(bottomDiv);
  if (isAutomaticScrollingGm()) {
    setTimeout(() => {
      checkVideoListCount();
    }, 1400);
  }
};
var bilibiliHome = {
  isHome,
  startDebounceShieldingHomeVideoList,
  getVideoData,
  hideHomeCarouselImage,
  hideHomeTopHeaderBannerImage,
  run: run$3
};var script$r = Vue.defineComponent({
  name: "HomePageProcessingTab",
  data() {
    return {
      isHideCarouselImageVal: isHideCarouselImageGm(),
      isHideHomeTopHeaderBannerImageVal: isHideHomeTopHeaderBannerImageGm(),
      isHideTopHeaderChannelVal: isHideHomeTopHeaderChannelGm(),
      isAutomaticScrollingVal: isAutomaticScrollingGm(),
      releaseTypeCardVals: getReleaseTypeCardsGm()
    };
  },
  watch: {
    isHideCarouselImageVal(n) {
      GM_setValue("is_hide_carousel_image_gm", n);
      bilibiliHome.hideHomeCarouselImage(n, true);
    },
    isHideHomeTopHeaderBannerImageVal(n) {
      GM_setValue("is_hide_home_top_header_banner_image_gm", n);
      bilibiliHome.hideHomeTopHeaderBannerImage(n);
    },
    isHideTopHeaderChannelVal(n) {
      GM_setValue("is_hide_home_top_header_channel_gm", n);
      cssManager.hideHomeTopHeaderChannel(n);
    },
    isAutomaticScrollingVal(n) {
      GM_setValue("is_automatic_scrolling_gm", n);
    },
    releaseTypeCardVals(n) {
      GM_setValue("release_type_cards_gm", n);
    }
  }
});
const __vue_script__$r = script$r;
var __vue_render__$r = function () {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _c(
    "el-card",
    {
      attrs: { shadow: "never" },
      scopedSlots: _vm._u([
        {
          key: "header",
          fn: function () {
            return [_vm._v("首页")]
          },
          proxy: true,
        },
      ]),
    },
    [
      _vm._v(" "),
      _c("el-switch", {
        attrs: { "active-text": "隐藏轮播图" },
        model: {
          value: _vm.isHideCarouselImageVal,
          callback: function ($$v) {
            _vm.isHideCarouselImageVal = $$v;
          },
          expression: "isHideCarouselImageVal",
        },
      }),
      _vm._v(" "),
      _c("el-switch", {
        attrs: { "active-text": "隐藏顶部标题横幅图片" },
        model: {
          value: _vm.isHideHomeTopHeaderBannerImageVal,
          callback: function ($$v) {
            _vm.isHideHomeTopHeaderBannerImageVal = $$v;
          },
          expression: "isHideHomeTopHeaderBannerImageVal",
        },
      }),
      _vm._v(" "),
      _c(
        "el-tooltip",
        { attrs: { content: "隐藏视频列表上方的动态、热门、频道栏一整行" } },
        [
          _c("el-switch", {
            attrs: { "active-text": "隐藏顶部页面频道栏" },
            model: {
              value: _vm.isHideTopHeaderChannelVal,
              callback: function ($$v) {
                _vm.isHideTopHeaderChannelVal = $$v;
              },
              expression: "isHideTopHeaderChannelVal",
            },
          }),
        ],
        1
      ),
      _vm._v(" "),
      _c(
        "el-tooltip",
        {
          attrs: {
            content: "定时检测首页视频列表数量，如果数量<=9则模拟鼠标上下滚动",
          },
        },
        [
          _c("el-switch", {
            attrs: { "active-text": "检查视频列表数量模拟鼠标上下滚动" },
            model: {
              value: _vm.isAutomaticScrollingVal,
              callback: function ($$v) {
                _vm.isAutomaticScrollingVal = $$v;
              },
              expression: "isAutomaticScrollingVal",
            },
          }),
        ],
        1
      ),
      _vm._v(" "),
      _c("el-divider"),
      _vm._v(" "),
      _c(
        "el-tooltip",
        {
          attrs: {
            content: "但视频列表中出现选择的类型时跳过，反之屏蔽",
            placement: "top",
          },
        },
        [
          _c(
            "div",
            [
              _vm._v("放行的卡片\n      "),
              _c("el-divider"),
              _vm._v(" "),
              _c(
                "el-checkbox-group",
                {
                  model: {
                    value: _vm.releaseTypeCardVals,
                    callback: function ($$v) {
                      _vm.releaseTypeCardVals = $$v;
                    },
                    expression: "releaseTypeCardVals",
                  },
                },
                [
                  _c("el-checkbox", { attrs: { label: "直播" } }),
                  _vm._v(" "),
                  _c("el-checkbox", { attrs: { label: "番剧" } }),
                  _vm._v(" "),
                  _c("el-checkbox", { attrs: { label: "电影" } }),
                  _vm._v(" "),
                  _c("el-checkbox", { attrs: { label: "国创" } }),
                  _vm._v(" "),
                  _c("el-checkbox", { attrs: { label: "综艺" } }),
                  _vm._v(" "),
                  _c("el-checkbox", { attrs: { label: "课堂" } }),
                  _vm._v(" "),
                  _c("el-checkbox", { attrs: { label: "电视剧" } }),
                  _vm._v(" "),
                  _c("el-checkbox", { attrs: { label: "纪录片" } }),
                  _vm._v(" "),
                  _c("el-checkbox", { attrs: { label: "漫画" } }),
                ],
                1
              ),
            ],
            1
          ),
        ]
      ),
    ],
    1
  )
};
var __vue_staticRenderFns__$r = [];
__vue_render__$r._withStripped = true;
  
  const __vue_inject_styles__$r = undefined;
  
  const __vue_scope_id__$r = undefined;
  
  const __vue_module_identifier__$r = undefined;
  
  const __vue_is_functional_template__$r = false;
  
  
  
  
  
  
  
  const __vue_component__$r = normalizeComponent(
    { render: __vue_render__$r, staticRenderFns: __vue_staticRenderFns__$r },
    __vue_inject_styles__$r,
    __vue_script__$r,
    __vue_scope_id__$r,
    __vue_is_functional_template__$r,
    __vue_module_identifier__$r,
    false,
    undefined);var script$q = {
  components: {
    HomePageProcessingTab: __vue_component__$r,
    PlayPageProcessingTab: __vue_component__$s,
    PageProcessingView: __vue_component__$u,
    dynamicCard: __vue_component__$t
  },
  data() {
    return {};
  }
};
const __vue_script__$q = script$q;
var __vue_render__$q = function () {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _c(
    "el-tabs",
    { attrs: { "tab-position": "left" } },
    [
      _c(
        "el-tab-pane",
        { attrs: { label: "默认设置", lazy: "" } },
        [_c("pageProcessingView")],
        1
      ),
      _vm._v(" "),
      _c(
        "el-tab-pane",
        { attrs: { label: "首页", lazy: "" } },
        [_c("HomePageProcessingTab")],
        1
      ),
      _vm._v(" "),
      _c(
        "el-tab-pane",
        { attrs: { label: "播放页", lazy: "" } },
        [_c("PlayPageProcessingTab")],
        1
      ),
      _vm._v(" "),
      _c(
        "el-tab-pane",
        { attrs: { label: "动态", lazy: "" } },
        [_c("dynamicCard")],
        1
      ),
    ],
    1
  )
};
var __vue_staticRenderFns__$q = [];
__vue_render__$q._withStripped = true;
  
  const __vue_inject_styles__$q = function (inject) {
    if (!inject) return
    inject("data-v-ba69f99a_0", { source: "\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n", map: {"version":3,"sources":[],"names":[],"mappings":"","file":"PageProcessingTabsView.vue"}, media: undefined });
  };
  
  const __vue_scope_id__$q = "data-v-ba69f99a";
  
  const __vue_module_identifier__$q = undefined;
  
  const __vue_is_functional_template__$q = false;
  
  
  
  
  
  const __vue_component__$q = normalizeComponent(
    { render: __vue_render__$q, staticRenderFns: __vue_staticRenderFns__$q },
    __vue_inject_styles__$q,
    __vue_script__$q,
    __vue_scope_id__$q,
    __vue_is_functional_template__$q,
    __vue_module_identifier__$q,
    false,
    createInjector);var script$p = {
  data() {
    return {
      show: false,
      title: "图片查看",
      imgList: [],
      imgSrc: "",
      isModal: true
    };
  },
  created() {
    eventEmitter.on("显示图片对话框", ({ image, title, images, isModal }) => {
      this.imgSrc = image;
      if (title) {
        this.title = title;
      }
      if (images) {
        this.imgList = images;
      } else {
        this.imgList = [image];
      }
      if (isModal) {
        this.isModal = isModal;
      }
      this.show = true;
    });
  }
};
const __vue_script__$p = script$p;
var __vue_render__$p = function () {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _c(
    "div",
    [
      _c(
        "el-dialog",
        {
          attrs: {
            modal: _vm.isModal,
            title: _vm.title,
            visible: _vm.show,
            center: "",
          },
          on: {
            "update:visible": function ($event) {
              _vm.show = $event;
            },
          },
        },
        [
          _c(
            "div",
            { staticClass: "el-vertical-center" },
            [
              _c("el-image", {
                attrs: { "preview-src-list": _vm.imgList, src: _vm.imgSrc },
              }),
            ],
            1
          ),
        ]
      ),
    ],
    1
  )
};
var __vue_staticRenderFns__$p = [];
__vue_render__$p._withStripped = true;
  
  const __vue_inject_styles__$p = undefined;
  
  const __vue_scope_id__$p = undefined;
  
  const __vue_module_identifier__$p = undefined;
  
  const __vue_is_functional_template__$p = false;
  
  
  
  
  
  
  
  const __vue_component__$p = normalizeComponent(
    { render: __vue_render__$p, staticRenderFns: __vue_staticRenderFns__$p },
    __vue_inject_styles__$p,
    __vue_script__$p,
    __vue_scope_id__$p,
    __vue_is_functional_template__$p,
    __vue_module_identifier__$p,
    false,
    undefined);var script$o = {
  data() {
    return {
      visible: false,
      optionsList: [],
      dialogTitle: "",
      
      optionsClick: null,
      closeOnClickModal: true,
      contents: []
    };
  },
  methods: {
    handleClose() {
      this.visible = false;
      if (this.contents.length > 0) {
        this.contents = [];
      }
    },
    handleOptionsClick(item) {
      if (this.closeOnClickModal) {
        return;
      }
      let tempBool;
      const temp = this.optionsClick(item);
      if (temp === void 0) {
        tempBool = false;
      } else {
        tempBool = temp;
      }
      this.visible = tempBool === true;
    }
  },
  created() {
    eventEmitter.on("sheet-dialog", ({
      list,
      optionsClick,
      title = "选项",
      closeOnClickModal = false,
      contents
    }) => {
      this.visible = true;
      this.optionsList = list;
      this.dialogTitle = title;
      this.optionsClick = optionsClick;
      this.closeOnClickModal = closeOnClickModal;
      if (contents) {
        this.contents = contents;
      }
    });
  }
};
const __vue_script__$o = script$o;
var __vue_render__$o = function () {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _c(
    "div",
    [
      _c(
        "el-dialog",
        {
          attrs: {
            "close-on-click-modal": _vm.closeOnClickModal,
            title: _vm.dialogTitle,
            visible: _vm.visible,
            center: "",
            width: "30%",
          },
          on: { close: _vm.handleClose },
        },
        [
          _c(
            "div",
            [
              _c(
                "el-row",
                [
                  _c(
                    "el-col",
                    _vm._l(_vm.contents, function (v) {
                      return _c("div", { key: v }, [_vm._v(_vm._s(v))])
                    }),
                    0
                  ),
                  _vm._v(" "),
                  _vm._l(_vm.optionsList, function (item) {
                    return _c(
                      "el-col",
                      { key: item.label },
                      [
                        _c(
                          "el-button",
                          {
                            staticStyle: { width: "100%" },
                            attrs: { title: item.title },
                            on: {
                              click: function ($event) {
                                return _vm.handleOptionsClick(item)
                              },
                            },
                          },
                          [_vm._v(_vm._s(item.label) + "\n          ")]
                        ),
                      ],
                      1
                    )
                  }),
                ],
                2
              ),
            ],
            1
          ),
        ]
      ),
    ],
    1
  )
};
var __vue_staticRenderFns__$o = [];
__vue_render__$o._withStripped = true;
  
  const __vue_inject_styles__$o = undefined;
  
  const __vue_scope_id__$o = undefined;
  
  const __vue_module_identifier__$o = undefined;
  
  const __vue_is_functional_template__$o = false;
  
  
  
  
  
  
  
  const __vue_component__$o = normalizeComponent(
    { render: __vue_render__$o, staticRenderFns: __vue_staticRenderFns__$o },
    __vue_inject_styles__$o,
    __vue_script__$o,
    __vue_scope_id__$o,
    __vue_is_functional_template__$o,
    __vue_module_identifier__$o,
    false,
    undefined);var script$n = {
  props: {
    formatTooltip: {
      type: Function
    },
    switchActiveText: { type: String, default: "启用" },
    step: { type: Number, default: 1 },
    min: { type: Number, default: 0 },
    max: { type: Number, default: 100 },
    value: { type: Number, default: 0 },
    switchVal: { type: Boolean, default: false },
    range: { type: Boolean, default: false }
  },
  data() {
    return {
      local_switchVal: this.switchVal,
      disabled: !this.switchVal,
      sliderVal: this.value
    };
  },
  methods: {},
  watch: {
    value(n) {
      this.sliderVal = n;
    },
    sliderVal(n) {
      this.$emit("input", n);
    },
    disabled(n) {
      this.$emit("slider-disabled-change", n);
    },
    switchVal(n) {
      this.local_switchVal = n;
    },
    local_switchVal(n) {
      this.disabled = !n;
      this.$emit("update:switchVal", n);
    }
  }
};
const __vue_script__$n = script$n;
var __vue_render__$n = function () {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _c(
    "div",
    [
      _c(
        "el-card",
        {
          attrs: { shadow: "never" },
          scopedSlots: _vm._u(
            [
              {
                key: "header",
                fn: function () {
                  return [_vm._t("header")]
                },
                proxy: true,
              },
            ],
            null,
            true
          ),
        },
        [
          _vm._v(" "),
          _vm._t("describe"),
          _vm._v(" "),
          _c(
            "div",
            { staticStyle: { display: "flex", "align-items": "center" } },
            [
              _c("el-switch", {
                attrs: { "active-text": _vm.switchActiveText },
                model: {
                  value: _vm.local_switchVal,
                  callback: function ($$v) {
                    _vm.local_switchVal = $$v;
                  },
                  expression: "local_switchVal",
                },
              }),
              _vm._v(" "),
              _c(
                "div",
                { staticStyle: { flex: "1", "margin-left": "15px" } },
                [
                  _c("el-slider", {
                    attrs: {
                      disabled: _vm.disabled,
                      "format-tooltip": _vm.formatTooltip,
                      max: _vm.max,
                      min: _vm.min,
                      range: _vm.range,
                      step: _vm.step,
                      "show-input": "",
                    },
                    model: {
                      value: _vm.sliderVal,
                      callback: function ($$v) {
                        _vm.sliderVal = $$v;
                      },
                      expression: "sliderVal",
                    },
                  }),
                ],
                1
              ),
            ],
            1
          ),
        ],
        2
      ),
    ],
    1
  )
};
var __vue_staticRenderFns__$n = [];
__vue_render__$n._withStripped = true;
  
  const __vue_inject_styles__$n = undefined;
  
  const __vue_scope_id__$n = undefined;
  
  const __vue_module_identifier__$n = undefined;
  
  const __vue_is_functional_template__$n = false;
  
  
  
  
  
  
  
  const __vue_component__$n = normalizeComponent(
    { render: __vue_render__$n, staticRenderFns: __vue_staticRenderFns__$n },
    __vue_inject_styles__$n,
    __vue_script__$n,
    __vue_scope_id__$n,
    __vue_is_functional_template__$n,
    __vue_module_identifier__$n,
    false,
    undefined);var script$m = {
  components: { cardSlider: __vue_component__$n },
  props: {
    headerTitle: { type: String },
    describe: { type: String },
    mkTypeRateKey: { type: String },
    mkRateStatusKey: { type: String }
  },
  data() {
    return {
      rateBlockingStatus: GM_getValue(this.mkRateStatusKey, false),
      ratioRateVal: GM_getValue(this.mkTypeRateKey, 0.05)
    };
  },
  methods: {
    reteFormatTooltip(val) {
      return (val * 100).toFixed(0) + "%";
    }
  },
  watch: {
    ratioRateVal(n) {
      GM_setValue(this.mkTypeRateKey, n);
    },
    rateBlockingStatus(n) {
      GM_setValue(this.mkRateStatusKey, n);
    }
  }
};
const __vue_script__$m = script$m;
var __vue_render__$m = function () {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _c(
    "div",
    [
      _c("cardSlider", {
        attrs: {
          "format-tooltip": _vm.reteFormatTooltip,
          max: 1,
          min: 0,
          step: 0.01,
          "switch-val": _vm.rateBlockingStatus,
        },
        on: {
          "update:switchVal": function ($event) {
            _vm.rateBlockingStatus = $event;
          },
          "update:switch-val": function ($event) {
            _vm.rateBlockingStatus = $event;
          },
        },
        scopedSlots: _vm._u([
          {
            key: "header",
            fn: function () {
              return [_vm._v(_vm._s(_vm.headerTitle))]
            },
            proxy: true,
          },
          {
            key: "describe",
            fn: function () {
              return [_vm._v(_vm._s(_vm.describe))]
            },
            proxy: true,
          },
        ]),
        model: {
          value: _vm.ratioRateVal,
          callback: function ($$v) {
            _vm.ratioRateVal = $$v;
          },
          expression: "ratioRateVal",
        },
      }),
    ],
    1
  )
};
var __vue_staticRenderFns__$m = [];
__vue_render__$m._withStripped = true;
  
  const __vue_inject_styles__$m = undefined;
  
  const __vue_scope_id__$m = undefined;
  
  const __vue_module_identifier__$m = undefined;
  
  const __vue_is_functional_template__$m = false;
  
  
  
  
  
  
  
  const __vue_component__$m = normalizeComponent(
    { render: __vue_render__$m, staticRenderFns: __vue_staticRenderFns__$m },
    __vue_inject_styles__$m,
    __vue_script__$m,
    __vue_scope_id__$m,
    __vue_is_functional_template__$m,
    __vue_module_identifier__$m,
    false,
    undefined);var script$l = {
  components: { video_metrics_filter_item_view: __vue_component__$m, card_slider: __vue_component__$n },
  data() {
    return {
      metricsFilterList: [
        {
          headerTitle: "视频点赞率屏蔽",
          describe: "限制的点赞率，默认为2%，小于或等于值限时制的屏蔽该视频，公式【点赞率=点赞数/播放量*100】",
          mkRateStatusKey: "video_like_rate_blocking_status",
          mkTypeRateKey: "video_like_rate"
        },
        {
          headerTitle: "视频互动率屏蔽",
          describe: "限制的占比率，默认为2%，小于或等于值限时制的屏蔽该视频，公式【(弹幕数+评论数)/播放数*100】",
          mkRateStatusKey: "interactive_rate_blocking_status",
          mkTypeRateKey: "interactive_rate"
        },
        {
          headerTitle: "视频三连率屏蔽",
          describe: "限制的占比率，默认为2%，小于或等于值限时制的屏蔽该视频，公式【(收藏数+投币数+分享数)/播放数*100】",
          mkRateStatusKey: "triple_rate_blocking_status",
          mkTypeRateKey: "triple_rate"
        },
        {
          headerTitle: "视频投币/点赞比（内容价值）屏蔽",
          describe: "限制的占比率，默认为2%，小于或等于值限时制的屏蔽该视频，投币成本较高，比值越高内容越优质。公式【投币数 / 获赞数】",
          mkRateStatusKey: "coin_likes_ratio_rate_blocking_status",
          mkTypeRateKey: "coin_likes_ratio_rate"
        }
      ],
      limitationFanSumVal: getLimitationFanSumGm(),
      fansNumBlockingStatus: isFansNumBlockingStatusGm()
    };
  },
  watch: {
    limitationFanSumVal(n) {
      GM_setValue("limitation_fan_sum_gm", parseInt(n));
    },
    fansNumBlockingStatus(n) {
      GM_setValue("is_fans_num_blocking_status_gm", n);
    }
  }
};
const __vue_script__$l = script$l;
var __vue_render__$l = function () {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _c(
    "div",
    [
      _c(
        "el-card",
        {
          scopedSlots: _vm._u([
            {
              key: "header",
              fn: function () {
                return [_vm._v("指标屏蔽(改动实时生效)")]
              },
              proxy: true,
            },
          ]),
        },
        [
          _vm._v(" "),
          _vm._l(_vm.metricsFilterList, function (item) {
            return _c("video_metrics_filter_item_view", {
              key: item.headerTitle,
              attrs: {
                describe: item.describe,
                "header-title": item.headerTitle,
                "mk-rate-status-key": item.mkRateStatusKey,
                "mk-type-rate-key": item.mkTypeRateKey,
              },
            })
          }),
          _vm._v(" "),
          _c("card_slider", {
            attrs: { max: 90000, "switch-val": _vm.fansNumBlockingStatus },
            on: {
              "update:switchVal": function ($event) {
                _vm.fansNumBlockingStatus = $event;
              },
              "update:switch-val": function ($event) {
                _vm.fansNumBlockingStatus = $event;
              },
            },
            scopedSlots: _vm._u([
              {
                key: "header",
                fn: function () {
                  return [_vm._v("粉丝数屏蔽")]
                },
                proxy: true,
              },
              {
                key: "describe",
                fn: function () {
                  return [
                    _vm._v(
                      "限制的粉丝数，小于或等于值限时制的屏蔽该视频，限制上限9万"
                    ),
                  ]
                },
                proxy: true,
              },
            ]),
            model: {
              value: _vm.limitationFanSumVal,
              callback: function ($$v) {
                _vm.limitationFanSumVal = $$v;
              },
              expression: "limitationFanSumVal",
            },
          }),
        ],
        2
      ),
    ],
    1
  )
};
var __vue_staticRenderFns__$l = [];
__vue_render__$l._withStripped = true;
  
  const __vue_inject_styles__$l = undefined;
  
  const __vue_scope_id__$l = undefined;
  
  const __vue_module_identifier__$l = undefined;
  
  const __vue_is_functional_template__$l = false;
  
  
  
  
  
  
  
  const __vue_component__$l = normalizeComponent(
    { render: __vue_render__$l, staticRenderFns: __vue_staticRenderFns__$l },
    __vue_inject_styles__$l,
    __vue_script__$l,
    __vue_scope_id__$l,
    __vue_is_functional_template__$l,
    __vue_module_identifier__$l,
    false,
    undefined);var script$k = {
  data() {
    return {
      status: localMKData.isUidRangeMaskingStatus(),
      head: 0,
      tail: 100
    };
  },
  methods: {
    setRangeBut() {
      this.$alert("设置成功");
      GM_setValue("uid_range_masking", [this.head, this.tail]);
    }
  },
  watch: {
    head(newVal, oldVal) {
      if (newVal > this.tail) {
        this.$message("最小值不能大于最大值");
        this.head = oldVal;
      }
    },
    tail(newVal, oldVal) {
      if (newVal < this.head) {
        this.$message("最大值不能小于最小值");
        this.tail = oldVal;
      }
    },
    status(n) {
      GM_setValue("uid_range_masking_status", n);
    }
  },
  created() {
    const arr = localMKData.getUidRangeMasking();
    this.head = arr[0];
    this.tail = arr[1];
  }
};
const __vue_script__$k = script$k;
var __vue_render__$k = function () {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _c(
    "div",
    [
      _c(
        "el-card",
        {
          scopedSlots: _vm._u([
            {
              key: "header",
              fn: function () {
                return [_vm._v("\n      uid范围屏蔽\n    ")]
              },
              proxy: true,
            },
          ]),
        },
        [
          _vm._v(" "),
          _c("div", { staticStyle: { "margin-bottom": "10px" } }, [
            _vm._v(
              "\n      范围内的uid都会被屏蔽掉，改动需重新设置方可生效，且再下次检查时屏蔽(如视频列表加载，评论加载)。比较关系【最小>=uid<=最大】\n    "
            ),
          ]),
          _vm._v(" "),
          _c("el-switch", {
            staticStyle: { "margin-bottom": "10px" },
            attrs: { "active-text": "启用" },
            model: {
              value: _vm.status,
              callback: function ($$v) {
                _vm.status = $$v;
              },
              expression: "status",
            },
          }),
          _vm._v(" "),
          _c("el-input", {
            staticStyle: { width: "30%" },
            scopedSlots: _vm._u([
              {
                key: "prepend",
                fn: function () {
                  return [_vm._v("最小")]
                },
                proxy: true,
              },
            ]),
            model: {
              value: _vm.head,
              callback: function ($$v) {
                _vm.head = _vm._n($$v);
              },
              expression: "head",
            },
          }),
          _vm._v(" "),
          _c("el-input", {
            staticStyle: { width: "30%" },
            scopedSlots: _vm._u([
              {
                key: "prepend",
                fn: function () {
                  return [_vm._v("最大")]
                },
                proxy: true,
              },
            ]),
            model: {
              value: _vm.tail,
              callback: function ($$v) {
                _vm.tail = _vm._n($$v);
              },
              expression: "tail",
            },
          }),
          _vm._v(" "),
          _c("el-button", { on: { click: _vm.setRangeBut } }, [_vm._v("设置")]),
        ],
        1
      ),
    ],
    1
  )
};
var __vue_staticRenderFns__$k = [];
__vue_render__$k._withStripped = true;
  
  const __vue_inject_styles__$k = undefined;
  
  const __vue_scope_id__$k = undefined;
  
  const __vue_module_identifier__$k = undefined;
  
  const __vue_is_functional_template__$k = false;
  
  
  
  
  
  
  
  const __vue_component__$k = normalizeComponent(
    { render: __vue_render__$k, staticRenderFns: __vue_staticRenderFns__$k },
    __vue_inject_styles__$k,
    __vue_script__$k,
    __vue_scope_id__$k,
    __vue_is_functional_template__$k,
    __vue_module_identifier__$k,
    false,
    undefined);var script$j = {
  components: {
    uidRangeMaskingView: __vue_component__$k
  },
  data() {
    return {
      isLimitationVideoSubmitStatusVal: isLimitationVideoSubmitStatusGm(),
      LimitationContributeVal: getLimitationVideoSubmitSumGm(),
      blockFollowed: localMKData.isBlockFollowed(),
      is_up_owner_exclusive: localMKData.isUpOwnerExclusive(),
      genderRadioVal: localMKData.isGenderRadioVal(),
      vipTypeRadioVal: localMKData.isVipTypeRadioVal(),
      is_senior_member_val: localMKData.isSeniorMember(),
      copyrightRadioVal: localMKData.isCopyrightRadio(),
      is_vertical_val: localMKData.isBlockVerticalVideo(),
      is_check_team_member: localMKData.isCheckTeamMember(),
      isSeniorMemberOnlyVal: isSeniorMemberOnly(),
      isVideosInFeaturedCommentsBlockedVal: isVideosInFeaturedCommentsBlockedGm(),
      isFollowers7DaysOnlyVideosBlockedVal: isFollowers7DaysOnlyVideosBlockedGm(),
      isCommentDisabledVideosBlockedVal: isCommentDisabledVideosBlockedGm()
    };
  },
  methods: {},
  watch: {
    blockFollowed(n) {
      GM_setValue("blockFollowed", n);
    },
    is_up_owner_exclusive(n) {
      GM_setValue("is_up_owner_exclusive", n);
    },
    genderRadioVal(n) {
      GM_setValue("genderRadioVal", n);
    },
    vipTypeRadioVal(n) {
      GM_setValue("vipTypeRadioVal", n);
    },
    is_senior_member_val(n) {
      GM_setValue("is_senior_member", n);
    },
    copyrightRadioVal(n) {
      GM_setValue("copyrightRadioVal", n);
    },
    is_vertical_val(n) {
      GM_setValue("blockVerticalVideo", n);
    },
    is_check_team_member(n) {
      GM_setValue("checkTeamMember", n);
    },
    isSeniorMemberOnlyVal(n) {
      GM_setValue("is_senior_member_only", n);
    },
    LimitationContributeVal(n) {
      GM_setValue("limitation_video_submit_sum_gm", n);
    },
    isLimitationVideoSubmitStatusVal(n) {
      GM_setValue("is_limitation_video_submit_status_gm", n);
    },
    isVideosInFeaturedCommentsBlockedVal(n) {
      GM_setValue("is_videos_in_featured_comments_blocked_gm", n);
    },
    isFollowers7DaysOnlyVideosBlockedVal(n) {
      GM_setValue("is_followers_7_days_only_videos_blocked_gm", n);
    },
    isCommentDisabledVideosBlockedVal(n) {
      GM_setValue("is_comment_disabled_videos_blocked_gm", n);
    }
  }
};
const __vue_script__$j = script$j;
var __vue_render__$j = function () {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _c(
    "div",
    [
      _c("uidRangeMaskingView"),
      _vm._v(" "),
      _c(
        "el-card",
        {
          scopedSlots: _vm._u([
            {
              key: "header",
              fn: function () {
                return [_vm._v("投稿数屏蔽")]
              },
              proxy: true,
            },
          ]),
        },
        [
          _vm._v(" "),
          _c(
            "span",
            { staticStyle: { color: "#9499A0", "font-size": "13px" } },
            [_vm._v("用户投稿数低于该值时屏蔽")]
          ),
          _vm._v(" "),
          _c(
            "div",
            {
              staticStyle: {
                display: "flex",
                "align-items": "center",
                gap: "12px",
                "margin-top": "8px",
              },
            },
            [
              _c("el-switch", {
                attrs: { "active-text": "启用" },
                model: {
                  value: _vm.isLimitationVideoSubmitStatusVal,
                  callback: function ($$v) {
                    _vm.isLimitationVideoSubmitStatusVal = $$v;
                  },
                  expression: "isLimitationVideoSubmitStatusVal",
                },
              }),
              _vm._v(" "),
              _c("el-input-number", {
                attrs: { min: 0, size: "small" },
                model: {
                  value: _vm.LimitationContributeVal,
                  callback: function ($$v) {
                    _vm.LimitationContributeVal = $$v;
                  },
                  expression: "LimitationContributeVal",
                },
              }),
            ],
            1
          ),
        ]
      ),
      _vm._v(" "),
      _c(
        "el-card",
        {
          scopedSlots: _vm._u([
            {
              key: "header",
              fn: function () {
                return [_vm._v("视频类型")]
              },
              proxy: true,
            },
          ]),
        },
        [
          _vm._v(" "),
          _c(
            "el-tooltip",
            { attrs: { content: "选中的类型会被屏蔽" } },
            [
              _c(
                "el-radio-group",
                {
                  model: {
                    value: _vm.copyrightRadioVal,
                    callback: function ($$v) {
                      _vm.copyrightRadioVal = $$v;
                    },
                    expression: "copyrightRadioVal",
                  },
                },
                [
                  _c("el-radio-button", { attrs: { label: "原创" } }),
                  _vm._v(" "),
                  _c("el-radio-button", { attrs: { label: "转载" } }),
                  _vm._v(" "),
                  _c("el-radio-button", { attrs: { label: "不处理" } }),
                ],
                1
              ),
            ],
            1
          ),
          _vm._v(" "),
          _c("el-divider"),
          _vm._v(" "),
          _c(
            "div",
            {
              staticStyle: {
                display: "flex",
                "flex-wrap": "wrap",
                gap: "8px 20px",
              },
            },
            [
              _c("el-switch", {
                attrs: { "active-text": "屏蔽竖屏视频" },
                model: {
                  value: _vm.is_vertical_val,
                  callback: function ($$v) {
                    _vm.is_vertical_val = $$v;
                  },
                  expression: "is_vertical_val",
                },
              }),
              _vm._v(" "),
              _c("el-switch", {
                attrs: { "active-text": "屏蔽已关注" },
                model: {
                  value: _vm.blockFollowed,
                  callback: function ($$v) {
                    _vm.blockFollowed = $$v;
                  },
                  expression: "blockFollowed",
                },
              }),
              _vm._v(" "),
              _c("el-switch", {
                attrs: { "active-text": "屏蔽充电专属" },
                model: {
                  value: _vm.is_up_owner_exclusive,
                  callback: function ($$v) {
                    _vm.is_up_owner_exclusive = $$v;
                  },
                  expression: "is_up_owner_exclusive",
                },
              }),
              _vm._v(" "),
              _c("el-switch", {
                attrs: { "active-text": "屏蔽硬核会员" },
                model: {
                  value: _vm.is_senior_member_val,
                  callback: function ($$v) {
                    _vm.is_senior_member_val = $$v;
                  },
                  expression: "is_senior_member_val",
                },
              }),
            ],
            1
          ),
          _vm._v(" "),
          _c("el-divider"),
          _vm._v(" "),
          _c(
            "el-tooltip",
            {
              attrs: {
                content: "以下三项任意启用都会增加对B站的请求次数，请酌情使用",
              },
            },
            [
              _c(
                "span",
                {
                  staticStyle: {
                    color: "#e6a23c",
                    "font-size": "12px",
                    cursor: "help",
                  },
                },
                [
                  _c("i", { staticClass: "el-icon-warning" }),
                  _vm._v(" 以下选项会增加请求频率\n      "),
                ]
              ),
            ]
          ),
          _vm._v(" "),
          _c(
            "div",
            {
              staticStyle: {
                display: "flex",
                "flex-wrap": "wrap",
                gap: "8px 20px",
                "margin-top": "8px",
              },
            },
            [
              _c(
                "el-tooltip",
                {
                  attrs: { content: "视频评论区评论被UP主精选后对所有人可见" },
                },
                [
                  _c("el-switch", {
                    attrs: { "active-text": "屏蔽精选评论区视频" },
                    model: {
                      value: _vm.isVideosInFeaturedCommentsBlockedVal,
                      callback: function ($$v) {
                        _vm.isVideosInFeaturedCommentsBlockedVal = $$v;
                      },
                      expression: "isVideosInFeaturedCommentsBlockedVal",
                    },
                  }),
                ],
                1
              ),
              _vm._v(" "),
              _c("el-switch", {
                attrs: { "active-text": "屏蔽关注7天以上可评论视频" },
                model: {
                  value: _vm.isFollowers7DaysOnlyVideosBlockedVal,
                  callback: function ($$v) {
                    _vm.isFollowers7DaysOnlyVideosBlockedVal = $$v;
                  },
                  expression: "isFollowers7DaysOnlyVideosBlockedVal",
                },
              }),
              _vm._v(" "),
              _c(
                "el-tooltip",
                { attrs: { content: "评论区输入框为禁止输入状态" } },
                [
                  _c("el-switch", {
                    attrs: { "active-text": "屏蔽禁止评论视频" },
                    model: {
                      value: _vm.isCommentDisabledVideosBlockedVal,
                      callback: function ($$v) {
                        _vm.isCommentDisabledVideosBlockedVal = $$v;
                      },
                      expression: "isCommentDisabledVideosBlockedVal",
                    },
                  }),
                ],
                1
              ),
            ],
            1
          ),
          _vm._v(" "),
          _c("el-divider"),
          _vm._v(" "),
          _c(
            "div",
            {
              staticStyle: {
                display: "flex",
                gap: "16px",
                "flex-wrap": "wrap",
              },
            },
            [
              _c(
                "div",
                { staticStyle: { "min-width": "200px" } },
                [
                  _c(
                    "span",
                    {
                      staticStyle: {
                        "font-weight": "500",
                        "font-size": "13px",
                      },
                    },
                    [_vm._v("会员类型屏蔽")]
                  ),
                  _vm._v(" "),
                  _c(
                    "el-radio-group",
                    {
                      staticStyle: { display: "block", "margin-top": "6px" },
                      model: {
                        value: _vm.vipTypeRadioVal,
                        callback: function ($$v) {
                          _vm.vipTypeRadioVal = $$v;
                        },
                        expression: "vipTypeRadioVal",
                      },
                    },
                    [
                      _c("el-radio-button", { attrs: { label: "无" } }),
                      _vm._v(" "),
                      _c("el-radio-button", { attrs: { label: "月大会员" } }),
                      _vm._v(" "),
                      _c("el-radio-button", {
                        attrs: { label: "年度及以上大会员" },
                      }),
                      _vm._v(" "),
                      _c("el-radio-button", { attrs: { label: "不处理" } }),
                    ],
                    1
                  ),
                ],
                1
              ),
              _vm._v(" "),
              _c(
                "div",
                { staticStyle: { "min-width": "180px" } },
                [
                  _c(
                    "span",
                    {
                      staticStyle: {
                        "font-weight": "500",
                        "font-size": "13px",
                      },
                    },
                    [_vm._v("性别屏蔽")]
                  ),
                  _vm._v(" "),
                  _c(
                    "el-radio-group",
                    {
                      staticStyle: { display: "block", "margin-top": "6px" },
                      model: {
                        value: _vm.genderRadioVal,
                        callback: function ($$v) {
                          _vm.genderRadioVal = $$v;
                        },
                        expression: "genderRadioVal",
                      },
                    },
                    [
                      _c("el-radio-button", { attrs: { label: "男性" } }),
                      _vm._v(" "),
                      _c("el-radio-button", { attrs: { label: "女性" } }),
                      _vm._v(" "),
                      _c("el-radio-button", { attrs: { label: "保密" } }),
                      _vm._v(" "),
                      _c("el-radio-button", { attrs: { label: "不处理" } }),
                    ],
                    1
                  ),
                ],
                1
              ),
              _vm._v(" "),
              _c(
                "div",
                [
                  _c(
                    "span",
                    {
                      staticStyle: {
                        "font-weight": "500",
                        "font-size": "13px",
                      },
                    },
                    [_vm._v("创作团队")]
                  ),
                  _vm._v(" "),
                  _c(
                    "el-tooltip",
                    { attrs: { content: "作者未匹配时检查其他成员" } },
                    [
                      _c("el-switch", {
                        staticStyle: { display: "block", "margin-top": "6px" },
                        attrs: { "active-text": "检查团队成员" },
                        model: {
                          value: _vm.is_check_team_member,
                          callback: function ($$v) {
                            _vm.is_check_team_member = $$v;
                          },
                          expression: "is_check_team_member",
                        },
                      }),
                    ],
                    1
                  ),
                ],
                1
              ),
            ]
          ),
        ],
        1
      ),
      _vm._v(" "),
      _c(
        "el-card",
        {
          scopedSlots: _vm._u([
            {
              key: "header",
              fn: function () {
                return [_vm._v("评论")]
              },
              proxy: true,
            },
          ]),
        },
        [
          _vm._v(" "),
          _c("el-switch", {
            attrs: { "active-text": "仅看硬核会员" },
            model: {
              value: _vm.isSeniorMemberOnlyVal,
              callback: function ($$v) {
                _vm.isSeniorMemberOnlyVal = $$v;
              },
              expression: "isSeniorMemberOnlyVal",
            },
          }),
        ],
        1
      ),
    ],
    1
  )
};
var __vue_staticRenderFns__$j = [];
__vue_render__$j._withStripped = true;
  
  const __vue_inject_styles__$j = undefined;
  
  const __vue_scope_id__$j = undefined;
  
  const __vue_module_identifier__$j = undefined;
  
  const __vue_is_functional_template__$j = false;
  
  
  
  
  
  
  
  const __vue_component__$j = normalizeComponent(
    { render: __vue_render__$j, staticRenderFns: __vue_staticRenderFns__$j },
    __vue_inject_styles__$j,
    __vue_script__$j,
    __vue_scope_id__$j,
    __vue_is_functional_template__$j,
    __vue_module_identifier__$j,
    false,
    undefined);var script$i = {
  data() {
    return {
      dialogVisible: false,
      inputVisible: false,
      inputValue: "",
      min: 2,
      typeMap: {},
      showTags: []
    };
  },
  methods: {
    updateShowTags() {
      this.showTags = GM_getValue(this.typeMap.type, []);
    },
    handleTagClose(tag, index) {
      if (tag === "") return;
      this.$confirm(`确定要删除 ${tag} 吗？`, "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }).then(() => {
        this.showTags.splice(index, 1);
        GM_setValue(this.typeMap.type, this.showTags);
        this.$message.success(`已移除 ${tag}`);
        eventEmitter.send("刷新规则信息", false);
      });
    },
    showInput() {
      this.inputVisible = true;
      this.$nextTick((_) => {
        this.$refs.saveTagInput.$refs.input.focus();
      });
    },
    handleInputConfirm() {
      let inputValue = this.inputValue;
      this.inputVisible = false;
      if (inputValue === "") return;
      this.submitBut(inputValue);
      this.inputValue = "";
    },
    submitBut(inputValue) {
      const split = inputValue.split(",");
      if (split.length < this.min) {
        this.$message.error("最少添加" + this.min + "项");
        return;
      }
      const preciseVideoTagArr = ruleKeyListData.getPreciseVideoTagArr();
      const videoTagArr = ruleKeyListData.getVideoTagArr();
      for (let showTag of split) {
        showTag = showTag.trim();
        if (showTag === "") {
          this.$message.error("不能添加空项");
          return;
        }
        if (preciseVideoTagArr.includes(showTag)) {
          this.$message.error("不能添加视频tag(精确匹配)已有的项，请先移除对应的项！");
          return;
        }
        if (videoTagArr.includes(showTag)) {
          this.$message.error("不能添加视频tag(模糊匹配)已有的项，请先移除对应的项！");
          return;
        }
        if (showTag.length > 15) {
          this.$message.error("项不能超过15个字符");
          return;
        }
      }
      const arr = GM_getValue(this.typeMap.type, []);
      for (let mk_arr of arr) {
        if (arrUtil.arraysLooseEqual(mk_arr, split)) {
          this.$message.error("不能重复添加已有的组合！");
          return;
        }
        if (arrUtil.arrayContains(mk_arr, split)) {
          this.$message.error("该组合已添加过或包括该组合");
          return;
        }
      }
      arr.push(split);
      GM_setValue(this.typeMap.type, arr);
      console.log(this.typeMap, split, arr);
      this.$message.success(`${this.typeMap.name}添加成功`);
      this.updateShowTags();
      eventEmitter.send("刷新规则信息", false);
    }
  },
  created() {
    eventEmitter.on("打开多重规则编辑对话框", (typeMap) => {
      this.typeMap = typeMap;
      this.dialogVisible = true;
      this.updateShowTags();
    });
  },
  filters: {
    
    filterTag(tag) {
      return tag.join("||");
    }
  }
};
const __vue_script__$i = script$i;
var __vue_render__$i = function () {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _c(
    "div",
    [
      _c(
        "el-dialog",
        {
          attrs: {
            "close-on-click-modal": false,
            "close-on-press-escape": false,
            modal: false,
            visible: _vm.dialogVisible,
            title: "多重规则",
          },
          on: {
            "update:visible": function ($event) {
              _vm.dialogVisible = $event;
            },
          },
        },
        [
          _c("el-tag", [_vm._v(_vm._s(_vm.typeMap.name))]),
          _vm._v(" "),
          _c(
            "el-card",
            {
              scopedSlots: _vm._u([
                {
                  key: "header",
                  fn: function () {
                    return [_vm._v("说明")]
                  },
                  proxy: true,
                },
              ]),
            },
            [
              _vm._v(" "),
              _c("div", [_vm._v("1.组合类型每条项至少大于1")]),
              _vm._v(" "),
              _c("div", [_vm._v("2.不能添加空项")]),
              _vm._v(" "),
              _c("div", [_vm._v("3.每组中的项不能超过15个字符")]),
              _vm._v(" "),
              _c("div", [_vm._v("4.不能重复添加已有的组合")]),
              _vm._v(" "),
              _c("div", [_vm._v("5.每组不能添加过包括已有的组合")]),
              _vm._v(" "),
              _c("div", [
                _vm._v(
                  "6.不能添加视频tag(精确匹配)已有的项，如需要，请先移除对应的项！包括视频tag(模糊匹配)"
                ),
              ]),
            ]
          ),
          _vm._v(" "),
          _c(
            "el-card",
            [
              _vm.inputVisible
                ? _c("el-input", {
                    ref: "saveTagInput",
                    staticClass: "input-new-tag",
                    attrs: {
                      placeholder: "多个项时请用英文符号分割",
                      size: "small",
                    },
                    on: { blur: _vm.handleInputConfirm },
                    nativeOn: {
                      keyup: function ($event) {
                        if (
                          !$event.type.indexOf("key") &&
                          _vm._k(
                            $event.keyCode,
                            "enter",
                            13,
                            $event.key,
                            "Enter"
                          )
                        ) {
                          return null
                        }
                        return _vm.handleInputConfirm.apply(null, arguments)
                      },
                    },
                    model: {
                      value: _vm.inputValue,
                      callback: function ($$v) {
                        _vm.inputValue = $$v;
                      },
                      expression: "inputValue",
                    },
                  })
                : _c(
                    "el-button",
                    { attrs: { size: "small" }, on: { click: _vm.showInput } },
                    [_vm._v("+ New Tag")]
                  ),
              _vm._v(" "),
              _vm._l(_vm.showTags, function (item, index) {
                return _c(
                  "el-tag",
                  {
                    key: index,
                    attrs: { closable: "" },
                    on: {
                      close: function ($event) {
                        return _vm.handleTagClose(item, index)
                      },
                    },
                  },
                  [
                    _vm._v(
                      "\n        " +
                        _vm._s(_vm._f("filterTag")(item)) +
                        "\n      "
                    ),
                  ]
                )
              }),
            ],
            2
          ),
        ],
        1
      ),
    ],
    1
  )
};
var __vue_staticRenderFns__$i = [];
__vue_render__$i._withStripped = true;
  
  const __vue_inject_styles__$i = undefined;
  
  const __vue_scope_id__$i = undefined;
  
  const __vue_module_identifier__$i = undefined;
  
  const __vue_is_functional_template__$i = false;
  
  
  
  
  
  
  
  const __vue_component__$i = normalizeComponent(
    { render: __vue_render__$i, staticRenderFns: __vue_staticRenderFns__$i },
    __vue_inject_styles__$i,
    __vue_script__$i,
    __vue_scope_id__$i,
    __vue_is_functional_template__$i,
    __vue_module_identifier__$i,
    false,
    undefined);var script$h = {
  data() {
    return {
      show: false,
      ruleType: "",
      ruleName: "",
      oldVal: "",
      newVal: ""
    };
  },
  methods: {
    okBut() {
      let tempOldVal = this.oldVal.trim();
      let tempNewVal = this.newVal.trim();
      if (tempOldVal.length === 0 || tempNewVal.length === 0) {
        this.$alert("请输入要修改的值或新值");
        return;
      }
      if (tempNewVal === tempOldVal) {
        this.$alert("新值不能和旧值相同");
        return;
      }
      const tempRuleType = this.ruleType;
      if (ruleUtil.isRuleIntType(tempRuleType)) {
        tempOldVal = parseInt(tempOldVal);
        tempNewVal = parseInt(tempNewVal);
        if (isNaN(tempOldVal) || isNaN(tempNewVal)) {
          this.$alert("请输入整数数字");
          return;
        }
      }
      if (!ruleUtil.findRuleItemValue(tempRuleType, tempOldVal)) {
        this.$alert("要修改的值不存在");
        return;
      }
      if (ruleUtil.findRuleItemValue(tempRuleType, tempNewVal)) {
        this.$alert("新值已存在");
        return;
      }
      const ruleArr = GM_getValue(tempRuleType, []);
      const indexOf = ruleArr.indexOf(tempOldVal);
      ruleArr[indexOf] = tempNewVal;
      GM_setValue(tempRuleType, ruleArr);
      this.$alert(`已将旧值【${tempOldVal}】修改成【${tempNewVal}】`);
      this.show = false;
    }
  },
  watch: {
    show(newVal) {
      if (newVal === false) this.oldVal = this.newVal = "";
    }
  },
  created() {
    eventEmitter.on("修改规则对话框", ({ type, name }) => {
      this.show = true;
      this.ruleType = type;
      this.ruleName = name;
    });
  }
};
const __vue_script__$h = script$h;
var __vue_render__$h = function () {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _c(
    "div",
    [
      _c(
        "el-dialog",
        {
          attrs: {
            "close-on-click-modal": false,
            modal: false,
            visible: _vm.show,
            title: "修改单项规则值",
            width: "30%",
          },
          on: {
            "update:visible": function ($event) {
              _vm.show = $event;
            },
          },
          scopedSlots: _vm._u([
            {
              key: "footer",
              fn: function () {
                return [
                  _c(
                    "el-button",
                    {
                      on: {
                        click: function ($event) {
                          _vm.show = false;
                        },
                      },
                    },
                    [_vm._v("取消")]
                  ),
                  _vm._v(" "),
                  _c("el-button", { on: { click: _vm.okBut } }, [
                    _vm._v("确定"),
                  ]),
                ]
              },
              proxy: true,
            },
          ]),
        },
        [
          _vm._v(
            "\n    " +
              _vm._s(_vm.ruleName) +
              "-" +
              _vm._s(_vm.ruleType) +
              "\n    "
          ),
          _c(
            "el-form",
            [
              _c(
                "el-form-item",
                { attrs: { label: "要修改的值" } },
                [
                  _c("el-input", {
                    attrs: { clearable: "", type: "text" },
                    model: {
                      value: _vm.oldVal,
                      callback: function ($$v) {
                        _vm.oldVal = $$v;
                      },
                      expression: "oldVal",
                    },
                  }),
                ],
                1
              ),
              _vm._v(" "),
              _c(
                "el-form-item",
                { attrs: { label: "修改后的值" } },
                [
                  _c("el-input", {
                    attrs: { clearable: "" },
                    model: {
                      value: _vm.newVal,
                      callback: function ($$v) {
                        _vm.newVal = $$v;
                      },
                      expression: "newVal",
                    },
                  }),
                ],
                1
              ),
            ],
            1
          ),
        ],
        1
      ),
    ],
    1
  )
};
var __vue_staticRenderFns__$h = [];
__vue_render__$h._withStripped = true;
  
  const __vue_inject_styles__$h = undefined;
  
  const __vue_scope_id__$h = undefined;
  
  const __vue_module_identifier__$h = undefined;
  
  const __vue_is_functional_template__$h = false;
  
  
  
  
  
  
  
  const __vue_component__$h = normalizeComponent(
    { render: __vue_render__$h, staticRenderFns: __vue_staticRenderFns__$h },
    __vue_inject_styles__$h,
    __vue_script__$h,
    __vue_scope_id__$h,
    __vue_is_functional_template__$h,
    __vue_module_identifier__$h,
    false,
    undefined);var script$g = {
  props: {
    ruleInfoArr: {
      type: Array
    }
  },
  methods: {
    refreshInfo(isTip = true) {
      for (let x of this.ruleInfoArr) {
        x.len = GM_getValue(x.type, []).length;
      }
      if (!isTip) return;
      this.$notify({ title: "tip", message: "刷新规则信息成功", type: "success" });
    },
    refreshInfoBut() {
      this.refreshInfo();
    },
    lookRuleBut(item) {
      if (item.len === 0) {
        this.$message.warning("当前规则信息为空");
        return;
      }
      const data = GM_getValue(item.type, []);
      eventEmitter.send("展示内容对话框", JSON.stringify(data));
    }
  },
  created() {
    this.refreshInfo(false);
    eventEmitter.on("刷新规则信息", (isTip = true) => {
      this.refreshInfo(isTip);
    });
  }
};
const __vue_script__$g = script$g;
var __vue_render__$g = function () {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _c("div", [
    _c(
      "div",
      {
        staticClass: "el-horizontal-outside",
        staticStyle: { "margin-bottom": "8px" },
      },
      [
        _c(
          "span",
          {
            staticStyle: {
              "font-weight": "500",
              "font-size": "13px",
              color: "#9499A0",
            },
          },
          [_vm._v("共 " + _vm._s(_vm.ruleInfoArr.length) + " 项")]
        ),
        _vm._v(" "),
        _c(
          "el-button",
          { attrs: { size: "mini" }, on: { click: _vm.refreshInfoBut } },
          [_vm._v("刷新")]
        ),
      ],
      1
    ),
    _vm._v(" "),
    _c(
      "div",
      {
        staticClass: "rule-info-scroll",
        staticStyle: { display: "flex", "flex-wrap": "wrap", gap: "4px" },
      },
      _vm._l(_vm.ruleInfoArr, function (item) {
        return _c(
          "el-button",
          {
            key: item.name,
            attrs: { size: "small" },
            on: {
              click: function ($event) {
                return _vm.lookRuleBut(item)
              },
            },
          },
          [
            _vm._v("\n      " + _vm._s(item.name) + "\n      "),
            _c(
              "el-tag",
              {
                attrs: {
                  effect: item.len > 0 ? "dark" : "plain",
                  size: "mini",
                },
              },
              [_vm._v("\n        " + _vm._s(item.len) + "\n      ")]
            ),
          ],
          1
        )
      }),
      1
    ),
  ])
};
var __vue_staticRenderFns__$g = [];
__vue_render__$g._withStripped = true;
  
  const __vue_inject_styles__$g = function (inject) {
    if (!inject) return
    inject("data-v-20661f03_0", { source: "\n.rule-info-scroll[data-v-20661f03] {\n  max-height: 280px;\n  overflow-y: auto;\n  align-content: flex-start;\n}\n.rule-info-scroll[data-v-20661f03]::-webkit-scrollbar {\n  width: 4px;\n}\n.rule-info-scroll[data-v-20661f03]::-webkit-scrollbar-thumb {\n  background: rgba(0, 0, 0, 0.15);\n  border-radius: 3px;\n}\n", map: {"version":3,"sources":["E:\\something\\AI Agent\\ban bilibili\\BiliBlockFusion\\src\\web\\layout\\views\\ruleInformationView.vue"],"names":[],"mappings":";AA2DA;EACA,iBAAA;EACA,gBAAA;EACA,yBAAA;AACA;AACA;EACA,UAAA;AACA;AACA;EACA,+BAAA;EACA,kBAAA;AACA","file":"ruleInformationView.vue","sourcesContent":["<script>\nimport {eventEmitter} from \"../../model/EventEmitter.js\";\n\n\nexport default {\n  props: {\n    ruleInfoArr: {\n      type: Array\n    }\n  },\n  methods: {\n    refreshInfo(isTip = true) {\n      for (let x of this.ruleInfoArr) {\n        x.len = GM_getValue(x.type, []).length;\n      }\n      if (!isTip) return;\n      this.$notify({title: 'tip', message: '刷新规则信息成功', type: 'success'})\n    },\n    refreshInfoBut() {\n      this.refreshInfo()\n    },\n    lookRuleBut(item) {\n      if (item.len === 0) {\n        this.$message.warning('当前规则信息为空')\n        return;\n      }\n      const data = GM_getValue(item.type, []);\n      eventEmitter.send('展示内容对话框', JSON.stringify(data))\n    }\n  },\n  created() {\n    this.refreshInfo(false);\n    eventEmitter.on('刷新规则信息', (isTip = true) => {\n      this.refreshInfo(isTip);\n    })\n  }\n};\n</script>\n\n<template>\n  <div>\n    <div class=\"el-horizontal-outside\" style=\"margin-bottom:8px;\">\n      <span style=\"font-weight:500;font-size:13px;color:#9499A0;\">共 {{ ruleInfoArr.length }} 项</span>\n      <el-button size=\"mini\" @click=\"refreshInfoBut\">刷新</el-button>\n    </div>\n    <div class=\"rule-info-scroll\" style=\"display: flex;flex-wrap: wrap;gap:4px;\">\n      <el-button v-for=\"item in ruleInfoArr\" :key=\"item.name\" size=\"small\" @click=\"lookRuleBut(item)\">\n        {{ item.name }}\n        <el-tag :effect=\"item.len>0?'dark':'plain'\" size=\"mini\">\n          {{ item.len }}\n        </el-tag>\n      </el-button>\n    </div>\n  </div>\n</template>\n\n<style scoped>\n.rule-info-scroll {\n  max-height: 280px;\n  overflow-y: auto;\n  align-content: flex-start;\n}\n.rule-info-scroll::-webkit-scrollbar {\n  width: 4px;\n}\n.rule-info-scroll::-webkit-scrollbar-thumb {\n  background: rgba(0, 0, 0, 0.15);\n  border-radius: 3px;\n}\n</style>\n"]}, media: undefined });
  };
  
  const __vue_scope_id__$g = "data-v-20661f03";
  
  const __vue_module_identifier__$g = undefined;
  
  const __vue_is_functional_template__$g = false;
  
  
  
  
  
  const __vue_component__$g = normalizeComponent(
    { render: __vue_render__$g, staticRenderFns: __vue_staticRenderFns__$g },
    __vue_inject_styles__$g,
    __vue_script__$g,
    __vue_scope_id__$g,
    __vue_is_functional_template__$g,
    __vue_module_identifier__$g,
    false,
    createInjector);var script$f = {
  components: { ruleInformationView: __vue_component__$g, ruleSetValueDialog: __vue_component__$h, multipleRuleEditDialog: __vue_component__$i },
  data() {
    return {
      cascaderVal: ["精确匹配", "precise_uid"],
      cascaderOptions: ruleKeyListData.getSelectOptions(),
      ruleInfoArr: [],
      currentItems: [],
      separator: ",",
      inputVal: ""
    };
  },
  computed: {
    selectedType() {
      return this.cascaderVal[1];
    },
    selectedModel() {
      return this.cascaderVal[0];
    }
  },
  methods: {
    loadCurrentItems() {
      this.currentItems = GM_getValue(this.selectedType, []);
    },
    addBut() {
      if (this.selectedModel === "组合匹配") {
        const typeMap = this.ruleInfoArr.find((item) => item.type === this.selectedType);
        eventEmitter.send("打开多重规则编辑对话框", typeMap);
        return;
      }
      const fragments = [];
      for (let s of this.inputVal.split(this.separator)) {
        s = s.trim();
        if (s === "" || fragments.includes(s)) continue;
        fragments.push(s);
      }
      if (fragments.length === 0) {
        this.$message.warning("未有分割项，请输入");
        return;
      }
      const { successList, failList } = ruleUtil.batchAddRule(fragments, this.selectedType);
      let msg = `成功添加 ${successList.length} 项`;
      if (failList.length > 0) {
        msg += `，失败 ${failList.length} 项: ${failList.join(", ")}`;
      }
      this.$message.success(msg);
      this.inputVal = "";
      this.loadCurrentItems();
      eventEmitter.send("刷新规则信息");
    },
    removeItem(val) {
      const { status, res } = ruleUtil.delRule(this.selectedType, val);
      if (status) {
        this.$message.success(res);
        this.loadCurrentItems();
        eventEmitter.send("刷新规则信息");
      } else {
        this.$message.warning(res);
      }
    },
    clearType() {
      const typeMap = this.ruleInfoArr.find((item) => item.type === this.selectedType);
      this.$confirm(`确定清空【${typeMap ? typeMap.name : this.selectedType}】的规则内容吗？`).then(() => {
        ruleKeyListData.clearKeyItem(this.selectedType);
        this.loadCurrentItems();
        this.$message.success(`已清空`);
        eventEmitter.send("刷新规则信息", false);
      });
    },
    delAll() {
      this.$confirm("确定要删除所有规则吗？此操作不可恢复。").then(() => {
        for (let x of this.ruleInfoArr) {
          GM_deleteValue(x.type);
        }
        this.loadCurrentItems();
        this.$message.success("已删除全部规则");
        eventEmitter.send("刷新规则信息", false);
      });
    }
  },
  watch: {
    selectedType() {
      this.loadCurrentItems();
    }
  },
  created() {
    for (let el of ruleKeyListData.getRuleKeyListData()) {
      this.ruleInfoArr.push({
        type: el.key,
        name: el.name
      });
    }
    this.loadCurrentItems();
  }
};
const __vue_script__$f = script$f;
var __vue_render__$f = function () {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _c(
    "div",
    { staticClass: "basic-rules-container" },
    [
      _c(
        "el-row",
        { attrs: { gutter: 12 } },
        [
          _c(
            "el-col",
            { attrs: { span: 14 } },
            [
              _c(
                "el-card",
                {
                  attrs: { shadow: "never" },
                  scopedSlots: _vm._u([
                    {
                      key: "header",
                      fn: function () {
                        return [_c("span", [_vm._v("编辑规则")])]
                      },
                      proxy: true,
                    },
                  ]),
                },
                [
                  _vm._v(" "),
                  _c("el-cascader", {
                    staticStyle: { width: "100%" },
                    attrs: {
                      options: _vm.cascaderOptions,
                      props: { expandTrigger: "hover" },
                      filterable: "",
                      "show-all-levels": "",
                    },
                    model: {
                      value: _vm.cascaderVal,
                      callback: function ($$v) {
                        _vm.cascaderVal = $$v;
                      },
                      expression: "cascaderVal",
                    },
                  }),
                  _vm._v(" "),
                  _c("el-divider"),
                  _vm._v(" "),
                  _c(
                    "div",
                    {
                      staticStyle: {
                        display: "flex",
                        gap: "6px",
                        "align-items": "center",
                        "margin-bottom": "10px",
                      },
                    },
                    [
                      _c("el-input", {
                        staticStyle: { width: "55px" },
                        attrs: { size: "small", placeholder: "分隔符" },
                        model: {
                          value: _vm.separator,
                          callback: function ($$v) {
                            _vm.separator = $$v;
                          },
                          expression: "separator",
                        },
                      }),
                      _vm._v(" "),
                      _c("el-input", {
                        attrs: {
                          size: "small",
                          type: "textarea",
                          rows: "2",
                          placeholder: "多项用分隔符隔开",
                        },
                        model: {
                          value: _vm.inputVal,
                          callback: function ($$v) {
                            _vm.inputVal = $$v;
                          },
                          expression: "inputVal",
                        },
                      }),
                    ],
                    1
                  ),
                  _vm._v(" "),
                  _c(
                    "div",
                    {
                      staticStyle: {
                        display: "flex",
                        gap: "6px",
                        "margin-bottom": "10px",
                      },
                    },
                    [
                      _c(
                        "el-button",
                        {
                          attrs: { size: "small", type: "primary" },
                          on: { click: _vm.addBut },
                        },
                        [_vm._v("添加")]
                      ),
                      _vm._v(" "),
                      _c(
                        "el-button",
                        {
                          attrs: { size: "small", type: "danger" },
                          on: { click: _vm.clearType },
                        },
                        [_vm._v("清空此规则")]
                      ),
                      _vm._v(" "),
                      _c(
                        "el-button",
                        {
                          attrs: { size: "small", type: "danger" },
                          on: { click: _vm.delAll },
                        },
                        [_vm._v("删除全部")]
                      ),
                    ],
                    1
                  ),
                  _vm._v(" "),
                  _vm.currentItems.length > 0
                    ? _c("div", { staticStyle: { "margin-top": "8px" } }, [
                        _c(
                          "div",
                          {
                            staticStyle: {
                              "font-size": "12px",
                              color: "#9499A0",
                              "margin-bottom": "4px",
                            },
                          },
                          [
                            _vm._v(
                              "\n            共 " +
                                _vm._s(_vm.currentItems.length) +
                                " 项\n          "
                            ),
                          ]
                        ),
                        _vm._v(" "),
                        _c(
                          "div",
                          { staticClass: "edit-rule-tags-scroll" },
                          _vm._l(_vm.currentItems, function (v) {
                            return _c(
                              "el-tag",
                              {
                                key: v,
                                attrs: { closable: "", size: "small" },
                                on: {
                                  close: function ($event) {
                                    return _vm.removeItem(v)
                                  },
                                },
                              },
                              [
                                _vm._v(
                                  "\n              " +
                                    _vm._s(v) +
                                    "\n            "
                                ),
                              ]
                            )
                          }),
                          1
                        ),
                      ])
                    : _c(
                        "div",
                        {
                          staticStyle: {
                            "font-size": "12px",
                            color: "#9499A0",
                            "margin-top": "8px",
                          },
                        },
                        [_vm._v("\n          暂无规则项\n        ")]
                      ),
                ],
                1
              ),
            ],
            1
          ),
          _vm._v(" "),
          _c(
            "el-col",
            { attrs: { span: 10 } },
            [
              _c(
                "el-card",
                {
                  attrs: { shadow: "never" },
                  scopedSlots: _vm._u([
                    {
                      key: "header",
                      fn: function () {
                        return [_c("span", [_vm._v("规则信息")])]
                      },
                      proxy: true,
                    },
                  ]),
                },
                [
                  _vm._v(" "),
                  _c("ruleInformationView", {
                    attrs: { "rule-info-arr": _vm.ruleInfoArr },
                  }),
                ],
                1
              ),
            ],
            1
          ),
        ],
        1
      ),
      _vm._v(" "),
      _c("ruleSetValueDialog"),
      _vm._v(" "),
      _c("multipleRuleEditDialog"),
    ],
    1
  )
};
var __vue_staticRenderFns__$f = [];
__vue_render__$f._withStripped = true;
  
  const __vue_inject_styles__$f = function (inject) {
    if (!inject) return
    inject("data-v-3d1f67eb_0", { source: "\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n.edit-rule-tags-scroll {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 4px;\n  max-height: 240px;\n  overflow-y: auto;\n}\n.edit-rule-tags-scroll::-webkit-scrollbar {\n  width: 4px;\n}\n.edit-rule-tags-scroll::-webkit-scrollbar-thumb {\n  background: rgba(128, 128, 128, 0.3);\n  border-radius: 3px;\n}\n", map: {"version":3,"sources":["E:\\something\\AI Agent\\ban bilibili\\BiliBlockFusion\\src\\web\\layout\\views\\basicRulesView.vue"],"names":[],"mappings":";;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;AAoKA,6BAAA;AACA,2DAAA;;AAEA,iCAAA;AACA;EACA,aAAA;EACA,eAAA;EACA,QAAA;EACA,iBAAA;EACA,gBAAA;AACA;AAEA;EACA,UAAA;AACA;AAEA;EACA,oCAAA;EACA,kBAAA;AACA","file":"basicRulesView.vue","sourcesContent":["<script>\nimport {eventEmitter} from \"../../model/EventEmitter.js\";\nimport ruleKeyListData from \"../../data/ruleKeyListData.js\";\nimport ruleUtil from \"../../utils/ruleUtil.js\";\nimport multipleRuleEditDialog from \"../eventEmitter_components/multipleRuleEditDialog.vue\";\nimport ruleSetValueDialog from '../eventEmitter_components/ruleSetValueDialog.vue';\nimport ruleInformationView from \"./ruleInformationView.vue\";\n\nexport default {\n  components: {ruleInformationView, ruleSetValueDialog, multipleRuleEditDialog},\n  data() {\n    return {\n      cascaderVal: [\"精确匹配\", \"precise_uid\"],\n      cascaderOptions: ruleKeyListData.getSelectOptions(),\n      ruleInfoArr: [],\n      // 当前选中类型的规则项列表\n      currentItems: [],\n      // 分隔符\n      separator: ',',\n      // 输入值\n      inputVal: ''\n    }\n  },\n  computed: {\n    selectedType() {\n      return this.cascaderVal[1];\n    },\n    selectedModel() {\n      return this.cascaderVal[0];\n    }\n  },\n  methods: {\n    loadCurrentItems() {\n      this.currentItems = GM_getValue(this.selectedType, []);\n    },\n    addBut() {\n      if (this.selectedModel === '组合匹配') {\n        const typeMap = this.ruleInfoArr.find(item => item.type === this.selectedType);\n        eventEmitter.send('打开多重规则编辑对话框', typeMap);\n        return;\n      }\n      const fragments = [];\n      for (let s of this.inputVal.split(this.separator)) {\n        s = s.trim();\n        if (s === '' || fragments.includes(s)) continue;\n        fragments.push(s);\n      }\n      if (fragments.length === 0) {\n        this.$message.warning('未有分割项，请输入');\n        return;\n      }\n      const {successList, failList} = ruleUtil.batchAddRule(fragments, this.selectedType);\n      let msg = `成功添加 ${successList.length} 项`;\n      if (failList.length > 0) {\n        msg += `，失败 ${failList.length} 项: ${failList.join(', ')}`;\n      }\n      this.$message.success(msg);\n      this.inputVal = '';\n      this.loadCurrentItems();\n      eventEmitter.send('刷新规则信息');\n    },\n    removeItem(val) {\n      const {status, res} = ruleUtil.delRule(this.selectedType, val);\n      if (status) {\n        this.$message.success(res);\n        this.loadCurrentItems();\n        eventEmitter.send('刷新规则信息');\n      } else {\n        this.$message.warning(res);\n      }\n    },\n    clearType() {\n      const typeMap = this.ruleInfoArr.find(item => item.type === this.selectedType);\n      this.$confirm(`确定清空【${typeMap ? typeMap.name : this.selectedType}】的规则内容吗？`).then(() => {\n        ruleKeyListData.clearKeyItem(this.selectedType);\n        this.loadCurrentItems();\n        this.$message.success(`已清空`);\n        eventEmitter.send('刷新规则信息', false);\n      });\n    },\n    delAll() {\n      this.$confirm('确定要删除所有规则吗？此操作不可恢复。').then(() => {\n        for (let x of this.ruleInfoArr) {\n          GM_deleteValue(x.type);\n        }\n        this.loadCurrentItems();\n        this.$message.success(\"已删除全部规则\");\n        eventEmitter.send('刷新规则信息', false);\n      });\n    }\n  },\n  watch: {\n    selectedType() {\n      this.loadCurrentItems();\n    }\n  },\n  created() {\n    for (let el of ruleKeyListData.getRuleKeyListData()) {\n      this.ruleInfoArr.push({\n        type: el.key,\n        name: el.name,\n      });\n    }\n    this.loadCurrentItems();\n  }\n}\n</script>\n\n<template>\n  <div class=\"basic-rules-container\">\n    <el-row :gutter=\"12\">\n      <el-col :span=\"14\">\n        <el-card shadow=\"never\">\n          <template #header>\n            <span>编辑规则</span>\n          </template>\n          <el-cascader v-model=\"cascaderVal\" :options=\"cascaderOptions\"\n                       :props=\"{ expandTrigger: 'hover' }\" filterable\n                       show-all-levels style=\"width: 100%;\">\n          </el-cascader>\n          <el-divider/>\n          <div style=\"display:flex; gap:6px; align-items:center; margin-bottom:10px;\">\n            <el-input v-model=\"separator\" size=\"small\" style=\"width:55px;\"\n                      placeholder=\"分隔符\"/>\n            <el-input v-model=\"inputVal\" size=\"small\" type=\"textarea\" rows=\"2\"\n                      placeholder=\"多项用分隔符隔开\"/>\n          </div>\n          <div style=\"display:flex; gap:6px; margin-bottom:10px;\">\n            <el-button size=\"small\" type=\"primary\" @click=\"addBut\">添加</el-button>\n            <el-button size=\"small\" type=\"danger\" @click=\"clearType\">清空此规则</el-button>\n            <el-button size=\"small\" type=\"danger\" @click=\"delAll\">删除全部</el-button>\n          </div>\n          <div v-if=\"currentItems.length > 0\" style=\"margin-top:8px;\">\n            <div style=\"font-size:12px;color:#9499A0;margin-bottom:4px;\">\n              共 {{ currentItems.length }} 项\n            </div>\n            <div class=\"edit-rule-tags-scroll\">\n              <el-tag v-for=\"v in currentItems\" :key=\"v\"\n                      closable size=\"small\"\n                      @close=\"removeItem(v)\">\n                {{ v }}\n              </el-tag>\n            </div>\n          </div>\n          <div v-else style=\"font-size:12px;color:#9499A0;margin-top:8px;\">\n            暂无规则项\n          </div>\n        </el-card>\n      </el-col>\n      <el-col :span=\"10\">\n        <el-card shadow=\"never\">\n          <template #header>\n            <span>规则信息</span>\n          </template>\n          <ruleInformationView :rule-info-arr=\"ruleInfoArr\"/>\n        </el-card>\n      </el-col>\n    </el-row>\n    <ruleSetValueDialog/>\n    <multipleRuleEditDialog/>\n  </div>\n</template>\n\n<style>\n\n\n\n\n.edit-rule-tags-scroll {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 4px;\n  max-height: 240px;\n  overflow-y: auto;\n}\n\n.edit-rule-tags-scroll::-webkit-scrollbar {\n  width: 4px;\n}\n\n.edit-rule-tags-scroll::-webkit-scrollbar-thumb {\n  background: rgba(128, 128, 128, 0.3);\n  border-radius: 3px;\n}\n</style>\n"]}, media: undefined });
  };
  
  const __vue_scope_id__$f = undefined;
  
  const __vue_module_identifier__$f = undefined;
  
  const __vue_is_functional_template__$f = false;
  
  
  
  
  
  const __vue_component__$f = normalizeComponent(
    { render: __vue_render__$f, staticRenderFns: __vue_staticRenderFns__$f },
    __vue_inject_styles__$f,
    __vue_script__$f,
    __vue_scope_id__$f,
    __vue_is_functional_template__$f,
    __vue_module_identifier__$f,
    false,
    createInjector);var script$e = {
  data() {
    return {
      ruleContentImport: "",
      select: {
        val: [],
        options: []
      }
    };
  },
  methods: {
    getSelectValRuleContent() {
      const val = this.select.val;
      if (val.length === 0) return false;
      const map = {};
      for (const valKey of val) {
        const find = this.select.options.find((item) => item.key === valKey);
        if (find === void 0) continue;
        const { key } = find;
        const ruleItemList = GM_getValue(key, []);
        if (ruleItemList.length === 0) continue;
        map[key] = ruleItemList;
      }
      if (Object.keys(map).length === 0) {
        this.$message.warning(`选定的规则类型都为空`);
        return false;
      }
      return map;
    },
    overwriteImportRulesBut() {
      this.$confirm("是否要覆盖导入规则？").then(() => {
        const trim = this.ruleContentImport.trim();
        if (ruleUtil.overwriteImportRules(trim)) {
          this.$alert("已覆盖导入成功！");
          eventEmitter.send("刷新规则信息");
        }
      });
    },
    appendImportRulesBut() {
      this.$confirm("是否要追加导入规则？").then(() => {
        const trim = this.ruleContentImport.trim();
        if (ruleUtil.appendImportRules(trim)) {
          this.$message("已追加导入成功！");
          eventEmitter.send("刷新规则信息");
        }
      });
    },
    handleFileUpload(event) {
      defUtil.handleFileReader(event).then((data) => {
        const { content } = data;
        try {
          JSON.parse(content);
        } catch (e) {
          this.$message("文件内容有误");
          return;
        }
        this.ruleContentImport = content;
        this.$message("读取到内容，请按需覆盖或追加");
      });
    },
    inputFIleRuleBut() {
      this.$refs.file.click();
    },
    outToInputBut() {
      this.ruleContentImport = ruleUtil.getRuleContent();
      this.$message("已导出到输入框中");
    },
    ruleOutToFIleBut() {
      const map = this.getSelectValRuleContent();
      if (map === false) return;
      this.$prompt("请输入文件名", "保存为", {
        inputValue: "b站屏蔽器规则-指定类型-" + defUtil.toTimeString()
      }).then(({ value }) => {
        if (value === "" && value.includes(" ")) {
          this.$alert("文件名不能为空或包含空格");
          return;
        }
        saveTextAsFile(JSON.stringify(map, null, 4), value + ".json");
      });
    },
    basisRuleOutToFIleBut() {
      let fileName = "b站屏蔽器规则-" + defUtil.toTimeString();
      this.$prompt("请输入文件名", "保存为", {
        inputValue: fileName
      }).then(({ value }) => {
        if (value === "" && value.includes(" ")) {
          this.$alert("文件名不能为空或包含空格");
          return;
        }
        saveTextAsFile(ruleUtil.getRuleContent(true, 4), value + ".json");
      });
    }
  },
  created() {
    for (const v of ruleKeyListData.getRuleKeyListData()) {
      this.select.options.push(v);
    }
  }
};
const __vue_script__$e = script$e;
var __vue_render__$e = function () {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _c(
    "div",
    [
      _c(
        "el-card",
        {
          attrs: { shadow: "never" },
          scopedSlots: _vm._u([
            {
              key: "header",
              fn: function () {
                return [_c("span", [_vm._v("导出基础规则")])]
              },
              proxy: true,
            },
          ]),
        },
        [
          _vm._v(" "),
          _c("el-button", { on: { click: _vm.basisRuleOutToFIleBut } }, [
            _vm._v("导出文件"),
          ]),
          _vm._v(" "),
          _c("el-button", { on: { click: _vm.outToInputBut } }, [
            _vm._v("导出编辑框"),
          ]),
        ],
        1
      ),
      _vm._v(" "),
      _c(
        "el-card",
        {
          attrs: { shadow: "never" },
          scopedSlots: _vm._u([
            {
              key: "header",
              fn: function () {
                return [_vm._v("导出指定规则")]
              },
              proxy: true,
            },
          ]),
        },
        [
          _vm._v(" "),
          _c(
            "el-select",
            {
              attrs: {
                clearable: "",
                filterable: "",
                multiple: "",
                placeholder: "请选择导出规则类型",
              },
              model: {
                value: _vm.select.val,
                callback: function ($$v) {
                  _vm.$set(_vm.select, "val", $$v);
                },
                expression: "select.val",
              },
            },
            _vm._l(_vm.select.options, function (item) {
              return _c("el-option", {
                key: item.key,
                attrs: { label: item.name, value: item.key },
              })
            }),
            1
          ),
          _vm._v(" "),
          _c("el-button", { on: { click: _vm.ruleOutToFIleBut } }, [
            _vm._v("导出文件"),
          ]),
        ],
        1
      ),
      _vm._v(" "),
      _c(
        "el-card",
        {
          attrs: { shadow: "never" },
          scopedSlots: _vm._u([
            {
              key: "header",
              fn: function () {
                return [_vm._v("导入规则")]
              },
              proxy: true,
            },
          ]),
        },
        [
          _vm._v(" "),
          _c("div", [_vm._v("仅支持json格式内容导入,且最外层为对象(花括号)")]),
          _vm._v(" "),
          _c("div", [_vm._v("内容格式为{key: [规则列表]}")]),
          _vm._v(" "),
          _c("div", [
            _vm._v(
              "可以只导入指定类型规则，最外层需为对象，key为规则的内部key，value为规则列表"
            ),
          ]),
          _vm._v(" "),
          _c("el-divider"),
          _vm._v(" "),
          _c(
            "div",
            [
              _c("el-button", { on: { click: _vm.inputFIleRuleBut } }, [
                _vm._v("读取外部规则文件"),
              ]),
              _vm._v(" "),
              _c("el-button", { on: { click: _vm.overwriteImportRulesBut } }, [
                _vm._v("覆盖导入规则"),
              ]),
              _vm._v(" "),
              _c("el-button", { on: { click: _vm.appendImportRulesBut } }, [
                _vm._v("追加导入规则"),
              ]),
            ],
            1
          ),
          _vm._v(" "),
          _c("el-divider"),
          _vm._v(" "),
          _c(
            "div",
            [
              _c("el-input", {
                staticClass: "rule-import-textarea",
                attrs: {
                  autosize: { minRows: 10, maxRows: 50 },
                  placeholder: "要导入的规则内容",
                  type: "textarea",
                },
                model: {
                  value: _vm.ruleContentImport,
                  callback: function ($$v) {
                    _vm.ruleContentImport = $$v;
                  },
                  expression: "ruleContentImport",
                },
              }),
            ],
            1
          ),
        ],
        1
      ),
      _vm._v(" "),
      _c("input", {
        ref: "file",
        staticStyle: { display: "none" },
        attrs: { accept: "application/json", type: "file" },
        on: { change: _vm.handleFileUpload },
      }),
    ],
    1
  )
};
var __vue_staticRenderFns__$e = [];
__vue_render__$e._withStripped = true;
  
  const __vue_inject_styles__$e = function (inject) {
    if (!inject) return
    inject("data-v-46d9eeb7_0", { source: "\n.rule-import-textarea[data-v-46d9eeb7] textarea {\n  overflow-y: auto !important;\n}\n", map: {"version":3,"sources":["E:\\something\\AI Agent\\ban bilibili\\BiliBlockFusion\\src\\web\\layout\\views\\ruleExportImportView.vue"],"names":[],"mappings":";AA6JA;EACA,2BAAA;AACA","file":"ruleExportImportView.vue","sourcesContent":["<script>\nimport defUtil, {saveTextAsFile} from \"../../utils/defUtil.js\";\nimport ruleUtil from \"../../utils/ruleUtil.js\";\nimport {eventEmitter} from \"../../model/EventEmitter.js\";\nimport ruleKeyListData from \"../../data/ruleKeyListData.js\";\n//规则导入导出组件\nexport default {\n  data() {\n    return {\n      //要导入的规则内容\n      ruleContentImport: \"\",\n      select: {\n        val: [],\n        options: [],\n      }\n    }\n  },\n  methods: {\n    getSelectValRuleContent() {\n      const val = this.select.val;\n      if (val.length === 0) return false\n      const map = {};\n      for (const valKey of val) {\n        const find = this.select.options.find(item => item.key === valKey);\n        if (find === undefined) continue;\n        const {key} = find;\n        const ruleItemList = GM_getValue(key, []);\n        if (ruleItemList.length === 0) continue;\n        map[key] = ruleItemList;\n      }\n      if (Object.keys(map).length === 0) {\n        this.$message.warning(`选定的规则类型都为空`);\n        return false;\n      }\n      return map;\n    },\n    //覆盖导入规则\n    overwriteImportRulesBut() {\n      this.$confirm('是否要覆盖导入规则？').then(() => {\n        const trim = this.ruleContentImport.trim();\n        if (ruleUtil.overwriteImportRules(trim)) {\n          this.$alert('已覆盖导入成功！')\n          eventEmitter.send('刷新规则信息');\n        }\n      })\n    },\n    //追加导入规则\n    appendImportRulesBut() {\n      this.$confirm('是否要追加导入规则？').then(() => {\n        const trim = this.ruleContentImport.trim();\n        if (ruleUtil.appendImportRules(trim)) {\n          this.$message('已追加导入成功！')\n          eventEmitter.send('刷新规则信息');\n        }\n      })\n    },\n    handleFileUpload(event) {\n      defUtil.handleFileReader(event).then(data => {\n        const {content} = data;\n        try {\n          JSON.parse(content);\n        } catch (e) {\n          this.$message('文件内容有误')\n          return;\n        }\n        this.ruleContentImport = content;\n        this.$message('读取到内容，请按需覆盖或追加')\n      })\n    },\n    inputFIleRuleBut() {\n      this.$refs.file.click()\n    },\n    outToInputBut() {\n      this.ruleContentImport = ruleUtil.getRuleContent();\n      this.$message('已导出到输入框中')\n    },\n    ruleOutToFIleBut() {\n      const map = this.getSelectValRuleContent();\n      if (map === false) return;\n      this.$prompt('请输入文件名', '保存为', {\n        inputValue: \"b站屏蔽器规则-指定类型-\" + defUtil.toTimeString()\n      }).then(({value}) => {\n        if (value === \"\" && value.includes(' ')) {\n          this.$alert('文件名不能为空或包含空格')\n          return\n        }\n        saveTextAsFile(JSON.stringify(map, null, 4), value + '.json');\n      })\n    },\n    basisRuleOutToFIleBut() {\n      let fileName = \"b站屏蔽器规则-\" + defUtil.toTimeString();\n      this.$prompt('请输入文件名', '保存为', {\n        inputValue: fileName\n      }).then(({value}) => {\n        if (value === \"\" && value.includes(' ')) {\n          this.$alert('文件名不能为空或包含空格')\n          return\n        }\n        saveTextAsFile(ruleUtil.getRuleContent(true, 4), value + \".json\");\n      })\n\n    },\n  },\n  created() {\n    for (const v of ruleKeyListData.getRuleKeyListData()) {\n      this.select.options.push(v);\n    }\n  }\n}\n</script>\n\n<template>\n  <div>\n    <el-card shadow=\"never\">\n      <template #header>\n        <span>导出基础规则</span>\n      </template>\n      <el-button @click=\"basisRuleOutToFIleBut\">导出文件</el-button>\n      <el-button @click=\"outToInputBut\">导出编辑框</el-button>\n    </el-card>\n    <el-card shadow=\"never\">\n      <template #header>导出指定规则</template>\n      <el-select v-model=\"select.val\" clearable filterable multiple placeholder=\"请选择导出规则类型\">\n        <el-option\n            v-for=\"item in select.options\"\n            :key=\"item.key\"\n            :label=\"item.name\"\n            :value=\"item.key\">\n        </el-option>\n      </el-select>\n      <el-button @click=\"ruleOutToFIleBut\">导出文件</el-button>\n    </el-card>\n    <el-card shadow=\"never\">\n      <template #header>导入规则</template>\n      <div>仅支持json格式内容导入,且最外层为对象(花括号)</div>\n      <div>内容格式为{key: [规则列表]}</div>\n      <div>可以只导入指定类型规则，最外层需为对象，key为规则的内部key，value为规则列表</div>\n      <el-divider/>\n      <div>\n        <el-button @click=\"inputFIleRuleBut\">读取外部规则文件</el-button>\n        <el-button @click=\"overwriteImportRulesBut\">覆盖导入规则</el-button>\n        <el-button @click=\"appendImportRulesBut\">追加导入规则</el-button>\n      </div>\n      <el-divider/>\n      <div>\n        <el-input v-model=\"ruleContentImport\"\n                  :autosize=\"{ minRows: 10, maxRows: 50}\"\n                  placeholder=\"要导入的规则内容\" type=\"textarea\"\n                  class=\"rule-import-textarea\"></el-input>\n      </div>\n    </el-card>\n    <input ref=\"file\" accept=\"application/json\" style=\"display: none\" type=\"file\"\n           @change=\"handleFileUpload\">\n  </div>\n</template>\n\n<style scoped>\n.rule-import-textarea >>> textarea {\n  overflow-y: auto !important;\n}\n</style>\n"]}, media: undefined });
  };
  
  const __vue_scope_id__$e = "data-v-46d9eeb7";
  
  const __vue_module_identifier__$e = undefined;
  
  const __vue_is_functional_template__$e = false;
  
  
  
  
  
  const __vue_component__$e = normalizeComponent(
    { render: __vue_render__$e, staticRenderFns: __vue_staticRenderFns__$e },
    __vue_inject_styles__$e,
    __vue_script__$e,
    __vue_scope_id__$e,
    __vue_is_functional_template__$e,
    __vue_module_identifier__$e,
    false,
    createInjector);var externalList = [
  {
    "title": "弹幕量限制",
    "minInputKey": "minimum_barrage_gm",
    "maxInputKey": "maximum_barrage_gm",
    "minLabel": "最小弹幕量限制",
    "maxLabel": "最大弹幕量限制",
    "isMaxKey": "is_maximum_barrage_gm",
    "isMinKey": "is_minimum_barrage_gm",
    "minDefVal": 20,
    "maxDefVal": 1000
  },
  {
    "title": "播放量限制",
    "minInputKey": "minimum_play_gm",
    "maxInputKey": "maximum_play_gm",
    "minLabel": "最小播放量限制",
    "maxLabel": "最大播放量限制",
    "isMaxKey": "is_maximum_play_gm",
    "isMinKey": "is_minimum_play_gm",
    "minDefVal": 100,
    "maxDefVal": 10000
  },
  {
    "title": "时长限制",
    "minInputKey": "minimum_duration_gm",
    "maxInputKey": "maximum_duration_gm",
    "minLabel": "最小时长限制",
    "maxLabel": "最大时长限制",
    "isMaxKey": "is_maximum_duration_gm",
    "isMinKey": "is_minimum_duration_gm",
    "minDefVal": 30,
    "maxDefVal": 3000
  }
];var script$d = {
  data() {
    return {
      isEnabled: isEnableCommentWordLimitGm(),
      value: localMKData.getCommentWordLimitVal(),
      limitType: getCommentWordLimitType()
    };
  },
  watch: {
    isEnabled(newVal) {
      GM_setValue("is_enable_comment_word_limit_gm", newVal);
    },
    value(newVal) {
      GM_setValue("comment_word_limit", newVal);
    },
    limitType(newVal) {
      GM_setValue("comment_word_limit_type", newVal);
    }
  }
};
const __vue_script__$d = script$d;
var __vue_render__$d = function () {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _c(
    "div",
    [
      _c(
        "el-card",
        {
          attrs: { shadow: "never" },
          scopedSlots: _vm._u([
            {
              key: "header",
              fn: function () {
                return [
                  _c(
                    "div",
                    {
                      staticStyle: {
                        display: "flex",
                        "justify-content": "space-between",
                        "align-items": "center",
                      },
                    },
                    [
                      _c("span", [_vm._v("评论字数限制")]),
                      _vm._v(" "),
                      _c("el-switch", {
                        model: {
                          value: _vm.isEnabled,
                          callback: function ($$v) {
                            _vm.isEnabled = $$v;
                          },
                          expression: "isEnabled",
                        },
                      }),
                    ],
                    1
                  ),
                ]
              },
              proxy: true,
            },
          ]),
        },
        [
          _vm._v(" "),
          _c(
            "div",
            { staticStyle: { margin: "8px 0" } },
            [
              _c(
                "el-radio-group",
                {
                  attrs: { disabled: !_vm.isEnabled },
                  model: {
                    value: _vm.limitType,
                    callback: function ($$v) {
                      _vm.limitType = $$v;
                    },
                    expression: "limitType",
                  },
                },
                [
                  _c("el-radio-button", { attrs: { label: "max" } }, [
                    _vm._v("超过限制则屏蔽"),
                  ]),
                  _vm._v(" "),
                  _c("el-radio-button", { attrs: { label: "min" } }, [
                    _vm._v("低于限制则屏蔽"),
                  ]),
                ],
                1
              ),
            ],
            1
          ),
          _vm._v(" "),
          _c("el-input-number", {
            attrs: { disabled: !_vm.isEnabled },
            model: {
              value: _vm.value,
              callback: function ($$v) {
                _vm.value = $$v;
              },
              expression: "value",
            },
          }),
        ],
        1
      ),
    ],
    1
  )
};
var __vue_staticRenderFns__$d = [];
__vue_render__$d._withStripped = true;
  
  const __vue_inject_styles__$d = undefined;
  
  const __vue_scope_id__$d = undefined;
  
  const __vue_module_identifier__$d = undefined;
  
  const __vue_is_functional_template__$d = false;
  
  
  
  
  
  
  
  const __vue_component__$d = normalizeComponent(
    { render: __vue_render__$d, staticRenderFns: __vue_staticRenderFns__$d },
    __vue_inject_styles__$d,
    __vue_script__$d,
    __vue_scope_id__$d,
    __vue_is_functional_template__$d,
    __vue_module_identifier__$d,
    false,
    undefined);var script$c = {
  data() {
    return {
      minVal: 0,
      maxVal: 7,
      minimumUserLevelVideoVal: getMinimumUserLevelVideoGm(),
      maximumUserLevelVideoVal: getMaximumUserLevelVideoGm(),
      minimumCommentVal: getMinimumUserLevelCommentGm(),
      maximumCommentVal: getMaximumUserLevelCommentGm(),
      isEnableMinimumUserLevelVideoVal: isEnableMinimumUserLevelVideoGm(),
      isEnableMaximumUserLevelVideoVal: isEnableMaximumUserLevelVideoGm(),
      isEnableMinimumUserLevelCommentVal: isEnableMinimumUserLevelCommentGm(),
      isEnableMaximumUserLevelCommentVal: isEnableMaximumUserLevelCommentGm()
    };
  },
  methods: {},
  watch: {
    minimumUserLevelVideoVal(n) {
      const max = this.maximumUserLevelVideoVal;
      if (n > max) {
        this.minimumUserLevelVideoVal = max;
        this.$message.warning("最小等级不能大于最大等级");
        return;
      }
      if (n === max) {
        --this.minimumUserLevelVideoVal;
        this.$message.warning("最小等级不能等于最大等级");
        return;
      }
      GM_setValue("minimum_user_level_video_gm", n);
    },
    maximumUserLevelVideoVal(n) {
      const min = this.minimumUserLevelVideoVal;
      if (n < min) {
        this.maximumUserLevelVideoVal = min;
        this.$message.warning("最大等级不能小于最小等级");
        return;
      }
      if (n === min) {
        ++this.maximumUserLevelVideoVal;
        this.$message.warning("最大等级不能等于最小等级");
        return;
      }
      GM_setValue("maximum_user_level_video_gm", this.maximumUserLevelVideoVal);
    },
    minimumCommentVal(n) {
      const max = this.maximumCommentVal;
      if (n > max) {
        this.minimumCommentVal = max;
        this.$message.warning("最小等级不能大于最大等级");
        return;
      }
      if (n === max) {
        --this.minimumCommentVal;
        this.$message.warning("最小等级不能等于最大等级");
        return;
      }
      GM_setValue("minimum_user_level_comment_gm", n);
    },
    maximumCommentVal(n) {
      const min = this.minimumCommentVal;
      if (n < min) {
        this.maximumCommentVal = min;
        this.$message.warning("最大等级不能小于最小等级");
        return;
      }
      if (n === min) {
        ++this.maximumCommentVal;
        this.$message.warning("最大等级不能等于最小等级");
        return;
      }
      GM_setValue("maximum_user_level_comment_gm", n);
    },
    isEnableMinimumUserLevelVideoVal(n) {
      GM_setValue("is_enable_minimum_user_level_video_gm", n);
    },
    isEnableMaximumUserLevelVideoVal(n) {
      GM_setValue("is_enable_maximum_user_level_video_gm", n);
    },
    isEnableMinimumUserLevelCommentVal(n) {
      GM_setValue("is_enable_minimum_user_level_comment_gm", n);
    },
    isEnableMaximumUserLevelCommentVal(n) {
      GM_setValue("is_enable_maximum_user_level_comment_gm", n);
    }
  }
};
const __vue_script__$c = script$c;
var __vue_render__$c = function () {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _c(
    "el-card",
    {
      attrs: { shadow: "never" },
      scopedSlots: _vm._u([
        {
          key: "header",
          fn: function () {
            return [_vm._v("等级限制")]
          },
          proxy: true,
        },
      ]),
    },
    [
      _vm._v(" "),
      _c(
        "div",
        { staticClass: "el-horizontal-left" },
        [
          _c("div", [
            _vm._v("\n      视频类\n      "),
            _c(
              "div",
              [
                _vm._v(
                  "启用最小等级" +
                    _vm._s(_vm.minimumUserLevelVideoVal) +
                    "\n        "
                ),
                _c("el-switch", {
                  model: {
                    value: _vm.isEnableMinimumUserLevelVideoVal,
                    callback: function ($$v) {
                      _vm.isEnableMinimumUserLevelVideoVal = $$v;
                    },
                    expression: "isEnableMinimumUserLevelVideoVal",
                  },
                }),
                _vm._v(" "),
                _c("el-input-number", {
                  attrs: { max: _vm.maxVal, min: _vm.minVal },
                  model: {
                    value: _vm.minimumUserLevelVideoVal,
                    callback: function ($$v) {
                      _vm.minimumUserLevelVideoVal = $$v;
                    },
                    expression: "minimumUserLevelVideoVal",
                  },
                }),
              ],
              1
            ),
            _vm._v(" "),
            _c(
              "div",
              [
                _vm._v(
                  "启用最大等级" +
                    _vm._s(_vm.maximumUserLevelVideoVal) +
                    "\n        "
                ),
                _c("el-switch", {
                  model: {
                    value: _vm.isEnableMaximumUserLevelVideoVal,
                    callback: function ($$v) {
                      _vm.isEnableMaximumUserLevelVideoVal = $$v;
                    },
                    expression: "isEnableMaximumUserLevelVideoVal",
                  },
                }),
                _vm._v(" "),
                _c("el-input-number", {
                  attrs: { max: _vm.maxVal, min: 1 },
                  model: {
                    value: _vm.maximumUserLevelVideoVal,
                    callback: function ($$v) {
                      _vm.maximumUserLevelVideoVal = $$v;
                    },
                    expression: "maximumUserLevelVideoVal",
                  },
                }),
              ],
              1
            ),
          ]),
          _vm._v(" "),
          _c("el-divider", {
            staticClass: "height-auto",
            attrs: { direction: "vertical" },
          }),
          _vm._v(" "),
          _c("div", [
            _vm._v("\n      评论类\n      "),
            _c(
              "div",
              [
                _vm._v(
                  "启用最小等级" + _vm._s(_vm.minimumCommentVal) + "\n        "
                ),
                _c("el-switch", {
                  model: {
                    value: _vm.isEnableMinimumUserLevelCommentVal,
                    callback: function ($$v) {
                      _vm.isEnableMinimumUserLevelCommentVal = $$v;
                    },
                    expression: "isEnableMinimumUserLevelCommentVal",
                  },
                }),
                _vm._v(" "),
                _c("el-input-number", {
                  attrs: { max: _vm.maxVal, min: 3 },
                  model: {
                    value: _vm.minimumCommentVal,
                    callback: function ($$v) {
                      _vm.minimumCommentVal = $$v;
                    },
                    expression: "minimumCommentVal",
                  },
                }),
              ],
              1
            ),
            _vm._v(" "),
            _c(
              "div",
              [
                _vm._v(
                  "启用最大等级" + _vm._s(_vm.maximumCommentVal) + "\n        "
                ),
                _c("el-switch", {
                  model: {
                    value: _vm.isEnableMaximumUserLevelCommentVal,
                    callback: function ($$v) {
                      _vm.isEnableMaximumUserLevelCommentVal = $$v;
                    },
                    expression: "isEnableMaximumUserLevelCommentVal",
                  },
                }),
                _vm._v(" "),
                _c("el-input-number", {
                  attrs: { max: _vm.maxVal, min: 3 },
                  model: {
                    value: _vm.maximumCommentVal,
                    callback: function ($$v) {
                      _vm.maximumCommentVal = $$v;
                    },
                    expression: "maximumCommentVal",
                  },
                }),
              ],
              1
            ),
          ]),
          _vm._v(" "),
          _c("el-divider", {
            staticClass: "height-auto",
            attrs: { direction: "vertical" },
          }),
        ],
        1
      ),
    ]
  )
};
var __vue_staticRenderFns__$c = [];
__vue_render__$c._withStripped = true;
  
  const __vue_inject_styles__$c = undefined;
  
  const __vue_scope_id__$c = undefined;
  
  const __vue_module_identifier__$c = undefined;
  
  const __vue_is_functional_template__$c = false;
  
  
  
  
  
  
  
  const __vue_component__$c = normalizeComponent(
    { render: __vue_render__$c, staticRenderFns: __vue_staticRenderFns__$c },
    __vue_inject_styles__$c,
    __vue_script__$c,
    __vue_scope_id__$c,
    __vue_is_functional_template__$c,
    __vue_module_identifier__$c,
    false,
    undefined);var script$b = {
  props: {
    title: {
      type: String,
      default: "默认标题"
    },
    isMaxText: { default: "启用最大" },
    isMinText: { default: "启用最小" },
    minDefVal: { default: 0 },
    maxDefVal: { default: 1 },
    isMaxVal: { default: false },
    isMinVal: { default: false },
    minInputKey: { type: String, required: true },
    maxInputKey: { type: String, required: true },
    isMaxKey: { type: String, required: true },
    isMinKey: { type: String, required: true }
  },
  data() {
    return {
      localIsMaxVal: GM_getValue(this.isMaxKey, false),
      localIsMinVal: GM_getValue(this.isMinKey, false),
      localMinInputVal: GM_getValue(this.minInputKey, this.minDefVal),
      localMaxInputVal: GM_getValue(this.maxInputKey, this.maxDefVal)
    };
  },
  watch: {
    localIsMaxVal(n) {
      GM_setValue(this.isMaxKey, n);
    },
    localIsMinVal(n) {
      GM_setValue(this.isMinKey, n);
    },
    localMinInputVal(n) {
      GM_setValue(this.minInputKey, n);
    },
    localMaxInputVal(n) {
      GM_setValue(this.maxInputKey, n);
    }
  }
};
const __vue_script__$b = script$b;
var __vue_render__$b = function () {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _c(
    "el-card",
    {
      attrs: { shadow: "never" },
      scopedSlots: _vm._u([
        {
          key: "header",
          fn: function () {
            return [_vm._v(_vm._s(_vm.title))]
          },
          proxy: true,
        },
      ]),
    },
    [
      _vm._v(" "),
      _c(
        "div",
        [
          _c("el-switch", {
            attrs: { "active-text": _vm.isMinText },
            model: {
              value: _vm.localIsMinVal,
              callback: function ($$v) {
                _vm.localIsMinVal = $$v;
              },
              expression: "localIsMinVal",
            },
          }),
          _vm._v(" "),
          _c("el-input-number", {
            attrs: { max: _vm.localMaxInputVal - 1, min: 0 },
            model: {
              value: _vm.localMinInputVal,
              callback: function ($$v) {
                _vm.localMinInputVal = $$v;
              },
              expression: "localMinInputVal",
            },
          }),
        ],
        1
      ),
      _vm._v(" "),
      _c(
        "div",
        [
          _c("el-switch", {
            attrs: { "active-text": _vm.isMaxText },
            model: {
              value: _vm.localIsMaxVal,
              callback: function ($$v) {
                _vm.localIsMaxVal = $$v;
              },
              expression: "localIsMaxVal",
            },
          }),
          _vm._v(" "),
          _c("el-input-number", {
            attrs: { min: _vm.localMinInputVal + 1 },
            model: {
              value: _vm.localMaxInputVal,
              callback: function ($$v) {
                _vm.localMaxInputVal = $$v;
              },
              expression: "localMaxInputVal",
            },
          }),
        ],
        1
      ),
    ]
  )
};
var __vue_staticRenderFns__$b = [];
__vue_render__$b._withStripped = true;
  
  const __vue_inject_styles__$b = undefined;
  
  const __vue_scope_id__$b = undefined;
  
  const __vue_module_identifier__$b = undefined;
  
  const __vue_is_functional_template__$b = false;
  
  
  
  
  
  
  
  const __vue_component__$b = normalizeComponent(
    { render: __vue_render__$b, staticRenderFns: __vue_staticRenderFns__$b },
    __vue_inject_styles__$b,
    __vue_script__$b,
    __vue_scope_id__$b,
    __vue_is_functional_template__$b,
    __vue_module_identifier__$b,
    false,
    undefined);var script$a = {
  components: { SwitchMinMaxInputCard: __vue_component__$b, commentWordLimitView: __vue_component__$d, UserLevelFilteringView: __vue_component__$c },
  data() {
    return {
      externalList
    };
  }
};
const __vue_script__$a = script$a;
var __vue_render__$a = function () {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _c(
    "div",
    { staticClass: "other-param-container" },
    [
      _c("div", { staticClass: "other-param-hint" }, [
        _vm._v(
          "时长单位秒，-1 表示不做限制。最小值 → 低于此值屏蔽，最大值 → 高于此值屏蔽"
        ),
      ]),
      _vm._v(" "),
      _c("UserLevelFilteringView"),
      _vm._v(" "),
      _c(
        "div",
        { staticStyle: { display: "flex" } },
        _vm._l(_vm.externalList, function (v) {
          return _c("switch-min-max-input-card", {
            key: v.title,
            attrs: {
              "is-max-key": v.isMaxKey,
              "is-min-key": v.isMinKey,
              "max-def-val": v.maxDefVal,
              "max-input-key": v.maxInputKey,
              "min-def-val": v.minDefVal,
              "min-input-key": v.minInputKey,
              title: v.title,
            },
          })
        }),
        1
      ),
      _vm._v(" "),
      _c("commentWordLimitView"),
    ],
    1
  )
};
var __vue_staticRenderFns__$a = [];
__vue_render__$a._withStripped = true;
  
  const __vue_inject_styles__$a = function (inject) {
    if (!inject) return
    inject("data-v-7c1d6468_0", { source: "\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n.other-param-container .other-param-hint {\n  font-size: 12px;\n  color: #9499A0;\n  margin-bottom: 10px;\n  line-height: 1.6;\n}\n", map: {"version":3,"sources":["E:\\something\\AI Agent\\ban bilibili\\BiliBlockFusion\\src\\web\\layout\\views\\otherParameterFilterView.vue"],"names":[],"mappings":";;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;AAsCA,uCAAA;AACA,2DAAA;AAEA;EACA,eAAA;EACA,cAAA;EACA,mBAAA;EACA,gBAAA;AACA","file":"otherParameterFilterView.vue","sourcesContent":["<script>\nimport externalList from \"../../res/otherKeyListDataJson.json\";\nimport commentWordLimitView from \"./commentWordLimitView.vue\";\nimport UserLevelFilteringView from \"./other-parameter-filter/UserLevelFilteringView.vue\";\nimport SwitchMinMaxInputCard from \"../components/SwitchMinMaxInputCard.vue\";\n\n\nexport default {\n  components: {SwitchMinMaxInputCard, commentWordLimitView, UserLevelFilteringView},\n  data() {\n    return {\n      externalList\n    }\n  }\n}\n</script>\n\n<template>\n  <div class=\"other-param-container\">\n    <div class=\"other-param-hint\">时长单位秒，-1 表示不做限制。最小值 → 低于此值屏蔽，最大值 → 高于此值屏蔽</div>\n    <UserLevelFilteringView/>\n    <div style=\"display: flex;\">\n      <switch-min-max-input-card v-for=\"v in externalList\" :key=\"v.title\"\n                                 :is-max-key=\"v.isMaxKey\"\n                                 :is-min-key=\"v.isMinKey\"\n                                 :max-def-val=\"v.maxDefVal\"\n                                 :max-input-key=\"v.maxInputKey\"\n                                 :min-def-val=\"v.minDefVal\"\n                                 :min-input-key=\"v.minInputKey\"\n                                 :title=\"v.title\"/>\n    </div>\n    <commentWordLimitView/>\n  </div>\n</template>\n\n<style>\n\n\n\n.other-param-container .other-param-hint {\n  font-size: 12px;\n  color: #9499A0;\n  margin-bottom: 10px;\n  line-height: 1.6;\n}\n</style>\n"]}, media: undefined });
  };
  
  const __vue_scope_id__$a = undefined;
  
  const __vue_module_identifier__$a = undefined;
  
  const __vue_is_functional_template__$a = false;
  
  
  
  
  
  const __vue_component__$a = normalizeComponent(
    { render: __vue_render__$a, staticRenderFns: __vue_staticRenderFns__$a },
    __vue_inject_styles__$a,
    __vue_script__$a,
    __vue_scope_id__$a,
    __vue_is_functional_template__$a,
    __vue_module_identifier__$a,
    false,
    createInjector);var script$9 = {
  data() {
    return {
      dialogVisible: false,
      typeMap: {},
      showTags: []
    };
  },
  methods: {
    updateShowRuleTags() {
      this.showTags = GM_getValue(this.typeMap.type, []);
    },
    handleTagClose(tag, index) {
      if (tag === "") return;
      this.$confirm(`确定要删除 ${tag} 吗？`, "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }).then(() => {
        this.showTags.splice(index, 1);
        GM_setValue(this.typeMap.type, this.showTags);
        this.$message.success(`已移除 ${tag}`);
        eventEmitter.send("刷新规则信息", false);
      });
    },
    closedHandle() {
      this.typeMap = {};
      this.showTags.splice(0, this.showTags.length);
    }
  },
  created() {
    eventEmitter.on("event-lookRuleDialog", (typeMap) => {
      this.typeMap = typeMap;
      this.dialogVisible = true;
      this.updateShowRuleTags();
    });
  }
};
const __vue_script__$9 = script$9;
var __vue_render__$9 = function () {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _c(
    "div",
    [
      _c(
        "el-dialog",
        {
          attrs: {
            "close-on-click-modal": false,
            "close-on-press-escape": false,
            fullscreen: true,
            modal: false,
            visible: _vm.dialogVisible,
            title: "查看规则内容",
          },
          on: {
            closed: _vm.closedHandle,
            "update:visible": function ($event) {
              _vm.dialogVisible = $event;
            },
          },
        },
        [
          _c(
            "el-card",
            {
              scopedSlots: _vm._u([
                {
                  key: "header",
                  fn: function () {
                    return [_vm._v("规则信息")]
                  },
                  proxy: true,
                },
              ]),
            },
            [
              _vm._v(" "),
              _c("el-tag", [
                _vm._v(_vm._s(_vm.typeMap.name + "|" + _vm.typeMap.type)),
              ]),
              _vm._v(" "),
              _c("el-tag", [_vm._v(_vm._s(_vm.showTags.length) + "个")]),
            ],
            1
          ),
          _vm._v(" "),
          _c(
            "el-card",
            _vm._l(_vm.showTags, function (item, index) {
              return _c(
                "el-tag",
                {
                  key: index,
                  attrs: { closable: "" },
                  on: {
                    close: function ($event) {
                      return _vm.handleTagClose(item, index)
                    },
                  },
                },
                [_vm._v("\n        " + _vm._s(item) + "\n      ")]
              )
            }),
            1
          ),
        ],
        1
      ),
    ],
    1
  )
};
var __vue_staticRenderFns__$9 = [];
__vue_render__$9._withStripped = true;
  
  const __vue_inject_styles__$9 = undefined;
  
  const __vue_scope_id__$9 = undefined;
  
  const __vue_module_identifier__$9 = undefined;
  
  const __vue_is_functional_template__$9 = false;
  
  
  
  
  
  
  
  const __vue_component__$9 = normalizeComponent(
    { render: __vue_render__$9, staticRenderFns: __vue_staticRenderFns__$9 },
    __vue_inject_styles__$9,
    __vue_script__$9,
    __vue_scope_id__$9,
    __vue_is_functional_template__$9,
    __vue_module_identifier__$9,
    false,
    undefined);var script$8 = {
  components: {
    ruleExportImportView: __vue_component__$e,
    otherParameterFilterView: __vue_component__$a,
    basicRulesView: __vue_component__$f,
    highLevelRuleView: __vue_component__$j,
    videoMetricsFilterView: __vue_component__$l,
    viewRulesRuleDialog: __vue_component__$9
  }
};
const __vue_script__$8 = script$8;
var __vue_render__$8 = function () {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _c(
    "div",
    [
      _c(
        "el-tabs",
        { attrs: { "tab-position": "left" } },
        [
          _c(
            "el-tab-pane",
            { attrs: { label: "基础规则" } },
            [_c("basicRulesView")],
            1
          ),
          _vm._v(" "),
          _c(
            "el-tab-pane",
            { attrs: { label: "高级规则", lazy: "" } },
            [_c("highLevelRuleView")],
            1
          ),
          _vm._v(" "),
          _c(
            "el-tab-pane",
            { attrs: { label: "其他规则", lazy: "" } },
            [_c("otherParameterFilterView")],
            1
          ),
          _vm._v(" "),
          _c(
            "el-tab-pane",
            { attrs: { label: "指标屏蔽", lazy: "" } },
            [_c("videoMetricsFilterView")],
            1
          ),
          _vm._v(" "),
          _c(
            "el-tab-pane",
            { attrs: { label: "导出导入", lazy: "" } },
            [_c("ruleExportImportView")],
            1
          ),
        ],
        1
      ),
      _vm._v(" "),
      _c("viewRulesRuleDialog"),
    ],
    1
  )
};
var __vue_staticRenderFns__$8 = [];
__vue_render__$8._withStripped = true;
  
  const __vue_inject_styles__$8 = undefined;
  
  const __vue_scope_id__$8 = undefined;
  
  const __vue_module_identifier__$8 = undefined;
  
  const __vue_is_functional_template__$8 = false;
  
  
  
  
  
  
  
  const __vue_component__$8 = normalizeComponent(
    { render: __vue_render__$8, staticRenderFns: __vue_staticRenderFns__$8 },
    __vue_inject_styles__$8,
    __vue_script__$8,
    __vue_scope_id__$8,
    __vue_is_functional_template__$8,
    __vue_module_identifier__$8,
    false,
    undefined);const getPlayCountAndBulletChatAndDuration = (el) => {
  const playInfo = el.querySelector(".playinfo").innerHTML.trim();
  let nPlayCount = playInfo.match(/<\/svg>(.*)<svg/s)?.[1].trim();
  nPlayCount = strFormatUtil.toPlayCountOrBulletChat(nPlayCount);
  let nBulletChat = playInfo.match(/class="dm-icon".+<\/svg>(.+)$/s)?.[1].trim();
  nBulletChat = strFormatUtil.toPlayCountOrBulletChat(nBulletChat);
  let nDuration = el.querySelector(".duration")?.textContent.trim();
  nDuration = strFormatUtil.timeStringToSeconds(nDuration);
  return {
    nPlayCount,
    nBulletChat,
    nDuration
  };
};
const getRightVideoDataList$1 = (elList) => {
  const list = [];
  for (let el of elList) {
    const title = el.querySelector(".title").textContent.trim();
    const userInfoEl = el.querySelector(".upname");
    const name = userInfoEl.querySelector(".name").textContent.trim();
    const userUrl = userInfoEl.href;
    const uid = urlUtil.getUrlUID(userUrl);
    const videoUrl = el.querySelector(".info>a").href;
    const bv = urlUtil.getUrlBV(videoUrl);
    list.push({
      ...getPlayCountAndBulletChatAndDuration(el),
      ...{
        title,
        name,
        userUrl,
        videoUrl,
        uid,
        bv,
        el,
        insertionPositionEl: el.querySelector(".playinfo"),
        explicitSubjectEl: el.querySelector(".info")
      }
    });
  }
  return list;
};
const getVideoTags = () => {
  const el = document.body.querySelector(".video-tag-container");
  const vueData = el["__vue__"];
  const list = [];
  for (const v of vueData["tagList"]) {
    if (v["tag_type"] === "bgm") {
      continue;
    }
    list.push(v["tag_name"]);
  }
  return list;
};
const insertTagShieldButton = async () => {
  await elUtil.findElement("#biliMainHeader #nav-searchform", { interval: 4e3 });
  const el = await elUtil.findElement(".video-tag-container");
  const butEl = document.createElement("button");
  butEl.setAttribute("gz_type", "");
  butEl.textContent = "屏蔽标签";
  butEl.style.display = "none";
  el.firstElementChild.appendChild(butEl);
  el.addEventListener("mouseout", () => butEl.style.display = "none");
  el.addEventListener("mouseover", () => butEl.style.display = "");
  butEl.addEventListener("click", () => {
    const list = [];
    for (let tag of getVideoTags()) {
      list.push({ label: tag, value: tag });
    }
    eventEmitter.send("sheet-dialog", {
      contents: ["默认精确类型，不包括bgm类型tag"],
      list,
      title: "选择标签",
      optionsClick({ value }) {
        const res = ruleUtil.addRule(value, "precise_videoTag");
        eventEmitter.send("el-notify", {
          title: "添加精确标签操作提示",
          message: res.res,
          type: res.status ? "success" : "error"
        });
        res.status && eventEmitter.send("通知屏蔽");
      }
    });
  });
};
const insertUserProfileShieldButton = async () => {
  const el = await elUtil.findElement(".usercard-wrap");
  const but = document.createElement("button");
  but.id = "video-user-panel";
  but.setAttribute("gz_type", "");
  but.textContent = "屏蔽";
  but.addEventListener("click", () => {
    const vueEl = el.querySelector(".user-card-m-exp.card-loaded");
    const { userData: { mid, name } } = vueEl["__vue__"];
    eventEmitter.invoke("el-confirm", `是要屏蔽的用户${name}-【${mid}】吗？`).then(() => {
      const uid = parseInt(mid);
      if (ruleUtil.addRulePreciseUid(uid).status) {
        eventEmitter.send("通知屏蔽");
        eventEmitter.send("event-检查评论区屏蔽");
      }
    });
  });
  const observer = new MutationObserver(() => {
    if (el.querySelector("#video-user-panel[gz_type]") !== null) return;
    const userEl = el.querySelector(".user");
    if (userEl === null) return;
    userEl.appendChild(but);
  });
  observer.observe(el, { childList: true, subtree: true });
};
var videoPlayPageCommon = { getRightVideoDataList: getRightVideoDataList$1, insertTagShieldButton, insertUserProfileShieldButton };const isVideoPlayPage = (url = window.location.href) => {
  return url.includes("www.bilibili.com/video");
};
const selectUserBlocking = async () => {
  const el = await elUtil.findElement(".up-panel-container");
  const vueData = el["__vue__"];
  const { staffInfo, upInfo } = vueData;
  if (staffInfo.length > 1) {
    const list = [];
    for (const { mid: mid2, name: name2 } of staffInfo) {
      list.push({
        label: `用户-name=${name2}-uid=${mid2}`,
        uid: mid2
      });
    }
    eventEmitter.send("sheet-dialog", {
      title: "选择要屏蔽的用户(uid精确)",
      list,
      optionsClick: (item) => {
        ruleUtil.addRulePreciseUid(item.uid).status && eventEmitter.send("通知屏蔽");
        return true;
      }
    });
    return;
  }
  const { mid, name } = upInfo;
  const uid = parseInt(mid);
  eventEmitter.invoke("el-confirm", `用户uid=${uid}-name=${name}`, "uid精确屏蔽方式").then(() => {
    if (uid === -1) {
      eventEmitter.send("el-msg", "该页面数据不存在uid字段");
      return;
    }
    ruleUtil.addRulePreciseUid(uid) && eventEmitter.send("通知屏蔽");
  });
};
const getGetTheVideoListOnTheRight$1 = async () => {
  await elUtil.findElement(".video-page-card-small .b-img img");
  delAd();
  delGameAd();
  const elList = await elUtil.findElements(".rec-list>.video-page-card-small,.video-page-operator-card-small", { interval: 1e3 });
  const nextPlayEl = document.querySelector(".next-play>.video-page-card-small");
  if (nextPlayEl) {
    elList.push(nextPlayEl);
  }
  const list = [];
  for (let el of elList) {
    try {
      const elInfo = el.querySelector(".info");
      const title = elInfo.querySelector(".title").title;
      const name = elInfo.querySelector(".upname .name").textContent.trim();
      const userUrl = elInfo.querySelector(".upname>a").href;
      const uid = urlUtil.getUrlUID(userUrl);
      const playInfo = el.querySelector(".playinfo").innerHTML.trim();
      const videoUrl = el.querySelector(".info>a").href;
      const bv = urlUtil.getUrlBV(videoUrl);
      let nPlayCount = playInfo.match(/<\/svg>(.*)<svg/s)?.[1].trim();
      nPlayCount = strFormatUtil.toPlayCountOrBulletChat(nPlayCount);
      let nBulletChat = playInfo.match(/class="dm".+<\/svg>(.+)$/s)?.[1].trim();
      nBulletChat = strFormatUtil.toPlayCountOrBulletChat(nBulletChat);
      let nDuration = el.querySelector(".duration")?.textContent.trim();
      nDuration = strFormatUtil.timeStringToSeconds(nDuration);
      list.push({
        title,
        userUrl,
        name,
        uid,
        bv,
        nPlayCount,
        nBulletChat,
        nDuration,
        el,
        videoUrl,
        insertionPositionEl: el.querySelector(".playinfo"),
        explicitSubjectEl: elInfo
      });
    } catch (e) {
      console.error("获取右侧视频列表失败:", e);
    }
  }
  return list;
};
const startShieldingVideoList$6 = () => {
  if (localMKData.isDelPlayerPageRightVideoList()) {
    return;
  }
  getGetTheVideoListOnTheRight$1().then((videoList) => {
    for (let videoData of videoList) {
      video_shielding.shieldingVideoDecorated(videoData).catch(() => {
        eventEmitter.send("视频添加屏蔽按钮", { data: videoData, maskingFunc: startShieldingVideoList$6 });
      });
    }
  });
};
const findTheExpandButtonForTheListOnTheRightAndBindTheEvent$2 = () => {
  setTimeout(() => {
    elUtil.findElement(".rec-footer", { interval: 2e3 }).then((el) => {
      console.log("找到右侧视频列表的展开按钮", el);
      el.addEventListener("click", () => {
        startShieldingVideoList$6();
      });
    });
  }, 3e3);
};
const getPlayerVideoList = async () => {
  const elList = await elUtil.findElements(".bpx-player-ending-related>.bpx-player-ending-related-item");
  const data = { list: [], cancelEl: null };
  for (const el of elList) {
    const title = el.querySelector(".bpx-player-ending-related-item-title")?.textContent.trim();
    const cancelEl = el.querySelector(".bpx-player-ending-related-item-cancel");
    if (cancelEl) {
      data.cancelEl = cancelEl;
    }
    data.list.push({
      title,
      el
    });
  }
  return data;
};
const getVideoPlayerEndingPanelEl = async () => {
  return await elUtil.findElement(
    "#bilibili-player .bpx-player-ending-wrap>.bpx-player-ending-panel",
    { interval: 50 }
  );
};
const delPlayerEndingPanelByCss = () => {
  if (!localMKData.isDelPlayerEndingPanel()) {
    elUtil.installStyle("", { type: "id", value: "mk-del-player-ending-panel" });
    return;
  }
  elUtil.installStyle(`
        .bpx-player-ending-wrap>.bpx-player-ending-panel,
        #bilibili-player .bpx-player-ending-wrap
        { display: none !important; }
    `, { type: "id", value: "mk-del-player-ending-panel" });
  eventEmitter.send("打印信息", "已屏蔽播放完推荐层");
};
const setVideoPlayerEnded = async () => {
  const videoEl = await elUtil.findElement("#bilibili-player video, .bpx-player-video video, video[aria-label]");
  const funcStart = async () => {
    const res = await getPlayerVideoList();
    for (let { el, title } of res.list) {
      let matching = ruleMatchingUtil.fuzzyMatch(ruleKeyListData.getTitleArr(), title);
      if (matching !== null) {
        eventEmitter.send("打印信息", `根据-模糊标题-【${matching}】-屏蔽视频:${title}`);
        el.remove();
        continue;
      }
      matching = ruleMatchingUtil.regexMatch(ruleKeyListData.getTitleCanonicalArr(), title);
      if (matching !== null) {
        eventEmitter.send("打印信息", `根据-正则标题-【${matching}】-屏蔽视频:${title}`);
        el.remove();
      }
    }
  };
  videoEl.addEventListener("ended", () => {
    console.log("视频播放结束");
    funcStart();
    if (localMKData.isDelPlayerEndingPanel()) {
      getVideoPlayerEndingPanelEl().then((el) => {
        if (el) el.remove();
        eventEmitter.send("打印信息", "已删除播放页播放器中推荐层");
      });
    }
  });
};
const delAd = () => {
  if (!GM_getValue("isDelPlayerPageAd", false)) {
    return;
  }
  elUtil.findElements("[class|=ad],#slide_ad,.activity-m-v1").then((elList) => {
    for (const el of elList) {
      el.style.display = "none";
    }
    eventEmitter.send("打印信息", "隐藏了播放页的页面广告");
  });
};
const delRightVideoList = () => {
  if (!localMKData.isDelPlayerPageRightVideoList()) {
    elUtil.installStyle("", { type: "id", value: "mk-del-right-video-list" });
    return;
  }
  elUtil.installStyle(`
        .recommend-list-v1,
        #reco_list,
        .video-page-card-small.recommend-list-v1
        { display: none !important; }
    `, { type: "id", value: "mk-del-right-video-list" });
  eventEmitter.send("打印信息", "屏蔽了播放页的右侧推荐列表");
};
const delGameAd = () => {
  if (!GM_getValue("isDelPlayerPageRightGameAd", false)) {
    return;
  }
  elUtil.findElement(".video-page-game-card-small", { timeout: 1e4 }).then((el) => {
    if (el === null) {
      eventEmitter.send("打印信息", "没有找到播放页的右侧游戏推荐");
      return;
    }
    el.remove();
    eventEmitter.send("打印信息", "屏蔽了游戏推荐");
  });
};
const delBottomCommentApp = () => {
  if (!localMKData.isDelBottomComment()) {
    elUtil.installStyle("", { type: "id", value: "mk-del-bottom-comment" });
    return;
  }
  elUtil.installStyle("#commentapp { display: none !important; }", { type: "id", value: "mk-del-bottom-comment" });
  eventEmitter.send("打印信息", "移除了页面底部的评论区");
};
const delElManagement = () => {
  if (localMKData.isDelPlayerPageRightVideoList()) {
    delAd();
  }
  delRightVideoList();
  delBottomCommentApp();
};
const run$2 = () => {
  delElManagement();
  delPlayerEndingPanelByCss();
  setVideoPlayerEnded();
  videoPlayPageCommon.insertTagShieldButton();
};
var videoPlayModel = {
  isVideoPlayPage,
  startShieldingVideoList: startShieldingVideoList$6,
  findTheExpandButtonForTheListOnTheRightAndBindTheEvent: findTheExpandButtonForTheListOnTheRightAndBindTheEvent$2,
  selectUserBlocking,
  run: run$2
};const iscCollectionVideoPlayPage = (url = window.location.href) => {
  return url.includes("www.bilibili.com/list/ml");
};
const getGetTheVideoListOnTheRight = async () => {
  const elList = await elUtil.findElements(".recommend-list-container>.video-card");
  return videoPlayPageCommon.getRightVideoDataList(elList);
};
const startShieldingVideoList$5 = () => {
  getGetTheVideoListOnTheRight().then((videoList) => {
    const css = { right: "123px" };
    for (let videoData of videoList) {
      video_shielding.shieldingVideoDecorated(videoData).catch(() => {
        videoData.cssMap = css;
        eventEmitter.send("视频添加屏蔽按钮", { data: videoData, maskingFunc: startShieldingVideoList$5 });
      });
    }
  });
};
const findTheExpandButtonForTheListOnTheRightAndBindTheEvent$1 = () => {
  setTimeout(() => {
    elUtil.findElement(".rec-footer", { interval: 2e3 }).then((el) => {
      el.addEventListener("click", () => {
        startShieldingVideoList$5();
      });
    });
  }, 3e3);
};
var collectionVideoPlayPageModel = {
  iscCollectionVideoPlayPage,
  startShieldingVideoList: startShieldingVideoList$5,
  findTheExpandButtonForTheListOnTheRightAndBindTheEvent: findTheExpandButtonForTheListOnTheRightAndBindTheEvent$1
};const isVideoPlayWatchLaterPage = (url = location.href) => {
  return url.startsWith("https://www.bilibili.com/list/watchlater");
};
const getRightVideoDataList = async () => {
  const elList = await elUtil.findElements(".recommend-video-card.video-card");
  return videoPlayPageCommon.getRightVideoDataList(elList);
};
const startShieldingVideoList$4 = async () => {
  const videoList = await getRightVideoDataList();
  const css = { right: "123px" };
  for (let videoData of videoList) {
    video_shielding.shieldingVideoDecorated(videoData).catch(() => {
      videoData.cssMap = css;
      eventEmitter.send("视频添加屏蔽按钮", { data: videoData, maskingFunc: startShieldingVideoList$4 });
    });
  }
};
const startDebounceShieldingVideoList = defUtil.debounce(startShieldingVideoList$4, 1e3);
const findTheExpandButtonForTheListOnTheRightAndBindTheEvent = () => {
  elUtil.findElementsAndBindEvents(".rec-footer", startDebounceShieldingVideoList);
};
var videoPlayWatchLater = {
  isVideoPlayWatchLaterPage,
  startDebounceShieldingVideoList,
  findTheExpandButtonForTheListOnTheRightAndBindTheEvent
};var script$7 = {
  data() {
    return {
      shieldingModelShow: true,
      shieldingUseUIDrButShow: false,
      removedShieldingUIDrButShow: false,
      selectUserBlockingButShow: false,
      uid: -1
    };
  },
  methods: {
    async blockCurrentUser() {
      const { name, uid } = await space.getUserInfo();
      this.$confirm(`是否屏蔽当前用户【${name}】uid=【${uid}】`, "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }).then(() => {
        const { status, res } = ruleUtil.addRulePreciseUid(uid);
        this.$alert(res);
        if (status) {
          eventEmitter.send("通知屏蔽");
          this.shieldingUseUIDrButShow = false;
          this.removedShieldingUIDrButShow = true;
        }
      });
    },
    async unblockCurrentUser() {
      const { uid } = await space.getUserInfo();
      ruleUtil.delRUlePreciseUid(uid);
    },
    async selectUserBlocking() {
      await videoPlayModel.selectUserBlocking();
    }
  },
  async created() {
    if (videoPlayModel.isVideoPlayPage() || collectionVideoPlayPageModel.iscCollectionVideoPlayPage() || videoPlayWatchLater.isVideoPlayWatchLaterPage()) {
      this.selectUserBlockingButShow = true;
    }
    if (space.isSpacePage()) {
      this.urlUID = urlUtil.getUrlUID(window.location.href);
      if (ruleKeyListData.getPreciseUidArr().includes(this.urlUID)) {
        this.shieldingModelShow = true;
        this.removedShieldingUIDrButShow = true;
        await this.$alert("当前用户为已标记uid黑名单", "提示");
        return;
      }
      if (await space.isPersonalHomepage()) {
        this.shieldingModelShow = false;
        return;
      }
      this.shieldingModelShow = true;
      this.shieldingUseUIDrButShow = true;
    }
  }
};
const __vue_script__$7 = script$7;
var __vue_render__$7 = function () {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _vm.shieldingModelShow
    ? _c(
        "div",
        {
          staticStyle: {
            display: "flex",
            "flex-direction": "column",
            gap: "6px",
            "align-items": "center",
          },
        },
        [
          _vm.shieldingUseUIDrButShow
            ? _c(
                "el-button",
                {
                  staticClass: "panel-btn panel-btn--secondary",
                  attrs: { round: "" },
                  on: { click: _vm.blockCurrentUser },
                },
                [_vm._v("\n    屏蔽当前用户\n  ")]
              )
            : _vm._e(),
          _vm._v(" "),
          _vm.removedShieldingUIDrButShow
            ? _c(
                "el-button",
                {
                  staticClass: "panel-btn panel-btn--secondary",
                  attrs: { round: "" },
                  on: { click: _vm.unblockCurrentUser },
                },
                [_vm._v("\n    取消屏蔽用户\n  ")]
              )
            : _vm._e(),
          _vm._v(" "),
          _vm.selectUserBlockingButShow
            ? _c(
                "el-button",
                {
                  staticClass: "panel-btn panel-btn--secondary",
                  attrs: { round: "" },
                  on: { click: _vm.selectUserBlocking },
                },
                [_vm._v("\n    屏蔽该UP主\n  ")]
              )
            : _vm._e(),
        ],
        1
      )
    : _vm._e()
};
var __vue_staticRenderFns__$7 = [];
__vue_render__$7._withStripped = true;
  
  const __vue_inject_styles__$7 = function (inject) {
    if (!inject) return
    inject("data-v-2d58cdf5_0", { source: "\n.panel-btn[data-v-2d58cdf5] {\n  font-weight: 500;\n  font-size: 13px;\n  letter-spacing: 0.4px;\n  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);\n  border: none;\n  padding: 8px 16px;\n}\n.panel-btn[data-v-2d58cdf5]:hover {\n  transform: translateY(-1px);\n}\n.panel-btn--secondary[data-v-2d58cdf5] {\n  background: rgba(251, 114, 153, 0.07);\n  color: #FB7299;\n  border: 1px solid rgba(251, 114, 153, 0.18);\n}\n.panel-btn--secondary[data-v-2d58cdf5]:hover {\n  background: rgba(251, 114, 153, 0.13);\n  box-shadow: 0 2px 10px rgba(251, 114, 153, 0.15);\n  color: #FB7299;\n}\n.panel-btn--secondary[data-v-2d58cdf5]:active {\n  transform: translateY(0);\n  background: rgba(251, 114, 153, 0.18);\n}\n", map: {"version":3,"sources":["E:\\something\\AI Agent\\ban bilibili\\BiliBlockFusion\\src\\web\\layout\\views\\shieldingUserView.vue"],"names":[],"mappings":";AA0FA;EACA,gBAAA;EACA,eAAA;EACA,qBAAA;EACA,kDAAA;EACA,YAAA;EACA,iBAAA;AACA;AAEA;EACA,2BAAA;AACA;AAEA;EACA,qCAAA;EACA,cAAA;EACA,2CAAA;AACA;AAEA;EACA,qCAAA;EACA,gDAAA;EACA,cAAA;AACA;AAEA;EACA,wBAAA;EACA,qCAAA;AACA","file":"shieldingUserView.vue","sourcesContent":["<script>\nimport videoPlayModel from \"../../pagesModel/videoPlay/videoPlayModel.js\";\nimport collectionVideoPlayPageModel from \"../../pagesModel/videoPlay/collectionVideoPlayPageModel.js\";\nimport space from \"../../pagesModel/space/space.js\";\nimport ruleKeyListData from \"../../data/ruleKeyListData.js\";\nimport ruleUtil from \"../../utils/ruleUtil.js\";\nimport videoPlayWatchLater from \"../../pagesModel/videoPlay/videoPlayWatchLater.js\";\nimport {eventEmitter} from \"../../model/EventEmitter.js\";\nimport urlUtil from \"../../utils/urlUtil.js\";\n\nexport default {\n  data() {\n    return {\n      shieldingModelShow: true,\n      shieldingUseUIDrButShow: false,\n      removedShieldingUIDrButShow: false,\n      selectUserBlockingButShow: false,\n      uid: -1\n    }\n  },\n  methods: {\n    async blockCurrentUser() {\n      const {name, uid} = await space.getUserInfo()\n      this.$confirm(`是否屏蔽当前用户【${name}】uid=【${uid}】`, '提示', {\n        confirmButtonText: '确定',\n        cancelButtonText: '取消',\n        type: 'warning'\n      }).then(() => {\n        const {status, res} = ruleUtil.addRulePreciseUid(uid);\n        this.$alert(res)\n        if (status) {\n          eventEmitter.send('通知屏蔽');\n          this.shieldingUseUIDrButShow = false\n          this.removedShieldingUIDrButShow = true\n        }\n      })\n    },\n    async unblockCurrentUser() {\n      const {uid} = await space.getUserInfo()\n      ruleUtil.delRUlePreciseUid(uid)\n    },\n    async selectUserBlocking() {\n      await videoPlayModel.selectUserBlocking()\n    }\n  },\n  async created() {\n    if (videoPlayModel.isVideoPlayPage() || collectionVideoPlayPageModel.iscCollectionVideoPlayPage() ||\n        videoPlayWatchLater.isVideoPlayWatchLaterPage()) {\n      this.selectUserBlockingButShow = true\n    }\n    if (space.isSpacePage()) {\n      this.urlUID = urlUtil.getUrlUID(window.location.href);\n      if (ruleKeyListData.getPreciseUidArr().includes(this.urlUID)) {\n        this.shieldingModelShow = true\n        this.removedShieldingUIDrButShow = true\n        await this.$alert('当前用户为已标记uid黑名单', '提示');\n        return;\n      }\n      if (await space.isPersonalHomepage()) {\n        this.shieldingModelShow = false\n        return;\n      }\n      this.shieldingModelShow = true\n      this.shieldingUseUIDrButShow = true\n    }\n  }\n}\n</script>\n\n<template>\n  <div v-if=\"shieldingModelShow\" style=\"display:flex;flex-direction:column;gap:6px;align-items:center;\">\n    <el-button v-if=\"shieldingUseUIDrButShow\"\n               class=\"panel-btn panel-btn--secondary\" round\n               @click=\"blockCurrentUser\">\n      屏蔽当前用户\n    </el-button>\n    <el-button v-if=\"removedShieldingUIDrButShow\"\n               class=\"panel-btn panel-btn--secondary\" round\n               @click=\"unblockCurrentUser\">\n      取消屏蔽用户\n    </el-button>\n    <el-button v-if=\"selectUserBlockingButShow\"\n               class=\"panel-btn panel-btn--secondary\" round\n               @click=\"selectUserBlocking\">\n      屏蔽该UP主\n    </el-button>\n  </div>\n</template>\n\n<style scoped>\n.panel-btn {\n  font-weight: 500;\n  font-size: 13px;\n  letter-spacing: 0.4px;\n  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);\n  border: none;\n  padding: 8px 16px;\n}\n\n.panel-btn:hover {\n  transform: translateY(-1px);\n}\n\n.panel-btn--secondary {\n  background: rgba(251, 114, 153, 0.07);\n  color: #FB7299;\n  border: 1px solid rgba(251, 114, 153, 0.18);\n}\n\n.panel-btn--secondary:hover {\n  background: rgba(251, 114, 153, 0.13);\n  box-shadow: 0 2px 10px rgba(251, 114, 153, 0.15);\n  color: #FB7299;\n}\n\n.panel-btn--secondary:active {\n  transform: translateY(0);\n  background: rgba(251, 114, 153, 0.18);\n}\n</style>\n"]}, media: undefined });
  };
  
  const __vue_scope_id__$7 = "data-v-2d58cdf5";
  
  const __vue_module_identifier__$7 = undefined;
  
  const __vue_is_functional_template__$7 = false;
  
  
  
  
  
  const __vue_component__$7 = normalizeComponent(
    { render: __vue_render__$7, staticRenderFns: __vue_staticRenderFns__$7 },
    __vue_inject_styles__$7,
    __vue_script__$7,
    __vue_scope_id__$7,
    __vue_is_functional_template__$7,
    __vue_module_identifier__$7,
    false,
    createInjector);var script$6 = {
  components: {
    shieldingUserView: __vue_component__$7
  },
  data() {
    return {
      panelShow: localMKData.isShowRightTopMainButSwitch()
    };
  },
  methods: {
    showBut() {
      eventEmitter.send("主面板开关");
    },
    handleMouseEnter() {
      this.$refs.divRef.style.transform = "translateX(0)";
    },
    handleMouseLeave() {
      this.$refs.divRef.style.transform = "translateX(80%)";
    }
  },
  created() {
    eventEmitter.on("显隐主面板开关", (bool) => {
      this.panelShow = bool;
    });
  },
  mounted() {
    this.$refs.divRef.style.transform = "translateX(80%)";
  }
};
const __vue_script__$6 = script$6;
var __vue_render__$6 = function () {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _c(
    "div",
    {
      directives: [
        {
          name: "show",
          rawName: "v-show",
          value: _vm.panelShow,
          expression: "panelShow",
        },
      ],
      ref: "divRef",
      staticClass: "floating-panel",
      on: {
        mouseenter: _vm.handleMouseEnter,
        mouseleave: _vm.handleMouseLeave,
      },
    },
    [
      _c(
        "el-button",
        {
          staticClass: "panel-btn panel-btn--primary",
          attrs: { round: "" },
          on: { click: _vm.showBut },
        },
        [_vm._v("\n    主面板\n  ")]
      ),
      _vm._v(" "),
      _c("shieldingUserView"),
    ],
    1
  )
};
var __vue_staticRenderFns__$6 = [];
__vue_render__$6._withStripped = true;
  
  const __vue_inject_styles__$6 = function (inject) {
    if (!inject) return
    inject("data-v-dd470ade_0", { source: "\n.floating-panel[data-v-dd470ade] {\n  position: fixed;\n  z-index: 9000;\n  right: 0;\n  top: 13%;\n  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);\n\n  \n  background: rgba(255, 255, 255, 0.82);\n  backdrop-filter: blur(20px) saturate(180%);\n  -webkit-backdrop-filter: blur(20px) saturate(180%);\n  border-radius: 14px 0 0 14px;\n  box-shadow:\n    0 8px 32px rgba(0, 0, 0, 0.06),\n    0 2px 8px rgba(0, 0, 0, 0.03),\n    inset 0 1px 0 rgba(255, 255, 255, 0.7);\n  border: 1px solid rgba(0, 0, 0, 0.05);\n\n  padding: 10px 8px;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  gap: 8px;\n}\n\n\n.panel-btn[data-v-dd470ade] {\n  font-weight: 500;\n  font-size: 13px;\n  letter-spacing: 0.4px;\n  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);\n  border: none;\n  padding: 8px 18px;\n}\n.panel-btn[data-v-dd470ade]:hover {\n  transform: translateY(-1px);\n}\n.panel-btn--primary[data-v-dd470ade] {\n  background: linear-gradient(135deg, #FB7299 0%, #fc8aab 100%);\n  color: #fff;\n  box-shadow: 0 2px 8px rgba(251, 114, 153, 0.3);\n}\n.panel-btn--primary[data-v-dd470ade]:hover {\n  background: linear-gradient(135deg, #FB7299 0%, #fd9bb7 100%);\n  box-shadow: 0 4px 16px rgba(251, 114, 153, 0.4);\n  color: #fff;\n}\n.panel-btn--primary[data-v-dd470ade]:active {\n  transform: translateY(0);\n  box-shadow: 0 1px 4px rgba(251, 114, 153, 0.3);\n}\n", map: {"version":3,"sources":["E:\\something\\AI Agent\\ban bilibili\\BiliBlockFusion\\src\\web\\layout\\views\\rightFloatingLayoutView.vue"],"names":[],"mappings":";AAmDA;EACA,eAAA;EACA,aAAA;EACA,QAAA;EACA,QAAA;EACA,uDAAA;;EAEA,mBAAA;EACA,qCAAA;EACA,0CAAA;EACA,kDAAA;EACA,4BAAA;EACA;;;0CAGA;EACA,qCAAA;;EAEA,iBAAA;EACA,aAAA;EACA,sBAAA;EACA,mBAAA;EACA,QAAA;AACA;;AAEA,0BAAA;AACA;EACA,gBAAA;EACA,eAAA;EACA,qBAAA;EACA,kDAAA;EACA,YAAA;EACA,iBAAA;AACA;AAEA;EACA,2BAAA;AACA;AAEA;EACA,6DAAA;EACA,WAAA;EACA,8CAAA;AACA;AAEA;EACA,6DAAA;EACA,+CAAA;EACA,WAAA;AACA;AAEA;EACA,wBAAA;EACA,8CAAA;AACA","file":"rightFloatingLayoutView.vue","sourcesContent":["<script>\nimport localMKData from \"../../data/localMKData.js\";\nimport {eventEmitter} from \"../../model/EventEmitter.js\";\nimport shieldingUserView from \"./shieldingUserView.vue\";\n\n\nexport default {\n  components: {\n    shieldingUserView,\n  },\n  data() {\n    return {\n      //布局显示开关\n      panelShow: localMKData.isShowRightTopMainButSwitch(),\n    }\n  },\n  methods: {\n    showBut() {\n      eventEmitter.send('主面板开关')\n    },\n    handleMouseEnter() {\n      this.$refs.divRef.style.transform = \"translateX(0)\";\n    },\n    handleMouseLeave() {\n      this.$refs.divRef.style.transform = 'translateX(80%)'\n    }\n  },\n  created() {\n    eventEmitter.on('显隐主面板开关', (bool) => {\n      this.panelShow = bool\n    })\n  },\n  mounted() {\n    this.$refs.divRef.style.transform = 'translateX(80%)'\n  }\n}\n</script>\n\n<template>\n  <div v-show=\"panelShow\" ref=\"divRef\" class=\"floating-panel\"\n       @mouseenter=\"handleMouseEnter\" @mouseleave=\"handleMouseLeave\">\n    <el-button class=\"panel-btn panel-btn--primary\" round @click=\"showBut\">\n      主面板\n    </el-button>\n    <shieldingUserView/>\n  </div>\n</template>\n\n<style scoped>\n.floating-panel {\n  position: fixed;\n  z-index: 9000;\n  right: 0;\n  top: 13%;\n  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);\n\n  \n  background: rgba(255, 255, 255, 0.82);\n  backdrop-filter: blur(20px) saturate(180%);\n  -webkit-backdrop-filter: blur(20px) saturate(180%);\n  border-radius: 14px 0 0 14px;\n  box-shadow:\n    0 8px 32px rgba(0, 0, 0, 0.06),\n    0 2px 8px rgba(0, 0, 0, 0.03),\n    inset 0 1px 0 rgba(255, 255, 255, 0.7);\n  border: 1px solid rgba(0, 0, 0, 0.05);\n\n  padding: 10px 8px;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  gap: 8px;\n}\n\n\n.panel-btn {\n  font-weight: 500;\n  font-size: 13px;\n  letter-spacing: 0.4px;\n  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);\n  border: none;\n  padding: 8px 18px;\n}\n\n.panel-btn:hover {\n  transform: translateY(-1px);\n}\n\n.panel-btn--primary {\n  background: linear-gradient(135deg, #FB7299 0%, #fc8aab 100%);\n  color: #fff;\n  box-shadow: 0 2px 8px rgba(251, 114, 153, 0.3);\n}\n\n.panel-btn--primary:hover {\n  background: linear-gradient(135deg, #FB7299 0%, #fd9bb7 100%);\n  box-shadow: 0 4px 16px rgba(251, 114, 153, 0.4);\n  color: #fff;\n}\n\n.panel-btn--primary:active {\n  transform: translateY(0);\n  box-shadow: 0 1px 4px rgba(251, 114, 153, 0.3);\n}\n</style>\n"]}, media: undefined });
  };
  
  const __vue_scope_id__$6 = "data-v-dd470ade";
  
  const __vue_module_identifier__$6 = undefined;
  
  const __vue_is_functional_template__$6 = false;
  
  
  
  
  
  const __vue_component__$6 = normalizeComponent(
    { render: __vue_render__$6, staticRenderFns: __vue_staticRenderFns__$6 },
    __vue_inject_styles__$6,
    __vue_script__$6,
    __vue_scope_id__$6,
    __vue_is_functional_template__$6,
    __vue_module_identifier__$6,
    false,
    createInjector);var script$5 = {
  data() {
    return {
      requestFrequencyVal: getRequestFrequencyVal(),
      bOnlyTheHomepageIsBlocked: globalValue.bOnlyTheHomepageIsBlocked,
      isEffectiveUIDShieldingOnlyVideoVal: isEffectiveUIDShieldingOnlyVideo(),
      bFuzzyAndRegularMatchingWordsToLowercase: localMKData.bFuzzyAndRegularMatchingWordsToLowercase(),
      isDisableNetRequestsBvVideoInfo: localMKData.isDisableNetRequestsBvVideoInfo(),
      hideBlockButtonVal: hideBlockButtonGm(),
      isCheckNestedDynamicContentVal: isCheckNestedDynamicContentGm()
    };
  },
  methods: {},
  watch: {
    bOnlyTheHomepageIsBlocked(newVal) {
      GM_setValue("bOnlyTheHomepageIsBlocked", newVal === true);
    },
    bFuzzyAndRegularMatchingWordsToLowercase(newVal) {
      GM_setValue("bFuzzyAndRegularMatchingWordsToLowercase", newVal === true);
    },
    isDisableNetRequestsBvVideoInfo(b) {
      GM_setValue("isDisableNetRequestsBvVideoInfo", b);
    },
    isEffectiveUIDShieldingOnlyVideoVal(b) {
      GM_setValue("is_effective_uid_shielding_only_video", b);
    },
    requestFrequencyVal(n) {
      GM_setValue("requestFrequencyVal", n > 0 && n <= 5 ? n : 0.2);
      bvRequestQueue.setAllRequestInterval(n * 1e3);
    },
    hideBlockButtonVal(n) {
      GM_setValue("hide_block_button_gm", n);
      if (n) {
        document.body.querySelectorAll(".gz_shielding_button").forEach((el) => el.remove());
      }
    },
    isCheckNestedDynamicContentVal(n) {
      GM_setValue("is_check_nested_dynamic_content_gm", n);
    }
  },
  created() {
    eventEmitter.on("更新根据bv号网络请求获取视频信息状态", (b) => {
      this.isDisableNetRequestsBvVideoInfo = b;
    });
  }
};
const __vue_script__$5 = script$5;
var __vue_render__$5 = function () {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _c(
    "div",
    [
      _c(
        "el-card",
        {
          attrs: { shadow: "never" },
          scopedSlots: _vm._u([
            {
              key: "header",
              fn: function () {
                return [_vm._v("常规")]
              },
              proxy: true,
            },
          ]),
        },
        [
          _vm._v(" "),
          _c("el-switch", {
            attrs: { "active-text": "仅首页屏蔽生效屏蔽" },
            model: {
              value: _vm.bOnlyTheHomepageIsBlocked,
              callback: function ($$v) {
                _vm.bOnlyTheHomepageIsBlocked = $$v;
              },
              expression: "bOnlyTheHomepageIsBlocked",
            },
          }),
          _vm._v(" "),
          _c(
            "el-tooltip",
            {
              attrs: {
                content:
                  "模糊和正则匹配时，将匹配词转小写与规则值匹配。修改后刷新页面生效",
              },
            },
            [
              _c("el-switch", {
                attrs: { "active-text": "模糊和正则匹配词转小写" },
                model: {
                  value: _vm.bFuzzyAndRegularMatchingWordsToLowercase,
                  callback: function ($$v) {
                    _vm.bFuzzyAndRegularMatchingWordsToLowercase = $$v;
                  },
                  expression: "bFuzzyAndRegularMatchingWordsToLowercase",
                },
              }),
            ],
            1
          ),
          _vm._v(" "),
          _c(
            "el-tooltip",
            { attrs: { content: "改动实时生效" } },
            [
              _c("el-switch", {
                attrs: { "active-text": "仅生效UID屏蔽(限视频)" },
                model: {
                  value: _vm.isEffectiveUIDShieldingOnlyVideoVal,
                  callback: function ($$v) {
                    _vm.isEffectiveUIDShieldingOnlyVideoVal = $$v;
                  },
                  expression: "isEffectiveUIDShieldingOnlyVideoVal",
                },
              }),
            ],
            1
          ),
          _vm._v(" "),
          _c("el-switch", {
            attrs: { "active-text": "不显示屏蔽按钮" },
            model: {
              value: _vm.hideBlockButtonVal,
              callback: function ($$v) {
                _vm.hideBlockButtonVal = $$v;
              },
              expression: "hideBlockButtonVal",
            },
          }),
          _vm._v(" "),
          _c("el-switch", {
            attrs: { "active-text": "动态项屏蔽检查嵌套动态" },
            model: {
              value: _vm.isCheckNestedDynamicContentVal,
              callback: function ($$v) {
                _vm.isCheckNestedDynamicContentVal = $$v;
              },
              expression: "isCheckNestedDynamicContentVal",
            },
          }),
        ],
        1
      ),
      _vm._v(" "),
      _c(
        "el-card",
        {
          attrs: { shadow: "never" },
          scopedSlots: _vm._u([
            {
              key: "header",
              fn: function () {
                return [
                  _c("span", [_vm._v("网络请求频率(单位秒)")]),
                  _vm._v(" "),
                  _c("div", [
                    _vm._v(
                      "如设置0，则为不限制，比如设置2，则为每个请求之间隔2秒，可有效降低对B站api接口的压力，降低风控"
                    ),
                  ]),
                  _vm._v(" "),
                  _c("div", [_vm._v("注意：设置过低可能会导致部分接口风控")]),
                  _vm._v(" "),
                  _c("div", [
                    _vm._v(
                      "如接口风控了请先勾选下面的【禁用根据bv号网络请求获取视频信息】"
                    ),
                  ]),
                  _vm._v(" "),
                  _c("div", [_vm._v("修改下一轮请求结束后生效")]),
                ]
              },
              proxy: true,
            },
          ]),
        },
        [
          _vm._v(" "),
          _c("el-switch", {
            attrs: { "active-text": "禁用根据bv号网络请求获取视频信息" },
            model: {
              value: _vm.isDisableNetRequestsBvVideoInfo,
              callback: function ($$v) {
                _vm.isDisableNetRequestsBvVideoInfo = $$v;
              },
              expression: "isDisableNetRequestsBvVideoInfo",
            },
          }),
          _vm._v(" "),
          _c("el-slider", {
            attrs: {
              disabled: _vm.isDisableNetRequestsBvVideoInfo,
              max: 5,
              step: 0.1,
              "show-input": "",
              "show-stops": "",
            },
            model: {
              value: _vm.requestFrequencyVal,
              callback: function ($$v) {
                _vm.requestFrequencyVal = $$v;
              },
              expression: "requestFrequencyVal",
            },
          }),
        ],
        1
      ),
    ],
    1
  )
};
var __vue_staticRenderFns__$5 = [];
__vue_render__$5._withStripped = true;
  
  const __vue_inject_styles__$5 = undefined;
  
  const __vue_scope_id__$5 = undefined;
  
  const __vue_module_identifier__$5 = undefined;
  
  const __vue_is_functional_template__$5 = false;
  
  
  
  
  
  
  
  const __vue_component__$5 = normalizeComponent(
    { render: __vue_render__$5, staticRenderFns: __vue_staticRenderFns__$5 },
    __vue_inject_styles__$5,
    __vue_script__$5,
    __vue_scope_id__$5,
    __vue_is_functional_template__$5,
    __vue_module_identifier__$5,
    false,
    undefined);function exportSettings() {
  try {
    const exportData = {};
    const keysB = [
      "title",
      "titleCanonical",
      "name",
      "nameCanonical",
      "precise_name",
      "videoTag",
      "precise_videoTag",
      "videoTagCanonical",
      "videoTag_precise_combination",
      "precise_uid",
      "precise_uid_white",
      "commentOn",
      "commentOnCanonical",
      "signature",
      "signatureCanonical",
      "videoDesc",
      "videoDescCanonical",
      "dynamic",
      "dynamicCanonical",
      "dynamic_video",
      "dynamic_videoCanonical",
      "precise_avatarPendantName",
      "avatarPendantName",
      "precise_decoration_id",
      "precise_decoration_collection_id",
      "argue_msg",
      "argue_msg_precise",
      "videoPartition",
      "videoPartitionCanonical"
    ];
    const settingKeysB = [
      "blockVerticalVideo",
      "is_up_owner_exclusive",
      "blockFollowed",
      "genderRadioVal",
      "vipTypeRadioVal",
      "is_senior_member",
      "copyrightRadioVal",
      "is_senior_member_only",
      "video_like_rate",
      "video_like_rate_blocking_status",
      "coin_likes_ratio_rate",
      "coin_likes_ratio_rate_blocking_status",
      "interactive_rate",
      "interactive_rate_blocking_status",
      "triple_rate",
      "triple_rate_blocking_status",
      "minimum_play_gm",
      "is_minimum_play_gm",
      "maximum_play_gm",
      "is_maximum_play_gm",
      "minimum_barrage_gm",
      "is_minimum_barrage_gm",
      "maximum_barrage_gm",
      "is_maximum_barrage_gm",
      "minimum_duration_gm",
      "is_minimum_duration_gm",
      "maximum_duration_gm",
      "is_maximum_duration_gm",
      "minimum_user_level_video_gm",
      "is_enable_minimum_user_level_video_gm",
      "maximum_user_level_video_gm",
      "is_enable_maximum_user_level_video_gm",
      "minimum_user_level_comment_gm",
      "is_enable_minimum_user_level_comment_gm",
      "maximum_user_level_comment_gm",
      "is_enable_maximum_user_level_comment_gm",
      "is_fans_num_blocking_status_gm",
      "limitation_fan_sum_gm",
      "is_limitation_video_submit_status_gm",
      "limitation_video_submit_sum_gm",
      "uid_range_masking",
      "uid_range_masking_status",
      "time_range_masking",
      "time_range_masking_status",
      "is_videos_in_featured_comments_blocked_gm",
      "is_followers_7_days_only_videos_blocked_gm",
      "is_comment_disabled_videos_blocked_gm",
      "favorite_coin_ratio",
      "favorite_coin_ratio_blocking",
      "block_video_partitions",
      "overlay_mode",
      "hide_video_mode",
      "overlay_only_type",
      "hide_non_video_elements",
      "block_trending",
      "blocked_trending_items",
      "trending_use_regex",
      "hide_blocked_words",
      "console_output_log",
      "substitute_words",
      "enable_replacement_processing",
      "is_hide_hot_searches_panel_gm",
      "is_hide_search_history_panel_gm",
      "is_hide_carousel_image_gm",
      "is_hide_home_top_header_banner_image_gm",
      "is_hide_home_top_header_channel_gm"
    ];
    for (const key of keysB) {
      const val = GM_getValue(key, null);
      if (val !== null && val !== void 0) {
        exportData[key] = val;
      }
    }
    for (const key of settingKeysB) {
      exportData[key] = GM_getValue(key, void 0);
    }
    const blockedParam = GM_getValue("GM_blockedParameter", null);
    if (blockedParam) {
      exportData["GM_blockedParameter"] = blockedParam;
    }
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `BiliBlockFusion_Config_${( new Date()).toISOString().slice(0, 19).replace(/:/g, "-")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return { success: true, message: "设置导出成功" };
  } catch (error) {
    console.error("导出设置时出错:", error);
    return { success: false, message: "导出失败: " + error.message };
  }
}
function importSettings() {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async (event) => {
      const file = event.target.files[0];
      if (!file) {
        resolve({ success: false, message: "未选择文件" });
        return;
      }
      try {
        const fileContent = await new Promise((res, rej) => {
          const reader = new FileReader();
          reader.onload = (e) => res(e.target.result);
          reader.onerror = (e) => rej(e.target.error);
          reader.readAsText(file);
        });
        const importedData = JSON.parse(fileContent);
        if (!importedData || typeof importedData !== "object") {
          throw new Error("无效的配置文件格式");
        }
        let count = 0;
        for (const [key, value] of Object.entries(importedData)) {
          if (key === "GM_blockedParameter") {
            GM_setValue(key, value);
            count++;
            continue;
          }
          GM_setValue(key, value);
          count++;
        }
        resolve({ success: true, message: `成功导入 ${count} 项设置，请刷新页面生效` });
      } catch (error) {
        console.error("导入设置时出错:", error);
        resolve({ success: false, message: "导入失败: 文件格式错误" });
      }
    };
    input.click();
  });
}var script$4 = {
  data() {
    return {
      hideVideoModeVal: isHideVideoMode(),
      hideNonVideoElementsVal: isHideNonVideoElements(),
      blockTrendingVal: isBlockTrending(),
      hideBlockedWordsVal: isHideBlockedWords(),
      consoleOutputLogVal: isConsoleOutputLog(),
      overlayOnlyTypeVal: getOverlayOnlyType(),
      blockedTrendingItemsVal: getBlockedTrendingItems().join("\n"),
      trendingUseRegexVal: isTrendingUseRegex()
    };
  },
  methods: {
    async handleExport() {
      const result = exportSettings();
      if (result.success) {
        this.$message.success(result.message);
      } else {
        this.$message.error(result.message);
      }
    },
    async handleImport() {
      const result = await importSettings();
      if (result.success) {
        this.$message.success(result.message);
      } else {
        this.$message.error(result.message);
      }
    },
    updateTrendingItems() {
      const items = this.blockedTrendingItemsVal.split("\n").map((s) => s.trim()).filter((s) => s.length > 0);
      GM_setValue("blocked_trending_items", items);
      this.$message.success("热搜屏蔽项已更新");
    }
  },
  watch: {
    hideVideoModeVal(newVal) {
      GM_setValue("hide_video_mode", newVal);
    },
    hideNonVideoElementsVal(newVal) {
      GM_setValue("hide_non_video_elements", newVal);
    },
    blockTrendingVal(newVal) {
      GM_setValue("block_trending", newVal);
    },
    hideBlockedWordsVal(newVal) {
      GM_setValue("hide_blocked_words", newVal);
    },
    consoleOutputLogVal(newVal) {
      GM_setValue("console_output_log", newVal);
    },
    overlayOnlyTypeVal(newVal) {
      GM_setValue("overlay_only_type", newVal);
    },
    trendingUseRegexVal(newVal) {
      GM_setValue("trending_use_regex", newVal);
    }
  }
};
const __vue_script__$4 = script$4;
var __vue_render__$4 = function () {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _c(
    "div",
    [
      _c(
        "el-card",
        {
          attrs: { shadow: "never" },
          scopedSlots: _vm._u([
            {
              key: "header",
              fn: function () {
                return [_c("span", [_vm._v("屏蔽方式")])]
              },
              proxy: true,
            },
          ]),
        },
        [
          _vm._v(" "),
          _c(
            "div",
            { staticStyle: { "margin-bottom": "10px" } },
            [
              _c(
                "el-radio-group",
                {
                  attrs: { size: "small" },
                  model: {
                    value: _vm.hideVideoModeVal,
                    callback: function ($$v) {
                      _vm.hideVideoModeVal = $$v;
                    },
                    expression: "hideVideoModeVal",
                  },
                },
                [
                  _c("el-radio-button", { attrs: { label: false } }, [
                    _vm._v("叠加层模式"),
                  ]),
                  _vm._v(" "),
                  _c("el-radio-button", { attrs: { label: true } }, [
                    _vm._v("隐藏模式"),
                  ]),
                ],
                1
              ),
            ],
            1
          ),
          _vm._v(" "),
          _c(
            "el-tooltip",
            { attrs: { content: "叠加层上仅显示屏蔽类型，不显示具体匹配词" } },
            [
              _c("el-switch", {
                attrs: { "active-text": "叠加层仅显示类型" },
                model: {
                  value: _vm.overlayOnlyTypeVal,
                  callback: function ($$v) {
                    _vm.overlayOnlyTypeVal = $$v;
                  },
                  expression: "overlayOnlyTypeVal",
                },
              }),
            ],
            1
          ),
        ],
        1
      ),
      _vm._v(" "),
      _c(
        "el-card",
        {
          attrs: { shadow: "never" },
          scopedSlots: _vm._u([
            {
              key: "header",
              fn: function () {
                return [_c("span", [_vm._v("页面元素")])]
              },
              proxy: true,
            },
          ]),
        },
        [
          _vm._v(" "),
          _c(
            "el-tooltip",
            {
              attrs: {
                content: "隐藏首页/搜索页/播放页的广告、直播、课堂等非视频卡片",
              },
            },
            [
              _c("el-switch", {
                attrs: { "active-text": "隐藏非视频元素" },
                model: {
                  value: _vm.hideNonVideoElementsVal,
                  callback: function ($$v) {
                    _vm.hideNonVideoElementsVal = $$v;
                  },
                  expression: "hideNonVideoElementsVal",
                },
              }),
            ],
            1
          ),
          _vm._v(" "),
          _c(
            "el-tooltip",
            { attrs: { content: "隐藏首页热搜榜中被规则匹配的条目" } },
            [
              _c("el-switch", {
                attrs: { "active-text": "屏蔽热搜项" },
                model: {
                  value: _vm.blockTrendingVal,
                  callback: function ($$v) {
                    _vm.blockTrendingVal = $$v;
                  },
                  expression: "blockTrendingVal",
                },
              }),
            ],
            1
          ),
          _vm._v(" "),
          _c(
            "el-tooltip",
            { attrs: { content: "在屏蔽区域隐藏匹配到的屏蔽词显示" } },
            [
              _c("el-switch", {
                attrs: { "active-text": "隐藏屏蔽词" },
                model: {
                  value: _vm.hideBlockedWordsVal,
                  callback: function ($$v) {
                    _vm.hideBlockedWordsVal = $$v;
                  },
                  expression: "hideBlockedWordsVal",
                },
              }),
            ],
            1
          ),
        ],
        1
      ),
      _vm._v(" "),
      _vm.blockTrendingVal
        ? _c(
            "el-card",
            {
              attrs: { shadow: "never" },
              scopedSlots: _vm._u(
                [
                  {
                    key: "header",
                    fn: function () {
                      return [_c("span", [_vm._v("热搜屏蔽设置")])]
                    },
                    proxy: true,
                  },
                ],
                null,
                false,
                669079818
              ),
            },
            [
              _vm._v(" "),
              _c(
                "el-tooltip",
                { attrs: { content: "启用后热搜项匹配使用正则表达式" } },
                [
                  _c("el-switch", {
                    attrs: { "active-text": "启用正则匹配" },
                    model: {
                      value: _vm.trendingUseRegexVal,
                      callback: function ($$v) {
                        _vm.trendingUseRegexVal = $$v;
                      },
                      expression: "trendingUseRegexVal",
                    },
                  }),
                ],
                1
              ),
              _vm._v(" "),
              _c(
                "div",
                { staticStyle: { "margin-top": "12px" } },
                [
                  _c("div", [_vm._v("热搜屏蔽项（每行一个）：")]),
                  _vm._v(" "),
                  _c("el-input", {
                    attrs: {
                      type: "textarea",
                      rows: 5,
                      placeholder: "每行输入一个热搜屏蔽词",
                    },
                    on: { blur: _vm.updateTrendingItems },
                    model: {
                      value: _vm.blockedTrendingItemsVal,
                      callback: function ($$v) {
                        _vm.blockedTrendingItemsVal = $$v;
                      },
                      expression: "blockedTrendingItemsVal",
                    },
                  }),
                ],
                1
              ),
            ],
            1
          )
        : _vm._e(),
      _vm._v(" "),
      _c(
        "el-card",
        {
          attrs: { shadow: "never" },
          scopedSlots: _vm._u([
            {
              key: "header",
              fn: function () {
                return [_c("span", [_vm._v("调试")])]
              },
              proxy: true,
            },
          ]),
        },
        [
          _vm._v(" "),
          _c(
            "el-tooltip",
            { attrs: { content: "在浏览器控制台输出屏蔽日志" } },
            [
              _c("el-switch", {
                attrs: { "active-text": "控制台输出日志" },
                model: {
                  value: _vm.consoleOutputLogVal,
                  callback: function ($$v) {
                    _vm.consoleOutputLogVal = $$v;
                  },
                  expression: "consoleOutputLogVal",
                },
              }),
            ],
            1
          ),
        ],
        1
      ),
      _vm._v(" "),
      _c(
        "el-card",
        {
          attrs: { shadow: "never" },
          scopedSlots: _vm._u([
            {
              key: "header",
              fn: function () {
                return [_c("span", [_vm._v("设置导入/导出")])]
              },
              proxy: true,
            },
          ]),
        },
        [
          _vm._v(" "),
          _c(
            "el-button",
            { attrs: { type: "primary" }, on: { click: _vm.handleExport } },
            [_vm._v("导出设置 (JSON)")]
          ),
          _vm._v(" "),
          _c(
            "el-button",
            { attrs: { type: "warning" }, on: { click: _vm.handleImport } },
            [_vm._v("导入设置 (JSON)")]
          ),
        ],
        1
      ),
    ],
    1
  )
};
var __vue_staticRenderFns__$4 = [];
__vue_render__$4._withStripped = true;
  
  const __vue_inject_styles__$4 = undefined;
  
  const __vue_scope_id__$4 = undefined;
  
  const __vue_module_identifier__$4 = undefined;
  
  const __vue_is_functional_template__$4 = false;
  
  
  
  
  
  
  
  const __vue_component__$4 = normalizeComponent(
    { render: __vue_render__$4, staticRenderFns: __vue_staticRenderFns__$4 },
    __vue_inject_styles__$4,
    __vue_script__$4,
    __vue_scope_id__$4,
    __vue_is_functional_template__$4,
    __vue_module_identifier__$4,
    false,
    undefined);var script$3 = {
  data() {
    return {
      outputInfoArr: []
    };
  },
  methods: {
    clearInfoBut() {
      this.$confirm("是否清空信息", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }).then(() => {
        this.outputInfoArr = [];
        this.$notify({ message: "已清空信息", type: "success" });
      });
    },
    addEntry(entry) {
      if (entry.id) {
        const idx = this.outputInfoArr.findIndex((item) => item.id === entry.id);
        if (idx !== -1) {
          const item = this.outputInfoArr[idx];
          item.count++;
          item.time = defUtil.toTimeString();
          this.outputInfoArr.splice(idx, 1);
          this.outputInfoArr.unshift(item);
          return;
        }
      }
      if (entry.content !== void 0) {
        const idx = this.outputInfoArr.findIndex((item) => item.content === entry.content);
        if (idx !== -1) {
          const item = this.outputInfoArr[idx];
          item.count++;
          item.time = defUtil.toTimeString();
          this.outputInfoArr.splice(idx, 1);
          this.outputInfoArr.unshift(item);
          return;
        }
      }
      entry.time = defUtil.toTimeString();
      entry.count = 1;
      this.outputInfoArr.unshift(entry);
    }
  },
  created() {
    eventEmitter.on("打印信息", (content) => {
      this.addEntry({ category: "info", content: content.replace(/<[^>]*>/g, "") });
    });
    eventEmitter.on("event-update-out-info", (data) => {
      this.addEntry({ category: "info", id: data.id, content: data.msg });
    });
    eventEmitter.on("event-打印屏蔽视频信息", (type, matching, videoData) => {
      const { name, uid, title, videoUrl } = videoData;
      this.addEntry({
        category: "video",
        id: `v-${uid}-${title}`,
        ruleType: type,
        matching: matching || "",
        userName: name,
        uid,
        content: title,
        contentUrl: videoUrl
      });
    });
    eventEmitter.on("屏蔽评论信息", (type, matching, commentData) => {
      const { name, uid, content } = commentData;
      this.addEntry({
        category: "comment",
        id: `c-${uid}-${(content || "").substring(0, 30)}`,
        ruleType: type,
        matching: matching || "",
        userName: name,
        uid,
        content
      });
    });
    eventEmitter.on("正则匹配时异常", (errorData) => {
      const { msg, e } = errorData;
      this.addEntry({ category: "error", content: msg });
      console.error(msg);
      throw new Error(e);
    });
  }
};
const __vue_script__$3 = script$3;
var __vue_render__$3 = function () {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _c(
    "div",
    { staticClass: "output-info-container" },
    [
      _c(
        "el-card",
        {
          attrs: { shadow: "never" },
          scopedSlots: _vm._u([
            {
              key: "header",
              fn: function () {
                return [
                  _c(
                    "div",
                    { staticClass: "output-header" },
                    [
                      _c("span", [_vm._v("屏蔽日志")]),
                      _vm._v(" "),
                      _c(
                        "el-button",
                        {
                          attrs: { type: "warning", size: "small" },
                          on: { click: _vm.clearInfoBut },
                        },
                        [_vm._v("清空")]
                      ),
                    ],
                    1
                  ),
                ]
              },
              proxy: true,
            },
          ]),
        },
        [
          _vm._v(" "),
          _vm.outputInfoArr.length === 0
            ? _c("div", { staticClass: "output-empty" }, [
                _vm._v("暂无屏蔽日志"),
              ])
            : _c(
                "div",
                { staticClass: "output-log-list" },
                _vm._l(_vm.outputInfoArr, function (item, i) {
                  return _c(
                    "div",
                    { key: i, staticClass: "log-entry" },
                    [
                      _c("span", { staticClass: "log-time" }, [
                        _vm._v(_vm._s(item.time)),
                      ]),
                      _vm._v(" "),
                      item.category === "video"
                        ? _c(
                            "el-tag",
                            {
                              staticClass: "log-tag",
                              attrs: {
                                size: "mini",
                                type: "primary",
                                effect: "plain",
                              },
                            },
                            [_vm._v(_vm._s(item.ruleType))]
                          )
                        : item.category === "comment"
                        ? _c(
                            "el-tag",
                            {
                              staticClass: "log-tag",
                              attrs: {
                                size: "mini",
                                type: "success",
                                effect: "plain",
                              },
                            },
                            [_vm._v(_vm._s(item.ruleType))]
                          )
                        : item.category === "error"
                        ? _c(
                            "el-tag",
                            {
                              staticClass: "log-tag",
                              attrs: {
                                size: "mini",
                                type: "danger",
                                effect: "plain",
                              },
                            },
                            [_vm._v("异常")]
                          )
                        : _vm._e(),
                      _vm._v(" "),
                      _c(
                        "span",
                        { staticClass: "log-body" },
                        [
                          item.category === "video" ||
                          item.category === "comment"
                            ? [
                                _vm._v("\n            屏蔽\n            "),
                                _c(
                                  "a",
                                  {
                                    staticClass: "log-user",
                                    attrs: {
                                      href:
                                        "https://space.bilibili.com/" +
                                        item.uid,
                                      target: "_blank",
                                    },
                                  },
                                  [_vm._v(_vm._s(item.userName))]
                                ),
                                _vm._v(" "),
                                _c("span", { staticClass: "log-uid" }, [
                                  _vm._v(_vm._s(item.uid)),
                                ]),
                                _vm._v(" "),
                                item.matching
                                  ? _c("span", { staticClass: "log-match" }, [
                                      _vm._v(_vm._s(item.matching)),
                                    ])
                                  : _vm._e(),
                                _vm._v(" "),
                                _c("span", { staticClass: "log-sep" }, [
                                  _vm._v("—"),
                                ]),
                                _vm._v(" "),
                                item.contentUrl
                                  ? _c(
                                      "a",
                                      {
                                        staticClass: "log-link",
                                        attrs: {
                                          href: item.contentUrl,
                                          target: "_blank",
                                        },
                                      },
                                      [_vm._v(_vm._s(item.content))]
                                    )
                                  : _c(
                                      "span",
                                      { staticClass: "log-content-text" },
                                      [_vm._v(_vm._s(item.content))]
                                    ),
                              ]
                            : [_vm._v(_vm._s(item.content))],
                        ],
                        2
                      ),
                      _vm._v(" "),
                      item.count > 1
                        ? _c("span", { staticClass: "log-count" }, [
                            _vm._v("x" + _vm._s(item.count)),
                          ])
                        : _vm._e(),
                    ],
                    1
                  )
                }),
                0
              ),
        ]
      ),
    ],
    1
  )
};
var __vue_staticRenderFns__$3 = [];
__vue_render__$3._withStripped = true;
  
  const __vue_inject_styles__$3 = function (inject) {
    if (!inject) return
    inject("data-v-99288382_0", { source: "\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n.output-info-container .el-card__body {\n  padding: 0;\n}\n.output-header {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n}\n.output-empty {\n  text-align: center;\n  padding: 40px 0;\n  font-size: 13px;\n  color: #9499A0;\n}\n\n\n.output-log-list {\n  max-height: 520px;\n  overflow-y: auto;\n}\n.output-log-list::-webkit-scrollbar {\n  width: 4px;\n}\n.output-log-list::-webkit-scrollbar-thumb {\n  background: rgba(128, 128, 128, 0.25);\n  border-radius: 3px;\n}\n.log-entry {\n  display: flex;\n  align-items: baseline;\n  gap: 8px;\n  padding: 7px 16px;\n  border-bottom: 1px solid rgba(0, 0, 0, 0.04);\n  font-size: 13px;\n  line-height: 1.7;\n  transition: background 0.15s;\n}\n.log-entry:last-child {\n  border-bottom: none;\n}\n.log-entry:hover {\n  background: rgba(0, 0, 0, 0.015);\n}\n.log-time {\n  font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace;\n  font-size: 11px;\n  color: #9499A0;\n  flex-shrink: 0;\n  width: 50px;\n}\n.log-tag {\n  flex-shrink: 0;\n}\n.log-body {\n  flex: 1;\n  min-width: 0;\n  word-break: break-all;\n}\n.log-user {\n  color: #18191C;\n  font-weight: 600;\n  text-decoration: none;\n}\n.log-user:hover {\n  color: #FB7299;\n  text-decoration: underline;\n}\n.log-uid {\n  color: #9499A0;\n  font-size: 11px;\n  margin-left: 2px;\n}\n.log-match {\n  color: #FB7299;\n  font-weight: 500;\n  margin-left: 4px;\n}\n.log-sep {\n  color: #C0C4CC;\n  margin: 0 4px;\n}\n.log-link {\n  color: #FB7299;\n  text-decoration: none;\n}\n.log-link:hover {\n  text-decoration: underline;\n}\n.log-content-text {\n  color: #606266;\n}\n.log-count {\n  flex-shrink: 0;\n  font-size: 11px;\n  color: #909399;\n  background: rgba(0, 0, 0, 0.05);\n  padding: 1px 7px;\n  border-radius: 10px;\n  font-weight: 500;\n}\n\n\n.theme-dark .log-entry,\n.bb-dark .log-entry {\n  border-bottom-color: rgba(255, 255, 255, 0.04);\n}\n.theme-dark .log-entry:hover,\n.bb-dark .log-entry:hover {\n  background: rgba(255, 255, 255, 0.02);\n}\n.theme-dark .log-time,\n.bb-dark .log-time {\n  color: #7A7A80;\n}\n.theme-dark .log-user,\n.bb-dark .log-user {\n  color: #E8E8EA;\n}\n.theme-dark .log-user:hover,\n.bb-dark .log-user:hover {\n  color: #FB7299;\n}\n.theme-dark .log-uid,\n.bb-dark .log-uid {\n  color: #6A6A70;\n}\n.theme-dark .log-sep,\n.bb-dark .log-sep {\n  color: #4A4A50;\n}\n.theme-dark .log-content-text,\n.bb-dark .log-content-text {\n  color: #B0B0B8;\n}\n.theme-dark .log-count,\n.bb-dark .log-count {\n  color: #7A7A80;\n  background: rgba(255, 255, 255, 0.06);\n}\n.theme-dark .output-empty,\n.bb-dark .output-empty {\n  color: #6A6A70;\n}\n", map: {"version":3,"sources":["E:\\something\\AI Agent\\ban bilibili\\BiliBlockFusion\\src\\web\\layout\\views\\outputInformationView.vue"],"names":[],"mappings":";;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;AAkIA,oCAAA;AACA,8DAAA;AAEA;EACA,UAAA;AACA;AAEA;EACA,aAAA;EACA,mBAAA;EACA,8BAAA;AACA;AAEA;EACA,kBAAA;EACA,eAAA;EACA,eAAA;EACA,cAAA;AACA;;AAEA,uBAAA;AACA;EACA,iBAAA;EACA,gBAAA;AACA;AAEA;EACA,UAAA;AACA;AAEA;EACA,qCAAA;EACA,kBAAA;AACA;AAEA;EACA,aAAA;EACA,qBAAA;EACA,QAAA;EACA,iBAAA;EACA,4CAAA;EACA,eAAA;EACA,gBAAA;EACA,4BAAA;AACA;AAEA;EACA,mBAAA;AACA;AAEA;EACA,gCAAA;AACA;AAEA;EACA,8DAAA;EACA,eAAA;EACA,cAAA;EACA,cAAA;EACA,WAAA;AACA;AAEA;EACA,cAAA;AACA;AAEA;EACA,OAAA;EACA,YAAA;EACA,qBAAA;AACA;AAEA;EACA,cAAA;EACA,gBAAA;EACA,qBAAA;AACA;AAEA;EACA,cAAA;EACA,0BAAA;AACA;AAEA;EACA,cAAA;EACA,eAAA;EACA,gBAAA;AACA;AAEA;EACA,cAAA;EACA,gBAAA;EACA,gBAAA;AACA;AAEA;EACA,cAAA;EACA,aAAA;AACA;AAEA;EACA,cAAA;EACA,qBAAA;AACA;AAEA;EACA,0BAAA;AACA;AAEA;EACA,cAAA;AACA;AAEA;EACA,cAAA;EACA,eAAA;EACA,cAAA;EACA,+BAAA;EACA,gBAAA;EACA,mBAAA;EACA,gBAAA;AACA;;AAEA,wBAAA;AACA;;EAEA,8CAAA;AACA;AAEA;;EAEA,qCAAA;AACA;AAEA;;EAEA,cAAA;AACA;AAEA;;EAEA,cAAA;AACA;AAEA;;EAEA,cAAA;AACA;AAEA;;EAEA,cAAA;AACA;AAEA;;EAEA,cAAA;AACA;AAEA;;EAEA,cAAA;AACA;AAEA;;EAEA,cAAA;EACA,qCAAA;AACA;AAEA;;EAEA,cAAA;AACA","file":"outputInformationView.vue","sourcesContent":["<script>\nimport {eventEmitter} from \"../../model/EventEmitter.js\";\nimport defUtil from \"../../utils/defUtil.js\";\n\nexport default {\n  data() {\n    return {\n      outputInfoArr: [],\n    }\n  },\n  methods: {\n    clearInfoBut() {\n      this.$confirm('是否清空信息', '提示', {\n        confirmButtonText: '确定',\n        cancelButtonText: '取消',\n        type: 'warning'\n      }).then(() => {\n        this.outputInfoArr = [];\n        this.$notify({ message: '已清空信息', type: 'success' })\n      })\n    },\n    addEntry(entry) {\n      if (entry.id) {\n        const idx = this.outputInfoArr.findIndex(item => item.id === entry.id);\n        if (idx !== -1) {\n          const item = this.outputInfoArr[idx];\n          item.count++;\n          item.time = defUtil.toTimeString();\n          this.outputInfoArr.splice(idx, 1);\n          this.outputInfoArr.unshift(item);\n          return;\n        }\n      }\n      if (entry.content !== undefined) {\n        const idx = this.outputInfoArr.findIndex(item => item.content === entry.content);\n        if (idx !== -1) {\n          const item = this.outputInfoArr[idx];\n          item.count++;\n          item.time = defUtil.toTimeString();\n          this.outputInfoArr.splice(idx, 1);\n          this.outputInfoArr.unshift(item);\n          return;\n        }\n      }\n      entry.time = defUtil.toTimeString();\n      entry.count = 1;\n      this.outputInfoArr.unshift(entry);\n    }\n  },\n  created() {\n    eventEmitter.on('打印信息', (content) => {\n      this.addEntry({ category: 'info', content: content.replace(/<[^>]*>/g, '') })\n    })\n    eventEmitter.on('event-update-out-info', (data) => {\n      this.addEntry({ category: 'info', id: data.id, content: data.msg })\n    })\n    eventEmitter.on('event-打印屏蔽视频信息', (type, matching, videoData) => {\n      const {name, uid, title, videoUrl} = videoData;\n      this.addEntry({\n        category: 'video',\n        id: `v-${uid}-${title}`,\n        ruleType: type,\n        matching: matching || '',\n        userName: name,\n        uid,\n        content: title,\n        contentUrl: videoUrl,\n      })\n    })\n    eventEmitter.on('屏蔽评论信息', (type, matching, commentData) => {\n      const {name, uid, content} = commentData;\n      this.addEntry({\n        category: 'comment',\n        id: `c-${uid}-${(content || '').substring(0, 30)}`,\n        ruleType: type,\n        matching: matching || '',\n        userName: name,\n        uid,\n        content,\n      })\n    })\n    eventEmitter.on('正则匹配时异常', (errorData) => {\n      const {msg, e} = errorData\n      this.addEntry({ category: 'error', content: msg })\n      console.error(msg)\n      throw new Error(e)\n    })\n  }\n}\n</script>\n\n<template>\n  <div class=\"output-info-container\">\n    <el-card shadow=\"never\">\n      <template #header>\n        <div class=\"output-header\">\n          <span>屏蔽日志</span>\n          <el-button type=\"warning\" size=\"small\" @click=\"clearInfoBut\">清空</el-button>\n        </div>\n      </template>\n      <div v-if=\"outputInfoArr.length === 0\" class=\"output-empty\">暂无屏蔽日志</div>\n      <div v-else class=\"output-log-list\">\n        <div v-for=\"(item, i) in outputInfoArr\" :key=\"i\" class=\"log-entry\">\n          <span class=\"log-time\">{{ item.time }}</span>\n\n          <el-tag v-if=\"item.category === 'video'\" size=\"mini\" type=\"primary\" effect=\"plain\" class=\"log-tag\">{{ item.ruleType }}</el-tag>\n          <el-tag v-else-if=\"item.category === 'comment'\" size=\"mini\" type=\"success\" effect=\"plain\" class=\"log-tag\">{{ item.ruleType }}</el-tag>\n          <el-tag v-else-if=\"item.category === 'error'\" size=\"mini\" type=\"danger\" effect=\"plain\" class=\"log-tag\">异常</el-tag>\n\n          <span class=\"log-body\">\n            <template v-if=\"item.category === 'video' || item.category === 'comment'\">\n              屏蔽\n              <a :href=\"'https://space.bilibili.com/' + item.uid\" target=\"_blank\" class=\"log-user\">{{ item.userName }}</a>\n              <span class=\"log-uid\">{{ item.uid }}</span>\n              <span v-if=\"item.matching\" class=\"log-match\">{{ item.matching }}</span>\n              <span class=\"log-sep\">—</span>\n              <a v-if=\"item.contentUrl\" :href=\"item.contentUrl\" target=\"_blank\" class=\"log-link\">{{ item.content }}</a>\n              <span v-else class=\"log-content-text\">{{ item.content }}</span>\n            </template>\n            <template v-else>{{ item.content }}</template>\n          </span>\n\n          <span v-if=\"item.count > 1\" class=\"log-count\">x{{ item.count }}</span>\n        </div>\n      </div>\n    </el-card>\n  </div>\n</template>\n\n<style>\n\n\n\n.output-info-container .el-card__body {\n  padding: 0;\n}\n\n.output-header {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n}\n\n.output-empty {\n  text-align: center;\n  padding: 40px 0;\n  font-size: 13px;\n  color: #9499A0;\n}\n\n\n.output-log-list {\n  max-height: 520px;\n  overflow-y: auto;\n}\n\n.output-log-list::-webkit-scrollbar {\n  width: 4px;\n}\n\n.output-log-list::-webkit-scrollbar-thumb {\n  background: rgba(128, 128, 128, 0.25);\n  border-radius: 3px;\n}\n\n.log-entry {\n  display: flex;\n  align-items: baseline;\n  gap: 8px;\n  padding: 7px 16px;\n  border-bottom: 1px solid rgba(0, 0, 0, 0.04);\n  font-size: 13px;\n  line-height: 1.7;\n  transition: background 0.15s;\n}\n\n.log-entry:last-child {\n  border-bottom: none;\n}\n\n.log-entry:hover {\n  background: rgba(0, 0, 0, 0.015);\n}\n\n.log-time {\n  font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace;\n  font-size: 11px;\n  color: #9499A0;\n  flex-shrink: 0;\n  width: 50px;\n}\n\n.log-tag {\n  flex-shrink: 0;\n}\n\n.log-body {\n  flex: 1;\n  min-width: 0;\n  word-break: break-all;\n}\n\n.log-user {\n  color: #18191C;\n  font-weight: 600;\n  text-decoration: none;\n}\n\n.log-user:hover {\n  color: #FB7299;\n  text-decoration: underline;\n}\n\n.log-uid {\n  color: #9499A0;\n  font-size: 11px;\n  margin-left: 2px;\n}\n\n.log-match {\n  color: #FB7299;\n  font-weight: 500;\n  margin-left: 4px;\n}\n\n.log-sep {\n  color: #C0C4CC;\n  margin: 0 4px;\n}\n\n.log-link {\n  color: #FB7299;\n  text-decoration: none;\n}\n\n.log-link:hover {\n  text-decoration: underline;\n}\n\n.log-content-text {\n  color: #606266;\n}\n\n.log-count {\n  flex-shrink: 0;\n  font-size: 11px;\n  color: #909399;\n  background: rgba(0, 0, 0, 0.05);\n  padding: 1px 7px;\n  border-radius: 10px;\n  font-weight: 500;\n}\n\n\n.theme-dark .log-entry,\n.bb-dark .log-entry {\n  border-bottom-color: rgba(255, 255, 255, 0.04);\n}\n\n.theme-dark .log-entry:hover,\n.bb-dark .log-entry:hover {\n  background: rgba(255, 255, 255, 0.02);\n}\n\n.theme-dark .log-time,\n.bb-dark .log-time {\n  color: #7A7A80;\n}\n\n.theme-dark .log-user,\n.bb-dark .log-user {\n  color: #E8E8EA;\n}\n\n.theme-dark .log-user:hover,\n.bb-dark .log-user:hover {\n  color: #FB7299;\n}\n\n.theme-dark .log-uid,\n.bb-dark .log-uid {\n  color: #6A6A70;\n}\n\n.theme-dark .log-sep,\n.bb-dark .log-sep {\n  color: #4A4A50;\n}\n\n.theme-dark .log-content-text,\n.bb-dark .log-content-text {\n  color: #B0B0B8;\n}\n\n.theme-dark .log-count,\n.bb-dark .log-count {\n  color: #7A7A80;\n  background: rgba(255, 255, 255, 0.06);\n}\n\n.theme-dark .output-empty,\n.bb-dark .output-empty {\n  color: #6A6A70;\n}\n</style>\n"]}, media: undefined });
  };
  
  const __vue_scope_id__$3 = undefined;
  
  const __vue_module_identifier__$3 = undefined;
  
  const __vue_is_functional_template__$3 = false;
  
  
  
  
  
  const __vue_component__$3 = normalizeComponent(
    { render: __vue_render__$3, staticRenderFns: __vue_staticRenderFns__$3 },
    __vue_inject_styles__$3,
    __vue_script__$3,
    __vue_scope_id__$3,
    __vue_is_functional_template__$3,
    __vue_module_identifier__$3,
    false,
    createInjector);var script$2 = {
  components: {
    RightFloatingLayoutView: __vue_component__$6,
    ruleManagementView: __vue_component__$8,
    panelSettingsView: __vue_component__$x,
    compatibleSettingView: __vue_component__$w,
    lookContentDialog: __vue_component__$v,
    PageProcessingTabsView: __vue_component__$q,
    showImgDialog: __vue_component__$p,
    sheetDialog: __vue_component__$o,
    conditionalityView: __vue_component__$5,
    overlaySettingsView: __vue_component__$4,
    outputInformationView: __vue_component__$3
  },
  data() {
    return {
      drawer: false,
      tabsActiveName: GM_getValue("mainTabsActiveName", "规则管理"),
      isShowBackToTopVal: localMKData.isShowBackToTopBtn(),
      darkModeState: GM_getValue("dark_mode_state", "auto"),
      systemDark: window.matchMedia("(prefers-color-scheme: dark)").matches
    };
  },
  computed: {
    isDark() {
      if (this.darkModeState === "dark") return true;
      if (this.darkModeState === "light") return false;
      return this.systemDark;
    }
  },
  methods: {
    tabClick(tab) {
      GM_setValue("mainTabsActiveName", tab.name);
    }
  },
  created() {
    eventEmitter.on("主面板开关", () => {
      this.drawer = !this.drawer;
    });
    document.addEventListener("keydown", (event) => {
      eventEmitter.emit("event-keydownEvent", event);
      if (event.key === getDrawerShortcutKeyGm()) {
        this.drawer = !this.drawer;
      }
    });
    eventEmitter.on("el-notify", (options) => {
      if (!options["position"]) {
        options.position = "bottom-right";
      }
      this.$notify(options);
    });
    eventEmitter.on("el-msg", (...options) => {
      this.$message(...options);
    });
    eventEmitter.on("el-alert", (...options) => {
      this.$alert(...options);
    });
    eventEmitter.handler("el-confirm", (...options) => {
      return this.$confirm(...options);
    });
    eventEmitter.handler("el-prompt", (...options) => {
      return this.$prompt(...options);
    });
    const alertFunDebounce = defUtil.debounce((response, bvId) => {
      this.$alert(`请求获取视频信息失败，状态码：${response.status}，bv号：${bvId}
                
。已自动禁用根据bv号网络请求获取视频信息状态
                
如需关闭，请在面板条件限制里手动关闭。`, "错误", {
        confirmButtonText: "确定",
        type: "error"
      });
    }, 2e3);
    eventEmitter.on("请求获取视频信息失败", (response, bvId) => {
      eventEmitter.send("更新根据bv号网络请求获取视频信息状态", true);
      alertFunDebounce(response, bvId);
    });
    eventEmitter.on("e:设置顶部按钮状态", (show) => {
      this.isShowBackToTopVal = show;
    });
    eventEmitter.on("toggle-dark-mode", (val) => {
      this.darkModeState = val;
    });
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
      this.systemDark = e.matches;
    });
  }
};
const __vue_script__$2 = script$2;
var __vue_render__$2 = function () {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _c(
    "div",
    { class: { "theme-dark": _vm.isDark } },
    [
      _c(
        "el-drawer",
        {
          staticStyle: { position: "fixed" },
          attrs: {
            modal: false,
            visible: _vm.drawer,
            "with-header": false,
            direction: "ltr",
            size: "60%",
          },
          on: {
            "update:visible": function ($event) {
              _vm.drawer = $event;
            },
          },
        },
        [
          _c(
            "el-tabs",
            {
              attrs: { type: "border-card" },
              on: { "tab-click": _vm.tabClick },
              model: {
                value: _vm.tabsActiveName,
                callback: function ($$v) {
                  _vm.tabsActiveName = $$v;
                },
                expression: "tabsActiveName",
              },
            },
            [
              _c(
                "el-tab-pane",
                { attrs: { label: "面板设置", lazy: "", name: "面板设置" } },
                [_c("panelSettingsView")],
                1
              ),
              _vm._v(" "),
              _c(
                "el-tab-pane",
                { attrs: { label: "规则管理", lazy: "", name: "规则管理" } },
                [_c("ruleManagementView")],
                1
              ),
              _vm._v(" "),
              _c(
                "el-tab-pane",
                { attrs: { label: "页面处理", lazy: "", name: "页面处理" } },
                [_c("PageProcessingTabsView")],
                1
              ),
              _vm._v(" "),
              _c(
                "el-tab-pane",
                { attrs: { label: "兼容设置", lazy: "", name: "兼容设置" } },
                [_c("compatibleSettingView")],
                1
              ),
              _vm._v(" "),
              _c(
                "el-tab-pane",
                { attrs: { label: "条件限制", lazy: "", name: "条件限制" } },
                [_c("conditionalityView")],
                1
              ),
              _vm._v(" "),
              _c(
                "el-tab-pane",
                {
                  attrs: { label: "叠加层设置", lazy: "", name: "叠加层设置" },
                },
                [_c("overlaySettingsView")],
                1
              ),
              _vm._v(" "),
              _c(
                "el-tab-pane",
                { attrs: { label: "输出信息", lazy: "", name: "输出信息" } },
                [_c("outputInformationView")],
                1
              ),
            ],
            1
          ),
        ],
        1
      ),
      _vm._v(" "),
      _c("lookContentDialog"),
      _vm._v(" "),
      _c("showImgDialog"),
      _vm._v(" "),
      _c("sheetDialog"),
      _vm._v(" "),
      _c("RightFloatingLayoutView"),
      _vm._v(" "),
      _vm.isShowBackToTopVal ? _c("el-backtop") : _vm._e(),
    ],
    1
  )
};
var __vue_staticRenderFns__$2 = [];
__vue_render__$2._withStripped = true;
  
  const __vue_inject_styles__$2 = function (inject) {
    if (!inject) return
    inject("data-v-ebc2cc76_0", { source: "\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n.el-drawer.ltr {\n  background: #F5F6F8;\n  border-right: 1px solid rgba(0, 0, 0, 0.05);\n  top: 15%;\n  height: 70%;\n  border-radius: 0 12px 12px 0;\n}\n.el-drawer__body {\n  padding: 0 16px 12px 16px;\n}\n\n\n.el-tabs--border-card {\n  background: #FFFFFF;\n  border: 1px solid rgba(0, 0, 0, 0.05);\n  border-radius: 12px;\n  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.04);\n}\n.el-tabs--border-card > .el-tabs__header {\n  background: #FFFFFF;\n  border-bottom: 1px solid rgba(0, 0, 0, 0.05);\n  margin: 0;\n  position: sticky;\n  top: 0;\n  z-index: 10;\n  border-radius: 12px 12px 0 0;\n}\n.el-tabs--border-card > .el-tabs__header .el-tabs__nav {\n  border: none;\n  border-radius: 0;\n}\n.el-tabs--border-card > .el-tabs__header .el-tabs__item {\n  border: none;\n  color: #9499A0;\n  font-weight: 500;\n  font-size: 13px;\n  padding: 0 18px;\n  height: 40px;\n  line-height: 40px;\n  transition: color 0.2s ease, background 0.2s ease;\n}\n.el-tabs--border-card > .el-tabs__header .el-tabs__item.is-active {\n  color: #FB7299;\n  background: #FFFFFF;\n}\n.el-tabs--border-card > .el-tabs__header .el-tabs__item:hover {\n  color: #FB7299;\n}\n\n\n.el-tabs--border-card > .el-tabs__header .el-tabs__item.is-active::after {\n  content: '';\n  position: absolute;\n  bottom: 0;\n  left: 12px;\n  right: 12px;\n  height: 2px;\n  background: #FB7299;\n  border-radius: 1px;\n}\n.el-tabs__content {\n  padding: 16px;\n}\n\n\n.el-card {\n  border-radius: 10px !important;\n  border: 1px solid rgba(0, 0, 0, 0.05) !important;\n  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.03) !important;\n  background: #FFFFFF;\n  margin-bottom: 12px;\n}\n.el-card__header {\n  background: transparent;\n  border-bottom: 1px solid rgba(0, 0, 0, 0.05);\n  padding: 14px 16px;\n  font-weight: 600;\n  font-size: 14px;\n  color: #18191C;\n}\n.el-card__body {\n  padding: 16px;\n}\n\n\n.el-button {\n  font-weight: 500;\n  transition: all 0.2s ease;\n}\n.el-button--primary {\n  background: linear-gradient(135deg, #FB7299 0%, #fc8aab 100%) !important;\n  border-color: transparent !important;\n  color: #fff !important;\n  box-shadow: 0 2px 8px rgba(251, 114, 153, 0.25);\n}\n.el-button--primary:hover {\n  background: linear-gradient(135deg, #FB7299 0%, #fd9bb7 100%) !important;\n  box-shadow: 0 4px 14px rgba(251, 114, 153, 0.35);\n}\n\n\n.el-radio-button__inner {\n  background: #FFFFFF;\n  border-color: #DCDFE6;\n  color: #606266;\n}\n.el-radio-button:first-child .el-radio-button__inner {\n  border-left-width: 0;\n}\n.el-radio-button__inner:hover {\n  color: #FB7299;\n}\n.el-radio-button.is-active .el-radio-button__inner {\n  background: #FB7299;\n  border-color: #FB7299;\n  color: #FFFFFF;\n  box-shadow: -1px 0 0 0 #FB7299;\n}\n.el-radio-button.is-active:first-child .el-radio-button__inner {\n  box-shadow: none;\n}\n\n\n.el-switch__label.is-active {\n  color: #FB7299;\n}\n.el-switch.is-checked .el-switch__core {\n  border-color: #FB7299;\n  background-color: #FB7299;\n}\n\n\n.el-divider__text {\n  color: #9499A0;\n  font-weight: 500;\n}\n\n\n.el-dropdown-menu__item:hover {\n  color: #FB7299;\n  background: rgba(251, 114, 153, 0.06);\n}\n\n\n.el-tooltip__popper {\n  border-radius: 6px;\n}\n\n\n.el-notification {\n  border-radius: 10px;\n  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);\n}\n\n\n.el-input .el-input__inner,\n.el-textarea .el-textarea__inner,\n.el-cascader .el-input__inner,\n.el-select .el-input__inner,\n.el-date-editor .el-input__inner,\n.el-range-editor .el-input__inner,\n.el-input-number .el-input__inner {\n  background-color: #FFFFFF;\n  border-color: #DCDFE6;\n  color: #18191C;\n}\n.el-input .el-input__inner:focus,\n.el-textarea .el-textarea__inner:focus {\n  border-color: #FB7299;\n}\n\n\n.el-table {\n  background: #FFFFFF;\n  color: #18191C;\n}\n.el-table th.el-table__cell {\n  background: #F5F6F8;\n  color: #18191C;\n}\n.el-table tr {\n  background: #FFFFFF;\n}\n.el-table--striped .el-table__body tr.el-table__row--striped td {\n  background: #FAFAFB;\n}\n\n\n.el-collapse-item__header {\n  background: #FFFFFF;\n  border-bottom-color: rgba(0, 0, 0, 0.05);\n  color: #18191C;\n}\n.el-collapse-item__wrap {\n  background: #FFFFFF;\n  border-bottom-color: rgba(0, 0, 0, 0.05);\n}\n.el-collapse-item__content {\n  color: #9499A0;\n}\n\n\n.el-dialog {\n  background: #FFFFFF;\n}\n.el-dialog__header {\n  color: #18191C;\n}\n.el-dialog__body {\n  color: #18191C;\n}\n\n\n.el-drawer__body::-webkit-scrollbar {\n  width: 5px;\n}\n.el-drawer__body::-webkit-scrollbar-thumb {\n  background: rgba(0, 0, 0, 0.12);\n  border-radius: 4px;\n}\n\n\n.el-tabs--left .el-tabs__item {\n  color: #555;\n  font-weight: 500;\n}\n.el-tabs--left .el-tabs__item.is-active {\n  color: #FB7299;\n}\n.el-tabs--left .el-tabs__item:hover {\n  color: #FB7299;\n}\n.el-tabs--left .el-tabs__active-bar {\n  background-color: #FB7299;\n}\n.el-tabs--left .el-tabs__header {\n  position: sticky;\n  top: 0;\n  align-self: flex-start;\n}\n\n\n\n.theme-dark .el-drawer.ltr,\n.bb-dark .el-drawer.ltr {\n  background: #1A1B1E;\n  border-right-color: rgba(255, 255, 255, 0.04);\n  top: 15%;\n  height: 70%;\n  border-radius: 0 12px 12px 0;\n}\n\n\n.theme-dark .el-tabs--border-card,\n.bb-dark .el-tabs--border-card {\n  background: #212226;\n  border-color: rgba(255, 255, 255, 0.05);\n  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.3);\n}\n.theme-dark .el-tabs--border-card > .el-tabs__header,\n.bb-dark .el-tabs--border-card > .el-tabs__header {\n  background: #212226;\n  border-bottom-color: rgba(255, 255, 255, 0.05);\n  border-radius: 12px 12px 0 0;\n}\n.theme-dark .el-tabs--border-card > .el-tabs__header .el-tabs__item,\n.bb-dark .el-tabs--border-card > .el-tabs__header .el-tabs__item {\n  color: #7A7A80;\n}\n.theme-dark .el-tabs--border-card > .el-tabs__header .el-tabs__item.is-active,\n.bb-dark .el-tabs--border-card > .el-tabs__header .el-tabs__item.is-active {\n  color: #FB7299;\n  background: #212226;\n}\n.theme-dark .el-tabs--border-card > .el-tabs__header .el-tabs__item:hover,\n.bb-dark .el-tabs--border-card > .el-tabs__header .el-tabs__item:hover {\n  color: #FB7299;\n}\n\n\n.theme-dark .el-card,\n.bb-dark .el-card {\n  background: #27282C !important;\n  border-color: rgba(255, 255, 255, 0.05) !important;\n  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.25) !important;\n  color: #D0D0D4;\n}\n.theme-dark .el-card__header,\n.bb-dark .el-card__header {\n  border-bottom-color: rgba(255, 255, 255, 0.05);\n  color: #E8E8EA;\n}\n\n\n.theme-dark,\n.bb-dark {\n  color: #D0D0D4;\n}\n.theme-dark .el-text,\n.bb-dark .el-text {\n  color: #D0D0D4;\n}\n\n\n.theme-dark .el-divider__text,\n.bb-dark .el-divider__text {\n  color: #7A7A80;\n}\n\n\n.theme-dark .el-dropdown-menu,\n.bb-dark .el-dropdown-menu {\n  background: #2A2B2F;\n  border-color: rgba(255, 255, 255, 0.06);\n}\n.theme-dark .el-dropdown-menu__item,\n.bb-dark .el-dropdown-menu__item {\n  color: #D0D0D4;\n}\n.theme-dark .el-dropdown-menu__item:hover,\n.bb-dark .el-dropdown-menu__item:hover {\n  background: rgba(251, 114, 153, 0.1);\n}\n\n\n.theme-dark .el-input__inner,\n.bb-dark .el-input__inner {\n  background: #2A2B2F;\n  border-color: rgba(255, 255, 255, 0.08);\n  color: #E8E8EA;\n}\n.theme-dark .el-input__inner:focus,\n.bb-dark .el-input__inner:focus {\n  border-color: #FB7299;\n}\n.theme-dark .el-input__inner::placeholder,\n.bb-dark .el-input__inner::placeholder {\n  color: #5A5A60;\n}\n\n\n.theme-dark .el-color-picker__trigger,\n.bb-dark .el-color-picker__trigger {\n  border-color: rgba(255, 255, 255, 0.1);\n}\n\n\n.theme-dark .el-tooltip__popper,\n.bb-dark .el-tooltip__popper {\n  background: #2A2B2F;\n  color: #D0D0D4;\n}\n\n\n.theme-dark .el-switch__label *,\n.bb-dark .el-switch__label * {\n  color: #D0D0D4;\n}\n\n\n.theme-dark .el-tab-pane,\n.bb-dark .el-tab-pane {\n  color: #D0D0D4;\n}\n\n\n.theme-dark .el-tag,\n.bb-dark .el-tag {\n  background: rgba(255, 255, 255, 0.04);\n  border-color: rgba(255, 255, 255, 0.08);\n  color: #D0D0D4;\n}\n\n\n.theme-dark .floating-panel,\n.bb-dark .floating-panel {\n  background: rgba(30, 31, 34, 0.88);\n  border-color: rgba(255, 255, 255, 0.06);\n  box-shadow:\n    0 8px 32px rgba(0, 0, 0, 0.3),\n    0 2px 8px rgba(0, 0, 0, 0.2),\n    inset 0 1px 0 rgba(255, 255, 255, 0.04);\n}\n.theme-dark .panel-btn--secondary,\n.bb-dark .panel-btn--secondary {\n  background: rgba(251, 114, 153, 0.1);\n  color: #fc8aab;\n  border-color: rgba(251, 114, 153, 0.15);\n}\n.theme-dark .panel-btn--secondary:hover,\n.bb-dark .panel-btn--secondary:hover {\n  background: rgba(251, 114, 153, 0.18);\n  box-shadow: 0 2px 10px rgba(251, 114, 153, 0.2);\n  color: #FB7299;\n}\n\n\n.theme-dark .el-drawer__body::-webkit-scrollbar-thumb,\n.bb-dark .el-drawer__body::-webkit-scrollbar-thumb {\n  background: rgba(255, 255, 255, 0.1);\n}\n\n\n.theme-dark .el-notification,\n.bb-dark .el-notification {\n  background: #2A2B2F;\n  border-color: rgba(255, 255, 255, 0.06);\n  color: #D0D0D4;\n}\n.theme-dark .el-notification__title,\n.bb-dark .el-notification__title {\n  color: #E8E8EA;\n}\n\n\n.theme-dark .el-button--default,\n.bb-dark .el-button--default {\n  background: #2A2B2F;\n  border-color: rgba(255, 255, 255, 0.08);\n  color: #D0D0D4;\n}\n.theme-dark .el-button--default:hover,\n.bb-dark .el-button--default:hover {\n  background: #36373C;\n  border-color: rgba(255, 255, 255, 0.15);\n  color: #E8E8EA;\n}\n.theme-dark .el-button--default:active,\n.bb-dark .el-button--default:active {\n  background: #212226;\n}\n\n\n.theme-dark .el-message-box,\n.bb-dark .el-message-box {\n  background: #2A2B2F;\n  border-color: rgba(255, 255, 255, 0.06);\n}\n.theme-dark .el-message-box__title,\n.bb-dark .el-message-box__title {\n  color: #E8E8EA;\n}\n.theme-dark .el-message-box__message,\n.bb-dark .el-message-box__message {\n  color: #D0D0D4;\n}\n.theme-dark .el-message-box__content,\n.bb-dark .el-message-box__content {\n  color: #D0D0D4;\n}\n\n\n.theme-dark .el-dialog,\n.bb-dark .el-dialog {\n  background: #27282C;\n}\n.theme-dark .el-dialog__header,\n.bb-dark .el-dialog__header {\n  color: #E8E8EA;\n}\n.theme-dark .el-dialog__body,\n.bb-dark .el-dialog__body {\n  color: #D0D0D4;\n}\n\n\n.theme-dark .el-collapse-item__header,\n.bb-dark .el-collapse-item__header {\n  background: #27282C;\n  border-bottom-color: rgba(255, 255, 255, 0.05);\n  color: #D0D0D4;\n}\n.theme-dark .el-collapse-item__wrap,\n.bb-dark .el-collapse-item__wrap {\n  background: #212226;\n  border-bottom-color: rgba(255, 255, 255, 0.05);\n}\n.theme-dark .el-collapse-item__content,\n.bb-dark .el-collapse-item__content {\n  color: #9499A0;\n}\n\n\n.theme-dark .el-table,\n.bb-dark .el-table {\n  background: #212226;\n  color: #D0D0D4;\n}\n.theme-dark .el-table th.el-table__cell,\n.bb-dark .el-table th.el-table__cell {\n  background: #1A1B1E;\n  color: #D0D0D4;\n}\n.theme-dark .el-table tr,\n.bb-dark .el-table tr {\n  background: #212226;\n}\n.theme-dark .el-table--striped .el-table__body tr.el-table__row--striped td,\n.bb-dark .el-table--striped .el-table__body tr.el-table__row--striped td {\n  background: #27282C;\n}\n.theme-dark .el-table td.el-table__cell,\n.bb-dark .el-table td.el-table__cell {\n  border-bottom-color: rgba(255, 255, 255, 0.04);\n}\n.theme-dark .el-table__body tr:hover > td,\n.bb-dark .el-table__body tr:hover > td {\n  background: #2A2B2F;\n}\n\n\n.theme-dark .el-textarea__inner,\n.bb-dark .el-textarea__inner {\n  background: #2A2B2F;\n  border-color: rgba(255, 255, 255, 0.08);\n  color: #E8E8EA;\n}\n\n\n.theme-dark .el-radio-button__inner,\n.bb-dark .el-radio-button__inner {\n  background: #2A2B2F;\n  border-color: rgba(255, 255, 255, 0.08);\n  color: #D0D0D4;\n}\n.theme-dark .el-radio-button__inner:hover,\n.bb-dark .el-radio-button__inner:hover {\n  color: #FB7299;\n}\n.theme-dark .el-radio-button.is-active .el-radio-button__inner,\n.bb-dark .el-radio-button.is-active .el-radio-button__inner {\n  background: #FB7299;\n  border-color: #FB7299;\n  color: #FFFFFF;\n  box-shadow: -1px 0 0 0 #FB7299;\n}\n\n\n.theme-dark .el-pagination__total,\n.theme-dark .el-pagination__jump,\n.bb-dark .el-pagination__total,\n.bb-dark .el-pagination__jump {\n  color: #D0D0D4;\n}\n.theme-dark .el-pagination button,\n.bb-dark .el-pagination button {\n  background: #2A2B2F;\n  color: #D0D0D4;\n}\n.theme-dark .el-pager li,\n.bb-dark .el-pager li {\n  background: #2A2B2F;\n  color: #D0D0D4;\n}\n.theme-dark .el-pager li.active,\n.bb-dark .el-pager li.active {\n  background: #FB7299;\n  color: #E8E8EA;\n}\n\n\n.theme-dark .el-select-dropdown,\n.bb-dark .el-select-dropdown {\n  background: #2A2B2F;\n  border-color: rgba(255, 255, 255, 0.06);\n}\n.theme-dark .el-select-dropdown__item,\n.bb-dark .el-select-dropdown__item {\n  color: #D0D0D4;\n}\n.theme-dark .el-select-dropdown__item.hover,\n.bb-dark .el-select-dropdown__item.hover,\n.theme-dark .el-select-dropdown__item:hover,\n.bb-dark .el-select-dropdown__item:hover {\n  background: rgba(251, 114, 153, 0.1);\n}\n.theme-dark .el-select-dropdown__item.selected,\n.bb-dark .el-select-dropdown__item.selected {\n  color: #FB7299;\n}\n\n\n.theme-dark .el-cascader-panel,\n.bb-dark .el-cascader-panel {\n  background: #2A2B2F;\n  border-color: rgba(255, 255, 255, 0.06);\n}\n.theme-dark .el-cascader-menu,\n.bb-dark .el-cascader-menu {\n  background: #2A2B2F;\n  border-right-color: rgba(255, 255, 255, 0.06);\n}\n.theme-dark .el-cascader-menu__wrap,\n.bb-dark .el-cascader-menu__wrap {\n  background: #2A2B2F;\n}\n.theme-dark .el-cascader-node,\n.bb-dark .el-cascader-node {\n  color: #D0D0D4;\n}\n.theme-dark .el-cascader-node:not(.is-disabled):hover,\n.bb-dark .el-cascader-node:not(.is-disabled):hover {\n  background: rgba(251, 114, 153, 0.1);\n}\n.theme-dark .el-cascader-node.in-active-path,\n.bb-dark .el-cascader-node.in-active-path,\n.theme-dark .el-cascader-node.is-active,\n.bb-dark .el-cascader-node.is-active,\n.theme-dark .el-cascader-node.is-selectable.in-checked-path,\n.bb-dark .el-cascader-node.is-selectable.in-checked-path {\n  background: rgba(251, 114, 153, 0.12);\n  color: #FB7299;\n}\n.theme-dark .el-cascader-node__label,\n.bb-dark .el-cascader-node__label {\n  color: #D0D0D4;\n}\n.theme-dark .el-cascader-node__prefix,\n.bb-dark .el-cascader-node__prefix {\n  color: #D0D0D4;\n}\n\n\n\n.theme-dark .el-tabs--left .el-tabs__header,\n.bb-dark .el-tabs--left .el-tabs__header {\n  background: #1A1B1E;\n  border-right-color: rgba(255, 255, 255, 0.05);\n}\n.theme-dark .el-tabs--left .el-tabs__nav-wrap::after,\n.bb-dark .el-tabs--left .el-tabs__nav-wrap::after {\n  background-color: rgba(255, 255, 255, 0.05);\n}\n.theme-dark .el-tabs--left .el-tabs__item,\n.bb-dark .el-tabs--left .el-tabs__item {\n  color: #C0C0C8;\n}\n.theme-dark .el-tabs--left .el-tabs__item.is-active,\n.bb-dark .el-tabs--left .el-tabs__item.is-active {\n  color: #FB7299;\n}\n.theme-dark .el-tabs--left .el-tabs__item:hover,\n.bb-dark .el-tabs--left .el-tabs__item:hover {\n  color: #FB7299;\n}\n.theme-dark .el-tabs--left .el-tabs__active-bar,\n.bb-dark .el-tabs--left .el-tabs__active-bar {\n  background-color: #FB7299;\n}\n\n\n.theme-dark .el-input-number__decrease,\n.bb-dark .el-input-number__decrease,\n.theme-dark .el-input-number__increase,\n.bb-dark .el-input-number__increase {\n  background: #2A2B2F;\n  color: #D0D0D4;\n  border-color: rgba(255, 255, 255, 0.08);\n}\n.theme-dark .el-input-number__decrease:hover,\n.bb-dark .el-input-number__decrease:hover,\n.theme-dark .el-input-number__increase:hover,\n.bb-dark .el-input-number__increase:hover {\n  color: #FB7299;\n}\n\n\n.theme-dark .el-button--info,\n.bb-dark .el-button--info {\n  background: #2A2B2F;\n  border-color: rgba(255, 255, 255, 0.08);\n  color: #D0D0D4;\n}\n.theme-dark .el-button--info:hover,\n.bb-dark .el-button--info:hover {\n  background: #36373C;\n  border-color: rgba(255, 255, 255, 0.15);\n  color: #E8E8EA;\n}\n.theme-dark .el-button--warning,\n.bb-dark .el-button--warning {\n  background: #3A3528;\n  border-color: rgba(230, 162, 60, 0.3);\n  color: #E6A23C;\n}\n.theme-dark .el-button--warning:hover,\n.bb-dark .el-button--warning:hover {\n  background: #4A3F2A;\n  border-color: rgba(230, 162, 60, 0.5);\n  color: #F0B84C;\n}\n.theme-dark .el-button--danger,\n.bb-dark .el-button--danger {\n  background: #3A2828;\n  border-color: rgba(245, 108, 108, 0.3);\n  color: #F56C6C;\n}\n.theme-dark .el-button--danger:hover,\n.bb-dark .el-button--danger:hover {\n  background: #4A2E2E;\n  border-color: rgba(245, 108, 108, 0.5);\n  color: #F78D8D;\n}\n\n\n.theme-dark .el-slider__runway,\n.bb-dark .el-slider__runway {\n  background: #36373C;\n}\n.theme-dark .el-slider__button,\n.bb-dark .el-slider__button {\n  border-color: #FB7299;\n  background: #2A2B2F;\n}\n\n\n.theme-dark .el-popconfirm,\n.bb-dark .el-popconfirm {\n  background: #2A2B2F;\n  border-color: rgba(255, 255, 255, 0.06);\n}\n.theme-dark .el-popconfirm__title,\n.bb-dark .el-popconfirm__title {\n  color: #D0D0D4;\n}\n", map: {"version":3,"sources":["E:\\something\\AI Agent\\ban bilibili\\BiliBlockFusion\\src\\web\\layout\\App.vue"],"names":[],"mappings":";;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;AAgKA;;;gDAGA;;AAEA,kCAAA;AACA;EACA,mBAAA;EACA,2CAAA;EACA,QAAA;EACA,WAAA;EACA,4BAAA;AACA;AAEA;EACA,yBAAA;AACA;;AAEA,yCAAA;AACA;EACA,mBAAA;EACA,qCAAA;EACA,mBAAA;EACA,0CAAA;AACA;AACA;EACA,mBAAA;EACA,4CAAA;EACA,SAAA;EACA,gBAAA;EACA,MAAA;EACA,WAAA;EACA,4BAAA;AACA;AAEA;EACA,YAAA;EACA,gBAAA;AACA;AAEA;EACA,YAAA;EACA,cAAA;EACA,gBAAA;EACA,eAAA;EACA,eAAA;EACA,YAAA;EACA,iBAAA;EACA,iDAAA;AACA;AAEA;EACA,cAAA;EACA,mBAAA;AACA;AAEA;EACA,cAAA;AACA;;AAEA,yBAAA;AACA;EACA,WAAA;EACA,kBAAA;EACA,SAAA;EACA,UAAA;EACA,WAAA;EACA,WAAA;EACA,mBAAA;EACA,kBAAA;AACA;AAEA;EACA,aAAA;AACA;;AAEA,oBAAA;AACA;EACA,8BAAA;EACA,gDAAA;EACA,oDAAA;EACA,mBAAA;EACA,mBAAA;AACA;AAEA;EACA,uBAAA;EACA,4CAAA;EACA,kBAAA;EACA,gBAAA;EACA,eAAA;EACA,cAAA;AACA;AAEA;EACA,aAAA;AACA;;AAEA,sDAAA;AACA;EACA,gBAAA;EACA,yBAAA;AACA;AAEA;EACA,wEAAA;EACA,oCAAA;EACA,sBAAA;EACA,+CAAA;AACA;AAEA;EACA,wEAAA;EACA,gDAAA;AACA;;AAEA,+CAAA;AACA;EACA,mBAAA;EACA,qBAAA;EACA,cAAA;AACA;AAEA;EACA,oBAAA;AACA;AAEA;EACA,cAAA;AACA;AAEA;EACA,mBAAA;EACA,qBAAA;EACA,cAAA;EACA,8BAAA;AACA;AAEA;EACA,gBAAA;AACA;;AAEA,uBAAA;AACA;EACA,cAAA;AACA;AAEA;EACA,qBAAA;EACA,yBAAA;AACA;;AAEA,uBAAA;AACA;EACA,cAAA;EACA,gBAAA;AACA;;AAEA,uBAAA;AACA;EACA,cAAA;EACA,qCAAA;AACA;;AAEA,uBAAA;AACA;EACA,kBAAA;AACA;;AAEA,4BAAA;AACA;EACA,mBAAA;EACA,yCAAA;AACA;;AAEA,wEAAA;AACA;;;;;;;EAOA,yBAAA;EACA,qBAAA;EACA,cAAA;AACA;AAEA;;EAEA,qBAAA;AACA;;AAEA,kCAAA;AACA;EACA,mBAAA;EACA,cAAA;AACA;AAEA;EACA,mBAAA;EACA,cAAA;AACA;AAEA;EACA,mBAAA;AACA;AAEA;EACA,mBAAA;AACA;;AAEA,oCAAA;AACA;EACA,mBAAA;EACA,wCAAA;EACA,cAAA;AACA;AAEA;EACA,mBAAA;EACA,wCAAA;AACA;AAEA;EACA,cAAA;AACA;;AAEA,kCAAA;AACA;EACA,mBAAA;AACA;AAEA;EACA,cAAA;AACA;AAEA;EACA,cAAA;AACA;;AAEA,wBAAA;AACA;EACA,UAAA;AACA;AAEA;EACA,+BAAA;EACA,kBAAA;AACA;;AAEA,gDAAA;AACA;EACA,WAAA;EACA,gBAAA;AACA;AAEA;EACA,cAAA;AACA;AAEA;EACA,cAAA;AACA;AAEA;EACA,yBAAA;AACA;AAEA;EACA,gBAAA;EACA,MAAA;EACA,sBAAA;AACA;;;AAGA;;;;gDAIA;AAEA;;EAEA,mBAAA;EACA,6CAAA;EACA,QAAA;EACA,WAAA;EACA,4BAAA;AACA;;AAEA,SAAA;AACA;;EAEA,mBAAA;EACA,uCAAA;EACA,yCAAA;AACA;AAEA;;EAEA,mBAAA;EACA,8CAAA;EACA,4BAAA;AACA;AAEA;;EAEA,cAAA;AACA;AAEA;;EAEA,cAAA;EACA,mBAAA;AACA;AAEA;;EAEA,cAAA;AACA;;AAEA,UAAA;AACA;;EAEA,8BAAA;EACA,kDAAA;EACA,oDAAA;EACA,cAAA;AACA;AAEA;;EAEA,8CAAA;EACA,cAAA;AACA;;AAEA,SAAA;AACA;;EAEA,cAAA;AACA;AAEA;;EAEA,cAAA;AACA;;AAEA,aAAA;AACA;;EAEA,cAAA;AACA;;AAEA,cAAA;AACA;;EAEA,mBAAA;EACA,uCAAA;AACA;AAEA;;EAEA,cAAA;AACA;AAEA;;EAEA,oCAAA;AACA;;AAEA,WAAA;AACA;;EAEA,mBAAA;EACA,uCAAA;EACA,cAAA;AACA;AAEA;;EAEA,qBAAA;AACA;AAEA;;EAEA,cAAA;AACA;;AAEA,iBAAA;AACA;;EAEA,sCAAA;AACA;;AAEA,aAAA;AACA;;EAEA,mBAAA;EACA,cAAA;AACA;;AAEA,6CAAA;AACA;;EAEA,cAAA;AACA;;AAEA,sBAAA;AACA;;EAEA,cAAA;AACA;;AAEA,SAAA;AACA;;EAEA,qCAAA;EACA,uCAAA;EACA,cAAA;AACA;;AAEA,6BAAA;AACA;;EAEA,kCAAA;EACA,uCAAA;EACA;;;2CAGA;AACA;AAEA;;EAEA,oCAAA;EACA,cAAA;EACA,uCAAA;AACA;AAEA;;EAEA,qCAAA;EACA,+CAAA;EACA,cAAA;AACA;;AAEA,2BAAA;AACA;;EAEA,oCAAA;AACA;;AAEA,+BAAA;AACA;;EAEA,mBAAA;EACA,uCAAA;EACA,cAAA;AACA;AAEA;;EAEA,cAAA;AACA;;AAEA,mCAAA;AACA;;EAEA,mBAAA;EACA,uCAAA;EACA,cAAA;AACA;AAEA;;EAEA,mBAAA;EACA,uCAAA;EACA,cAAA;AACA;AAEA;;EAEA,mBAAA;AACA;;AAEA,qCAAA;AACA;;EAEA,mBAAA;EACA,uCAAA;AACA;AAEA;;EAEA,cAAA;AACA;AAEA;;EAEA,cAAA;AACA;AAEA;;EAEA,cAAA;AACA;;AAEA,wBAAA;AACA;;EAEA,mBAAA;AACA;AAEA;;EAEA,cAAA;AACA;AAEA;;EAEA,cAAA;AACA;;AAEA,0BAAA;AACA;;EAEA,mBAAA;EACA,8CAAA;EACA,cAAA;AACA;AAEA;;EAEA,mBAAA;EACA,8CAAA;AACA;AAEA;;EAEA,cAAA;AACA;;AAEA,wBAAA;AACA;;EAEA,mBAAA;EACA,cAAA;AACA;AAEA;;EAEA,mBAAA;EACA,cAAA;AACA;AAEA;;EAEA,mBAAA;AACA;AAEA;;EAEA,mBAAA;AACA;AAEA;;EAEA,8CAAA;AACA;AAEA;;EAEA,mBAAA;AACA;;AAEA,0BAAA;AACA;;EAEA,mBAAA;EACA,uCAAA;EACA,cAAA;AACA;;AAEA,+BAAA;AACA;;EAEA,mBAAA;EACA,uCAAA;EACA,cAAA;AACA;AAEA;;EAEA,cAAA;AACA;AAEA;;EAEA,mBAAA;EACA,qBAAA;EACA,cAAA;EACA,8BAAA;AACA;;AAEA,4BAAA;AACA;;;;EAIA,cAAA;AACA;AAEA;;EAEA,mBAAA;EACA,cAAA;AACA;AAEA;;EAEA,mBAAA;EACA,cAAA;AACA;AAEA;;EAEA,mBAAA;EACA,cAAA;AACA;;AAEA,iCAAA;AACA;;EAEA,mBAAA;EACA,uCAAA;AACA;AAEA;;EAEA,cAAA;AACA;AAEA;;;;EAIA,oCAAA;AACA;AAEA;;EAEA,cAAA;AACA;;AAEA,0CAAA;AACA;;EAEA,mBAAA;EACA,uCAAA;AACA;AAEA;;EAEA,mBAAA;EACA,6CAAA;AACA;AAEA;;EAEA,mBAAA;AACA;AAEA;;EAEA,cAAA;AACA;AAEA;;EAEA,oCAAA;AACA;AAEA;;;;;;EAMA,qCAAA;EACA,cAAA;AACA;AAEA;;EAEA,cAAA;AACA;AAEA;;EAEA,cAAA;AACA;;AAEA,sEAAA;AACA,oFAAA;AAEA;;EAEA,mBAAA;EACA,6CAAA;AACA;AAEA;;EAEA,2CAAA;AACA;AAEA;;EAEA,cAAA;AACA;AAEA;;EAEA,cAAA;AACA;AAEA;;EAEA,cAAA;AACA;AAEA;;EAEA,yBAAA;AACA;;AAEA,gDAAA;AACA;;;;EAIA,mBAAA;EACA,cAAA;EACA,uCAAA;AACA;AAEA;;;;EAIA,cAAA;AACA;;AAEA,2CAAA;AACA;;EAEA,mBAAA;EACA,uCAAA;EACA,cAAA;AACA;AAEA;;EAEA,mBAAA;EACA,uCAAA;EACA,cAAA;AACA;AAEA;;EAEA,mBAAA;EACA,qCAAA;EACA,cAAA;AACA;AAEA;;EAEA,mBAAA;EACA,qCAAA;EACA,cAAA;AACA;AAEA;;EAEA,mBAAA;EACA,sCAAA;EACA,cAAA;AACA;AAEA;;EAEA,mBAAA;EACA,sCAAA;EACA,cAAA;AACA;;AAEA,kCAAA;AACA;;EAEA,mBAAA;AACA;AAEA;;EAEA,qBAAA;EACA,mBAAA;AACA;;AAEA,sCAAA;AACA;;EAEA,mBAAA;EACA,uCAAA;AACA;AAEA;;EAEA,cAAA;AACA","file":"App.vue","sourcesContent":["<script>\nimport panelSettingsView from \"./views/panelSettingsView.vue\";\nimport compatibleSettingView from \"./views/compatibleSettingView.vue\";\nimport lookContentDialog from \"./eventEmitter_components/lookContentDialog.vue\";\nimport PageProcessingTabsView from \"./views/page-processing/PageProcessingTabsView.vue\";\nimport showImgDialog from \"./eventEmitter_components/showImgDialog.vue\";\nimport sheetDialog from \"./eventEmitter_components/sheetDialog.vue\";\nimport {eventEmitter} from \"../model/EventEmitter.js\";\nimport localMKData, {getDrawerShortcutKeyGm} from \"../data/localMKData.js\";\nimport ruleManagementView from './views/ruleManagementView.vue'\nimport RightFloatingLayoutView from \"./views/rightFloatingLayoutView.vue\";\nimport conditionalityView from \"./views/conditionalityView.vue\";\nimport overlaySettingsView from \"./views/overlaySettingsView.vue\";\nimport outputInformationView from \"./views/outputInformationView.vue\";\nimport defUtil from \"../utils/defUtil.js\";\n\n\n\nexport default {\n  components: {\n    RightFloatingLayoutView,\n    ruleManagementView,\n    panelSettingsView,\n    compatibleSettingView,\n    lookContentDialog,\n    PageProcessingTabsView,\n    showImgDialog,\n    sheetDialog,\n    conditionalityView,\n    overlaySettingsView,\n    outputInformationView\n  },\n  data() {\n    return {\n      drawer: false,\n      // 默认打开的tab\n      tabsActiveName: GM_getValue('mainTabsActiveName', '规则管理'),\n      isShowBackToTopVal: localMKData.isShowBackToTopBtn(),\n      darkModeState: GM_getValue('dark_mode_state', 'auto'),\n      systemDark: window.matchMedia('(prefers-color-scheme: dark)').matches\n    }\n  },\n  computed: {\n    isDark() {\n      if (this.darkModeState === 'dark') return true\n      if (this.darkModeState === 'light') return false\n      return this.systemDark\n    }\n  },\n  methods: {\n    tabClick(tab) {\n      GM_setValue('mainTabsActiveName', tab.name);\n    }\n  },\n  created() {\n    eventEmitter.on('主面板开关', () => {\n      this.drawer = !this.drawer;\n    })\n    document.addEventListener('keydown', (event) => {\n      eventEmitter.emit('event-keydownEvent', event);\n      if (event.key === getDrawerShortcutKeyGm()) {\n        this.drawer = !this.drawer;\n      }\n    });\n\n    eventEmitter.on('el-notify', (options) => {\n      if (!options['position']) {\n        options.position = 'bottom-right';\n      }\n      this.$notify(options)\n    })\n    eventEmitter.on('el-msg', (...options) => {\n      this.$message(...options)\n    })\n\n    eventEmitter.on('el-alert', (...options) => {\n      this.$alert(...options);\n    })\n\n    eventEmitter.handler('el-confirm', (...options) => {\n      return this.$confirm(...options);\n    })\n\n    eventEmitter.handler('el-prompt', (...options) => {\n      return this.$prompt(...options)\n    })\n    const alertFunDebounce = defUtil.debounce((response, bvId) => {\n      this.$alert(`请求获取视频信息失败，状态码：${response.status}，bv号：${bvId}\n                \\n。已自动禁用根据bv号网络请求获取视频信息状态\n                \\n如需关闭，请在面板条件限制里手动关闭。`, '错误', {\n        confirmButtonText: '确定',\n        type: 'error'\n      })\n    }, 2000)\n    eventEmitter.on('请求获取视频信息失败', (response, bvId) => {\n      eventEmitter.send('更新根据bv号网络请求获取视频信息状态', true)\n      alertFunDebounce(response, bvId)\n    })\n\n    eventEmitter.on('e:设置顶部按钮状态', (show) => {\n      this.isShowBackToTopVal = show\n    })\n\n    eventEmitter.on('toggle-dark-mode', (val) => {\n      this.darkModeState = val\n    })\n\n    // 监听系统深色模式变化，同步面板 .theme-dark\n    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {\n      this.systemDark = e.matches\n    })\n  }\n}\n</script>\n\n<template>\n  <div :class=\"{ 'theme-dark': isDark }\">\n    <el-drawer :modal=\"false\"\n               :visible.sync=\"drawer\"\n               :with-header=\"false\"\n               direction=\"ltr\"\n               size=\"60%\"\n               style=\"position: fixed\">\n      <el-tabs v-model=\"tabsActiveName\" type=\"border-card\"\n               @tab-click=\"tabClick\">\n        <el-tab-pane label=\"面板设置\" lazy name=\"面板设置\">\n          <panelSettingsView/>\n        </el-tab-pane>\n        <el-tab-pane label=\"规则管理\" lazy name=\"规则管理\">\n          <ruleManagementView/>\n        </el-tab-pane>\n        <el-tab-pane label=\"页面处理\" lazy name=\"页面处理\">\n          <PageProcessingTabsView/>\n        </el-tab-pane>\n        <el-tab-pane label=\"兼容设置\" lazy name=\"兼容设置\">\n          <compatibleSettingView/>\n        </el-tab-pane>\n        <el-tab-pane label=\"条件限制\" lazy name=\"条件限制\">\n          <conditionalityView/>\n        </el-tab-pane>\n        <el-tab-pane label=\"叠加层设置\" lazy name=\"叠加层设置\">\n          <overlaySettingsView/>\n        </el-tab-pane>\n        <el-tab-pane label=\"输出信息\" lazy name=\"输出信息\">\n          <outputInformationView/>\n        </el-tab-pane>\n      </el-tabs>\n    </el-drawer>\n    <lookContentDialog/>\n    <showImgDialog/>\n    <sheetDialog/>\n    <RightFloatingLayoutView/>\n    <el-backtop v-if=\"isShowBackToTopVal\"/>\n  </div>\n</template>\n\n<style>\n\n\n\n.el-drawer.ltr {\n  background: #F5F6F8;\n  border-right: 1px solid rgba(0, 0, 0, 0.05);\n  top: 15%;\n  height: 70%;\n  border-radius: 0 12px 12px 0;\n}\n\n.el-drawer__body {\n  padding: 0 16px 12px 16px;\n}\n\n\n.el-tabs--border-card {\n  background: #FFFFFF;\n  border: 1px solid rgba(0, 0, 0, 0.05);\n  border-radius: 12px;\n  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.04);\n}\n.el-tabs--border-card > .el-tabs__header {\n  background: #FFFFFF;\n  border-bottom: 1px solid rgba(0, 0, 0, 0.05);\n  margin: 0;\n  position: sticky;\n  top: 0;\n  z-index: 10;\n  border-radius: 12px 12px 0 0;\n}\n\n.el-tabs--border-card > .el-tabs__header .el-tabs__nav {\n  border: none;\n  border-radius: 0;\n}\n\n.el-tabs--border-card > .el-tabs__header .el-tabs__item {\n  border: none;\n  color: #9499A0;\n  font-weight: 500;\n  font-size: 13px;\n  padding: 0 18px;\n  height: 40px;\n  line-height: 40px;\n  transition: color 0.2s ease, background 0.2s ease;\n}\n\n.el-tabs--border-card > .el-tabs__header .el-tabs__item.is-active {\n  color: #FB7299;\n  background: #FFFFFF;\n}\n\n.el-tabs--border-card > .el-tabs__header .el-tabs__item:hover {\n  color: #FB7299;\n}\n\n\n.el-tabs--border-card > .el-tabs__header .el-tabs__item.is-active::after {\n  content: '';\n  position: absolute;\n  bottom: 0;\n  left: 12px;\n  right: 12px;\n  height: 2px;\n  background: #FB7299;\n  border-radius: 1px;\n}\n\n.el-tabs__content {\n  padding: 16px;\n}\n\n\n.el-card {\n  border-radius: 10px !important;\n  border: 1px solid rgba(0, 0, 0, 0.05) !important;\n  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.03) !important;\n  background: #FFFFFF;\n  margin-bottom: 12px;\n}\n\n.el-card__header {\n  background: transparent;\n  border-bottom: 1px solid rgba(0, 0, 0, 0.05);\n  padding: 14px 16px;\n  font-weight: 600;\n  font-size: 14px;\n  color: #18191C;\n}\n\n.el-card__body {\n  padding: 16px;\n}\n\n\n.el-button {\n  font-weight: 500;\n  transition: all 0.2s ease;\n}\n\n.el-button--primary {\n  background: linear-gradient(135deg, #FB7299 0%, #fc8aab 100%) !important;\n  border-color: transparent !important;\n  color: #fff !important;\n  box-shadow: 0 2px 8px rgba(251, 114, 153, 0.25);\n}\n\n.el-button--primary:hover {\n  background: linear-gradient(135deg, #FB7299 0%, #fd9bb7 100%) !important;\n  box-shadow: 0 4px 14px rgba(251, 114, 153, 0.35);\n}\n\n\n.el-radio-button__inner {\n  background: #FFFFFF;\n  border-color: #DCDFE6;\n  color: #606266;\n}\n\n.el-radio-button:first-child .el-radio-button__inner {\n  border-left-width: 0;\n}\n\n.el-radio-button__inner:hover {\n  color: #FB7299;\n}\n\n.el-radio-button.is-active .el-radio-button__inner {\n  background: #FB7299;\n  border-color: #FB7299;\n  color: #FFFFFF;\n  box-shadow: -1px 0 0 0 #FB7299;\n}\n\n.el-radio-button.is-active:first-child .el-radio-button__inner {\n  box-shadow: none;\n}\n\n\n.el-switch__label.is-active {\n  color: #FB7299;\n}\n\n.el-switch.is-checked .el-switch__core {\n  border-color: #FB7299;\n  background-color: #FB7299;\n}\n\n\n.el-divider__text {\n  color: #9499A0;\n  font-weight: 500;\n}\n\n\n.el-dropdown-menu__item:hover {\n  color: #FB7299;\n  background: rgba(251, 114, 153, 0.06);\n}\n\n\n.el-tooltip__popper {\n  border-radius: 6px;\n}\n\n\n.el-notification {\n  border-radius: 10px;\n  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);\n}\n\n\n.el-input .el-input__inner,\n.el-textarea .el-textarea__inner,\n.el-cascader .el-input__inner,\n.el-select .el-input__inner,\n.el-date-editor .el-input__inner,\n.el-range-editor .el-input__inner,\n.el-input-number .el-input__inner {\n  background-color: #FFFFFF;\n  border-color: #DCDFE6;\n  color: #18191C;\n}\n\n.el-input .el-input__inner:focus,\n.el-textarea .el-textarea__inner:focus {\n  border-color: #FB7299;\n}\n\n\n.el-table {\n  background: #FFFFFF;\n  color: #18191C;\n}\n\n.el-table th.el-table__cell {\n  background: #F5F6F8;\n  color: #18191C;\n}\n\n.el-table tr {\n  background: #FFFFFF;\n}\n\n.el-table--striped .el-table__body tr.el-table__row--striped td {\n  background: #FAFAFB;\n}\n\n\n.el-collapse-item__header {\n  background: #FFFFFF;\n  border-bottom-color: rgba(0, 0, 0, 0.05);\n  color: #18191C;\n}\n\n.el-collapse-item__wrap {\n  background: #FFFFFF;\n  border-bottom-color: rgba(0, 0, 0, 0.05);\n}\n\n.el-collapse-item__content {\n  color: #9499A0;\n}\n\n\n.el-dialog {\n  background: #FFFFFF;\n}\n\n.el-dialog__header {\n  color: #18191C;\n}\n\n.el-dialog__body {\n  color: #18191C;\n}\n\n\n.el-drawer__body::-webkit-scrollbar {\n  width: 5px;\n}\n\n.el-drawer__body::-webkit-scrollbar-thumb {\n  background: rgba(0, 0, 0, 0.12);\n  border-radius: 4px;\n}\n\n\n.el-tabs--left .el-tabs__item {\n  color: #555;\n  font-weight: 500;\n}\n\n.el-tabs--left .el-tabs__item.is-active {\n  color: #FB7299;\n}\n\n.el-tabs--left .el-tabs__item:hover {\n  color: #FB7299;\n}\n\n.el-tabs--left .el-tabs__active-bar {\n  background-color: #FB7299;\n}\n\n.el-tabs--left .el-tabs__header {\n  position: sticky;\n  top: 0;\n  align-self: flex-start;\n}\n\n\n\n\n.theme-dark .el-drawer.ltr,\n.bb-dark .el-drawer.ltr {\n  background: #1A1B1E;\n  border-right-color: rgba(255, 255, 255, 0.04);\n  top: 15%;\n  height: 70%;\n  border-radius: 0 12px 12px 0;\n}\n\n\n.theme-dark .el-tabs--border-card,\n.bb-dark .el-tabs--border-card {\n  background: #212226;\n  border-color: rgba(255, 255, 255, 0.05);\n  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.3);\n}\n\n.theme-dark .el-tabs--border-card > .el-tabs__header,\n.bb-dark .el-tabs--border-card > .el-tabs__header {\n  background: #212226;\n  border-bottom-color: rgba(255, 255, 255, 0.05);\n  border-radius: 12px 12px 0 0;\n}\n\n.theme-dark .el-tabs--border-card > .el-tabs__header .el-tabs__item,\n.bb-dark .el-tabs--border-card > .el-tabs__header .el-tabs__item {\n  color: #7A7A80;\n}\n\n.theme-dark .el-tabs--border-card > .el-tabs__header .el-tabs__item.is-active,\n.bb-dark .el-tabs--border-card > .el-tabs__header .el-tabs__item.is-active {\n  color: #FB7299;\n  background: #212226;\n}\n\n.theme-dark .el-tabs--border-card > .el-tabs__header .el-tabs__item:hover,\n.bb-dark .el-tabs--border-card > .el-tabs__header .el-tabs__item:hover {\n  color: #FB7299;\n}\n\n\n.theme-dark .el-card,\n.bb-dark .el-card {\n  background: #27282C !important;\n  border-color: rgba(255, 255, 255, 0.05) !important;\n  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.25) !important;\n  color: #D0D0D4;\n}\n\n.theme-dark .el-card__header,\n.bb-dark .el-card__header {\n  border-bottom-color: rgba(255, 255, 255, 0.05);\n  color: #E8E8EA;\n}\n\n\n.theme-dark,\n.bb-dark {\n  color: #D0D0D4;\n}\n\n.theme-dark .el-text,\n.bb-dark .el-text {\n  color: #D0D0D4;\n}\n\n\n.theme-dark .el-divider__text,\n.bb-dark .el-divider__text {\n  color: #7A7A80;\n}\n\n\n.theme-dark .el-dropdown-menu,\n.bb-dark .el-dropdown-menu {\n  background: #2A2B2F;\n  border-color: rgba(255, 255, 255, 0.06);\n}\n\n.theme-dark .el-dropdown-menu__item,\n.bb-dark .el-dropdown-menu__item {\n  color: #D0D0D4;\n}\n\n.theme-dark .el-dropdown-menu__item:hover,\n.bb-dark .el-dropdown-menu__item:hover {\n  background: rgba(251, 114, 153, 0.1);\n}\n\n\n.theme-dark .el-input__inner,\n.bb-dark .el-input__inner {\n  background: #2A2B2F;\n  border-color: rgba(255, 255, 255, 0.08);\n  color: #E8E8EA;\n}\n\n.theme-dark .el-input__inner:focus,\n.bb-dark .el-input__inner:focus {\n  border-color: #FB7299;\n}\n\n.theme-dark .el-input__inner::placeholder,\n.bb-dark .el-input__inner::placeholder {\n  color: #5A5A60;\n}\n\n\n.theme-dark .el-color-picker__trigger,\n.bb-dark .el-color-picker__trigger {\n  border-color: rgba(255, 255, 255, 0.1);\n}\n\n\n.theme-dark .el-tooltip__popper,\n.bb-dark .el-tooltip__popper {\n  background: #2A2B2F;\n  color: #D0D0D4;\n}\n\n\n.theme-dark .el-switch__label *,\n.bb-dark .el-switch__label * {\n  color: #D0D0D4;\n}\n\n\n.theme-dark .el-tab-pane,\n.bb-dark .el-tab-pane {\n  color: #D0D0D4;\n}\n\n\n.theme-dark .el-tag,\n.bb-dark .el-tag {\n  background: rgba(255, 255, 255, 0.04);\n  border-color: rgba(255, 255, 255, 0.08);\n  color: #D0D0D4;\n}\n\n\n.theme-dark .floating-panel,\n.bb-dark .floating-panel {\n  background: rgba(30, 31, 34, 0.88);\n  border-color: rgba(255, 255, 255, 0.06);\n  box-shadow:\n    0 8px 32px rgba(0, 0, 0, 0.3),\n    0 2px 8px rgba(0, 0, 0, 0.2),\n    inset 0 1px 0 rgba(255, 255, 255, 0.04);\n}\n\n.theme-dark .panel-btn--secondary,\n.bb-dark .panel-btn--secondary {\n  background: rgba(251, 114, 153, 0.1);\n  color: #fc8aab;\n  border-color: rgba(251, 114, 153, 0.15);\n}\n\n.theme-dark .panel-btn--secondary:hover,\n.bb-dark .panel-btn--secondary:hover {\n  background: rgba(251, 114, 153, 0.18);\n  box-shadow: 0 2px 10px rgba(251, 114, 153, 0.2);\n  color: #FB7299;\n}\n\n\n.theme-dark .el-drawer__body::-webkit-scrollbar-thumb,\n.bb-dark .el-drawer__body::-webkit-scrollbar-thumb {\n  background: rgba(255, 255, 255, 0.1);\n}\n\n\n.theme-dark .el-notification,\n.bb-dark .el-notification {\n  background: #2A2B2F;\n  border-color: rgba(255, 255, 255, 0.06);\n  color: #D0D0D4;\n}\n\n.theme-dark .el-notification__title,\n.bb-dark .el-notification__title {\n  color: #E8E8EA;\n}\n\n\n.theme-dark .el-button--default,\n.bb-dark .el-button--default {\n  background: #2A2B2F;\n  border-color: rgba(255, 255, 255, 0.08);\n  color: #D0D0D4;\n}\n\n.theme-dark .el-button--default:hover,\n.bb-dark .el-button--default:hover {\n  background: #36373C;\n  border-color: rgba(255, 255, 255, 0.15);\n  color: #E8E8EA;\n}\n\n.theme-dark .el-button--default:active,\n.bb-dark .el-button--default:active {\n  background: #212226;\n}\n\n\n.theme-dark .el-message-box,\n.bb-dark .el-message-box {\n  background: #2A2B2F;\n  border-color: rgba(255, 255, 255, 0.06);\n}\n\n.theme-dark .el-message-box__title,\n.bb-dark .el-message-box__title {\n  color: #E8E8EA;\n}\n\n.theme-dark .el-message-box__message,\n.bb-dark .el-message-box__message {\n  color: #D0D0D4;\n}\n\n.theme-dark .el-message-box__content,\n.bb-dark .el-message-box__content {\n  color: #D0D0D4;\n}\n\n\n.theme-dark .el-dialog,\n.bb-dark .el-dialog {\n  background: #27282C;\n}\n\n.theme-dark .el-dialog__header,\n.bb-dark .el-dialog__header {\n  color: #E8E8EA;\n}\n\n.theme-dark .el-dialog__body,\n.bb-dark .el-dialog__body {\n  color: #D0D0D4;\n}\n\n\n.theme-dark .el-collapse-item__header,\n.bb-dark .el-collapse-item__header {\n  background: #27282C;\n  border-bottom-color: rgba(255, 255, 255, 0.05);\n  color: #D0D0D4;\n}\n\n.theme-dark .el-collapse-item__wrap,\n.bb-dark .el-collapse-item__wrap {\n  background: #212226;\n  border-bottom-color: rgba(255, 255, 255, 0.05);\n}\n\n.theme-dark .el-collapse-item__content,\n.bb-dark .el-collapse-item__content {\n  color: #9499A0;\n}\n\n\n.theme-dark .el-table,\n.bb-dark .el-table {\n  background: #212226;\n  color: #D0D0D4;\n}\n\n.theme-dark .el-table th.el-table__cell,\n.bb-dark .el-table th.el-table__cell {\n  background: #1A1B1E;\n  color: #D0D0D4;\n}\n\n.theme-dark .el-table tr,\n.bb-dark .el-table tr {\n  background: #212226;\n}\n\n.theme-dark .el-table--striped .el-table__body tr.el-table__row--striped td,\n.bb-dark .el-table--striped .el-table__body tr.el-table__row--striped td {\n  background: #27282C;\n}\n\n.theme-dark .el-table td.el-table__cell,\n.bb-dark .el-table td.el-table__cell {\n  border-bottom-color: rgba(255, 255, 255, 0.04);\n}\n\n.theme-dark .el-table__body tr:hover > td,\n.bb-dark .el-table__body tr:hover > td {\n  background: #2A2B2F;\n}\n\n\n.theme-dark .el-textarea__inner,\n.bb-dark .el-textarea__inner {\n  background: #2A2B2F;\n  border-color: rgba(255, 255, 255, 0.08);\n  color: #E8E8EA;\n}\n\n\n.theme-dark .el-radio-button__inner,\n.bb-dark .el-radio-button__inner {\n  background: #2A2B2F;\n  border-color: rgba(255, 255, 255, 0.08);\n  color: #D0D0D4;\n}\n\n.theme-dark .el-radio-button__inner:hover,\n.bb-dark .el-radio-button__inner:hover {\n  color: #FB7299;\n}\n\n.theme-dark .el-radio-button.is-active .el-radio-button__inner,\n.bb-dark .el-radio-button.is-active .el-radio-button__inner {\n  background: #FB7299;\n  border-color: #FB7299;\n  color: #FFFFFF;\n  box-shadow: -1px 0 0 0 #FB7299;\n}\n\n\n.theme-dark .el-pagination__total,\n.theme-dark .el-pagination__jump,\n.bb-dark .el-pagination__total,\n.bb-dark .el-pagination__jump {\n  color: #D0D0D4;\n}\n\n.theme-dark .el-pagination button,\n.bb-dark .el-pagination button {\n  background: #2A2B2F;\n  color: #D0D0D4;\n}\n\n.theme-dark .el-pager li,\n.bb-dark .el-pager li {\n  background: #2A2B2F;\n  color: #D0D0D4;\n}\n\n.theme-dark .el-pager li.active,\n.bb-dark .el-pager li.active {\n  background: #FB7299;\n  color: #E8E8EA;\n}\n\n\n.theme-dark .el-select-dropdown,\n.bb-dark .el-select-dropdown {\n  background: #2A2B2F;\n  border-color: rgba(255, 255, 255, 0.06);\n}\n\n.theme-dark .el-select-dropdown__item,\n.bb-dark .el-select-dropdown__item {\n  color: #D0D0D4;\n}\n\n.theme-dark .el-select-dropdown__item.hover,\n.bb-dark .el-select-dropdown__item.hover,\n.theme-dark .el-select-dropdown__item:hover,\n.bb-dark .el-select-dropdown__item:hover {\n  background: rgba(251, 114, 153, 0.1);\n}\n\n.theme-dark .el-select-dropdown__item.selected,\n.bb-dark .el-select-dropdown__item.selected {\n  color: #FB7299;\n}\n\n\n.theme-dark .el-cascader-panel,\n.bb-dark .el-cascader-panel {\n  background: #2A2B2F;\n  border-color: rgba(255, 255, 255, 0.06);\n}\n\n.theme-dark .el-cascader-menu,\n.bb-dark .el-cascader-menu {\n  background: #2A2B2F;\n  border-right-color: rgba(255, 255, 255, 0.06);\n}\n\n.theme-dark .el-cascader-menu__wrap,\n.bb-dark .el-cascader-menu__wrap {\n  background: #2A2B2F;\n}\n\n.theme-dark .el-cascader-node,\n.bb-dark .el-cascader-node {\n  color: #D0D0D4;\n}\n\n.theme-dark .el-cascader-node:not(.is-disabled):hover,\n.bb-dark .el-cascader-node:not(.is-disabled):hover {\n  background: rgba(251, 114, 153, 0.1);\n}\n\n.theme-dark .el-cascader-node.in-active-path,\n.bb-dark .el-cascader-node.in-active-path,\n.theme-dark .el-cascader-node.is-active,\n.bb-dark .el-cascader-node.is-active,\n.theme-dark .el-cascader-node.is-selectable.in-checked-path,\n.bb-dark .el-cascader-node.is-selectable.in-checked-path {\n  background: rgba(251, 114, 153, 0.12);\n  color: #FB7299;\n}\n\n.theme-dark .el-cascader-node__label,\n.bb-dark .el-cascader-node__label {\n  color: #D0D0D4;\n}\n\n.theme-dark .el-cascader-node__prefix,\n.bb-dark .el-cascader-node__prefix {\n  color: #D0D0D4;\n}\n\n\n\n\n.theme-dark .el-tabs--left .el-tabs__header,\n.bb-dark .el-tabs--left .el-tabs__header {\n  background: #1A1B1E;\n  border-right-color: rgba(255, 255, 255, 0.05);\n}\n\n.theme-dark .el-tabs--left .el-tabs__nav-wrap::after,\n.bb-dark .el-tabs--left .el-tabs__nav-wrap::after {\n  background-color: rgba(255, 255, 255, 0.05);\n}\n\n.theme-dark .el-tabs--left .el-tabs__item,\n.bb-dark .el-tabs--left .el-tabs__item {\n  color: #C0C0C8;\n}\n\n.theme-dark .el-tabs--left .el-tabs__item.is-active,\n.bb-dark .el-tabs--left .el-tabs__item.is-active {\n  color: #FB7299;\n}\n\n.theme-dark .el-tabs--left .el-tabs__item:hover,\n.bb-dark .el-tabs--left .el-tabs__item:hover {\n  color: #FB7299;\n}\n\n.theme-dark .el-tabs--left .el-tabs__active-bar,\n.bb-dark .el-tabs--left .el-tabs__active-bar {\n  background-color: #FB7299;\n}\n\n\n.theme-dark .el-input-number__decrease,\n.bb-dark .el-input-number__decrease,\n.theme-dark .el-input-number__increase,\n.bb-dark .el-input-number__increase {\n  background: #2A2B2F;\n  color: #D0D0D4;\n  border-color: rgba(255, 255, 255, 0.08);\n}\n\n.theme-dark .el-input-number__decrease:hover,\n.bb-dark .el-input-number__decrease:hover,\n.theme-dark .el-input-number__increase:hover,\n.bb-dark .el-input-number__increase:hover {\n  color: #FB7299;\n}\n\n\n.theme-dark .el-button--info,\n.bb-dark .el-button--info {\n  background: #2A2B2F;\n  border-color: rgba(255, 255, 255, 0.08);\n  color: #D0D0D4;\n}\n\n.theme-dark .el-button--info:hover,\n.bb-dark .el-button--info:hover {\n  background: #36373C;\n  border-color: rgba(255, 255, 255, 0.15);\n  color: #E8E8EA;\n}\n\n.theme-dark .el-button--warning,\n.bb-dark .el-button--warning {\n  background: #3A3528;\n  border-color: rgba(230, 162, 60, 0.3);\n  color: #E6A23C;\n}\n\n.theme-dark .el-button--warning:hover,\n.bb-dark .el-button--warning:hover {\n  background: #4A3F2A;\n  border-color: rgba(230, 162, 60, 0.5);\n  color: #F0B84C;\n}\n\n.theme-dark .el-button--danger,\n.bb-dark .el-button--danger {\n  background: #3A2828;\n  border-color: rgba(245, 108, 108, 0.3);\n  color: #F56C6C;\n}\n\n.theme-dark .el-button--danger:hover,\n.bb-dark .el-button--danger:hover {\n  background: #4A2E2E;\n  border-color: rgba(245, 108, 108, 0.5);\n  color: #F78D8D;\n}\n\n\n.theme-dark .el-slider__runway,\n.bb-dark .el-slider__runway {\n  background: #36373C;\n}\n\n.theme-dark .el-slider__button,\n.bb-dark .el-slider__button {\n  border-color: #FB7299;\n  background: #2A2B2F;\n}\n\n\n.theme-dark .el-popconfirm,\n.bb-dark .el-popconfirm {\n  background: #2A2B2F;\n  border-color: rgba(255, 255, 255, 0.06);\n}\n\n.theme-dark .el-popconfirm__title,\n.bb-dark .el-popconfirm__title {\n  color: #D0D0D4;\n}\n</style>\n"]}, media: undefined });
  };
  
  const __vue_scope_id__$2 = undefined;
  
  const __vue_module_identifier__$2 = undefined;
  
  const __vue_is_functional_template__$2 = false;
  
  
  
  
  
  const __vue_component__$2 = normalizeComponent(
    { render: __vue_render__$2, staticRenderFns: __vue_staticRenderFns__$2 },
    __vue_inject_styles__$2,
    __vue_script__$2,
    __vue_scope_id__$2,
    __vue_is_functional_template__$2,
    __vue_module_identifier__$2,
    false,
    createInjector);var script$1 = {
  name: "GzSpace",
  props: {
    wrap: {
      type: Boolean,
      default: false
    },
    size: {
      type: String,
      default: "8px"
    },
    direction: {
      type: String,
      default: "row"
    }
  },
  computed: {
    sizeStyle() {
      return {
        display: "flex",
        gap: this.size,
        "flex-direction": this.direction === "row" ? "row" : "column",
        "flex-wrap": this.wrap ? "wrap" : "nowrap"
      };
    }
  }
};
const __vue_script__$1 = script$1;
var __vue_render__$1 = function () {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _c("div", { style: _vm.sizeStyle }, [_vm._t("default")], 2)
};
var __vue_staticRenderFns__$1 = [];
__vue_render__$1._withStripped = true;
  
  const __vue_inject_styles__$1 = undefined;
  
  const __vue_scope_id__$1 = undefined;
  
  const __vue_module_identifier__$1 = undefined;
  
  const __vue_is_functional_template__$1 = false;
  
  
  
  
  
  
  
  const __vue_component__$1 = normalizeComponent(
    { render: __vue_render__$1, staticRenderFns: __vue_staticRenderFns__$1 },
    __vue_inject_styles__$1,
    __vue_script__$1,
    __vue_scope_id__$1,
    __vue_is_functional_template__$1,
    __vue_module_identifier__$1,
    false,
    undefined);var script = {
  name: "GzText"
};
const __vue_script__ = script;
var __vue_render__ = function () {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _c(
    "span",
    {
      staticStyle: {
        "font-size": "14px",
        margin: "0",
        padding: "0",
        "overflow-wrap": "break-word",
      },
    },
    [_vm._t("default")],
    2
  )
};
var __vue_staticRenderFns__ = [];
__vue_render__._withStripped = true;
  
  const __vue_inject_styles__ = undefined;
  
  const __vue_scope_id__ = undefined;
  
  const __vue_module_identifier__ = undefined;
  
  const __vue_is_functional_template__ = false;
  
  
  
  
  
  
  
  const __vue_component__ = normalizeComponent(
    { render: __vue_render__, staticRenderFns: __vue_staticRenderFns__ },
    __vue_inject_styles__,
    __vue_script__,
    __vue_scope_id__,
    __vue_is_functional_template__,
    __vue_module_identifier__,
    false,
    undefined);const initVueUI = () => {
  if (document.head.querySelector("#element-ui-css") === null) {
    const linkElement = document.createElement("link");
    linkElement.rel = "stylesheet";
    linkElement.href = "https://unpkg.com/element-ui@2.15.14/lib/theme-chalk/index.css";
    linkElement.id = "element-ui-css";
    document.head.appendChild(linkElement);
    linkElement.addEventListener("load", () => {
      console.log("element-ui样式加载完成");
    });
  }
  const { vueDiv } = elUtil.createVueDiv(document.body);
  window.mk_vue_app = initVueApp(vueDiv, __vue_component__$2);
  Vue.component("gz-space", __vue_component__$1);
  Vue.component("gz-text", __vue_component__);
  addGzStyle(document);
  cssManager.updateCssVModal();
};
if (window.___inject && /www\.bilibili\.com\/\?page=/.test(location.href)) {
  const tryInit = () => {
    if (document.querySelector("#bewly")) {
      initVueUI();
    } else {
      setTimeout(tryInit, 100);
    }
  };
  setTimeout(tryInit, 200);
} else {
  window.addEventListener("DOMContentLoaded", initVueUI);
}
GM_addStyle(defCss);
(function initDarkModeSync() {
  const oldVal = GM_getValue("dark_mode", void 0);
  if (oldVal !== void 0) {
    GM_setValue("dark_mode_state", oldVal ? "dark" : "auto");
    GM_deleteValue("dark_mode");
  }
  const darkMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const sync = () => {
    if (!document.body) return;
    const state = GM_getValue("dark_mode_state", "auto");
    if (state === "dark") {
      document.body.classList.add("bb-dark");
    } else if (state === "light") {
      document.body.classList.remove("bb-dark");
    } else {
      document.body.classList.toggle("bb-dark", darkMediaQuery.matches);
    }
  };
  if (document.body) {
    sync();
  } else {
    document.addEventListener("DOMContentLoaded", sync);
  }
  darkMediaQuery.addEventListener("change", sync);
  window.addEventListener("bb-dark-mode-change", sync);
})();const isSearch = (url) => {
  return url.includes("search.bilibili.com");
};
const isSearchVideoNetWorkUrl = (netUrl) => {
  if (netUrl.includes("api.bilibili.com/x/web-interface/wbi/search/all/v2")) return true;
  if (!netUrl.includes("api.bilibili.com/x/web-interface/wbi/search/type")) return false;
  const parseUrl = urlUtil.parseUrl(netUrl);
  const search_type = parseUrl.queryParams["search_type"] || null;
  return search_type === "video";
};
const getVideoList$2 = async (css) => {
  const elList = await elUtil.findElements(css, { interval: 200 });
  const list = [];
  for (let el of elList) {
    const title = el.querySelector(".bili-video-card__info--tit").title;
    const userEl = el.querySelector(".bili-video-card__info--owner");
    if (userEl === null) {
      console.log("获取不到该视频卡片的用户地址，", el);
      el?.remove();
      continue;
    }
    const userUrl = userEl.getAttribute("href");
    if (!userUrl.includes("//space.bilibili.com/")) {
      el?.remove();
      console.log("移除了非视频内容", userUrl, el);
      continue;
    }
    const videoUrl = el.querySelector(".bili-video-card__info--right>a")?.href;
    if (videoUrl?.includes("live.bilibili.com/")) {
      el?.remove();
      console.log("移除了综合选项卡视频列表中的直播内容", title, videoUrl, el);
      continue;
    }
    const bv = urlUtil.getUrlBV(videoUrl);
    const uid = urlUtil.getUrlUID(userUrl);
    const name = userEl.querySelector(".bili-video-card__info--author").textContent.trim();
    const bili_video_card__stats_item = el.querySelectorAll(".bili-video-card__stats--item");
    let nPlayCount = bili_video_card__stats_item[0]?.textContent.trim();
    nPlayCount = strFormatUtil.toPlayCountOrBulletChat(nPlayCount);
    let nBulletChat = bili_video_card__stats_item[1]?.textContent.trim();
    nBulletChat = strFormatUtil.toPlayCountOrBulletChat(nBulletChat);
    let nDuration = el.querySelector(".bili-video-card__stats__duration")?.textContent.trim();
    nDuration = strFormatUtil.timeStringToSeconds(nDuration);
    list.push({
      title,
      userUrl,
      name,
      uid,
      bv,
      nPlayCount,
      nBulletChat,
      nDuration,
      el,
      videoUrl,
      insertionPositionEl: el.querySelector(".bili-video-card__info--bottom"),
      explicitSubjectEl: el.querySelector(".bili-video-card__info")
    });
  }
  return list;
};
const getTabComprehensiveSortedVideoList = () => {
  return getVideoList$2(".video.i_wrapper.search-all-list>.video-list>div");
};
const getOtherVideoList = () => {
  return getVideoList$2(".search-page.search-page-video>.video-list.row>div:not(:empty)");
};
const startShieldingCSVideoList = async () => {
  const list = await getTabComprehensiveSortedVideoList();
  for (let videoData of list) {
    video_shielding.shieldingVideoDecorated(videoData).catch(() => {
      eventEmitter.send("视频添加屏蔽按钮", { data: videoData, maskingFunc: startShieldingCSVideoList });
    });
  }
};
const startShieldingOtherVideoList = async () => {
  const list = await getOtherVideoList();
  for (let videoData of list) {
    video_shielding.shieldingVideoDecorated(videoData).catch(() => {
      eventEmitter.send("视频添加屏蔽按钮", { data: videoData, maskingFunc: startShieldingOtherVideoList });
    });
  }
};
const getTwTabActiveItem = async () => {
  const twoTabActiveItem = await elUtil.findElement(".vui_button.vui_button--tab.vui_button--active.mr_sm", { interval: 200 });
  const twoTabActiveItemLabel = twoTabActiveItem.textContent.trim();
  return { el: twoTabActiveItemLabel, label: twoTabActiveItemLabel };
};
const startShieldingVideoList$3 = async () => {
  const topTabActiveItem = await elUtil.findElement(".vui_tabs--nav-item.vui_tabs--nav-item-active", { interval: 200 });
  const topTabActiveItemLabel = topTabActiveItem.textContent.trim();
  console.log(topTabActiveItemLabel);
  if (topTabActiveItemLabel !== "综合") {
    await startShieldingOtherVideoList();
    return;
  }
  const { label } = await getTwTabActiveItem();
  if (label !== "综合排序") {
    await startShieldingOtherVideoList();
    return;
  }
  const parseUrl = urlUtil.parseUrl(window.location.href);
  if (parseUrl.queryParams["page"] || parseUrl.queryParams["pubtime_begin_s"]) {
    await startShieldingOtherVideoList();
  } else {
    await startShieldingCSVideoList();
    await processingExactSearchVideoCardContent();
  }
};
const processingExactSearchVideoCardContent = async () => {
  let el = await elUtil.findElement(".user-list.search-all-list", { interval: 50, timeout: 4e3 });
  if (el === null) return;
  const infoCardEl = el.querySelector(".info-card");
  const userNameEl = infoCardEl.querySelector(".user-name");
  const name = userNameEl.textContent.trim();
  const userUrl = userNameEl.href;
  const uid = urlUtil.getUrlUID(userUrl);
  if (ruleMatchingUtil.exactMatch(ruleKeyListData.getPreciseUidArr(), uid)) {
    el.remove();
    eventEmitter.send("打印信息", `根据精确uid匹配到用户${name}-【${uid}】`);
    return;
  }
  let fuzzyMatch = ruleMatchingUtil.fuzzyMatch(ruleKeyListData.getNameArr(), name);
  if (fuzzyMatch) {
    el.remove();
    eventEmitter.send("打印信息", `根据模糊用户名【${fuzzyMatch}】匹配到用户${name}-【${uid}】`);
    return;
  }
  fuzzyMatch = ruleMatchingUtil.regexMatch(ruleKeyListData.getNameCanonical(), name);
  if (fuzzyMatch) {
    el.remove();
    eventEmitter.send("打印信息", `根据正则用户名【${fuzzyMatch}】匹配到用户${name}-【${uid}】`);
    return;
  }
  const insertionPositionEl = el.querySelector(".info-card.flex_start");
  shielding.addBlockButton({
    data: {
      name,
      uid,
      insertionPositionEl
    }
  });
  const videoElList = el.querySelectorAll(".video-list>.video-list-item");
  const list = [];
  for (let videoEl of videoElList) {
    const titleEl = videoEl.querySelector(".bili-video-card__info--right>a");
    const videoUrl = titleEl.href;
    const bv = urlUtil.getUrlBV(videoUrl);
    const title = titleEl.textContent.trim();
    let nDuration = videoEl.querySelector(".bili-video-card__stats__duration")?.textContent.trim();
    nDuration = strFormatUtil.timeStringToSeconds(nDuration);
    let nPlayCount = videoEl.querySelector(".bili-video-card__stats--item>span")?.textContent.trim();
    nPlayCount = strFormatUtil.toPlayCountOrBulletChat(nPlayCount);
    list.push({
      title,
      userUrl,
      name,
      uid,
      bv,
      nPlayCount,
      nDuration,
      el: videoEl,
      videoUrl
    });
  }
  for (let videoData of list) {
    video_shielding.shieldingVideoDecorated(videoData);
  }
};
const delFooterContent = () => {
  if (!GM_getValue("isRemoveSearchBottomContent", false)) {
    return;
  }
  elUtil.findElement("#biliMainFooter").then((el) => {
    el.remove();
    eventEmitter.send("打印信息", "已删除底部内容");
  });
};
var searchModel = {
  isSearch,
  startShieldingVideoList: startShieldingVideoList$3,
  delFooterContent,
  isSearchVideoNetWorkUrl
};var __defProp = Object.defineProperty;
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, key + "" , value);
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), member.set(obj, value), value);
var _intervalExecutorList, _interval, _func, _config, _statusObj, _keyIntervalName;
const _IntervalExecutor = class _IntervalExecutor {
  
  constructor(func, config = {}) {
    __privateAdd(this, _interval, null);
    
    __privateAdd(this, _func);
    __privateAdd(this, _config);
    __privateAdd(this, _statusObj, {});
    __privateAdd(this, _keyIntervalName, "");
    __publicField(this, "getKeyIntervalName", () => {
      return __privateGet(this, _keyIntervalName);
    });
    const defConfig = { timeout: 2e3, processTips: false, intervalName: null };
    __privateSet(this, _config, Object.assign(defConfig, config));
    if (__privateGet(this, _config).intervalName === null) {
      throw new Error("请设置间隔名称");
    }
    __privateSet(this, _func, func);
    const intervalName = __privateGet(this, _config).intervalName;
    const intervalExecutorList = __privateGet(_IntervalExecutor, _intervalExecutorList);
    const index = intervalExecutorList.length + 1;
    __privateSet(this, _keyIntervalName, `${intervalName}_${index}`);
    __privateSet(this, _statusObj, { status: false, key: __privateGet(this, _keyIntervalName), name: __privateGet(this, _config).intervalName });
    intervalExecutorList.push(this);
  }
  static setIntervalExecutorStatus(keyIntervalName, status) {
    const find = __privateGet(_IntervalExecutor, _intervalExecutorList).find((item) => item.getKeyIntervalName() === keyIntervalName);
    if (find === void 0) return;
    if (status) {
      find.start();
    } else {
      find.stop();
    }
  }
  stop(msg = null) {
    const i = __privateGet(this, _interval);
    if (i === null) return;
    clearInterval(i);
    __privateSet(this, _interval, null);
    const processTips = __privateGet(this, _config).processTips;
    if (msg) {
      console.log(msg);
    }
    if (processTips) {
      console.log(`stop:检测${__privateGet(this, _config).intervalName}间隔执行器`);
    }
    __privateGet(this, _statusObj).status = false;
  }
  setTimeout(timeout) {
    __privateGet(this, _config).timeout = timeout;
  }
  start() {
    if (__privateGet(this, _interval) !== null) return;
    __privateGet(this, _statusObj).status = true;
    __privateSet(this, _interval, setInterval(__privateGet(this, _func), __privateGet(this, _config).timeout));
    const processTips = __privateGet(this, _config).processTips;
    if (processTips) {
      console.log(`start:检测${__privateGet(this, _config).intervalName}间隔执行器`);
    }
  }
  setExecutorStatus(status) {
    if (status) {
      this.start();
    } else {
      this.stop();
    }
  }
};
_intervalExecutorList = new WeakMap();
_interval = new WeakMap();
_func = new WeakMap();
_config = new WeakMap();
_statusObj = new WeakMap();
_keyIntervalName = new WeakMap();
__privateAdd(_IntervalExecutor, _intervalExecutorList, []);
let IntervalExecutor = _IntervalExecutor;const isNewHistoryPage = (url) => {
  return url.includes("://www.bilibili.com/history");
};
const getDuration = (str) => {
  if (str === null) {
    return -1;
  }
  if (str.includes("已看完") || str === "") {
    return -1;
  } else {
    const match = str?.match(/\/(.*)/);
    if (match) {
      return strFormatUtil.timeStringToSeconds(match[1]);
    }
  }
  return -1;
};
const getVideoDataList$2 = async () => {
  const elList = await elUtil.findElements(".section-cards.grid-mode>div");
  const list = [];
  for (let el of elList) {
    const titleEl = el.querySelector(".bili-video-card__title");
    const title = titleEl.textContent.trim();
    const videoUrl = titleEl.firstElementChild.href || null;
    if (videoUrl?.includes("live.bilibili.com")) {
      continue;
    }
    const bv = urlUtil.getUrlBV(videoUrl);
    const userEl = el.querySelector(".bili-video-card__author");
    const cardTag = el.querySelector(".bili-cover-card__tag")?.textContent.trim() || null;
    const name = userEl.textContent.trim();
    const userUrl = userEl.href;
    const uid = urlUtil.getUrlUID(userUrl);
    let nDuration = -1;
    if (cardTag !== "专栏") {
      nDuration = el.querySelector(".bili-cover-card__stat")?.textContent.trim() || null;
      nDuration = getDuration(nDuration);
    }
    const tempEL = el.querySelector(".bili-video-card__details");
    list.push({
      title,
      videoUrl,
      name,
      userUrl,
      nDuration,
      uid,
      el,
      bv,
      insertionPositionEl: tempEL,
      explicitSubjectEl: tempEL
    });
  }
  return list;
};
const startShieldingVideoList$2 = async () => {
  const list = await getVideoDataList$2();
  for (let videoData of list) {
    video_shielding.shieldingVideoDecorated(videoData).catch(() => {
      shielding.addBlockButton({
        data: videoData,
        maskingFunc: startShieldingVideoList$2
      }, "gz_shielding_button");
    });
  }
};
const intervalShieldingHistoryVideoExecutor = new IntervalExecutor(startShieldingVideoList$2, {
  processTips: true,
  intervalName: "历史记录项"
});
const getTopFilterLabel = async () => {
  const el = await elUtil.findElement(".radio-filter>.radio-filter__item--active");
  return el.textContent?.trim();
};
const topFilterInsertListener = () => {
  elUtil.findElement(".radio-filter").then((el) => {
    el.addEventListener("click", (e) => {
      const target = e.target;
      const label = target.textContent?.trim();
      console.log(`点击了${label}`);
      if (label === "直播") {
        intervalShieldingHistoryVideoExecutor.stop();
        return;
      }
      intervalShieldingHistoryVideoExecutor.start();
    });
  });
};
const startRun = () => {
  getTopFilterLabel().then((label) => {
    if (label === "直播") {
      return;
    }
    intervalShieldingHistoryVideoExecutor.start();
  });
  topFilterInsertListener();
};
var newHistory = {
  isNewHistoryPage,
  startRun
};const isMessagePage = (url = window.location.href) => {
  return url.includes("message.bilibili.com");
};
const modifyTopItemsZIndex = () => {
  elUtil.findElement("#home_nav").then((el) => {
    el.style.zIndex = 1e3;
    eventEmitter.send("打印信息", "已修改顶部的z-index值为1");
  });
};
var messagePage = {
  isMessagePage,
  modifyTopItemsZIndex
};var userProfile = {
  run() {
    elUtil.findElement("bili-user-profile", { parseShadowRoot: true }).then(async (el) => {
      const but = document.createElement("button");
      but.id = "chat";
      but.className = "gz-div";
      but.textContent = "屏蔽";
      but.addEventListener("click", () => {
        const data = document.querySelector("bili-user-profile")?.["__data"];
        const { card: { mid, name } } = data;
        eventEmitter.invoke("el-confirm", `是要屏蔽的用户${name}-【${mid}】吗？`).then(() => {
          const uid = parseInt(mid);
          if (ruleUtil.addRulePreciseUid(uid).status) {
            eventEmitter.send("通知屏蔽").send("event-检查评论区屏蔽");
          }
        });
      });
      const checkTheInsertButton = (el2) => {
        const actionEl = el2.querySelector("#action");
        if (actionEl === null) return;
        let gzDiv = el2.querySelector("#chat.gz-div");
        if (gzDiv === null) actionEl.appendChild(but);
      };
      checkTheInsertButton(el);
      const observer = new MutationObserver(() => {
        checkTheInsertButton(el);
      });
      observer.observe(el, { childList: true, subtree: true });
    });
  }
};let be_wly_el = null;
const excludeTabNames = ["正在关注", "订阅剧集", "直播"];
const excludeRankingLeftTabNames = ["番剧", "综艺", "电视剧", "纪录片", "中国动画"];
const getBewlyEl = async () => {
  if (be_wly_el === null) {
    let el = await elUtil.findElement("#bewly", { interval: 500, cachePromise: true, parseShadowRoot: true });
    be_wly_el = el;
    return el;
  }
  return be_wly_el;
};
const getRankingLeftTabs = async () => {
  const beEl = await getBewlyEl();
  const elList = await elUtil.findElements('ul[flex="~ col gap-2"]>li', { doc: beEl });
  const list = [];
  for (let el of elList) {
    const label = el.textContent.trim();
    list.push({ label, el });
  }
  return list;
};
const getRightTabs = async () => {
  const beEl = await getBewlyEl();
  const els = await elUtil.findElements(".dock-content-inner>.b-tooltip-wrapper", { doc: beEl });
  const list = [];
  for (let el of els) {
    const label = el.querySelector(".b-tooltip").textContent.trim();
    const active = !!el.querySelector(".dock-item.group.active");
    list.push({ label, active, el });
  }
  return list;
};
const getVideoList$1 = async () => {
  const be_wly_el2 = await getBewlyEl();
  const elList = await elUtil.findElements(".video-card", { doc: be_wly_el2 });
  const list = [];
  for (let videoCardEl of elList) {
    const titleEl = videoCardEl.querySelector("h3.keep-two-lines a");
    if (!titleEl) continue;
    const title = titleEl.textContent.trim();
    const videoUrl = titleEl.href;
    const bv = urlUtil.getUrlBV(videoUrl);
    const authorEl = videoCardEl.querySelector("a.channel-name");
    if (!authorEl) continue;
    const name = authorEl.textContent.trim();
    const userUrl = authorEl.href;
    const uid = urlUtil.getUrlUID(userUrl);
    const coverEl = videoCardEl.querySelector(".vertical-card-cover, .horizontal-card-cover");
    let nDuration = -1;
    if (coverEl) {
      const durationEl = coverEl.querySelector('[class*="group-hover:opacity-0"]');
      if (durationEl) {
        nDuration = strFormatUtil.timeStringToSeconds(durationEl.textContent.trim());
      }
    }
    let nPlayCount = -1, bulletChat = -1;
    const allSpans = videoCardEl.querySelectorAll("span");
    const numberSpans = [];
    for (const span of allSpans) {
      if (span.closest("a.channel-name")) continue;
      const txt = span.textContent.trim();
      if (txt === "•" || txt === "·" || txt === "" || !/\d/.test(txt)) continue;
      numberSpans.push(txt);
    }
    if (numberSpans.length >= 1) {
      nPlayCount = strFormatUtil.toPlayCountOrBulletChat(numberSpans[0]);
    }
    if (numberSpans.length >= 2) {
      bulletChat = strFormatUtil.toPlayCountOrBulletChat(numberSpans[1]);
    }
    const insertionPositionEl = authorEl.parentElement;
    const gridChild = videoCardEl.parentElement?.parentElement || videoCardEl;
    list.push({
      title,
      name,
      uid,
      bv,
      userUrl,
      videoUrl,
      nPlayCount,
      bulletChat,
      nDuration,
      el: gridChild,
      insertionPositionEl,
      explicitSubjectEl: gridChild
    });
  }
  return list;
};
const getHistoryVideoDataList = async () => {
  const beEL = await getBewlyEl();
  const elList = await elUtil.findElements("a.group[flex][cursor-pointer]", { doc: beEL });
  const list = [];
  for (let el of elList) {
    const titleEl = el.querySelector("h3.keep-two-lines");
    const videoUrlEl = titleEl.parentElement;
    const userEl = videoUrlEl.nextElementSibling;
    const videoUrl = videoUrlEl.href;
    const bv = urlUtil.getUrlBV(videoUrl);
    const userUrl = userEl.href;
    const uid = urlUtil.getUrlUID(userUrl);
    const name = userEl.textContent.trim();
    const title = titleEl?.textContent.trim();
    const tempTime = el.querySelector("div[pos][rounded-8]")?.textContent.trim().split(/[\t\r\f\n\s]*/g).join("");
    const match = tempTime?.match(/\/(.*)/);
    let nDuration = match?.[1];
    nDuration = strFormatUtil.timeStringToSeconds(nDuration);
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
    });
  }
  return list;
};
const getHomeTopTabs = async () => {
  const beEl = await getBewlyEl();
  const els = beEl.querySelectorAll(".home-tabs-inside>button");
  const list = [];
  for (let el of els) {
    const label = el.textContent.trim();
    const active = el.classList.contains("tab-activated");
    list.push({ label, active, el });
  }
  if (list.some((tab) => tab.active === true)) {
    return list;
  }
  await defUtil.wait(1e3);
  return await getHomeTopTabs();
};
const startShieldingVideoList$1 = async () => {
  const list = await getVideoList$1();
  for (let videoData of list) {
    video_shielding.shieldingVideoDecorated(videoData).catch(() => {
      eventEmitter.send("视频添加屏蔽按钮-BewlyBewly", {
        data: videoData,
        maskingFunc: startShieldingVideoList$1
      });
    });
  }
};
const intervalShieldingVideoListExecutor = new IntervalExecutor(startShieldingVideoList$1, {
  processTips: true,
  intervalName: "BEWLYCat插件视频列表"
});
const startShieldingHistoryVideoList = async () => {
  const list = await getHistoryVideoDataList();
  for (let videoData of list) {
    video_shielding.shieldingVideoDecorated(videoData).catch(() => {
      eventEmitter.send("视频添加屏蔽按钮", { data: videoData, maskingFunc: startShieldingHistoryVideoList });
    });
  }
};
const intervalBEWLYShieldingHistoryVideoExecutor = new IntervalExecutor(startShieldingHistoryVideoList, {
  processTips: true,
  intervalName: "BEWLY历史记录"
});
const homeTopTabsInsertListener = () => {
  getHomeTopTabs().then((list) => {
    for (let { el, label } of list) {
      el.addEventListener("click", () => {
        console.log("点击了" + label);
        if (excludeTabNames.includes(label)) {
          intervalShieldingVideoListExecutor.stop();
          return;
        }
        if (label === "排行") {
          rankingLeftTabsInsertListener();
        }
        intervalShieldingVideoListExecutor.start();
      });
    }
  });
};
const rankingLeftTabsInsertListener = () => {
  getRankingLeftTabs().then((list) => {
    for (let { el, label } of list) {
      el.addEventListener("click", () => {
        console.log("点击了" + label);
        if (excludeRankingLeftTabNames.includes(label)) {
          intervalShieldingVideoListExecutor.stop();
          return;
        }
        intervalShieldingVideoListExecutor.start();
      });
    }
  });
};
const rightTabsInsertListener = () => {
  getRightTabs().then(
    (list) => {
      for (let { el, label, active } of list) {
        el.addEventListener(
          "click",
          () => {
            console.log("右侧选项卡栏点击了" + label, active);
            if (label === "首页") {
              homeTopTabsInsertListener();
              intervalShieldingVideoListExecutor.start();
            } else {
              intervalShieldingVideoListExecutor.stop();
            }
            if (label === "观看历史") {
              intervalBEWLYShieldingHistoryVideoExecutor.start();
            } else {
              intervalBEWLYShieldingHistoryVideoExecutor.stop();
            }
          }
        );
      }
    }
  );
};
const searchBoxInsertListener = async () => {
  const beEl = await getBewlyEl();
  const input = await elUtil.findElement('[placeholder="搜索观看历史"]', { doc: beEl });
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.keyCode === 13) {
      console.log("回车键被按下");
      if (input["value"].length === 0) return;
      setTimeout(startShieldingHistoryVideoList, 1500);
    }
  });
};
const check_BEWLYPage_compatibility = async () => {
  const el = await elUtil.findElement("#bewly", { interval: 200, cachePromise: true, timeout: 5e3 });
  if (el) {
    if (!globalValue.compatibleBEWLYBEWLY) {
      eventEmitter.send("el-alert", "检测到使用Bewly插件但未开启兼容选项，需要启用相关兼容选项才可正常使用");
    }
  } else {
    if (globalValue.compatibleBEWLYBEWLY) {
      eventEmitter.send("el-alert", "检测到未使用Bewly插件却开启了兼容选项，请关闭兼容选项");
    }
  }
};
var BEWLYCommon = {
  
  isBEWLYPage(url) {
    return url.includes("www.bilibili.com/?page=") || url === "https://www.bilibili.com/" || url.startsWith("https://www.bilibili.com/?spm_id_from=");
  },
  getBewlyEl,
  run(url) {
    const parseUrl = urlUtil.parseUrl(url);
    const { page } = parseUrl.queryParams;
    getBewlyEl().then((el) => {
      addGzStyle(el, el);
    });
    if (page === "Home" || url.startsWith("https://www.bilibili.com/?spm_id_from=") || url === "https://www.bilibili.com/") {
      intervalShieldingVideoListExecutor.start();
      homeTopTabsInsertListener();
    }
    if (page === "History") {
      intervalBEWLYShieldingHistoryVideoExecutor.start();
      searchBoxInsertListener();
    }
    rightTabsInsertListener();
  },
  check_BEWLYPage_compatibility
};const getVideoList = async () => {
  const be_wly_el = await BEWLYCommon.getBewlyEl();
  const elList = await elUtil.findElements(".grid-adaptive>.video-card-container", { doc: be_wly_el });
  const list = [];
  for (const el of elList) {
    if (el.getAttribute("bg") === "") {
      continue;
    }
    const titleEl = el.querySelector("h3>a");
    const nameEl = el.querySelector("a.channel-name");
    const viewEl = el.querySelector(".cover-stat-view>span");
    const danmakuEl = el.querySelector(".cover-stat-danmaku>span");
    const durationEl = el.querySelector(".video-card-cover-stats__item--duration>span");
    const title = titleEl.title.trim();
    const videoUrl = titleEl.href;
    const bv = urlUtil.getUrlBV(videoUrl);
    const userUrl = nameEl.href;
    const uid = urlUtil.getUrlUID(userUrl);
    const name = nameEl.textContent.trim();
    const nDuration = strFormatUtil.timeStringToSeconds(durationEl.textContent.trim());
    const nPlayCount = strFormatUtil.toPlayCountOrBulletChat(viewEl.textContent.trim());
    let bulletChat = -1;
    if (danmakuEl) {
      bulletChat = strFormatUtil.toPlayCountOrBulletChat(danmakuEl.textContent.trim());
    }
    let explicitSubjectEl;
    explicitSubjectEl = el.querySelector(".vertical-card-cover+div");
    if (explicitSubjectEl === null) {
      explicitSubjectEl = el;
    }
    const insertionPositionEl = nameEl.parentElement;
    list.push({
      title,
      name,
      uid,
      bv,
      userUrl,
      videoUrl,
      nPlayCount,
      bulletChat,
      nDuration,
      el,
      insertionPositionEl,
      explicitSubjectEl
    });
  }
  return list;
};
const checkSearchVideoList = async () => {
  const list = await getVideoList();
  for (let v of list) {
    video_shielding.shieldingVideoDecorated(v).catch(() => {
      eventEmitter.send("视频添加屏蔽按钮", { data: v, maskingFunc: checkSearchVideoList });
    });
  }
};
const searchVideoListIntervalExecutor = new IntervalExecutor(checkSearchVideoList, {
  processTips: true,
  intervalName: "bewly搜索页视频列表",
  timeout: 1e3
});
const userListInstallAddButton = async () => {
  const be_wly_el = await BEWLYCommon.getBewlyEl();
  const gridEls = be_wly_el.querySelectorAll(".user-grid>a");
  for (let el of gridEls) {
    const nameEl = el.querySelector(".username");
    const userUrl = el.href;
    const name = nameEl.textContent.trim();
    const uid = urlUtil.getUrlUID(userUrl);
    const insertionPositionEl = el.querySelector('[flex*="col"]>[items-center]:last-child');
    shielding.addBlockButton({ data: { uid, name, userUrl, el, insertionPositionEl, explicitSubjectEl: el } });
  }
};
const searchUserListIntervalExecutor = new IntervalExecutor(userListInstallAddButton, {
  processTips: true,
  intervalName: "bewly搜索页用户or主播列表",
  timeout: 1500
});
var BEWLYSearch = {
  isUrlPage(url, title) {
    return url.startsWith("https://www.bilibili.com/?page=SearchResults") && title.includes("- 搜索结果 - 哔哩哔哩");
  },
  run(url) {
    const parseUrl = urlUtil.parseUrl(url);
    const { category = null, search_type = null } = parseUrl.queryParams;
    if (category === "all" || category === "video" || category === null && search_type === null) {
      searchVideoListIntervalExecutor.start();
    } else {
      searchVideoListIntervalExecutor.stop();
    }
    if (category === "user") {
      searchUserListIntervalExecutor.start();
    } else {
      searchUserListIntervalExecutor.stop();
    }
  }
};const getUserList$1 = async () => {
  const elList = await elUtil.findElements(".media-list>div");
  const list = [];
  for (const el of elList) {
    const nameAEl = el.querySelector("h2>a");
    const name = nameAEl.title;
    const userUrl = nameAEl.href;
    const uid = urlUtil.getUrlUID(userUrl);
    const insertionPositionEl = el.querySelector(".user-actions");
    list.push({
      name,
      userUrl,
      uid,
      el,
      insertionPositionEl,
      explicitSubjectEl: el
    });
  }
  return list;
};
var searchUserTab = {
  isUrlPage(url) {
    return url.startsWith("https://search.bilibili.com/upuser");
  },
  userListInsertionButton() {
    getUserList$1().then((list) => {
      for (const userData of list) {
        shielding.addBlockButton({ data: userData });
      }
    });
  }
};const getLeftUserList = () => {
  return elUtil.findElements('[data-id^="contact_"]').then((elList) => {
    const list = [];
    for (const el of elList) {
      const nameEl = el.querySelector('[class^="_SessionItem__Name"]');
      const dataIdStr = el.getAttribute("data-id");
      const name = nameEl.textContent.trim();
      if (name === "社区中心" || name === "支付小助手" || name === "UP主小助手" || name === "哔哩哔哩智能机") {
        continue;
      }
      const uid = urlUtil.getUrlUID(dataIdStr.split("_")[1]);
      list.push({
        name,
        uid,
        el,
        insertionPositionEl: nameEl.parentElement,
        explicitSubjectEl: el
      });
    }
    return list;
  });
};
const getMsgList = () => {
  return elUtil.findElements('[class^="_MessageList"]>._Msg_o7f0t_1').then((elList) => {
    const list = [];
    const nameEl = document.querySelector('[class^="_ContactName"]');
    const uidEl = document.querySelector('[data-id^="contact_"][class*="_SessionItemIsActive"]');
    const uidStr = uidEl.getAttribute("data-id").split("_")[1];
    const uid = urlUtil.getUrlUID(uidStr);
    const name = nameEl.textContent.trim();
    for (const el of elList) {
      const isMy = el.className.includes("MsgIsMe");
      if (isMy) continue;
      const data = { msg: "", el };
      const msgEl = el.querySelector('[class^="_Msg__Main"]');
      if (msgEl.querySelector(".b-img")) {
        continue;
      }
      data.msg = msgEl.textContent.trim();
      data.uid = uid;
      data.name = name;
      list.push(data);
    }
    return list;
  });
};
var msgWhisper = {
  isChatWindowInterface(parseUrl) {
    const hash = parseUrl.hash;
    return hash.includes("#/whisper/mid") || hash.includes("#/whisper/unfollow/mid");
  },
  checkLeftUserList() {
    getLeftUserList().then((list) => {
      for (const v of list) {
        const name = v.name;
        const { state, matching, type } = blockUserUidAndName(v.uid, name);
        if (state) {
          v.el.remove();
          eventEmitter.send("打印信息", `根据${type}规则${matching}屏蔽用户${name}`);
          continue;
        }
        shielding.addBlockButton({
          data: v,
          maskingFunc: this.checkLeftUserList,
          mouseoverFun: (butEl) => {
            if (!location.href.endsWith("whisper/unfollow")) return;
            butEl.style.display = "";
          }
        });
      }
    });
  },
  checkMsgListIntervalExecutor: new IntervalExecutor(() => {
    getMsgList().then((msgList) => {
      for (const msgData of msgList) {
        const { name, msg, el } = msgData;
        const { state, type, matching } = blockComment(msg);
        if (!state) continue;
        el.remove();
        eventEmitter.send("打印信息", `根据${type}规则${matching}屏蔽用户${name}发送的消息${msg}`);
      }
    });
  }, {
    intervalName: "聊天消息窗口",
    processTips: true
  })
};const OVERLAY_CLASS = "bb_overlay";
function getTrendingItems() {
  return document.querySelectorAll("div.trending-item");
}
function applyTrendingBlock(trendingItem, blockedReason) {
  const settings = tjxGetOverlaySettings();
  const hideMode = settings ? settings.hideVideoMode : GM_getValue("hide_video_mode", false);
  if (hideMode) {
    trendingItem.style.display = "none";
    return;
  }
  if (trendingItem.querySelector("." + OVERLAY_CLASS)) return;
  const rect = trendingItem.getBoundingClientRect();
  const overlay = document.createElement("div");
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
  const text = document.createElement("div");
  text.textContent = blockedReason;
  text.style.color = "rgb(250,250,250)";
  overlay.appendChild(text);
  trendingItem.insertAdjacentElement("afterbegin", overlay);
}
function checkAndBlockTrendingItem(trendingItem, ruleArray, useRegex) {
  if (trendingItem.style.display === "none" || trendingItem.querySelector("." + OVERLAY_CLASS)) {
    return;
  }
  const textContent = trendingItem.textContent || "";
  const result = blockExactOrRegex(textContent, ruleArray, useRegex, "热搜屏蔽");
  if (result.state) {
    applyTrendingBlock(trendingItem, result.matching);
  }
}
function run$1() {
  const settings = tjxGetOverlaySettings();
  if (!settings) return;
  if (settings.hideTrending) {
    document.querySelectorAll("div.trending").forEach((el) => {
      el.style.display = "none";
    });
  }
  const items = getTrendingItems();
  if (items.length === 0) return;
  items.forEach((item) => {
    if (settings.blockedTrending && settings.trendingArray.length > 0) {
      checkAndBlockTrendingItem(item, settings.trendingArray, settings.trendingUseRegex);
    }
    if (settings.blockedTrendingByTitleTag) {
      const tjxSettings = GM_getValue("GM_blockedParameter", null);
      if (tjxSettings && tjxSettings.blockedTitle_Array && tjxSettings.blockedTitle_Array.length > 0) {
        checkAndBlockTrendingItem(item, tjxSettings.blockedTitle_Array, tjxSettings.blockedTitle_UseRegular !== false);
      }
    }
  });
}
var trendingBlocker = {
  run: run$1,
  getTrendingItems,
  checkAndBlockTrendingItem
};const HIDE_CLASS = "bb_hide_ad";
function injectStyle() {
  const styleId = "bb_non_video_hider_style";
  if (document.getElementById(styleId)) return;
  GM_addStyle(`
        .${HIDE_CLASS} {
            display: none !important;
        }
    `);
}
function hideHomeNonVideo() {
  if (!window.location.href.startsWith("https://www.bilibili.com/")) return;
  document.querySelectorAll(`
        div.floor-single-card,
        div.feed-card:has(a[href^="//cm.bilibili.com/"]),
        div.bili-feed-card:has(a[href^="//cm.bilibili.com/"]),
        div.bili-feed-card:has(a[href^="https://live.bilibili.com/"])
    `).forEach((el) => el.classList.add(HIDE_CLASS));
}
function hideSearchNonVideo() {
  if (!window.location.href.startsWith("https://search.bilibili.com/all")) return;
  document.querySelectorAll(`
        div.bili-video-card:has(a[href^="https://www.bilibili.com/cheese/"]),
        div.bili-video-card:has(a[href^="//cm.bilibili.com/"]),
        div.bili-video-card:has(a[href^="//live.bilibili.com/"])
    `).forEach((el) => el.parentNode && el.parentNode.classList.add(HIDE_CLASS));
}
function hideVideoPlayNonVideo() {
  if (!window.location.href.startsWith("https://www.bilibili.com/video/")) return;
  document.querySelectorAll(`
        div#slide_ad,
        .ad-report,
        div.video-page-game-card-small,
        div.video-page-special-card-small,
        div.video-page-operator-card-small,
        div.pop-live-small-mode,
        div.activity-m-v1,
        div.video-card-ad-small
    `).forEach((el) => el.classList.add(HIDE_CLASS));
}
function run() {
  const enabled = GM_getValue("hide_non_video_elements", true);
  if (!enabled) return;
  injectStyle();
  hideHomeNonVideo();
  hideSearchNonVideo();
  hideVideoPlayNonVideo();
}
var nonVideoElementHider = {
  run,
  HIDE_CLASS
};const homeStaticRoute = (title, url) => {
  const isBewlyPage = BEWLYCommon.isBEWLYPage(url);
  if (isBewlyPage) {
    cssManager.clearBewlyCatStyle();
  }
  if (isBewlyPage && globalValue.compatibleBEWLYBEWLY) {
    BEWLYCommon.run(url);
  }
  if (bilibiliHome.isHome(url, title)) {
    BEWLYCommon.check_BEWLYPage_compatibility();
    eventEmitter.send("通知屏蔽");
    if (globalValue.compatibleBEWLYBEWLY) return;
    bilibiliHome.run();
    trendingBlocker.run();
  }
};
const staticRoute = (title, url) => {
  homeStaticRoute(title, url);
  hotSearch.run();
  cssManager.run(url, title);
  nonVideoElementHider.run();
  if (globalValue.bOnlyTheHomepageIsBlocked) return;
  topInput.processTopInputContent();
  hotSearch.startShieldingHotList();
  eventEmitter.send("通知屏蔽");
  if (searchModel.isSearch(url)) {
    searchModel.delFooterContent();
  }
  if (videoPlayModel.isVideoPlayPage(url)) {
    videoPlayModel.findTheExpandButtonForTheListOnTheRightAndBindTheEvent();
    videoPlayModel.run();
    userProfile.run();
    videoPlayPageCommon.insertUserProfileShieldButton();
  }
  if (collectionVideoPlayPageModel.iscCollectionVideoPlayPage(url)) {
    collectionVideoPlayPageModel.findTheExpandButtonForTheListOnTheRightAndBindTheEvent();
    videoPlayPageCommon.insertTagShieldButton();
    userProfile.run();
    videoPlayPageCommon.insertUserProfileShieldButton();
  }
  if (videoPlayWatchLater.isVideoPlayWatchLaterPage(url)) {
    videoPlayWatchLater.findTheExpandButtonForTheListOnTheRightAndBindTheEvent();
    videoPlayPageCommon.insertTagShieldButton();
    userProfile.run();
    videoPlayPageCommon.insertUserProfileShieldButton();
  }
  if (newHistory.isNewHistoryPage(url)) {
    newHistory.startRun();
  }
  if (messagePage.isMessagePage(url)) {
    messagePage.modifyTopItemsZIndex();
    const parseUrl = urlUtil.parseUrl(url);
    msgWhisper.checkMsgListIntervalExecutor.setExecutorStatus(msgWhisper.isChatWindowInterface(parseUrl));
  }
  if (space.isSpacePage()) {
    userProfile.run();
    space.executeSetChargingVideosVisible();
    space.executeSetLiveReplayVideosVisible();
    space.getUserInfo().then((userInfo) => {
      console.info("userInfo", userInfo);
    });
  }
  if (dynamicPage.isUrlDynamicHomePage()) {
    dynamicPage.run();
    userProfile.run();
    dynamicPage.runHideBackToOldVersionButFun();
  }
  if (dynamicPage.isUrlDynamicContentPage()) {
    userProfile.run();
  }
  if (BEWLYSearch.isUrlPage(url, title)) {
    BEWLYSearch.run(url);
  }
  if (searchUserTab.isUrlPage(url)) {
    searchUserTab.userListInsertionButton();
  }
};
const dynamicRouting = (title, url) => {
  if (globalValue.bOnlyTheHomepageIsBlocked) return;
  if (searchUserTab.isUrlPage(url)) {
    searchUserTab.userListInsertionButton();
  }
  if (messagePage.isMessagePage(url)) {
    const parseUrl = urlUtil.parseUrl(url);
    msgWhisper.checkMsgListIntervalExecutor.setExecutorStatus(msgWhisper.isChatWindowInterface(parseUrl));
  }
  eventEmitter.send("通知屏蔽");
};
var router = {
  staticRoute,
  dynamicRouting
};const addEventListenerUrlChange = (callback) => {
  let oldUrl = window.location.href;
  setInterval(() => {
    const newUrl = window.location.href;
    if (oldUrl === newUrl) return;
    oldUrl = newUrl;
    const title = document.title;
    callback(newUrl, oldUrl, title);
  }, 1e3);
};
const addEventListenerNetwork = (callback) => {
  const performanceObserver = new PerformanceObserver(() => {
    const entries = performance.getEntriesByType("resource");
    const windowUrl = window.location.href;
    const winTitle = document.title;
    for (let entry of entries) {
      const url = entry.name;
      const initiatorType = entry.initiatorType;
      if (initiatorType === "img" || initiatorType === "css" || initiatorType === "link" || initiatorType === "beacon") {
        continue;
      }
      try {
        callback(url, windowUrl, winTitle, initiatorType);
      } catch (e) {
        if (e.message === "stopPerformanceObserver") {
          performanceObserver.disconnect();
          console.log("检测到当前页面在排除列表中，已停止性能观察器对象实例", e);
          break;
        }
        throw e;
      }
    }
    performance.clearResourceTimings();
  });
  performanceObserver.observe({ entryTypes: ["resource"] });
};
function watchElementListLengthWithInterval(selector, callback, config = {}) {
  const defConfig = {};
  config = { ...defConfig, ...config };
  let previousLength = -1;
  const timer = setInterval(
    () => {
      if (previousLength === -1) {
        previousLength = document.querySelectorAll(selector).length;
        return;
      }
      const currentElements = document.querySelectorAll(selector);
      const currentLength = currentElements.length;
      if (currentLength !== previousLength) {
        previousLength = currentLength;
        callback(
          {
            action: currentLength > previousLength ? "add" : "del",
            elements: currentElements,
            length: currentLength
          }
        );
      }
    },
    config.interval
  );
  return stop = () => {
    clearInterval(timer);
  };
}
var watchUtil = {
  addEventListenerUrlChange,
  addEventListenerNetwork,
  watchElementListLengthWithInterval,
  
  watchChildAppear(parent, selector, callback, options = {}) {
    if (!parent || !(parent instanceof Element)) {
      throw new Error("parent 必须是一个有效的 DOM 元素");
    }
    if (typeof selector !== "string") {
      throw new Error("selector 必须是字符串");
    }
    if (typeof callback !== "function") {
      throw new Error("callback 必须是函数");
    }
    const {
      once = false,
      initialCheck = true,
      subtree = false
    } = options;
    function findMatches() {
      if (subtree) {
        return Array.from(parent.querySelectorAll(selector));
      } else {
        return Array.from(parent.children).filter((child) => child.matches(selector));
      }
    }
    let hadMatches = false;
    function checkAndTrigger() {
      const matches = findMatches();
      const hasMatches = matches.length > 0;
      if (hasMatches && !hadMatches) {
        callback(matches[0]);
        if (once) {
          observer.disconnect();
          return;
        }
      }
      hadMatches = hasMatches;
    }
    if (initialCheck) {
      hadMatches = findMatches().length > 0;
      if (hadMatches) {
        callback(findMatches()[0]);
        if (once) {
          return {
            disconnect: () => {
            }
          };
        }
      }
    } else {
      hadMatches = findMatches().length > 0;
    }
    const observer = new MutationObserver(() => {
      checkAndTrigger();
    });
    observer.observe(parent, {
      childList: true,
      subtree
    });
    return {
      disconnect: () => observer.disconnect()
    };
  }
};const getVideoDataListItem = (el) => {
  const vueData = el.__vue__;
  const { videoData } = vueData;
  const videoCardInfoEl = el.querySelector(".video-card__info");
  const {
    bvid: bv,
    duration: nDuration,
    title,
    owner: {
      mid: uid,
      name
    },
    stat: {
      view: nPlayCount,
      like,
      danmaku: nBulletChat
    }
  } = videoData;
  const videoUrl = "https://www.bilibili.com/video/" + bv;
  return {
    vueData,
    el,
    title,
    name,
    uid,
    videoUrl,
    bv,
    like,
    nPlayCount,
    nDuration,
    nBulletChat,
    insertionPositionEl: videoCardInfoEl.querySelector("div"),
    explicitSubjectEl: videoCardInfoEl
  };
};
const getVideDataList = async (isWeekly = false) => {
  const css = isWeekly ? ".video-list>.video-card" : ".card-list>.video-card";
  const elList = await elUtil.findElements(css);
  const list = [];
  for (let el of elList) {
    list.push(getVideoDataListItem(el));
  }
  return list;
};
const startShieldingVideoList = async (isWeekly = false) => {
  const list = await getVideDataList(isWeekly);
  for (let videoData of list) {
    video_shielding.shieldingVideoDecorated(videoData).catch(() => {
      eventEmitter.send("添加热门视频屏蔽按钮", {
        data: videoData,
        updateFunc: getVideoDataListItem,
        maskingFunc: startShieldingVideoList
      });
    });
  }
};
var popularAll = {
  startShieldingVideoList
};const isPartition = (url = window.location.href) => {
  return url.includes("www.bilibili.com/v/");
};
const isNewPartition = (url = window.location.href) => {
  return url.includes("www.bilibili.com/c/");
};
const getHotVideoDayList = async () => {
  const elList = await elUtil.findElements(".bili-rank-list-video__item");
  const list = [];
  for (let el of elList) {
    let videoUrlEl = el.querySelector("a.rank-video-card");
    const titleEl = el.querySelector(".rank-video-card__info--tit");
    const videoUrl = videoUrlEl.href;
    const title = titleEl.textContent.trim();
    const bv = urlUtil.getUrlBV(videoUrl);
    list.push({
      title,
      videoUrl,
      bv,
      el
    });
  }
  return list;
};
const getVVideoDataList = async () => {
  const elList = await elUtil.findElements(".bili-video-card");
  const list = [];
  const oneTitleEl = elList[0].querySelector(".bili-video-card__info--tit>a");
  if (oneTitleEl === null) {
    await defUtil.wait();
    return await getVVideoDataList();
  }
  for (let el of elList) {
    const titleEl = el.querySelector(".bili-video-card__info--tit>a");
    if (titleEl === null) {
      continue;
    }
    const userEl = el.querySelector("a.bili-video-card__info--owner");
    const playAndDmu = el.querySelectorAll(".bili-video-card__stats--item>span");
    let nDuration = el.querySelector(".bili-video-card__stats__duration")?.textContent.trim();
    let nPlayCount = playAndDmu[0]?.textContent.trim();
    nPlayCount = strFormatUtil.toPlayCountOrBulletChat(nPlayCount);
    let nBulletChat = playAndDmu[1]?.textContent.trim();
    nBulletChat = strFormatUtil.toPlayCountOrBulletChat(nBulletChat);
    nDuration = strFormatUtil.toPlayCountOrBulletChat(nDuration);
    const title = titleEl.textContent.trim();
    const videoUrl = titleEl.href;
    const userUrl = userEl.href;
    const name = userEl.querySelector(".bili-video-card__info--author")?.textContent.trim() || null;
    const uid = urlUtil.getUrlUID(userUrl);
    const bv = urlUtil.getUrlBV(videoUrl);
    list.push({
      name,
      title,
      uid,
      bv,
      userUrl,
      videoUrl,
      el,
      nPlayCount,
      nBulletChat,
      nDuration,
      explicitSubjectEl: el.querySelector(".bili-video-card__info"),
      insertionPositionEl: el.querySelector(".bili-video-card__info--bottom")
    });
  }
  return list;
};
const getCVideoDataList = async () => {
  const elList = await elUtil.findElements(".bili-video-card");
  const list = [];
  for (let el of elList) {
    const titleEl = el.querySelector(".bili-video-card__title");
    const title = titleEl.textContent.trim();
    const videoUrl = titleEl.querySelector("a").href;
    const bv = urlUtil.getUrlBV(videoUrl);
    const userEl = el.querySelector(".bili-video-card__author");
    const userUrl = userEl.href;
    const uid = urlUtil.getUrlUID(userUrl);
    const name = userEl.querySelector("[title]").textContent.trim().split("·")[0].trim();
    const statEls = el.querySelectorAll(".bili-cover-card__stats span");
    const nPlayCount = strFormatUtil.toPlayCountOrBulletChat(statEls[0].textContent.trim());
    const nBulletChat = strFormatUtil.toPlayCountOrBulletChat(statEls[1].textContent.trim());
    const nDuration = strFormatUtil.timeStringToSeconds(statEls[2].textContent.trim());
    const insertionPositionEl = el.querySelector(".bili-video-card__subtitle");
    const explicitSubjectEl = el.querySelector(".bili-video-card__details");
    list.push({
      title,
      userUrl,
      uid,
      name,
      videoUrl,
      bv,
      nPlayCount,
      nBulletChat,
      nDuration,
      el,
      insertionPositionEl,
      explicitSubjectEl
    });
  }
  return list;
};
const shieldingVideoList = async () => {
  let list;
  if (isPartition()) {
    list = await getVVideoDataList();
  } else {
    list = await getCVideoDataList();
  }
  for (let videoData of list) {
    video_shielding.shieldingVideoDecorated(videoData).catch(() => {
      eventEmitter.send("视频添加屏蔽按钮", { data: videoData, maskingFunc: shieldingVideoList });
    });
  }
};
const startShieldingHotVideoDayList = async () => {
  let list = await getHotVideoDayList();
  for (let videoData of list) {
    video_shielding.shieldingVideoDecorated(videoData);
  }
};
const startIntervalShieldingVideoList = () => {
  setInterval(async () => {
    await shieldingVideoList();
    for (let el of document.querySelectorAll(".feed-card:empty")) {
      el?.remove();
      console.log("已移除页面空白视频选项元素");
    }
  }, 1500);
};
var partition = {
  isPartition,
  isNewPartition,
  startIntervalShieldingVideoList,
  startShieldingHotVideoDayList
};const checkAndExcludePageTest = (url) => {
  const arr = getExcludeURLsGm();
  if (arr.length === 0) return returnTempVal;
  for (let v of arr) {
    if (!v.state) continue;
    if (url.search(v.regularURL) !== -1) {
      return { state: true, regularURL: v.regularURL };
    }
  }
  return returnTempVal;
};
const checkAndExcludePage = (url) => {
  if (!isExcludeURLSwitchGm()) return false;
  const { state, regularURL } = checkAndExcludePageTest(url);
  if (state) {
    console.log("排除页面", regularURL);
  }
  return state;
};const getUserList = () => {
  return elUtil.findElements(".fans-main .items>.item,.follow-main .items>.item").then((elList) => {
    const list = [];
    for (const el of elList) {
      const avatarEl = el.querySelector(".relation-card-avatar");
      const nameEl = el.querySelector(".relation-card-info__uname");
      const uid = parseInt(avatarEl.getAttribute("data-user-profile-id"));
      const name = nameEl.textContent.trim();
      const insertionPositionEl = el.querySelector(".relation-card-info-option");
      list.push({
        name,
        uid,
        el,
        insertionPositionEl,
        explicitSubjectEl: el
      });
    }
    return list;
  });
};
var spaceRelation = {
  isUrlPage(url) {
    return url.search("space.bilibili.com/([\\d]+)/relation/fans") !== -1 || url.search("space.bilibili.com/([\\d]+)/relation/follow") !== -1;
  },
  userListInsertionButton() {
    getUserList().then((list) => {
      for (const userData of list) {
        shielding.addBlockButton({ data: userData });
      }
    });
  }
};const blockCommentWordLimit = (content) => {
  if (!isEnableCommentWordLimitGm()) return returnTempVal;
  const commentWordLimit = localMKData.getCommentWordLimitVal();
  const limitType = getCommentWordLimitType();
  if (limitType === "min") {
    if (content.length < commentWordLimit) {
      return { state: true, type: "屏蔽字数限制", matching: `字数下限为${commentWordLimit}` };
    }
  } else {
    if (content.length > commentWordLimit) {
      return { state: true, type: "屏蔽字数限制", matching: `字数上限为${commentWordLimit}` };
    }
  }
  return returnTempVal;
};
const shieldingComment = (commentsData) => {
  const {
    content,
    uid,
    name,
    level = -1,
    decoratePic = null,
    collectionActId = -1,
    dressUpId = -1
  } = commentsData;
  let returnVal = blockSeniorMemberOnly(level);
  if (returnVal.state) return returnVal;
  returnVal = blockUserUidAndName(uid, name);
  if (returnVal.state) return returnVal;
  returnVal = blockComment(content);
  if (returnVal.state) return returnVal;
  if (level !== -1) {
    returnVal = blockByLevelForComment(level);
    if (returnVal.state) return returnVal;
  }
  returnVal = blockCommentWordLimit(content);
  if (returnVal.state) return returnVal;
  if (decoratePic !== null && collectionActId !== -1) {
    returnVal = shielding.blockDecorationCollection(collectionActId);
    if (returnVal.state) return returnVal;
  }
  if (decoratePic !== null && dressUpId !== -1) {
    returnVal = shielding.blockDecoration(dressUpId);
    if (returnVal.state) return returnVal;
  }
  return returnVal;
};
const shieldingCommentAsync = async (commentsData) => {
  const { state, type, matching } = shieldingComment(commentsData);
  eventEmitter.send("event-评论通知替换关键词", commentsData);
  if (type === "保留硬核会员") {
    return false;
  }
  if (state) {
    commentsData.el?.remove();
    eventEmitter.send("屏蔽评论信息", type, matching, commentsData);
    return state;
  }
  return state;
};
const shieldingCommentsAsync = async (commentsDataList) => {
  for (let commentsData of commentsDataList) {
    try {
      const { state, type } = await shieldingCommentAsync(commentsData);
      const { replies = [] } = commentsData;
      if (type === "保留硬核会员") continue;
      if (state) continue;
      eventEmitter.send("评论添加屏蔽按钮", commentsData);
      for (let reply of replies) {
        try {
          if (await shieldingCommentAsync(reply)) continue;
          eventEmitter.send("评论添加屏蔽按钮", reply);
        } catch (e) {
          console.error("处理楼中层评论时出错:", e, reply);
        }
      }
    } catch (e) {
      console.error("处理评论项时出错:", e, commentsData);
    }
  }
};
var comments_shielding = {
  shieldingComment,
  shieldingCommentsAsync,
  shieldingCommentAsync
};const getDataList$1 = () => {
  return elUtil.findElements(".reply-list>.interaction-item,.at-list>.interaction-item").then((elList) => {
    const list = [];
    for (const el of elList) {
      const nameAEl = el.querySelector(".interaction-item__uname");
      const msgEl = el.querySelector(".interaction-item__msg");
      const name = nameAEl.textContent.trim();
      const userUrl = nameAEl.href;
      const uid = urlUtil.getUrlUID(userUrl);
      const msgChildren = msgEl.children;
      const msgChildrenSize = msgChildren.length;
      let content = "";
      if (msgChildrenSize > 0 || msgChildrenSize < 3) {
        for (const msgChild of msgChildren) {
          if (msgChild.tagName === "SPAN") {
            content = msgChild.textContent.trim();
          }
        }
      } else {
        content = msgChildren[msgChildrenSize - 1].textContent.trim();
        content = content.substring(1).trim();
      }
      const insertionPositionEl = el.querySelector(".interaction-item__title");
      list.push({
        name,
        userUrl,
        uid,
        content,
        insertionPositionEl,
        el,
        explicitSubjectEl: el,
        msgChildren
      });
    }
    return list;
  });
};
var msgReply = {
  userListInsertionButton() {
    getDataList$1().then((list) => {
      for (const v of list) {
        const res = comments_shielding.shieldingComment(v);
        const { state, type, matching } = res;
        if (state) {
          v.el.remove();
          eventEmitter.send("屏蔽评论信息", type, matching, v);
        } else {
          eventEmitter.send("评论添加屏蔽按钮", v);
        }
      }
    });
  }
};const isTopicDetailPage = (url) => {
  return url.includes("//www.bilibili.com/v/topic/detail");
};
const getDataList = async () => {
  const elList = await elUtil.findElements(".list__topic-card");
  const list = [];
  for (let el of elList) {
    const biliDynItemDiv = el.querySelector(".bili-dyn-item");
    const vueData = biliDynItemDiv["__vue__"];
    const { author } = vueData;
    const name = author.name;
    const uid = author.mid;
    const judgmentEl = el.querySelector(".bili-dyn-card-video__title");
    const data = { name, uid, el, judgmentVideo: judgmentEl !== null };
    if (judgmentEl !== null) {
      data.title = judgmentEl.textContent.trim();
      const videoUrl = el.querySelector(".bili-dyn-card-video").href;
      data.videoUrl = videoUrl;
      data.bv = urlUtil.getUrlBV(videoUrl);
      data.insertionPositionEl = el.querySelector(".bili-dyn-content__orig");
      data.explicitSubjectEl = data.insertionPositionEl;
    } else {
      const dynTitle = el.querySelector(".dyn-card-opus__title");
      const contentTitle = dynTitle === null ? "" : dynTitle.textContent.trim();
      const contentBody = el.querySelector(".bili-ellipsis").textContent.trim();
      data.insertionPositionEl = el.querySelector(".dyn-card-opus");
      data.explicitSubjectEl = data.insertionPositionEl;
      data.content = contentTitle + contentBody;
    }
    list.push(data);
  }
  return list;
};
const startShielding = async () => {
  const list = await getDataList();
  const css = { width: "100%" };
  for (let data of list) {
    data.cssMap = css;
    if (data.judgmentVideo) {
      video_shielding.shieldingVideoDecorated(data).catch(() => {
        shielding.addTopicDetailVideoBlockButton({ data, maskingFunc: startShielding });
      });
    } else {
      if (await comments_shielding.shieldingCommentAsync(data)) continue;
      shielding.addTopicDetailContentsBlockButton({ data, maskingFunc: startShielding });
    }
  }
};
var topicDetail = {
  isTopicDetailPage,
  startShielding
};const observeNetwork = (url, windowUrl, winTitle, initiatorType) => {
  if (!url.includes("api")) return;
  if (checkAndExcludePage(windowUrl)) {
    throw new Error("stopPerformanceObserver");
  }
  if (globalValue.bOnlyTheHomepageIsBlocked) {
    if (!bilibiliHome.isHome(windowUrl, winTitle)) return;
  }
  if (url.startsWith("https://api.bilibili.com/x/web-interface/wbi/index/top/feed/rcmd?web_location=")) {
    if (globalValue.compatibleBEWLYBEWLY) return;
    bilibiliHome.startDebounceShieldingHomeVideoList();
    console.log("检测到首页加载了换一换视频列表和其下面的视频列表");
    return;
  }
  if (url.startsWith("https://api.bilibili.com/x/v2/reply/wbi/main?oid=")) {
    console.log("检测到评论区楼主评论加载了");
    eventEmitter.send("event-检查评论区屏蔽");
    return;
  }
  if (url.startsWith("https://api.bilibili.com/x/v2/reply/reply?oid=")) {
    console.log("检测到评论区楼主层中的子层评论列表加载了");
    eventEmitter.send("event-检查评论区屏蔽");
  }
  if (url.startsWith("https://api.bilibili.com/x/web-interface/popular?ps=")) {
    popularAll.startShieldingVideoList();
  }
  if (url.startsWith("https://api.bilibili.com/x/web-interface/popular/series/one?number=")) {
    popularAll.startShieldingVideoList(true);
  }
  if (url.startsWith("https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/space?offset=")) {
    console.log("用户空间动态api加载了");
    space.checkUserSpaceShieldingDynamicContentThrottle();
  }
  if (url.startsWith("https://api.bilibili.com/x/web-interface/ranking/region?day=")) {
    console.log("检测到专区热门排行榜加载了");
    partition.startShieldingHotVideoDayList();
  }
  if (searchModel.isSearchVideoNetWorkUrl(url)) {
    eventEmitter.send("通知屏蔽");
  }
  if (url.includes("api.bilibili.com/x/polymer/web-dynamic/v1/feed/all")) {
    console.log("动态首页api加载了");
    dynamicPage.debounceCheckDynamicList();
  }
  if ((url.includes("api.bilibili.com/x/relation/fans?pn=") || url.includes("api.bilibili.com/x/relation/followings")) && spaceRelation.isUrlPage(windowUrl)) {
    spaceRelation.userListInsertionButton();
  }
  if (url.includes("api.bilibili.com/x/msgfeed/reply") || url.includes("api.bilibili.com/x/msgfeed/at")) {
    msgReply.userListInsertionButton();
  }
  if (url.includes("api.vc.bilibili.com/session_svr/v1/session_svr/get_sessions")) {
    msgWhisper.checkLeftUserList();
  }
  if (url.includes("api.bilibili.com/x/polymer/web-dynamic/v1/feed/topic?topic_id=")) {
    topicDetail.startShielding();
  }
};
var observeNetwork$1 = {
  observeNetwork
};const generalUrl = [
  "popular/rank/all",
  "popular/rank/douga",
  "popular/rank/music",
  "popular/rank/dance",
  "popular/rank/game",
  "popular/rank/knowledge",
  "popular/rank/tech",
  "popular/rank/sports",
  "popular/rank/car",
  "popular/rank/life",
  "popular/rank/food",
  "popular/rank/animal",
  "popular/rank/kichiku",
  "popular/rank/fashion",
  "popular/rank/ent",
  "popular/rank/cinephile",
  "popular/rank/origin",
  "popular/rank/rookie"
];
const isPopularHistory = (url) => {
  return url.includes("popular/history");
};
const isPopularAllPage = (url) => {
  return url.includes("www.bilibili.com/v/popular/all");
};
const isPopularWeeklyPage = (url) => {
  return url.includes("www.bilibili.com/v/popular/weekly");
};
const isGeneralPopularRank = (url) => {
  return generalUrl.some((itemUrl) => url.includes(itemUrl));
};
const getVideoDataList$1 = async () => {
  const elList = await elUtil.findElements(".rank-list>li");
  const list = [];
  for (let el of elList) {
    const title = el.querySelector(".title").textContent.trim();
    const userUrl = el.querySelector(".detail>a").href;
    const uid = urlUtil.getUrlUID(userUrl);
    const name = el.querySelector(".up-name").textContent.trim();
    const detailStateEls = el.querySelectorAll(".detail-state>.data-box");
    let nPlayCount = detailStateEls[0].textContent.trim();
    nPlayCount = strFormatUtil.toPlayCountOrBulletChat(nPlayCount);
    let nBulletChat = detailStateEls[1].textContent.trim();
    nBulletChat = strFormatUtil.toPlayCountOrBulletChat(nBulletChat);
    const videoUrl = el.querySelector(".img>a")?.href || null;
    const bv = urlUtil.getUrlBV(videoUrl);
    const data = {
      title,
      userUrl,
      uid,
      name,
      videoUrl,
      bv,
      nPlayCount,
      nBulletChat,
      nDuration: -1,
      el,
      insertionPositionEl: el.querySelector(".detail-state"),
      explicitSubjectEl: el.querySelector(".info")
    };
    const otherVideosSelectEl = el.querySelector(".more-data.van-popover__reference");
    if (otherVideosSelectEl) {
      data.cssMap = { "bottom": "44px" };
    }
    list.push(data);
  }
  return list;
};
const startShieldingRankVideoList = async () => {
  const list = await getVideoDataList$1();
  for (let videoData of list) {
    video_shielding.shieldingVideoDecorated(videoData).catch(() => {
      eventEmitter.send("添加热门视频屏蔽按钮", { data: videoData, maskingFunc: startShieldingRankVideoList });
    });
  }
};
var popular = {
  isPopularHistory,
  isPopularAllPage,
  isGeneralPopularRank,
  isPopularWeeklyPage,
  startShieldingRankVideoList
};const isOldHistory = (url) => {
  return url.includes("https://www.bilibili.com/account/history");
};
const getVideoDataList = async () => {
  const elList = await elUtil.findElements("#history_list>.history-record");
  const list = [];
  for (let el of elList) {
    const labelEL = el.querySelector(".cover-contain>.label");
    if (labelEL !== null) {
      const label = labelEL.textContent.trim();
      console.log(`排除${label}`);
      continue;
    }
    const titleEl = el.querySelector(".title");
    const userEl = el.querySelector(".w-info>span>a");
    const title = titleEl.textContent.trim();
    const videoUrl = titleEl.href;
    const bv = urlUtil.getUrlBV(videoUrl);
    const name = userEl.textContent.trim();
    const userUrl = userEl.href;
    const uid = urlUtil.getUrlUID(userUrl);
    list.push({
      title,
      videoUrl,
      name,
      userUrl,
      uid,
      el,
      bv,
      explicitSubjectEl: el.querySelector(".r-txt"),
      insertionPositionEl: el.querySelector(".subtitle")
    });
  }
  return list;
};
const startShieldingVideo = async () => {
  console.log("开始屏蔽旧版历史记录视频列表");
  const list = await getVideoDataList();
  const css = { right: "45px" };
  for (let videoData of list) {
    video_shielding.shieldingVideoDecorated(videoData).catch(() => {
      videoData.cssMap = css;
      eventEmitter.send("视频添加屏蔽按钮", { data: videoData, maskingFunc: startShieldingVideo });
    });
  }
  console.log("屏蔽旧版历史记录视频列表完成");
};
const intervalExecutionStartShieldingVideo = () => {
  setInterval(startShieldingVideo, 2e3);
};
var oldHistory = {
  isOldHistory,
  intervalExecutionStartShieldingVideo
};eventEmitter.on("通知屏蔽", () => {
  const url = window.location.href;
  const title = document.title;
  if (globalValue.bOnlyTheHomepageIsBlocked) return;
  if (searchModel.isSearch(url)) {
    searchModel.startShieldingVideoList();
  }
  if (bilibiliHome.isHome(url, title)) {
    if (globalValue.compatibleBEWLYBEWLY) return;
    bilibiliHome.startDebounceShieldingHomeVideoList();
  }
  if (videoPlayModel.isVideoPlayPage(url)) {
    videoPlayModel.startShieldingVideoList();
  }
  if (collectionVideoPlayPageModel.iscCollectionVideoPlayPage(url)) {
    collectionVideoPlayPageModel.startShieldingVideoList();
  }
  if (videoPlayWatchLater.isVideoPlayWatchLaterPage(url)) {
    videoPlayWatchLater.startDebounceShieldingVideoList();
  }
  if (popular.isPopularAllPage(url) || popular.isPopularHistory(url)) {
    popularAll.startShieldingVideoList();
  }
  if (popular.isPopularWeeklyPage(url)) {
    popularAll.startShieldingVideoList(true);
  }
  if (popular.isGeneralPopularRank(url)) {
    popular.startShieldingRankVideoList();
  }
  if (topicDetail.isTopicDetailPage(url)) {
    topicDetail.startShielding();
  }
  if (space.isUserSpaceDynamicPage(url)) {
    space.checkUserSpaceShieldingDynamicContentThrottle();
  }
  if (oldHistory.isOldHistory(url)) {
    oldHistory.intervalExecutionStartShieldingVideo();
  }
  if (partition.isPartition(url) || partition.isNewPartition(url)) {
    partition.startIntervalShieldingVideoList();
  }
  if (dynamicPage.isUrlDynamicHomePage()) {
    dynamicPage.debounceCheckDynamicList();
  }
  if (BEWLYSearch.isUrlPage(url, title)) {
    BEWLYSearch.run(url);
  }
});eventEmitter.on("评论添加屏蔽按钮", (commentsData) => {
  shielding.addBlockButton({
    data: commentsData,
    maskingFunc: startShieldingComments
  }, "gz_shielding_comment_button");
});
const getUrlUserLevel = (src) => {
  const levelMath = src?.match(/level_(.+)\.svg/) || null;
  let level = -1;
  if (levelMath !== null) {
    const levelRow = levelMath[1];
    if (levelRow === "h") {
      level = 7;
    } else {
      level = parseInt(levelRow);
    }
  }
  return level;
};
const getOldUserLevel = (iEl) => {
  let level;
  const levelCLassName = iEl.classList[1];
  if (levelCLassName === "level-hardcore") {
    level = 7;
  } else {
    const levelMatch = levelCLassName.match(/level-(.+)/)?.[1] || "";
    level = parseInt(levelMatch);
  }
  return level;
};
const decorateData = valueCache.set("decorateData", {});
const getDecorate = (el, uid, name) => {
  const newVar = { dressUpId: -1, collectionActId: -1, decoratePic: null };
  if (el === null || el === void 0) return newVar;
  const decorateShadowRoot = el.shadowRoot;
  if (!decorateShadowRoot) return newVar;
  const decoratePicEl = decorateShadowRoot.querySelector("img");
  if (decoratePicEl === null || decoratePicEl === void 0) return newVar;
  newVar.decoratePic = decoratePicEl.src;
  const decorateAEl = decorateShadowRoot.querySelector("a");
  if (!decorateAEl) return newVar;
  const decorateHref = decorateAEl.href;
  const parseUrl = urlUtil.parseUrl(decorateHref);
  const itemIdStr = parseUrl.queryParams["item_id"];
  if (itemIdStr) {
    newVar.dressUpId = parseInt(itemIdStr);
  }
  const actIdStr = parseUrl.queryParams["act_id"];
  if (actIdStr) {
    newVar.collectionActId = parseInt(actIdStr);
  }
  newVar.name = name;
  decorateData[uid] = newVar;
  return newVar;
};
const getCommentSectionList = async (retryCount = 0) => {
  const MAX_RETRY = 10;
  const commentApps = await elUtil.findElements(
    "bili-comments",
    { interval: 500 }
  );
  const commentsData = [];
  for (let commentApp of commentApps) {
    const comments = await elUtil.findElements(
      "#feed>bili-comment-thread-renderer",
      { doc: commentApp.shadowRoot, interval: 500 }
    );
    let isLoaded = false;
    for (let el of comments) {
      try {
        const commentRoot = el.shadowRoot.getElementById("comment");
        if (!commentRoot || !commentRoot.shadowRoot) {
          console.warn("评论区楼主层元素结构异常，跳过该评论", el);
          continue;
        }
        const theOPEl = commentRoot.shadowRoot;
        const userInfoEl = theOPEl.querySelector("bili-comment-user-info");
        if (!userInfoEl || !userInfoEl.shadowRoot) continue;
        const theOPUserInfo = userInfoEl.shadowRoot.getElementById("info");
        if (!theOPUserInfo) continue;
        const userNameEl = theOPUserInfo.querySelector("#user-name>a");
        if (!userNameEl) continue;
        const userLevelSrc = theOPUserInfo.querySelector("#user-level>img")?.src || null;
        const level = getUrlUserLevel(userLevelSrc);
        const richTextEl = theOPEl.querySelector("#content>bili-rich-text");
        if (!richTextEl || !richTextEl.shadowRoot) continue;
        isLoaded = richTextEl.shadowRoot.querySelector("#contents>*") !== null;
        if (!isLoaded) {
          break;
        }
        const theOPContentEl = richTextEl.shadowRoot.querySelector("#contents");
        if (!theOPContentEl) continue;
        const theOPClone = theOPContentEl.cloneNode(true);
        theOPClone.querySelectorAll("style").forEach((s) => s.remove());
        const theOPContent = theOPClone.textContent.trim();
        const userName = userNameEl.textContent.trim();
        const userUrl = userNameEl.href;
        const uid = urlUtil.getUrlUID(userUrl);
        const decorateEl = theOPEl.querySelector("#ornament>bili-comment-user-sailing-card");
        const { dressUpId, collectionActId, decoratePic } = getDecorate(decorateEl, uid, userName);
        const replies = [];
        commentsData.push({
          name: userName,
          userUrl,
          uid,
          level,
          dressUpId,
          collectionActId,
          decoratePic,
          content: theOPContent,
          replies,
          el,
          insertionPositionEl: theOPUserInfo,
          explicitSubjectEl: theOPEl.querySelector("#body"),
          contentsEl: theOPContentEl
        });
        const repliesRenderer = el.shadowRoot.querySelector("bili-comment-replies-renderer");
        if (!repliesRenderer || !repliesRenderer.shadowRoot) continue;
        const inTheBuildingEls = repliesRenderer.shadowRoot.querySelectorAll("bili-comment-reply-renderer");
        for (let inTheBuildingEl of inTheBuildingEls) {
          try {
            const inTheContentEl = inTheBuildingEl.shadowRoot;
            if (!inTheContentEl) continue;
            const biliCommentUserInfo = inTheContentEl.querySelector("bili-comment-user-info");
            if (!biliCommentUserInfo || !biliCommentUserInfo.shadowRoot) continue;
            biliCommentUserInfo.style.display = "block";
            const inTheBuildingUserInfo = biliCommentUserInfo.shadowRoot.getElementById("info");
            if (!inTheBuildingUserInfo) continue;
            const inTheBuildingUserNameEl = inTheBuildingUserInfo.querySelector("#user-name>a");
            if (!inTheBuildingUserNameEl) continue;
            const inTheBuildingUserName = inTheBuildingUserNameEl.textContent.trim();
            const inTheBuildingUserUrl = inTheBuildingUserNameEl.href;
            const inTheBuildingUid = urlUtil.getUrlUID(inTheBuildingUserUrl);
            const biliRichTextEL = inTheContentEl.querySelector("bili-rich-text");
            if (!biliRichTextEL || !biliRichTextEL.shadowRoot) continue;
            const contentsEl = biliRichTextEL.shadowRoot.querySelector("#contents");
            if (!contentsEl) continue;
            const replyClone = contentsEl.cloneNode(true);
            replyClone.querySelectorAll("style").forEach((s) => s.remove());
            const inTheBuildingContent = replyClone.textContent.trim();
            const userLevelSrc2 = inTheBuildingUserInfo.querySelector("#user-level>img")?.src || null;
            const level2 = getUrlUserLevel(userLevelSrc2);
            const decorateDatum = decorateData[inTheBuildingUid];
            let dressUpId2 = -1, collectionActId2 = -1, decoratePic2 = null;
            if (decorateDatum) {
              dressUpId2 = decorateDatum.dressUpId;
              collectionActId2 = decorateDatum.collectionActId;
              decoratePic2 = decorateDatum.decoratePic;
            }
            replies.push({
              name: inTheBuildingUserName,
              userUrl: inTheBuildingUserUrl,
              uid: inTheBuildingUid,
              dressUpId: dressUpId2,
              collectionActId: collectionActId2,
              decoratePic: decoratePic2,
              level: level2,
              content: inTheBuildingContent,
              el: inTheBuildingEl,
              insertionPositionEl: inTheBuildingUserInfo,
              explicitSubjectEl: inTheBuildingEl,
              contentsEl
            });
          } catch (e) {
            console.error("解析楼中层评论时出错:", e);
          }
        }
      } catch (e) {
        console.error("解析楼主层评论时出错:", e);
      }
    }
    if (!isLoaded && retryCount < MAX_RETRY) {
      await defUtil.wait(500);
      return getCommentSectionList(retryCount + 1);
    }
  }
  return commentsData;
};
const getOldCommentSectionList = async () => {
  let results = await elUtil.findElements(".reply-list>.reply-item", { timeout: 5e3 });
  const commentsData = [];
  for (let el of results) {
    const theOPEl = el.querySelector(".root-reply-container");
    const theOPUserInfoEl = theOPEl.querySelector(".user-name");
    const userName = theOPUserInfoEl.textContent.trim();
    const uid = parseInt(theOPUserInfoEl.getAttribute("data-user-id"));
    const userUrl = `https://space.bilibili.com/${uid}`;
    const theOPContent = theOPEl.querySelector(".reply-content").textContent.trim();
    const userInfoEl = el.querySelector(".user-info");
    const iEl = userInfoEl.querySelector("i");
    const level = getOldUserLevel(iEl);
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
    const inTheBuildingEls = el.querySelectorAll(".sub-reply-container>.sub-reply-list>.sub-reply-item");
    for (let inTheBuildingEl of inTheBuildingEls) {
      const subUserNameEl = inTheBuildingEl.querySelector(".sub-user-name");
      const uid2 = parseInt(subUserNameEl.getAttribute("data-user-id"));
      const userName2 = subUserNameEl.textContent.trim();
      const userUrl2 = `https://space.bilibili.com/${uid2}`;
      const subContent = inTheBuildingEl.querySelector(".reply-content").textContent.trim();
      const subUserInfoEl = inTheBuildingEl.querySelector(".sub-user-info");
      const iEl2 = subUserInfoEl.querySelector("i");
      const level2 = getOldUserLevel(iEl2);
      const replyContentContainerEl = inTheBuildingEl.querySelector("span.reply-content-container");
      replyContentContainerEl.style.display = "block";
      replies.push({
        name: userName2,
        userUrl: userUrl2,
        uid: uid2,
        level: level2,
        content: subContent,
        el: inTheBuildingEl,
        insertionPositionEl: subUserInfoEl,
        explicitSubjectEl: inTheBuildingEl
      });
    }
  }
  return commentsData;
};
const startShieldingComments = async () => {
  if (videoPlayModel.isVideoPlayPage() && localMKData.isDelBottomComment() || isCloseCommentBlockingGm()) {
    return;
  }
  let list;
  const href = window.location.href;
  if (localMKData.isDiscardOldCommentAreas()) {
    list = await getCommentSectionList();
  } else if (href.includes("https://space.bilibili.com/") || topicDetail.isTopicDetailPage(href)) {
    list = await getOldCommentSectionList();
  } else {
    list = await getCommentSectionList();
  }
  comments_shielding.shieldingCommentsAsync(list);
};
eventEmitter.on("event-检查评论区屏蔽", () => {
  startShieldingComments();
});const MIGRATION_FLAG = "migration_completed_v2";
function adaptOldParameters(obj) {
  if (Object.prototype.hasOwnProperty.call(obj, "blockedTitleArray")) {
    obj["blockedTitle_Switch"] = true;
    obj["blockedTitle_UseRegular"] = true;
    obj["blockedTitle_Array"] = obj["blockedTitleArray"];
    delete obj["blockedTitleArray"];
    obj["blockedNameOrUid_Switch"] = true;
    obj["blockedNameOrUid_UseRegular"] = true;
    obj["blockedNameOrUid_Array"] = obj["blockedNameOrUidArray"];
    delete obj["blockedNameOrUidArray"];
    obj["blockedVideoPartitions_Switch"] = false;
    obj["blockedVideoPartitions_UseRegular"] = false;
    obj["blockedVideoPartitions_Array"] = [];
    obj["blockedTag_Switch"] = true;
    obj["blockedTag_UseRegular"] = true;
    obj["blockedTag_Array"] = obj["blockedTagArray"];
    delete obj["blockedTagArray"];
    obj["doubleBlockedTag_Switch"] = true;
    obj["doubleBlockedTag_UseRegular"] = true;
    obj["doubleBlockedTag_Array"] = obj["doubleBlockedTagArray"];
    delete obj["doubleBlockedTagArray"];
    obj["blockedShortDuration_Switch"] = true;
    obj["whitelistNameOrUid_Switch"] = false;
    obj["whitelistNameOrUid_Array"] = [];
    obj["hideVideoMode_Switch"] = obj["hideVideoModeSwitch"];
    delete obj["hideVideoModeSwitch"];
    obj["consoleOutputLog_Switch"] = obj["consoleOutputLogSwitch"];
    delete obj["consoleOutputLogSwitch"];
  }
  return obj;
}
const MIGRATION_MAP = [
  { from: "blockedTitle_Switch", to: null, def: true },
  { from: "blockedTitle_UseRegular", to: null, def: true },
  { from: "blockedTitle_Array", to: "title", def: [] },
  { from: "blockedNameOrUid_Switch", to: null, def: true },
  { from: "blockedNameOrUid_UseRegular", to: null, def: false },
  { from: "blockedNameOrUid_Array", to: "name", def: [] },
  { from: "blockedTag_Switch", to: null, def: true },
  { from: "blockedTag_UseRegular", to: null, def: true },
  { from: "blockedTag_Array", to: "videoTag", def: [] },
  { from: "doubleBlockedTag_Switch", to: null, def: true },
  { from: "doubleBlockedTag_UseRegular", to: null, def: true },
  { from: "doubleBlockedTag_Array", to: "videoTag_precise_combination", def: [] },
  { from: "blockedVideoPartitions_Switch", to: "block_video_partitions", def: false },
  { from: "blockedVideoPartitions_UseRegular", to: null, def: false },
  { from: "blockedVideoPartitions_Array", to: "videoPartition", def: [] },
  { from: "blockedTopComment_Switch", to: null, def: false },
  { from: "blockedTopComment_UseRegular", to: null, def: true },
  { from: "blockedTopComment_Array", to: "commentOn", def: [] },
  { from: "blockedUpSigns_Switch", to: null, def: false },
  { from: "blockedUpSigns_UseRegular", to: null, def: true },
  { from: "blockedUpSigns_Array", to: "signature", def: [] },
  { from: "whitelistNameOrUid_Switch", to: null, def: false },
  { from: "whitelistNameOrUid_Array", to: "precise_uid_white", def: [] },
  { from: "hideVideoMode_Switch", to: "hide_video_mode", def: false },
  { from: "blockedOverlayOnlyDisplaysType_Switch", to: "overlay_only_type", def: false },
  { from: "hideNonVideoElements_Switch", to: "hide_non_video_elements", def: true },
  { from: "hideTrending_Switch", to: "block_trending", def: false },
  { from: "blockedTrendingItem_Switch", to: null, def: false },
  { from: "blockedTrendingItem_UseRegular", to: "trending_use_regex", def: true },
  { from: "blockedTrendingItem_Array", to: "blocked_trending_items", def: [] },
  { from: "blockedTrendingItemByTitleTag_Switch", to: null, def: false },
  { from: "blockedShortDuration", to: "minimum_duration_gm", def: 0 },
  { from: "blockedBelowVideoViews", to: "minimum_play_gm", def: 0 },
  { from: "blockedBelowLikesRate", to: "video_like_rate", def: 0 },
  { from: "blockedBelowCoinRate", to: null, def: 0 },
  { from: "blockedAboveFavoriteCoinRatio", to: "favorite_coin_ratio", def: 10 },
  { from: "blockedBelowUpLevel", to: "minimum_user_level_video_gm", def: 0 },
  { from: "blockedBelowUpFans", to: "limitation_fan_sum_gm", def: 0 },
  { from: "blockedShortDuration_Switch", to: "is_minimum_duration_gm", def: false },
  { from: "blockedBelowVideoViews_Switch", to: "is_minimum_play_gm", def: false },
  { from: "blockedBelowLikesRate_Switch", to: "video_like_rate_blocking_status", def: false },
  { from: "blockedBelowCoinRate_Switch", to: null, def: false },
  { from: "blockedAboveFavoriteCoinRatio_Switch", to: "favorite_coin_ratio_blocking", def: false },
  { from: "blockedBelowUpLevel_Switch", to: "is_enable_minimum_user_level_video_gm", def: false },
  { from: "blockedBelowUpFans_Switch", to: "is_fans_num_blocking_status_gm", def: false },
  { from: "blockedPortraitVideo_Switch", to: "blockVerticalVideo", def: false },
  { from: "blockedChargingExclusive_Switch", to: "is_up_owner_exclusive", def: false },
  { from: "blockedFilteredCommentsVideo_Switch", to: "is_videos_in_featured_comments_blocked_gm", def: false },
  { from: "consoleOutputLog_Switch", to: "console_output_log", def: false },
  { from: "hideBlockedWordsInMenu_Switch", to: "hide_blocked_words", def: false }
];
function runMigration() {
  if (GM_getValue(MIGRATION_FLAG, false)) return;
  const blockedParameter = GM_getValue("GM_blockedParameter", null);
  if (!blockedParameter) {
    GM_setValue(MIGRATION_FLAG, true);
    return;
  }
  adaptOldParameters(blockedParameter);
  let migratedCount = 0;
  for (const entry of MIGRATION_MAP) {
    const { from, to, def } = entry;
    if (to === null) continue;
    const val = blockedParameter[from];
    if (val !== void 0 && val !== null) {
      const existing = GM_getValue(to, void 0);
      if (existing === void 0 || existing === def) {
        GM_setValue(to, val);
        migratedCount++;
      }
    }
  }
  GM_setValue(MIGRATION_FLAG, true);
  console.log(`[BiliBlockFusion] 设置迁移完成，共迁移 ${migratedCount} 项设置。`);
}
runMigration();window.addEventListener("load", () => {
  console.log("页面加载完成");
  router.staticRoute(document.title, window.location.href);
  watchUtil.addEventListenerUrlChange((newUrl, oldUrl, title) => {
    router.dynamicRouting(title, newUrl);
  });
});
watchUtil.addEventListenerNetwork((url, windowUrl, winTitle, initiatorType) => {
  observeNetwork$1.observeNetwork(url, windowUrl, winTitle, initiatorType);
});})(Vue,Dexie);