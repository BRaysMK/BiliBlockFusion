<script setup lang="ts">
import {ref, watch} from 'vue';
import localMKData, {getDrawerShortcutKeyGm} from "../../../state/localMKData.ts";
import {eventEmitter} from "@/core/EventEmitter.ts";
import {ElMessage, ElNotification} from 'element-plus';

const showRightTopMainButSwitch = ref(localMKData.isShowRightTopMainButSwitch());
const isFirstFullDisplay = ref(localMKData.isFirstFullDisplay());
const isHalfHiddenIntervalAfterInitialDisplay = ref(localMKData.isHalfHiddenIntervalAfterInitialDisplay());
const drawerShortcutKeyVal = ref(getDrawerShortcutKeyGm());
const theKeyPressedKeyVal = ref('');
const isShowBackToTopVal = ref(localMKData.isShowBackToTopBtn());

const setDrawerShortcutKeyBut = () => {
  const theKeyPressedKey = theKeyPressedKeyVal.value;
  const drawerShortcutKey = drawerShortcutKeyVal.value;
  if (drawerShortcutKey === theKeyPressedKey) {
    ElMessage('不需要重复设置');
    return;
  }
  GM_setValue('drawer_shortcut_key_gm', theKeyPressedKey);
  ElNotification({title: '', message: '已设置打开关闭主面板快捷键', type: 'success'});
  drawerShortcutKeyVal.value = theKeyPressedKey;
};

watch(showRightTopMainButSwitch, (newVal) => {
  //设置是否显示右上角主面板按钮开关
  GM_setValue("showRightTopMainButSwitch", newVal === true);
  eventEmitter.send('显隐主面板开关', newVal);
});
watch(isFirstFullDisplay, (newVal) => {
  //设置是否第一次完整显示外部开关主面板按钮
  GM_setValue('isFirstFullDisplay', newVal === true);
});
watch(isHalfHiddenIntervalAfterInitialDisplay, (newBool) => {
  //设置初次显示后间隔半隐藏主面板开关按钮
  GM_setValue('is_half_hidden_interval_after_initial_display', newBool === true);
});
watch(isShowBackToTopVal, (newVal) => {
  GM_setValue('is_show_back_to_top_btn', newVal);
  eventEmitter.send('e:设置顶部按钮状态', newVal);
});

eventEmitter.on('event-keydownEvent', (event: KeyboardEvent) => {
  theKeyPressedKeyVal.value = event.key;
});
</script>

<template>
  <div>
    <el-card shadow="never">
      <template #header>
        <span>页面右侧悬浮按钮设置</span>
      </template>
      <el-switch v-model="showRightTopMainButSwitch" active-text="显示按钮"></el-switch>
      <el-tooltip content="页面每次加载完之后是否完整展示按钮，否则半隐藏">
        <el-switch v-model="isFirstFullDisplay" active-text="初次完整显示"></el-switch>
      </el-tooltip>
      <el-tooltip content="页面每次加载完之后如完整展示按钮时，间隔10秒后半隐藏处理">
        <el-switch v-model="isHalfHiddenIntervalAfterInitialDisplay"
                   active-text="初次显示后间隔半隐藏"/>
      </el-tooltip>
      <el-switch v-model="isShowBackToTopVal" active-text="显示回到顶部按钮"
                 title="页面右下角的由脚本插入的置顶按钮，改动实时生效"/>
    </el-card>
    <el-card shadow="never">
      <template #header>
        <span>快捷键</span>
      </template>
      <div>默认快捷键为反引号 <code>`</code>（Tab 键上方），可在下方按键后保存修改。</div>
      <div>当前快捷键：<el-tag>{{ drawerShortcutKeyVal }}</el-tag></div>
      <div>当前按下的键：<el-tag>{{ theKeyPressedKeyVal }}</el-tag></div>
      <el-button @click="setDrawerShortcutKeyBut">设置打开关闭主面板快捷键</el-button>
    </el-card>
  </div>
</template>
