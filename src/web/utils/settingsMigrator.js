/**
 * 设置迁移脚本 (Settings Migrator)
 *
 * 检测脚本A (tjxwork) 的旧设置并自动迁移到 BiliBlockFusion 的存储格式。
 * 只运行一次，迁移完成后设置标记。
 *
 * 迁移流程:
 *   1. 检测 GM_blockedParameter 是否存在
 *   2. 调用旧参数适配 (oldParameterAdaptation)
 *   3. 映射 blockedParameter 各字段到独立 GM 存储键
 *   4. 设置 migration_completed_v2 标记
 */

const MIGRATION_FLAG = 'migration_completed_v2';

/**
 * 旧参数格式适配 (移植自脚本A oldParameterAdaptation [L219])
 * 将 v1.0 之前的扁平键名转为带 _Switch / _UseRegular / _Array 的新结构
 */
function adaptOldParameters(obj) {
    if (Object.prototype.hasOwnProperty.call(obj, 'blockedTitleArray')) {
        obj['blockedTitle_Switch'] = true;
        obj['blockedTitle_UseRegular'] = true;
        obj['blockedTitle_Array'] = obj['blockedTitleArray'];
        delete obj['blockedTitleArray'];

        obj['blockedNameOrUid_Switch'] = true;
        obj['blockedNameOrUid_UseRegular'] = true;
        obj['blockedNameOrUid_Array'] = obj['blockedNameOrUidArray'];
        delete obj['blockedNameOrUidArray'];

        obj['blockedVideoPartitions_Switch'] = false;
        obj['blockedVideoPartitions_UseRegular'] = false;
        obj['blockedVideoPartitions_Array'] = [];

        obj['blockedTag_Switch'] = true;
        obj['blockedTag_UseRegular'] = true;
        obj['blockedTag_Array'] = obj['blockedTagArray'];
        delete obj['blockedTagArray'];

        obj['doubleBlockedTag_Switch'] = true;
        obj['doubleBlockedTag_UseRegular'] = true;
        obj['doubleBlockedTag_Array'] = obj['doubleBlockedTagArray'];
        delete obj['doubleBlockedTagArray'];

        obj['blockedShortDuration_Switch'] = true;

        obj['whitelistNameOrUid_Switch'] = false;
        obj['whitelistNameOrUid_Array'] = [];

        obj['hideVideoMode_Switch'] = obj['hideVideoModeSwitch'];
        delete obj['hideVideoModeSwitch'];

        obj['consoleOutputLog_Switch'] = obj['consoleOutputLogSwitch'];
        delete obj['consoleOutputLogSwitch'];
    }
    return obj;
}

/**
 * blockedParameter → 独立 GM 存储键 映射表
 */
