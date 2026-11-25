<script setup>
import { ref, computed } from "vue";
import { state } from "../store/state.js";
import { navigate } from "../router.js";
import Icon from "../components/Icon.vue";
import Avatar from "../components/Avatar.vue";
import VMark from "../components/VMark.vue";
import { greeting, fmtDateCN, fmtClock, fmtDateTime } from "../utils.js";
import { useNow } from "../composables/useNow.js";
import { usePageMotion } from "../composables/useMotion.js";
import { toast } from "../ui.js";
import { computeStats, ACHIEVEMENTS } from "../lib/achievements.js";
import { dayKey, diffDays } from "../utils.js";

const root = ref(null);
usePageMotion(root);

const now = useNow(1000);
const profile = computed(() => state.profile);
const latest = computed(() => state.records.slice(0, 3));
const templates = computed(() => state.templates);
const stats = computed(() => computeStats());

const nextExam = computed(() => {
  const future = state.plans
    .filter((p) => p.targetDate && !p.done)
    .map((p) => ({ p, days: diffDays(dayKey(), p.targetDate) }))
    .filter((x) => x.days >= 0)
    .sort((a, b) => a.days - b.days);
  return future[0] || null;
});

const tiles = [
  { key: "exam", title: "考试中心", desc: "普通考试 · 英语听力，时长与定点音频", icon: "exam", to: "exam", accent: true },
  { key: "clock", title: "时钟工作台", desc: "翻页时钟 · 正计时 · 倒计时 · 番茄钟", icon: "clock", to: "clock" },
  { key: "plan", title: "计划打卡", desc: "考试倒计时 · 每日打卡 · 勋章成就", icon: "panel", to: "plan" },
  { key: "profile", title: "我的主页", desc: "证书 · 奖状 · 日记 · 数据备份", icon: "user", to: "profile" }
];

function startQuick() {
  const t = templates.value[0];
  if (!t) return navigate("exam");
  if (t.kind === "listening" && !t.listeningKey) {
    toast("该听力考试尚未上传听力音频，请先配置", "err");
    navigate("exam-edit", { id: t.id });
    return;
  }
  navigate("exam-run", { id: t.id });
}

function achievementNames() {
  const ids = Object.keys(state.achievements);
  const fresh = ACHIEVEMENTS.filter((a) => ids.includes(a.id)).slice(0, 5);
  return fresh.map((a) => a.name);
}
</script>

