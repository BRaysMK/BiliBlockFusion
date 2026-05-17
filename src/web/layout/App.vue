<script>
import panelSettingsView from "./views/panelSettingsView.vue";
import compatibleSettingView from "./views/compatibleSettingView.vue";
import lookContentDialog from "./eventEmitter_components/lookContentDialog.vue";
import PageProcessingTabsView from "./views/page-processing/PageProcessingTabsView.vue";
import showImgDialog from "./eventEmitter_components/showImgDialog.vue";
import sheetDialog from "./eventEmitter_components/sheetDialog.vue";
import {eventEmitter} from "../model/EventEmitter.js";
import localMKData, {getDrawerShortcutKeyGm} from "../data/localMKData.js";
import ruleManagementView from './views/ruleManagementView.vue'
import RightFloatingLayoutView from "./views/rightFloatingLayoutView.vue";
import conditionalityView from "./views/conditionalityView.vue";
import overlaySettingsView from "./views/overlaySettingsView.vue";
import outputInformationView from "./views/outputInformationView.vue";
import defUtil from "../utils/defUtil.js";


/**
 * todo 目前发现加载在视频页时，el-drawer的遮罩会挡住整个屏幕，先设置modal为false，关闭遮罩，待后续观察
 * Drawer 的内容是懒渲染的，即在第一次被打开之前，传入的默认 slot 不会被渲染到 DOM 上。
 */
export default {
  components: {
    RightFloatingLayoutView,
    ruleManagementView,
    panelSettingsView,
    compatibleSettingView,
    lookContentDialog,
    PageProcessingTabsView,
    showImgDialog,
    sheetDialog,
    conditionalityView,
    overlaySettingsView,
    outputInformationView
  },
  data() {
    return {
      drawer: false,
      // 默认打开的tab
      tabsActiveName: GM_getValue('mainTabsActiveName', '规则管理'),
      isShowBackToTopVal: localMKData.isShowBackToTopBtn(),
      darkMode: GM_getValue('dark_mode', false)
    }
  },
  methods: {
    tabClick(tab) {
      GM_setValue('mainTabsActiveName', tab.name);
    },
    toggleDarkMode() {
      this.darkMode = !this.darkMode;
      GM_setValue('dark_mode', this.darkMode);
      document.body.classList.toggle('bb-dark', this.darkMode);
      eventEmitter.send('toggle-dark-mode', this.darkMode);
    }
  },
  watch: {
    darkMode(val) {
      document.body.classList.toggle('bb-dark', val);
    }
  },
  created() {
    eventEmitter.on('主面板开关', () => {
      this.drawer = !this.drawer;
    })
    document.addEventListener('keydown', (event) => {
      eventEmitter.emit('event-keydownEvent', event);
      if (event.key === getDrawerShortcutKeyGm()) {
        this.drawer = !this.drawer;
      }
    });

    eventEmitter.on('el-notify', (options) => {
      if (!options['position']) {
        options.position = 'bottom-right';
      }
      this.$notify(options)
    })
    eventEmitter.on('el-msg', (...options) => {
      this.$message(...options)
    })

    eventEmitter.on('el-alert', (...options) => {
      this.$alert(...options);
    })

    eventEmitter.handler('el-confirm', (...options) => {
      return this.$confirm(...options);
    })

    eventEmitter.handler('el-prompt', (...options) => {
      return this.$prompt(...options)
    })
    const alertFunDebounce = defUtil.debounce((response, bvId) => {
      this.$alert(`请求获取视频信息失败，状态码：${response.status}，bv号：${bvId}
                \n。已自动禁用根据bv号网络请求获取视频信息状态
                \n如需关闭，请在面板条件限制里手动关闭。`, '错误', {
        confirmButtonText: '确定',
        type: 'error'
      })
    }, 2000)
    eventEmitter.on('请求获取视频信息失败', (response, bvId) => {
      eventEmitter.send('更新根据bv号网络请求获取视频信息状态', true)
      alertFunDebounce(response, bvId)
    })

    eventEmitter.on('e:设置顶部按钮状态', (show) => {
      this.isShowBackToTopVal = show
    })

    eventEmitter.on('toggle-dark-mode', (val) => {
      this.darkMode = val;
      GM_setValue('dark_mode', val);
    });

    // 初始化深色模式
    if (this.darkMode) {
      document.body.classList.add('bb-dark');
    }
  }
}
</script>

