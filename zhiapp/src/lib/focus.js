import { store } from "../store/state.js";
import { dayKey } from "../utils.js";
import { evaluateAchievements } from "./achievements.js";
import { pushUnlocks } from "../uiUnlocks.js";

// 完成一次专注（正计时/倒计时/番茄钟）后记录；不足 1 分钟不记录
export function recordFocus(type, activity, startAt, endAt, overrideMin) {
  const mins =
    overrideMin != null
      ? Number(overrideMin)
      : (endAt - startAt) / 60000;
  if (mins < 1) return false;
  const rec = {
    date: dayKey(new Date(endAt)),
    activity: activity || "",
    type, // stopwatch | countdown | pomodoro
    minutes: Math.round(mins * 10) / 10,
    startAt: startAt || endAt,
    endAt
  };
  store.addFocus(rec);
  announce();
  return rec;
}

// 任何数据变化后调用：评估并提示新解锁勋章（触发全局庆祝动画）
export function announce() {
  const fresh = evaluateAchievements();
  if (fresh.length) pushUnlocks(fresh);
  return fresh.length;
}
