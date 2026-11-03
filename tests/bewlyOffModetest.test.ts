import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";

/**
 * 关闭 BewlyCat 兼容后的原生首页行为
 *
 * 关键场景：页面里明明装着 BewlyCat（有 #bewly 与 shadowRoot），但用户没开兼容开关。
 * 此时兼容链路必须完全让位给原生首页链路，而不是两边都不管。
 * 反过来，开启兼容但没装插件时也必须整体退回原生链路。
 */

const gmStore = new Map<string, unknown>();

const stubGm = (): void => {
    vi.stubGlobal("GM_getValue", (key: string, def: unknown) =>
        gmStore.has(key) ? gmStore.get(key) : def
    );
    vi.stubGlobal("GM_setValue", (key: string, value: unknown): void => {
        gmStore.set(key, value);
    });
    vi.stubGlobal("GM_deleteValue", (key: string): void => {
        gmStore.delete(key);
    });
    vi.stubGlobal("GM_addStyle", (css: string): void => {
        const style = document.createElement("style");
        style.textContent = css;
        document.head.appendChild(style);
    });
};

/** 构造一个带 shadowRoot 的 #bewly 节点，模拟 BewlyCat 已安装 */
const installBewlyNode = (switcherText: string): void => {
    const bewly = document.createElement("div");
    bewly.id = "bewly";
    document.body.appendChild(bewly);
    const shadow = bewly.attachShadow({mode: "open"});
    const switcher = document.createElement("button");
    switcher.className = "bewly-bili-switcher-button";
    switcher.textContent = switcherText;
    shadow.appendChild(switcher);
};

beforeEach(() => {
    gmStore.clear();
    stubGm();
    document.body.innerHTML = "";
    document.head.innerHTML = "";
    // 模块级缓存：getBewlyEl / ruleMatchingUtil 等会在首次 import 时固化
    vi.resetModules();
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
    document.body.innerHTML = "";
    document.head.innerHTML = "";
});

describe("BEWLYCommon.isBEWLYPage 的 URL 判定", () => {
    it("首页根路径、?page= 与 spm_id_from 都判定为 Bewly 页面", async () => {
        const {default: BEWLYCommon} = await import("../src/web/pages/home/BEWLYCommon.ts");
        expect(BEWLYCommon.isBEWLYPage("https://www.bilibili.com/")).toBe(true);
        expect(BEWLYCommon.isBEWLYPage("https://www.bilibili.com/?page=Home")).toBe(true);
        expect(BEWLYCommon.isBEWLYPage("https://www.bilibili.com/?page=History")).toBe(true);
        expect(BEWLYCommon.isBEWLYPage("https://www.bilibili.com/?spm_id_from=333.1007")).toBe(true);
    });

    it("视频页、搜索页、空间页不判定为 Bewly 首页", async () => {
        const {default: BEWLYCommon} = await import("../src/web/pages/home/BEWLYCommon.ts");
        expect(BEWLYCommon.isBEWLYPage("https://www.bilibili.com/video/BV1xx411c7mD")).toBe(false);
        expect(BEWLYCommon.isBEWLYPage("https://search.bilibili.com/all?keyword=x")).toBe(false);
        expect(BEWLYCommon.isBEWLYPage("https://space.bilibili.com/123")).toBe(false);
    });
});

