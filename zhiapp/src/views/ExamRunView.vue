<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import route, { navigate } from "../router.js";
import { state, store } from "../store/state.js";
import { media } from "../store/media.js";
import { ListeningPlayer, playBuiltin, playUrlOnce, stopOneShot } from "../audio/engine.js";
import { fileUrl } from "../audio/manifest.js";
import { ADMIN_PASS } from "../config.js";
import Icon from "../components/Icon.vue";
import ConfirmDialog from "../components/ConfirmDialog.vue";
import Modal from "../components/Modal.vue";
import { toast } from "../ui.js";
import { announce } from "../lib/focus.js";
import { uid, fmtClockSec, fmtDur, fmtDateTime } from "../utils.js";

// ---------- 状态 ----------
const tplId = computed(() => route.params.id || "");
const template = computed(() => state.templates.find((t) => t.id === tplId.value) || null);

const phase = ref("ready"); // ready | running | finished | exited
const startAt = ref(0);
const endAt = ref(0);
const nowMs = ref(Date.now());
const remainingMs = ref(0);
const durationMs = ref(0);
const fired = ref(new Set());
const listening = ref({ player: null, playing: false, ended: false });
const admin = ref({ open: false, pass: "", unlocked: false, volume: 0.9 });
const recordingSaved = ref(false);

let tickTimer = null;
let clockTimer = null;

// 节点绝对时间（秒），从考试开始起算
function nodeSeconds(n) {
  const total = Math.max(1, Math.round(durationMs.value / 1000));
  if (n.atType === "start") return 0;
  if (n.atType === "end") return total;
  if (n.atType === "beforeEnd") return Math.max(0, total - (Number(n.value) || 0) * 60);
  return Math.max(0, Number(n.value) || 0);
}

const schedule = computed(() => {
  if (!template.value) return [];
  return (template.value.nodes || [])
    .map((n) => ({
      id: n.id,
      label: n.label,
      at: nodeSeconds(n),
      sound: n.sound || null
    }))
    .filter((e) => e.at <= Math.max(1, Math.round(durationMs.value / 1000)) && e.at >= 0)
    .sort((a, b) => a.at - b.at);
});

const remaining = computed(() => Math.max(0, Math.ceil(remainingMs.value / 1000)));
const progress = computed(() => {
  if (!durationMs.value) return 0;
  const elapsed = durationMs.value - remainingMs.value;
  return Math.min(100, Math.max(0, (elapsed / durationMs.value) * 100));
});

const elapsed = computed(() => durationMs.value - remainingMs.value);

// 下一个待触发提示
const nextNode = computed(
  () => schedule.value.find((e) => !fired.value.has(e.id)) || null
);
const nextInSec = computed(() =>
  nextNode.value
    ? Math.max(0, Math.round(nextNode.value.at - elapsed.value / 1000))
    : 0
);

// ---------- 播放 ----------
async function playSound(sound) {
  if (!sound) return;
  if (sound.mode === "builtin") {
    playBuiltin(sound.tone || "ding");
  } else if (sound.mode === "folder") {
    playUrlOnce(fileUrl(sound.file));
  } else if (sound.mode === "library" || sound.mode === "listen") {
    try {
      const u = await media.url(sound.key);
      if (u) playUrlOnce(u);
    } catch (e) {}
  }
}

async function playListening() {
  if (!template.value || !template.value.listeningKey) return;
  try {
    const u = await media.url(template.value.listeningKey);
    if (!u) return;
    const p = new ListeningPlayer();
    p.setVolume(admin.value.volume);
    p.onState = () => {
      listening.value.playing = !p.paused && !p.ended;
      listening.value.ended = p.ended;
    };
    await p.loadObjectUrl(u);
    listening.value.player = p;
    await p.play();
    listening.value.playing = true;
  } catch (e) {
    console.warn(e);
  }
}

