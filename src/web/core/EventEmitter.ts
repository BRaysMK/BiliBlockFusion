/**
 * 事件中心类，用于管理事件的订阅和发布。
 * 提供了订阅普通事件、一次性订阅普通事件、订阅回调事件、发送通知、发送普通消息等功能。
 * @version 1.3.0
 */

type EventCallback = (...args: any[]) => any

interface DebounceConfig {
    wait: number
    timeOut: ReturnType<typeof setTimeout> | null
}

interface RegularEvents {
    events: Record<string, EventCallback>
    futures: Record<string, any[][]>
    parametersDebounce: Record<string, DebounceConfig>
    preHandles: Record<string, EventCallback>
}

interface CallbackEvents {
    events: Record<string, EventCallback>
    callbackInterval: number
}

class EventEmitter {
    #regularEvents: RegularEvents = {
        events: {},
        futures: {},
        parametersDebounce: {},
        preHandles: {}
    }

    #callbackEvents: CallbackEvents = {
        events: {},
        callbackInterval: 1500
    }

    /** 注册普通事件监听器；同名已注册时默认静默忽略，overrideEvents 为 true 则覆盖。注册后补发 futures 缓存 */
    on(eventName: string, callback: EventCallback, overrideEvents: boolean = false): EventEmitter {
        const events = this.#regularEvents.events
        if (events[eventName]) {
            if (overrideEvents) {
                events[eventName] = callback
                this.#handlePendingEvents(eventName, callback)
            }
            return this
        }
        events[eventName] = callback
        this.#handlePendingEvents(eventName, callback)
        return this
    }

    /** 注册 preHandle：send() 投递前转换参数，返回处理后的参数数组 */
    onPreHandle(eventName: string, callback: EventCallback): EventEmitter {
        const preHandles = this.#regularEvents.preHandles
        preHandles[eventName] = callback
        return this
    }

    /** 注册 callback 事件处理器（与 invoke() 配对）；同名重复注册抛错 */
    handler(eventName: string, callback: EventCallback): void {
        const handlerEvents = this.#callbackEvents.events
        if (handlerEvents[eventName]) {
            throw new Error('该事件名已经存在，请更换事件名')
        }
        handlerEvents[eventName] = callback
    }

    /** Promise 风格调用：handler 未注册时轮询等待（UI 组件挂载后才注册的场景） */
    invoke(eventName: string, ...data: any[]): Promise<any> {
        return new Promise(resolve => {
            const handlerEvents = this.#callbackEvents.events
            if (handlerEvents[eventName]) {
                resolve(handlerEvents[eventName](...data))
                return
            }
            const i1 = setInterval(() => {
                if (handlerEvents[eventName]) {
                    clearInterval(i1)
                    resolve(handlerEvents[eventName](...data))
                }
            }, this.#callbackEvents.callbackInterval)
        })
    }

    /** 同步发送事件；handler 未注册时缓存到 futures，待 on() 注册时补发 */
    send(eventName: string, ...data: any[]): EventEmitter {
        const ordinaryEvents = this.#regularEvents
        const events = ordinaryEvents.events
        const event = events[eventName]
        if (event) {
            const preHandleData = this.#executePreHandle(eventName, data)
            event.apply(null, preHandleData)
            return this
        }
        const futures = ordinaryEvents.futures
        if (futures[eventName]) {
            futures[eventName].push(data)
            return this
        }
        futures[eventName] = []
        futures[eventName].push(data)
        return this
    }

    /** 防抖发送，默认 1500ms，可用 setDebounceWaitTime() 调整 */
    sendDebounce(eventName: string, ...data: any[]): EventEmitter {
        const parametersDebounce = this.#regularEvents.parametersDebounce
        let timeOutConfig = parametersDebounce[eventName]
        if (timeOutConfig) {
            clearTimeout(timeOutConfig.timeOut as ReturnType<typeof setTimeout>)
            timeOutConfig.timeOut = null
        } else {
            timeOutConfig = parametersDebounce[eventName] = {wait: 1500, timeOut: null}
        }
        timeOutConfig.timeOut = setTimeout(() => {
                this.send(eventName, ...data)
            },
            timeOutConfig.wait)
        return this
    }

    /** 设置指定事件的防抖等待时长（毫秒） */
    setDebounceWaitTime(eventName: string, wait: number): EventEmitter {
        const timeOutConfig = this.#regularEvents.parametersDebounce[eventName]
        if (timeOutConfig) {
            timeOutConfig.wait = wait
        } else {
            this.#regularEvents.parametersDebounce[eventName] = {
                wait: wait,
                timeOut: null
            }
        }
        return this
    }

    /** 同步触发事件：无 preHandle、无 futures 缓存，handler 未注册则静默丢弃 */
    emit(eventName: string, ...data: any[]): EventEmitter {
        const callback = this.#regularEvents.events[eventName]
        if (callback) {
            callback.apply(null, data)
        }
        return this
    }

    /** 异步触发（推迟到下一个 macrotask），确保 promise.catch() 等微任务先执行完 */
    emitAsync(eventName: string, ...data: any[]): EventEmitter {
        setTimeout(() => this.emit(eventName, ...data), 0)
        return this
    }

    /** 异步 send：语义同 send（preHandle + futures），只是推迟到下一个 macrotask */
    sendAsync(eventName: string, ...data: any[]): EventEmitter {
        setTimeout(() => this.send(eventName, ...data), 0)
        return this
    }

    /** 注销指定事件的所有监听，返回是否成功 */
    off(eventName: string): boolean {
        const events = this.#regularEvents.events
        if (events[eventName]) {
            delete events[eventName]
            return true
        }
        const handlerEvents = this.#callbackEvents.events
        if (handlerEvents[eventName]) {
            delete handlerEvents[eventName]
            return true
        }
        return false
    }

    /** 设置 invoke() 轮询 handler 注册状态的间隔（毫秒） */
    setInvokeInterval(interval: number): void {
        this.#callbackEvents.callbackInterval = interval
    }

    /** 获取内部状态快照，用于调试 */
    getEvents(): { regularEvents: RegularEvents; callbackEvents: CallbackEvents } {
        return {
            regularEvents: this.#regularEvents,
            callbackEvents: this.#callbackEvents
        }
    }

    /** 处理 on() 注册前由 send() 缓存的待补发事件 */
    #handlePendingEvents(eventName: string, callback: EventCallback): void {
        const futureEvents = this.#regularEvents.futures
        if (futureEvents[eventName]) {
            for (const eventData of futureEvents[eventName]) {
                const preHandleData = this.#executePreHandle(eventName, eventData)
                callback.apply(null, preHandleData)
            }
            delete futureEvents[eventName]
        }
    }

    /** 执行 preHandle 预处理，无预处理时透传原始数据 */
    #executePreHandle(eventName: string, data: any[]): any[] {
        const preHandles = this.#regularEvents.preHandles
        const callback = preHandles[eventName]
        if (callback) {
            return callback.apply(null, data)
        }
        return data
    }
}

export const eventEmitter = new EventEmitter()
