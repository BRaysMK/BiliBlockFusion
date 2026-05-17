import localMKData from "../data/localMKData.js";
import defCss from '../css/def.css'
import {addGzStyle, initVueApp} from "../utils/defUtil.js";
import App from "./App.vue";
import elUtil from "../utils/elUtil.js";
import cssManager from "../model/cssManager.js";
import Vue from "vue";
import GzSpace from "./components/GzSpace.vue";
import GzText from "./components/GzText.vue";

const initVueUI = () => {
    if (document.head.querySelector('#element-ui-css') === null) {
        const linkElement = document.createElement('link');
        linkElement.rel = 'stylesheet';
        linkElement.href = 'https://unpkg.com/element-ui@2.15.14/lib/theme-chalk/index.css'
        linkElement.id = 'element-ui-css'
        document.head.appendChild(linkElement)
        linkElement.addEventListener('load', () => {
            console.log('element-ui样式加载完成')
        })
    }
    const {vueDiv} = elUtil.createVueDiv(document.body);
    window.mk_vue_app = initVueApp(vueDiv, App);
    Vue.component('gz-space', GzSpace)
    Vue.component('gz-text', GzText)
    addGzStyle(document);
    cssManager.updateCssVModal();
}

// BewlyBewly 会在 DOMContentLoaded 时清空 body.innerHTML，
// 需等它创建 #bewly 后再挂载 Vue UI，否则会被清除
if (window.___inject && /www\.bilibili\.com\/\?page=/.test(location.href)) {
    const tryInit = () => {
        if (document.querySelector('#bewly')) {
            initVueUI()
        } else {
            setTimeout(tryInit, 100)
        }
    }
    setTimeout(tryInit, 200)
} else {
    window.addEventListener('DOMContentLoaded', initVueUI)
}

GM_addStyle(defCss)
