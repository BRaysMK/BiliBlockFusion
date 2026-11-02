import {eventEmitter} from "../EventEmitter.ts";
import localMKData from "../../state/localMKData.ts";

/**
 * 精确匹配
 * @param ruleList {[]} 规则列表
 * @param value {string|number} 要匹配的值
 * @returns {boolean}
 */
const exactMatch = (ruleList: any[] | null | undefined, value: string | number): boolean => {
    if (ruleList === null || ruleList === undefined) return false;
    if (!Array.isArray(ruleList)) return false
    return ruleList.some(item => item === value);
}

const bFuzzyAndRegularMatchingWordsToLowercase = localMKData.bFuzzyAndRegularMatchingWordsToLowercase()

/**
 * 正则匹配，匹配上则返回规则列表中的规则，反之返回null
 * @param ruleList {[]} 规则列表
 * @param value {string} 要匹配的值
 * @return {string|null}
 */
const regexMatch = (ruleList: string[] | null | undefined, value: string): string | null => {
    if (ruleList === null || ruleList === undefined) return null;
    if (!Array.isArray(ruleList)) return null
    if (bFuzzyAndRegularMatchingWordsToLowercase) {
        value = value.toLowerCase();
    }
    // 不要预处理 value（例如删掉空白）：正则是用户手写的精确模式，
    // 任何隐式改写都会让带空格或 \s 的规则永远匹配不上。
    const find = ruleList.find(item => {
        try {
            return value.search(item) !== -1;
        } catch (e) {
            const msg = `正则匹配失败，请检查规则列表中的正则表达式是否正确，错误信息：${(e as Error).message}`;
            eventEmitter.send('正则匹配时异常', {e, msg})
            return false;
        }
    });
    return find === undefined ? null : find;
}

/**
 * 模糊匹配，匹配上则返回规则列表中的规则，反之返回null
 * @param ruleList {[string]} 规则列表
 * @param value {string} 要匹配的值
 * @return {string|null}
 */
const fuzzyMatch = (ruleList: string[] | null | undefined, value: string | null): string | null => {
    if (ruleList === null || ruleList === undefined || value === null) return null;
    if (!Array.isArray(ruleList)) return null
    // 模糊匹配固定忽略大小写（历史行为），两侧必须同时转小写：
    // 只转 value 时，规则里带一个大写字母就永远匹配不上。
    const lowerValue = value.toLowerCase();
    const find = ruleList.find(item => typeof item === 'string' && lowerValue.includes(item.toLowerCase()));
    return find === undefined ? null : find;
}

/**
 * 匹配方式
 */
export default {
    exactMatch,
    regexMatch,
    fuzzyMatch
}
