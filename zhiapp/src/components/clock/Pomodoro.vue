<script setup>
import { ref, computed, onBeforeUnmount } from "vue";
import FlipDisplay from "../clock/FlipDisplay.vue";
import Icon from "../Icon.vue";
import { playBuiltin } from "../../audio/engine.js";
import { recordFocus } from "../../lib/focus.js";
import { state, store } from "../../store/state.js";
import { dayKey, fmtMin } from "../../utils.js";
import { toast } from "../../ui.js";

// 番茄钟：专注 25 / 休息 5（可调），专注完成自动记录并提示
const FOCUS_PRESETS = [20, 25, 45, 50];
const BREAK_PRESETS = [5, 10, 15];

const focusMin = ref(25);
const breakMin = ref(5);
const phase = ref("idle"); // idle | focus | rest | done
const remainSec = ref(0);
const running = ref(false);
const sessionStart = ref(0);
let tick = null;

const displayParts = computed(() => {
  const s = Math.max(0, Math.round(remainSec.value));
  return [
    String(Math.floor(s / 60)).padStart(2, "0"),
    String(s % 60).padStart(2, "0")
  ];
});

const todayPomos = computed(
  () => state.focus.filter((f) => f.date === dayKey() && f.type === "pomodoro").length
);

function stopTick() {
  if (tick) clearInterval(tick);
  tick = null;
}

function begin(secs) {
  remainSec.value = secs;
  running.value = true;
}

function tickLoop() {
  stopTick();
  tick = setInterval(() => {
    remainSec.value -= 0.25;
    if (remainSec.value <= 0) {
      remainSec.value = 0;
      onComplete();
    }
  }, 250);
}

function startFocus() {
  if (phase.value === "focus") return;
  phase.value = "focus";
  sessionStart.value = Date.now();
  playBuiltin("begin");
  begin(focusMin.value * 60);
  tickLoop();
}

function startRest() {
  if (phase.value === "rest") return;
  phase.value = "rest";
  playBuiltin("ding");
  begin(breakMin.value * 60);
  tickLoop();
}

function pause() {
  running.value = false;
  stopTick();
}

function resume() {
  if (!running.value) {
    running.value = true;
    tickLoop();
  }
}

function onComplete() {
  stopTick();
  running.value = false;
  if (phase.value === "focus") {
    recordFocus("pomodoro", "", sessionStart.value, Date.now(), focusMin.value);
    playBuiltin("warn");
    phase.value = "done"; // 进入休息由用户点按
    toast("专注完成，休息一下吧");
  } else if (phase.value === "rest") {
    playBuiltin("ding");
    phase.value = "idle";
    toast("休息结束，可开始下一轮专注");
  }
}

function quitFocus() {
  const elapsed = focusMin.value * 60 - remainSec.value;
  stopTick();
  running.value = false;
  if (elapsed >= 60) {
    recordFocus("pomodoro", "", sessionStart.value, Date.now(), elapsed / 60);
    toast(`已记录 ${Math.round(elapsed / 60)} 分钟`);
  }
  phase.value = "idle";
}

const modeText = computed(() =>
  phase.value === "focus" ? "专注中" : phase.value === "rest" ? "休息中" : "待机"
);

function totalToday() {
  const rows = state.focus.filter((f) => f.date === dayKey() && f.type === "pomodoro");
  return rows.reduce((s, f) => s + f.minutes, 0);
}

onBeforeUnmount(stopTick);
</script>

