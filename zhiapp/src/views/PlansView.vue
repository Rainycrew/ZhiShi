<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { state, store } from "../store/state.js";
import Icon from "../components/Icon.vue";
import Modal from "../components/Modal.vue";
import ConfirmDialog from "../components/ConfirmDialog.vue";
import { usePageMotion } from "../composables/useMotion.js";
import { burstFromRect, ringFromRect } from "../lib/celebrate.js";
import { gsap } from "gsap";
import { toast } from "../ui.js";
import { announce } from "../lib/focus.js";
import { evaluateAchievements, computeStats } from "../lib/achievements.js";
import { exportStatsCard } from "../lib/exportImage.js";
import { dayKey, diffDays, parseDayKey, fmtClock, currentStreak } from "../utils.js";
import CheckinButton from "../components/CheckinButton.vue";
import CheckinDaysCard from "../components/CheckinDaysCard.vue";
const JIFEN = (import.meta.env.BASE_URL || "./") + "img/jifen.png";
import { skinById } from "../lib/skins.js";

const root = ref(null);
usePageMotion(root);

const TYPES = ["考试备考", "日常学习", "运动健康", "兴趣技能", "其他"];
const TYPE_ICON = { 考试备考: "exam", 日常学习: "book", 运动健康: "flame", 兴趣技能: "note", 其他: "panel" };
const TYPE_COLOR = { 考试备考: "var(--accent)", 日常学习: "#31527e", 运动健康: "#c96a3d", 兴趣技能: "#7a3d83", 其他: "#5c6158" };

const plans = computed(() => [...state.plans].sort((a, b) => Number(a.done) - Number(b.done)));
const checkins = computed(() => state.checkins);
const today = computed(() => dayKey());
const checkedToday = computed(() => state.checkins.some((c) => c.date === today.value));

const stats = computed(() => computeStats());
const todayCheckinTime = computed(() => {
  const c = state.checkins.find((x) => x.date === today.value);
  return c ? new Date(c.ts) : null;
});

// 最近 30 天打卡条
const heat = computed(() => {
  const set = new Set(state.checkins.map((c) => c.date));
  const out = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push({ key: dayKey(d), on: set.has(dayKey(d)) });
  }
  return out;
});

// 最近的未来考试倒计时
const nextExam = computed(() => {
  const future = state.plans
    .filter((p) => p.targetDate && !p.done)
    .map((p) => ({ p, days: diffDays(dayKey(), p.targetDate) }))
    .filter((x) => x.days >= 0)
    .sort((a, b) => a.days - b.days);
  return future[0] || null;
});

// ===== 打卡 =====
const checkinBtn = ref(null);
const pulseStamp = ref(0); // 每次成功打卡递增，触发盖章动画
const equippedSkin = computed(() => state.skins.equipped || "bi");
const showDaysCard = ref(false);
const daysCard = ref({ streak: 0, total: 0, gained: 0, milestone: false });

function doCheckin() {
  const ok = store.addCheckin();
  if (!ok) {
    toast("今天已经打过卡啦", "ok");
    return;
  }
  const r = store.rewardCheckin();
  announce();
  evaluateAchievements();
  pulseStamp.value++;
  daysCard.value = {
    streak: r.streak,
    total: stats.value.checkinTotal,
    gained: r.gained,
    milestone: r.milestone
  };
  showDaysCard.value = true;
  const gainTxt = `积分 +${r.gained}` + (r.milestone ? "（含连续10天奖励）" : "");
  toast(
    "打卡成功" +
      (r.streak > 1 ? `，已连续 ${r.streak} 天` : "") +
      `，${gainTxt}`
  );
}

function onCheckinTap() {
  if (checkedToday.value) {
    cancelToday.value = true;
    return;
  }
  // 炫彩：先弹按钮 → 涟漪 + 粒子
  const el = checkinBtn.value;
  if (el) {
    const rect = el.getBoundingClientRect();
    ringFromRect(rect, "rgba(242,191,30,0.5)");
    burstFromRect(rect, { count: 30 });
    gsap.fromTo(
      el,
      { scale: 1 },
      { scale: 1.06, duration: 0.16, ease: "power2.out", yoyo: true, repeat: 1, clearProps: "scale" }
    );
  }
  doCheckin();
}

