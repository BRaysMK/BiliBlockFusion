/**
 * 脚本A (tjxwork) 兼容适配层
 *
 * 将脚本A的 blockedParameter 数据结构映射到脚本B (BiBiBSP) 的匹配引擎。
 * 提供等效的屏蔽函数，使用 universalMatcher 统一引擎。
 *
 * 对应关系:
 *   脚本A blockedParameter               → 脚本B GM_getValue 键
 *   ─────────────────────────────────────────────────────────
 *   blockedTitle_Array                   → title / titleCanonical
 *   blockedNameOrUid_Array               → name / nameCanonical / precise_name
 *   blockedTag_Array                     → videoTag / precise_videoTag / videoTagCanonical
 *   doubleBlockedTag_Array               → videoTag_precise_combination
 *   blockedVideoPartitions_Array         → videoPartition / videoPartitionCanonical
 *   blockedTopComment_Array              → commentOn / commentOnCanonical
 *   blockedUpSigns_Array                 → signature / signatureCanonical
 */

import { blockExactOrRegex, blockTagsMatch, blockDoubleTagsMatch } from '../../utils/universalMatcher.js';
import { returnTempVal } from '../../data/globalValue.js';

// ==================== 设置读取适配器 ====================

/** 读取脚本A风格的屏蔽设置 (从 GM_blockedParameter) */
function getTJXSettings() {
    return GM_getValue('GM_blockedParameter', null);
}

/** 检查脚本A设置是否存在且对应开关开启 */
function isTJXEnabled(settings, switchKey, arrayKey) {
    if (!settings) return false;
    if (!settings[switchKey]) return false;
    if (arrayKey && (!settings[arrayKey] || settings[arrayKey].length === 0)) return false;
    return true;
}

// ==================== 脚本A兼容屏蔽函数 ====================

/**
 * 按标题屏蔽 (脚本A兼容)
 * 使用脚本A的 blockedTitle_Array + blockedTitle_UseRegular
 */
export function tjxBlockTitle(title) {
    const s = getTJXSettings();
    if (!isTJXEnabled(s, 'blockedTitle_Switch', 'blockedTitle_Array')) return returnTempVal;
    return blockExactOrRegex(title, s.blockedTitle_Array, s.blockedTitle_UseRegular, '按标题屏蔽');
}

/**
 * 按UP主名称或Uid屏蔽 (脚本A兼容)
 * 同时匹配 name 和 uid 字符串
 */
export function tjxBlockNameOrUid(uid, name) {
    const s = getTJXSettings();
    if (!isTJXEnabled(s, 'blockedNameOrUid_Switch', 'blockedNameOrUid_Array')) return returnTempVal;
    if (!uid && !name) return returnTempVal;

    const rules = s.blockedNameOrUid_Array;
    const useRegex = s.blockedNameOrUid_UseRegular;

    // 先尝试 uid 匹配
    if (uid !== undefined && uid !== null && uid !== -1) {
        const uidStr = String(uid);
        if (useRegex) {
            const hit = rules.find(r => {
                try { return new RegExp(r).test(name) || r === uidStr; } catch (e) { return false; }
            });
            if (hit) return { state: true, type: '按UP主屏蔽', matching: name || uidStr };
        } else {
            if (rules.includes(uidStr) || rules.includes(name)) {
                return { state: true, type: '按UP主屏蔽', matching: rules.includes(uidStr) ? uidStr : name };
            }
        }
    }
    // 按 name 匹配
    if (name) {
        return blockExactOrRegex(name, rules, useRegex, '按UP主屏蔽');
    }
    return returnTempVal;
}

/**
 * 按标签屏蔽 (脚本A兼容)
 */
export function tjxBlockTag(tags) {
    const s = getTJXSettings();
    if (!isTJXEnabled(s, 'blockedTag_Switch', 'blockedTag_Array')) return returnTempVal;
    return blockTagsMatch(tags, s.blockedTag_Array, s.blockedTag_UseRegular, '按标签屏蔽');
}

/**
 * 按双重标签屏蔽 (脚本A兼容)
 */
export function tjxBlockDoubleTag(tags) {
    const s = getTJXSettings();
    if (!isTJXEnabled(s, 'doubleBlockedTag_Switch', 'doubleBlockedTag_Array')) return returnTempVal;
    return blockDoubleTagsMatch(tags, s.doubleBlockedTag_Array, s.doubleBlockedTag_UseRegular, '按双重标签屏蔽');
}

/**
 * 按视频分区屏蔽 (脚本A兼容)
 */
export function tjxBlockVideoPartition(partition) {
    const s = getTJXSettings();
    if (!isTJXEnabled(s, 'blockedVideoPartitions_Switch', 'blockedVideoPartitions_Array')) return returnTempVal;
    return blockExactOrRegex(partition, s.blockedVideoPartitions_Array, s.blockedVideoPartitions_UseRegular, '按视频分区屏蔽');
}

