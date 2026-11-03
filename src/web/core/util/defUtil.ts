import gzStyleCss from '../../ui/styles/gz-style.css?raw'
import {createApp, type App as VueApp} from "vue";
import ElementPlus from "element-plus";
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import {valueCache} from "../cache/valueCache.ts";

/**
 * 等待一段时间
 * @param milliseconds{Number} 等待时间，单位毫秒，默认1000毫秒，即1秒
 * @returns {Promise<>}
 */
const wait = (milliseconds: number = 1000): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

/**
 * 内容导出为文件
 * @param {String}content 内容
 * @param {String}fileName 文件名
 */
const fileDownload = (content: string, fileName: string): void => {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
    element.setAttribute('download', fileName);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

/**
 * 保存大文本到文件
 * @param text {string} 文本内容
 * @param filename {string} 文件名
 */
export function saveTextAsFile(text: string, filename: string = 'data.txt'): void {
    const blob = new Blob([text], {type: 'text/plain'});
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = filename;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    setTimeout(() => {
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(downloadLink.href ?? '');
    }, 100);
}

/**
 *封装file标签handle的回调，用于读取文件内容
 * @param event
 * @returns {Promise<{any,content:string|string}>}
 */
const handleFileReader = (event: Event): Promise<{ file: File; content: string }> => {
    return new Promise((resolve, reject) => {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];
        if (!file) {
            reject('未读取到文件');
            return;
        }
        let reader = new FileReader();
        reader.onload = (e) => {
            const fileContent = e.target?.result as string;
            resolve({file, content: fileContent});
            reader = null as any;
        };
        reader.readAsText(file);
    });
}

/** 判断对象是否可迭代（array / string / map / set / 类数组） */
const isIterable = (obj: any): boolean => {
    return obj != null && typeof obj[Symbol.iterator] === 'function';
}

/** 返回当前时间字符串 */
const toTimeString = (): string => {
    return new Date().toLocaleString();
}

/**
 * 防抖函数
 * @param func {function} 需要防抖的函数
 * @param wait {number} 等待时间，单位毫秒，默认为 1000毫秒
 * @returns {(function(...[*]): void)|*}
 */
function debounce<T extends (...args: any[]) => any>(func: T, wait: number = 1000): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    return function (this: any, ...args: Parameters<T>) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

/**
 *  节流函数
 * @param func {function} 需要节流的函数
 * @param limit {number} 节流时间，单位毫秒
 * @returns {(function(...[*]): void)|*}
 */
function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return function (this: any, ...args: Parameters<T>) {
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}


/**
 *获取localStorage指定key数据
 * 如Key不存在则返回默认值
 * 如指定isList为true,则返回数组
 * @param key {string}
 * @param isList {boolean} 是否是数组
 * @param defaultValue {any}
 * @returns {any|string|boolean|number|[]}
 */
const getLocalStorage = <T = any>(key: string, isList: boolean = false, defaultValue: T | null = null): T | string | null => {
    const item = localStorage.getItem(key);
    if (item === null) {
        return defaultValue as any
    }
    if (isList) {
        try {
            return JSON.parse(item)
        } catch (e) {
            console.error(`读取localStorage时尝试转换${key}的值失败`, e)
            return defaultValue as any
        }
    }
    return item
}

interface FormatTimestampOptions {
    format?: string;
    timezone?: number;
    returnObject?: boolean;
}

interface TimeObject {
    year: number;
    month: number;
    day: number;
    hours: number;
    minutes: number;
    seconds: number;
}

/**
 * 时间戳转时间字符串 (增强版)
 * @param {number|string} timestamp - 支持10位(秒)/13位(毫秒)/字符串数字
 * @param {object} [options] - 配置项
 * @param {string} [options.format='YYYY-MM-DD HH:mm:ss'] - 输出格式，可选标记：
 *    YYYY/YY: 年, MM/M: 月, DD/D: 日, HH/H: 时, mm/m: 分, ss/s: 秒
 * @param {number} [options.timezone] - 时区偏移(小时)，如 +8 或 -5
 * @param {boolean} [options.returnObject=false] - 是否返回时间对象
 * @returns {string|object} 格式化时间字符串 或 时间对象 {year,month,day...}
 */
