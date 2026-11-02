<script setup lang="ts">
import {ref, watch} from 'vue';
import {getLimitationFanSumGm, isFansNumBlockingStatusGm} from "@/state/localMKData.ts";
import video_metrics_filter_item_view from '../../components/videoMetricsFilterItem.vue'
import CardSlider from "../../components/cardSlider.vue";

/**
 * 视频指标过滤页面
 */
// 描述统一成「公式 + 阈值判定」，不写默认值——默认值随用户上次设置变化，写死会误导
const metricsFilterList = [
  {
    headerTitle: '视频点赞率屏蔽',
    describe: '点赞率 = 点赞数 / 播放量 × 100%，低于或等于阈值时屏蔽',
    mkRateStatusKey: 'video_like_rate_blocking_status',
    mkTypeRateKey: 'video_like_rate'
  },
  {
    headerTitle: '视频互动率屏蔽',
    describe: '互动率 = (弹幕数 + 评论数) / 播放量 × 100%，低于或等于阈值时屏蔽',
    mkRateStatusKey: 'interactive_rate_blocking_status',
    mkTypeRateKey: 'interactive_rate'
  },
  {
    headerTitle: '视频三连率屏蔽',
    describe: '三连率 = (收藏数 + 投币数 + 分享数) / 播放量 × 100%，低于或等于阈值时屏蔽',
    mkRateStatusKey: 'triple_rate_blocking_status',
    mkTypeRateKey: 'triple_rate'
  },
  {
    headerTitle: '视频投币/点赞比（内容价值）屏蔽',
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
  <div>
    <el-card>
      <template #header>指标屏蔽(改动实时生效)</template>
      <video_metrics_filter_item_view v-for="item in metricsFilterList" :key="item.headerTitle"
                                      :describe="item.describe"
                                      :header-title="item.headerTitle"
                                      :mk-rate-status-key="item.mkRateStatusKey"
                                      :mk-type-rate-key="item.mkTypeRateKey"
      />
      <card_slider v-model="limitationFanSumVal" :max="90000"
                   v-model:switch-val="fansNumBlockingStatus">
        <template #header>粉丝数屏蔽</template>
        <template #describe>限制的粉丝数，小于或等于值限时制的屏蔽该视频，限制上限9万</template>
      </card_slider>
    </el-card>
  </div>
</template>
