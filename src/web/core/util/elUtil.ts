/**
 * 判断一个变量是否是DOM元素
 * @param {*} obj - 要判断的变量
 * @returns {boolean} 如果是DOM元素返回true，否则返回false
 */
const isDOMElement = (obj: any): boolean => {
    return (obj !== null && typeof obj === 'object' && 'nodeType' in obj);
}

const inProgressCache = new Map<string, Promise<Element | ShadowRoot | null>>();

interface ValidationElFunConfig {
    doc: Document | Element | ShadowRoot;
    parseShadowRoot?: boolean;
    validationElFun?: (config: FindElementConfig, selector: string) => Element | ShadowRoot | null;
}

const validationElFun = (config: ValidationElFunConfig, selector: string): Element | ShadowRoot | null => {
    const element = config.doc.querySelector(selector);
    if (element === null) return null;
    return config.parseShadowRoot && element.shadowRoot ?
        element.shadowRoot : element;
}

const __privateValidationElFun = (config: FindElementConfig, selector: string): Element | ShadowRoot | null => {
    const result = config.validationElFun!(config, selector);
    return isDOMElement(result) ? result : null;
}

interface FindElementConfig {
    doc?: Document | Element | ShadowRoot;
    interval?: number;
    timeout?: number;
    parseShadowRoot?: boolean;
    cacheInProgress?: boolean;
    cachePromise?: boolean;
    validationElFun?: (config: FindElementConfig, selector: string) => Element | ShadowRoot | null;
}

/**
 * 持续轮询查找单个元素，找到即返回；timeout 默认 -1 表示无限等待。
 *
 * 不要改成「匹配 0 个立即返回」：首页屏蔽链路没有外层重试，会导致整体静默失效
 * （已踩坑回退，回归测试见 tests/homeShieldRegression.test.ts）。
 */
const findElement = async (selector: string, config: FindElementConfig = {}): Promise<Element | ShadowRoot | null> => {
    const defConfig: FindElementConfig = {
        doc: document,
        interval: 1000,
        timeout: -1,
        parseShadowRoot: false,
        cacheInProgress: true,
        validationElFun: validationElFun as any
    }
    config = {...defConfig, ...config}
    const result = __privateValidationElFun(config as any, selector);
    if (result !== null) return result;
    const cacheKey = `findElement:${selector}`
    if (config.cacheInProgress) {
        const cachedPromise = inProgressCache.get(cacheKey);
        if (cachedPromise) {
            return cachedPromise;
        }
    }
    const p = new Promise<Element | ShadowRoot | null>((resolve) => {
        let timeoutId: ReturnType<typeof setTimeout> | undefined;
        let IntervalId: ReturnType<typeof setInterval> | undefined;
        IntervalId = setInterval(() => {
            const result = __privateValidationElFun(config as any, selector);
            if (result === null) return;
            resolve(result)
        }, config.interval);
        const cleanup = () => {
            if (IntervalId) clearInterval(IntervalId);
            if (timeoutId) clearTimeout(timeoutId);
            if (config.cacheInProgress) {
                inProgressCache.delete(cacheKey);
            }
        }
        if (config.timeout && config.timeout > 0) {
            timeoutId = setTimeout(() => {
                resolve(null);
                cleanup()
            }, config.timeout);
        }
    });
    if (config.cacheInProgress) {
        inProgressCache.set(cacheKey, p);
    }
    return p;
}

interface FindElementChainConfig extends FindElementConfig {
    allparseShadowRoot?: boolean;
    separator?: string;
    validationFun?: (element: Element) => boolean;
    originalSelector?: string;
}

interface ChainPath {
    selector: string;
    config: FindElementChainConfig;
}

interface FindElementChainResult {
    find(childSelector: string, childConfig?: FindElementChainConfig): FindElementChainResult;

    get(): Promise<Element | ShadowRoot | null>;
}

/** findElement 的链式版本：多次 find() 串成选择器链，最后 get() 异步取结果 */
const findElementChain = (selector: string, config: FindElementChainConfig = {}): FindElementChainResult => {
    const paths: ChainPath[] = [];
    const chainObj: FindElementChainResult = {
        find(childSelector: string, childConfig: FindElementChainConfig = {}): FindElementChainResult {
            if (config.allparseShadowRoot) {
                childConfig.parseShadowRoot = true;
            }
            childSelector.trim()
            if (childSelector === '' || childSelector.search(/^\d/) !== -1) {
                throw new Error('非法的元素选择器');
            }
            const separator = config.separator ?? childConfig.separator;
            if (separator === undefined || separator === null || separator.trim() === '') {
                paths.push({selector: childSelector, config: childConfig});
            } else {
                const selectorArr = childSelector.split(separator);
                if (selectorArr.length === 1) {
                    paths.push({selector: childSelector, config: childConfig});
                } else {
                    for (let s of selectorArr) {
                        s = s.trim();
                        if (s === '') continue;
                        childConfig.originalSelector = childSelector;
                        paths.push({selector: s, config: childConfig});
                    }
                }
            }
            return this
        },
        get(): Promise<Element | ShadowRoot | null> {
            return new Promise(async (resolve) => {
                let currentDoc: Element | ShadowRoot | null = null;
                for (const path of paths) {
                    const {selector, config: pathConfig} = path;
                    const resolvedConfig: FindElementConfig = {...pathConfig};
                    if (pathConfig.doc === null || pathConfig.doc === undefined) {
                        resolvedConfig.doc = currentDoc ?? document;
                    } else {
                        resolvedConfig.doc = pathConfig.doc
                    }
                    const res = await findElement(selector, resolvedConfig)
                    if (res === null) {
                        continue;
                    }
                    currentDoc = res;
                }
                resolve(currentDoc);
            })
        }
    };
    chainObj.find(selector, config)
    return chainObj;
}

