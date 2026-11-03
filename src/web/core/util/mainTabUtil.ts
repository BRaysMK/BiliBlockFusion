/** 主面板顶层页签名 */
export const MAIN_TABS = ['规则', '页面', 'AI 规则', '高级', '诊断与关于'] as const;

export type MainTabName = typeof MAIN_TABS[number];

/**
 * 旧页签名 → 新页签名。
 *
 * 页签从 8 个收敛到 5 个后，老用户 GM 里存的是旧名字。
 * 映射到最接近的新位置而不是重置到首页——用户下次打开还停在他熟悉的地方。
 */
const LEGACY_TAB_MAP: Record<string, MainTabName> = {
    '规则管理': '规则',
    '页面处理': '页面',
    '兼容设置': '页面',
    '排除页面': '页面',
    '面板设置': '高级',
    '条件限制': '高级',
    '诊断': '诊断与关于',
    '关于': '诊断与关于',
    '弹幕词管理': '诊断与关于',
};

/** 把 GM 里存的页签名规范化成当前可用的名字，无法识别时回落到「规则」 */
export const normalizeMainTabName = (value: unknown): MainTabName => {
    if (typeof value === 'string') {
        if ((MAIN_TABS as readonly string[]).includes(value)) return value as MainTabName;
        const mapped = LEGACY_TAB_MAP[value];
        if (mapped !== undefined) return mapped;
    }
    return '规则';
};

export default {MAIN_TABS, normalizeMainTabName};
