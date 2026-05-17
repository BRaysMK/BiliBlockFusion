<script>
import localMKData, {
  isOverlayMode,
  isHideVideoMode,
  isHideNonVideoElements,
  isBlockTrending,
  isHideBlockedWords,
  isConsoleOutputLog,
  getOverlayOnlyType,
  getBlockedTrendingItems,
  isTrendingUseRegex
} from "../../data/localMKData.js";
import { exportSettings, importSettings } from "../../utils/settingsIO.js";

export default {
  data() {
    return {
      hideVideoModeVal: isHideVideoMode(),
      hideNonVideoElementsVal: isHideNonVideoElements(),
      blockTrendingVal: isBlockTrending(),
      hideBlockedWordsVal: isHideBlockedWords(),
      consoleOutputLogVal: isConsoleOutputLog(),
      overlayOnlyTypeVal: getOverlayOnlyType(),
      blockedTrendingItemsVal: getBlockedTrendingItems().join('\n'),
      trendingUseRegexVal: isTrendingUseRegex(),
    }
  },
  methods: {
    async handleExport() {
      const result = exportSettings();
      if (result.success) {
        this.$message.success(result.message);
      } else {
        this.$message.error(result.message);
      }
    },
    async handleImport() {
      const result = await importSettings();
      if (result.success) {
        this.$message.success(result.message);
      } else {
        this.$message.error(result.message);
      }
    },
    updateTrendingItems() {
      const items = this.blockedTrendingItemsVal
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      GM_setValue('blocked_trending_items', items);
      this.$message.success('热搜屏蔽项已更新');
    },
  },
  watch: {
    hideVideoModeVal(newVal) {
      GM_setValue('hide_video_mode', newVal);
    },
    hideNonVideoElementsVal(newVal) {
      GM_setValue('hide_non_video_elements', newVal);
    },
    blockTrendingVal(newVal) {
      GM_setValue('block_trending', newVal);
    },
    hideBlockedWordsVal(newVal) {
      GM_setValue('hide_blocked_words', newVal);
    },
    consoleOutputLogVal(newVal) {
      GM_setValue('console_output_log', newVal);
    },
    overlayOnlyTypeVal(newVal) {
      GM_setValue('overlay_only_type', newVal);
    },
    trendingUseRegexVal(newVal) {
      GM_setValue('trending_use_regex', newVal);
    },
  }
}
</script>

<template>
  <div>
    <el-card shadow="never">
      <template #header><span>屏蔽方式</span></template>
      <div style="margin-bottom:10px;">
        <el-radio-group v-model="hideVideoModeVal" size="small">
          <el-radio-button :label="false">叠加层模式</el-radio-button>
          <el-radio-button :label="true">隐藏模式</el-radio-button>
        </el-radio-group>
      </div>
      <el-tooltip content="叠加层上仅显示屏蔽类型，不显示具体匹配词">
        <el-switch v-model="overlayOnlyTypeVal" active-text="叠加层仅显示类型"/>
      </el-tooltip>
    </el-card>

    <el-card shadow="never">
      <template #header><span>页面元素</span></template>
      <el-tooltip content="隐藏首页/搜索页/播放页的广告、直播、课堂等非视频卡片">
        <el-switch v-model="hideNonVideoElementsVal" active-text="隐藏非视频元素"/>
      </el-tooltip>
      <el-tooltip content="隐藏首页热搜榜中被规则匹配的条目">
        <el-switch v-model="blockTrendingVal" active-text="屏蔽热搜项"/>
      </el-tooltip>
      <el-tooltip content="在屏蔽区域隐藏匹配到的屏蔽词显示">
        <el-switch v-model="hideBlockedWordsVal" active-text="隐藏屏蔽词"/>
      </el-tooltip>
    </el-card>

    <el-card shadow="never" v-if="blockTrendingVal">
      <template #header><span>热搜屏蔽设置</span></template>
      <el-tooltip content="启用后热搜项匹配使用正则表达式">
        <el-switch v-model="trendingUseRegexVal" active-text="启用正则匹配"/>
      </el-tooltip>
      <div style="margin-top: 12px;">
        <div>热搜屏蔽项（每行一个）：</div>
        <el-input
          v-model="blockedTrendingItemsVal"
          type="textarea"
          :rows="5"
          placeholder="每行输入一个热搜屏蔽词"
          @blur="updateTrendingItems"
        />
      </div>
    </el-card>

    <el-card shadow="never">
      <template #header><span>调试</span></template>
      <el-tooltip content="在浏览器控制台输出屏蔽日志">
        <el-switch v-model="consoleOutputLogVal" active-text="控制台输出日志"/>
      </el-tooltip>
    </el-card>

    <el-card shadow="never">
      <template #header><span>设置导入/导出</span></template>
      <el-button type="primary" @click="handleExport">导出设置 (JSON)</el-button>
      <el-button type="warning" @click="handleImport">导入设置 (JSON)</el-button>
    </el-card>
  </div>
</template>
