<script setup lang="ts">
/**
 * 主面板外壳（自控浮层，不使用 el-drawer）
 *
 * 为什么不用 el-drawer：EP 的抽屉内部有两套状态（modelValue 与 visible），
 * visible 由过渡钩子的 afterLeave 异步回写。外部逻辑一旦在 open/close 动画期间
 * 再次切换，两套状态就会分叉——表现为「点按钮没反应」「点几次才关」，
 * 以及动画期间的点击被忽略后残留一个看不见但拦住全页的遮罩。
 * 这里用单个 v-if 控制的普通容器取代它：开合只有一份布尔状态，不存在分叉。
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
/** 是否已挂载到 DOM（关闭动画结束后才卸载内容） */
const mounted = ref(props.modelValue);
/** 是否有打开态样式（用于驱动 CSS 过渡） */
const opened = ref(props.modelValue);
let closeTimer: ReturnType<typeof setTimeout> | null = null;

const clearCloseTimer = (): void => {
  if (closeTimer !== null) {
    clearTimeout(closeTimer);
    closeTimer = null;
  }
};

/** 打开：先挂载再在下一帧加打开类，保证 transition 从关闭态起算 */
const open = async (): Promise<void> => {
  clearCloseTimer();
  mounted.value = true;
  await nextTick();
  // 两帧：第一帧让浏览器算出关闭态，第二帧切到打开态才会真正产生过渡
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      opened.value = true;
    });
  });
};

/** 关闭：先切关闭态播过渡，过渡结束后卸载 */
const close = (): void => {
  clearCloseTimer();
  opened.value = false;
  closeTimer = setTimeout(() => {
    mounted.value = false;
    closeTimer = null;
    emit('closed');
  }, props.duration);
};

const requestClose = (): void => {
  if (!props.modelValue) return;
  emit('update:modelValue', false);
};

watch(() => props.modelValue, (value) => {
  if (value) void open();
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
});

defineExpose({panelRef});
</script>

<template>
  <Teleport to="body">
    <div v-if="mounted"
         ref="panelRef"
         class="gz-panel"
         :class="{'gz-panel--opened': opened}"
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
  /* 与 PanelShell 的 duration 保持一致 */
  --gz-panel-duration: 260ms;
  --gz-panel-curve: cubic-bezier(0.33, 0, 0.67, 1);
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
