import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {mount, type VueWrapper} from "@vue/test-utils";
import {defineComponent, h, nextTick} from "vue";
import PanelShell from "../src/web/ui/panel/PanelShell.vue";
import {eventEmitter} from "../src/web/core/EventEmitter.ts";

/**
 * 主面板外壳回归测试
 *
 * 这组用例锁住四件事，它们都曾以「点几次都关不掉 / 整页点不动 / 重开后日志不再更新」的形式出现：
 * 1. 开合只有一份状态，动画期间再切换不会分叉（不出现面板已关但状态仍为开）；
 * 2. 点击面板外空白关闭、点击面板内不关闭、点击 EP 浮层不关闭；
 * 3. 关闭时不能卸载内容：EventEmitter.on 对同名事件去重，卸载后重新注册是空操作，
 *    视图里的事件监听会永久失效；
 * 4. 没打开过时不渲染任何 DOM，不白担一份组件树开销。
 *
 * jsdom 不跑 CSS 过渡，故将 duration 设为 0。
 */

const flush = async (wrapper: VueWrapper<any>): Promise<void> => {
    await nextTick();
    await new Promise(resolve => setTimeout(resolve, 0));
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

    it("从未打开时不渲染任何 DOM，打开后才挂载", async () => {
        wrapper = buildWrapper(false);
        await flush(wrapper);
        expect(document.querySelector(".gz-panel")).toBeNull();

        await wrapper.setProps({modelValue: true});
        await flush(wrapper);
        expect(document.querySelector(".gz-panel")).not.toBeNull();
        expect(document.querySelector(".content-marker")).not.toBeNull();
        expect(document.querySelector(".gz-panel")!.classList.contains("gz-panel--opened")).toBe(true);
    });

    it("关闭后保留 DOM 只切可见性，不留下拦截点击的节点", async () => {
        wrapper = buildWrapper(true);
        await flush(wrapper);
        expect(document.querySelector(".gz-panel")).not.toBeNull();

        await wrapper.setProps({modelValue: false});
        await flush(wrapper);
        await flush(wrapper);

        const panel = document.querySelector(".gz-panel");
        // 不能卸载：卸载会让子组件的 eventEmitter.on 永远注册不上
        expect(panel).not.toBeNull();
        expect(panel!.classList.contains("gz-panel--opened")).toBe(false);
        expect(panel!.getAttribute("aria-hidden")).toBe("true");
    });

    it("关闭再打开时内容节点是同一批（未重新挂载）", async () => {
        wrapper = buildWrapper(true);
        await flush(wrapper);
        const before = document.querySelector(".content-marker");

        await wrapper.setProps({modelValue: false});
        await flush(wrapper);
        await wrapper.setProps({modelValue: true});
        await flush(wrapper);

        expect(document.querySelector(".content-marker")).toBe(before);
    });

    it("重开后面板里的 eventEmitter 监听仍然有效", async () => {
        eventEmitter.off("测试面板事件");
        const handler = vi.fn();
        const Listener = defineComponent({
            setup() {
                eventEmitter.on("测试面板事件", handler);
                return () => h("span", {class: "listener-marker"});
            },
        });
        wrapper = mount(PanelShell, {
            props: {modelValue: true, duration: 0},
            slots: {default: Listener},
            attachTo: document.body,
        });
        await flush(wrapper);

        await wrapper.setProps({modelValue: false});
        await flush(wrapper);
        await wrapper.setProps({modelValue: true});
        await flush(wrapper);

        eventEmitter.send("测试面板事件");
        expect(handler).toHaveBeenCalledTimes(1);
        eventEmitter.off("测试面板事件");
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
        const panel = document.querySelector(".gz-panel");
        expect(panel).not.toBeNull();
        expect(panel!.classList.contains("gz-panel--opened")).toBe(false);
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

    it("关闭时给面板表面补发 mousedown/mouseup，让 EP 浮层跟着收起", async () => {
        // 浮层被 teleport 到 body 下的 #el-popper-container-*，面板的 visibility 管不到；
        // 只有点击类关闭会被 EP 的 click-outside 顺带收掉，快捷键关闭必须靠这一对事件。
        wrapper = buildWrapper(true);
        await flush(wrapper);

        const container = document.createElement("div");
        container.id = "el-popper-container-test";
        const openPopper = document.createElement("div");
        openPopper.className = "el-popper";
        openPopper.setAttribute("aria-hidden", "false");
        container.appendChild(openPopper);
        document.body.appendChild(container);

        const surface = document.querySelector(".gz-panel__surface") as HTMLElement;
        const seen: string[] = [];
        surface.addEventListener("mousedown", () => seen.push("mousedown"));
        surface.addEventListener("mouseup", () => seen.push("mouseup"));

        await wrapper.setProps({modelValue: false});
        await flush(wrapper);

        expect(seen).toEqual(["mousedown", "mouseup"]);
    });

    it("没有展开的浮层时不补发点击", async () => {
        wrapper = buildWrapper(true);
        await flush(wrapper);

        const surface = document.querySelector(".gz-panel__surface") as HTMLElement;
        const handler = vi.fn();
        surface.addEventListener("mousedown", handler);

        await wrapper.setProps({modelValue: false});
        await flush(wrapper);

        expect(handler).not.toHaveBeenCalled();
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