const cancelToday = ref(false);
function doCancelToday() {
  store.removeCheckin(today.value);
  cancelToday.value = false;
  toast("已取消今日打卡");
}

// ===== 计划 =====
const editId = ref(null);
const planOpen = ref(false);
const draft = reactive({ title: "", type: "日常学习", targetDate: "", dailyMin: 0, desc: "" });

function openNew() {
  Object.assign(draft, { title: "", type: "日常学习", targetDate: "", dailyMin: 0, desc: "" });
  editId.value = null;
  planOpen.value = true;
}

function openEdit(p) {
  Object.assign(draft, { title: p.title, type: p.type, targetDate: p.targetDate || "", dailyMin: p.dailyMin || 0, desc: p.desc || "" });
  editId.value = p.id;
  planOpen.value = true;
}

function savePlan() {
  if (!draft.title.trim()) {
    toast("请填写计划名称", "err");
    return;
  }
  const data = {
    title: draft.title.trim(),
    type: draft.type,
    targetDate: draft.targetDate || null,
    dailyMin: Number(draft.dailyMin) || 0,
    desc: draft.desc.trim()
  };
  if (editId.value) store.updatePlan(editId.value, data);
  else store.addPlan(data);
  planOpen.value = false;
  toast(editId.value ? "已更新计划" : "已创建计划");
}

const delPlan = ref(null);
function doDelPlan() {
  if (delPlan.value) store.removePlan(delPlan.value);
  delPlan.value = null;
  toast("计划已删除");
}

function toggleDone(p) {
  store.updatePlan(p.id, { done: !p.done, doneAt: !p.done ? Date.now() : 0 });
  if (!p.done) {
    toast("计划完成，太棒了");
    announce();
  }
}

function daysText(p) {
  if (!p.targetDate) return "";
  const d = diffDays(dayKey(), p.targetDate);
  if (p.done) return "已完成";
  if (d > 0) return `还有 ${d} 天`;
  if (d === 0) return "就是今天";
  return `已过 ${-d} 天`;
}

// 成就卡
async function doCard() {
  try {
    const how = await exportStatsCard();
    if (how !== "cancel") toast(how === "share" ? "已调起分享" : "成就卡已生成保存");
  } catch (e) {
    console.error("成就卡生成失败", e);
    toast("生成失败：" + (e && e.message ? e.message : String(e)), "err", 6000);
  }
}

onMounted(() => {
  // 确保页面打开时也评估一次（导入等情况）
  evaluateAchievements();
});
</script>

