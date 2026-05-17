<script>
import globalValue from "../../data/globalValue.js";
import localMKData from "../../data/localMKData.js";

export default {
  data() {
    return {
      //是否兼容BewlyBewly插件
      compatible_BEWLY_BEWLY: globalValue.compatibleBEWLYBEWLY,
      //是否全部兼容新版评论区
      discardOldCommentAreasV: localMKData.isDiscardOldCommentAreas()
    }
  },
  watch: {
    compatible_BEWLY_BEWLY(newVal) {
      //设置是否兼容BewlyBewly插件
      GM_setValue("compatible_BEWLY_BEWLY", newVal === true)
    },
    discardOldCommentAreasV(newVal) {
      GM_setValue("discardOldCommentAreas", newVal === true)
    }
  }
}
</script>

<template>
  <div>
    <el-card>
      <template #header>说明</template>
      <div>如果用户没有安装并使用对应脚本或插件，就不要开启相关兼容选项</div>
    </el-card>
    <el-card>
      <template #header>Bewly插件(BewlyCat)原BewlyBewly</template>
      <div>
        兼容BewlyCat的版本可看使用文档，不往前兼容
      </div>
      <el-switch v-model="compatible_BEWLY_BEWLY" active-text="首页适配"/>
    </el-card>
    <el-card>
      <template #header>评论区</template>
      使用之后需刷新对应页面才可生效，勾选即评论区使用新版获取方式，不再使用旧版方式
      <div>
        <el-switch v-model="discardOldCommentAreasV" active-text="弃用旧版评论区处理"/>
      </div>
    </el-card>
  </div>
</template>