/**
 * 按置顶评论屏蔽 (脚本A兼容)
 */
export function tjxBlockTopComment(comment) {
    const s = getTJXSettings();
    if (!isTJXEnabled(s, 'blockedTopComment_Switch', 'blockedTopComment_Array')) return returnTempVal;
    return blockExactOrRegex(comment, s.blockedTopComment_Array, s.blockedTopComment_UseRegular, '按置顶评论屏蔽');
}

/**
 * 按UP主简介屏蔽 (脚本A兼容)
 */
export function tjxBlockUpSign(sign) {
    const s = getTJXSettings();
    if (!isTJXEnabled(s, 'blockedUpSigns_Switch', 'blockedUpSigns_Array')) return returnTempVal;
    return blockExactOrRegex(sign, s.blockedUpSigns_Array, s.blockedUpSigns_UseRegular, '按UP主简介屏蔽');
}

/**
 * 检查白名单 (脚本A兼容)
 * 白名单优先 — 若命中则返回 true，调用方应放行
 */
export function tjxCheckWhitelist(uid, name) {
    const s = getTJXSettings();
    if (!s || !s.whitelistNameOrUid_Switch || !s.whitelistNameOrUid_Array || s.whitelistNameOrUid_Array.length === 0) {
        return false;
    }
    const wl = s.whitelistNameOrUid_Array;
    if (uid !== undefined && uid !== null && uid !== -1) {
        if (wl.includes(String(uid))) return true;
    }
    if (name && wl.includes(name)) return true;
    return false;
}

// ==================== 数值阈值判断 (脚本A兼容) ====================

/**
 * 短时长屏蔽 (脚本A兼容)
 * @param {number} duration - 视频时长(秒)
 */
export function tjxCheckShortDuration(duration) {
    const s = getTJXSettings();
    if (!s || !s.blockedShortDuration_Switch || !s.blockedShortDuration || s.blockedShortDuration <= 0) return returnTempVal;
    if (duration === undefined || duration === null || duration < 0) return returnTempVal;
    if (s.blockedShortDuration > duration) {
        return { state: true, type: '屏蔽低时长', matching: duration + '秒' };
    }
    return returnTempVal;
}

/**
 * 低播放量屏蔽 (脚本A兼容)
 */
export function tjxCheckBelowViews(views) {
    const s = getTJXSettings();
    if (!s || !s.blockedBelowVideoViews_Switch || !s.blockedBelowVideoViews || s.blockedBelowVideoViews <= 0) return returnTempVal;
    if (views === undefined || views === null) return returnTempVal;
    if (s.blockedBelowVideoViews > views) {
        return { state: true, type: '屏蔽低播放量', matching: views + '次' };
    }
    return returnTempVal;
}

/**
 * 低点赞率屏蔽 (脚本A兼容)
 */
export function tjxCheckBelowLikesRate(likeRate) {
    const s = getTJXSettings();
    if (!s || !s.blockedBelowLikesRate_Switch || !s.blockedBelowLikesRate || s.blockedBelowLikesRate <= 0) return returnTempVal;
    if (likeRate === undefined || likeRate === null) return returnTempVal;
    if (s.blockedBelowLikesRate > likeRate) {
        return { state: true, type: '屏蔽低点赞率', matching: likeRate + '%' };
    }
    return returnTempVal;
}

/**
 * 低投币率屏蔽 (脚本A兼容)
 */
export function tjxCheckBelowCoinRate(coinRate) {
    const s = getTJXSettings();
    if (!s || !s.blockedBelowCoinRate_Switch || !s.blockedBelowCoinRate || s.blockedBelowCoinRate <= 0) return returnTempVal;
    if (coinRate === undefined || coinRate === null) return returnTempVal;
    if (s.blockedBelowCoinRate > coinRate) {
        return { state: true, type: '屏蔽低投币率', matching: coinRate + '%' };
    }
    return returnTempVal;
}

/**
 * 收藏/投币比屏蔽 (脚本A兼容)
 * 条件: 播放>5000, 收藏>50, 发布>2小时
 */
export function tjxCheckFavoriteCoinRatio(ratio, views, favorites, pubdate) {
    const s = getTJXSettings();
    if (!s || !s.blockedAboveFavoriteCoinRatio_Switch || !s.blockedAboveFavoriteCoinRatio || s.blockedAboveFavoriteCoinRatio <= 0) {
        return returnTempVal;
    }
    if (views < 5000) return returnTempVal;
    if (favorites < 50) return returnTempVal;
    // 发布 < 2小时 则跳过
    const nowSec = Math.floor(Date.now() / 1000);
    if (pubdate && (nowSec - pubdate < 7200)) return returnTempVal;
    if (ratio === undefined || ratio === null) return returnTempVal;
    if (ratio > s.blockedAboveFavoriteCoinRatio) {
        return { state: true, type: '屏蔽高收藏投币比', matching: String(ratio) };
    }
    return returnTempVal;
}