<template>
  <div :class="{ 'theme-dark': darkMode }">
    <el-drawer :modal="false"
               :visible.sync="drawer"
               :with-header="false"
               direction="ltr"
               size="60%"
               style="position: fixed">
      <el-tabs v-model="tabsActiveName" type="border-card"
               @tab-click="tabClick">
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
        <el-tab-pane label="条件限制" lazy name="条件限制">
          <conditionalityView/>
        </el-tab-pane>
        <el-tab-pane label="叠加层设置" lazy name="叠加层设置">
          <overlaySettingsView/>
        </el-tab-pane>
        <el-tab-pane label="输出信息" lazy name="输出信息">
          <outputInformationView/>
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
/* ===========================================
   BiliBlockFusion — Main Panel & Theme System
   Clean modern design with dark mode support
   =========================================== */

/* ---- Drawer (main panel) ---- */
.el-drawer.ltr {
  background: #F5F6F8;
  border-right: 1px solid rgba(0, 0, 0, 0.05);
  top: 15%;
  height: 70%;
  border-radius: 0 12px 12px 0;
}

.el-drawer__body {
  padding: 0 16px 12px 16px;
}

/* ---- Tabs (border-card variant) ---- */
.el-tabs--border-card {
  background: #FFFFFF;
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 12px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.04);
}
.el-tabs--border-card > .el-tabs__header {
  background: #FFFFFF;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  margin: 0;
  position: sticky;
  top: 0;
  z-index: 10;
  border-radius: 12px 12px 0 0;
}

.el-tabs--border-card > .el-tabs__header .el-tabs__nav {
  border: none;
  border-radius: 0;
}

.el-tabs--border-card > .el-tabs__header .el-tabs__item {
  border: none;
  color: #9499A0;
  font-weight: 500;
  font-size: 13px;
  padding: 0 18px;
  height: 40px;
  line-height: 40px;
  transition: color 0.2s ease, background 0.2s ease;
}

.el-tabs--border-card > .el-tabs__header .el-tabs__item.is-active {
  color: #FB7299;
  background: #FFFFFF;
}

.el-tabs--border-card > .el-tabs__header .el-tabs__item:hover {
  color: #FB7299;
}

/* active tab indicator */
.el-tabs--border-card > .el-tabs__header .el-tabs__item.is-active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 12px;
  right: 12px;
  height: 2px;
  background: #FB7299;
  border-radius: 1px;
}

.el-tabs__content {
  padding: 16px;
}

/* ---- Cards ---- */
.el-card {
  border-radius: 10px !important;
  border: 1px solid rgba(0, 0, 0, 0.05) !important;
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.03) !important;
  background: #FFFFFF;
  margin-bottom: 12px;
}

.el-card__header {
  background: transparent;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  padding: 14px 16px;
  font-weight: 600;
  font-size: 14px;
  color: #18191C;
}

.el-card__body {
  padding: 16px;
}

/* ---- Buttons (global overrides inside panel) ---- */
.el-button {
  font-weight: 500;
  transition: all 0.2s ease;
}