<template>
  <div ref="root">
    <div class="page-head" data-reveal>
      <div>
        <div class="eyebrow">Plan · 计划与打卡</div>
        <h1 class="page-title">计划中心</h1>
        <p class="page-sub">设定学习计划与考试倒计时，每天打卡；达成行为自动点亮勋章。</p>
      </div>
      <div class="head-actions">
        <button class="btn btn-ghost" @click="doCard">
          <Icon name="image" :size="15" /> 成就卡
        </button>
        <button class="btn btn-primary" @click="openNew">
          <Icon name="plus" :size="16" /> 新建计划
        </button>
      </div>
    </div>

    <!-- 顶部概览 -->
    <section class="overview card" data-reveal>
      <div class="ov-main">
        <div class="ov-checkin">
          <CheckinButton :skin="equippedSkin" :done="checkedToday" @checkin="onCheckinTap" />
          <div class="checkin-hint">
            <span class="chip chip-accent"><Icon name="bag" :size="12" /> {{ skinById(equippedSkin).name }}</span>
            <span class="chip">每天一次 · 5-7 点更佳</span>
            <span class="chip"><img :src="JIFEN" class="chip-jf" alt="" /> 积分 {{ state.points }}</span>
          </div>
        </div>
        <div class="ov-stats">
          <div class="ov-stat">
            <b class="tnum" :data-count="stats.checkinTotal">{{ stats.checkinTotal }}</b><span>累计打卡</span>
          </div>
          <div class="ov-stat">
            <b class="tnum" :data-count="stats.curStreak">{{ stats.curStreak }}</b><span>当前连续</span>
          </div>
          <div class="ov-stat">
            <b class="tnum" :data-count="Math.round(stats.totalFocusMin)">{{ Math.round(stats.totalFocusMin) }}</b><span>专注分钟</span>
          </div>
          <div class="ov-stat">
            <b class="tnum" :data-count="Object.keys(state.achievements).length">{{ Object.keys(state.achievements).length }}</b><span>勋章</span>
          </div>
        </div>
      </div>

      <!-- 近30天 -->
      <div class="heat-wrap" data-reveal>
        <div class="heat">
          <span v-for="h in heat" :key="h.key" class="heat-cell" :class="{ on: h.on }" :title="h.key"></span>
        </div>
        <span class="heat-label">近 30 天</span>
      </div>
    </section>

    <!-- 考试倒计时 -->
    <section v-if="nextExam" class="countdown card" data-reveal>
      <div class="cd-left">
        <span class="cd-eyebrow"><Icon name="exam" :size="13" /> 最近考试倒计时</span>
        <h2 class="cd-title">{{ nextExam.p.title }}</h2>
        <p class="cd-date">目标 {{ nextExam.p.targetDate }} · {{ nextExam.p.dailyMin ? "每日目标 " + nextExam.p.dailyMin + " 分钟" : "加油备考" }}</p>
      </div>
      <div class="cd-num">
        <b class="tnum" :data-count="nextExam.days">{{ nextExam.days }}</b><span>天</span>
      </div>
    </section>

    <!-- 计划列表 -->
    <section class="plans-sec">
      <div class="sec-head">
        <h2 class="sec-title">我的计划（{{ plans.length }}）</h2>
      </div>

      <div v-if="!plans.length" class="empty card">
        <Icon name="panel" :size="30" />
        <p class="empty-title">还没有计划</p>
        <p class="hint">例如：期末考试倒计时 30 天，每天 60 分钟数学。</p>
      </div>

      <div v-else class="plan-list">
        <article v-for="p in plans" :key="p.id" class="plan card" :class="{ done: p.done }">
          <button class="tick" :class="{ on: p.done }" :aria-label="p.done ? '标记未完成' : '标记完成'" @click="toggleDone(p)">
            <Icon v-if="p.done" name="check" :size="16" :stroke="3" />
          </button>
          <span class="plan-ic" :style="{ color: TYPE_COLOR[p.type] || 'var(--accent)' }">
            <Icon :name="TYPE_ICON[p.type] || 'panel'" :size="17" />
          </span>
          <div class="plan-main">
            <div class="plan-title-row">
              <span class="plan-title">{{ p.title }}</span>
              <span class="plan-type">{{ p.type }}</span>
            </div>
            <p v-if="p.desc" class="plan-desc">{{ p.desc }}</p>
            <div class="plan-tags">
              <span v-if="p.targetDate" class="tag"><Icon name="calendar" :size="12" /> {{ p.targetDate }} · {{ daysText(p) }}</span>
              <span v-if="p.dailyMin" class="tag"><Icon name="timer" :size="12" /> 每日 {{ p.dailyMin }} 分钟</span>
            </div>
          </div>
          <div class="plan-ops">
            <button class="icon-btn" @click="openEdit(p)"><Icon name="edit" :size="15" /></button>
            <button class="icon-btn danger" @click="delPlan = p.id"><Icon name="trash" :size="15" /></button>
          </div>
        </article>
      </div>
    </section>

    <!-- 计划弹层 -->
    <Modal :show="planOpen" :title="editId ? '编辑计划' : '新建计划'" @close="planOpen = false">
      <div class="modal-form">
        <div class="field">
          <label>计划名称 *</label>
          <input v-model="draft.title" class="input" maxlength="30" placeholder="如：高考英语听力冲刺 / 每天读书" />
        </div>
        <div class="field">
          <label>类型</label>
          <div class="seg wrap">
            <button v-for="t in TYPES" :key="t" class="seg-item" :class="{ on: draft.type === t }" @click="draft.type = t">
              {{ t }}
            </button>
          </div>
        </div>
        <div class="field">
          <label>目标日期（选填，会展示倒计时天数）</label>
          <input v-model="draft.targetDate" class="input" type="date" />
        </div>
        <div class="field">
          <label>每日目标分钟（选填）</label>
          <input v-model.number="draft.dailyMin" class="input tnum" type="number" min="0" max="600" placeholder="如 60" />
        </div>
        <div class="field">
          <label>备注</label>
          <textarea v-model="draft.desc" class="input" rows="3" maxlength="200" placeholder="一句话描述这个计划"></textarea>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-ghost" @click="planOpen = false">取消</button>
        <button class="btn btn-primary" @click="savePlan"><Icon name="check" :size="15" /> 保存</button>
      </div>
    </Modal>

    <ConfirmDialog
      :show="cancelToday"
      title="取消今日打卡"
      message="确定取消今天的打卡吗？已获得的勋章不会回收。"
      confirm-text="取消打卡"
      danger
      @cancel="cancelToday = false"
      @confirm="doCancelToday"
    />

    <ConfirmDialog
      :show="!!delPlan"
      title="删除计划"
      message="确定删除这个计划吗？"
      confirm-text="删除"
      danger
      @cancel="delPlan = null"
      @confirm="doDelPlan"
    />

    <CheckinDaysCard
      :show="showDaysCard"
      :name="state.profile.name"
      :avatar-key="state.profile.avatarKey"
      :streak="daysCard.streak"
      :total="daysCard.total"
      :gained="daysCard.gained"
      :skin="state.cardskin.equipped || 'gold'"
      @close="showDaysCard = false"
    />
  </div>
