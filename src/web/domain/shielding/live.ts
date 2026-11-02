import ruleMatchingUtil from "../../core/util/ruleMatchingUtil.ts";
import ruleKeyListData from "../../config/ruleKeyListData.ts";
import {eventEmitter} from "@/core/EventEmitter.ts";
import {sendShieldLog} from "@/core/shieldLog.ts";
import shielding, {
    asyncBlockByLevelForComment,
    asyncBlockSeniorMemberOnly,
    asyncBlockUserUidAndName,
    blockCheckWhiteUserUid,
    blockUserUidAndName,
} from "./main.ts";
import type { BlockResult } from "@/types/shielding";
import {returnTempVal} from "@/config/globalValue.ts";
import localMKData from "../../state/localMKData.ts";

interface LiveRoomData {
    name: string;
    title: string;
    partition?: string;
    uid?: number;
    roomId: number | string;
    el?: HTMLElement;
}

interface LiveRoomContent {
    content: string;
    uid: number;
    name: string;
    level?: number;
    chatType: string;
    fansMedal: string | null;
    fanBrandLevel: number;
    el: HTMLElement;
    roomId: number | string;
    gloryLevelSrc?: string | null;
}

export const blockLiveRoomId = (liveRoomId: number | string): BlockResult => {
    // 规则由输入框写入，可能是 number 也可能是 string；URL 解析出来的房间号是字符串，
    // 直接 includes 会因类型不同而漏匹配，统一转字符串比较。
    const roomIdStr = String(liveRoomId);
    const ruleList = GM_getValue('precise_liveRoomId', [] as (string | number)[]);
    if (ruleList.some(item => String(item) === roomIdStr)) {
        return {state: true, type: "精确直播间id", matching: liveRoomId};
    }
    return returnTempVal;
}

const asyncBlockUserFanCard = async (fansMedal: string | null): Promise<BlockResult> => {
    if (fansMedal !== null) {
        if (ruleMatchingUtil.exactMatch(ruleKeyListData.getPreciseFanCardArr(), fansMedal)) {
            return {state: true, type: '精确粉丝牌', matching: fansMedal}
        }
    }
    return returnTempVal;
}

const blockLiveTitle = (title: string): BlockResult => {
    return shielding.blockExactAndFuzzyMatching(title, {
        fuzzyKey: 'liveTitle', fuzzyTypeName: '模糊标题(直播间)',
        regexKey: 'liveTitleCanonical', regexTypeName: '正则标题(直播间)'
    })
}

const blockLiveUserId = (liveUid: number): BlockResult => {
    // 同 blockLiveRoomId：规则列表可能混有字符串，精确匹配前统一成数字再比
    const ruleList = GM_getValue('precise_live_uid', []);
    if (ruleMatchingUtil.exactMatch(ruleList, liveUid) || ruleMatchingUtil.exactMatch(ruleList, String(liveUid))) {
        return {state: true, type: "精确uid(直播区)", matching: liveUid};
    }
    return returnTempVal;
}

const blockLiveBarrage = (barrage: string): BlockResult => {
    return shielding.blockExactAndFuzzyMatching(barrage, {
        fuzzyKey: 'liveBarrage', fuzzyTypeName: '直播弹幕(模糊)',
        regexKey: 'liveBarrageCanonical', regexTypeName: '直播弹幕(正则)'
    })
}

const blockGloryLevel = (roomId: number | string, gloryLevelSrc: string | null): BlockResult => {
    if (gloryLevelSrc === null || gloryLevelSrc.length <= 10) return returnTempVal
    const listGm = localMKData.getGloryLevelMappingListGm();
    if (listGm.length === 0) return returnTempVal;
    const find = listGm.find(item => item.src === gloryLevelSrc);
    if (find === undefined) return returnTempVal;
    const findLevel = find.level
    const levelLimitListGm = localMKData.getGloryLevelLimitListGm();
    const globalItem = levelLimitListGm.find(item => String(item.roomId) === '0')
    if (globalItem !== undefined && globalItem.status) {
        if (findLevel >= globalItem.limitLevel) {
            return returnTempVal
        }
        return {
            state: true,
            type: "荣耀等级屏蔽",
            matching: `用户等级${findLevel}<=全局限制等级${globalItem.limitLevel}`
        }
    }
    // 房间号在存储里可能是 number 也可能是 string（URL 解析得到的是字符串），统一按字符串比较
    for (const limitItem of levelLimitListGm) {
        if (String(limitItem.roomId) !== String(roomId)) continue
        // 该房间的配置被关闭时只跳过这一条，不能 break（否则后面房间的配置全部失效）
        if (!limitItem.status) continue;
        if (findLevel <= limitItem.limitLevel) {
            return {
                state: true,
                type: "荣耀等级屏蔽",
                matching: `用户等级${findLevel}=>当前房间${roomId}限制等级${limitItem.limitLevel}`
            }
        }
    }
    return returnTempVal
}

