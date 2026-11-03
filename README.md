# BiliBlockFusion

B 站内容过滤油猴脚本，基于 [BiBiBSPUserVideoMonkeyScript](https://github.com/hgztask/BiBiBSPUserVideoMonkeyScript) 二次开发。

## 安装

安装 Tampermonkey 或脚本猫，导入 `dist/BiliBlockFusion.user.js`。按 `` ` `` 键打开主面板。

## 更新

**v1.3.0**

- 面板顶层页签从 8 个收敛为 5 个：规则 / 页面 / AI 规则 / 高级 / 诊断与关于
- 新增「AI 规则」页：填一句需求 → 复制自动生成的完整 Prompt → 发给任意 AI →
  把返回的 JSON 粘回来 → 校验预览 → 一键应用，支持撤销
- 修复面板关闭再打开后，屏蔽日志等面板内事件监听不再更新的问题
- 修复替换处理总开关不保存的问题，移除直播分区页无效的侧边栏开关

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