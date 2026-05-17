import Vue from "vue";
import elUtil from "../utils/elUtil.js";
import urlUtil from "../utils/urlUtil.js";
import debuggerManagement from "../model/debuggerManagement.js";
import {eventEmitter} from "../model/EventEmitter.js";

Vue.directive('test', {
    // 指令的定义
    bind: function (el, binding) {
        console.log(el, binding)
        debugger;
    }
})

unsafeWindow.mk_window = window;
unsafeWindow.elUtil = elUtil;
unsafeWindow.urlUtil = urlUtil;
