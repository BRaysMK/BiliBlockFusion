import ruleKeyListData from '../../config/ruleKeyListData.ts'
import {eventEmitter} from "../EventEmitter.ts";


//验证规则key是否是数字类类型
const isRuleIntType = (type: string): boolean => {
    const keyListData = ruleKeyListData.getRuleKeyListData();
    const find = keyListData.find((item: any) => item.key === type);
    if (find === undefined) {
        throw new Error('规则类型错误');
    }
    return find.type === 'int'
}

interface VerificationResult {
    status: boolean;
    res: string | number;
}

/** 校验规则值：int 类型必须是数字，其余按字符串判空 */
const verificationInputValue = (ruleValue: string | number | null, type: string): VerificationResult => {
    if (ruleValue === null) return {status: false, res: '内容不能为空'};
    if (isRuleIntType(type)) {
        ruleValue = parseInt(ruleValue as any);
        if (isNaN(ruleValue)) {
            return {
                status: false,
                res: '请输入数字！'
            };
        }
    } else {
        (ruleValue as string).trim();
    }
    if (ruleValue === '') {
        return {status: false, res: '内容不能为空'};
    }
    return {status: true, res: ruleValue};
}


/** 添加单条规则，已存在则返回失败 */
const addRule = (ruleValue: string | number, type: string): VerificationResult => {
    const verificationRes = verificationInputValue(ruleValue, type);
    if (!verificationRes.status) {
        return verificationRes
    }
    const arr = GM_getValue(type, []) as (string | number)[];
    if (arr.includes(verificationRes.res)) {
        return {status: false, res: '已存在此内容'};
    }
    arr.push(verificationRes.res);
    GM_setValue(type, arr);
    return {status: true, res: '添加成功'};
}

interface BatchAddResult {
    successList: (string | number)[];
    failList: (string | number)[];
}

/** 批量添加规则，返回成功/失败清单 */
const batchAddRule = (ruleValues: (string | number)[], type: string): BatchAddResult => {
    const successList: (string | number)[] = [];
    const failList: (string | number)[] = [];
    const arr = GM_getValue(type, []) as (string | number)[];
    const isIntType = isRuleIntType(type);
    for (let v of ruleValues) {
        if (isIntType) {
            if (isNaN(v as any)) {
                failList.push(v);
                continue;
            }
            v = parseInt(v as any);
        }
        if (arr.includes(v)) {
            failList.push(v);
            continue;
        }
        arr.push(v);
        successList.push(v);
    }
    if (successList.length > 0) {
        GM_setValue(type, arr);
    }
    return {
        successList,
        failList
    }
}

/** 删除单条规则值 */
const delRule = (type: string, value: string | number): VerificationResult => {
    const verificationRes = verificationInputValue(value, type);
    if (!verificationRes.status) {
        return verificationRes
    }
    const {res} = verificationRes
    const arr = GM_getValue(type, []) as (string | number)[];
    const indexOf = arr.indexOf(res);
    if (indexOf === -1) {
        return {status: false, res: '不存在此内容'};
    }
    arr.splice(indexOf, 1);
    GM_setValue(type, arr);
    return {status: true, res: "移除成功"}
}

/** 弹出输入框删除指定规则 */
const showDelRuleInput = async (type: string): Promise<void> => {
    let ruleValue: string;
    try {
        const {value} = await eventEmitter.invoke('el-prompt', '请输入要删除的规则内容', '删除指定规则');
        ruleValue = value
    } catch (e) {
        return
    }
    const {status, res} = delRule(type, ruleValue)
    eventEmitter.send('el-msg', res)
    status && eventEmitter.send('刷新规则信息');
}

interface RuleMap {
    [key: string]: (string | number)[];
}

/** 导出本地全部规则，isToStr 为 true 时返回 JSON 字符串 */
const getRuleContent = (isToStr: boolean = true, space: number = 0): string | RuleMap => {
    const ruleMap: RuleMap = {};
    for (let ruleKeyListDatum of ruleKeyListData.getRuleKeyListData()) {
        const key = ruleKeyListDatum.key;
        const data = GM_getValue(key, []) as (string | number)[];
        if (data.length === 0) continue;
        ruleMap[key] = data;
    }
    if (isToStr) {
        return JSON.stringify(ruleMap, null, space);
    }
    return ruleMap;
}

/** 解析导入的规则 JSON，丢弃空数组与非法值 */
const verificationRuleMap = (_keyArr: any[], content: string): false | RuleMap => {
    let parse: any;
    try {
        parse = JSON.parse(content);
    } catch (e) {
        alert('规则内容有误');
        return false;
    }
    const newRule: RuleMap = {};
    for (const key in parse) {
        if (!Array.isArray(parse[key])) {
            continue;
        }
        if (parse[key].length === 0) {
            continue;
        }
        newRule[key] = parse[key];
    }
    if (Object.keys(newRule).length === 0) {
        alert('规则内容为空');
        return false;
    }
    return newRule;
}