const MIGRATION_MAP = [
    // [脚本A blockedParameter key, 目标 GM 存储键, 默认值]
    // 标题
    { from: 'blockedTitle_Switch', to: null, def: true },   // 无独立键，保留在 blockedParameter 中
    { from: 'blockedTitle_UseRegular', to: null, def: true },
    { from: 'blockedTitle_Array', to: 'title', def: [] },
    // UP主
    { from: 'blockedNameOrUid_Switch', to: null, def: true },
    { from: 'blockedNameOrUid_UseRegular', to: null, def: false },
    { from: 'blockedNameOrUid_Array', to: 'name', def: [] },
    // 标签
    { from: 'blockedTag_Switch', to: null, def: true },
    { from: 'blockedTag_UseRegular', to: null, def: true },
    { from: 'blockedTag_Array', to: 'videoTag', def: [] },
    // 双重标签
    { from: 'doubleBlockedTag_Switch', to: null, def: true },
    { from: 'doubleBlockedTag_UseRegular', to: null, def: true },
    { from: 'doubleBlockedTag_Array', to: 'videoTag_precise_combination', def: [] },
    // 视频分区
    { from: 'blockedVideoPartitions_Switch', to: 'block_video_partitions', def: false },
    { from: 'blockedVideoPartitions_UseRegular', to: null, def: false },
    { from: 'blockedVideoPartitions_Array', to: 'videoPartition', def: [] },
    // 置顶评论
    { from: 'blockedTopComment_Switch', to: null, def: false },
    { from: 'blockedTopComment_UseRegular', to: null, def: true },
    { from: 'blockedTopComment_Array', to: 'commentOn', def: [] },
    // UP主简介
    { from: 'blockedUpSigns_Switch', to: null, def: false },
    { from: 'blockedUpSigns_UseRegular', to: null, def: true },
    { from: 'blockedUpSigns_Array', to: 'signature', def: [] },
    // 白名单
    { from: 'whitelistNameOrUid_Switch', to: null, def: false },
    { from: 'whitelistNameOrUid_Array', to: 'precise_uid_white', def: [] },
    // 叠加层/隐藏模式
    { from: 'hideVideoMode_Switch', to: 'hide_video_mode', def: false },
    { from: 'blockedOverlayOnlyDisplaysType_Switch', to: 'overlay_only_type', def: false },
    // 非视频元素
    { from: 'hideNonVideoElements_Switch', to: 'hide_non_video_elements', def: true },
    // 热搜
    { from: 'hideTrending_Switch', to: 'block_trending', def: false },
    { from: 'blockedTrendingItem_Switch', to: null, def: false },
    { from: 'blockedTrendingItem_UseRegular', to: 'trending_use_regex', def: true },
    { from: 'blockedTrendingItem_Array', to: 'blocked_trending_items', def: [] },
    { from: 'blockedTrendingItemByTitleTag_Switch', to: null, def: false },
    // 数值阈值
    { from: 'blockedShortDuration', to: 'minimum_duration_gm', def: 0 },
    { from: 'blockedBelowVideoViews', to: 'minimum_play_gm', def: 0 },
    { from: 'blockedBelowLikesRate', to: 'video_like_rate', def: 0 },
    { from: 'blockedBelowCoinRate', to: null, def: 0 },
    { from: 'blockedAboveFavoriteCoinRatio', to: 'favorite_coin_ratio', def: 10 },
    { from: 'blockedBelowUpLevel', to: 'minimum_user_level_video_gm', def: 0 },
    { from: 'blockedBelowUpFans', to: 'limitation_fan_sum_gm', def: 0 },
    // 开关
    { from: 'blockedShortDuration_Switch', to: 'is_minimum_duration_gm', def: false },
    { from: 'blockedBelowVideoViews_Switch', to: 'is_minimum_play_gm', def: false },
    { from: 'blockedBelowLikesRate_Switch', to: 'video_like_rate_blocking_status', def: false },
    { from: 'blockedBelowCoinRate_Switch', to: null, def: false },
    { from: 'blockedAboveFavoriteCoinRatio_Switch', to: 'favorite_coin_ratio_blocking', def: false },
    { from: 'blockedBelowUpLevel_Switch', to: 'is_enable_minimum_user_level_video_gm', def: false },
    { from: 'blockedBelowUpFans_Switch', to: 'is_fans_num_blocking_status_gm', def: false },
    { from: 'blockedPortraitVideo_Switch', to: 'blockVerticalVideo', def: false },
    { from: 'blockedChargingExclusive_Switch', to: 'is_up_owner_exclusive', def: false },
    { from: 'blockedFilteredCommentsVideo_Switch', to: 'is_videos_in_featured_comments_blocked_gm', def: false },
    // 其他
    { from: 'consoleOutputLog_Switch', to: 'console_output_log', def: false },
    { from: 'hideBlockedWordsInMenu_Switch', to: 'hide_blocked_words', def: false },
];

/**
 * 主迁移函数
 */
function runMigration() {
    // 已迁移则跳过
    if (GM_getValue(MIGRATION_FLAG, false)) return;

    const blockedParameter = GM_getValue('GM_blockedParameter', null);
    if (!blockedParameter) {
        // 无旧数据，标记完成
        GM_setValue(MIGRATION_FLAG, true);
        return;
    }

    // 旧参数适配
    adaptOldParameters(blockedParameter);

    let migratedCount = 0;

    for (const entry of MIGRATION_MAP) {
        const { from, to, def } = entry;
        if (to === null) continue;  // 不需要独立存储的项

        const val = blockedParameter[from];
        if (val !== undefined && val !== null) {
            // 避免覆盖已有设置
            const existing = GM_getValue(to, undefined);
            if (existing === undefined || existing === def) {
                GM_setValue(to, val);
                migratedCount++;
            }
        }
    }

    // 标记迁移完成
    GM_setValue(MIGRATION_FLAG, true);
    console.log(`[BiliBlockFusion] 设置迁移完成，共迁移 ${migratedCount} 项设置。`);
}

// 自动执行
runMigration();

export { runMigration, MIGRATION_FLAG };
export default { runMigration };