<template>
  <div class="pomo-panel">
    <div class="pomo-head">
      <span class="phase-chip" :class="phase">{{ modeText }}</span>
      <span class="today-chip">今日番茄 {{ todayPomos }} 个 · {{ Math.round(totalToday()) }} 分钟</span>
    </div>

    <FlipDisplay :parts="displayParts" :blink="running" class="timer-display" />

    <!-- 设置（待机时） -->
    <div v-if="phase === 'idle'" class="cfg">
      <div class="cfg-col">
        <span class="cfg-label">专注时长</span>
        <div class="cfg-chips">
          <button
            v-for="m in FOCUS_PRESETS"
            :key="m"
            class="chip-min"
            :class="{ on: focusMin === m }"
            @click="focusMin = m"
          >
            {{ m }}
          </button>
        </div>
      </div>
      <div class="cfg-col">
        <span class="cfg-label">休息时长</span>
        <div class="cfg-chips">
          <button
            v-for="m in BREAK_PRESETS"
            :key="m"
            class="chip-min"
            :class="{ on: breakMin === m }"
            @click="breakMin = m"
          >
            {{ m }}
          </button>
        </div>
      </div>
    </div>

    <div class="timer-ops">
      <!-- idle -->
      <template v-if="phase === 'idle'">
        <button class="op-btn primary big" @click="startFocus">
          <Icon name="play" :size="18" /> 开始专注 {{ focusMin }} 分钟
        </button>
      </template>
      <!-- focus / rest -->
      <template v-else>
        <button class="op-btn ghost" @click="phase === 'focus' ? quitFocus() : (phase = 'idle')">
          <Icon name="stop" :size="16" /> 结束
        </button>
        <button v-if="running" class="op-btn primary" @click="pause">
          <Icon name="pause" :size="16" /> 暂停
        </button>
        <button v-else class="op-btn primary" @click="resume">
          <Icon name="play" :size="16" /> 继续
        </button>
      </template>
    </div>

    <!-- phase done：转入休息 -->
    <div v-if="phase === 'done'" class="goto-rest">
      <button class="op-btn save" @click="startRest">
        <Icon name="play" :size="16" /> 休息 {{ breakMin }} 分钟
      </button>
      <button class="op-btn ghost" @click="phase = 'idle'">跳过休息</button>
    </div>

    <p class="timer-hint">推荐节奏：专注 {{ focusMin }} 分钟 + 休息 {{ breakMin }} 分钟。专注完成后自动记入「我的 → 专注」。</p>
  </div>
</template>

<style scoped>
.pomo-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  width: min(680px, 94vw);
}

.pomo-head {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
}

.phase-chip {
  padding: 5px 14px;
  border-radius: 999px;
  font-size: 12.5px;
  font-weight: 700;
  letter-spacing: 0.06em;
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
}

.phase-chip.focus {
  background: rgba(247, 248, 240, 0.95);
  color: #1a1c18;
}

.phase-chip.rest {
  background: rgba(126, 214, 166, 0.28);
  color: #d8f6e4;
}

.today-chip {
  font-size: 12.5px;
  color: rgba(255, 255, 255, 0.65);
  font-variant-numeric: tabular-nums;
}

.timer-display {
  font-size: clamp(58px, 16vw, 170px);
  font-size: clamp(30px, 15cqw, 170px);
}

.cfg {
  display: flex;
  gap: 26px;
  flex-wrap: wrap;
  justify-content: center;
}

.cfg-col {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}

.cfg-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.65);
  font-weight: 600;
  letter-spacing: 0.1em;
}

.cfg-chips {
  display: flex;
  gap: 6px;
}

.chip-min {
  width: 44px;
  height: 36px;
  border-radius: 11px;
  font-weight: 700;
  font-size: 14px;
  font-variant-numeric: tabular-nums;
  color: rgba(255, 255, 255, 0.85);
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.14);
  transition: all 0.16s var(--ease-out);
}

.chip-min.on {
  background: #f7f6f0;
  color: #1a1c18;
  border-color: transparent;
}

.timer-ops {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
}

.op-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 46px;
  padding: 0 22px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 14.5px;
  transition: transform 0.15s var(--ease-out), background-color 0.18s;
}

.op-btn:active {
  transform: scale(0.96);
}

.op-btn.primary {
  background: #f7f6f0;
  color: #1a1c18;
}

.op-btn.primary.big {
  min-height: 54px;
  padding: 0 30px;
  font-size: 16px;
}

.op-btn.ghost {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.16);
}

.op-btn.save {
  background: rgba(126, 214, 166, 0.2);
  color: #c9f2da;
  border: 1px solid rgba(126, 214, 166, 0.5);
}

.goto-rest {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
}

.timer-hint {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}
</style>
