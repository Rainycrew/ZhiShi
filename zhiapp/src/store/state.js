import { reactive, watch } from "vue";
import { uid, dayKey, currentStreak, longestStreak } from "../utils.js";

// ============ 本地数据（localStorage 持久化，不含文件内容） ============

const LS_KEY = "zhishi.pad.v1";

function now() {
  return Date.now();
}

function defaultProfile() {
  return {
    name: "",
    title: "普通用户", // 称号（黄V旁文字）
    vEnabled: true, // 是否显示黄V
    avatarKey: null, // IndexedDB 中头像的 key
    panelUrl: "", // 预留：数据看板地址
    setupReward: false // 头像+姓名是否已领过初始奖励
  };
}

export function createTemplate(kind, name) {
  const t = {
    id: uid(),
    kind, // 'standard' 普通考试 | 'listening' 英语听力
    name: name || (kind === "listening" ? "英语听力考试" : "未命名考试"),
    durationMin: kind === "listening" ? 30 : 60,
    createdAt: now(),
    updatedAt: now(),
    // 提示节点：[{id,label, atType:'start'|'beforeEnd'|'end'|'atSec', value, sound}]
    //   sound: null=静音 | {mode:'builtin', tone:'begin'|'warn'|'end'|'ding'}
    //        | {mode:'folder', file:'xxx.wav'} | {mode:'library', key, name}
    nodes: []
  };
  // 默认节点
  if (kind === "listening") {
    t.nodes = [
      node("提醒", "beforeEnd", 5, { mode: "builtin", tone: "warn" }),
      node("结束", "end", 0, { mode: "builtin", tone: "end" })
    ];
  } else {
    t.nodes = [
      node("开始", "start", 0, { mode: "builtin", tone: "begin" }),
      node("最后15分钟", "beforeEnd", 15, { mode: "builtin", tone: "warn" }),
      node("结束", "end", 0, { mode: "builtin", tone: "end" })
    ];
  }
  return t;
}

function node(label, atType, value, sound) {
  return { id: uid(), label, atType, value, sound: sound || null };
}

function defaultState() {
  return {
    profile: defaultProfile(),
    templates: [], // 考试模板
    records: [], // 考试记录（结束时/退出时写入）
    certs: [], // 证书
    awards: [], // 奖状
    clock: {
      preset: "ink", // 预设背景 id
      bgKey: null, // 自定义背景图 key
      showSeconds: true, // 默认显示秒
      showDate: true,
      noise: "off", // 白噪音：off | white | rain | wind
      noiseVol: 0.35,
      mode: "clock" // clock | stopwatch | countdown | pomodoro
    },
    // ===== v2 新增模块 =====
    plans: [], // 计划目标
    checkins: [], // 打卡 [{date:'YYYY-MM-DD', ts}]
    focus: [], // 专注记录 [{id,date,activity,type,minutes,startAt,endAt}]
    diary: [], // 心情日记 [{id,date,mood,text,createdAt,updatedAt}]
    achievements: {}, // {id: unlockedAt}
    // ===== v3 积分 / 皮肤 =====
    points: 5, // 积分余额（初始赠送 5）
    streakRewarded: [], // 已奖励过的连续打卡里程碑（10/20/30…）
    dailyRewarded: [], // 已发过“当日 +2”的日期（取消后当天再打卡不重复加分）
    skins: { owned: ["bi"], equipped: "bi" }, // 打卡按钮皮肤（默认「笔打卡动画按钮」已拥有）
    glass: { owned: false, equipped: false }, // 底部 Dock 毛玻璃皮肤
    // ===== v3.1 商城扩展 =====
    clockskin: { owned: [], equipped: null }, // 时钟工作台皮肤
    theme: { owned: [], equipped: null }, // 主题/强调色皮肤
    cardskin: { owned: [], equipped: null }, // 打卡天数卡片皮肤
    avatarframe: { owned: [], equipped: null }, // 头像框
    mark: { owned: ["yelloV"], equipped: "yelloV" }, // 标识徽章（默认黄V）
    noiseskin: { owned: [], equipped: null } // 白噪音皮肤（商城购买，时钟白噪音里可用）
  };
}

