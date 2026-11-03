import type {AiSettingSpec, AiRuleValueType} from "../types/aiRule.ts";

/**
 * AI 规则接口的配置项注册表
 *
 * 只收「影响屏蔽行为」的设置，不收录面板外观、兼容、调试类开关：
 * 清单越长，AI 越容易挑错项，也越容易顺手改掉与需求无关的配置。
 */

/** 屏蔽相关的开关与阈值，键名与 GM 存储一致 */
export const AI_SETTING_SPECS: AiSettingSpec[] = [
    // —— 比率阈值（0–1，按百分比计算）——
    {
        key: 'video_like_rate', label: '视频点赞率阈值', type: 'number', default: 0.05, min: 0, max: 1,
        description: '点赞率 = 点赞数 / 播放量。低于或等于该值屏蔽，0.05 表示 5%'
    },
    {
        key: 'video_like_rate_blocking_status', label: '启用点赞率屏蔽', type: 'boolean', default: false,
        description: '点赞率屏蔽的总开关'
    },
    {
        key: 'interactive_rate', label: '视频互动率阈值', type: 'number', default: 0.05, min: 0, max: 1,
        description: '互动率 = (弹幕数 + 评论数) / 播放量。低于或等于该值屏蔽'
    },
    {
        key: 'interactive_rate_blocking_status', label: '启用互动率屏蔽', type: 'boolean', default: false,
        description: '互动率屏蔽的总开关'
    },
    {
        key: 'triple_rate', label: '视频三连率阈值', type: 'number', default: 0.05, min: 0, max: 1,
        description: '三连率 = (收藏数 + 投币数 + 分享数) / 播放量。低于或等于该值屏蔽'
    },
    {
        key: 'triple_rate_blocking_status', label: '启用三连率屏蔽', type: 'boolean', default: false,
        description: '三连率屏蔽的总开关'
    },
    {
        key: 'coin_likes_ratio_rate', label: '投币/点赞比阈值', type: 'number', default: 0.05, min: 0, max: 1,
        description: '投币/点赞比 = 投币数 / 点赞数。低于或等于该值屏蔽，比值越高通常内容越优质'
    },
    {
        key: 'coin_likes_ratio_rate_blocking_status', label: '启用投币/点赞比屏蔽', type: 'boolean', default: false,
        description: '投币/点赞比屏蔽的总开关'
    },

    // —— 播放量 / 弹幕量 / 时长 ——
    {
        key: 'minimum_play_gm', label: '最小播放量', type: 'number', default: 100, min: 0, integer: true,
        description: '播放量低于该值屏蔽，需同时打开启用开关'
    },
    {
        key: 'is_minimum_play_gm', label: '启用最小播放量', type: 'boolean', default: false,
        description: '最小播放量限制的开关'
    },
    {
        key: 'maximum_play_gm', label: '最大播放量', type: 'number', default: 10000, min: 0, integer: true,
        description: '播放量高于该值屏蔽，需同时打开启用开关'
    },
    {
        key: 'is_maximum_play_gm', label: '启用最大播放量', type: 'boolean', default: false,
        description: '最大播放量限制的开关'
    },
    {
        key: 'minimum_barrage_gm', label: '最小弹幕量', type: 'number', default: 20, min: 0, integer: true,
        description: '弹幕数低于该值屏蔽'
    },
    {
        key: 'is_minimum_barrage_gm', label: '启用最小弹幕量', type: 'boolean', default: false,
        description: '最小弹幕量限制的开关'
    },
    {
        key: 'maximum_barrage_gm', label: '最大弹幕量', type: 'number', default: 1000, min: 0, integer: true,
        description: '弹幕数高于该值屏蔽'
    },
    {
        key: 'is_maximum_barrage_gm', label: '启用最大弹幕量', type: 'boolean', default: false,
        description: '最大弹幕量限制的开关'
    },
    {
        key: 'minimum_duration_gm', label: '最小时长(秒)', type: 'number', default: 30, min: 0, integer: true,
        description: '视频时长低于该秒数屏蔽'
    },
    {
        key: 'is_minimum_duration_gm', label: '启用最小时长', type: 'boolean', default: false,
        description: '最小时长限制的开关'
    },
    {
        key: 'maximum_duration_gm', label: '最大时长(秒)', type: 'number', default: 3000, min: 0, integer: true,
        description: '视频时长高于该秒数屏蔽'
    },
    {
        key: 'is_maximum_duration_gm', label: '启用最大时长', type: 'boolean', default: false,
        description: '最大时长限制的开关'
    },

    // —— 用户等级（0–7）——
    {
        key: 'minimum_user_level_video_gm', label: '视频最小用户等级', type: 'number', default: 0, min: 0, max: 7, integer: true,
        description: '视频作者的等级低于该值屏蔽'
    },
    {
        key: 'is_enable_minimum_user_level_video_gm', label: '启用视频最小等级', type: 'boolean', default: false,
        description: '视频最小用户等级限制的开关'
    },
    {
        key: 'maximum_user_level_video_gm', label: '视频最大用户等级', type: 'number', default: 1, min: 0, max: 7, integer: true,
        description: '视频作者的等级高于该值屏蔽'
    },
    {
        key: 'is_enable_maximum_user_level_video_gm', label: '启用视频最大等级', type: 'boolean', default: false,
        description: '视频最大用户等级限制的开关'
    },
    {
        key: 'minimum_user_level_comment_gm', label: '评论最小用户等级', type: 'number', default: 0, min: 0, max: 7, integer: true,
        description: '评论者的等级低于该值屏蔽'
    },
    {
        key: 'is_enable_minimum_user_level_comment_gm', label: '启用评论最小等级', type: 'boolean', default: false,
        description: '评论最小用户等级限制的开关'
    },
    {
        key: 'maximum_user_level_comment_gm', label: '评论最大用户等级', type: 'number', default: 0, min: 0, max: 7, integer: true,
        description: '评论者的等级高于该值屏蔽'
    },
    {
        key: 'is_enable_maximum_user_level_comment_gm', label: '启用评论最大等级', type: 'boolean', default: false,
        description: '评论最大用户等级限制的开关'
    },

    // —— 粉丝数 / 投稿数 ——
    {
        key: 'limitation_fan_sum_gm', label: '粉丝数上限', type: 'number', default: -1, min: -1, integer: true,
        description: '视频作者粉丝数低于或等于该值时屏蔽。-1 表示不做限制'
    },
    {
        key: 'is_fans_num_blocking_status_gm', label: '启用粉丝数屏蔽', type: 'boolean', default: false,
        description: '粉丝数屏蔽的开关'
    },
    {
        key: 'limitation_video_submit_sum_gm', label: '投稿数下限', type: 'number', default: 0, min: 0, integer: true,
        description: '视频作者投稿数低于该值时屏蔽'
    },
    {
        key: 'is_limitation_video_submit_status_gm', label: '启用投稿数屏蔽', type: 'boolean', default: false,
        description: '投稿数屏蔽的开关'
    },

    // —— 范围 ——
    {
        key: 'uid_range_masking', label: 'UID 范围', type: 'numberRange', default: [0, 100],
        description: '闭区间 [最小, 最大]，uid 落在区间内屏蔽'
    },
    {
        key: 'uid_range_masking_status', label: '启用 UID 范围屏蔽', type: 'boolean', default: false,
        description: 'UID 范围屏蔽的开关'
    },
    {
        key: 'time_range_masking', label: '时间范围', type: 'timeRanges', default: [],
        description: '按视频发布时间屏蔽。每项 {"status":布尔,"r":[开始毫秒,结束毫秒]}，落在任一启用范围内即屏蔽'
    },
    {
        key: 'time_range_masking_status', label: '启用时间范围屏蔽', type: 'boolean', default: false,
        description: '时间范围屏蔽的总开关'
    },

    // —— 枚举 ——
    {
        key: 'shield_mode', label: '视频屏蔽方式', type: 'enum', default: 'remove',
        options: ['remove', 'overlay', 'hide'],
        description: 'remove=卡片直接消失，后续内容顶上；overlay=保留卡片位置盖上遮罩；hide=不可见但留空'
    },
    {
        key: 'genderRadioVal', label: '性别屏蔽', type: 'enum', default: '不处理',
        options: ['男性', '女性', '保密', '不处理'],
        description: '屏蔽该性别作者的视频，不处理表示不按性别屏蔽'
    },
    {
        key: 'vipTypeRadioVal', label: '会员类型屏蔽', type: 'enum', default: '不处理',
        options: ['无', '月大会员', '年度及以上大会员', '不处理'],
        description: '屏蔽该会员类型的作者，不处理表示不按会员类型屏蔽'
    },
    {
        key: 'copyrightRadioVal', label: '视频类型屏蔽', type: 'enum', default: '不处理',
        options: ['原创', '转载', '不处理'],
        description: '屏蔽该类型的视频，不处理表示不按类型屏蔽'
    },
    {
        key: 'overlay_only_type', label: '遮罩仅显示屏蔽类型', type: 'boolean', default: false,
        description: '仅 shield_mode 为 overlay 时有效。开启后遮罩上只写屏蔽类型，不写具体匹配词'
    },

    // —— 其他判定开关 ——
    {
        key: 'blockVerticalVideo', label: '屏蔽竖屏视频', type: 'boolean', default: false,
        description: '屏蔽竖屏（手机拍摄）类视频'
    },
    {
        key: 'blockFollowed', label: '屏蔽已关注', type: 'boolean', default: false,
        description: '屏蔽自己已关注的 UP 主的视频'
    },
    {
        key: 'is_up_owner_exclusive', label: '屏蔽充电专属', type: 'boolean', default: false,
        description: '屏蔽充电专属视频'
    },
    {
        key: 'is_senior_member', label: '屏蔽硬核会员', type: 'boolean', default: false,
        description: '屏蔽作者是硬核会员的视频'
    },
    {
        key: 'is_senior_member_only', label: '评论仅看硬核会员', type: 'boolean', default: false,
        description: '只保留硬核会员的评论'
    },
    {
        key: 'combination_rule_list_gm', label: '组合规则方案', type: 'combinationRules', default: [],
        description: '一个方案内所有规则都命中才算命中。每项 {"status":布尔,"name":字符串,"ruleList":[{"key":"videoTitle|videoTag|videoDesc","mode":"regex|precise","value":字符串}]}。视频标题/简介按正则匹配，视频tag 多个值用英文逗号分隔且需全部命中'
    },
];

