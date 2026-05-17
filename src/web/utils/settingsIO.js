/**
 * 设置导出/导入工具 (移植自脚本A exportButton/importButton [L1107-L1183])
 *
 * 提供 JSON 格式的完整设置导出和导入功能
 */

/**
 * 导出所有相关设置为 JSON 文件
 */
function exportSettings() {
    try {
        // 收集所有 BiliBlockFusion 相关存储键
        const exportData = {};

        // 脚本B 核心设置键列表
        const keysB = [
            'title', 'titleCanonical', 'name', 'nameCanonical', 'precise_name',
            'videoTag', 'precise_videoTag', 'videoTagCanonical', 'videoTag_precise_combination',
            'precise_uid', 'precise_uid_white', 'commentOn', 'commentOnCanonical',
            'signature', 'signatureCanonical', 'videoDesc', 'videoDescCanonical',
            'dynamic', 'dynamicCanonical', 'dynamic_video', 'dynamic_videoCanonical',
            'precise_avatarPendantName', 'avatarPendantName', 'precise_decoration_id',
            'precise_decoration_collection_id',
            'argue_msg', 'argue_msg_precise',
            'videoPartition', 'videoPartitionCanonical',
        ];

        // 脚本B 开关/数值键列表
        const settingKeysB = [
            'blockVerticalVideo', 'is_up_owner_exclusive', 'blockFollowed',
            'genderRadioVal', 'vipTypeRadioVal', 'is_senior_member',
            'copyrightRadioVal', 'is_senior_member_only',
            'video_like_rate', 'video_like_rate_blocking_status',
            'coin_likes_ratio_rate', 'coin_likes_ratio_rate_blocking_status',
            'interactive_rate', 'interactive_rate_blocking_status',
            'triple_rate', 'triple_rate_blocking_status',
            'minimum_play_gm', 'is_minimum_play_gm', 'maximum_play_gm', 'is_maximum_play_gm',
            'minimum_barrage_gm', 'is_minimum_barrage_gm', 'maximum_barrage_gm', 'is_maximum_barrage_gm',
            'minimum_duration_gm', 'is_minimum_duration_gm', 'maximum_duration_gm', 'is_maximum_duration_gm',
            'minimum_user_level_video_gm', 'is_enable_minimum_user_level_video_gm',
            'maximum_user_level_video_gm', 'is_enable_maximum_user_level_video_gm',
            'minimum_user_level_comment_gm', 'is_enable_minimum_user_level_comment_gm',
            'maximum_user_level_comment_gm', 'is_enable_maximum_user_level_comment_gm',
            'is_fans_num_blocking_status_gm', 'limitation_fan_sum_gm',
            'is_limitation_video_submit_status_gm', 'limitation_video_submit_sum_gm',
            'uid_range_masking', 'uid_range_masking_status',
            'time_range_masking', 'time_range_masking_status',
            'is_videos_in_featured_comments_blocked_gm',
            'is_followers_7_days_only_videos_blocked_gm',
            'is_comment_disabled_videos_blocked_gm',
            'favorite_coin_ratio', 'favorite_coin_ratio_blocking',
            'block_video_partitions',
            'overlay_mode', 'hide_video_mode', 'overlay_only_type',
            'hide_non_video_elements', 'block_trending', 'blocked_trending_items',
            'trending_use_regex', 'hide_blocked_words', 'console_output_log',
            'substitute_words', 'enable_replacement_processing',
            'is_hide_hot_searches_panel_gm', 'is_hide_search_history_panel_gm',
            'is_hide_carousel_image_gm', 'is_hide_home_top_header_banner_image_gm',
            'is_hide_home_top_header_channel_gm',
        ];

        // 读取脚本B 规则数组
        for (const key of keysB) {
            const val = GM_getValue(key, null);
            if (val !== null && val !== undefined) {
                exportData[key] = val;
            }
        }

        // 读取脚本B 设置值
        for (const key of settingKeysB) {
            exportData[key] = GM_getValue(key, undefined);
        }

        // 保留脚本A 的 blockedParameter (如果存在)
        const blockedParam = GM_getValue('GM_blockedParameter', null);
        if (blockedParam) {
            exportData['GM_blockedParameter'] = blockedParam;
        }

        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `BiliBlockFusion_Config_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        return { success: true, message: '设置导出成功' };
    } catch (error) {
        console.error('导出设置时出错:', error);
        return { success: false, message: '导出失败: ' + error.message };
    }
}

/**
 * 触发文件选择器导入设置
 * @returns {Promise<{success: boolean, message: string}>}
 */
function importSettings() {
    return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';

        input.onchange = async (event) => {
            const file = event.target.files[0];
            if (!file) {
                resolve({ success: false, message: '未选择文件' });
                return;
            }

            try {
                const fileContent = await new Promise((res, rej) => {
                    const reader = new FileReader();
                    reader.onload = (e) => res(e.target.result);
                    reader.onerror = (e) => rej(e.target.error);
                    reader.readAsText(file);
                });

                const importedData = JSON.parse(fileContent);
                if (!importedData || typeof importedData !== 'object') {
                    throw new Error('无效的配置文件格式');
                }

                let count = 0;
                for (const [key, value] of Object.entries(importedData)) {
                    if (key === 'GM_blockedParameter') {
                        GM_setValue(key, value);
                        count++;
                        continue;
                    }
                    GM_setValue(key, value);
                    count++;
                }

                resolve({ success: true, message: `成功导入 ${count} 项设置，请刷新页面生效` });
            } catch (error) {
                console.error('导入设置时出错:', error);
                resolve({ success: false, message: '导入失败: 文件格式错误' });
            }
        };

        input.click();
    });
}

export { exportSettings, importSettings };
export default { exportSettings, importSettings };
