import {describe, expect, it} from "vitest";
import {eventEmitter} from "../src/web/core/EventEmitter.ts";
import {OUTPUT_INFO_FUTURES_LIMIT} from "../src/web/core/shieldLog.ts";

/**
 * futures 缓存上限
 *
 * 监听者注册之前，send() 会把原始事件扣在 futures 里、注册时全量补发。
 * 日志类事件的原始对象可能挂着 DOM 与整段接口响应，无上限积压会让「诊断与关于」
 * 第一次打开时同步回放全部历史，实测主线程卡 1.1 秒。
 */

/** 每个用例用独立事件名，避免共享单例的 futures 互相污染 */
let caseId = 0;
const uniqueEvent = (name: string): string => `${name}#${++caseId}`;

const collect = (eventName: string, limit?: number, count = 10): number[] => {
  if (limit !== undefined) eventEmitter.setFuturesLimit(eventName, limit);
  for (let i = 0; i < count; i++) eventEmitter.send(eventName, i);
  const received: number[] = [];
  eventEmitter.on(eventName, (n: number) => received.push(n));
  return received;
};

describe("EventEmitter futures 上限", () => {
    it("登记上限的事件在无监听者时只保留最近 N 条", () => {
        expect(collect(uniqueEvent("限制3"), 3)).toEqual([7, 8, 9]);
    });

    it("未登记上限的事件保持原有「全部补发」语义", () => {
        expect(collect(uniqueEvent("不限"))).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });

    it("补发后 futures 清空，后续事件直接走监听器", () => {
        const eventName = uniqueEvent("补发后");
        eventEmitter.setFuturesLimit(eventName, 2);
        for (let i = 0; i < 5; i++) eventEmitter.send(eventName, i);

        const received: number[] = [];
        eventEmitter.on(eventName, (n: number) => received.push(n));
        eventEmitter.send(eventName, 99);
        expect(received).toEqual([3, 4, 99]);
    });

    it("上限为 1 时只留最新一条", () => {
        expect(collect(uniqueEvent("限制1"), 1)).toEqual([9]);
    });
});

describe("输出信息通道", () => {
    it("五个日志通道都登记了与日志数组一致的上限", () => {
        expect(OUTPUT_INFO_FUTURES_LIMIT).toBeGreaterThan(0);
        // shieldLog 在模块加载期登记；这里验证上限确实生效（未登记会补发 400 条）
        const eventName = "屏蔽日志";
        for (let i = 0; i < 400; i++) eventEmitter.send(eventName, i);
        const received: number[] = [];
        eventEmitter.on(eventName, (n: number) => received.push(n));
        expect(received.length).toBe(OUTPUT_INFO_FUTURES_LIMIT);
        // 保留的是最近的一批
        expect(received[received.length - 1]).toBe(399);
    });
});