function stopListening() {
  const p = listening.value.player;
  if (p) {
    p.destroy();
    listening.value.player = null;
    listening.value.playing = false;
    listening.value.ended = false;
  }
}

// ---------- 考试流程 ----------
function startExam() {
  if (!template.value) return;
  durationMs.value = (template.value.durationMin || 1) * 60 * 1000;
  startAt.value = Date.now();
  endAt.value = startAt.value + durationMs.value;
  remainingMs.value = durationMs.value;
  fired.value = new Set();
  recordingSaved.value = false;
  phase.value = "running";
  // 听力考试：开考即自动播放听力文件
  if (template.value.kind === "listening") playListening();
  window.addEventListener("beforeunload", guardLeave);
}

function guardLeave(e) {
  if (phase.value === "running") {
    e.preventDefault();
    e.returnValue = "";
  }
}

function tick() {
  nowMs.value = Date.now();
  if (phase.value !== "running") return;
  remainingMs.value = Math.max(0, endAt.value - nowMs.value);

  const sec = (nowMs.value - startAt.value) / 1000;
  for (const ev of schedule.value) {
    if (!fired.value.has(ev.id) && sec >= ev.at) {
      fired.value.add(ev.id);
      playSound(ev.sound);
      lastEvent.value = ev;
    }
  }

  if (remainingMs.value <= 0) finishExam();
}

const lastEvent = ref(null);

function finishExam() {
  if (phase.value !== "running") return;
  phase.value = "finished";
  stopListening();
  window.removeEventListener("beforeunload", guardLeave);
  saveRecord("done");
  announce();
}

function exitExam() {
  if (phase.value !== "running") return;
  phase.value = "exited";
  stopListening();
  window.removeEventListener("beforeunload", guardLeave);
  saveRecord("exit");
}

function saveRecord(status) {
  if (recordingSaved.value) return;
  recordingSaved.value = true;
  store.addRecord({
    id: uid(),
    tplId: tplId.value,
    examName: template.value.name,
    kind: template.value.kind,
    durationMin: template.value.durationMin,
    startAt: startAt.value,
    endAt: Date.now(),
    status, // done 完成 | exit 提前退出
    startLabel: fmtDateTime(startAt.value)
  });
}

function doneGo() {
  navigate("profile", {}, { tab: "records" });
}

function afterExitGo() {
  navigate("exam");
}

// ---------- 管理员 ----------
function submitAdmin() {
  if (admin.value.pass.trim() === ADMIN_PASS) {
    admin.value.unlocked = true;
    admin.value.open = false;
    admin.value.pass = "";
    toast("管理员已解锁音频控制");
  } else {
    toast("口令错误", "err");
    admin.value.pass = "";
  }
}

function adminPlay() {
  const p = listening.value.player;
  if (!p) return;
  if (p.ended || p.paused) p.play();
  else p.pause();
}

function adminStop() {
  const p = listening.value.player;
  if (p) {
    p.stop();
    p.play();
  }
}

function adminReplay() {
  const p = listening.value.player;
  if (!p) return;
  p.seek(0);
  p.play();
}

function adminSeek(ev) {
  const p = listening.value.player;
  if (!p) return;
  const v = Number(ev.target.value);
  p.seek(v);
}

const seekMax = computed(() => {
  const p = listening.value.player;
  return p && p.duration > 0 ? p.duration : 1;
});

const seekVal = computed({
  get() {
    const p = listening.value.player;
    return p ? p.currentTime : 0;
  },
  set(v) {
    const p = listening.value.player;
    if (p) p.seek(Number(v));
  }
});

function setVolume(v) {
  admin.value.volume = v;
  const p = listening.value.player;
  if (p) p.setVolume(v);
}

// ---------- 生命周期 ----------
function initDuration() {
  if (template.value && phase.value === "ready") {
    durationMs.value = (template.value.durationMin || 1) * 60 * 1000;
  }
}