.el-button--primary {
  background: linear-gradient(135deg, #FB7299 0%, #fc8aab 100%) !important;
  border-color: transparent !important;
  color: #fff !important;
  box-shadow: 0 2px 8px rgba(251, 114, 153, 0.25);
}

.el-button--primary:hover {
  background: linear-gradient(135deg, #FB7299 0%, #fd9bb7 100%) !important;
  box-shadow: 0 4px 14px rgba(251, 114, 153, 0.35);
}

/* ---- Radio buttons (segmented toggle) ---- */
.el-radio-button__inner {
  background: #FFFFFF;
  border-color: #DCDFE6;
  color: #606266;
}

.el-radio-button__inner:hover {
  color: #FB7299;
}

.el-radio-button.is-active .el-radio-button__inner {
  background: #FB7299;
  border-color: #FB7299;
  color: #FFFFFF;
  box-shadow: -1px 0 0 0 #FB7299;
}

/* ---- Switches ---- */
.el-switch__label.is-active {
  color: #FB7299;
}

.el-switch.is-checked .el-switch__core {
  border-color: #FB7299;
  background-color: #FB7299;
}

/* ---- Dividers ---- */
.el-divider__text {
  color: #9499A0;
  font-weight: 500;
}

/* ---- Dropdown ---- */
.el-dropdown-menu__item:hover {
  color: #FB7299;
  background: rgba(251, 114, 153, 0.06);
}

/* ---- Tooltips ---- */
.el-tooltip__popper {
  border-radius: 6px;
}

/* ---- Notifications ---- */
.el-notification {
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

/* ---- Inputs (light mode - explicit to beat Element UI cascade) ---- */
.el-input .el-input__inner,
.el-textarea .el-textarea__inner,
.el-cascader .el-input__inner,
.el-select .el-input__inner,
.el-date-editor .el-input__inner,
.el-range-editor .el-input__inner,
.el-input-number .el-input__inner {
  background-color: #FFFFFF;
  border-color: #DCDFE6;
  color: #18191C;
}

.el-input .el-input__inner:focus,
.el-textarea .el-textarea__inner:focus {
  border-color: #FB7299;
}

/* ---- Tables (light mode) ---- */
.el-table {
  background: #FFFFFF;
  color: #18191C;
}

.el-table th.el-table__cell {
  background: #F5F6F8;
  color: #18191C;
}

.el-table tr {
  background: #FFFFFF;
}

.el-table--striped .el-table__body tr.el-table__row--striped td {
  background: #FAFAFB;
}

/* ---- Collapse (light mode) ---- */
.el-collapse-item__header {
  background: #FFFFFF;
  border-bottom-color: rgba(0, 0, 0, 0.05);
  color: #18191C;
}

.el-collapse-item__wrap {
  background: #FFFFFF;
  border-bottom-color: rgba(0, 0, 0, 0.05);
}

.el-collapse-item__content {
  color: #9499A0;
}

/* ---- Dialog (light mode) ---- */
.el-dialog {
  background: #FFFFFF;
}

.el-dialog__header {
  color: #18191C;
}

.el-dialog__body {
  color: #18191C;
}

/* ---- Scrollbar ---- */
.el-drawer__body::-webkit-scrollbar {
  width: 5px;
}

.el-drawer__body::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.12);
  border-radius: 4px;
}

/* ---- Left-positioned tabs (light mode) ---- */
.el-tabs--left .el-tabs__item {
  color: #555;
  font-weight: 500;
}

.el-tabs--left .el-tabs__item.is-active {
  color: #FB7299;
}

.el-tabs--left .el-tabs__item:hover {
  color: #FB7299;
}

.el-tabs--left .el-tabs__active-bar {
  background-color: #FB7299;
}

.el-tabs--left .el-tabs__header {
  position: sticky;
  top: 0;
  align-self: flex-start;
}


/* ===========================================
   DARK MODE
   Scoped under .theme-dark (App root)
   and .bb-dark (body-level, for portals)
   =========================================== */

.theme-dark .el-drawer.ltr,
.bb-dark .el-drawer.ltr {
  background: #1A1B1E;
  border-right-color: rgba(255, 255, 255, 0.04);
  top: 15%;
  height: 70%;
  border-radius: 0 12px 12px 0;
}

/* Tabs */
.theme-dark .el-tabs--border-card,
.bb-dark .el-tabs--border-card {
  background: #212226;
  border-color: rgba(255, 255, 255, 0.05);
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.3);
}