/**
 * 规则键的中文说明覆盖表。
 *
 * 大多数键名直接取自 ruleKeyListDataJson.json 的 name；这里只补那些
 * 只看名字不知道「作用于什么内容、怎么匹配」的键。不改那个共享 JSON——
 * 它还被规则管理 UI 的级联选择器使用。
 */
export const AI_RULE_DESCRIPTIONS: Record<string, string> = {
    name: '视频/评论作者的用户名，包含即命中',
    precise_name: '视频/评论作者的用户名，整值相同才命中',
    nameCanonical: '视频/评论作者的用户名，按 JS 正则 search 匹配',
    precise_uid: '作者 uid，整值相同才命中。最可靠的屏蔽方式，用户名随时可改',
    precise_uid_white: '白名单 uid：即使命中其他规则也放行',
    title: '视频标题，包含即命中',
    titleCanonical: '视频标题，按正则匹配',
    liveTitle: '直播间标题，包含即命中',
    liveTitleCanonical: '直播间标题，按正则匹配',
    'precise_live_uid': '直播间主播的 uid',
    commentOn: '评论内容，包含即命中',
    commentOnCanonical: '评论内容，按正则匹配',
    precise_fanCard: '直播粉丝牌名称，整值相同才命中',
    dynamic: '动态正文，包含即命中',
    dynamicCanonical: '动态正文，按正则匹配',
    dynamic_video: '动态里附带的视频标题/描述关键词',
    dynamic_videoCanonical: '动态里附带的视频标题/描述，按正则匹配',
    precise_tag: '动态话题 tag，整值相同才命中',
    tag: '动态话题 tag，包含即命中',
    tagCanonical: '动态话题 tag，按正则匹配',
    precise_partition: '直播分区名称，整值相同才命中',
    precise_liveRoomId: '直播间房间号，整值相同才命中',
    liveBarrage: '直播弹幕内容，包含即命中',
    liveBarrageCanonical: '直播弹幕内容，按正则匹配',
    videoBarrage: '视频弹幕内容，包含即命中',
    videoBarrageCanonical: '视频弹幕内容，按正则匹配',
    videoTag: '视频 tag，包含即命中',
    precise_videoTag: '视频 tag，整值相同才命中',
    videoTagCanonical: '视频 tag，按正则匹配',
    videoTag_preciseCombination: '多维数组，内层每个 tag 都出现在视频 tag 里才屏蔽。例：[["原神","攻略"]]',
    videoTag_combination_white: '白名单组合 tag，内层 tag 全部命中时放行（优先于屏蔽）',
    hotSearchKey: '搜索框热搜词，包含即命中',
    hotSearchKeyCanonical: '搜索框热搜词，按正则匹配',
    precise_avatarPendantName: '头像挂件名称，整值相同才命中（目前仅视频）',
    avatarPendantName: '头像挂件名称，包含即命中（目前仅视频）',
    signature: '用户个性签名，包含即命中',
    signatureCanonical: '用户个性签名，按正则匹配',
    videoDesc: '视频简介，包含即命中',
    videoDescCanonical: '视频简介，按正则匹配',
    precise_video_bv: '视频 BV 号，整值相同才命中',
    argue_msg: '视频的争议警告提示文字，包含即命中',
    argue_msg_precise: '视频的争议警告提示文字，整值相同才命中',
    precise_decoration_id: '评论区用户装扮 id（仅在评论区生效）',
    precise_decoration_collection_id: '评论区用户装扮收藏集 id（仅在评论区生效）',
};

/** 由键名后缀推断匹配方式与值类型 */
export const resolveRuleValueType = (key: string, type: string | undefined, name: string): AiRuleValueType => {
    if (type === 'int') return 'number[]';
    if (key === 'videoTag_preciseCombination' || key === 'videoTag_combination_white') return 'string[][]';
    if (name.includes('(组合匹配)')) return 'string[][]';
    return 'string[]';
};
