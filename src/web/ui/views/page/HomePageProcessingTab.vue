<script setup lang="ts">
import {computed, ref, watch} from 'vue'
import bilibiliHome from "../../../pages/home/bilibili.ts";
import {
  getHomeFeedLoadAttemptsGm,
  getReleaseTypeCardsGm,
  isHideCarouselImageGm,
  isHideHomeTopHeaderBannerImageGm,
  isHideHomeTopHeaderChannelGm,
  isHomeResponseRewriteGm,
  isOverlayOnlyTypeGm,
  getShieldModeGm
} from "@/state/localMKData.ts";
import cssManager from "../../../domain/cssManager.ts";
import SettingRow from '../../components/SettingRow.vue';
import SettingGroup from '../../components/SettingGroup.vue';

const isHideCarouselImageVal = ref(isHideCarouselImageGm());
const isHideHomeTopHeaderBannerImageVal = ref(isHideHomeTopHeaderBannerImageGm());
const isHideTopHeaderChannelVal = ref(isHideHomeTopHeaderChannelGm());
const homeFeedLoadAttemptsVal = ref(getHomeFeedLoadAttemptsGm());
const isHomeResponseRewriteVal = ref(isHomeResponseRewriteGm());
const releaseTypeCardVals = ref(getReleaseTypeCardsGm());
// 屏蔽方式：remove（默认，卡片消失、后续顶上）/ overlay（遮罩）/ hide（不可见但留空）
const shieldModeVal = ref(getShieldModeGm());
const isOverlayOnlyTypeVal = ref(isOverlayOnlyTypeGm());

/** 「叠加层仅显示屏蔽类型」只在叠加层模式下有意义 */
const overlayOnlyDisabled = computed(() => shieldModeVal.value !== 'overlay');

/** 放行卡片是这 9 类；选项写死在模板里，这里只定义取值，避免两处维护 */
const RELEASE_TYPE_OPTIONS = ['直播', '番剧', '电影', '国创', '综艺', '课堂', '电视剧', '纪录片', '漫画'];

watch(isHideCarouselImageVal, (n) => {
  GM_setValue('is_hide_carousel_image_gm', n);
  bilibiliHome.hideHomeCarouselImage(n, true);
});
watch(isHideHomeTopHeaderBannerImageVal, (n) => {
  GM_setValue('is_hide_home_top_header_banner_image_gm', n);
  bilibiliHome.hideHomeTopHeaderBannerImage(n);
});
watch(isHideTopHeaderChannelVal, (n) => {
  GM_setValue('is_hide_home_top_header_channel_gm', n);
  cssManager.hideHomeTopHeaderChannel(n);
});
watch(homeFeedLoadAttemptsVal, (n) => {
  const value = Number(n);
  GM_setValue('home_feed_load_attempts_gm', Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 3);
});
watch(isHomeResponseRewriteVal, (n) => {
  GM_setValue('is_home_response_rewrite_gm', n);
});
watch(releaseTypeCardVals, (n) => {
  GM_setValue('release_type_cards_gm', n);
});
watch(shieldModeVal, (n) => {
  GM_setValue('shield_mode', n);
});
watch(isOverlayOnlyTypeVal, (n) => {
  GM_setValue('overlay_only_type', n);
});
</script>

<template>
  <SettingGroup description="控制命中规则的视频卡片怎么处理，改动实时生效" title="屏蔽方式">
    <SettingRow description="移除：卡片消失、后续顶上；叠加层：保留卡片并盖遮罩；隐藏：不可见但仍占位"
                label="视频屏蔽方式">
      <el-radio-group v-model="shieldModeVal" size="small">
        <el-radio-button value="remove">移除</el-radio-button>
        <el-radio-button value="overlay">叠加层</el-radio-button>
        <el-radio-button value="hide">隐藏</el-radio-button>
      </el-radio-group>
    </SettingRow>
    <SettingRow description="遮罩上只显示屏蔽类型，不显示具体匹配到的词。仅在叠加层模式下生效"
                label="叠加层仅显示屏蔽类型">
      <el-switch v-model="isOverlayOnlyTypeVal" :disabled="overlayOnlyDisabled" size="small"/>
    </SettingRow>
  </SettingGroup>

  <SettingGroup title="首页">
    <SettingRow label="隐藏轮播图">
      <el-switch v-model="isHideCarouselImageVal" size="small"/>
    </SettingRow>
    <SettingRow label="隐藏顶部标题横幅图片">
      <el-switch v-model="isHideHomeTopHeaderBannerImageVal" size="small"/>
    </SettingRow>
    <SettingRow description="顶部站点频道导航，滚动后吸顶的那条也一并隐藏" label="隐藏顶部频道栏">
      <el-switch v-model="isHideTopHeaderChannelVal" size="small"/>
    </SettingRow>
    <SettingRow description="列表未填满视口时自动触发补载，这是连续尝试的次数上限。0 表示关闭" label="列表连续补载次数">
      <el-input-number v-model="homeFeedLoadAttemptsVal" :min="0" :step="1" class="gz-home__number"
                       controls-position="right" size="small"/>
    </SettingRow>
    <SettingRow description="在接口响应阶段就过滤推荐视频，未知结构仍走原流程。改动后需刷新首页" label="响应过滤推荐视频（实验）">
      <el-switch v-model="isHomeResponseRewriteVal" size="small"/>
    </SettingRow>
  </SettingGroup>

  <SettingGroup description="下列类型的卡片不会被屏蔽，即使它命中了规则" title="放行的卡片">
    <SettingRow stacked>
      <el-checkbox-group v-model="releaseTypeCardVals">
        <el-checkbox v-for="type in RELEASE_TYPE_OPTIONS" :key="type" :value="type">{{ type }}</el-checkbox>
      </el-checkbox-group>
    </SettingRow>
  </SettingGroup>
</template>

<style scoped>
.gz-home__number {
  width: 104px;
}
</style>