.theme-dark .el-tabs--border-card > .el-tabs__header,
.bb-dark .el-tabs--border-card > .el-tabs__header {
  background: #212226;
  border-bottom-color: rgba(255, 255, 255, 0.05);
  border-radius: 12px 12px 0 0;
}

.theme-dark .el-tabs--border-card > .el-tabs__header .el-tabs__item,
.bb-dark .el-tabs--border-card > .el-tabs__header .el-tabs__item {
  color: #7A7A80;
}

.theme-dark .el-tabs--border-card > .el-tabs__header .el-tabs__item.is-active,
.bb-dark .el-tabs--border-card > .el-tabs__header .el-tabs__item.is-active {
  color: #FB7299;
  background: #212226;
}

.theme-dark .el-tabs--border-card > .el-tabs__header .el-tabs__item:hover,
.bb-dark .el-tabs--border-card > .el-tabs__header .el-tabs__item:hover {
  color: #FB7299;
}

/* Cards */
.theme-dark .el-card,
.bb-dark .el-card {
  background: #27282C !important;
  border-color: rgba(255, 255, 255, 0.05) !important;
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.25) !important;
  color: #D0D0D4;
}

.theme-dark .el-card__header,
.bb-dark .el-card__header {
  border-bottom-color: rgba(255, 255, 255, 0.05);
  color: #E8E8EA;
}

/* Text */
.theme-dark,
.bb-dark {
  color: #D0D0D4;
}

.theme-dark .el-text,
.bb-dark .el-text {
  color: #D0D0D4;
}

/* Dividers */
.theme-dark .el-divider__text,
.bb-dark .el-divider__text {
  color: #7A7A80;
}

/* Dropdowns */
.theme-dark .el-dropdown-menu,
.bb-dark .el-dropdown-menu {
  background: #2A2B2F;
  border-color: rgba(255, 255, 255, 0.06);
}

.theme-dark .el-dropdown-menu__item,
.bb-dark .el-dropdown-menu__item {
  color: #D0D0D4;
}

.theme-dark .el-dropdown-menu__item:hover,
.bb-dark .el-dropdown-menu__item:hover {
  background: rgba(251, 114, 153, 0.1);
}

/* Inputs */
.theme-dark .el-input__inner,
.bb-dark .el-input__inner {
  background: #2A2B2F;
  border-color: rgba(255, 255, 255, 0.08);
  color: #E8E8EA;
}

.theme-dark .el-input__inner:focus,
.bb-dark .el-input__inner:focus {
  border-color: #FB7299;
}

.theme-dark .el-input__inner::placeholder,
.bb-dark .el-input__inner::placeholder {
  color: #5A5A60;
}

/* Color picker */
.theme-dark .el-color-picker__trigger,
.bb-dark .el-color-picker__trigger {
  border-color: rgba(255, 255, 255, 0.1);
}

/* Tooltips */
.theme-dark .el-tooltip__popper,
.bb-dark .el-tooltip__popper {
  background: #2A2B2F;
  color: #D0D0D4;
}

/* Switches (keep pink accent in dark mode) */
.theme-dark .el-switch__label *,
.bb-dark .el-switch__label * {
  color: #D0D0D4;
}

/* Tabs content area */
.theme-dark .el-tab-pane,
.bb-dark .el-tab-pane {
  color: #D0D0D4;
}

/* Tags */
.theme-dark .el-tag,
.bb-dark .el-tag {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.08);
  color: #D0D0D4;
}

/* Floating panel dark mode */
.theme-dark .floating-panel,
.bb-dark .floating-panel {
  background: rgba(30, 31, 34, 0.88);
  border-color: rgba(255, 255, 255, 0.06);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.3),
    0 2px 8px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.theme-dark .panel-btn--secondary,
