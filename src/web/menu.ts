import {eventEmitter} from "./core/EventEmitter.ts";

// 油猴菜单只保留「打开主面板」一项。
// 更新页 / 反馈群 / 常见问题 / 更新日志等链接在面板「关于 → 关于与反馈」中已有入口，
// 不必再占用脚本菜单（面板内还有可自定义的快捷键与右侧悬浮按钮两条打开路径）。
GM_registerMenuCommand('主面板', () => {
    eventEmitter.send('主面板开关')
}, 'Q')
