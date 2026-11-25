import { reactive } from "vue";

// 全局轻提示（toast）状态与触发函数
export const toasts = reactive([]);
let seq = 0;

export function toast(message, type = "ok", duration = 2600) {
  const id = ++seq;
  toasts.push({ id, message, type });
  setTimeout(() => {
    const i = toasts.findIndex((t) => t.id === id);
    if (i >= 0) toasts.splice(i, 1);
  }, duration);
}
