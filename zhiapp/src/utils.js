// 通用工具：id、时间、格式化、字节

export function uid() {
  try {
    return crypto.randomUUID();
  } catch {
    return "id-" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  }
}

export const pad2 = (n) => String(n).padStart(2, "0");

const WEEK = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

// 某一天的钟点问候
export function greeting(d = new Date()) {
  const h = d.getHours();
  if (h < 6) return "夜深了";
  if (h < 9) return "早上好";
  if (h < 12) return "上午好";
  if (h < 14) return "中午好";
  if (h < 18) return "下午好";
  return "晚上好";
}

export function fmtClock(d = new Date()) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function fmtClockSec(d = new Date()) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

// 2025-06-12 09:41
export function fmtDateTime(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(
    d.getHours()
  )}:${pad2(d.getMinutes())}`;
}

// 6月12日 周四
export function fmtDateCN(d = new Date()) {
  return `${d.getMonth() + 1}月${d.getDate()}日 ${WEEK[d.getDay()]}`;
}

export function fmtDateLine(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`;
}

// 秒 -> mm:ss / h:mm:ss
export function fmtDur(totalSec) {
  const s = Math.max(0, Math.ceil(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0 ? `${h}:${pad2(m)}:${pad2(sec)}` : `${pad2(m)}:${pad2(sec)}`;
}

export function fmtMin(min) {
  return min >= 60
    ? `${Math.floor(min / 60)} 小时${min % 60 ? ` ${min % 60} 分` : ""}`
    : `${min} 分钟`;
}

export function fmtBytes(b) {
  if (!b) return "0 B";
  const u = ["B", "KB", "MB", "GB"];
  let i = 0;
  let v = b;
  while (v >= 1024 && i < u.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v >= 100 ? Math.round(v) : v.toFixed(1)} ${u[i]}`;
}

export function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

// ---------- 日期工具 ----------
export function padDate(n) {
  return String(n).padStart(2, "0");
}

export function dayKey(d = new Date()) {
  return `${d.getFullYear()}-${padDate(d.getMonth() + 1)}-${padDate(d.getDate())}`;
}

export function parseDayKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// 相差天数（b - a，按自然日）
export function diffDays(aKey, bKey) {
  const a = parseDayKey(aKey).getTime();
  const b = parseDayKey(bKey).getTime();
  return Math.round((b - a) / 86400000);
}

export function addDaysKey(key, n) {
  const d = parseDayKey(key);
  d.setDate(d.getDate() + n);
  return dayKey(d);
}

// 归一为 'YYYY-MM-DD'（兼容 Date / 时间戳 / 字符串）
export function toDayKey(v) {
  if (typeof v === "string") {
    const m = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  }
  const d = v instanceof Date ? v : new Date(v);
  return dayKey(isNaN(d.getTime()) ? new Date() : d);
}

// 连续打卡最长天数（dates: Date/时间戳/'YYYY-MM-DD' 数组，自动去重）
export function longestStreak(dates) {
  if (!dates.length) return 0;
  const set = new Set(dates.map((d) => toDayKey(d)));
  let best = 0;
  for (const k of set) {
    if (set.has(addDaysKey(k, -1))) continue; // 非起点
    let cur = 1;
    let next = addDaysKey(k, 1);
    while (set.has(next)) {
      cur++;
      next = addDaysKey(next, 1);
    }
    best = Math.max(best, cur);
  }
  return best;
}

// 连续打卡当前天数（到今天为止）
export function currentStreak(dates) {
  const set = new Set(dates.map((d) => toDayKey(d)));
  let cur = 0;
  let k = dayKey();
  while (set.has(k)) {
    cur++;
    k = addDaysKey(k, -1);
  }
  return cur;
}

export function todayHour() {
  return new Date().getHours();
}

export function todayMinute() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}