<template>
  <div ref="root">
    <!-- 问候区 -->
    <section class="hero card" data-reveal @click="navigate('profile')">
      <span class="orb" data-float aria-hidden="true"></span>
      <div class="hero-main">
        <div class="hero-top">
          <Avatar :avatar-key="profile.avatarKey" :name="profile.name" :size="60" class="hero-avatar" :frame="state.avatarframe.equipped || ''" />
          <div class="hero-text">
            <div class="hero-greet">
              {{ greeting() }}，<b>{{ profile.name || "同学" }}</b>
              <span v-if="profile.vEnabled && profile.title" class="title-pill">
                <VMark :size="16" />
                <span>{{ profile.title }}</span>
              </span>
            </div>
            <div class="hero-date">{{ fmtDateCN(now) }} · {{ fmtClock(now) }}</div>
          </div>
        </div>
        <p class="hero-sub">
          {{ stats.curStreak ? `已连续打卡 ${stats.curStreak} 天，今天也请保持节奏。` : "开始今天的第一个计划吧。" }}
        </p>
      </div>
      <div class="hero-right">
        <button class="btn btn-primary" @click.stop="startQuick()">
          <Icon name="play" :size="15" /> {{ templates.length ? "继续最近考试" : "创建考试" }}
        </button>
      </div>
    </section>

    <!-- 数据横条 -->
    <section class="stat-bar">
      <div class="stat-chip" data-reveal @click="navigate('plan')">
        <b class="tnum" :data-count="stats.curStreak">{{ stats.curStreak }}</b><span>连续打卡天</span>
      </div>
      <div class="stat-chip" data-reveal @click="navigate('plan')">
        <b class="tnum" :data-count="stats.checkinTotal">{{ stats.checkinTotal }}</b><span>累计打卡</span>
      </div>
      <div class="stat-chip" data-reveal @click="navigate('profile')">
        <b class="tnum" :data-count="Math.round(stats.totalFocusMin)">{{ Math.round(stats.totalFocusMin) }}</b><span>专注分钟</span>
      </div>
      <div class="stat-chip accent" data-reveal @click="navigate('profile')">
        <b class="tnum" :data-count="Object.keys(state.achievements).length">{{ Object.keys(state.achievements).length }}</b><span>勋章</span>
      </div>
      <div class="stat-chip accent" data-reveal @click="navigate('shop')">
        <b class="tnum" :data-count="state.points">{{ state.points }}</b><span>积分</span>
      </div>
    </section>

    <!-- 考试倒计时 -->
    <button v-if="nextExam" class="cd-banner card" @click="navigate('plan')">
      <span class="cd-ic"><Icon name="exam" :size="20" /></span>
      <span class="cd-main">
        <span class="cd-label">考试倒计时</span>
        <span class="cd-name">{{ nextExam.p.title }}</span>
      </span>
      <span class="cd-count">
        <b class="tnum" :data-count="nextExam.days">{{ nextExam.days }}</b><i>天</i>
      </span>
      <Icon name="chevR" :size="18" class="cd-go" />
    </button>

    <!-- 功能砖 -->
    <section class="tiles">
      <button v-for="(t, i) in tiles" :key="t.key" class="tile card" :class="{ 'tile-accent': t.accent }"
        :style="{ animationDelay: i * 60 + 'ms' }" @click="navigate(t.to)">
        <span class="tile-icon"><Icon :name="t.icon" :size="24" /></span>
        <span class="tile-title">{{ t.title }}</span>
        <span class="tile-desc">{{ t.desc }}</span>
        <span class="tile-go"><Icon name="chevR" :size="17" /></span>
      </button>
    </section>

    <!-- 勋章墙预览 -->
    <section v-if="achievementNames().length" class="mini-badges">
      <div class="mini-head">
        <span class="mini-title"><Icon name="medal" :size="15" /> 已解锁勋章</span>
        <button class="link" @click="navigate('profile')">勋章墙 <Icon name="chevR" :size="13" /></button>
      </div>
      <div class="mini-row">
        <span v-for="name in achievementNames()" :key="name" class="mini-chip"><Icon name="medal" :size="13" /> {{ name }}</span>
      </div>
    </section>

    <!-- 最近记录 -->
    <section class="recent">
      <div class="recent-head">
        <h2 class="recent-title">最近考试记录</h2>
        <button v-if="state.records.length" class="link" @click="navigate('profile')">
          全部记录 <Icon name="chevR" :size="14" />
        </button>
      </div>
      <div v-if="!latest.length" class="empty card">
        <Icon name="exam" :size="30" />
        <p class="empty-title">还没有考试记录</p>
        <p class="hint">完成一场考试后，这里会展示类型、时长与开始时间。</p>
        <button class="btn btn-primary btn-sm" @click="navigate('exam')">去创建考试</button>
      </div>
      <div v-else class="recent-list">
        <button v-for="r in latest" :key="r.id" class="recent-row card" @click="navigate('profile')">
          <span class="recent-ic" :class="r.kind === 'listening' ? 'ic-listen' : 'ic-standard'">
            <Icon :name="r.kind === 'listening' ? 'listen' : 'exam'" :size="18" />
          </span>
          <span class="recent-main">
            <span class="recent-name">
              {{ r.examName }}
              <em class="recent-kind">{{ r.kind === "listening" ? "英语听力" : "普通考试" }}</em>
            </span>
            <span class="recent-meta">{{ r.durationMin }} 分钟 · {{ r.status === "done" ? "已完成" : "提前退出" }}</span>
          </span>
          <span class="recent-time">{{ fmtDateTime(r.startAt).slice(5) }}</span>
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: clamp(18px, 3vw, 28px);
  cursor: pointer;
  overflow: hidden;
  position: relative;
}