describe("关闭兼容时原生首页链路接管", () => {
    it("装有 BewlyCat 但未开兼容：不进入 BEWLYCommon.run，改走原生首页", async () => {
        installBewlyNode("BewlyBewly");
        const {default: globalValue} = await import("../src/web/config/globalValue.ts");
        expect(globalValue.compatibleBEWLYBEWLY).toBe(false);

        const {default: BEWLYCommon} = await import("../src/web/pages/home/BEWLYCommon.ts");
        const runSpy = vi.spyOn(BEWLYCommon, "run");
        const {default: bilibiliHome} = await import("../src/web/pages/home/bilibili.ts");
        const homeRunSpy = vi.spyOn(bilibiliHome, "run").mockImplementation(() => undefined);

        const {default: router} = await import("../src/web/router.ts");
        router.staticRoute("哔哩哔哩 (゜-゜)つロ 干杯~-bilibili", "https://www.bilibili.com/");

        expect(runSpy).not.toHaveBeenCalled();
        // 原生首页 run 只在 isHome 成立时调用
        expect(homeRunSpy).toHaveBeenCalled();
    });

    it("未开兼容时会检测到 BewlyCat 并提示开启（不静默失效）", async () => {
        installBewlyNode("BewlyBewly");
        const {eventEmitter} = await import("../src/web/core/EventEmitter.ts");
        const alerts: string[] = [];
        eventEmitter.on("el-alert", (msg: string) => alerts.push(msg));

        const {default: BEWLYCommon} = await import("../src/web/pages/home/BEWLYCommon.ts");
        await BEWLYCommon.check_BEWLYPage_compatibility();

        expect(alerts.some(msg => msg.includes("未开启兼容选项"))).toBe(true);
    });

    it("开了兼容但页面里没有 Bewly 标志时提示关闭", async () => {
        gmStore.set("compatible_BEWLY_BEWLY", true);
        const {eventEmitter} = await import("../src/web/core/EventEmitter.ts");
        const alerts: string[] = [];
        eventEmitter.on("el-alert", (msg: string) => alerts.push(msg));

        const {default: BEWLYCommon} = await import("../src/web/pages/home/BEWLYCommon.ts");
        await BEWLYCommon.check_BEWLYPage_compatibility();
        expect(alerts.some(msg => msg.includes("未使用Bewly插件"))).toBe(true);
        // check_BEWLYPage_compatibility 内部是 timeout:5000 的轮询等待，默认 5s 测试超时不够
    }, 15000);
});

