<script setup lang="ts">
import {ref, watch} from 'vue';
import localMKData, {
  getLimitationVideoSubmitSumGm,
  isCommentDisabledVideosBlockedGm,
  isFollowers7DaysOnlyVideosBlockedGm,
  isLimitationVideoSubmitStatusGm,
  isSeniorMemberOnly,
  isVideosInFeaturedCommentsBlockedGm
} from "../../../state/localMKData.ts";
import uidRangeMaskingView from "../shield/uidRangeMaskingView.vue";
import SettingRow from '../../components/SettingRow.vue';
import SettingGroup from '../../components/SettingGroup.vue';

/**
 * 高级规则
 */
const isLimitationVideoSubmitStatusVal = ref(isLimitationVideoSubmitStatusGm());
const LimitationContributeVal = ref(getLimitationVideoSubmitSumGm());
const blockFollowed = ref(localMKData.isBlockFollowed());
const is_up_owner_exclusive = ref(localMKData.isUpOwnerExclusive());
const genderRadioVal = ref(localMKData.isGenderRadioVal());
const vipTypeRadioVal = ref(localMKData.isVipTypeRadioVal());
const is_senior_member_val = ref(localMKData.isSeniorMember());
const copyrightRadioVal = ref(localMKData.isCopyrightRadio());
const is_vertical_val = ref(localMKData.isBlockVerticalVideo());
const is_check_team_member = ref(localMKData.isCheckTeamMember());
const isSeniorMemberOnlyVal = ref(isSeniorMemberOnly());
const isVideosInFeaturedCommentsBlockedVal = ref(isVideosInFeaturedCommentsBlockedGm());
const isFollowers7DaysOnlyVideosBlockedVal = ref(isFollowers7DaysOnlyVideosBlockedGm());
const isCommentDisabledVideosBlockedVal = ref(isCommentDisabledVideosBlockedGm());

watch(blockFollowed, (n) => {
  GM_setValue('blockFollowed', n);
});
watch(is_up_owner_exclusive, (n) => {
  GM_setValue('is_up_owner_exclusive', n);
});
watch(genderRadioVal, (n) => {
  GM_setValue('genderRadioVal', n);
});
watch(vipTypeRadioVal, (n) => {
  GM_setValue('vipTypeRadioVal', n);
});
watch(is_senior_member_val, (n) => {
  GM_setValue('is_senior_member', n);
});
watch(copyrightRadioVal, (n) => {
  GM_setValue('copyrightRadioVal', n);
});
watch(is_vertical_val, (n) => {
  GM_setValue('blockVerticalVideo', n);
});
watch(is_check_team_member, (n) => {
  GM_setValue('checkTeamMember', n);
});
watch(isSeniorMemberOnlyVal, (n) => {
  GM_setValue('is_senior_member_only', n);
});
watch(LimitationContributeVal, (n) => {
  GM_setValue('limitation_video_submit_sum_gm', n);
});
watch(isLimitationVideoSubmitStatusVal, (n) => {
  GM_setValue('is_limitation_video_submit_status_gm', n);
});
watch(isVideosInFeaturedCommentsBlockedVal, (n) => {
  GM_setValue('is_videos_in_featured_comments_blocked_gm', n);
});
watch(isFollowers7DaysOnlyVideosBlockedVal, (n) => {
  GM_setValue('is_followers_7_days_only_videos_blocked_gm', n);
});
watch(isCommentDisabledVideosBlockedVal, (n) => {
  GM_setValue('is_comment_disabled_videos_blocked_gm', n);
});
</script>