/**
 * 竖屏视频屏蔽 (脚本A兼容)
 */
export function tjxCheckPortraitVideo(width, height) {
    const s = getTJXSettings();
    if (!s || !s.blockedPortraitVideo_Switch) return returnTempVal;
    if (!width || !height) return returnTempVal;
    if (width < height) {
        return { state: true, type: '屏蔽竖屏视频', matching: `${width} x ${height}` };
    }
    return returnTempVal;
}

/**
 * 充电专属视频屏蔽 (脚本A兼容)
 */
export function tjxCheckChargingExclusive(isExclusive) {
    const s = getTJXSettings();
    if (!s || !s.blockedChargingExclusive_Switch) return returnTempVal;
    if (isExclusive) {
        return { state: true, type: '屏蔽充电专属视频', matching: '充电专属' };
    }
    return returnTempVal;
}

/**
 * 精选评论视频屏蔽 (脚本A兼容)
 */
export function tjxCheckFilteredComments(isFiltered) {
    const s = getTJXSettings();
    if (!s || !s.blockedFilteredCommentsVideo_Switch) return returnTempVal;
    if (isFiltered) {
        return { state: true, type: '屏蔽精选评论的视频', matching: '精选评论' };
    }
    return returnTempVal;
}

/**
 * 低UP主等级屏蔽 (脚本A兼容)
 */
export function tjxCheckBelowUpLevel(level) {
    const s = getTJXSettings();
    if (!s || !s.blockedBelowUpLevel_Switch || !s.blockedBelowUpLevel || s.blockedBelowUpLevel <= 0) return returnTempVal;
    if (level === undefined || level === null || level < 0) return returnTempVal;
    if (s.blockedBelowUpLevel > level) {
        return { state: true, type: '屏蔽低UP主等级', matching: level + '级' };
    }
    return returnTempVal;
}

/**
 * 低UP主粉丝数屏蔽 (脚本A兼容)
 */
export function tjxCheckBelowUpFans(fans) {
    const s = getTJXSettings();
    if (!s || !s.blockedBelowUpFans_Switch || !s.blockedBelowUpFans || s.blockedBelowUpFans <= 0) return returnTempVal;
    if (fans === undefined || fans === null) return returnTempVal;
    if (s.blockedBelowUpFans > fans) {
        return { state: true, type: '屏蔽低UP主粉丝数', matching: fans + '人' };
    }
    return returnTempVal;
}

// ==================== 脚本A设置检查 (开关状态) ====================

/** 检查脚本A的叠加层相关设置是否就绪 */
export function tjxGetOverlaySettings() {
    const s = getTJXSettings();
    if (!s) return null;
    return {
        overlayMode: !s.hideVideoMode_Switch,               // 非隐藏模式=叠加层模式
        hideVideoMode: s.hideVideoMode_Switch || false,
        onlyDisplayType: s.blockedOverlayOnlyDisplaysType_Switch || false,
        hideNonVideoElements: s.hideNonVideoElements_Switch !== false,  // 默认true
        hideTrending: s.hideTrending_Switch || false,
        blockedTrendingByTitleTag: s.blockedTrendingItemByTitleTag_Switch || false,
        blockedTrending: s.blockedTrendingItem_Switch || false,
        trendingUseRegex: s.blockedTrendingItem_UseRegular !== false,
        trendingArray: s.blockedTrendingItem_Array || [],
        hideBlockedWords: s.hideBlockedWordsInMenu_Switch || false,
        consoleLog: s.consoleOutputLog_Switch || false,
    };
}

export default {
    tjxBlockTitle,
    tjxBlockNameOrUid,
    tjxBlockTag,
    tjxBlockDoubleTag,
    tjxBlockVideoPartition,
    tjxBlockTopComment,
    tjxBlockUpSign,
    tjxCheckWhitelist,
    tjxCheckShortDuration,
    tjxCheckBelowViews,
    tjxCheckBelowLikesRate,
    tjxCheckBelowCoinRate,
    tjxCheckFavoriteCoinRatio,
    tjxCheckPortraitVideo,
    tjxCheckChargingExclusive,
    tjxCheckFilteredComments,
    tjxCheckBelowUpLevel,
    tjxCheckBelowUpFans,
    tjxGetOverlaySettings,
    getTJXSettings,
    isTJXEnabled,
};
