import {eventEmitter} from "@/core/EventEmitter.ts";
import {sendShieldLog} from "@/core/shieldLog.ts";
import shielding, {
    blockByLevelForComment,
    blockCheckWhiteUserUid,
    blockComment,
    blockSeniorMemberOnly,
    blockUserUidAndName
} from "./main.ts";
import type { BlockResult } from "@/types/shielding";
import {returnTempVal} from "@/config/globalValue.ts";
import localMKData from "../../state/localMKData.ts";

interface CommentData {
    content: string;
    uid: number;
    name: string;
    level?: number;
    decoratePic?: any;
    collectionActId?: number;
    dressUpId?: number;
    el?: HTMLElement;
    replies?: CommentData[];
}

const blockCommentWordLimit = (content: string): BlockResult => {
    const commentWordLimit = localMKData.getCommentWordLimitVal();
    if (commentWordLimit < 3) return returnTempVal;
    if (content.length > commentWordLimit) {
        return {state: true, type: '屏蔽字数限制', matching: `字数限制为${commentWordLimit}`}
    }
    return returnTempVal;
}

const shieldingComment = (commentsData: CommentData): BlockResult => {
    const {
        content, uid, name, level = -1, decoratePic = null,
        collectionActId = -1, dressUpId = -1,
    } = commentsData;
    if (uid !== -1 && blockCheckWhiteUserUid(uid)) return returnTempVal;
    let returnVal = blockSeniorMemberOnly(level)
    if (returnVal.state) return returnVal;
    returnVal = blockUserUidAndName(uid, name)
    if (returnVal.state) return returnVal;
    returnVal = blockComment(content)
    if (returnVal.state) return returnVal;
    if (level !== -1) {
        returnVal = blockByLevelForComment(level);
        if (returnVal.state) return returnVal;
    }
    returnVal = blockCommentWordLimit(content)
    if (returnVal.state) return returnVal;
    if (decoratePic !== null && collectionActId !== -1) {
        returnVal = shielding.blockDecorationCollection(collectionActId)
        if (returnVal.state) return returnVal;
    }
    if (decoratePic !== null && dressUpId !== -1) {
        returnVal = shielding.blockDecoration(dressUpId)
        if (returnVal.state) return returnVal;
    }
    return returnVal;
}

/**
 * 屏蔽单条评论，返回是否命中屏蔽
 *
 * 「仅看硬核会员」命中时 state=true 但语义是保留，必须返回 false，
 * 否则硬核会员的评论会被删掉。
 */
const shieldingCommentAsync = async (commentsData: CommentData): Promise<boolean> => {
    const {state, type, matching} = shieldingComment(commentsData);
    eventEmitter.send('event-评论通知替换关键词', commentsData)
    if (type === '保留硬核会员') {
        return false
    }
    if (state) {
        commentsData.el?.remove()
        // 只取安全字段用于日志快照，避免深拷贝含 DOM/Vue 结构的完整评论数据导致卡死
        const safeData = {
            name: commentsData.name,
            uid: commentsData.uid,
            content: commentsData.content,
            level: commentsData.level
        };
        sendShieldLog({source: "DOM层过滤", ruleType: type ?? "评论规则", matching, objectType: "评论", data: safeData, original: safeData});
        return true;
    }
    return false;
}

const shieldingCommentsAsync = async (commentsDataList: CommentData[]): Promise<void> => {
    for (let commentsData of commentsDataList) {
        // 屏蔽按钮只挂在未被屏蔽的评论上：先判命中，再决定是否加按钮。
        // 这里不能从返回值里解构 type/matching——该函数只返回布尔值。
        if (await shieldingCommentAsync(commentsData)) continue;
        eventEmitter.send('评论添加屏蔽按钮', commentsData)
        const {replies = []} = commentsData;
        for (let reply of replies) {
            if (await shieldingCommentAsync(reply)) continue;
            eventEmitter.send('评论添加屏蔽按钮', reply)
        }
    }
}

export default {
    shieldingComment,
    shieldingCommentsAsync,
    shieldingCommentAsync
}