watch(template, initDuration, { immediate: true });

onMounted(() => {
  initDuration();
  if (!template.value) return;
  tickTimer = setInterval(tick, 200);
  clockTimer = setInterval(() => (nowMs.value = Date.now()), 1000);
});

onBeforeUnmount(() => {
  if (tickTimer) clearInterval(tickTimer);
  if (clockTimer) clearInterval(clockTimer);
  window.removeEventListener("beforeunload", guardLeave);
  stopListening();
  stopOneShot();
  // 若正在考试中离开页面 → 记为提前退出
  if (phase.value === "running") {
    phase.value = "exited";
    saveRecord("exit");
  }
});

// ---------- 退出确认 ----------
const exitConfirm = ref(false);

// 时间显示
const clockText = computed(() => fmtClockSec(new Date(nowMs.value)));
</script>

<template>
  <div v-if="template" class="run-root" :class="`run-${template.kind}`">
    <!-- 顶部条 -->
    <header class="run-top">
      <div class="run-brand">
        <Icon name="clock" :size="18" />
        <span>知时 · 考试系统</span>
      </div>
      <div class="run-now tnum">{{ clockText }}</div>
      <button class="btn btn-ghost exit-btn" @click="phase === 'running' ? (exitConfirm = true) : navigate('exam')">
        <Icon name="logout" :size="16" /> 退出
      </button>
    </header>

    <!-- 就绪页 -->
    <section v-if="phase === 'ready'" class="run-center">
      <div class="ready-card pop">
        <span class="ready-kind" :class="template.kind === 'listening' ? 'rk-listen' : 'rk-standard'">
          <Icon :name="template.kind === 'listening' ? 'listen' : 'exam'" :size="18" />
          {{ template.kind === "listening" ? "英语听力考试" : "普通考试" }}
        </span>
        <h1 class="ready-name">{{ template.name }}</h1>
        <ul class="ready-meta">
          <li>
            <Icon name="clock" :size="15" />
            <span>时长 {{ template.durationMin }} 分钟</span>
          </li>
          <li v-if="template.kind === 'listening' && template.listeningName">
            <Icon name="listen" :size="15" />
            <span>听力文件：{{ template.listeningName }}</span>
          </li>
          <li>
            <Icon name="info" :size="15" />
            <span>{{ template.kind === "listening" ? "开考自动播放，考生不可暂停" : "将按时间点播放提示音" }}</span>
          </li>
        </ul>
        <div v-if="schedule.length" class="ready-sched">
          <div v-for="e in schedule" :key="e.id" class="rs-row">
            <span class="rs-time tnum">{{ fmtDur(e.at) }}</span>
            <span class="rs-label">{{ e.label }}</span>
          </div>
        </div>
        <button class="btn btn-primary start-btn" @click="startExam">
          <Icon name="play" :size="18" /> 开始考试
        </button>
        <p class="hint" style="text-align: center">
          点击开始后倒计时即启动；中途可随时退出，将记为“提前退出”。
        </p>
      </div>
    </section>

    <!-- 考试进行中 -->
    <section v-else-if="phase === 'running'" class="run-center">
      <div class="run-headline">
        <span class="kind-dot" :class="template.kind === 'listening' ? 'kd-listen' : 'kd-standard'"></span>
        <h1 class="run-name">{{ template.name }}</h1>
      </div>

      <div class="timer-block">
        <div class="timer-label">
          剩余时间
          <span v-if="template.kind === 'listening'" class="listen-tag">
            <Icon name="mic" :size="12" /> 听力播放中
          </span>
        </div>
        <div class="timer tnum" :class="{ 'timer-warn': remaining <= 60, 'timer-last': remaining <= 10 }">
          {{ fmtDur(remaining) }}
        </div>
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: progress + '%' }"></div>
        </div>
        <div class="timer-sub">
          <span class="tnum">{{ fmtDur(Math.floor(elapsed / 1000)) }} 已进行</span>
          <span class="tnum">{{ fmtDur(remaining) }} 剩余</span>
        </div>
      </div>

      <div v-if="lastEvent" class="last-event pop">
        <Icon name="bell" :size="15" />
        {{ lastEvent.label }}
      </div>

      <!-- 下一个提示节点（何时播什么音频） -->
      <div v-if="nextNode && phase === 'running'" class="next-node" :key="nextNode.id">
        <span class="nn-ic"><Icon name="alarm" :size="15" /></span>
        <span class="nn-main">
          <span class="nn-label">下一个提示 · {{ nextNode.label }}</span>
          <span class="nn-time tnum">{{ fmtDur(Math.max(0, nextInSec)) }} 后触发</span>
        </span>
      </div>

      <!-- 管理员音频控制 -->
      <div v-if="template.kind === 'listening'" class="admin-zone">
        <template v-if="!admin.unlocked">
          <button class="btn btn-ghost btn-sm" @click="admin.open = true">
            <Icon name="key" :size="14" /> 管理员控制
          </button>
        </template>
        <div v-else class="admin-panel">
          <div class="admin-title">
            <Icon name="shield" :size="15" /> 管理员已解锁
          </div>
          <div class="admin-ctrl">
            <button class="icon-btn" title="暂停/继续" @click="adminPlay">
              <Icon :name="listening.playing ? 'pause' : 'play'" :size="18" />
            </button>
            <button class="icon-btn" title="从头播放" @click="adminReplay">
              <Icon name="refresh" :size="18" />
            </button>
            <button class="icon-btn" title="停止" @click="adminStop">
              <Icon name="stop" :size="18" />
            </button>
          </div>
          <div class="admin-seek">
            <input
              type="range"
              :min="0"
              :max="seekMax"
              step="0.5"
              :value="seekVal"
              @input="adminSeek"
            />
            <span class="tnum seek-text">
              {{ fmtDur(Math.floor(seekVal)) }} / {{ fmtDur(Math.floor(seekMax)) }}
            </span>
          </div>
          <div class="admin-vol">
            <Icon name="volume" :size="15" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              :value="admin.volume"
              @input="setVolume(Number($event.target.value))"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- 结束页 -->
    <section v-else class="run-center">
      <div class="result-card pop">
        <span class="result-ic" :class="phase === 'finished' ? 'ok' : 'warn'">
          <Icon :name="phase === 'finished' ? 'check' : 'logout'" :size="30" />
        </span>
        <h1 class="result-title">{{ phase === "finished" ? "考试结束" : "已退出考试" }}</h1>
        <p class="result-sub">
          {{ template.name }} · {{ template.durationMin }} 分钟 · 开始于
          <span class="tnum">{{ fmtDateTime(startAt) }}</span>
        </p>
        <p class="result-note">
          {{ phase === "finished" ? "本场考试记录已保存到个人主页。" : "已保存为“提前退出”记录，可在个人主页查看。" }}
        </p>
        <div class="result-actions">
          <button class="btn btn-ghost" @click="navigate('home')">返回首页</button>
          <button class="btn btn-primary" @click="doneGo">
            <Icon name="user" :size="15" /> 查看记录
          </button>
        </div>
      </div>
    </section>

    <!-- 管理员口令 -->
    <Modal :show="admin.open" title="管理员口令" @close="admin.open = false">
      <div class="admin-modal">
        <p class="hint">听力考试期间考生端不可暂停 / 回放。输入管理员口令后可控制播放。</p>
        <div class="pass-row">
          <input
            v-model="admin.pass"
            class="input pass-input tnum"
            type="password"
            inputmode="numeric"
            maxlength="6"
            placeholder="请输入口令"
            @keyup.enter="submitAdmin"
          />
          <button class="btn btn-primary" @click="submitAdmin">解锁</button>
        </div>
      </div>
    </Modal>

    <!-- 退出确认 -->
    <ConfirmDialog
      :show="exitConfirm"
      title="退出当前考试"
      message="确定要退出吗？退出后本场考试将记为“提前退出”，听力音频会停止播放。"
      detail="再次进入需重新开始本场考试。"
      confirm-text="退出考试"
      danger
      @cancel="exitConfirm = false"
      @confirm="exitConfirm = false; exitExam()"
    />
  </div>

  <!-- 模板不存在 -->
  <div v-else class="run-missing">
    <div class="empty">
      <Icon name="exam" :size="34" />
      <p class="empty-title">考试模板不存在或已被删除</p>
      <button class="btn btn-primary" @click="navigate('exam')">返回考试中心</button>
    </div>
  </div>
