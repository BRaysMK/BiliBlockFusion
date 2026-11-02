<script setup lang="ts">
import {ref} from 'vue';
import externalList from "../../config/otherKeyListDataJson.json";
import commentWordLimitView from "./commentWordLimitView.vue";
import UserLevelFilteringView from "./UserLevelFilteringView.vue";
import SwitchMinMaxInputCard from "../components/SwitchMinMaxInputCard.vue";
import {ElNotification} from 'element-plus';

/**
 * 其他规则组件
 */
const showInfoList = ref<any[]>([
  {key: 'minimum_user_level_video_gm', label: '最小用户等级限制-视频'},
  {key: 'maximum_user_level_video_gm', label: '最大用户等级限制-视频'},
  {key: 'minimum_user_level_comment_gm', label: '最小用户等级限制-评论'},
  {key: 'maximum_user_level_comment_gm', label: '最大用户等级限制-评论'}
]);

const updateInfo = (isTip = false) => {
  for (const v of showInfoList.value) {
    v.showVal = GM_getValue(v.key, '');
  }
  isTip && ElNotification({title: '', type: 'info', position: 'bottom-right', message: '已刷新'});
};

for (const v of externalList as any[]) {
  showInfoList.value.push({label: v['minLabel'], key: v['minInputKey'], showVal: ''});
  showInfoList.value.push({label: v['maxLabel'], key: v['maxInputKey'], showVal: ''});
}
updateInfo();
</script>

<template>
  <div>
    <div style="display: flex">
      <div style="width: 70vw">
        <UserLevelFilteringView/>
        <div style="display: flex;">
          <switch-min-max-input-card v-for="v in externalList" :key="v.title"
                                     :is-max-key="v.isMaxKey"
                                     :is-min-key="v.isMinKey"
                                     :max-def-val="v.maxDefVal"
                                     :max-input-key="v.maxInputKey"
                                     :min-def-val="v.minDefVal"
                                     :min-input-key="v.minInputKey"
                                     :title="v.title"/>
        </div>
        <commentWordLimitView/>
      </div>
      <div>
        <el-card shadow="never">
          <template #header>
            <span>使用说明</span>
          </template>
          <ol>
            <li>时长单位是秒，播放量/弹幕量单位是个</li>
            <li>最小值：小于该值就屏蔽；最大值：大于该值就屏蔽</li>
            <li>同时设置最小和最大时，落在区间内的视频正常显示，区间外屏蔽</li>
            <li>开关关闭表示该方向不做限制</li>
            <li>右侧显示 -1 表示该项当前未做任何限制</li>
            <li>指标取自视频卡片上的显示值，部分卡片不显示弹幕数，此时弹幕规则不生效</li>
          </ol>
        </el-card>
        <el-button type="primary" size="small" @click="updateInfo(true)">刷新</el-button>
        <div v-for="v in showInfoList" :key="v.label">
          {{ v.label }}
          <el-tag>{{ v.showVal }}</el-tag>
        </div>
      </div>
    </div>
  </div>
</template>