.bb-dark .panel-btn--secondary {
  background: rgba(251, 114, 153, 0.1);
  color: #fc8aab;
  border-color: rgba(251, 114, 153, 0.15);
}

.theme-dark .panel-btn--secondary:hover,
.bb-dark .panel-btn--secondary:hover {
  background: rgba(251, 114, 153, 0.18);
  box-shadow: 0 2px 10px rgba(251, 114, 153, 0.2);
  color: #FB7299;
}

/* Scrollbar in dark mode */
.theme-dark .el-drawer__body::-webkit-scrollbar-thumb,
.bb-dark .el-drawer__body::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
}

/* Notifications in dark mode */
.theme-dark .el-notification,
.bb-dark .el-notification {
  background: #2A2B2F;
  border-color: rgba(255, 255, 255, 0.06);
  color: #D0D0D4;
}

.theme-dark .el-notification__title,
.bb-dark .el-notification__title {
  color: #E8E8EA;
}

/* ---- Buttons in dark mode ---- */
.theme-dark .el-button--default,
.bb-dark .el-button--default {
  background: #2A2B2F;
  border-color: rgba(255, 255, 255, 0.08);
  color: #D0D0D4;
}

.theme-dark .el-button--default:hover,
.bb-dark .el-button--default:hover {
  background: #36373C;
  border-color: rgba(255, 255, 255, 0.15);
  color: #E8E8EA;
}

.theme-dark .el-button--default:active,
.bb-dark .el-button--default:active {
  background: #212226;
}

/* Message box / Alert in dark mode */
.theme-dark .el-message-box,
.bb-dark .el-message-box {
  background: #2A2B2F;
  border-color: rgba(255, 255, 255, 0.06);
}

.theme-dark .el-message-box__title,
.bb-dark .el-message-box__title {
  color: #E8E8EA;
}

.theme-dark .el-message-box__message,
.bb-dark .el-message-box__message {
  color: #D0D0D4;
}

.theme-dark .el-message-box__content,
.bb-dark .el-message-box__content {
  color: #D0D0D4;
}

/* Dialog in dark mode */
.theme-dark .el-dialog,
.bb-dark .el-dialog {
  background: #27282C;
}

.theme-dark .el-dialog__header,
.bb-dark .el-dialog__header {
  color: #E8E8EA;
}

.theme-dark .el-dialog__body,
.bb-dark .el-dialog__body {
  color: #D0D0D4;
}

/* Collapse in dark mode */
.theme-dark .el-collapse-item__header,
.bb-dark .el-collapse-item__header {
  background: #27282C;
  border-bottom-color: rgba(255, 255, 255, 0.05);
  color: #D0D0D4;
}

.theme-dark .el-collapse-item__wrap,
.bb-dark .el-collapse-item__wrap {
  background: #212226;
  border-bottom-color: rgba(255, 255, 255, 0.05);
}

.theme-dark .el-collapse-item__content,
.bb-dark .el-collapse-item__content {
  color: #9499A0;
}

/* Tables in dark mode */
.theme-dark .el-table,
.bb-dark .el-table {
  background: #212226;
  color: #D0D0D4;
}

.theme-dark .el-table th.el-table__cell,
.bb-dark .el-table th.el-table__cell {
  background: #1A1B1E;
  color: #D0D0D4;
}

.theme-dark .el-table tr,
.bb-dark .el-table tr {
  background: #212226;
}

.theme-dark .el-table--striped .el-table__body tr.el-table__row--striped td,
.bb-dark .el-table--striped .el-table__body tr.el-table__row--striped td {
  background: #27282C;
}

.theme-dark .el-table td.el-table__cell,
.bb-dark .el-table td.el-table__cell {
  border-bottom-color: rgba(255, 255, 255, 0.04);
}

