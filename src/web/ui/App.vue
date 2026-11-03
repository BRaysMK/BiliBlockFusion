<script setup lang="ts">
import {ref, watch} from 'vue';
import panelSettingsView from "./views/settings/panelSettingsView.vue";
import compatibleSettingView from "./views/settings/compatibleSettingView.vue";
import lookContentDialog from "./dialogs/lookContentDialog.vue";
import PageProcessingTabsView from "./views/page/PageProcessingTabsView.vue";
import DiagnosticTabsView from "./views/DiagnosticTabsView.vue";
import AboutTabsView from "./views/AboutTabsView.vue";
import showImgDialog from "./dialogs/showImgDialog.vue";
import sheetDialog from "./dialogs/sheetDialog.vue";
import bulletWordManagementView from "./views/bulletWordManagementView.vue";
import {eventEmitter} from "../core/EventEmitter.ts";
import localMKData, {getDrawerShortcutKeyGm} from "../state/localMKData.ts";
import ruleManagementView from './views/rule/ruleManagementView.vue'
import excludeURLsView from './views/settings/excludeURLsView.vue'
import RightFloatingLayoutView from "./views/settings/rightFloatingLayoutView.vue";
import conditionalityView from './views/rule/conditionalityView.vue';
import defUtil from "../core/util/defUtil.ts";
import {ElMessageBox} from 'element-plus';
import PanelShell from "./panel/PanelShell.vue";

const drawer = ref(false);
// 默认打开的tab
const tabsActiveName = ref(GM_getValue('mainTabsActiveName', '规则管理'));
const debug_panel_show = ref(__DEV__);
const isShowBackToTopVal = ref(localMKData.isShowBackToTopBtn());

// 开合状态只有 drawer 这一个布尔值，动画由 PanelShell 内的 CSS 过渡完成。
// 不要在这里再对 DOM 做任何干预：外部改 transform 会与过渡争抢，导致抽搐或动画不执行。

watch(tabsActiveName,(n)=>{
  GM_setValue('mainTabsActiveName', n);
})

eventEmitter.on('主面板开关', () => {
  drawer.value = !drawer.value;
});

document.addEventListener('keydown', (event) => {
  eventEmitter.emit('event-keydownEvent', event);
  if (event.key === getDrawerShortcutKeyGm()) {
    drawer.value = !drawer.value;
  }
});

const alertFunDebounce = defUtil.debounce((response: any, bvId: string) => {
  ElMessageBox.alert(`请求获取视频信息失败，状态码：${response.status}，bv号：${bvId}
                \n。已自动禁用根据bv号网络请求获取视频信息状态
                \n如需关闭，请在面板条件限制里手动关闭。`, '错误', {
    confirmButtonText: '确定',
    type: 'error'
  });
}, 2000);
eventEmitter.on('请求获取视频信息失败', (response: any, bvId: string) => {
  eventEmitter.send('更新根据bv号网络请求获取视频信息状态', true);
  alertFunDebounce(response, bvId);
});

eventEmitter.on('e:设置顶部按钮状态', (show: boolean) => {
  isShowBackToTopVal.value = show;
});
</script>

<template>
  <div>
    <!-- 面板外壳由 PanelShell 自控：宽 60%、高 70%、距顶 15%，从左侧滑入。
         不用 el-drawer 是因为它的 modelValue/visible 双状态机会与外部开关竞态，
         详见 PanelShell.vue 顶部注释。 -->
    <PanelShell v-model="drawer">
      <div class="gz-panel__content">
        <el-tabs id="gz-drawer-tabs" v-model="tabsActiveName"
                 type="border-card">
          <el-tab-pane label="面板设置" lazy name="面板设置">
            <panelSettingsView/>
          </el-tab-pane>
          <el-tab-pane label="规则管理" lazy name="规则管理">
            <ruleManagementView/>
          </el-tab-pane>
          <el-tab-pane label="页面处理" lazy name="页面处理">
            <PageProcessingTabsView/>
          </el-tab-pane>
          <el-tab-pane label="兼容设置" lazy name="兼容设置">
            <compatibleSettingView/>
          </el-tab-pane>
          <el-tab-pane label="排除页面" lazy name="排除页面">
            <excludeURLsView/>
          </el-tab-pane>
          <el-tab-pane label="条件限制" lazy name="条件限制">
            <conditionalityView/>
          </el-tab-pane>
          <!-- 诊断：合并原「输出信息」「缓存管理」「调试测试」三个排查类页签 -->
          <el-tab-pane label="诊断" name="诊断">
            <DiagnosticTabsView/>
          </el-tab-pane>
          <el-tab-pane v-if="debug_panel_show" label="弹幕词管理" lazy name="弹幕词管理">
            <bulletWordManagementView/>
          </el-tab-pane>
          <!-- 关于：合并原「支持打赏」「关于和问题反馈」两个信息展示类页签 -->
          <el-tab-pane label="关于" lazy name="关于">
            <AboutTabsView/>
          </el-tab-pane>
        </el-tabs>
      </div>
    </PanelShell>
    <lookContentDialog/>
    <showImgDialog/>
    <sheetDialog/>
    <RightFloatingLayoutView/>
    <el-backtop v-if="isShowBackToTopVal"/>
  </div>