interface FindElementsConfig {
    doc?: Document | Element | ShadowRoot;
    interval?: number;
    timeout?: number;
    parseShadowRoot?: boolean;
}

/** 持续轮询查找多个元素，直到非空；timeout 默认 -1 表示无限等待（语义同 findElement，不可改成立即返回） */
const findElements = async (selector: string, config: FindElementsConfig = {}): Promise<HTMLElement[]> => {
    const defConfig: FindElementsConfig = {doc: document, interval: 1000, timeout: -1, parseShadowRoot: false}
    config = {...defConfig, ...config}
    return new Promise((resolve) => {
        // 开发模式：首次未匹配时输出一条定位日志（不改变等待语义），便于发现选择器失配
        let missingLogged = false;
        const i1 = setInterval(() => {
            const els = config.doc!.querySelectorAll(selector);
            if (els.length > 0) {
                const list: HTMLElement[] = [];
                for (const el of els) {
                    if (config.parseShadowRoot) {
                        const shadowRoot = (el as HTMLElement)?.shadowRoot;
                        list.push((shadowRoot ? shadowRoot : el) as HTMLElement)
                        continue;
                    }
                    list.push(el as HTMLElement);
                }
                resolve(list);
                clearInterval(i1)
            } else if (__DEV__ && !missingLogged) {
                // 仅开发构建输出：选择器未匹配到元素，持续轮询等待中（不改变超时/等待行为）
                missingLogged = true;
                console.warn(`[elUtil][dev] findElements 未匹配到元素，持续等待中: ${selector}`);
            }
        }, config.interval);
        if (config.timeout && config.timeout > 0) {
            setTimeout(() => {
                clearInterval(i1);
                resolve([]);
            }, config.timeout);
        }
    });
}

interface FindElementsAndBindEventsConfig {
    interval?: number;
    timeOut?: number;
}

/**
 * 尝试查找元素，并绑定事件，直到找到为止
 * @param css {string} - CSS 选择器
 * @param callback {function} - 回调函数
 * @param config{Object}
 * @param config.interval {number} - 每次查找之间的间隔时间（毫秒）默认1秒，即1000毫秒
 * @param config.timeOut {number} - 延迟查找的时间（毫秒），默认为3000毫秒
 */
const findElementsAndBindEvents = (css: string, callback: () => void, config: FindElementsAndBindEventsConfig = {}): void => {
    config = {
        interval: 2000,
        timeOut: 3000,
        ...config
    } as FindElementsAndBindEventsConfig;
    setTimeout(() => {
        findElement(css, {interval: config.interval}).then((el) => {
            el?.addEventListener("click", () => {
                callback();
            })
        });
    }, config.timeOut);
}

const hoverTimeoutEvents = new Map<Element, { mouseenter: (e: MouseEvent) => void; mouseleave: () => void }>();

/**
 * 设置悬停计时器，当鼠标悬停在元素上xxx秒后执行回调函数
 * @param {Element} el - 要设置悬停计时器的元素
 * @param {number} timeout - 悬停触发回调的时间（毫秒），默认为2000毫秒
 * @param {Function} callback - 悬停超时后执行的回调函数
 */
const addHoverTimeoutEvent = (el: Element | string, callback: (e: MouseEvent) => void, timeout: number = 2000): boolean => {
    if (typeof el === 'string') {
        el = document.querySelector(el) as Element;
    }
    if (el === null) return false
    const attribute = el.getAttribute('data-hover-timeout');
    if (attribute !== null) return false;
    el.setAttribute('data-hover-timeout', '');
    let time: ReturnType<typeof setTimeout> | null = null;
    const mouseenter = (e: MouseEvent) => {
        time = setTimeout(() => {
            callback(e);
        }, timeout);
    }
    const mouseleave = () => {
        if (time === null) {
            return;
        }
        clearTimeout(time);
    }
    hoverTimeoutEvents.set(el, {mouseenter, mouseleave});
    el.addEventListener('mouseenter', mouseenter as EventListener);
    el.addEventListener('mouseleave', mouseleave as EventListener);
    return true;
}