const asyncBlockGloryLevel = async (roomId: number | string, gloryLevelSrc: string | null): Promise<BlockResult> => {
    const res = blockGloryLevel(roomId, gloryLevelSrc)
    if (res.state) {
        return Promise.reject(res)
    }
    return res
}

const blockFansLevel = (fansMedal: string | null, fansLevel: number): BlockResult => {
    if (fansMedal === null || fansLevel === -1) return returnTempVal
    const listGm = localMKData.getFansLevelLimitListGm();
    const find = listGm.find(item => item.name === fansMedal);
    if (find === undefined) return returnTempVal
    if (!find.status) return returnTempVal
    const {limitLevel} = find;
    if (limitLevel >= fansLevel) {
        return {
            state: true,
            type: "粉丝牌等级屏蔽",
            matching: `限制【${fansMedal}】粉丝牌等级${limitLevel}>=目标粉丝牌等级${fansLevel}`
        }
    }
    return returnTempVal
}

const asyncBlockFansLevel = async (fansMedal: string | null, fansLevel: number): Promise<BlockResult> => {
    const res = blockFansLevel(fansMedal, fansLevel)
    if (res.state) {
        return Promise.reject(res)
    }
    return res
}

export const shieldingLiveRoom = (liveRoomData: Omit<LiveRoomData, 'el'>): BlockResult => {
    const {name, title, partition, uid = -1, roomId} = liveRoomData;
    let returnVal: BlockResult;
    if (uid !== -1) {
        if (blockCheckWhiteUserUid(uid)) {
            return returnTempVal;
        }
        returnVal = blockUserUidAndName(uid, name)
        if (returnVal.state) return returnVal
        returnVal = blockLiveUserId(uid)
        if (returnVal.state) return returnVal
    }
    returnVal = blockLiveTitle(title)
    if (returnVal.state) {
        return returnVal
    }
    if (partition) {
        if (ruleMatchingUtil.exactMatch(ruleKeyListData.getPrecisePartitionArr(), partition)) {
            return {state: true, type: "精确直播分区"};
        }
    }
    if (roomId) {
        return blockLiveRoomId(roomId);
    }
    return returnTempVal;
}

const shieldingLiveRoomDecorated = (liveRoomData: LiveRoomData): boolean => {
    const {state, type, matching} = shieldingLiveRoom(liveRoomData);
    if (state) {
        liveRoomData.el?.remove();
        sendShieldLog({
            source: "DOM层过滤",
            ruleType: type ?? "直播间规则",
            matching,
            objectType: "直播间",
            data: liveRoomData,
            original: liveRoomData
        })
    }
    return state;
}

const addLiveContentBlockButton = (commentsData: any): void => {
    shielding.addBlockButton(commentsData, "gz_shielding_live_danmaku_button");
}

eventEmitter.on('event-直播首页列表添加屏蔽按钮', (liveCardItemData: any) => {
    shielding.addBlockButton(liveCardItemData, "gz-live-home-room-card-list-item");
})

export default {
    shieldingLiveRoomDecorated,
    shieldingLiveRoomContent(liveRoomContent: LiveRoomContent): void {
        const {
            content, uid, name, level = -1, chatType, fansMedal, fanBrandLevel, el,
            roomId, gloryLevelSrc = null
        } = liveRoomContent;
        if (uid !== -1 && blockCheckWhiteUserUid(uid)) return;
        asyncBlockSeniorMemberOnly(level)
            .then(() => asyncBlockUserUidAndName(uid, name))
            .then(() => asyncBlockByLevelForComment(level))
            .then(() => asyncBlockUserFanCard(fansMedal))
            .then(() => asyncBlockGloryLevel(roomId, gloryLevelSrc))
            .then(() => asyncBlockFansLevel(fansMedal, fanBrandLevel))
            .then(() => {
                if (chatType === 'emoticon') {
                    return Promise.reject({type: '中断'});
                }
            })
            .then(() => blockLiveBarrage(content))
            .catch(res => {
                let {state, type, matching} = res;
                if (type === '中断') return;
                if (state) {
                    el?.remove()
                }
                if (type) {
                    sendShieldLog({
                        source: "弹幕过滤",
                        ruleType: type,
                        matching,
                        objectType: "直播弹幕",
                        data: liveRoomContent
                    })
                }
            })
    },
    addLiveContentBlockButton, asyncBlockUserFanCard
}
