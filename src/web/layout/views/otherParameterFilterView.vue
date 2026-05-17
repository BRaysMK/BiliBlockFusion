<script>
import externalList from "../../res/otherKeyListDataJson.json";
import commentWordLimitView from "./commentWordLimitView.vue";
import UserLevelFilteringView from "./other-parameter-filter/UserLevelFilteringView.vue";
import SwitchMinMaxInputCard from "../components/SwitchMinMaxInputCard.vue";

/**
 * 其他规则组件
 */
export default {
  components: {SwitchMinMaxInputCard, commentWordLimitView, UserLevelFilteringView},
  data() {
    return {
      externalList
    }
  }
}
</script>

<template>
  <div class="other-param-container">
    <div class="other-param-hint">时长单位秒，-1 表示不做限制。最小值 → 低于此值屏蔽，最大值 → 高于此值屏蔽</div>
    <UserLevelFilteringView/>
    <div style="display: flex;">
      <switch-min-max-input-card v-for="v in externalList" :key="v.title"
                                 :is-max-key="v.isMaxKey"
                                 :is-min-key="v.isMinKey"
                                 :max-def-val="v.maxDefVal"
                                 :max-input-key="v.maxInputKey"
                                 :min-def-val="v.minDefVal"
                                 :min-input-key="v.minInputKey"
                                 :title="v.title"/>
    </div>
    <commentWordLimitView/>
  </div>
</template>

<style>
/* ---- otherParameterFilterView ---- */
/* unscoped; wrapper .other-param-container for isolation */

.other-param-container .other-param-hint {
  font-size: 12px;
  color: #9499A0;
  margin-bottom: 10px;
  line-height: 1.6;
}
</style>