const removeHoverTimeoutEvent = (el: Element): boolean => {
    const attribute = el.getAttribute('data-hover-timeout');
    if (attribute === null) return false;
    const events = hoverTimeoutEvents.get(el);
    if (events) {
        el.removeEventListener('mouseenter', events.mouseenter as EventListener);
        el.removeEventListener('mouseleave', events.mouseleave as EventListener);
    }
    return true;
}


/**
 * 创建一个Vue容器
 * @description 创建一个Vue容器，用于挂载Vue组件，如如传入el，则将容器挂载到该元素下，不管el是否存在，都将创建一个容器，并返回容器的元素。
 * @param el {Element} 容器要挂载的元素，vue容器
 * @param cssTests {string|null} 要为创建的容器添加的样式，如为null，则不添加样式
 * @returns {{panelDiv: HTMLDivElement, vueDiv: HTMLDivElement}}
 */
const createVueDiv = (el: Element | null = null, cssTests: string | null = null): {
    panelDiv: HTMLDivElement;
    vueDiv: HTMLDivElement
} => {
    const panelDiv = document.createElement('div');
    if (cssTests !== null) {
        panelDiv.style.cssText = cssTests;
    }
    const vueDiv = document.createElement("div");
    panelDiv.appendChild(vueDiv);
    if (el !== null) {
        el.appendChild(panelDiv);
    }
    return {panelDiv, vueDiv}
}

interface InstallStyleSelectorOptions {
    type?: 'class' | 'id' | string;
    value?: string;
    doc?: Element | Document;
}

/**
 * @version 0.2.0
 */
export default {
    findElement, isDOMElement, addHoverTimeoutEvent, removeHoverTimeoutEvent,
    findElements, findElementChain,
    findElementsAndBindEvents,
    /**
     * 安装样式
     * @param cssText {string} - CSS 样式字符串
     * @param selectorOptions {{type:'class'|'id'|any,value:string}|null}
     */
    installStyle(cssText: string, selectorOptions: InstallStyleSelectorOptions | null = null): void {
        const {type = 'class', value = '', doc = document.head} = selectorOptions ? selectorOptions : {};
        let selector = '';
        switch (type) {
            case "class":
                selector = `.${value}`;
                break;
            case 'id':
                selector = `#${value}`;
                break;
            default:
                selector = `[${type}="${value}"]`;
        }
        let styleEl: HTMLStyleElement | null = value === '' ? null : doc.querySelector(selector) as HTMLStyleElement | null;
        if (styleEl === null) {
            styleEl = document.createElement('style');
            switch (type) {
                case "class":
                    styleEl.className = value;
                    break;
                case 'id':
                    styleEl.id = value;
                    break
                default:
                    styleEl.setAttribute(type, value);
                    break;
            }
            doc.appendChild(styleEl)
        }
        styleEl.textContent = cssText;
    },
    createVueDiv,
    byXpathEl(xpath: string, doc: Document | Element = document): Node | null {
        return document.evaluate(xpath, doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    },
    /**
     * 异步xpath定位元素，返回匹配第一个元素，按文档顺序
     * @param xpath
     * @param doc
     * @param timeout
     * @return {Promise<HTMLElement>}
     */
    async byXpathElAsync(xpath: string, doc: Document | Element = document, timeout: number = 1000): Promise<HTMLElement | null> {
        return new Promise((resolve) => {
            let xpathEl = this.byXpathEl(xpath, doc);
            if (xpathEl !== null) {
                return resolve(xpathEl as HTMLElement);
            }
            const interval = setInterval(() => {
                xpathEl = this.byXpathEl(xpath, doc);
                if (xpathEl === null) return
                resolve(xpathEl as HTMLElement);
                clearInterval(interval)
            }, timeout);
        })
    },
    byXpathEls(xpath: string, doc: Document | Element = document): Node[] {
        const xPathResult = document.evaluate(xpath, doc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        const elList: Node[] = []
        for (let i = 0; i < xPathResult.snapshotLength; i++) {
            const items = xPathResult.snapshotItem(i);
            if (items === null) continue;
            elList.push(items)
        }
        return elList
    },
    byXpathNumber(xpath: string, doc: Document = document): number {
        return document.evaluate(xpath, doc, null, XPathResult.NUMBER_TYPE, null).numberValue;
    },
    byXpathString(xpath: string, doc: Document = document): string {
        return document.evaluate(xpath, doc, null, XPathResult.STRING_TYPE, null).stringValue;
    },
    byXpathBoolean(xpath: string, doc: Document = document): boolean {
        return document.evaluate(xpath, doc, null, XPathResult.BOOLEAN_TYPE, null).booleanValue;
    }
}
