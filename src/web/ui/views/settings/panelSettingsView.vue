<script setup lang="ts">
import {ref, watch} from 'vue';
import localMKData, {getDrawerShortcutKeyGm} from "../../../state/localMKData.ts";
import {eventEmitter} from "@/core/EventEmitter.ts";
import {ElMessage, ElNotification} from 'element-plus';
import SettingRow from '../../components/SettingRow.vue';
import SettingGroup from '../../components/SettingGroup.vue';
import darkTheme, {type ThemeModeSetting} from '../../darkTheme.ts';

const themeModeVal = ref<ThemeModeSetting>(darkTheme.getThemeModeSetting());
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

watch(themeModeVal, (n) => {
  darkTheme.applyThemeMode(n);
});

watch(showRightTopMainButSwitch, (newVal) => {
  GM_setValue("showRightTopMainButSwitch", newVal === true);
  eventEmitter.send('显隐主面板开关', newVal);
});
watch(isFirstFullDisplay, (newVal) => {
  GM_setValue('isFirstFullDisplay', newVal === true);
});
watch(isHalfHiddenIntervalAfterInitialDisplay, (newBool) => {
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
  <SettingGroup description="自动跟随 B 站自身的深色主题切换。选「亮色」或「暗色」则固定，不再跟随"
                title="外观">
    <SettingRow label="面板主题">
      <el-radio-group v-model="themeModeVal" size="small">
        <el-radio-button value="light">亮色</el-radio-button>
        <el-radio-button value="auto">自动</el-radio-button>
        <el-radio-button value="dark">暗色</el-radio-button>
      </el-radio-group>
    </SettingRow>
  </SettingGroup>

  <SettingGroup title="悬浮按钮">
    <SettingRow description="页面右侧显示打开主面板的悬浮按钮" label="显示主面板按钮">
      <el-switch v-model="showRightTopMainButSwitch" size="small"/>
    </SettingRow>
    <SettingRow description="页面加载完后先完整展示按钮，否则直接半隐藏" label="初次完整显示">
      <el-switch v-model="isFirstFullDisplay" size="small"/>
    </SettingRow>
    <SettingRow description="完整展示后间隔 10 秒自动半隐藏，避免遮挡页面内容" label="初次显示后间隔半隐藏">
      <el-switch v-model="isHalfHiddenIntervalAfterInitialDisplay" size="small"/>
    </SettingRow>
    <SettingRow description="页面右下角由脚本插入的「回到顶部」按钮，改动实时生效" label="显示回到顶部按钮">
      <el-switch v-model="isShowBackToTopVal" size="small"/>
    </SettingRow>
  </SettingGroup>

  <SettingGroup description="默认是反引号（Tab 键上方）。在页面任意位置按下一个键，再点「保存」即可改用它"
                title="快捷键">
    <SettingRow label="当前快捷键">
      <el-tag size="small">{{ drawerShortcutKeyVal }}</el-tag>
    </SettingRow>
    <SettingRow label="按下的键">
      <el-tag size="small" :type="theKeyPressedKeyVal === '' ? 'info' : 'success'">
        {{ theKeyPressedKeyVal === '' ? '尚未按键' : theKeyPressedKeyVal }}
      </el-tag>
      <el-button :disabled="theKeyPressedKeyVal === ''" size="small" type="primary" @click="setDrawerShortcutKeyBut">
        保存
      </el-button>
    </SettingRow>
  </SettingGroup>
</template>