.hero::after {
  content: "";
  position: absolute;
  right: -60px;
  top: -90px;
  width: 260px;
  height: 260px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(34, 96, 79, 0.1), transparent 70%);
  pointer-events: none;
}

/* 呼吸光斑（GSAP 漂浮） */
.orb {
  position: absolute;
  left: 8%;
  bottom: -120px;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, rgba(242, 193, 30, 0.12), rgba(34, 96, 79, 0.06) 55%, transparent 72%);
  pointer-events: none;
  will-change: transform;
  z-index: 0;
}

.hero-main {
  min-width: 0;
  position: relative;
  z-index: 1;
}

.hero-top {
  display: flex;
  align-items: center;
  gap: 15px;
}

.hero-greet {
  font-size: clamp(18px, 2.6vw, 24px);
  font-weight: 650;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.title-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--surface-2);
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 3px 11px 3px 4px;
  font-size: 12px;
  color: var(--ink-2);
  font-weight: 700;
}

.hero-date {
  margin-top: 6px;
  color: var(--ink-2);
  font-size: 13.5px;
  font-variant-numeric: tabular-nums;
}

.hero-sub {
  margin-top: 12px;
  color: var(--ink-2);
  font-size: 13px;
}

.hero-right {
  flex: none;
  z-index: 1;
}

@media (max-width: 620px) {
  .hero {
    flex-direction: column;
    align-items: stretch;
  }

  .hero-right .btn {
    width: 100%;
  }
}

/* 数据横条 */
.stat-bar {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(96px, 1fr));
  gap: 10px;
  margin-top: 14px;
}

.stat-chip {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 11px 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  cursor: pointer;
  transition: transform 0.18s var(--ease-out), border-color 0.18s;
}

.stat-chip:hover {
  transform: translateY(-2px);
  border-color: var(--accent);
}

.stat-chip b {
  font-size: 20px;
  font-weight: 800;
}

.stat-chip span {
  font-size: 11px;
  color: var(--ink-3);
}

.stat-chip.accent b {
  color: #b07f14;
}