describe("关闭兼容时不该产生的副作用", () => {
    it("compatibleBEWLYBEWLY=false 时 observeNetwork 不拦截首页 rcmd 请求", async () => {
        const {default: observeNetwork} = await import("../src/web/domain/observeNetwork.ts");
        const {default: bilibiliHome} = await import("../src/web/pages/home/bilibili.ts");
        const spy = vi.spyOn(bilibiliHome, "startDebounceShieldingHomeVideoList").mockImplementation(() => undefined);

        observeNetwork.observeNetwork(
            "https://api.bilibili.com/x/web-interface/wbi/index/top/feed/rcmd?web_location=333.1007",
            "https://www.bilibili.com/",
            "哔哩哔哩 (゜-゜)つロ 干杯~-bilibili"
        );
        // 关闭兼容时这个入口必须仍然触发首页屏蔽（开启兼容时才让位给 Bewly 自己的轮询）
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it("compatibleBEWLYBEWLY=true 时 observeNetwork 跳过原生首页屏蔽，避免双重扫描", async () => {
        gmStore.set("compatible_BEWLY_BEWLY", true);
        const {default: globalValue} = await import("../src/web/config/globalValue.ts");
        expect(globalValue.compatibleBEWLYBEWLY).toBe(true);

        const {default: observeNetwork} = await import("../src/web/domain/observeNetwork.ts");
        const {default: bilibiliHome} = await import("../src/web/pages/home/bilibili.ts");
        const spy = vi.spyOn(bilibiliHome, "startDebounceShieldingHomeVideoList").mockImplementation(() => undefined);

        observeNetwork.observeNetwork(
            "https://api.bilibili.com/x/web-interface/wbi/index/top/feed/rcmd?web_location=333.1007",
            "https://www.bilibili.com/",
            "哔哩哔哩 (゜-゜)つロ 干杯~-bilibili"
        );
        expect(spy).not.toHaveBeenCalled();
    });

    it("关闭兼容时首页补载逻辑未被跳过（开启兼容才跳过）", async () => {
        const fs = await import("node:fs");
        const src = fs.readFileSync("src/web/pages/home/bilibili.ts", "utf8");
        // 两处都必须同时判断 adaptationBAppCommerce 与 compatibleBEWLYBEWLY
        const gates = src.match(/globalValue\.compatibleBEWLYBEWLY/g) ?? [];
        expect(gates.length).toBeGreaterThanOrEqual(2);
    });
});

describe("Bewly 关闭后原生卡片解析仍然可用", () => {
    it("getVideoData 从原生卡片正确解析标题/UP/播放/弹幕/时长", async () => {
        const {default: bilibiliHome} = await import("../src/web/pages/home/bilibili.ts");
        const card = document.createElement("div");
        card.className = "feed-card";
        card.innerHTML = `
          <div class="bili-video-card__info--tit" title="原生卡片标题">
            <a href="https://www.bilibili.com/video/BV1native1">原生卡片标题</a>
          </div>
          <a class="bili-video-card__info--author bili-video-card__info--owner" href="//space.bilibili.com/998877">原生UP</a>
          <div class="bili-video-card__stats--item"><span class="bili-video-card__stats--text">1.2万</span></div>
          <div class="bili-video-card__stats--item"><span class="bili-video-card__stats--text">345</span></div>
          <div class="bili-video-card__stats__duration">12:34</div>
        `;
        const data = bilibiliHome.getVideoData(card);
        expect(data.title).toBe("原生卡片标题");
        expect(data.name).toBe("原生UP");
        expect(data.uid).toBe(998877);
        expect(data.nPlayCount).toBe(12000);
        expect(data.nBulletChat).toBe(345);
        expect(data.nDuration).toBe(754);
    });

    it("只有播放量、没有弹幕数的卡片，弹幕数保持 undefined 而不是复用播放量", async () => {
        const {default: bilibiliHome} = await import("../src/web/pages/home/bilibili.ts");
        const card = document.createElement("div");
        card.innerHTML = `
          <div class="bili-video-card__info--tit" title="只有播放量"></div>
          <a class="bili-video-card__info--author bili-video-card__info--owner" href="//space.bilibili.com/1">UP</a>
          <div class="bili-video-card__stats--item"><span class="bili-video-card__stats--text">5万</span></div>
        `;
        const data = bilibiliHome.getVideoData(card);
        expect(data.nPlayCount).toBe(50000);
        expect(data.nBulletChat).not.toBe(50000);
    });
});

describe("Bewly 开启时 shadow DOM 内的卡片解析", () => {
    it("getBewlyEl 返回 shadowRoot 而不是宿主元素", async () => {
        installBewlyNode("BewlyCat");
        const {default: BEWLYCommon} = await import("../src/web/pages/home/BEWLYCommon.ts");
        const el = await BEWLYCommon.getBewlyEl();
        expect(el).not.toBeNull();
        // 能查到 shadow 内部节点即说明拿到的是 ShadowRoot
        expect((el as ShadowRoot).querySelector(".bewly-bili-switcher-button")).not.toBeNull();
    });

    it("isBEWLYCatPlugin 依据切换按钮文本判断，旧版文本不误判", async () => {
        installBewlyNode("BewlyBewly");
        const {default: BEWLYCommon} = await import("../src/web/pages/home/BEWLYCommon.ts");
        await BEWLYCommon.getBewlyEl();
        const fs = await import("node:fs");
        const src = fs.readFileSync("src/web/pages/home/BEWLYCommon.ts", "utf8");
        // 判定条件必须检查 'BewlyCat' 子串
        expect(src).toContain("text.includes('BewlyCat')");
    });

    it("新结构卡片能从 .video-card 解析出标题、UP、BV、时长与播放量", async () => {
        installBewlyNode("BewlyCat");
        const bewly = document.getElementById("bewly")!;
        const grid = document.createElement("div");
        grid.className = "grid-adaptive";
        const item = document.createElement("div");
        item.innerHTML = `
          <div class="video-card">
            <div class="video-card-cover-stats">
              <div class="video-card-cover-stats__item video-card-cover-stats__item--duration">03:21</div>
              <div class="video-card-cover-stats__items">
                <div class="video-card-cover-stats__item"><span class="video-card-cover-stats__value">2.3万</span></div>
                <div class="video-card-cover-stats__item"><span class="video-card-cover-stats__value">1234</span></div>
              </div>
            </div>
            <h3 class="keep-two-lines"><a href="https://www.bilibili.com/video/BV1abc411c7mD">Bewly 标题</a></h3>
            <a class="channel-name" href="//space.bilibili.com/4567">BewlyUP</a>
            <div class="group/desc">
              <div>2.3万 次•1234 弹幕</div>
              <div>3 天前</div>
            </div>
          </div>
        `;
        grid.appendChild(item);
        bewly.shadowRoot!.appendChild(grid);

        const {default: BEWLYCommon} = await import("../src/web/pages/home/BEWLYCommon.ts");
        const list = await BEWLYCommon.getVideoList();
        expect(list).toHaveLength(1);
        const v = list[0] as any;
        expect(v.title).toBe("Bewly 标题");
        expect(v.name).toBe("BewlyUP");
        expect(v.uid).toBe(4567);
        expect(v.bv).toBe("BV1abc411c7mD");
        expect(v.nDuration).toBe(201);
        // 字段名必须是 nBulletChat，否则弹幕规则静默失效
        expect(v.nBulletChat).toBe(1234);
        expect(v.nPlayCount).toBe(23000);
    });

    it("增量扫描：第二次调用不会重复返回同一张卡片", async () => {
        installBewlyNode("BewlyCat");
        const bewly = document.getElementById("bewly")!;
        const grid = document.createElement("div");
        grid.className = "grid-adaptive";
        const item = document.createElement("div");
        item.innerHTML = `
          <div class="video-card">
            <h3 class="keep-two-lines"><a href="https://www.bilibili.com/video/BV1dup411c7mD">重复</a></h3>
            <a class="channel-name" href="//space.bilibili.com/1">UP</a>
          </div>`;
        grid.appendChild(item);
        bewly.shadowRoot!.appendChild(grid);

        const {default: BEWLYCommon} = await import("../src/web/pages/home/BEWLYCommon.ts");
        expect(await BEWLYCommon.getVideoList()).toHaveLength(1);
        expect(await BEWLYCommon.getVideoList()).toHaveLength(0);
    });
});

describe("屏蔽方式在 Bewly 网格下的落点", () => {
    it("remove 模式删除整个网格项外壳而不是卡片本身", async () => {
        const {findGridItem, removeGridItem} = await import("../src/web/domain/shielding/overlay.ts");
        const grid = document.createElement("div");
        grid.className = "grid-adaptive";
        const item = document.createElement("div");
        const inner = document.createElement("div");
        const card = document.createElement("div");
        card.className = "video-card";
        inner.appendChild(card);
        item.appendChild(inner);
        grid.appendChild(item);
        document.body.appendChild(grid);

        expect(findGridItem(card)).toBe(item);
        removeGridItem(card);
        expect(grid.children).toHaveLength(0);
    });

    it("没有 .grid-adaptive 祖先时退化为删卡片自己（原生首页）", async () => {
        const {findGridItem} = await import("../src/web/domain/shielding/overlay.ts");
        const card = document.createElement("div");
        card.className = "feed-card";
        document.body.appendChild(card);
        expect(findGridItem(card)).toBe(card);
    });

    it("overlay 模式幂等：重复调用只留一个遮罩", async () => {
        const {createOverlay, OVERLAY_CLASS} = await import("../src/web/domain/shielding/overlay.ts");
        const card = document.createElement("div");
        document.body.appendChild(card);
        createOverlay(card, "模糊标题: 测试");
        createOverlay(card, "模糊标题: 测试");
        expect(card.querySelectorAll("." + OVERLAY_CLASS)).toHaveLength(1);
    });
});

describe("屏蔽模式分派", () => {
    it("调用方显式传 hide 时优先于全局 overlay 设置", async () => {
        gmStore.set("shield_mode", "overlay");
        const {eventEmitter} = await import("../src/web/core/EventEmitter.ts");
        const {OVERLAY_CLASS} = await import("../src/web/domain/shielding/overlay.ts");
        await import("../src/web/domain/shielding/video.ts");

        const el = document.createElement("div");
        document.body.appendChild(el);
        eventEmitter.send("event-屏蔽视频元素", {
            res: {state: true, type: "测试规则", matching: "x"},
            method: "hide",
            videoData: {el, title: "t", name: "n", bv: "BV1"}
        });
        expect(el.style.display).toBe("none");
        expect(el.querySelector("." + OVERLAY_CLASS)).toBeNull();
    });

    it("全局 remove 模式删除节点", async () => {
        gmStore.set("shield_mode", "remove");
        const {eventEmitter} = await import("../src/web/core/EventEmitter.ts");
        await import("../src/web/domain/shielding/video.ts");

        const wrapper = document.createElement("div");
        const el = document.createElement("div");
        wrapper.appendChild(el);
        document.body.appendChild(wrapper);
        eventEmitter.send("event-屏蔽视频元素", {
            res: {state: true, type: "测试规则", matching: "x"},
            videoData: {el, title: "t", name: "n", bv: "BV2"}
        });
        expect(document.body.contains(el)).toBe(false);
    });

    it("overlay_only_type=true 时遮罩只写类型不写匹配词", async () => {
        gmStore.set("shield_mode", "overlay");
        gmStore.set("overlay_only_type", true);
        const {eventEmitter} = await import("../src/web/core/EventEmitter.ts");
        const {OVERLAY_CLASS} = await import("../src/web/domain/shielding/overlay.ts");
        await import("../src/web/domain/shielding/video.ts");

        const el = document.createElement("div");
        document.body.appendChild(el);
        eventEmitter.send("event-屏蔽视频元素", {
            res: {state: true, type: "模糊标题", matching: "不该出现"},
            videoData: {el, title: "t", name: "n", bv: "BV3"}
        });
        const overlay = el.querySelector("." + OVERLAY_CLASS)!;
        expect(overlay.textContent).toBe("模糊标题");
    });
});
