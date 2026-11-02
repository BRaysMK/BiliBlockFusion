import type { BlockResult } from "./shielding"

/** 页面中提取的视频基本数据，用于快速同步屏蔽检查 */
export interface VideoData {
    title: string;
    /** up主 uid */
    uid?: number;
    name: string;
    /** 视频时长（秒） */
    nDuration?: number;
    nBulletChat?: number;
    nPlayCount?: number;
    bv?: string | null;
    /** 卡片 DOM 元素 */
    el: HTMLElement;

    [key: string]: any;
}

/** 通过 API 获取的视频详细信息，用于异步屏蔽链检查 */
export interface VideoShieldData {
    tags: string[];
    userInfo: {
        uid: number;
        name: string;
        follower: number;
        is_senior_member: boolean;
        mid?: any;
        current_level?: number;
        sex?: string;
        vip?: any;
        archive_count?: number;
        pendant?: any;
        sign?: string;
        following?: boolean;
        [key: string]: any;
    };
    videoInfo: {
        dimension?: any;
        /** 合作视频的创作团队成员，普通视频没有该字段 */
        staff?: Array<{mid: number; name: string}>;
        /** 1 原创、2 转载 */
        copyright?: number;
        is_upower_exclusive?: boolean;
        following?: boolean;
        like: number;
        view: number;
        danmaku: number;
        reply: number;
        favorite: number;
        coin: number;
        share: number;
        pubdate?: number;
        desc?: string;
        argue_msg?: string;
        [key: string]: any;
    };

    [key: string]: any;
}

/** 屏蔽视频元素事件数据 */
export interface ShieldVideoEventData {
    res: BlockResult;
    /** 调用方显式指定的屏蔽方式，目前只有 hide 会覆盖全局 shield_mode */
    method: string;
    videoData: VideoData;
}