</template>

<style scoped>
.run-root {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(120% 160% at 80% -10%, rgba(34, 96, 79, 0.14), transparent 55%),
    radial-gradient(120% 120% at 0% 110%, rgba(34, 96, 79, 0.08), transparent 50%),
    var(--bg);
}

.run-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px clamp(14px, 4vw, 40px);
  padding-top: calc(14px + var(--safe-t));
}

.run-brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  color: var(--ink-2);
  letter-spacing: 0.04em;
}

.run-now {
  font-size: 15px;
  font-weight: 650;
  color: var(--ink-2);
  letter-spacing: 0.06em;
}

.exit-btn {
  min-height: 38px;
}

.run-center {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  display: block; /* 内容超高时也能从顶部滚动，不会被 flex 居中裁掉 */
  text-align: center;
  padding: 18px clamp(12px, 3.4vw, 40px) 44px;
}

/* 就绪 */
.ready-card {
  width: min(520px, 100%);
  margin-inline: auto;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--r-xl);
  box-shadow: var(--shadow-2);
  padding: clamp(20px, 4vw, 40px);
  display: flex;
  flex-direction: column;
  gap: 14px;
  text-align: left;
}

@media (max-width: 480px) {
  .ready-card {
    padding: 18px 16px;
    border-radius: 22px;
  }
}

