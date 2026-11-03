import type {RuleKeyItem} from '../../config/ruleKeyListData.ts'

/**
 * 规则键按「实体」归组
 *
 * 44 个规则键里有大量只是匹配方式不同的同体项（用户名(模糊/精确/正则匹配)、
 * 视频tag(模糊/精确/正则匹配)…）。平铺展示时每条都要重复一遍实体名，44 行里
 * 真正独立的信息只有 26 个实体，既长又难扫。这里剥掉匹配方式后缀做归组，
 * 匹配方式交给调用方用紧凑标签展示。
 */

/** 匹配方式后缀：`用户名(模糊匹配)` → 实体「用户名」+ 方式「模糊」 */
const MODE_SUFFIX = /\((模糊|精确|正则|组合)匹配\)$/

/** 匹配方式的固定展示顺序：同一位置永远是同一方式，便于纵向扫读 */
export const MODE_ORDER: readonly string[] = ['模糊', '精确', '正则', '组合']

export interface RuleModeEntry {
    /** GM 存储键 */
    key: string
    /** 匹配方式（模糊/精确/正则/组合），无法识别时为空串 */
    mode: string
    /** 原始完整名称，用于展示与检索 */
    label: string
}

export interface RuleGroup {
    /** 实体名，不含匹配方式后缀 */
    name: string
    entries: RuleModeEntry[]
}

const modeRank = (mode: string): number => {
    const index = MODE_ORDER.indexOf(mode)
    return index === -1 ? MODE_ORDER.length : index
}

/**
 * 把规则键清单按实体归组；组序与组内方式序都保持稳定，不随计数变化
 * @param items 规则键清单（ruleKeyListDataJson）
 */
export const groupRuleKeyList = (items: readonly RuleKeyItem[]): RuleGroup[] => {
    const groups = new Map<string, RuleModeEntry[]>()
    for (const item of items) {
        const matched = item.name.match(MODE_SUFFIX)
        const mode = matched === null ? '' : matched[1]
        const name = matched === null ? item.name : item.name.slice(0, item.name.length - matched[0].length)
        const entries = groups.get(name)
        if (entries === undefined) {
            groups.set(name, [{key: item.key, mode, label: item.name}])
        } else {
            entries.push({key: item.key, mode, label: item.name})
        }
    }
    return Array.from(groups, ([name, entries]) => ({
        name,
        entries: entries.sort((a, b) => modeRank(a.mode) - modeRank(b.mode)),
    }))
}

/** 把关键词归一化，用于大小写不敏感的子串匹配 */
const normalize = (text: string): string => text.trim().toLowerCase()

/**
 * 按关键词过滤分组：命中实体名或任一原始标签即保留
 * @param groups 分组结果
 * @param keyword 用户输入的关键词，空串表示不过滤
 */
export const filterRuleGroups = (groups: readonly RuleGroup[], keyword: string): RuleGroup[] => {
    const word = normalize(keyword)
    if (word === '') return groups.map(group => group)
    return groups
        .map(group => {
            if (normalize(group.name).includes(word)) return group
            const entries = group.entries.filter(entry => normalize(entry.label).includes(word))
            return entries.length === 0 ? null : {name: group.name, entries}
        })
        .filter((group): group is RuleGroup => group !== null)
}
