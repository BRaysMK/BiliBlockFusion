import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {mount, type VueWrapper} from "@vue/test-utils";
import {h, nextTick} from "vue";

/**
 * 等级限制的上下界约束
 *
 * 曾出现过「数值改不动 + 不停弹警告」：四个 watch 在值越界时回写 ref 并弹 ElMessage，
 * 而 el-input-number 的钳位又会把值改回合法区间，两者互相推动形成无限循环。
 * 这组用例锁住：越界只能由 EP 的 :min/:max 钳位解决，watch 只负责持久化，不弹窗、不回写。
 */

const store: Record<string, unknown> = {};

/** 打桩 GM 存储与 EP 的提示组件，并把 el-input-number 换成一个可编程的受控替身 */
const setup = async (initial: Record<string, unknown>) => {
    Object.keys(store).forEach((k) => delete store[k]);
    Object.assign(store, initial);
    vi.stubGlobal("GM_getValue", (key: string, def: unknown) =>
        key in store ? store[key] : def);
    vi.stubGlobal("GM_setValue", (key: string, value: unknown) => {
        store[key] = value;
    });
    vi.resetModules();
    return import("../src/web/ui/views/UserLevelFilteringView.vue");
};

const mountView = async (component: any): Promise<VueWrapper> => mount(component.default, {
    global: {
        stubs: {
            // 受控替身：只把 min/max 渲染成 data 属性供断言，不做钳位（钳位行为由 EP 保证）。
            // 用 render 而不是 template：EP 会给组件传 size / controls-position 等一堆属性，
            // 落在真实 <input> 上会因非法 attribute 抛 DOMException。
            "el-input-number": {
                props: ["modelValue", "min", "max", "disabled"],
                emits: ["update:modelValue"],
                render(ctx: any) {
                    return h("input", {
                        class: "fake-number",
                        "data-value": String(ctx.modelValue),
                        "data-min": String(ctx.min),
                        "data-max": String(ctx.max),
                        "data-disabled": String(ctx.disabled),
                        onInput: (e: Event) => ctx.$emit("update:modelValue", Number((e.target as HTMLInputElement).value)),
                    }, []);
                },
            },
            "el-switch": {
                props: ["modelValue"],
                emits: ["update:modelValue"],
                template: '<button class="fake-switch" @click="$emit(\'update:modelValue\', !modelValue)">{{ modelValue }}</button>',
            },
            "el-tooltip": {template: "<span><slot/></span>"},
            "el-icon": {template: "<i><slot/></i>"},
            SettingRow: {
                props: ["label", "description", "stacked"],
                template: '<div class="row" :data-label="label"><slot/></div>',
            },
        },
    },
    attachTo: document.body,
});

/** 读取某一行的 min / max 约束 */
const boundsOf = (wrapper: VueWrapper, label: string) => {
    const row = wrapper.findAll(".row").find((r) => r.attributes("data-label") === label);
    return {
        min: Number(row!.find(".fake-number").attributes("data-min")),
        max: Number(row!.find(".fake-number").attributes("data-max")),
    };
};

const numberInputOf = (wrapper: VueWrapper, label: string) =>
    wrapper.findAll(".row").find((r) => r.attributes("data-label") === label)!.find(".fake-number");

describe("等级限制", () => {
    let wrapper: VueWrapper | undefined;

    beforeEach(() => {
        document.body.innerHTML = "";
    });

    afterEach(() => {
        wrapper?.unmount();
        wrapper = undefined;
        vi.unstubAllGlobals();
    });

    it("默认值落在输入框约束内，不触发任何改写", async () => {
        const mod = await setup({});
        wrapper = await mountView(mod);
        await nextTick();

        // 评论类曾把 :min 写死 3，而存储默认是 0 —— 冲突正是死循环的起点
        expect(boundsOf(wrapper, "评论·最小等级").min).toBe(0);
        expect(boundsOf(wrapper, "评论·最大等级").min).toBe(0);
        expect(numberInputOf(wrapper, "评论·最小等级").attributes("data-value")).toBe("0");
        expect(numberInputOf(wrapper, "评论·最大等级").attributes("data-value")).toBe("0");
    });

    it("两侧都未启用时，上界不互相限制", async () => {
        const mod = await setup({});
        wrapper = await mountView(mod);
        await nextTick();

        // 只启用一侧时另一侧的值不参与判定，不该被压到「对方 - 1」
        expect(boundsOf(wrapper, "视频·最小等级").max).toBe(7);
        expect(boundsOf(wrapper, "视频·最大等级").min).toBe(0);
    });

    it("两侧都启用后，最小值上界为「最大 - 1」、最大值下界为「最小 + 1」", async () => {
        const mod = await setup({
            is_enable_minimum_user_level_video_gm: true,
            is_enable_maximum_user_level_video_gm: true,
            minimum_user_level_video_gm: 2,
            maximum_user_level_video_gm: 5,
        });
        wrapper = await mountView(mod);
        await nextTick();

        expect(boundsOf(wrapper, "视频·最小等级").max).toBe(4);
        expect(boundsOf(wrapper, "视频·最大等级").min).toBe(3);
    });

    it("改值只落盘，不改写其它 ref、不弹提示", async () => {
        const {ElMessage} = await import("element-plus");
        const mod = await setup({
            is_enable_minimum_user_level_video_gm: true,
            is_enable_maximum_user_level_video_gm: true,
            minimum_user_level_video_gm: 1,
            maximum_user_level_video_gm: 5,
        });
        wrapper = await mountView(mod);
        await nextTick();

        const input = numberInputOf(wrapper, "视频·最小等级");
        await input.setValue("3");
        await nextTick();

        expect(store["minimum_user_level_video_gm"]).toBe(3);
        // 关键：改值不触发警告（原实现在 n === max 时会弹「不能等于最大等级」）
        expect(vi.mocked(ElMessage.warning ?? (() => {})).mock?.calls?.length ?? 0).toBe(0);
    });

    it("先设反向值再打开开关时，打开这一侧会把非法组合规整成合法区间", async () => {
        const mod = await setup({
            is_enable_minimum_user_level_comment_gm: true,
            is_enable_maximum_user_level_comment_gm: false,
            minimum_user_level_comment_gm: 6,
            maximum_user_level_comment_gm: 2,
        });
        wrapper = await mountView(mod);
        await nextTick();

        // 打开「最大等级」：它的值 2 不满足 > 最小 6，应被抬到 7（6 + 1 与上限 7 取小）
        const maxSwitch = wrapper.findAll(".row")
            .find((r) => r.attributes("data-label") === "评论·最大等级")!
            .find(".fake-switch");
        await maxSwitch.trigger("click");
        await nextTick();

        expect(store["is_enable_maximum_user_level_comment_gm"]).toBe(true);
        expect(store["maximum_user_level_comment_gm"]).toBe(7);
    });

    it("开关状态单独持久化，互不影响", async () => {
        const mod = await setup({});
        wrapper = await mountView(mod);
        await nextTick();

        const minSwitch = wrapper.findAll(".row")
            .find((r) => r.attributes("data-label") === "视频·最小等级")!
            .find(".fake-switch");
        await minSwitch.trigger("click");
        await nextTick();

        expect(store["is_enable_minimum_user_level_video_gm"]).toBe(true);
        expect(store["is_enable_maximum_user_level_video_gm"]).toBeUndefined();
    });
});
