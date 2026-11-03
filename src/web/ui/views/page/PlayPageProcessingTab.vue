<script setup lang="ts">
import {ref, watch} from 'vue'
import localMKData, {isCloseCommentBlockingGm, isCommentResponseRewriteGm} from "../../../state/localMKData.ts";
import SettingRow from '../../components/SettingRow.vue';
import SettingGroup from '../../components/SettingGroup.vue';

const isDelPlayerPageAd = ref(GM_getValue('isDelPlayerPageAd', false));
const isDelPlayerPageRightGameAd = ref(GM_getValue('isDelPlayerPageRightGameAd', false));
const isDelPlayerPageRightVideoList = ref(localMKData.isDelPlayerPageRightVideoList());
const isDelBottomComment = ref(localMKData.isDelBottomComment());
const isDelPlayerEndingPanelVal = ref(localMKData.isDelPlayerEndingPanel());
const isCloseCommentBlockingVal = ref(isCloseCommentBlockingGm());
const isCommentResponseRewriteVal = ref(isCommentResponseRewriteGm());

watch(isDelPlayerPageAd, (b) => {
  GM_setValue('isDelPlayerPageAd', b);
});
watch(isDelPlayerPageRightGameAd, (b) => {
  GM_setValue('isDelPlayerPageRightGameAd', b);
});
watch(isDelPlayerPageRightVideoList, (b) => {
  GM_setValue('isDelPlayerPageRightVideoList', b);
});
watch(isDelBottomComment, (b) => {
  GM_setValue('isDelBottomComment', b);
});
watch(isDelPlayerEndingPanelVal, (n) => {
  GM_setValue('is_del_player_ending_panel', n);
});
watch(isCloseCommentBlockingVal, (n) => {
  GM_setValue('is_close_comment_blocking_gm', n);
});
watch(isCommentResponseRewriteVal, (n) => {
  GM_setValue('is_comment_response_rewrite_gm', n);
});
</script>

<template>
  <SettingGroup title="播放页">
    <SettingRow label="屏蔽页面元素广告">
      <el-switch v-model="isDelPlayerPageAd" size="small"/>
    </SettingRow>
    <SettingRow label="屏蔽右侧游戏推荐">
      <el-switch v-model="isDelPlayerPageRightGameAd" size="small"/>
    </SettingRow>
    <SettingRow description="整个右侧推荐列表隐藏后仍占位留空。刷新页面后生效" label="隐藏右侧推荐列表">
      <el-switch v-model="isDelPlayerPageRightVideoList" size="small"/>
    </SettingRow>
    <SettingRow description="刷新页面后生效" label="移除评论区">
      <el-switch v-model="isDelBottomComment" size="small"/>
    </SettingRow>
    <SettingRow description="视频播放结束后播放器上会浮出推荐层，开启后整层移除" label="移除播放完推荐层">
      <el-switch v-model="isDelPlayerEndingPanelVal" size="small"/>
    </SettingRow>
  </SettingGroup>

  <SettingGroup description="这里的两个开关都作用于评论屏蔽，改动后需刷新页面" title="评论">
    <SettingRow description="页面内评论不再做屏蔽判定。响应过滤已安装时也需刷新才会停用" label="关闭评论屏蔽">
      <el-switch v-model="isCloseCommentBlockingVal" size="small"/>
    </SettingRow>
    <SettingRow description="在评论接口响应阶段提前过滤，覆盖全部页面与楼中楼、置顶。改动后需刷新"
                label="响应过滤评论区（实验）">
      <el-switch v-model="isCommentResponseRewriteVal" size="small"/>
    </SettingRow>
  </SettingGroup>
</template>
