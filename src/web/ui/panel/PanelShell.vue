<script setup lang="ts">
/**
 * 主面板外壳（自控浮层，不使用 el-drawer）
 *
 * 为什么不用 el-drawer：EP 的抽屉内部有两套状态（modelValue 与 visible），
 * visible 由过渡钩子的 afterLeave 异步回写。外部逻辑一旦在 open/close 动画期间
 * 再次切换，两套状态就会分叉——表现为「点按钮没反应」「点几次才关」，
 * 以及动画期间的点击被忽略后残留一个看不见但拦住全页的遮罩。
 * 这里用单个布尔状态 + CSS 过渡取代它：开合只有一份状态，不存在分叉。
 *
 * 为什么内容首次打开后永不卸载：EventEmitter.on 对同名事件是静默忽略重复注册的
 * （见 core/EventEmitter.ts）。一旦卸载，视图里那些 eventEmitter.on(...) 的注册
 * 在重开时就变成了空操作，旧闭包仍指向已销毁的实例——屏蔽日志、刷新规则信息
 * 等监听会永久失效。所以这里只用 visibility 控制可见性，DOM 保持不动。
 *
 * 关闭方式只有三种，全部显式：点面板外空白、按快捷键、点悬浮按钮。
 * 不做焦点陷阱、不锁 body 滚动——面板是常驻浮层，锁滚动会让整页失效。
 */
import {nextTick, onBeforeUnmount, onMounted, ref, watch} from 'vue';

const props = withDefaults(defineProps<{
  /** 面板是否打开（v-model） */
  modelValue: boolean;
  /** 关闭动画时长，需与 CSS 的 --gz-panel-duration 保持一致 */
  duration?: number;
}>(), {
  duration: 260,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'closed'): void;
}>();

/** 面板根节点：空白点击判定以它为准 */
const panelRef = ref<HTMLElement | null>(null);
/** 是否已挂载过：首次打开才创建 DOM，之后不再卸载 */
const everMounted = ref(props.modelValue);
/** 是否有打开态样式（用于驱动 CSS 过渡） */
const opened = ref(props.modelValue);

let closeTimer: ReturnType<typeof setTimeout> | null = null;
/** 打开令牌：关闭时自增，作废尚未执行的两帧回调，避免关掉后又被打开帧点亮 */
let openToken = 0;

const clearCloseTimer = (): void => {
  if (closeTimer !== null) {
    clearTimeout(closeTimer);
    closeTimer = null;
  }
};

const open = async (): Promise<void> => {
  clearCloseTimer();
  everMounted.value = true;
  const token = ++openToken;
  await nextTick();
  // 读一次布局强制回流：先让浏览器算出关闭态，再切到打开态才会真正产生过渡。
  // 不用双 rAF——后台标签页里 rAF 不触发，面板会一直停在关闭态。
  if (panelRef.value !== null) void panelRef.value.offsetWidth;
  if (token === openToken && props.modelValue) opened.value = true;
};

const close = (): void => {
  openToken++;
  clearCloseTimer();
  opened.value = false;
  closeTimer = setTimeout(() => {
    closeTimer = null;
    emit('closed');
  }, props.duration);
};

const requestClose = (): void => {
  if (!props.modelValue) return;
  emit('update:modelValue', false);
};

watch(() => props.modelValue, (value) => {
  if (value) open();
  else close();
}, {immediate: true});

/**
 * 点击面板外空白关闭
 *
 * 用 mousedown 并挂在捕获阶段：B 站页面自身也有大量点击处理（视频卡片、顶部导航），
 * 冒泡阶段监听会被它们的 preventDefault/stopPropagation 干扰。
 */
const onDocumentMouseDown = (event: MouseEvent): void => {
  if (!props.modelValue) return;
  const target = event.target as HTMLElement | null;
  if (target === null || panelRef.value === null) return;
  // 面板本体内部 → 不关闭
  if (panelRef.value.contains(target)) return;
  // EP 浮层（下拉/气泡/消息框/子抽屉）被 teleport 到 body 下，不在面板 DOM 内，
  // 需要单独放行，否则点下拉选项会把整个面板关掉
  if (target.closest('.el-popper, .el-overlay, .el-message-box, .el-message, .el-notification') !== null) return;
  // 悬浮开关按钮有自己的开关逻辑，交给它处理，避免一次点击触发两次切换
  if (target.closest('.gz-float-btn') !== null) return;
  requestClose();
};

onMounted(() => {
  document.addEventListener('mousedown', onDocumentMouseDown, true);
});

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onDocumentMouseDown, true);
  clearCloseTimer();
  openToken++;
});

defineExpose({panelRef});
</script>

<template>
  <Teleport to="body">
    <div v-if="everMounted"
         ref="panelRef"
         class="gz-panel"
         :class="{'gz-panel--opened': opened}"
         :aria-hidden="!opened"
         role="dialog"
         aria-modal="false">
      <div class="gz-panel__surface">
        <slot/>
      </div>
    </div>
  </Teleport>
</template>

<style>
/* 浮层定位：宽 60%、高 70%、距顶 15%、贴左。整层 pointer-events:none，
   只有面板本体接收事件，页面其余部分照常可点。 */
.gz-panel {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9001;
  pointer-events: none;
  /* 关闭态不可见、不可聚焦；延迟到滑出动画播完再隐藏，否则内容会在滑动中消失 */
  visibility: hidden;
  transition: visibility 0s linear var(--gz-panel-duration);
  /* 与 PanelShell 的 duration 保持一致 */
  --gz-panel-duration: 260ms;
  --gz-panel-curve: cubic-bezier(0.33, 0, 0.67, 1);
}

.gz-panel--opened {
  visibility: visible;
  transition-delay: 0s;
}

.gz-panel__surface {
  position: absolute;
  top: 15%;
  left: 0;
  width: 60%;
  height: 70%;
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 0 var(--fluent-border-radius-x-large) var(--fluent-border-radius-x-large) 0;
  box-shadow: var(--fluent-shadow-64, 0 32px 64px rgba(0, 0, 0, 0.24));
  background: var(--fluent-color-neutral-background-2);
  border-right: 1px solid var(--fluent-color-neutral-stroke-2);
  /* 关闭态：滑出视口左侧 */
  transform: translateX(-100%);
  opacity: 0;
  transition: transform var(--gz-panel-duration) var(--gz-panel-curve),
              opacity var(--gz-panel-duration) var(--gz-panel-curve);
}

.gz-panel--opened .gz-panel__surface {
  transform: translateX(0);
  opacity: 1;
}

/* 面板内部滚动容器：面板本体固定高度，内容在自己内部滚动 */
.gz-panel__surface > .gz-panel__content {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
}

@media (prefers-reduced-motion: reduce) {
  .gz-panel__surface {
    transition-duration: 0ms;
  }
}
</style>
