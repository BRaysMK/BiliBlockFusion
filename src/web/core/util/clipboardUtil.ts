/**
 * 复制文本到剪贴板
 *
 * 优先用 Clipboard API；它要求安全上下文且可能被浏览器权限拦截，
 * 失败时退回 textarea + execCommand，覆盖油猴脚本所在的旧页面环境。
 */
export const copyText = async (text: string): Promise<boolean> => {
    try {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
            return true;
        }
    } catch {
        // Clipboard API 失败时尝试兼容旧页面环境。
    }
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    let copied = false;
    try {
        copied = document.execCommand('copy');
    } catch {
        copied = false;
    }
    textarea.remove();
    return copied;
};

export default {copyText};
