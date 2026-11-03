import type {ContentEditContext} from '../../types/contentViewer.ts'

/**
 * 「查看内容」抽屉里的编辑结果校验
 *
 * 抽屉把规则值以 JSON 文本呈现，保存前必须按规则键的取值形态重新校验：
 * uid / 房间号是数字数组、组合匹配是二维字符串数组、其余是一维字符串数组。
 * 直接信任文本框会写入类型错误的值，后续屏蔽逻辑用 includes/indexOf 比较时静默失效。
 */

export type ParseResult =
    | {ok: true; value: string[] | number[] | string[][]}
    | {ok: false; message: string}

/**
 * 解析并校验抽屉里的文本
 * @param context 规则键的编辑上下文
 * @param text 用户编辑后的 JSON 文本
 */
export const parseEditedContent = (context: ContentEditContext, text: string): ParseResult => {
    let parsed: unknown
    try {
        parsed = JSON.parse(text)
    } catch (e) {
        return {ok: false, message: '不是合法的 JSON 文本'}
    }
    if (!Array.isArray(parsed)) {
        return {ok: false, message: '内容必须是一个数组'}
    }
    if (context.combination) {
        const ok = parsed.every((row) => Array.isArray(row)
            && row.length > 0
            && row.every((tag) => typeof tag === 'string' && tag.trim() !== ''))
        if (!ok) {
            return {ok: false, message: '组合匹配的值必须是「字符串数组」的数组，且内层不能为空'}
        }
        return {ok: true, value: parsed as string[][]}
    }
    if (context.integer) {
        // 允许写成数字字符串，但必须能无损转成非负整数
        const numbers = parsed.map((item) => {
            if (typeof item === 'number') return item
            if (typeof item === 'string' && item.trim() !== '') return Number(item)
            return Number.NaN
        })
        if (!numbers.every((num) => Number.isInteger(num) && num >= 0)) {
            return {ok: false, message: '该规则的值必须是整数数字（uid、房间号等）'}
        }
        return {ok: true, value: numbers}
    }
    const ok = parsed.every((item) => typeof item === 'string' && item.trim() !== '')
    if (!ok) {
        return {ok: false, message: '规则项必须是非空字符串'}
    }
    return {ok: true, value: parsed as string[]}
}