function load() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    const base = defaultState();
    const profile = { ...base.profile, ...(parsed.profile || {}) };
    // 老版本默认称号迁移：认证用户 → 普通用户
    if (profile.title === "认证用户") profile.title = "普通用户";
    return {
      profile,
      templates: Array.isArray(parsed.templates) ? parsed.templates : [],
      records: Array.isArray(parsed.records) ? parsed.records : [],
      certs: Array.isArray(parsed.certs) ? parsed.certs : [],
      awards: Array.isArray(parsed.awards) ? parsed.awards : [],
      clock: { ...base.clock, ...(parsed.clock || {}) },
      plans: Array.isArray(parsed.plans) ? parsed.plans : [],
      checkins: Array.isArray(parsed.checkins) ? parsed.checkins : [],
      focus: Array.isArray(parsed.focus) ? parsed.focus : [],
      diary: Array.isArray(parsed.diary) ? parsed.diary : [],
      achievements:
        parsed.achievements && typeof parsed.achievements === "object"
          ? parsed.achievements
          : {},
      points: Number.isFinite(parsed.points) ? parsed.points : 5,
      streakRewarded: Array.isArray(parsed.streakRewarded) ? parsed.streakRewarded : [],
      dailyRewarded: Array.isArray(parsed.dailyRewarded) ? parsed.dailyRewarded : [],
      skins: {
        owned: Array.isArray(parsed.skins?.owned) ? parsed.skins.owned : ["bi"],
        equipped: parsed.skins?.equipped || "bi"
      },
      glass: {
        owned: !!parsed.glass?.owned,
        equipped: !!parsed.glass?.equipped
      },
      clockskin: {
        owned: Array.isArray(parsed.clockskin?.owned) ? parsed.clockskin.owned : [],
        equipped: parsed.clockskin?.equipped || null
      },
      theme: {
        owned: Array.isArray(parsed.theme?.owned) ? parsed.theme.owned : [],
        equipped: parsed.theme?.equipped || null
      },
      cardskin: {
        owned: Array.isArray(parsed.cardskin?.owned) ? parsed.cardskin.owned : [],
        equipped: parsed.cardskin?.equipped || null
      },
      avatarframe: {
        owned: Array.isArray(parsed.avatarframe?.owned) ? parsed.avatarframe.owned : [],
        equipped: parsed.avatarframe?.equipped || null
      },
      mark: {
        owned: Array.isArray(parsed.mark?.owned) && parsed.mark.owned.length ? parsed.mark.owned : ["yelloV"],
        equipped: parsed.mark?.equipped || "yelloV"
      },
      noiseskin: {
        owned: Array.isArray(parsed.noiseskin?.owned) ? parsed.noiseskin.owned : [],
        equipped: parsed.noiseskin?.equipped || null
      }
    };
  } catch (e) {
    console.warn("读取本地数据失败", e);
    return defaultState();
  }
}

export const state = reactive(load());
persist(); // 立即写回：确保“普通用户”等默认值/迁移生效

function persist() {
  try {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({
        profile: state.profile,
        templates: state.templates,
        records: state.records,
        certs: state.certs,
        awards: state.awards,
        clock: state.clock,
        plans: state.plans,
        checkins: state.checkins,
        focus: state.focus,
        diary: state.diary,
        achievements: state.achievements,
        points: state.points,
        streakRewarded: state.streakRewarded,
        dailyRewarded: state.dailyRewarded,
        skins: state.skins,
        glass: state.glass,
        clockskin: state.clockskin,
        theme: state.theme,
        cardskin: state.cardskin,
        avatarframe: state.avatarframe,
        mark: state.mark,
        noiseskin: state.noiseskin
      })
    );
  } catch (e) {
    console.warn("保存本地数据失败", e);
  }
}

watch(state, persist, { deep: true });
window.addEventListener("storage", () => {
  // 多标签页同步
  const loaded = load();
  Object.assign(state.profile, loaded.profile);
  state.templates = loaded.templates;
  state.records = loaded.records;
  state.certs = loaded.certs;
  state.awards = loaded.awards;
  Object.assign(state.clock, loaded.clock);
  state.plans = loaded.plans;
  state.checkins = loaded.checkins;
  state.focus = loaded.focus;
  state.diary = loaded.diary;
  state.achievements = loaded.achievements;
  state.points = loaded.points;
  state.streakRewarded = loaded.streakRewarded;
  state.dailyRewarded = loaded.dailyRewarded;
  state.skins = loaded.skins;
  state.glass = loaded.glass;
  state.clockskin = loaded.clockskin;
  state.theme = loaded.theme;
  state.cardskin = loaded.cardskin;
  state.avatarframe = loaded.avatarframe;
  state.mark = loaded.mark;
  state.noiseskin = loaded.noiseskin;
});

// ============ 业务操作 ============