</template>

<style scoped>
.head-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

/* 概览 */
.overview {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: clamp(16px, 2.6vw, 24px);
}

.ov-main {
  display: flex;
  gap: 22px;
  flex-wrap: wrap;
  align-items: stretch;
}

.ov-checkin {
  flex: 1.2;
  min-width: 220px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.checkin-hint {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.chip-jf {
  width: 13px;
  height: 13px;
  object-fit: contain;
  margin-right: 2px;
  vertical-align: -2px;
}

.checkin-btn {
  position: relative;
  width: 100%;
  min-height: 96px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  border-radius: 20px;
  background: linear-gradient(150deg, #1c3c31, #2a5a48);
  color: #dff4e8;
  box-shadow: 0 18px 40px -24px rgba(20, 66, 53, 0.9),
    inset 0 1px 0 rgba(255, 255, 255, 0.12);
  overflow: hidden;
  transition: transform 0.2s var(--ease-out), box-shadow 0.25s var(--ease-out);
}

.checkin-btn:hover {
  box-shadow: 0 22px 48px -24px rgba(20, 66, 53, 1);
}

.checkin-btn:active {
  transform: scale(0.98);
}

.checkin-btn.done {
  background: linear-gradient(150deg, #29312b, #3c4a3f);
  color: #9fe0bd;
}

/* 成功盖章：金色的“打卡完成”印章一闪而逝 */
.stamp {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffe082;
  text-shadow: 0 2px 14px rgba(0, 0, 0, 0.4);
  animation: stamp-pop 1s cubic-bezier(0.2, 0.8, 0.3, 1) forwards;
  pointer-events: none;
}

@keyframes stamp-pop {
  0% {
    transform: scale(2.2);
    opacity: 0;
  }
  22% {
    transform: scale(1);
    opacity: 1;
  }
  70% {
    transform: scale(0.96);
    opacity: 1;
  }
  100% {
    transform: scale(1.1);
    opacity: 0;
  }
}

.cb-text {
  display: flex;
  flex-direction: column;
  text-align: left;
  gap: 3px;
}

.cb-text b {
  font-size: 18px;
  color: #fff;
}

.cb-text small {
  font-size: 11.5px;
  opacity: 0.8;
}

.ov-stats {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  min-width: 280px;
}

.ov-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--surface-2);
  border: 1px solid var(--line-2);
  border-radius: 16px;
  padding: 8px 4px;
}

.ov-stat b {
  font-size: 22px;
  font-weight: 800;
}

.ov-stat span {
  font-size: 11px;
  color: var(--ink-3);
}

@media (max-width: 560px) {
  .ov-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 热力 */
.heat-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}

.heat {
  display: grid;
  grid-template-columns: repeat(30, minmax(4px, 1fr));
  gap: 4px;
  flex: 1;
}

.heat-cell {
  aspect-ratio: 1;
  border-radius: 4px;
  background: var(--line);
}

.heat-cell.on {
  background: var(--accent);
}

.heat-label {
  font-size: 11px;
  color: var(--ink-3);
  flex: none;
}

/* 考试倒计时 */
.countdown {
  margin-top: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: clamp(16px, 2.4vw, 24px);
  background: linear-gradient(150deg, #14181e 0%, #1b232d 100%);
  border-color: rgba(255, 255, 255, 0.06);
  overflow: hidden;
  position: relative;
}

.countdown::after {
  content: "";
  position: absolute;
  right: -50px;
  top: -70px;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(247, 248, 240, 0.08), transparent 70%);
  pointer-events: none;
}

.cd-left {
  color: #fff;
  min-width: 0;
}

.cd-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  letter-spacing: 0.14em;
  color: rgba(255, 255, 255, 0.65);
  font-weight: 700;
}

.cd-title {
  font-size: clamp(18px, 2.6vw, 24px);
  font-weight: 800;
  margin-top: 6px;
}

.cd-date {
  margin-top: 4px;
  font-size: 12.5px;
  color: rgba(255, 255, 255, 0.6);
}

.cd-num {
  flex: none;
  display: flex;
  align-items: baseline;
  gap: 6px;
  color: #fff;
}

.cd-num b {
  font-size: clamp(40px, 7vw, 72px);
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.cd-num span {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 600;
}

/* 计划 */
.plans-sec {
  margin-top: 22px;
}

.sec-head {
  margin-bottom: 12px;
}

.sec-title {
  font-size: 16.5px;
  font-weight: 800;
}

.plan-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.plan {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 15px 16px;
  transition: transform 0.2s var(--ease-out);
}

.plan:hover {
  transform: translateY(-1px);
}

.plan.done {
  opacity: 0.68;
}

.plan.done .plan-title {
  text-decoration: line-through;
}

.tick {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 2px solid var(--line);
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: transparent;
  transition: all 0.2s var(--ease-out);
}

.tick.on {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

.plan-ic {
  width: 40px;
  height: 40px;
  border-radius: 13px;
  background: var(--surface-2);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
}

.plan-main {
  flex: 1;
  min-width: 0;
}

.plan-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.plan-title {
  font-weight: 750;
  font-size: 15px;
}

.plan-type {
  font-size: 10.5px;
  background: var(--bg-2);
  color: var(--ink-2);
  padding: 1px 8px;
  border-radius: 999px;
}

.plan-desc {
  font-size: 12.5px;
  color: var(--ink-2);
  margin-top: 3px;
}

.plan-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 6px;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11.5px;
  color: var(--ink-2);
  background: var(--surface-2);
  border: 1px solid var(--line-2);
  padding: 2px 9px;
  border-radius: 999px;
}

.plan-ops {
  display: flex;
  gap: 2px;
}

.icon-btn.danger:hover {
  color: var(--danger);
  background: var(--danger-tint);
}

.modal-form {
  padding: 6px 22px 16px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.seg-item {
  min-height: 32px;
  padding: 0 13px;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-2);
}

.seg-item.on {
  background: var(--surface);
  color: var(--ink);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}

.wrap {
  flex-wrap: wrap;
}
</style>
