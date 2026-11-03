/** AI 规则的配置项类型。规则键（44 个）与设置键（约 47 个）共用这一个枚举 */
export type AiSettingType =
    | 'boolean'
    | 'number'
    | 'enum'
    | 'numberRange'
    | 'timeRanges'
    | 'combinationRules';

/** 规则键的值形态：普通列表 / 数字列表 / 组合匹配（多 tag 同时命中） */
export type AiRuleValueType = 'string[]' | 'number[]' | 'string[][]';

/** 设置项注册表条目 */
export interface AiSettingSpec {
    key: string;
    label: string;
    description: string;
    type: AiSettingType;
    default: unknown;
    /** number 类型的取值范围与整数约束 */
    min?: number;
    max?: number;
    integer?: boolean;
    /** enum 的可选值 */
    options?: string[];
    /** 改动后是否要刷新页面才完全生效 */
    requiresReload?: boolean;
}

/** AI 回填的载荷。add/remove 只对规则键合法，set 对两者都合法 */
export interface AiRulePayload {
    version: number;
    add?: Record<string, unknown>;
    remove?: Record<string, unknown>;
    set?: Record<string, unknown>;
}

/** 预览表中的一行 */
export interface AiRuleChange {
    /** 语义化操作名，仅用于展示 */
    action: '新增' | '移除' | '覆盖' | '设置';
    key: string;
    /** 配置项中文名 */
    label: string;
    before: unknown;
    after: unknown;
    /** 该条变更是否会造成 GM 中的值变化 */
    effective: boolean;
    actionsReload?: boolean;
}

/** 校验/预览结果 */
export interface AiRulePlan {
    changes: AiRuleChange[];
    errors: string[];
    warnings: string[];
    /** 应用后是否需要刷新页面 */
    needsReload: boolean;
}

/** 应用前写入的备份，供撤销使用 */
export interface AiRuleBackup {
    at: string;
    changes: Array<{key: string; before: unknown; after: unknown}>;
}
