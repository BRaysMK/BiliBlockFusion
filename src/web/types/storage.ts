/** 时间范围屏蔽项，r 为毫秒级时间戳起止范围 */
export interface TimeRangeMaskingItem {
    status: boolean
    r: [number, number]
}

/** 排除 URL 配置项 */
export interface ExcludeURLItem {
    state: boolean
    /** URL 匹配正则表达式字符串 */
    regularURL: string
    desc: string
}

/** 荣耀等级图标映射：level → 图标 URL */
export interface GloryLevelMappingItem {
    level: number
    src: string
}

/** 荣耀等级限制规则，roomId 为 0 表示全局配置 */
export interface GloryLevelLimitItem {
    roomId: number | string
    /** 限制的荣耀等级阈值 */
    limitLevel: number
    status: boolean
}

/** 粉丝牌等级限制规则 */
export interface FansLevelLimitItem {
    name: string
    limitLevel: number
    status: boolean
}

/** 组合规则中的单条子规则 */
export interface CombinationRuleItem {
    /** 匹配字段：videoTitle / videoTag / videoDesc */
    key: string
    /** 匹配模式，目前仅占位未参与判定 */
    mode: string
    value: string
}

/** 组合规则方案 */
export interface CombinationRuleListItem {
    status: boolean
    name: string
    ruleList: CombinationRuleItem[]
}
