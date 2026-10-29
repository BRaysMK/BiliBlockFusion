/** 屏蔽检查结果 */
export interface BlockResult {
    /** 是否命中屏蔽规则 */
    state: boolean;
    /** 屏蔽类型名称，如「模糊标题」 */
    type?: string;
    /** 匹配到的具体值 */
    matching?: string | number | boolean;
    /** 附加说明消息 */
    msg?: string;
}

/** 屏蔽按钮相关数据 */
export interface BlockButtonData {
    data: {
        /** 插入位置的父元素 */
        insertionPositionEl: HTMLElement;
        /** 控制按钮显隐的主体元素 */
        explicitSubjectEl?: HTMLElement;
        cssMap?: Record<string, string>;
        cssText?: string;
        el?: HTMLElement;
        uid?: number;
        name?: string;
        bv?: string;
        title?: string;
        roomId?: number | string;
        decoratePic?: any;
        collectionActId?: number;
        dressUpId?: number;
        /** 按钮定位方向，如 ["right","bottom"] */
        position?: string[];
        userUrl?: string;
        [key: string]: any;
    };
    /** 返回最新数据，优先于 data */
    updateFunc?: (el: HTMLElement) => any;
    /** 屏蔽成功后回调（用于重新扫描列表） */
    maskingFunc?: () => void;
    mouseoverFun?: (buttonEl: HTMLElement) => void;
}

/** 精确 / 模糊 / 正则三级匹配的规则配置，三个 key 都为空即跳过该级 */
export interface ExactFuzzyMatchConfig {
    exactKey?: string;
    exactTypeName?: string;
    exactRuleArr?: (string | number)[];
    fuzzyKey?: string;
    fuzzyTypeName?: string;
    fuzzyRuleArr?: string[];
    regexKey?: string;
    regexTypeName?: string;
    regexRuleArr?: string[];
}

/** 视频分辨率维度 */
export interface Dimension {
    width: number;
    height: number;
}

/** 视频创作团队成员 */
export interface TeamMember {
    mid: number;
    name: string;
}

/** 时间范围屏蔽配置项 */
export interface TimeRangeItem {
    status: boolean;
    /** 13 位毫秒级时间戳 [起, 止] */
    r: [number, number];
}

/** 动态内容屏蔽的规则数组映射 */
export interface DynamicContentRuleArrMap {
    fuzzyRuleArr?: string[];
    regexRuleArr?: string[];
}
