// 开发者解锁（仅本次会话有效，保存后自动重新上锁）
import { reactive } from "vue";

export const dev = reactive({
  unlocked: false,
  showPass: false,
  pass: "",
  tap: 0
});

let tapTimer = null;

// 点「设置」按钮累计 5 下（2.4s 内）即弹出口令框
export function tapDev() {
  dev.tap++;
  if (tapTimer) clearTimeout(tapTimer);
  tapTimer = setTimeout(() => {
    dev.tap = 0;
  }, 2400);
  if (dev.tap >= 5) {
    dev.tap = 0;
    dev.showPass = true;
  }
}

export function closeDev() {
  dev.showPass = false;
  dev.pass = "";
}