</template>

<style>
/* ==========================================================================
   主面板外壳 —— Fluent 2 设计语言
   --------------------------------------------------------------------------
   表面层次（Fluent 评审第 2 条）：画布 / 侧栏 / 卡片必须用不同明度的中性背景。
   本面板采用「抽屉容器 = 画布(Background3) → 标签页外壳 = 一级表面(Background1)
   → 卡片 = 一级表面 + 描边 + shadow2」的三层结构。
   所有颜色/间距/圆角/阴影均取自 --fluent-* 令牌，随 .gz-theme-* 自动切换亮暗。
   ========================================================================== */

/* ---- 抽屉容器：画布层 ----
   用 Background2 而非 Background3：深色下 Background3 是 #141414，
   与卡片 #292929 相差两档，视觉割裂；Background2 形成「画布 → 卡片」的柔和层次。

   min-height:100% 让标签页外壳铺满滚动容器：内容短时背景一直延续到面板底部，
   不会露出 PanelShell 的底色。 */
#gz-drawer-tabs {
  background: var(--fluent-color-neutral-background-2);
  min-height: 100%;
}

/* 标签页内容区
   - 背景用 Background2（次级表面）：与卡片 Background1 形成层次但不产生过暗反差
     （用 Background3 会在深色下变成近乎纯黑，与卡片割裂）
   - 自身不滚动，由面板内容区统一滚动，避免双重滚动条 */
#gz-drawer-tabs > .el-tabs__content {
  padding: 0;
  background: var(--fluent-color-neutral-background-2);
  overflow: visible;
}

/* ---- 标签页外壳：一级表面 ---- */
#gz-drawer-tabs.el-tabs--border-card {
  background: var(--fluent-color-neutral-background-1);
  border: var(--fluent-stroke-width-thin) solid var(--fluent-color-neutral-stroke-2);
  border-radius: var(--fluent-border-radius-x-large);
  box-shadow: var(--fluent-shadow-4);
  /* 不能用 overflow:hidden：它会成为内部 sticky 元素的滚动容器，
     左侧子页签的吸顶会相对它定位而不是相对面板内容区，滚动时跟着滚出视野。
     圆角裁切改由下方子元素各自的 border-radius 实现。 */
  overflow: visible;
}

/* 顶栏自身圆角裁切（替代父级 overflow:hidden） */
#gz-drawer-tabs.el-tabs--border-card > .el-tabs__header {
  border-radius: var(--fluent-border-radius-x-large) var(--fluent-border-radius-x-large) 0 0;
}

/* ---- 标签页头：次级表面 + 吸顶 ---- */
#gz-drawer-tabs.el-tabs--border-card > .el-tabs__header {
  background: var(--fluent-color-neutral-background-2);
  border-bottom: var(--fluent-stroke-width-thin) solid var(--fluent-color-neutral-stroke-2);
  margin: 0;
  position: sticky;
  top: 0;
  z-index: 10;
  border-radius: 0;
  /* 页签较多时允许横向滚动而不是挤压换行 */
  overflow-x: auto;
  overflow-y: hidden;
}

/* 页签横向滚动时隐藏滚动条，保持 Fluent 的干净观感 */
#gz-drawer-tabs.el-tabs--border-card > .el-tabs__header::-webkit-scrollbar {
  height: 0;
}

