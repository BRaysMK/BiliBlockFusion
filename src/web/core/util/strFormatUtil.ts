const toPlayCountOrBulletChat = (str: string | number | null | undefined): number => {
    // 调用方会用 -1 标记「该指标不存在」，数字直接返回：
    // 对它调用 str.split 会抛 TypeError，而首页/分区轮询每 3 秒重试一次，形成异常风暴。
    if (typeof str === 'number') {
        return Number.isFinite(str) ? str : -1
    }
    if (!str) {
        return -1
    }
    str = str.split(/[\t\r\f\n\s]*/g).join("")
    const replace = str.replace(/[^\d.]/g, '');
    if (str.endsWith('万') || str.endsWith('万次') || str.endsWith('万弹幕')) {
        return parseFloat(replace) * 10000;
    }
    if (str.endsWith('次') || str.endsWith('弹幕')) {
        return parseInt(replace);
    }
    return parseInt(str)
}


/**
 * 将时间字符串转换为秒，如果时间字符串为空，则返回 -1
 * @param timeStr {string}
 * @returns number
 */
const timeStringToSeconds = (timeStr: string | null | undefined): number => {
    if (!timeStr) {
        return -1
    }
    const parts = timeStr.split(':');
    switch (parts.length) {
        case 1:
            return Number(parts[0]);
        case 2:
            return Number(parts[0]) * 60 + Number(parts[1]);
        case 3:
            return Number(parts[0]) * 3600 + Number(parts[1]) * 60 + Number(parts[2]);
        default:
            throw new Error('Invalid time format');
    }
}
/**
 * 字符串处理
 */
export default {
    toPlayCountOrBulletChat,
    timeStringToSeconds
}
