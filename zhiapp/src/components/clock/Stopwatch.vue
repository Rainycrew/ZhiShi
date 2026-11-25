<script setup>
import { ref, computed, onBeforeUnmount } from "vue";
import FlipDisplay from "../clock/FlipDisplay.vue";
import Icon from "../Icon.vue";
import { recordFocus } from "../../lib/focus.js";
import { toast } from "../../ui.js";

// 正计时：可记录「在做什么」，结束后写入专注记录（不写入主页考试记录）
const QUICK = ["阅读", "刷题", "背单词", "网课", "写作", "运动"];

const running = ref(false);
const label = ref("");
const activeMs = ref(0); // 累计活动毫秒
const startedAt = ref(0); // 本次会话起点（暂停期间不累积）
const recorded = ref(false); // 本次是否已记录（防重复）
let tick = null;

const displayParts = computed(() => {
  const s = Math.floor(activeMs.value / 1000);
  return [String(Math.floor(s / 60)).padStart(2, "0"), String(s % 60).padStart(2, "0")];
});

const minsDone = computed(() => Math.floor(activeMs.value / 60000));
const secsToRecord = computed(() =>
  Math.max(0, Math.ceil((60000 - activeMs.value) / 1000))
);

function start() {
  if (running.value) return;
  running.value = true;
  if (!startedAt.value) startedAt.value = Date.now();
  // 上一轮已记录/清零后，新一轮可再次记录
  if (activeMs.value === 0) recorded.value = false;
  const base = activeMs.value;
  const t0 = Date.now();
  tick = setInterval(() => {
    activeMs.value = base + (Date.now() - t0);
  }, 250);
}

function pause() {
  if (!running.value) return;
  running.value = false;
  clearInterval(tick);
}

function reset() {
  running.value = false;
  if (tick) clearInterval(tick);
  activeMs.value = 0;
  startedAt.value = 0;
  recorded.value = false;
}

function finishRecord() {
  const now = Date.now();
  const ok = recordFocus(
    "stopwatch",
    label.value.trim(),
    startedAt.value || now,
    now,
    activeMs.value / 60000
  );
  if (ok) {
    recorded.value = true;
    toast(`已记录专注 ${minsDone.value} 分钟（${label.value.trim() || "未命名"}）`);
  } else {
    toast("不足 1 分钟，未记录", "err");
  }
  reset();
}

onBeforeUnmount(() => {
  if (tick) clearInterval(tick);
  // 跑满 1 分钟但忘记点“记录本次”就离开 → 自动补记，避免丢失
  if (activeMs.value >= 60000 && !recorded.value) {
    recordFocus(
      "stopwatch",
      label.value.trim(),
      startedAt.value || Date.now(),
      Date.now(),
      activeMs.value / 60000
    );
  }
});
</script>

<template>
  <div class="timer-panel">
    <FlipDisplay :parts="displayParts" :blink="running" class="timer-display" />
    <div class="timer-sub">
      <span v-if="running" class="live-chip"><span class="dot pulse"></span> 计时中</span>
      <span v-else-if="activeMs > 0" class="live-chip">已暂停</span>
      <span v-else class="live-chip">准备开始</span>
    </div>

    <div class="act-row">
      <input
        v-model="label"
        class="act-input"
        maxlength="20"
        placeholder="正在做什么？（选填，如阅读）"
      />
      <div class="quick-chips">
        <button
          v-for="q in QUICK"
          :key="q"
          class="q-chip"
          :class="{ on: label === q }"
          @click="label = label === q ? '' : q"
        >
          {{ q }}
        </button>
      </div>
    </div>

    <div class="timer-ops">
      <button class="op-btn ghost" @click="reset"><Icon name="stop" :size="16" /> 重置</button>
      <button v-if="!running" class="op-btn primary" @click="start">
        <Icon name="play" :size="16" /> {{ activeMs ? "继续" : "开始" }}
      </button>
      <button v-else class="op-btn primary" @click="pause"><Icon name="pause" :size="16" /> 暂停</button>
      <button
        v-if="activeMs > 0"
        class="op-btn save"
        :disabled="activeMs < 60000"
        @click="finishRecord"
      >
        <Icon name="check" :size="16" /> {{ activeMs < 60000 ? `再 ${secsToRecord} 秒可记录` : "记录本次" }}
      </button>
    </div>
    <div class="hint-zone">
      <p v-if="activeMs >= 60000 && !recorded" class="record-ready">已满 1 分钟，点「记录本次」保存；直接离开会自动记录</p>
      <p v-else class="timer-hint">
        正计时满 1 分钟才可记录（含“正在做什么”），记录存到「我的 → 专注」，不会写入考试记录。
      </p>
    </div>
  </div>
</template>

<style scoped>
.timer-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  width: min(680px, 94vw);
}

.timer-display {
  font-size: clamp(60px, 17vw, 190px);
  font-size: clamp(30px, 15cqw, 190px);
}

.timer-sub {
  min-height: 20px;
}

.live-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.75);
  font-weight: 600;
  letter-spacing: 0.1em;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #7ed6a6;
}

.act-row {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
}

.act-input {
  width: min(420px, 100%);
  min-height: 44px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
  color: #fff;
  text-align: center;
  font-size: 14px;
  padding: 0 18px;
}

.act-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.quick-chips {
  display: flex;
  gap: 7px;
  flex-wrap: wrap;
  justify-content: center;
}

.q-chip {
  padding: 5px 13px;
  border-radius: 999px;
  font-size: 12.5px;
  color: rgba(255, 255, 255, 0.75);
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.18s var(--ease-out);
}

.q-chip.on {
  background: rgba(255, 255, 255, 0.95);
  color: #1a1c18;
  border-color: transparent;
}

.timer-ops {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 4px;
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

.op-btn.save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.hint-zone {
  min-height: 18px;
}

.record-ready {
  font-size: 12.5px;
  color: #b8ecd0;
  font-weight: 600;
  animation: soft-pulse 2.2s ease-in-out infinite;
}

.timer-hint {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}
</style>
