import localMKData from "../../state/localMKData.ts";
import {returnTempVal} from "@/config/globalValue.ts";
import arrUtil from "../../core/util/arrUtil.ts";
import type { BlockResult } from "@/types/shielding";

interface MatchModeOption {
    label: string;
    value: string;
}

interface FieldOption {
    label: string;
    value: string;
}

interface CombinationRuleItem {
    key: string;
    mode: string;
    value: string;
}

interface CombinationRuleData {
    title: string;
    tags: string[];
    videoInfo: {
        desc: string;
    };
}

const matchModeOptions: MatchModeOption[] = [
    {label: '正则', value: 'regex'},
    {label: '精确', value: 'precise'}
]

const fieldOptions: FieldOption[] = [
    {label: "视频标题", value: "videoTitle"},
    {label: "视频tag", value: "videoTag"},
    {label: "视频简介", value: "videoDesc"}
]

const verifyCombinationRuleItem = (data: CombinationRuleData, ruleList: CombinationRuleItem[]): boolean => {
    const {title, tags = [], videoInfo} = data
    const {desc} = videoInfo
    if (ruleList.length === 0) {
        return false
    }
    for (let itemRule of ruleList) {
        const {key, value} = itemRule
        if (key === "videoTitle") {
            if (title.search(value) === -1) return false
        } else if (key === "videoDesc") {
            if (desc.search(value) === -1) return false
        } else if (key === "videoTag") {
            // 原先三个判断是并列的：标题/简介规则命中后仍会继续走 tag 校验，
            // 于是「标题正则」永远要求标题同时是视频 tag，规则实际不生效。
            const valueTag = value.split(',').filter(str => str.trim() !== '').map(str => str.trim())
            if (!arrUtil.arrayContains(tags, valueTag)) return false
        } else {
            // 未知字段（旧数据或手改配置）不能当成命中，否则该方案会误屏蔽
            return false
        }
    }
    return true
}

const blockCombinationRulePlan = (data: CombinationRuleData): BlockResult => {
    const listGm = localMKData.getCombinationRuleListGm();
    if (listGm.length === 0) return returnTempVal
    for (let planItemRule of listGm) {
        if (!planItemRule.status) continue
        if (verifyCombinationRuleItem(data, planItemRule.ruleList)) {
            return {state: true, type: "组合规则", matching: planItemRule.name}
        }
    }
    return returnTempVal
}

export default {
    matchModeOptions, fieldOptions,
    async asyncBlockCombinationRulePlan(data: CombinationRuleData): Promise<void> {
        const res = blockCombinationRulePlan(data);
        if (res.state) {
            return Promise.reject(res)
        }
    }
}