/** 覆盖导入规则 */
const overwriteImportRules = (content: string): boolean => {
    const map = verificationRuleMap(ruleKeyListData.getRuleKeyList(), content);
    if (map === false) return false;
    for (let key of Object.keys(map)) {
        GM_setValue(key, map[key]);
    }
    return true;
}

/** 追加导入规则（去重） */
const appendImportRules = (content: string): boolean => {
    const map = verificationRuleMap(ruleKeyListData.getRuleKeyList(), content);
    if (map === false) return false;
    for (let key of Object.keys(map)) {
        const arr = GM_getValue(key, []) as (string | number)[];
        for (let item of map[key]) {
            if (!arr.includes(item)) {
                arr.push(item);
            }
        }
        GM_setValue(key, arr);
    }
    return true;
}

/** 添加精确 uid，isTip 为 false 时由调用方自行提示 */
const addRulePreciseUid = (uid: number, isTip: boolean = true): VerificationResult => {
    const results = addRule(uid, "precise_uid");
    if (isTip) {
        eventEmitter.send('el-notify', {
            title: '添加精确uid操作提示',
            message: results.res,
            type: 'success'
        })
        return results
    }
    return results;
}
/**
 * 添加精确bv
 * @param bv {string} bv
 * @param isTip {boolean} 是否提示，默认true，则默认提示，如果为false则不提示，返回结果
 * @returns {{status: boolean, res: (string|number)}|{status: boolean, res: string}|{status: boolean, res: string}}
 */
const addRulePreciseBv = (bv: string, isTip: boolean = true): VerificationResult => {
    const results = addRule(bv, "precise_video_bv");
    if (isTip) {
        eventEmitter.send('el-notify', {
            title: '添加精确bv操作提示',
            message: results.res,
            type: 'success'
        })
        return results
    }
    return results;
}

/**
 * 删除精确uid
 * @param uid {number}
 * @param isTip {boolean} 是否提示，默认true，则默认提示，如果为false则不提示，返回结果
 * @returns {{status: boolean, res: string|number}|null}
 */
const delRUlePreciseUid = (uid: number, isTip: boolean = true): VerificationResult | null => {
    const results = delRule('precise_uid', uid)
    if (isTip) {
        eventEmitter.send('el-alert', results.res)
        return null
    }
    return results
}

/** 添加精确用户名，tip 为 false 时由调用方自行提示 */
const addRulePreciseName = (name: string, tip: boolean = true): VerificationResult => {
    const results = addRule(name, "precise_name");
    if (tip) {
        eventEmitter.send('el-msg', results.res)
    }
    return results;
}

/** 查找规则项，找不到返回 null */
const findRuleItemValue = (type: string, value: string | number): number | string | null => {
    return (GM_getValue(type, []) as (string | number)[]).find(item => item === value) || null
}

interface AddItemRuleResult {
    status: boolean;
    msg: string;
}

/** 批量写入规则项；coverage 为 true 覆盖、false 追加去重 */
const addItemRule = (arr: (string | number)[], key: string, coverage: boolean = true): AddItemRuleResult => {
    const complianceList: (string | number)[] = []
    for (let v of arr) {
        const {status, res} = verificationInputValue(v, key)
        if (!status) return {status: false, msg: `内容中有误:${res}`}
        complianceList.push(v)
    }
    if (coverage) {
        GM_setValue(key, complianceList)
        return {status: true, msg: `添加成功-覆盖模式，数量：${complianceList.length}`}
    }
    const oldArr = GM_getValue(key, []) as (string | number)[];
    const newList = complianceList.filter(item => !oldArr.includes(item))
    if (newList.length === 0) {
        return {status: false, msg: '内容重复'}
    }
    GM_setValue(key, oldArr.concat(newList))
    return {status: true, msg: '添加成功-追加模式，新增数量：' + newList.length}
}

/** 批量添加精确 uid；isTip 为 true 时弹提示并只返回状态 */
const addPreciseUidItemRule = (uidArr: number[], isTip: boolean = true, coverage: boolean = true): AddItemRuleResult | boolean => {
    const {status, msg} = addItemRule(uidArr, 'precise_uid', coverage)
    if (isTip) {
        eventEmitter.send('el-alert', msg)
        return status
    }
    return {status, msg}
}

export default {
    addRule,
    batchAddRule,
    showDelRuleInput,
    getRuleContent,
    overwriteImportRules,
    appendImportRules,
    addRulePreciseUid,
    addRulePreciseName,
    delRUlePreciseUid,
    findRuleItemValue,
    addItemRule,
    addPreciseUidItemRule,
    addRulePreciseBv, isRuleIntType
}
