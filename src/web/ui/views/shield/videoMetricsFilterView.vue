<script setup lang="ts">
import {ref, watch} from 'vue';
import {getLimitationFanSumGm, isFansNumBlockingStatusGm} from "@/state/localMKData.ts";
import VideoMetricsFilterItem from '../../components/videoMetricsFilterItem.vue';
import SettingRow from '../../components/SettingRow.vue';
import SettingGroup from '../../components/SettingGroup.vue';

/**
 * 视频指标过滤页面
 */
// 说明写成「分子 / 分母」，用户在 ⓘ 气泡里能立刻对上 B 站卡片上的数字
const metricsFilterList = [
  {
    headerTitle: '点赞率',
    describe: '点赞率 = 点赞数 / 播放量 × 100%，低于或等于阈值时屏蔽',
    mkRateStatusKey: 'video_like_rate_blocking_status',
    mkTypeRateKey: 'video_like_rate'
  },
  {
    headerTitle: '互动率',
    describe: '互动率 = (弹幕数 + 评论数) / 播放量 × 100%，低于或等于阈值时屏蔽',
    mkRateStatusKey: 'interactive_rate_blocking_status',
    mkTypeRateKey: 'interactive_rate'
  },
  {
    headerTitle: '三连率',
    describe: '三连率 = (收藏数 + 投币数 + 分享数) / 播放量 × 100%，低于或等于阈值时屏蔽',
    mkRateStatusKey: 'triple_rate_blocking_status',
    mkTypeRateKey: 'triple_rate'
  },
  {
    headerTitle: '投币/点赞比',
    describe: '投币/点赞比 = 投币数 / 点赞数 × 100%，低于或等于阈值时屏蔽。投币成本更高，比值越高通常内容越优质',
    mkRateStatusKey: 'coin_likes_ratio_rate_blocking_status',
    mkTypeRateKey: 'coin_likes_ratio_rate'
  }
];
const limitationFanSumVal = ref(getLimitationFanSumGm());
const fansNumBlockingStatus = ref(isFansNumBlockingStatusGm());

watch(limitationFanSumVal, (n) => {
  GM_setValue('limitation_fan_sum_gm', parseInt(String(n)));
});
watch(fansNumBlockingStatus, (n) => {
  GM_setValue('is_fans_num_blocking_status_gm', n);
});
</script>

<template>
  <SettingGroup description="改动实时生效" title="视频指标屏蔽">
    <VideoMetricsFilterItem v-for="item in metricsFilterList"
                            :key="item.mkTypeRateKey"
                            :describe="item.describe"
                            :header-title="item.headerTitle"
                            :mk-rate-status-key="item.mkRateStatusKey"
                            :mk-type-rate-key="item.mkTypeRateKey"/>
    <SettingRow description="视频作者粉丝数小于或等于该值时屏蔽该视频，上限 9 万" label="粉丝数屏蔽">
      <el-input-number v-model="limitationFanSumVal"
                       :disabled="!fansNumBlockingStatus"
                       :max="90000"
                       :min="0"
                       :step="100"
                       class="gz-metrics-filter__fan-number"
                       controls-position="right"
                       size="small"/>
      <el-switch v-model="fansNumBlockingStatus" size="small"/>
    </SettingRow>
  </SettingGroup>
</template>

<style scoped>
.gz-metrics-filter__fan-number {
  width: 104px;
}
</style>
