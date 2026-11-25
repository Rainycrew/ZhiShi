import { state } from "../store/state.js";
import { currentStreak, longestStreak } from "../utils.js";

// ============ 勋章定义 ============
export const ACHIEVEMENTS = [
  {
    id: "check-1",
    name: "第一次打卡",
    icon: "shield",
    tier: 1,
    req: "完成第一次学习打卡",
    cond: (s) => s.checkinTotal >= 1
  },
  {
    id: "check-7",
    name: "七日签到",
    icon: "award",
    tier: 2,
    req: "累计打卡满 7 天",
    cond: (s) => s.checkinTotal >= 7
  },
  {
    id: "check-30",
    name: "月月不辍",
    icon: "award",
    tier: 3,
    req: "累计打卡满 30 天",
    cond: (s) => s.checkinTotal >= 30
  },
  {
    id: "streak-3",
    name: "小步连击",
    icon: "clock",
    tier: 1,
    req: "连续打卡达到 3 天",
    cond: (s) => s.maxStreak >= 3
  },
  {
    id: "streak-7",
    name: "一周到底",
    icon: "clock",
    tier: 2,
    req: "连续打卡达到 7 天",
    cond: (s) => s.maxStreak >= 7
  },
  {
    id: "streak-30",
    name: "铁打三十天",
    icon: "medal",
    tier: 4,
    req: "连续打卡达到 30 天",
    cond: (s) => s.maxStreak >= 30
  },
  {
    id: "net-fisher",
    name: "三天打鱼两天晒网",
    icon: "cert",
    tier: 1,
    req: "累计打卡满 5 天，却从未连续坚持 3 天（一种诚实）",
    cond: (s) => s.checkinTotal >= 5 && s.maxStreak < 3
  },
  {
    id: "early-bird",
    name: "早起的鸟儿",
    icon: "sunrise",
    tier: 3,
    req: "在 5:00 – 7:00 之间完成过打卡",
    cond: (s) => s.earlyBird
  },
  {
    id: "night-owl",
    name: "夜行侠",
    icon: "moon",
    tier: 2,
    req: "在 23:00 之后仍完成过一次学习/打卡",
    cond: (s) => s.nightOwl
  },
  {
    id: "focus-60",
    name: "专注一小时",
    icon: "timer",
    tier: 1,
    req: "单次专注达到 60 分钟",
    cond: (s) => s.longestFocus >= 60
  },
  {
    id: "focus-120",
    name: "专注大师",
    icon: "timer",
    tier: 3,
    req: "单次专注达到 120 分钟",
    cond: (s) => s.longestFocus >= 120
  },
  {
    id: "focus-600",
    name: "日拱一卒",
    icon: "flame",
    tier: 4,
    req: "累计专注满 10 小时",
    cond: (s) => s.totalFocusMin >= 600
  },
  {
    id: "exam-1",
    name: "旗开得胜",
    icon: "exam",
    tier: 1,
    req: "完成第一场考试",
    cond: (s) => s.examDone >= 1
  },
  {
    id: "exam-10",
    name: "考场常客",
    icon: "exam",
    tier: 3,
    req: "累计完成 10 场考试",
    cond: (s) => s.examDone >= 10
  },
  {
    id: "plan-1",
    name: "说到做到",
    icon: "panel",
    tier: 2,
    req: "完成第一个学习计划",
    cond: (s) => s.plansDone >= 1
  },
  {
    id: "cert-1",
    name: "初绽证书",
    icon: "cert",
    tier: 1,
    req: "收录第一份证书",
    cond: (s) => s.certCount >= 1
  },
  {
    id: "cert-5",
    name: "证书收藏家",
    icon: "medal",
    tier: 3,
    req: "收录 5 份证书",
    cond: (s) => s.certCount >= 5
  },
  {
    id: "award-1",
    name: "荣誉之始",
    icon: "award",
    tier: 1,
    req: "收录第一张奖状",
    cond: (s) => s.awardCount >= 1
  },
  {
    id: "diary-1",
    name: "写下心情",
    icon: "note",
    tier: 1,
    req: "写下第一篇心情日记",
    cond: (s) => s.diaryCount >= 1
  },
  {
    id: "diary-30",
    name: "日记成册",
    icon: "note",
    tier: 3,
    req: "累计写下 30 篇心情日记",
    cond: (s) => s.diaryCount >= 30
  }
];

export const TIER_NAME = { 1: "铜", 2: "银", 3: "金", 4: "曜" };

// ============ 汇总统计 ============
export function computeStats() {
  const checkinDates = state.checkins.map((c) => c.date);
  const early = state.checkins.some((c) => {
    const d = new Date(c.ts);
    const h = d.getHours();
    return h >= 5 && h < 7;
  });
  const night = state.checkins.some((c) => {
    const d = new Date(c.ts);
    return d.getHours() >= 23;
  }) || state.focus.some((f) => {
    const d = new Date(f.endAt || f.startAt);
    return d.getHours() >= 23;
  });
  const totalFocusMin = state.focus.reduce((s, f) => s + (Number(f.minutes) || 0), 0);
  return {
    checkinTotal: checkinDates.length,
    maxStreak: longestStreak(checkinDates),
    curStreak: currentStreak(checkinDates),
    earlyBird: early,
    nightOwl: night,
    totalFocusMin,
    focusCount: state.focus.length,
    longestFocus: state.focus.reduce((m, f) => Math.max(m, Number(f.minutes) || 0), 0),
    examDone: state.records.filter((r) => r.status === "done").length,
    plansDone: state.plans.filter((p) => p.done).length,
    certCount: state.certs.length,
    awardCount: state.awards.length,
    diaryCount: state.diary.length
  };
}

// 评估成就：返回本次新解锁列表
export function evaluateAchievements() {
  const s = computeStats();
  const fresh = [];
  for (const a of ACHIEVEMENTS) {
    if (!state.achievements[a.id] && a.cond(s)) {
      state.achievements[a.id] = Date.now();
      fresh.push(a);
    }
  }
  return fresh;
}

export function unlockedCount() {
  return Object.keys(state.achievements).length;
}

export function getAchievement(id) {
  return ACHIEVEMENTS.find((a) => a.id === id);
}