.ready-kind {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  align-self: flex-start;
  padding: 5px 13px;
  border-radius: 999px;
  font-size: 12.5px;
  font-weight: 700;
}

.rk-standard {
  background: var(--accent-tint);
  color: var(--accent-ink);
}

.rk-listen {
  background: #e7eefb;
  color: #31527e;
}

.ready-name {
  font-size: clamp(26px, 4.4vw, 40px);
  font-weight: 800;
  letter-spacing: 0.01em;
  line-height: 1.2;
  overflow-wrap: anywhere;
}

.ready-meta {
  display: flex;
  flex-direction: column;
  gap: 9px;
  padding: 14px 0;
  border-top: 1px dashed var(--line);
  border-bottom: 1px dashed var(--line);
  color: var(--ink-2);
  font-size: 14px;
}

.ready-meta li {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ready-sched {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 8px;
}

.rs-row {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--surface-2);
  border: 1px solid var(--line-2);
  border-radius: 12px;
  padding: 8px 11px;
}

.rs-time {
  font-weight: 750;
  font-size: 13px;
  color: var(--accent);
  flex: none;
}

.rs-label {
  font-size: 12.5px;
  color: var(--ink-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.start-btn {
  width: 100%;
  min-height: 54px;
  font-size: 17px;
  border-radius: 18px;
}

/* 进行中 */
.run-headline {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;
}

.kind-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
}

.kd-standard {
  background: var(--accent);
}

.kd-listen {
  background: #31527e;
}

.run-name {
  font-size: clamp(19px, 3vw, 28px);
  font-weight: 800;
  text-align: center;
  overflow-wrap: anywhere;
}

.run-headline {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;
}

.timer-block {
  margin-top: clamp(20px, 5vh, 44px);
  text-align: center;
}

.timer-label {
  font-size: 13px;
  letter-spacing: 0.28em;
  color: var(--ink-3);
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.listen-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #e7eefb;
  color: #31527e;
  padding: 2px 9px;
  border-radius: 999px;
  letter-spacing: 0;
  font-size: 11.5px;
  animation: soft-pulse 2.2s ease-in-out infinite;
}

.timer {
  font-family: var(--num);
  font-size: clamp(60px, 16vw, 170px);
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.01em;
  font-variant-numeric: tabular-nums;
  margin: 12px 0 0;
}

.timer-warn {
  color: #a8761c;
}

.timer-last {
  color: var(--danger);
  animation: soft-pulse 1s ease-in-out infinite;
}

.progress-track {
  width: min(560px, 86vw);
  height: 8px;
  border-radius: 99px;
  background: var(--line);
  margin: 22px auto 0;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 99px;
  background: var(--accent);
  transition: width 0.25s linear;
}

.timer-sub {
  display: flex;
  justify-content: space-between;
  width: min(560px, 86vw);
  margin: 10px auto 0;
  color: var(--ink-3);
  font-size: 12px;
  font-weight: 600;
}

.last-event {
  margin: 22px auto 0;
  width: max-content;
  max-width: 92vw;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--surface);
  border: 1px solid var(--line);
  padding: 8px 16px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 650;
  box-shadow: var(--shadow-1);
}

