<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import FlipDisplay from "../clock/FlipDisplay.vue";
import Icon from "../Icon.vue";
import { playBuiltin, playUrlOnce } from "../../audio/engine.js";
import { fileUrl } from "../../audio/manifest.js";
import { recordFocus } from "../../lib/focus.js";
import { toast } from "../../ui.js";

// 倒计时：iOS 风格滚轮设时长（时/分/秒）+ 预设快捷，到期响铃并记入专注记录
const PRESETS = [5, 15, 25, 45, 60, 90];

const MAX_H = 23;
const MAX_M = 59;
const MAX_S = 59;
const ITEM_H = 44;

const totalSec = ref(25 * 60);
const remainSec = ref(0);
const running = ref(false);
const label = ref("");
const sessionStart = ref(0);
let tick = null;

// 滚轮选中值
const sel = ref({ h: 0, m: 25, s: 0 });
const wheelRefs = { h: null, m: null, s: null };

const displayParts = computed(() => {
  const s = Math.max(0, Math.round(remainSec.value));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0
    ? [String(h).padStart(2, "0"), String(m).padStart(2, "0"), String(sec).padStart(2, "0")]
    : [String(m).padStart(2, "0"), String(sec).padStart(2, "0")];
});

const pad = (n) => String(n).padStart(2, "0");

function maxFor(k) {
  return k === "h" ? MAX_H : MAX_M;
}

function setWheelRef(k, el) {
  wheelRefs[k] = el;
}

// 卷到某索引，并同步选中值
function scrollToIdx(k, idx) {
  const el = wheelRefs[k];
  if (el) {
    el.scrollTop = idx * ITEM_H;
  }
  sel.value[k] = idx;
  applySel();
}

function tapWheel(k, idx) {
  if (running.value) return;
  scrollToIdx(k, idx);
}

function onWheelScroll(k) {
  const el = wheelRefs[k];
  if (!el) return;
  const idx = Math.min(Math.max(Math.round(el.scrollTop / ITEM_H), 0), maxFor(k));
  sel.value[k] = idx;
  applySel();
}

function applySel() {
  totalSec.value = sel.value.h * 3600 + sel.value.m * 60 + sel.value.s;
  if (totalSec.value < 1) totalSec.value = 1;
  if (!running.value) remainSec.value = totalSec.value;
}

// 从预设/初始值写入滚轮
function syncWheelsFromTotal() {
  const t = totalSec.value;
  sel.value = { h: Math.floor(t / 3600), m: Math.floor((t % 3600) / 60), s: t % 60 };
  // 等待渲染后定位
  requestAnimationFrame(() => {
    scrollToIdx("h", sel.value.h);
    scrollToIdx("m", sel.value.m);
    scrollToIdx("s", sel.value.s);
  });
}

function choosePreset(min) {
  if (running.value) return;
  totalSec.value = min * 60;
  remainSec.value = totalSec.value;
  syncWheelsFromTotal();
  label.value = "";
}

function start() {
  if (remainSec.value <= 0) remainSec.value = totalSec.value;
  if (running.value) return;
  running.value = true;
  sessionStart.value = Date.now();
  tick = setInterval(() => {
    remainSec.value -= 0.25;
    if (remainSec.value <= 0) {
      remainSec.value = 0;
      complete();
    }
  }, 250);
}

function pause() {
  running.value = false;
  if (tick) clearInterval(tick);
}

function reset() {
  running.value = false;
  if (tick) clearInterval(tick);
  remainSec.value = totalSec.value;
}

function complete() {
  running.value = false;
  if (tick) clearInterval(tick);
  playUrlOnce(fileUrl("kaoshi/timeend.mp3")); // 闹钟/倒计时结束音
  const elapsed = totalSec.value - Math.max(0, remainSec.value);
  recordFocus("countdown", label.value.trim(), sessionStart.value, Date.now(), elapsed / 60);
  toast("倒计时结束");
}

function finishNow() {
  const elapsed = totalSec.value - Math.max(0, remainSec.value);
  if (elapsed < 60) {
    toast("不足 1 分钟，不记录");
    reset();
    return;
  }
  running.value = false;
  if (tick) clearInterval(tick);
  recordFocus("countdown", label.value.trim(), sessionStart.value, Date.now(), elapsed / 60);
  toast(`已记录 ${Math.round(elapsed / 60)} 分钟`);
  reset();
}

onMounted(syncWheelsFromTotal);
onBeforeUnmount(() => {
  if (tick) clearInterval(tick);
});
</script>