const formatTimestamp = (timestamp: number | string, options: FormatTimestampOptions = {}): string | TimeObject => {
    if (!timestamp || isNaN(Number(timestamp))) return 'Invalid Timestamp'
    const ts = String(timestamp).length === 10 ? +timestamp * 1000 : +timestamp

    const timezoneOffset = (options.timezone || 0) * 60 * 60 * 1000
    const date = new Date(ts + timezoneOffset)

    if (isNaN(date.getTime())) return 'Invalid Date'

    const timeObj: TimeObject = {
        year: date.getUTCFullYear(),
        month: date.getUTCMonth() + 1,
        day: date.getUTCDate(),
        hours: date.getUTCHours(),
        minutes: date.getUTCMinutes(),
        seconds: date.getUTCSeconds()
    }

    if (options.returnObject) return timeObj

    const format = options.format || 'YYYY-MM-DD HH:mm:ss'
    const pad = (n: number) => n.toString().padStart(2, '0')

    return format
        .replace(/YYYY/g, String(timeObj.year))
        .replace(/YY/g, String(timeObj.year).slice(-2))
        .replace(/MM/g, pad(timeObj.month))
        .replace(/M/g, String(timeObj.month))
        .replace(/DD/g, pad(timeObj.day))
        .replace(/D/g, String(timeObj.day))
        .replace(/HH/g, pad(timeObj.hours))
        .replace(/H/g, String(timeObj.hours))
        .replace(/mm/g, pad(timeObj.minutes))
        .replace(/m/g, String(timeObj.minutes))
        .replace(/ss/g, pad(timeObj.seconds))
        .replace(/s/g, String(timeObj.seconds))
}

/** 求点赞率，返回整数百分比（0.9 → 90） */
const calculateLikeRate = (likeCount: number, viewCount: number): number => {
    if (viewCount === 0) {
        return 0;
    }
    return parseInt((likeCount / viewCount) * 100 as any)
}

/** 求互动率 (danmaku+reply)/view，返回整数百分比 */
const calculateInteractionRate = (danmaku: number, reply: number, view: number): number => {
    return parseInt((danmaku + reply) / view * 100 as any)
}

/** 求三连率 (favorite+coin+share)/view，返回整数百分比 */
const calculateTripleRate = (favorite: number, coin: number, share: number, view: number): number => {
    return parseInt((favorite + coin + share) / view * 100 as any)
}

/** 求投币/点赞比，返回整数百分比 */
const calculateCoinLikesRatioRate = (coin: number, like: number): number => {
    return parseInt((coin / like) * 100 as any)
}

/** 插入脚本通用样式（幂等：已插入则跳过） */
export const addGzStyle = (el: Document | Element, insertionPosition: Element | Document = document.head): void => {
    const styleEl = el.querySelector("style[gz_style]");
    if (styleEl !== null) {
        console.log("已有gz_style样式，故不再插入该样式内容");
        return;
    }
    const style = document.createElement('style');
    style.setAttribute("gz_style", "");
    style.textContent = gzStyleCss;
    insertionPosition.appendChild(style);
}

export function initVueApp(el: string | Element, RootComponent: any, props: Record<string, any> = {}): VueApp {
    const app = createApp(RootComponent, props);
    // 挂载 Element Plus（ElementPlus 由 @require 的 UMD 在同一拼接作用域提供），并配置中文语言包。
    // zIndex 必须高于主面板的 9001：EP 弹层默认从 2000 起算，会被面板整片盖住——
    // 表现为下拉框「打不开」、消息框只露一角，实际都渲染了但点不到、看不见。
    // 命令式 API（ElMessage/ElMessageBox/ElNotification）在 detached app 里创建，
    // 但它们读的是同一份 globalConfig，所以这一处配置对它们同样生效。
    app.use(ElementPlus, {locale: zhCn, zIndex: 10000});
    app.mount(el);
    return app;
}

/** 计算从现在起偏移若干天/时/分/秒后的毫秒级时间戳 */
export function getFutureTimestamp(days: number = 0, hours: number = 0, minutes: number = 0, seconds: number = 0): number {
    const now = new Date();

    const ms = days * 24 * 60 * 60 * 1000 +
        hours * 60 * 60 * 1000 +
        minutes * 60 * 1000 +
        seconds * 1000;

    const future = new Date(now.getTime() + ms);

    return future.getTime();
}

//获取网站前台jQuery对象
const getJQuery = async (): Promise<any> => {
    return new Promise(resolve => {
        const $ = valueCache.get('$');
        if ($) {
            resolve($);
            return;
        }
        const i1 = setInterval(() => {
            const $ = (unsafeWindow as any)['$'];
            if ($) {
                valueCache.set('$', $)
                clearInterval(i1);
                resolve($);
            }
        }, 1000);
    })
}

export default {
    wait,
    fileDownload,
    toTimeString,
    getJQuery,
    debounce,
    throttle,
    handleFileReader,
    isIterable,
    getLocalStorage,
    formatTimestamp,
    calculateLikeRate,
    calculateInteractionRate,
    calculateTripleRate,
    calculateCoinLikesRatioRate,
    saveTextAsFile,
    /**
     * 将list、map、set转为普通对象
     * @param listOrMapOrSet 可迭代对象
     * @param toStr {boolean} 是否转为字符串格式
     * @returns {any[]|Set|Map|string}
     */
    toRaw(listOrMapOrSet: any, toStr: boolean = false): any {
        const text = JSON.stringify(listOrMapOrSet);
        if (toStr) {
            return toStr
        }
        return JSON.parse(text)
    }
}