@media (max-width: 460px) {
  .stat-bar {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 倒计时条 */
.cd-banner {
  margin-top: 14px;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  background: linear-gradient(150deg, #14181e, #202a33);
  border-color: rgba(255, 255, 255, 0.08);
  color: #fff;
  transition: transform 0.2s var(--ease-out);
}

.cd-banner:hover {
  transform: translateY(-2px);
}

.cd-ic {
  width: 42px;
  height: 42px;
  border-radius: 13px;
  background: rgba(255, 255, 255, 0.1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
}

.cd-main {
  flex: 1;
  text-align: left;
  min-width: 0;
}

.cd-label {
  display: block;
  font-size: 11px;
  letter-spacing: 0.18em;
  color: rgba(255, 255, 255, 0.55);
  font-weight: 700;
}

.cd-name {
  display: block;
  font-weight: 750;
  font-size: 16px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cd-count {
  display: flex;
  align-items: baseline;
  gap: 5px;
  flex: none;
}

.cd-count b {
  font-size: 34px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.cd-count i {
  font-style: normal;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.cd-go {
  color: rgba(255, 255, 255, 0.5);
  flex: none;
}

/* 砖 */
.tiles {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 14px;
  margin-top: 14px;
}

.tile {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;
  text-align: left;
  padding: 20px 18px;
  animation: rise-in 0.5s var(--ease-out) both;
  transition: transform 0.25s var(--ease-out), box-shadow 0.25s var(--ease-out);
}

.tile:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-2);
}

.tile-icon {
  width: 46px;
  height: 46px;
  border-radius: 15px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-2);
  color: var(--ink);
  margin-bottom: 6px;
}

.tile-accent .tile-icon {
  background: var(--accent);
  color: #f6f5ef;
}

.tile-title {
  font-size: 16px;
  font-weight: 750;
}

.tile-desc {
  color: var(--ink-2);
  font-size: 12.5px;
  line-height: 1.6;
  min-height: 40px;
}

.tile-go {
  position: absolute;
  right: 14px;
  top: 16px;
  color: var(--ink-3);
}

.tile-accent .tile-go {
  color: var(--accent);
}

/* 迷你勋章 */
.mini-badges {
  margin-top: 22px;
}

.mini-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.mini-title {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-weight: 750;
  font-size: 15px;
}

.link {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  color: var(--accent);
  font-size: 12.5px;
  font-weight: 650;
}

.mini-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.mini-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: 999px;
  background: linear-gradient(180deg, #fdf6e2, #f8e9bc);
  color: #7c5a0b;
  font-size: 12.5px;
  font-weight: 650;
  animation: rise-in 0.4s var(--ease-out) both;
}

/* 最近记录 */
.recent {
  margin-top: 24px;
}

.recent-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 10px;
}

.recent-title {
  font-size: 16px;
  font-weight: 750;
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.recent-row {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 13px 16px;
  text-align: left;
  width: 100%;
  transition: transform 0.2s var(--ease-out);
}

.recent-row:hover {
  transform: translateY(-1px);
}

.recent-ic {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
}

.ic-standard {
  background: var(--accent-tint);
  color: var(--accent);
}

.ic-listen {
  background: #e7eefb;
  color: #31527e;
}

.recent-main {
  flex: 1;
  min-width: 0;
}

.recent-name {
  display: block;
  font-weight: 650;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.recent-kind {
  font-style: normal;
  font-size: 10.5px;
  background: var(--bg-2);
  padding: 1px 8px;
  border-radius: 999px;
  margin-left: 8px;
  color: var(--ink-2);
}

.recent-meta {
  font-size: 12px;
  color: var(--ink-3);
}

.recent-time {
  flex: none;
  font-size: 12px;
  color: var(--ink-3);
  font-variant-numeric: tabular-nums;
}

/* ===== 手机窄屏压缩：内容更短、不撑太长 ===== */
@media (max-width: 640px) {
  .hero {
    padding: 15px 14px;
    gap: 12px;
  }

  .hero-avatar {
    width: 44px !important;
    height: 44px !important;
  }

  .hero-greet {
    font-size: 17px;
  }

  .hero-date {
    font-size: 12px;
    margin-top: 4px;
  }

  .hero-sub {
    margin-top: 8px;
    font-size: 12px;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .stat-bar {
    gap: 8px;
    margin-top: 10px;
  }

  .stat-chip {
    padding: 8px 4px;
    border-radius: 13px;
  }

  .stat-chip b {
    font-size: 17px;
  }

  .stat-chip span {
    font-size: 10px;
  }

  .cd-banner {
    margin-top: 10px;
    padding: 12px 12px;
    gap: 10px;
  }

  .cd-ic {
    width: 36px;
    height: 36px;
  }

  .cd-name {
    font-size: 14px;
  }

  .cd-count b {
    font-size: 26px;
  }

  .tiles {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 9px;
    margin-top: 10px;
  }

  .tile {
    padding: 14px 12px;
    gap: 3px;
  }

  .tile-icon {
    width: 38px;
    height: 38px;
    border-radius: 12px;
    margin-bottom: 3px;
  }

  .tile-title {
    font-size: 14.5px;
  }

  .tile-desc {
    font-size: 11px;
    line-height: 1.45;
    min-height: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .tile-go {
    display: none;
  }

  .mini-badges {
    margin-top: 16px;
  }

  .mini-chip {
    font-size: 11px;
    padding: 5px 9px;
  }

  .recent {
    margin-top: 18px;
  }

  .recent-row {
    padding: 10px 12px;
    gap: 10px;
  }

  .recent-ic {
    width: 34px;
    height: 34px;
  }

  .recent-name {
    font-size: 13px;
  }

  .recent-time {
    font-size: 11px;
  }
}
</style>