/* 下一个提示节点 */
.next-node {
  margin: 12px auto 0;
  max-width: 92vw;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid var(--line);
  padding: 7px 14px 7px 8px;
  border-radius: 999px;
  box-shadow: var(--shadow-1);
}

.nn-ic {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--accent-tint);
  color: var(--accent);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
}

.nn-main {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1px;
}

.nn-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--ink);
}

.nn-time {
  font-size: 11.5px;
  color: var(--accent);
  font-weight: 650;
}

.admin-zone {
  margin: 26px auto 0;
  width: min(560px, 92vw);
  display: flex;
  justify-content: center;
}

.admin-panel {
  width: 100%;
  background: rgba(255, 255, 255, 0.86);
  backdrop-filter: blur(10px);
  border: 1px solid var(--line);
  border-radius: 20px;
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.admin-title {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12.5px;
  font-weight: 700;
  color: var(--accent);
}

.admin-ctrl {
  display: flex;
  gap: 8px;
  align-items: center;
}

.admin-seek {
  display: flex;
  align-items: center;
  gap: 12px;
}

.admin-seek input[type="range"],
.admin-vol input[type="range"] {
  flex: 1;
  accent-color: var(--accent);
  min-height: 28px;
}

.seek-text {
  flex: none;
  font-size: 12px;
  color: var(--ink-2);
}

.admin-vol {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--ink-2);
}

.admin-modal {
  padding: 8px 22px 22px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.pass-row {
  display: flex;
  gap: 10px;
}

.pass-input {
  flex: 1;
  text-align: center;
  letter-spacing: 0.5em;
  font-size: 20px;
}

/* 结束页 */
.result-card {
  width: min(460px, 100%);
  margin-inline: auto;
  text-align: center;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--r-xl);
  box-shadow: var(--shadow-2);
  padding: clamp(26px, 5vw, 48px) clamp(16px, 4vw, 40px);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.result-ic {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.result-ic.ok {
  background: var(--ok-tint);
  color: var(--ok);
}

.result-ic.warn {
  background: var(--warn-tint);
  color: var(--warn);
}

.result-title {
  font-size: clamp(24px, 4vw, 32px);
  font-weight: 800;
}

.result-sub {
  color: var(--ink-2);
  font-size: 14px;
  overflow-wrap: anywhere;
}

.result-note {
  font-size: 13px;
  color: var(--ink-3);
  margin-top: 4px;
  overflow-wrap: anywhere;
}

.result-actions {
  display: flex;
  gap: 10px;
  margin-top: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.run-missing {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
