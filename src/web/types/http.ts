/** 弹幕屏蔽规则 */
export interface BarrageRule {
    /** 0 文本、1 正则、2 屏蔽用户 */
    type: number
    filter: string
    ctime: number
}

/** 弹幕屏蔽词获取结果 */
export interface BarrageBlockingResult {
    state: boolean
    data?: any
    /** 过滤掉 type=2（屏蔽用户）后的规则列表 */
    list?: BarrageRule[]
    msg: string
}

/** 关注信息获取结果 */
export interface AttentionResult {
    state: boolean
    data?: any
    msg: string
    error?: any
}

/** 视频统计数据 */
export interface VideoStat {
    view: number
    danmaku: number
    reply: number
    favorite: number
    coin: number
    share: number
    like: number
}

/** B 站视频信息接口返回的视频详情 */
export interface VideoInfo {
    /** 合作成员，非合作视频没有此项 */
    staff?: any[]
    tname: string
    tname_v2: string
    desc: string
    pubdate: number
    ctime: number
    /** 1 原创、2 转载 */
    copyright: number
    is_upower_exclusive: boolean
    /** 时长（秒） */
    duration: number
    view: number
    danmaku: number
    reply: number
    favorite: number
    coin: number
    share: number
    participle: any
    dimension: any
    like: number
    argue_msg: string
}

/** B 站视频信息接口返回的用户详情 */
export interface UserInfo {
    follower: number
    friend: number
    like_num: number
    archive_count: number
    article_count: number
    Official: any
    official_verify: any
    vip: any
    uid: number
    name: string
    sex: string
    current_level: number
    pendant: any
    nameplate: any
    following: boolean
    sign: string
    is_senior_member: boolean
}

/** 视频信息接口的完整结果 */
export interface FetchVideoInfoResult {
    state: boolean
    msg: string
    data?: {
        videoInfo: VideoInfo
        userInfo: UserInfo
        tags: string[]
    }
}

/** 视频评论输入框描述结果 */
export interface ReplyBoxResult {
    state: boolean
    message: string
    /** 输入框提示文本，如「关注7天以上可评论」 */
    childText?: string
    disabled?: boolean
    e?: any
}
