/**
 * 统一匹配引擎 (Universal Matcher)
 *
 * 将 ruleMatchingUtil (精确/模糊/正则) 和 shielding 中的 blockExactAndFuzzyMatching
 * 汇聚为单一入口，供所有屏蔽逻辑使用。
 *
 * 融合来源:
 *   - ruleMatchingUtil.js (BiBiBSP): exactMatch, fuzzyMatch, regexMatch
 *   - shielding.js:228 (BiBiBSP): blockExactAndFuzzyMatching 通用三阶段匹配模式
 *   - 脚本A (tjxwork): 原在各 handler 中重复的 if/else 精确vs正则匹配
 */

import ruleMatchingUtil from './ruleMatchingUtil.js';
import { returnTempVal } from '../data/globalValue.js';

const regexCache = new Map();

const getCachedRegExp = (pattern) => {
    let compiled = regexCache.get(pattern);
    if (!compiled) {
        compiled = new RegExp(pattern);
        regexCache.set(pattern, compiled);
    }
    return compiled;
};

/**
 * 执行精确+模糊+正则三阶段通用匹配
 *
 * 优先级: 精确 > 模糊 > 正则 (任一命中即返回)
 *
 * @param {string} val - 待匹配的字符串值
 * @param {Object} config - 配置项对象
 * @param {string} [config.exactKey] - 精确匹配规则在 GM 存储中的键名
 * @param {string} [config.exactTypeName] - 精确匹配类型的显示名称
 * @param {Array} [config.exactRuleArr] - 精确匹配规则数组（若未提供则通过 exactKey 从存储获取）
 * @param {string} [config.fuzzyKey] - 模糊匹配规则在 GM 存储中的键名
 * @param {string} [config.fuzzyTypeName] - 模糊匹配类型的显示名称
 * @param {Array} [config.fuzzyRuleArr] - 模糊匹配规则数组
 * @param {string} [config.regexKey] - 正则匹配规则在 GM 存储中的键名
 * @param {string} [config.regexTypeName] - 正则匹配类型的显示名称
 * @param {Array} [config.regexRuleArr] - 正则匹配规则数组
 * @returns {{state: boolean, type: string, matching: string}|Object} 匹配成功返回 {state:true,...}，否则返回 returnTempVal
 */
export function blockExactAndFuzzyMatching(val, config) {
    if (!val) {
        return returnTempVal;
    }
    const {
        exactKey, exactTypeName,
        exactRuleArr = (exactKey ? GM_getValue(exactKey, []) : null)
    } = config;
    if (exactKey && exactRuleArr) {
        if (ruleMatchingUtil.exactMatch(exactRuleArr, val)) {
            return { state: true, type: exactTypeName, matching: val };
        }
    }
    let matching;
    const {
        fuzzyKey, fuzzyTypeName,
        fuzzyRuleArr = (fuzzyKey ? GM_getValue(fuzzyKey, []) : null),
    } = config;
    if (fuzzyKey && fuzzyRuleArr) {
        matching = ruleMatchingUtil.fuzzyMatch(fuzzyRuleArr, val);
        if (matching) {
            return { state: true, type: fuzzyTypeName, matching };
        }
    }
    const {
        regexKey, regexTypeName,
        regexRuleArr = (regexKey ? GM_getValue(regexKey, []) : null)
    } = config;
    if (regexKey && regexRuleArr) {
        matching = ruleMatchingUtil.regexMatch(regexRuleArr, val);
        if (matching) {
            return { state: true, type: regexTypeName, matching };
        }
    }
    return returnTempVal;
}

/**
 * 脚本A 兼容: 精确+正则双模式匹配 (无模糊匹配环节)
 * 对应脚本A中每个 handler 的 if (useRegex) { ... } else { ... } 模式
 *
 * @param {string} val - 待匹配值
 * @param {string[]} ruleArray - 规则数组
 * @param {boolean} useRegex - 是否启用正则模式
 * @param {string} typeName - 屏蔽类型显示名称
 * @returns {{state: boolean, type: string, matching: string}|Object}
 */
export function blockExactOrRegex(val, ruleArray, useRegex, typeName) {
    if (!val || !ruleArray || ruleArray.length === 0) {
        return returnTempVal;
    }
    if (useRegex) {
        const hit = ruleArray.find(item => {
            try {
                return getCachedRegExp(item).test(val);
            } catch (e) {
                console.warn(`正则匹配异常 [${typeName}]:`, e.message);
                return false;
            }
        });
        if (hit) return { state: true, type: typeName, matching: hit };
    } else {
        const hit = ruleArray.find(item => item === val);
        if (hit) return { state: true, type: typeName, matching: hit };
    }
    return returnTempVal;
}

/**
 * 脚本A 兼容: 标签数组匹配 (遍历 tags 找命中)
 *
 * @param {string[]} tags - 当前视频的标签数组
 * @param {string[]} ruleArray - 屏蔽规则数组
 * @param {boolean} useRegex - 是否启用正则
 * @param {string} typeName - 屏蔽类型名称
 * @returns {{state: boolean, type: string, matching: string}|Object}
 */
export function blockTagsMatch(tags, ruleArray, useRegex, typeName) {
    if (!tags || tags.length === 0 || !ruleArray || ruleArray.length === 0) {
        return returnTempVal;
    }
    if (useRegex) {
        for (const rule of ruleArray) {
            try {
                const regEx = getCachedRegExp(rule);
                const hit = tags.find(tag => regEx.test(tag));
                if (hit) return { state: true, type: typeName, matching: hit };
            } catch (e) {
                console.warn(`标签正则匹配异常 [${typeName}]:`, e.message);
            }
        }
    } else {
        for (const rule of ruleArray) {
            const hit = tags.find(tag => tag === rule);
            if (hit) return { state: true, type: typeName, matching: hit };
        }
    }
    return returnTempVal;
}

/**
 * 脚本A 兼容: 双重标签匹配 (两个标签同时存在于 tags 中才算命中)
 *
 * @param {string[]} tags - 当前视频的标签数组
 * @param {string[]} ruleArray - 双重标签规则数组 (格式: "tagA|tagB")
 * @param {boolean} useRegex - 是否启用正则
 * @param {string} typeName - 屏蔽类型名称
 * @returns {{state: boolean, type: string, matching: string}|Object}
 */
export function blockDoubleTagsMatch(tags, ruleArray, useRegex, typeName) {
    if (!tags || tags.length === 0 || !ruleArray || ruleArray.length === 0) {
        return returnTempVal;
    }
    if (useRegex) {
        const hit = ruleArray.find(rule => {
            const [a, b] = rule.split('|');
            try {
                const regA = getCachedRegExp(a);
                const regB = getCachedRegExp(b);
                return tags.some(t => regA.test(t)) && tags.some(t => regB.test(t));
            } catch (e) { return false; }
        });
        if (hit) return { state: true, type: typeName, matching: hit };
    } else {
        const hit = ruleArray.find(rule => {
            const [a, b] = rule.split('|');
            return tags.includes(a) && tags.includes(b);
        });
        if (hit) return { state: true, type: typeName, matching: hit };
    }
    return returnTempVal;
}

// 重新导出底层匹配函数，方便其他地方直接使用
export { default as ruleMatchingUtil } from './ruleMatchingUtil.js';