<template>
  <div class="timer-panel">
    <!-- 预设快捷 -->
    <div class="pick-row">
      <button
        v-for="p in PRESETS"
        :key="p"
        class="preset-chip"
        :class="{ on: !running && totalSec === p * 60 }"
        @click="choosePreset(p)"
      >
        {{ p }} 分
      </button>
    </div>

    <!-- iOS 风格滚轮 -->
    <div class="wheels" :class="{ run: running }">
      <div class="wheel-col">
        <div class="wheel" :ref="(el) => setWheelRef('h', el)" @scroll.passive="onWheelScroll('h')">
          <button v-for="i in MAX_H + 1" :key="i - 1" class="w-item" :class="{ on: sel.h === i - 1 }" @click="tapWheel('h', i - 1)">{{ pad(i - 1) }}</button>
        </div>
        <span class="w-unit">时</span>
      </div>
      <div class="wheel-col">
        <div class="wheel" :ref="(el) => setWheelRef('m', el)" @scroll.passive="onWheelScroll('m')">
          <button v-for="i in MAX_M + 1" :key="i - 1" class="w-item" :class="{ on: sel.m === i - 1 }" @click="tapWheel('m', i - 1)">{{ pad(i - 1) }}</button>
        </div>
        <span class="w-unit">分</span>
      </div>
      <div class="wheel-col">
        <div class="wheel" :ref="(el) => setWheelRef('s', el)" @scroll.passive="onWheelScroll('s')">
          <button v-for="i in MAX_S + 1" :key="i - 1" class="w-item" :class="{ on: sel.s === i - 1 }" @click="tapWheel('s', i - 1)">{{ pad(i - 1) }}</button>
        </div>
        <span class="w-unit">秒</span>
      </div>
    </div>

    <FlipDisplay :parts="displayParts" :blink="running" class="timer-display" :class="{ low: remainSec <= 10 && running }" />

    <div class="timer-sub">
      <span v-if="running && remainSec <= 60" class="live-chip warn pulse">即将结束</span>
      <span v-else-if="running" class="live-chip"><span class="dot pulse"></span> 倒计时中</span>
      <span v-else class="live-chip">{{ remainSec > 0 ? "已就绪" : "完成" }}</span>
    </div>

    <input v-model="label" class="act-input" maxlength="20" placeholder="正在做什么？（选填，如：阅读一章节）" />

    <div class="timer-ops">
      <button class="op-btn ghost" @click="reset"><Icon name="stop" :size="16" /> 重置</button>
      <button v-if="!running" class="op-btn primary" @click="start">
        <Icon name="play" :size="16" />
        {{ remainSec === totalSec ? "开始" : "继续" }}
      </button>
      <button v-else class="op-btn primary" @click="pause"><Icon name="pause" :size="16" /> 暂停</button>
      <button v-if="remainSec < totalSec && remainSec > 0" class="op-btn save" @click="finishNow">
        <Icon name="check" :size="16" /> 提前结束并记录
      </button>
    </div>
    <p class="timer-hint">上下拨动设时长；到期自动响铃，不足一分钟不记录。</p>
  </div>
</template>

<style scoped>
.timer-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  width: min(680px, 94vw);
}

.pick-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
}

.preset-chip {
  padding: 7px 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 650;
  color: rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.09);
  border: 1px solid rgba(255, 255, 255, 0.12);
  transition: all 0.18s var(--ease-out);
  font-variant-numeric: tabular-nums;
}

.preset-chip.on {
  background: #f7f6f0;
  color: #1a1c18;
}

/* ===== iOS 滚轮 ===== */
.wheels {
  display: flex;
  gap: 14px;
  align-items: center;
  justify-content: center;
}
.wheels.run {
  opacity: 0.5;
  pointer-events: none;
}
.wheel-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.wheel {
  position: relative;
  width: 74px;
  height: 132px;
  overflow-y: scroll;
  scroll-snap-type: y mandatory;
  padding: 44px 0;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  /* 上下渐变遮罩，制造“滚轮”感 */
  mask-image: linear-gradient(180deg, transparent 0%, #000 28%, #000 72%, transparent 100%);
  -webkit-mask-image: linear-gradient(180deg, transparent 0%, #000 28%, #000 72%, transparent 100%);
  cursor: ns-resize;
  overscroll-behavior: contain;
}
.wheel::-webkit-scrollbar {
  display: none;
}
.w-item {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  scroll-snap-align: center;
  font-size: 20px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.45);
  font-variant-numeric: tabular-nums;
  width: 100%;
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.15s;
}
.w-item.on {
  color: #fff;
  font-size: 24px;
}
.w-unit {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.timer-display {
  font-size: clamp(60px, 17vw, 180px);
}

.timer-display.low {
  animation: soft-pulse 1s infinite;
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
}

.live-chip.warn {
  color: #ffd9a8;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #7ed6a6;
}

.act-input {
  width: min(420px, 100%);
  min-height: 44px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  text-align: center;
  font-size: 14px;
  padding: 0 18px;
}

.act-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
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

.timer-hint {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}
</style>