.theme-dark .el-table__body tr:hover > td,
.bb-dark .el-table__body tr:hover > td {
  background: #2A2B2F;
}

/* Textarea in dark mode */
.theme-dark .el-textarea__inner,
.bb-dark .el-textarea__inner {
  background: #2A2B2F;
  border-color: rgba(255, 255, 255, 0.08);
  color: #E8E8EA;
}

/* Radio buttons in dark mode */
.theme-dark .el-radio-button__inner,
.bb-dark .el-radio-button__inner {
  background: #2A2B2F;
  border-color: rgba(255, 255, 255, 0.08);
  color: #D0D0D4;
}

.theme-dark .el-radio-button__inner:hover,
.bb-dark .el-radio-button__inner:hover {
  color: #FB7299;
}

.theme-dark .el-radio-button.is-active .el-radio-button__inner,
.bb-dark .el-radio-button.is-active .el-radio-button__inner {
  background: #FB7299;
  border-color: #FB7299;
  color: #FFFFFF;
  box-shadow: -1px 0 0 0 #FB7299;
}

/* Pagination in dark mode */
.theme-dark .el-pagination__total,
.theme-dark .el-pagination__jump,
.bb-dark .el-pagination__total,
.bb-dark .el-pagination__jump {
  color: #D0D0D4;
}

.theme-dark .el-pagination button,
.bb-dark .el-pagination button {
  background: #2A2B2F;
  color: #D0D0D4;
}

.theme-dark .el-pager li,
.bb-dark .el-pager li {
  background: #2A2B2F;
  color: #D0D0D4;
}

.theme-dark .el-pager li.active,
.bb-dark .el-pager li.active {
  background: #FB7299;
  color: #E8E8EA;
}

/* Select dropdown in dark mode */
.theme-dark .el-select-dropdown,
.bb-dark .el-select-dropdown {
  background: #2A2B2F;
  border-color: rgba(255, 255, 255, 0.06);
}

.theme-dark .el-select-dropdown__item,
.bb-dark .el-select-dropdown__item {
  color: #D0D0D4;
}

.theme-dark .el-select-dropdown__item.hover,
.bb-dark .el-select-dropdown__item.hover,
.theme-dark .el-select-dropdown__item:hover,
.bb-dark .el-select-dropdown__item:hover {
  background: rgba(251, 114, 153, 0.1);
}

.theme-dark .el-select-dropdown__item.selected,
.bb-dark .el-select-dropdown__item.selected {
  color: #FB7299;
}

/* ---- Cascader panel in dark mode ---- */
.theme-dark .el-cascader-panel,
.bb-dark .el-cascader-panel {
  background: #2A2B2F;
  border-color: rgba(255, 255, 255, 0.06);
}

.theme-dark .el-cascader-menu,
.bb-dark .el-cascader-menu {
  background: #2A2B2F;
  border-right-color: rgba(255, 255, 255, 0.06);
}

.theme-dark .el-cascader-menu__wrap,
.bb-dark .el-cascader-menu__wrap {
  background: #2A2B2F;
}

.theme-dark .el-cascader-node,
.bb-dark .el-cascader-node {
  color: #D0D0D4;
}

.theme-dark .el-cascader-node:not(.is-disabled):hover,
.bb-dark .el-cascader-node:not(.is-disabled):hover {
  background: rgba(251, 114, 153, 0.1);
}

.theme-dark .el-cascader-node.in-active-path,
.bb-dark .el-cascader-node.in-active-path,
.theme-dark .el-cascader-node.is-active,
.bb-dark .el-cascader-node.is-active,
.theme-dark .el-cascader-node.is-selectable.in-checked-path,
.bb-dark .el-cascader-node.is-selectable.in-checked-path {
  background: rgba(251, 114, 153, 0.12);
  color: #FB7299;
}

.theme-dark .el-cascader-node__label,
.bb-dark .el-cascader-node__label {
  color: #D0D0D4;
}