#gz-drawer-tabs.el-tabs--border-card > .el-tabs__header .el-tabs__nav-wrap {
  overflow: visible;
}

#gz-drawer-tabs.el-tabs--border-card > .el-tabs__header .el-tabs__nav {
  border: none;
}

#gz-drawer-tabs.el-tabs--border-card > .el-tabs__header .el-tabs__item {
  border: none;
  height: 44px;
  line-height: 44px;
  /* 水平 padding 取 S(8px) 而非 L(16px)：16px 时页签总宽会溢出容器，8px 可一屏放下 */
  padding: 0 var(--fluent-spacing-horizontal-s);
  white-space: nowrap;
  flex-shrink: 0;
  font-size: var(--fluent-font-size-base-300);
  font-weight: var(--fluent-font-weight-medium);
  color: var(--fluent-color-neutral-foreground-3);
  transition: color var(--fluent-duration-fast) var(--fluent-curve-easy-ease),
              background-color var(--fluent-duration-fast) var(--fluent-curve-easy-ease);
}

#gz-drawer-tabs.el-tabs--border-card > .el-tabs__header .el-tabs__item:hover {
  color: var(--fluent-color-neutral-foreground-1);
  background: var(--fluent-color-neutral-background-3);
}

/* 选中态：Fluent 用「品牌色文字 + 2px 下划线指示器」，不用填充块 */
#gz-drawer-tabs.el-tabs--border-card > .el-tabs__header .el-tabs__item.is-active {
  color: var(--fluent-color-brand-foreground-1);
  font-weight: var(--fluent-font-weight-semibold);
  background: transparent;
}

#gz-drawer-tabs.el-tabs--border-card > .el-tabs__header .el-tabs__item.is-active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: var(--fluent-spacing-horizontal-s);
  right: var(--fluent-spacing-horizontal-s);
  height: 2px;
  background: var(--fluent-color-brand-background);
  border-radius: var(--fluent-border-radius-circular);
}

/* 标签页内容内边距：Fluent 用 16px 基准留白。
   放在 pane 而不是抽屉 body 上——body 的 padding 会形成滚动时内容穿透吸顶栏的缝隙 */
#gz-drawer-tabs .el-tab-pane {
  padding: var(--fluent-spacing-vertical-l) var(--fluent-spacing-horizontal-l);
}

/* ---- 内层左侧页签吸顶（规则管理 / 页面处理 / 诊断 / 关于 都用 tab-position="left"）----
   这些子页签跟随面板内容区一起滚动，内容长时页签会被滚出视野。

   关键：EP 的 .el-tabs--left 默认带 overflow:hidden，它会让 sticky 失效
   （overflow 非 visible 的祖先会成为 sticky 的滚动容器，导致 sticky 相对它定位而非视口）。
   因此必须先把 overflow 改成 visible，sticky 才能相对滚动容器生效。 */
.gz-panel .el-tabs--left {
  overflow: visible;
}

.gz-panel .el-tabs--left > .el-tabs__header {
  position: sticky;
  /* 贴住外层页签栏下沿：外层页签栏高 44px，滚动容器无 padding */
  top: 44px;
  align-self: flex-start;
  /* 避免吸顶时下方内容透出 */
  background: var(--fluent-color-neutral-background-1);
  z-index: 2;
}

/* 页签列内部：长列表时页签自身可滚动，不把面板撑高 */
.gz-panel .el-tabs--left > .el-tabs__header .el-tabs__nav-wrap {
  max-height: calc(70vh - 120px);
  overflow-y: auto;
}

/* 滚动条：Fluent 的细滚动条。
   面板内容区不留 padding——吸顶页签栏贴在内容盒顶端，padding 区属于滚动视口，
   滚动时内容会从 padding 缝里穿到页签栏上方。内边距由 .el-tab-pane 提供。 */
.gz-panel .gz-panel__content {
  padding: 0;
}

.gz-panel .gz-panel__content::-webkit-scrollbar {
  width: 8px;
}

.gz-panel .gz-panel__content::-webkit-scrollbar-thumb {
  background: var(--fluent-color-neutral-stroke-2);
  border-radius: var(--fluent-border-radius-circular);
}

.gz-panel .gz-panel__content::-webkit-scrollbar-thumb:hover {
  background: var(--fluent-color-neutral-stroke-1);
}

</style>