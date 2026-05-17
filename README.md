# BiliBlockFusion

Bilibili 综合内容过滤油猴脚本，基于 [BiBiBSPUserVideoMonkeyScript](https://github.com/hgztask/BiBiBSPUserVideoMonkeyScript) 二次开发，融合了 [bilibili_blocked_videos_by_tags](https://github.com/tjxwork/bilibili_blocked_videos_by_tags) 的叠加层屏蔽等特性。

[![Greasy Fork](https://img.shields.io/badge/Greasy%20Fork-安装-blue?style=flat-square)](https://greasyfork.org/zh-CN/scripts/578590-biliblockfusion)

## 功能

### 内容屏蔽

- **视频** — 按标题、UP 主、标签、分区、时长、播放量、收藏/投币比等屏蔽
- **评论** — 按关键词、用户等级、字数限制、装扮/装饰屏蔽；支持仅看硬核会员
- **动态** — 按关键词、UP 主屏蔽动态流
- **热搜** — 屏蔽搜索框热搜榜单中的匹配项
- **用户空间** — 按签名内容屏蔽用户

### 屏蔽模式

- **叠加层模式** — 匹配内容覆盖半透明遮罩并显示屏蔽原因
- **隐藏模式** — 匹配内容直接 `display:none`
- **非视频元素隐藏** — 隐藏首页/搜索/播放页的广告及推广卡片

### 匹配方式

精确匹配 / 模糊匹配 / 正则匹配

### 辅助功能

- 白名单 UP 主
- 一键屏蔽按钮（悬停 UP 名/标签时弹出）
- 规则 JSON 导入/导出
- IndexedDB 本地缓存视频信息
- 旧版本脚本设置自动迁移

## 安装

1. 安装 [Tampermonkey](https://www.tampermonkey.net/) 浏览器扩展
2. 前往 [Greasy Fork](https://greasyfork.org/zh-CN/scripts/578590-biliblockfusion) 点击「安装此脚本」
3. 或者将 `dist/BiliBlockFusion.user.js` 的全部内容复制到 Tampermonkey 新建脚本中

## 使用

安装后访问 Bilibili，按 `Q` 键或点击 Tampermonkey 菜单中的「主面板」打开设置面板。

## 开发

```bash
npm install
npm run build        # 生产构建 → dist/BiliBlockFusion.user.js
npm run watch:dev    # 开发模式（热更新 + 本地服务器）
```

### 技术栈

Vue 2.7 + Element UI / Rollup + esbuild / Dexie.js (IndexedDB) / EventEmitter

## 相关项目

| 项目 | 说明 |
|------|------|
| [BiBiBSPUserVideoMonkeyScript](https://github.com/hgztask/BiBiBSPUserVideoMonkeyScript) | 主架构来源 |
| [bilibili_blocked_videos_by_tags](https://github.com/tjxwork/bilibili_blocked_videos_by_tags) | 覆盖层模式参考来源 |

## 许可证

Apache-2.0 — 详见 [LICENSE](LICENSE)。

来源项目：

- BiBiBSPUserVideoMonkeyScript — [Apache-2.0](https://github.com/hgztask/BiBiBSPUserVideoMonkeyScript/blob/main/LICENSE)
- bilibili_blocked_videos_by_tags — 未标明开源协议
