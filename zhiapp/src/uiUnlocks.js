import { reactive } from "vue";

// 勋章解锁通知队列（全局）
export const unlockQueue = reactive([]);
let seq = 0;

export function pushUnlocks(items) {
  if (!items || !items.length) return;
  unlockQueue.push({ id: ++seq, items: [...items] });
}
