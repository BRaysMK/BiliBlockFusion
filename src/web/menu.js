import {eventEmitter} from "./model/EventEmitter.js";

GM_registerMenuCommand('主面板', () => {
    eventEmitter.send('主面板开关')
}, 'Q')