export const store = {
  // 模板
  upsertTemplate(tpl) {
    const i = state.templates.findIndex((t) => t.id === tpl.id);
    if (i >= 0) state.templates[i] = tpl;
    else state.templates.unshift(tpl);
  },
  removeTemplate(id) {
    state.templates = state.templates.filter((t) => t.id !== id);
  },
  getTemplate(id) {
    return state.templates.find((t) => t.id === id) || null;
  },
  // 记录
  addRecord(rec) {
    state.records.unshift(rec);
  },
  removeRecord(id) {
    state.records = state.records.filter((r) => r.id !== id);
  },
  clearRecords() {
    state.records = [];
  },
  clearTemplates() {
    state.templates = [];
  },
  // 证书 / 奖状
  addCert(c) {
    state.certs.unshift({ id: uid(), createdAt: now(), ...c });
  },
  removeCert(id) {
    state.certs = state.certs.filter((c) => c.id !== id);
  },
  clearCerts() {
    state.certs = [];
  },
  addAward(a) {
    state.awards.unshift({ id: uid(), createdAt: now(), ...a });
  },
  removeAward(id) {
    state.awards = state.awards.filter((a) => a.id !== id);
  },
  clearAwards() {
    state.awards = [];
  },
  // ===== v2 =====
  // 计划
  addPlan(p) {
    state.plans.unshift({ id: uid(), createdAt: now(), done: false, ...p });
  },
  updatePlan(id, patch) {
    const p = state.plans.find((x) => x.id === id);
    if (p) Object.assign(p, patch, { updatedAt: now() });
  },
  removePlan(id) {
    state.plans = state.plans.filter((p) => p.id !== id);
  },
  // 打卡
  addCheckin() {
    const d = dayKey();
    if (state.checkins.some((c) => c.date === d)) return false;
    state.checkins.push({ date: d, ts: now() });
    return true;
  },
  removeCheckin(date) {
    state.checkins = state.checkins.filter((c) => c.date !== date);
  },
  // ===== v3 积分 =====
  addPoints(n) {
    state.points += n;
  },
  spendPoints(n) {
    if (state.points < n) return false;
    state.points -= n;
    return true;
  },
  // 打卡奖励：每天仅 +2 一次（取消后当天再打卡不重复加）；每满连续 10/20/30…天再 +10（每个里程碑一次）
  // 返回 { gained, milestone, streak }
  rewardCheckin() {
    const today = dayKey();
    let gained = 0;
    // 当日基础分：只在当天第一次打卡时给一次
    if (!state.dailyRewarded.includes(today)) {
      state.dailyRewarded.push(today);
      gained += 2;
    }
    const dates = state.checkins.map((c) => c.date);
    const maxStreak = longestStreak(dates);
    const fresh = [];
    for (let m = 10; m <= maxStreak; m += 10) {
      if (!state.streakRewarded.includes(m)) {
        state.streakRewarded.push(m);
        fresh.push(m);
        gained += 10;
      }
    }
    state.points += gained;
    return { gained, milestone: fresh.length > 0, streak: currentStreak(dates) };
  },
  // 头像+姓名非默认：首次一次性 +5
  rewardSetup() {
    if (state.profile.setupReward) return 0;
    const hasName = state.profile.name && state.profile.name.trim().length > 0;
    const hasAvatar = !!state.profile.avatarKey;
    if (!(hasName && hasAvatar)) return 0;
    state.profile.setupReward = true;
    state.points += 5;
    return 5;
  },
  // 打卡按钮皮肤
  buySkin(id, price = 10) {
    if (state.skins.owned.includes(id)) return { ok: false, reason: "owned" };
    if (!this.spendPoints(price)) return { ok: false, reason: "points" };
    state.skins.owned.push(id);
    this.equipSkin(id);
    return { ok: true };
  },
  equipSkin(id) {
    if (!state.skins.owned.includes(id)) return false;
    state.skins.equipped = id;
    return true;
  },
  // 底部 Dock 毛玻璃皮肤
  buyGlass(price = 15) {
    if (state.glass.owned) return { ok: false, reason: "owned" };
    if (!this.spendPoints(price)) return { ok: false, reason: "points" };
    state.glass.owned = true;
    state.glass.equipped = true;
    return { ok: true };
  },
  equipGlass(on) {
    if (on && !state.glass.owned) return false;
    state.glass.equipped = on;
    return true;
  },
  // 通用商城购买/装备：clockskin / theme / cardskin / avatarframe
  buyExtra(slot, id, price) {
    if (!state[slot]) return { ok: false, reason: "slot" };
    if (state[slot].owned.includes(id)) return { ok: false, reason: "owned" };
    if (!this.spendPoints(price)) return { ok: false, reason: "points" };
    state[slot].owned.push(id);
    state[slot].equipped = id;
    return { ok: true };
  },
  equipExtra(slot, id) {
    if (!state[slot]) return false;
    if (!state[slot].owned.includes(id)) return false;
    state[slot].equipped = id;
    return true;
  },
  unequipExtra(slot) {
    if (!state[slot]) return false;
    state[slot].equipped = null;
    return true;
  },
  // 专注记录
  addFocus(f) {
    state.focus.unshift({ id: uid(), createdAt: now(), ...f });
  },
  removeFocus(id) {
    state.focus = state.focus.filter((x) => x.id !== id);
  },
  clearFocus() {
    state.focus = [];
  },
  // 心情日记
  addDiary(d) {
    state.diary.unshift({ id: uid(), createdAt: now(), updatedAt: now(), ...d });
  },
  updateDiary(id, patch) {
    const d = state.diary.find((x) => x.id === id);
    if (d) Object.assign(d, patch, { updatedAt: now() });
  },
  removeDiary(id) {
    state.diary = state.diary.filter((x) => x.id !== id);
  },
  clearDiary() {
    state.diary = [];
  }
};
