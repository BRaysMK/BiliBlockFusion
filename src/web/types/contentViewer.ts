/**
 * 「查看内容」抽屉的编辑上下文
 *
 * 同一个抽屉有两类调用方：规则页要看的是某个规则键（可编辑、可回写），
 * 缓存页要看的是视频信息导出的 JSON（只读，没有对应存储键）。
 * 只有带上 ruleKey 时才允许进入编辑态。
 */
export interface ContentEditContext {
    /** GM 存储键；存在即表示这份内容可以保存回该键 */
    ruleKey: string
    /** 规则中文名，用于提示与确认文案 */
    ruleName: string
    /** 该规则键的值必须是数字（uid / 房间号这类） */
    integer?: boolean
    /** 该规则键的值是 string[][]（组合匹配） */
    combination?: boolean
}
