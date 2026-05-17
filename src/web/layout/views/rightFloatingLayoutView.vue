<script>
import localMKData from "../../data/localMKData.js";
import {eventEmitter} from "../../model/EventEmitter.js";
import shieldingUserView from "./shieldingUserView.vue";

/**
 * 右侧悬浮布局
 */
export default {
  components: {
    shieldingUserView,
  },
  data() {
    return {
      //布局显示开关
      panelShow: localMKData.isShowRightTopMainButSwitch(),
    }
  },
  methods: {
    showBut() {
      eventEmitter.send('主面板开关')
    },
    handleMouseEnter() {
      this.$refs.divRef.style.transform = "translateX(0)";
    },
    handleMouseLeave() {
      this.$refs.divRef.style.transform = 'translateX(80%)'
    }
  },
  created() {
    eventEmitter.on('显隐主面板开关', (bool) => {
      this.panelShow = bool
    })
  },
  mounted() {
    this.$refs.divRef.style.transform = 'translateX(80%)'
  }
}
</script>

<template>
  <div v-show="panelShow" ref="divRef" class="floating-panel"
       @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave">
    <el-button class="panel-btn panel-btn--primary" round @click="showBut">
      主面板
    </el-button>
    <shieldingUserView/>
  </div>
</template>

<style scoped>
.floating-panel {
  position: fixed;
  z-index: 9000;
  right: 0;
  top: 13%;
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);

  /* glass morphism */
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-radius: 14px 0 0 14px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.06),
    0 2px 8px rgba(0, 0, 0, 0.03),
    inset 0 1px 0 rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(0, 0, 0, 0.05);

  padding: 10px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

/* primary action button */
.panel-btn {
  font-weight: 500;
  font-size: 13px;
  letter-spacing: 0.4px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
  padding: 8px 18px;
}

.panel-btn:hover {
  transform: translateY(-1px);
}

.panel-btn--primary {
  background: linear-gradient(135deg, #FB7299 0%, #fc8aab 100%);
  color: #fff;
  box-shadow: 0 2px 8px rgba(251, 114, 153, 0.3);
}

.panel-btn--primary:hover {
  background: linear-gradient(135deg, #FB7299 0%, #fd9bb7 100%);
  box-shadow: 0 4px 16px rgba(251, 114, 153, 0.4);
  color: #fff;
}

.panel-btn--primary:active {
  transform: translateY(0);
  box-shadow: 0 1px 4px rgba(251, 114, 153, 0.3);
}
</style>
