import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {mount, type VueWrapper} from "@vue/test-utils";
import {defineComponent, nextTick} from "vue";
import PanelShell from "../src/web/ui/panel/PanelShell.vue";

/**
 * 主面板外壳回归测试
 *
 * 这组用例锁住三件事，它们都曾以「点几次都关不掉 / 整页点不动」的形式出现：
 * 1. 开合只有一份状态，动画期间再切换不会分叉（不出现面板已关但状态仍为开）；
 * 2. 点击面板外空白关闭、点击面板内不关闭、点击 EP 浮层不关闭；
 * 3. 关闭后必须卸载 DOM，不能留下拦点击的残留节点。
 *
 * jsdom 不跑 CSS 过渡，故将 duration 设为 0：关闭后在下一个宏任务完成卸载。
 */

const flush = async (wrapper: VueWrapper<any>): Promise<void> => {
    await nextTick();
    await new Promise(resolve => setTimeout(resolve, 0));
    // PanelShell 打开时用两层 rAF 触发过渡，jsdom 的 rAF 由 setTimeout 兜底
    await new Promise(resolve => setTimeout(resolve, 20));
    await wrapper.vm.$nextTick();
};

const buildWrapper = (modelValue: boolean): VueWrapper<any> =>
    mount(PanelShell, {
        props: {modelValue, duration: 0},
        slots: {default: '<div class="content-marker">内容</div>'},
        attachTo: document.body,
    });

describe("主面板外壳", () => {
    let wrapper: VueWrapper<any>;

    beforeEach(() => {
        document.body.innerHTML = "";
    });

    afterEach(() => {
        wrapper?.unmount();
    });

    it("关闭状态不渲染任何 DOM，打开后才挂载", async () => {
        wrapper = buildWrapper(false);
        await flush(wrapper);
        expect(document.querySelector(".gz-panel")).toBeNull();

        await wrapper.setProps({modelValue: true});
        await flush(wrapper);
        expect(document.querySelector(".gz-panel")).not.toBeNull();
        expect(document.querySelector(".content-marker")).not.toBeNull();
    });

    it("关闭后卸载 DOM，不留下拦截点击的节点", async () => {
        wrapper = buildWrapper(true);
        await flush(wrapper);
        expect(document.querySelector(".gz-panel")).not.toBeNull();

        await wrapper.setProps({modelValue: false});
        await flush(wrapper);
        await flush(wrapper);
        expect(document.querySelector(".gz-panel")).toBeNull();
    });

    it("关闭动画期间重新打开：最终处于打开态而不是卡在中间", async () => {
        wrapper = buildWrapper(true);
        await flush(wrapper);
        await wrapper.setProps({modelValue: false});
        // 不等待关闭计时器完成，立刻重新打开——旧实现会在这一步分叉
        await wrapper.setProps({modelValue: true});
        await flush(wrapper);

        const panel = document.querySelector(".gz-panel");
        expect(panel).not.toBeNull();
        expect(panel!.classList.contains("gz-panel--opened")).toBe(true);
        // 内容必须还在：关闭计时器不能被漏掉，把刚打开的面板又卸载掉
        expect(document.querySelector(".content-marker")).not.toBeNull();
    });

    it("连续切换 6 次后状态与最后一次输入一致", async () => {
        wrapper = buildWrapper(false);
        for (let i = 0; i < 6; i++) {
            await wrapper.setProps({modelValue: i % 2 === 0});
        }
        // 最后一次 i=5 → modelValue=false
        await flush(wrapper);
        await flush(wrapper);
        expect(document.querySelector(".gz-panel")).toBeNull();
    });

    it("点击面板外空白发出关闭事件", async () => {
        wrapper = buildWrapper(true);
        await flush(wrapper);

        document.body.dispatchEvent(new MouseEvent("mousedown", {bubbles: true}));
        await nextTick();
        expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual([false]);
    });

    it("点击面板内部不关闭", async () => {
        wrapper = buildWrapper(true);
        await flush(wrapper);

        document.querySelector(".content-marker")!
            .dispatchEvent(new MouseEvent("mousedown", {bubbles: true}));
        await nextTick();
        expect(wrapper.emitted("update:modelValue")).toBeUndefined();
    });

    it("点击被 teleport 到 body 的 EP 浮层不关闭", async () => {
        wrapper = buildWrapper(true);
        await flush(wrapper);

        const popper = document.createElement("div");
        popper.className = "el-popper";
        document.body.appendChild(popper);
        popper.dispatchEvent(new MouseEvent("mousedown", {bubbles: true}));
        await nextTick();
        expect(wrapper.emitted("update:modelValue")).toBeUndefined();
    });

    it("点击悬浮开关按钮不关闭，交给按钮自身的开关逻辑", async () => {
        wrapper = buildWrapper(true);
        await flush(wrapper);

        const floatButton = document.createElement("div");
        floatButton.className = "gz-float-btn";
        document.body.appendChild(floatButton);
        floatButton.dispatchEvent(new MouseEvent("mousedown", {bubbles: true}));
        await nextTick();
        expect(wrapper.emitted("update:modelValue")).toBeUndefined();
    });

    it("面板关闭时不响应空白点击", async () => {
        wrapper = buildWrapper(false);
        await flush(wrapper);

        document.body.dispatchEvent(new MouseEvent("mousedown", {bubbles: true}));
        await nextTick();
        expect(wrapper.emitted("update:modelValue")).toBeUndefined();
    });
});

describe("数值格式换算", () => {
    it("数字入参不再抛 TypeError（-1 表示该指标不存在）", async () => {
        const {default: strFormatUtil} = await import("../src/web/core/util/strFormatUtil.ts");
        // 旧实现直接对 number 调 str.split，首页轮询每 3 秒抛一次
        expect(strFormatUtil.toPlayCountOrBulletChat(-1)).toBe(-1);
        expect(strFormatUtil.toPlayCountOrBulletChat(12345)).toBe(12345);
        expect(strFormatUtil.toPlayCountOrBulletChat(0)).toBe(0);
    });

    it("字符串入参的单位换算保持不变", async () => {
        const {default: strFormatUtil} = await import("../src/web/core/util/strFormatUtil.ts");
        expect(strFormatUtil.toPlayCountOrBulletChat("1.2万")).toBe(12000);
        expect(strFormatUtil.toPlayCountOrBulletChat("368  弹幕")).toBe(368);
        expect(strFormatUtil.toPlayCountOrBulletChat("21.9 万次")).toBe(219000);
        expect(strFormatUtil.toPlayCountOrBulletChat("")).toBe(-1);
        expect(strFormatUtil.toPlayCountOrBulletChat(null)).toBe(-1);
    });
});
