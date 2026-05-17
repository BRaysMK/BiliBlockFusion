<script>
import localMKData, {getDrawerShortcutKeyGm} from "../../data/localMKData.js";
import {eventEmitter} from "../../model/EventEmitter.js";

export default {
  data() {
    return {
      showRightTopMainButSwitch: localMKData.isShowRightTopMainButSwitch(),
      isFirstFullDisplay: localMKData.isFirstFullDisplay(),
      isHalfHiddenIntervalAfterInitialDisplay: localMKData.isHalfHiddenIntervalAfterInitialDisplay(),
      drawerShortcutKeyVal: getDrawerShortcutKeyGm(),
      isListeningForKey: false,
      isShowBackToTopVal: localMKData.isShowBackToTopBtn(),
      darkMode: GM_getValue('dark_mode', false)
    }
  },
  methods: {
    startListeningForKey() {
      this.isListeningForKey = true;
    },
    setShortcutKey(key) {
      if (!this.isListeningForKey) return;
      this.isListeningForKey = false;
      if (this.drawerShortcutKeyVal === key) {
        this.$message('不需要重复设置');
        return;
      }
      GM_setValue('drawer_shortcut_key_gm', key);
      this.$notify({message: '已设置打开关闭主面板快捷键', type: 'success'});
      this.drawerShortcutKeyVal = key;
    }
  },
  watch: {
    showRightTopMainButSwitch(newVal) {
      GM_setValue("showRightTopMainButSwitch", newVal === true)
      eventEmitter.send('显隐主面板开关', newVal)
    },
    isFirstFullDisplay(newVal) {
      GM_setValue('isFirstFullDisplay', newVal === true)
    },
    isHalfHiddenIntervalAfterInitialDisplay(newBool) {
      GM_setValue('is_half_hidden_interval_after_initial_display', newBool === true)
    },
    isShowBackToTopVal(newVal) {
      GM_setValue('is_show_back_to_top_btn', newVal)
      eventEmitter.send('e:设置顶部按钮状态', newVal)
    },
    darkMode(newVal) {
      GM_setValue('dark_mode', newVal);
      document.body.classList.toggle('bb-dark', newVal);
      eventEmitter.send('toggle-dark-mode', newVal);
    }
  },
  created() {
    eventEmitter.on('event-keydownEvent', (event) => {
      if (this.isListeningForKey) {
        this.setShortcutKey(event.key);
      }
    })
  }
}
</script>

<template>
  <div>
    <el-card shadow="never">
      <template #header>
        <span>外观</span>
      </template>
      <el-switch v-model="darkMode" active-text="深色模式"/>
    </el-card>
    <el-card shadow="never">
      <template #header>
        <span>页面右侧悬浮按钮</span>
      </template>
      <div style="display:flex;flex-wrap:wrap;gap:8px 16px;">
        <el-switch v-model="showRightTopMainButSwitch" active-text="显示按钮"/>
        <el-tooltip content="页面加载完是否完整展示按钮，否则半隐藏">
          <el-switch v-model="isFirstFullDisplay" active-text="初次完整显示"/>
        </el-tooltip>
        <el-tooltip content="完整展示后间隔10秒半隐藏">
          <el-switch v-model="isHalfHiddenIntervalAfterInitialDisplay" active-text="间隔后半隐藏"/>
        </el-tooltip>
        <el-switch v-model="isShowBackToTopVal" active-text="显示回到顶部"/>
      </div>
    </el-card>
    <el-card shadow="never">
      <template #header>
        <span>快捷键</span>
      </template>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
        <span style="font-size:12px;color:#9499A0;">展开/关闭主面板：</span>
        <el-tag size="small">{{ drawerShortcutKeyVal || '未设置' }}</el-tag>
        <el-button v-if="!isListeningForKey" size="small" @click="startListeningForKey">设置快捷键</el-button>
        <el-tag v-else size="small" type="danger" effect="dark">请按下需要设置的键位...</el-tag>
      </div>
    </el-card>
  </div>
</template>