.theme-dark .el-cascader-node__prefix,
.bb-dark .el-cascader-node__prefix {
  color: #D0D0D4;
}

/* ---- Left-positioned tabs (tab-position="left") in dark mode ---- */
/* These use plain el-tabs (no border-card), matching PageProcessingTabsView style */

.theme-dark .el-tabs--left .el-tabs__header,
.bb-dark .el-tabs--left .el-tabs__header {
  background: #1A1B1E;
  border-right-color: rgba(255, 255, 255, 0.05);
}

.theme-dark .el-tabs--left .el-tabs__nav-wrap::after,
.bb-dark .el-tabs--left .el-tabs__nav-wrap::after {
  background-color: rgba(255, 255, 255, 0.05);
}

.theme-dark .el-tabs--left .el-tabs__item,
.bb-dark .el-tabs--left .el-tabs__item {
  color: #C0C0C8;
}

.theme-dark .el-tabs--left .el-tabs__item.is-active,
.bb-dark .el-tabs--left .el-tabs__item.is-active {
  color: #FB7299;
}

.theme-dark .el-tabs--left .el-tabs__item:hover,
.bb-dark .el-tabs--left .el-tabs__item:hover {
  color: #FB7299;
}

.theme-dark .el-tabs--left .el-tabs__active-bar,
.bb-dark .el-tabs--left .el-tabs__active-bar {
  background-color: #FB7299;
}

/* ---- Input-number buttons in dark mode ---- */
.theme-dark .el-input-number__decrease,
.bb-dark .el-input-number__decrease,
.theme-dark .el-input-number__increase,
.bb-dark .el-input-number__increase {
  background: #2A2B2F;
  color: #D0D0D4;
  border-color: rgba(255, 255, 255, 0.08);
}

.theme-dark .el-input-number__decrease:hover,
.bb-dark .el-input-number__decrease:hover,
.theme-dark .el-input-number__increase:hover,
.bb-dark .el-input-number__increase:hover {
  color: #FB7299;
}

/* ---- Button variants in dark mode ---- */
.theme-dark .el-button--info,
.bb-dark .el-button--info {
  background: #2A2B2F;
  border-color: rgba(255, 255, 255, 0.08);
  color: #D0D0D4;
}

.theme-dark .el-button--info:hover,
.bb-dark .el-button--info:hover {
  background: #36373C;
  border-color: rgba(255, 255, 255, 0.15);
  color: #E8E8EA;
}

.theme-dark .el-button--warning,
.bb-dark .el-button--warning {
  background: #3A3528;
  border-color: rgba(230, 162, 60, 0.3);
  color: #E6A23C;
}

.theme-dark .el-button--warning:hover,
.bb-dark .el-button--warning:hover {
  background: #4A3F2A;
  border-color: rgba(230, 162, 60, 0.5);
  color: #F0B84C;
}

.theme-dark .el-button--danger,
.bb-dark .el-button--danger {
  background: #3A2828;
  border-color: rgba(245, 108, 108, 0.3);
  color: #F56C6C;
}

.theme-dark .el-button--danger:hover,
.bb-dark .el-button--danger:hover {
  background: #4A2E2E;
  border-color: rgba(245, 108, 108, 0.5);
  color: #F78D8D;
}

/* ---- Slider in dark mode ---- */
.theme-dark .el-slider__runway,
.bb-dark .el-slider__runway {
  background: #36373C;
}

.theme-dark .el-slider__button,
.bb-dark .el-slider__button {
  border-color: #FB7299;
  background: #2A2B2F;
}

/* ---- Popconfirm in dark mode ---- */
.theme-dark .el-popconfirm,
.bb-dark .el-popconfirm {
  background: #2A2B2F;
  border-color: rgba(255, 255, 255, 0.06);
}

.theme-dark .el-popconfirm__title,
.bb-dark .el-popconfirm__title {
  color: #D0D0D4;
}
</style>
