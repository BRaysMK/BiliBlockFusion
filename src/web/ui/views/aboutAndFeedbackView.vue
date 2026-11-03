<script setup lang="ts">
import globalValue from "../../config/globalValue.ts";
import {eventEmitter} from "@/core/EventEmitter.ts";
import SettingRow from '../components/SettingRow.vue';
import SettingGroup from '../components/SettingGroup.vue';

/**
 * 关于与反馈
 *
 * 本仓库是原作者脚本的二次开发版本，两者的反馈渠道完全不同：
 * 本仓库的问题提到 GitHub Issues，原作者那边的问题去 Q 群 / 原发布页。
 * 混在一张卡片里会让人把二次开发的问题拿去打扰原作者。
 */
const repo_url = globalValue.repo_url;
const issues_url = globalValue.issues_url;
const group_url = globalValue.group_url;
const scriptCat_js_url = globalValue.scriptCat_js_url;
const original_b_url = globalValue.original_b_url;
const original_gitee_url = globalValue.original_gitee_url;
const original_github_url = globalValue.original_github_url;
const original_greasyfork_url = globalValue.original_greasyfork_url;
const common_question_url = globalValue.common_question_url;
const update_log_url = globalValue.update_log_url;

const lookImgBut = () => {
  eventEmitter.send('显示图片对话框', {image: "https://www.mikuchase.ltd/img/qq_group_876295632.webp"});
};
</script>
<template>
  <SettingGroup description="二次开发版，维护者 BRaysMK。问题请提到 GitHub Issues"
                title="本脚本（BiliBlockFusion）">
    <SettingRow label="GitHub 仓库">
      <el-link :href="repo_url" target="_blank" type="primary">打开</el-link>
    </SettingRow>
    <SettingRow label="问题反馈">
      <el-link :href="issues_url" target="_blank" type="primary">Issues</el-link>
    </SettingRow>
    <SettingRow label="脚本猫安装页">
      <el-link :href="scriptCat_js_url" target="_blank" type="primary">打开</el-link>
    </SettingRow>
  </SettingGroup>

  <SettingGroup description="原始版本，维护者 hgztask。与本仓库的规则与代码已有较大差异" title="原作者（BiBiBSPUserVideoMonkeyScript）">
    <SettingRow label="作者 B 站主页">
      <el-link :href="original_b_url" target="_blank" type="primary">打开</el-link>
    </SettingRow>
    <SettingRow label="交流群">
      <el-link :href="group_url" target="_blank" type="primary">Q 群</el-link>
      <el-tag class="gz-about__group-code" size="small" title="点击查看群二维码" @click="lookImgBut">876295632</el-tag>
    </SettingRow>
    <SettingRow label="GreasyFork 发布页">
      <el-link :href="original_greasyfork_url" target="_blank" type="primary">打开</el-link>
    </SettingRow>
    <SettingRow label="原仓库">
      <el-link :href="original_github_url" target="_blank" type="primary">GitHub</el-link>
      <el-link :href="original_gitee_url" target="_blank" type="primary">Gitee</el-link>
    </SettingRow>
  </SettingGroup>

  <SettingGroup title="文档">
    <SettingRow label="常见问题">
      <el-link :href="common_question_url" target="_blank" type="primary">打开</el-link>
    </SettingRow>
    <SettingRow label="更新日志">
      <el-link :href="update_log_url" target="_blank" type="primary">打开</el-link>
    </SettingRow>
  </SettingGroup>
</template>

<style scoped>
.gz-about__group-code {
  cursor: pointer;
  font-family: var(--fluent-font-family-monospace);
}
</style>