<template>
  <SettingGroup description="闭区间：最小 ≤ uid ≤ 最大的用户会被屏蔽，修改后需点「设置」保存">
    <uidRangeMaskingView/>
  </SettingGroup>

  <SettingGroup title="作者与内容">
    <SettingRow description="视频作者的投稿数低于该值时屏蔽" label="投稿数屏蔽">
      <el-input-number v-model="LimitationContributeVal" :disabled="!isLimitationVideoSubmitStatusVal"
                       :min="0" class="gz-advanced__number" controls-position="right" size="small"/>
      <el-switch v-model="isLimitationVideoSubmitStatusVal" size="small"/>
    </SettingRow>
    <SettingRow description="选中的视频类型会被屏蔽，不处理则两种类型都放行" label="视频类型">
      <el-radio-group v-model="copyrightRadioVal" size="small">
        <el-radio-button value="原创">原创</el-radio-button>
        <el-radio-button value="转载">转载</el-radio-button>
        <el-radio-button value="不处理">不处理</el-radio-button>
      </el-radio-group>
    </SettingRow>
    <SettingRow label="屏蔽竖屏类视频">
      <el-switch v-model="is_vertical_val" size="small"/>
    </SettingRow>
    <SettingRow label="屏蔽已关注">
      <el-switch v-model="blockFollowed" size="small"/>
    </SettingRow>
    <SettingRow description="UP 主充电专属（付费）视频" label="屏蔽充电专属视频">
      <el-switch v-model="is_up_owner_exclusive" size="small"/>
    </SettingRow>
    <SettingRow description="硬核会员发布的视频" label="屏蔽硬核会员">
      <el-switch v-model="is_senior_member_val" size="small"/>
    </SettingRow>
  </SettingGroup>

  <SettingGroup
      description="任意一项启用都会额外请求 B 站接口，请酌情使用"
      title="需要额外请求的判定">
    <SettingRow description="视频评论区评论被 UP 主精选后对所有人可见" label="屏蔽精选评论区类视频">
      <el-switch v-model="isVideosInFeaturedCommentsBlockedVal" size="small"/>
    </SettingRow>
    <SettingRow description="评论区只有关注 UP 主满 7 天的人才能发言" label="屏蔽关注 7 天以上可评论类视频">
      <el-switch v-model="isFollowers7DaysOnlyVideosBlockedVal" size="small"/>
    </SettingRow>
    <SettingRow description="视频评论区输入框是禁止输入状态而非可输入类视频" label="屏蔽禁止评论类视频">
      <el-switch v-model="isCommentDisabledVideosBlockedVal" size="small"/>
    </SettingRow>
  </SettingGroup>

  <SettingGroup title="用户属性">
    <SettingRow description="命中该会员类型的用户会被屏蔽，不处理则不做限制" label="会员类型屏蔽">
      <el-radio-group v-model="vipTypeRadioVal" size="small">
        <el-radio-button value="无">无</el-radio-button>
        <el-radio-button value="月大会员">月大会员</el-radio-button>
        <el-radio-button value="年度及以上大会员">年度及以上</el-radio-button>
        <el-radio-button value="不处理">不处理</el-radio-button>
      </el-radio-group>
    </SettingRow>
    <SettingRow description="命中该性别的用户会被屏蔽，不处理则不做限制" label="性别屏蔽">
      <el-radio-group v-model="genderRadioVal" size="small">
        <el-radio-button value="男性">男性</el-radio-button>
        <el-radio-button value="女性">女性</el-radio-button>
        <el-radio-button value="保密">保密</el-radio-button>
        <el-radio-button value="不处理">不处理</el-radio-button>
      </el-radio-group>
    </SettingRow>
    <SettingRow description="作者本身未匹配上时，继续检查其创作团队中的其他成员" label="检查创作团队中成员">
      <el-switch v-model="is_check_team_member" size="small"/>
    </SettingRow>
  </SettingGroup>

  <SettingGroup title="评论">
    <SettingRow description="评论区只保留硬核会员的评论" label="仅看硬核会员">
      <el-switch v-model="isSeniorMemberOnlyVal" size="small"/>
    </SettingRow>
  </SettingGroup>
</template>

<style scoped>
.gz-advanced__number {
  width: 92px;
}
</style>
