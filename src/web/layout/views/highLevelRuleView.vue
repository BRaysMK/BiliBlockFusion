<script>
import localMKData, {
  getLimitationVideoSubmitSumGm,
  isCommentDisabledVideosBlockedGm,
  isFollowers7DaysOnlyVideosBlockedGm,
  isLimitationVideoSubmitStatusGm,
  isSeniorMemberOnly,
  isVideosInFeaturedCommentsBlockedGm
} from "../../data/localMKData.js";
import uidRangeMaskingView from "./uidRangeMaskingView.vue";

/**
 * 高级规则
 */
export default {
  components: {
    uidRangeMaskingView,
  },
  data() {
    return {
      isLimitationVideoSubmitStatusVal: isLimitationVideoSubmitStatusGm(),
      LimitationContributeVal: getLimitationVideoSubmitSumGm(),
      blockFollowed: localMKData.isBlockFollowed(),
      is_up_owner_exclusive: localMKData.isUpOwnerExclusive(),
      genderRadioVal: localMKData.isGenderRadioVal(),
      vipTypeRadioVal: localMKData.isVipTypeRadioVal(),
      is_senior_member_val: localMKData.isSeniorMember(),
      copyrightRadioVal: localMKData.isCopyrightRadio(),
      is_vertical_val: localMKData.isBlockVerticalVideo(),
      is_check_team_member: localMKData.isCheckTeamMember(),
      isSeniorMemberOnlyVal: isSeniorMemberOnly(),
      isVideosInFeaturedCommentsBlockedVal: isVideosInFeaturedCommentsBlockedGm(),
      isFollowers7DaysOnlyVideosBlockedVal: isFollowers7DaysOnlyVideosBlockedGm(),
      isCommentDisabledVideosBlockedVal: isCommentDisabledVideosBlockedGm()
    }
  },
  methods: {},
  watch: {
    blockFollowed(n) {
      GM_setValue('blockFollowed', n)
    },
    is_up_owner_exclusive(n) {
      GM_setValue('is_up_owner_exclusive', n)
    },
    genderRadioVal(n) {
      GM_setValue('genderRadioVal', n)
    },
    vipTypeRadioVal(n) {
      GM_setValue('vipTypeRadioVal', n)
    },
    is_senior_member_val(n) {
      GM_setValue('is_senior_member', n)
    },
    copyrightRadioVal(n) {
      GM_setValue('copyrightRadioVal', n)
    },
    is_vertical_val(n) {
      GM_setValue('blockVerticalVideo', n)
    },
    is_check_team_member(n) {
      GM_setValue('checkTeamMember', n)
    },
    isSeniorMemberOnlyVal(n) {
      GM_setValue('is_senior_member_only', n)
    },
    LimitationContributeVal(n) {
      GM_setValue('limitation_video_submit_sum_gm', n)
    },
    isLimitationVideoSubmitStatusVal(n) {
      GM_setValue('is_limitation_video_submit_status_gm', n)
    },
    isVideosInFeaturedCommentsBlockedVal(n) {
      GM_setValue('is_videos_in_featured_comments_blocked_gm', n)
    },
    isFollowers7DaysOnlyVideosBlockedVal(n) {
      GM_setValue('is_followers_7_days_only_videos_blocked_gm', n)
    },
    isCommentDisabledVideosBlockedVal(n) {
      GM_setValue('is_comment_disabled_videos_blocked_gm', n)
    }
  }
}
</script>

<template>
  <div>
    <uidRangeMaskingView/>
    <el-card>
      <template #header>投稿数屏蔽</template>
      <span style="color:#9499A0;font-size:13px;">用户投稿数低于该值时屏蔽</span>
      <div style="display:flex;align-items:center;gap:12px;margin-top:8px;">
        <el-switch v-model="isLimitationVideoSubmitStatusVal" active-text="启用"/>
        <el-input-number v-model="LimitationContributeVal" :min="0" size="small"/>
      </div>
    </el-card>
    <el-card>
      <template #header>视频类型</template>
      <el-tooltip content="选中的类型会被屏蔽">
        <el-radio-group v-model="copyrightRadioVal">
          <el-radio-button label="原创"/>
          <el-radio-button label="转载"/>
          <el-radio-button label="不处理"/>
        </el-radio-group>
      </el-tooltip>
      <el-divider/>
      <div style="display:flex;flex-wrap:wrap;gap:8px 20px;">
        <el-switch v-model="is_vertical_val" active-text="屏蔽竖屏视频"/>
        <el-switch v-model="blockFollowed" active-text="屏蔽已关注"/>
        <el-switch v-model="is_up_owner_exclusive" active-text="屏蔽充电专属"/>
        <el-switch v-model="is_senior_member_val" active-text="屏蔽硬核会员"/>
      </div>
      <el-divider/>
      <el-tooltip content="以下三项任意启用都会增加对B站的请求次数，请酌情使用">
        <span style="color:#e6a23c;font-size:12px;cursor:help;">
          <i class="el-icon-warning"></i> 以下选项会增加请求频率
        </span>
      </el-tooltip>
      <div style="display:flex;flex-wrap:wrap;gap:8px 20px;margin-top:8px;">
        <el-tooltip content="视频评论区评论被UP主精选后对所有人可见">
          <el-switch v-model="isVideosInFeaturedCommentsBlockedVal" active-text="屏蔽精选评论区视频"/>
        </el-tooltip>
        <el-switch v-model="isFollowers7DaysOnlyVideosBlockedVal" active-text="屏蔽关注7天以上可评论视频"/>
        <el-tooltip content="评论区输入框为禁止输入状态">
          <el-switch v-model="isCommentDisabledVideosBlockedVal" active-text="屏蔽禁止评论视频"/>
        </el-tooltip>
      </div>
      <el-divider/>
      <div style="display:flex;gap:16px;flex-wrap:wrap;">
        <div style="min-width:200px;">
          <span style="font-weight:500;font-size:13px;">会员类型屏蔽</span>
          <el-radio-group v-model="vipTypeRadioVal" style="display:block;margin-top:6px;">
            <el-radio-button label="无"/>
            <el-radio-button label="月大会员"/>
            <el-radio-button label="年度及以上大会员"/>
            <el-radio-button label="不处理"/>
          </el-radio-group>
        </div>
        <div style="min-width:180px;">
          <span style="font-weight:500;font-size:13px;">性别屏蔽</span>
          <el-radio-group v-model="genderRadioVal" style="display:block;margin-top:6px;">
            <el-radio-button label="男性"/>
            <el-radio-button label="女性"/>
            <el-radio-button label="保密"/>
            <el-radio-button label="不处理"/>
          </el-radio-group>
        </div>
        <div>
          <span style="font-weight:500;font-size:13px;">创作团队</span>
          <el-tooltip content="作者未匹配时检查其他成员">
            <el-switch v-model="is_check_team_member" active-text="检查团队成员" style="display:block;margin-top:6px;"/>
          </el-tooltip>
        </div>
      </div>
    </el-card>
    <el-card>
      <template #header>评论</template>
      <el-switch v-model="isSeniorMemberOnlyVal" active-text="仅看硬核会员"/>
    </el-card>
  </div>
</template>
