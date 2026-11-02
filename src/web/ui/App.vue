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

// 开合动画完全交给 Element Plus 原生的 Transition 驱动，不要对 drawer 的 DOM 做任何干预：
// 手写 WAAPI 或清理过渡类都会与 EP 的 .el-drawer-fade-* 争抢 transform，导致抽搐或动画不执行。
// 时长与曲线在下方 <style> 里用 CSS 覆盖。

watch(tabsActiveName,(n)=>{
  GM_setValue('mainTabsActiveName', n);
})

eventEmitter.on('主面板开关', () => {
  drawer.value = !drawer.value;
});

/**
 * 点击面板外空白处关闭面板
 *
 * 面板用 :modal="false"（不用 EP 遮罩层，否则会挡住整个 B 站页面），
 * 因此 EP 自带的 close-on-click-modal 不生效，只能自己监听 document 点击。
 * 面板本体、被 teleport 到 body 的 EP 浮层、右侧悬浮按钮都不算「外部空白」。
 */
const handleDocumentClick = (event: MouseEvent): void => {
  if (!drawer.value) return;

  // 面板正在播放开合动画时不处理：enter 过渡期间关闭会与动画叠加，
  // 面板可能卡在视口外。只查主面板自己的外层容器——页面上还有多个
  // .is-drawer.el-modal-drawer（子抽屉的遮罩），全局 querySelector 可能取到别人。
  const wrapEl = document.querySelector('.gz-main-drawer')?.parentElement;
  if (wrapEl && /el-drawer-fade-(enter|leave)-active/.test(wrapEl.className)) return;

  const target = event.target as HTMLElement | null;
  if (target === null) return;

  // 面板本体内部（.gz-main-drawer 是真正的抽屉元素）→ 不关闭
  if (target.closest('.gz-main-drawer') !== null) return;
  // EP 浮层（弹窗/下拉/气泡/消息框等被 teleport 到 body 下）→ 不关闭，
  // 否则点下拉选项会把面板一起关掉
  if (target.closest('.el-popper, .el-overlay, .el-message-box, .el-notification, .el-message') !== null) return;
  // 浮动开关按钮 → 不关闭，交给它自己的 handler 做开关切换。
  // 若这里不拦住，mousedown 会先关面板、随后的 click 又把它打开，表现为「点几次都关不掉」。
  if (target.closest('.gz-float-btn') !== null) return;

  // 其余：点击面板外空白 → 关闭
  drawer.value = false;
};
// 用 mousedown 而非 click：click 要等 mouseup 才触发，
// 用户在面板外按下拖动时不会误关；同时避免与面板内按钮的 click 竞争。
// 捕获阶段监听，保证在页面自身的点击处理之前拿到事件。
document.addEventListener('mousedown', handleDocumentClick, true);

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
         EP 的 size 只控制宽度，高度由样式覆盖。
         - lock-scroll=false：面板是常驻浮层，锁 body 滚动没有意义；EP 的锁屏清理有 200ms 延迟，
           快速开关时会把 el-popup-parent--hidden 永久留在 body 上，导致整页无法滚动/点击。
         - modal-penetrable：modal=false 时 EP 仍会渲染一个覆盖全屏、pointer-events:auto 的外层 div，
           它会吞掉页面和悬浮按钮的点击；加上该属性后外层 pointer-events:none，只有抽屉本体可点。 -->
    <el-drawer :modal="false"
               :modal-penetrable="true"
               :lock-scroll="false"
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
  /* 注意 1：这里不能用 overflow:hidden。它虽然能让圆角裁切子元素，
     但会成为内部 sticky 元素的滚动容器，导致左侧子页签吸顶失效
     （实测 sticky 相对它定位而非抽屉 body，滚动时页签跟着滚出视野）。
     圆角效果改由下方子元素的 border-radius 继承实现。
     注意 2：也不能用 height:100% + flex，那会把内容区高度锁死、
     抽屉 body 的 overflow:auto 失效、面板无法滚动。用 min-height 让内容自然撑高。 */
  overflow: visible;
  min-height: 100%;
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

/* ---- 内层左侧页签吸顶（规则管理 / 页面处理 / 诊断 / 关于 都用 tab-position="left"）----
   这些子页签跟随面板 body 一起滚动，内容长时页签会被滚出视野。

   关键：EP 的 .el-tabs--left 默认带 overflow:hidden，它会让 sticky 失效
   （overflow 非 visible 的祖先会成为 sticky 的滚动容器，导致 sticky 相对它定位而非视口）。
   因此必须先把 overflow 改成 visible，sticky 才能相对抽屉 body 生效。 */
.gz-main-drawer .el-tabs--left {
  overflow: visible;
}

.gz-main-drawer .el-tabs--left > .el-tabs__header {
  position: sticky;
  /* 贴住外层页签栏下沿：外层页签栏高 43px，抽屉 body 已无 padding，故 top=43 */
  top: 43px;
  align-self: flex-start;
  /* 避免吸顶时下方内容透出 */
  background: var(--fluent-color-neutral-background-1);
  z-index: 2;
}

/* 页签列内部：长列表时页签自身可滚动，不把面板撑高 */
.gz-main-drawer .el-tabs--left > .el-tabs__header .el-tabs__nav-wrap {
  max-height: calc(70vh - 120px);
  overflow-y: auto;
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

/* 抽屉 body 不能留 padding：吸顶的页签栏贴在内容盒顶端，而 padding 区属于
   body 的滚动视口，滚动时内容会从 padding 缝里穿到页签栏上方。
   内边距改由 .el-tab-pane 提供。
   选择器带上 .gz-main-drawer 提高优先级，避免被 EP 默认的 .el-drawer__body 覆盖。 */
.el-drawer.gz-main-drawer .el-drawer__body {
  padding: 0;
  overflow-y: auto;
}

/* 滚动条：Fluent 的细滚动条 */
.gz-main-drawer .el-drawer__body::-webkit-scrollbar {
  width: 8px;
}

.gz-main-drawer .el-drawer__body::-webkit-scrollbar-thumb {
  background: var(--fluent-color-neutral-stroke-2);
  border-radius: var(--fluent-border-radius-circular);
}

.gz-main-drawer .el-drawer__body::-webkit-scrollbar-thumb:hover {
  background: var(--fluent-color-neutral-stroke-1);
}

</style>