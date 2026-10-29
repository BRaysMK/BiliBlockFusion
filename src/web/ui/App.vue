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

const drawer = ref(false);
// 默认打开的tab
const tabsActiveName = ref(GM_getValue('mainTabsActiveName', '规则管理'));
const debug_panel_show = ref(__DEV__);
const isShowBackToTopVal = ref(localMKData.isShowBackToTopBtn());

/**
 * 面板开合动画完全交给 Element Plus 原生的 Vue Transition 驱动。
 *
 * 历史教训（三条弯路，都已验证是错的）：
 * 1. 用 Web Animations API 手写滑入/滑出：与 EP 自带的 .el-drawer-fade-* 过渡
 *    争抢同一个 transform，表现为开合抽搐；finalize() 强行 display:none
 *    又打断了 leave 过渡，导致关闭无动画。
 * 2. 在 watch 里清理过渡类：清理时机与 Vue Transition 的类切换冲突，
 *    反而让 Transition 完全不运行（实测开合瞬间类名全程不变）。
 * 3. 因此这里不再对 drawer 的 DOM 做任何干预，纯靠 EP 的 v-model 驱动 Transition。
 *    动画时长与曲线在下方 <style> 里通过 CSS 覆盖。
 */

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
    <!-- 浮层形态（对齐魔改版）：宽 60%、高 70%、距顶 15%，从左侧滑入。
         EP 的 size 只控制宽度，高度由样式覆盖 -->
    <el-drawer :modal="false"
               v-model="drawer"
               :with-header="false"
               direction="ltr"
               size="60%"
               class="gz-main-drawer"
               style="position: fixed">
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
    </el-drawer>
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
   与卡片 #292929 相差两档，视觉割裂；Background2 形成「画布 → 卡片」的柔和层次 */
#gz-drawer-tabs {
  background: var(--fluent-color-neutral-background-2);
}

/* 标签页内容区
   - 背景用 Background2（次级表面）：与卡片 Background1 形成层次但不产生过暗反差
     （用 Background3 会在深色下变成近乎纯黑，与卡片割裂）
   - 自身不滚动，由抽屉 body 统一滚动，避免双重滚动条 */
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
  overflow: hidden;
  /* 注意：这里曾用 height:100% + flex 撑满高度，副作用是把内容区高度锁死，
     导致内容超出时不产生溢出、抽屉 body 的 overflow:auto 失效、面板无法滚动。
     改为 min-height 让内容自然撑高，由抽屉 body 统一滚动。 */
  min-height: 100%;
}

/* 内容区不再限制高度：内容多时自然撑高，交给抽屉 body 滚动 */
#gz-drawer-tabs > .el-tabs__content {
  overflow: visible;
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
  /* 面板宽 60% 时 12 个页签放不下，允许横向滚动而不是挤压换行 */
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
  /* 水平 padding 用 S(8px) 而非 L(16px)：实测 12 个页签文字总宽 728px，
     16px 两侧会让总宽达到 1112px 而溢出容器（978px）；
     降到 8px 后总宽 824px，全部页签一屏可见，无需滚动或省略 */
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

/* 标签页内容内边距：Fluent 用 16px 基准留白 */
#gz-drawer-tabs .el-tab-pane {
  padding: var(--fluent-spacing-vertical-l) var(--fluent-spacing-horizontal-l);
}

/* ---- 抽屉本体：60% 宽 × 70% 高的浮层（对齐魔改版形态）----
   魔改版的设计是「不铺满全屏」的浮层：宽 60%、距顶 15%、高 70%、
   从左侧滑入、只圆右侧两角，视觉上是悬浮面板而非全屏抽屉。
   宽度由模板 size="60%" 控制（EP 会写成 inline width），
   高度/位置用 !important 覆盖，因为 EP 对 ltr 方向不提供垂直尺寸控制。 */
/* 必须用 .gz-main-drawer 限定：面板内的「查看规则内容」「查看内容」等子抽屉
   同样是 .el-drawer.ltr，用裸类选择器会把它们也套上 60%×70% 浮层样式，
   导致子抽屉错位、并让主面板 querySelector('.el-drawer') 取到错误元素。 */
.el-drawer.gz-main-drawer {
  top: 15% !important;
  height: 70% !important;
  border-radius: 0 var(--fluent-border-radius-x-large) var(--fluent-border-radius-x-large) 0 !important;
  box-shadow: var(--fluent-shadow-64) !important;
  background: var(--fluent-color-neutral-background-2);
  overflow: hidden;
}

/* 开合过渡：EP 默认用 --el-transition-duration（约 0.3s）线性过渡，
   这里换成 Fluent 的缓动曲线，滑入更自然、关闭也走同一套过渡 */
.el-drawer-fade-enter-active,
.el-drawer-fade-leave-active {
  transition: opacity 280ms cubic-bezier(0.33, 0, 0.67, 1) !important;
}

.el-drawer-fade-enter-active .el-drawer,
.el-drawer-fade-leave-active .el-drawer {
  transition: transform 280ms cubic-bezier(0.33, 0, 0.67, 1) !important;
}

/* 浮层右侧描边，强化「悬浮卡片」的边界感 */
.el-drawer.gz-main-drawer::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  width: 1px;
  background: var(--fluent-color-neutral-stroke-2);
}

.el-drawer__body {
  padding: var(--fluent-spacing-vertical-l) var(--fluent-spacing-horizontal-l);
  overflow-y: auto;
}

/* 滚动条：Fluent 的细滚动条 */
.el-drawer__body::-webkit-scrollbar,
#gz-drawer-tabs > .el-tabs__content::-webkit-scrollbar {
  width: 8px;
}

.el-drawer__body::-webkit-scrollbar-thumb,
#gz-drawer-tabs > .el-tabs__content::-webkit-scrollbar-thumb {
  background: var(--fluent-color-neutral-stroke-2);
  border-radius: var(--fluent-border-radius-circular);
}

.el-drawer__body::-webkit-scrollbar-thumb:hover,
#gz-drawer-tabs > .el-tabs__content::-webkit-scrollbar-thumb:hover {
  background: var(--fluent-color-neutral-stroke-1);
}

/* 开合动画由 App.vue 的 animateDrawer 用 Web Animations API 驱动（见 script 区）：
   - 动画前清理 Vue Transition 残留动画类（避免 enter-from 锁死 transform），动画后强制 transform 归位，
     从而绕开 B 站页面环境下 Vue Transition 动画偶发不完成导致的"面板卡在视口外" */
</style>