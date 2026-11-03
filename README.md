# BiliBlockFusion

B 站内容过滤油猴脚本，基于 [BiBiBSPUserVideoMonkeyScript](https://github.com/hgztask/BiBiBSPUserVideoMonkeyScript) 二次开发。

## 安装

安装 Tampermonkey 或脚本猫，导入 `dist/BiliBlockFusion.user.js`。按 `` ` `` 键打开主面板。

## 更新

**v2.0.0**

- 修复打开「诊断与关于」页签时主线程卡死：日志类事件缓存封顶 300 条，
  日志列表同步封顶，去掉每条日志常驻的下拉浮层（实测长任务 1147ms → 0）
- 新增「AI 规则」页：填一句需求 → 复制自动生成的完整 Prompt → 发给任意 AI →
  把返回的 JSON 粘回来 → 校验预览 → 一键应用，支持撤销
- 恢复面板主题的亮色 / 自动 / 暗色三档切换
- 面板顶层页签收敛为 5 个：规则 / 页面 / AI 规则 / 高级 / 诊断与关于
- 页面与高级面板改为设置行 + 分组，长篇说明收进 ⓘ 图标气泡
- 修复等级限制无法修改数值、反复弹违规提示
- 修复直播分区白名单无法删除分区、两个页面元素开关未接线
- 修复面板关闭再打开后，屏蔽日志等面板内事件监听不再更新的问题
- 删除不参与屏蔽的「弹幕词管理」；关于页区分原作者与本仓库维护者
- 适配新版 BewlyCat 卡片结构；关闭兼容开关后正确退回原生首页链路并给出提示

**v1.2.0**

- 适配新版 BewlyCat 卡片结构，修复屏蔽失效
- 屏蔽方式改为三态：移除 / 叠加层 / 隐藏
- 修复移除卡片后留下的空白，后续卡片能顶上来
- 补齐 BV 去重与增量扫描，降低轮询开销
- 面板改用 Fluent 2 设计令牌
- 修复面板无法滚动、抽屉开合抽搐

**v1.1.0**

- 修复性能问题
- 改进 BewlyBewly 下隐藏模式的空白

## 开发

```bash
pnpm install
pnpm build:release   # 产出 dist-release/publish.user.js
pnpm test
```

## 许可证

Apache-2.0