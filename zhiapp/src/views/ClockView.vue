<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, onUnmounted } from "vue";
import { state, store } from "../store/state.js";
import { navigate } from "../router.js";
import { media } from "../store/media.js";
import { CLOCK_PRESETS } from "../config.js";
import { clockSkinById, NOISE_SKINS } from "../lib/skins.js";
import Icon from "../components/Icon.vue";
import FlipDisplay from "../components/clock/FlipDisplay.vue";
import Stopwatch from "../components/clock/Stopwatch.vue";
import Countdown from "../components/clock/Countdown.vue";
import Pomodoro from "../components/clock/Pomodoro.vue";
import { toast } from "../ui.js";
import { useNow } from "../composables/useNow.js";
import { fmtDateCN } from "../utils.js";
import { noiseEngine } from "../audio/noise.js";

const now = useNow(200);
const fullscreenOn = ref(false);
const showPanel = ref(false);
const customUrl = ref(null);
let customObjUrl = null;

const clock = computed(() => state.clock);
const week = ["日", "一", "二", "三", "四", "五", "六"];

const MODES = [
  { id: "clock", label: "时钟", icon: "clock" },
  { id: "stopwatch", label: "正计时", icon: "timer" },
  { id: "countdown", label: "倒计时", icon: "alarm" },
  { id: "pomodoro", label: "番茄钟", icon: "note" }
];

const mode = computed({
  get: () => clock.value.mode || "clock",
  set: (v) => {
    clock.value.mode = v;
    stopNoiseIfLeaving();
  }
});

// 背景
const bgStyle = computed(() => {
  // 自定义图片优先；其次商城时钟皮肤；最后自由预设
  if (clock.value.bgKey) {
    return customUrl.value
      ? { backgroundImage: `url(${customUrl.value})`, backgroundSize: "cover", backgroundPosition: "center" }
      : {};
  }
  const cs = clockSkinById(state.clockskin.equipped);
  if (cs) return { background: cs.css, backgroundSize: "cover", backgroundPosition: "center" };
  const p = CLOCK_PRESETS.find((x) => x.id === clock.value.preset);
  return { background: p ? p.css : CLOCK_PRESETS[0].css };
});

watch(
  () => clock.value.bgKey,
  async (k) => {
    if (customObjUrl) URL.revokeObjectURL(customObjUrl);
    customObjUrl = null;
    customUrl.value = null;
    if (!k) return;
    try {
      const u = await media.url(k);
      customUrl.value = u;
      customObjUrl = u;
    } catch (e) {}
  },
  { immediate: true }
);

async function onPickBgFile(ev) {
  const f = ev.target.files && ev.target.files[0];
  ev.target.value = "";
  if (!f) return;
  if (!f.type.startsWith("image/")) {
    toast("请选择图片文件", "err");
    return;
  }
  if (clock.value.bgKey) await media.remove(clock.value.bgKey).catch(() => {});
  const rec = await media.put("img", f);
  clock.value.bgKey = rec.key;
  store.unequipExtra("clockskin"); // 用自定义图时取消商城时钟皮肤
  toast("背景图已应用");
}

function clearCustomBg() {
  if (clock.value.bgKey) {
    media.remove(clock.value.bgKey).catch(() => {});
    clock.value.bgKey = null;
  }
  clock.value.preset = CLOCK_PRESETS[0].id;
}

// 白噪音（关闭/白噪/雨/风 + 商城购买的白噪音皮肤）
const NOISE_TYPES = computed(() => {
  const base = [
    { id: "off", label: "关闭", icon: "volumeOff" },
    { id: "white", label: "白噪音", icon: "volume" },
    { id: "rain", label: "雨声", icon: "volume" },
    { id: "wind", label: "风声", icon: "volume" }
  ];
  for (const n of NOISE_SKINS) if (state.noiseskin.owned.includes(n.id)) base.push({ id: n.id, label: n.name, icon: "volume" });
  return base;
});

const noise = computed({
  get: () => clock.value.noise || "off",
  set: (v) => {
    clock.value.noise = v;
    applyNoise();
  }
});

function applyNoise() {
  const n = clock.value.noise || "off";
  if (n === "off") noiseEngine.stop();
  else noiseEngine.play(n, clock.value.noiseVol || 0.35);
}

function setNoiseVol(v) {
  clock.value.noiseVol = v;
  if (noise.value !== "off") noiseEngine.setVolume(v);
}

function stopNoiseIfLeaving() {
  if (noise.value !== "off" && mode.value !== "clock") {
    noiseEngine.stop();
  }
}

// 全屏（平板/手机无 Esc，提供内置退出）
const stageEl = ref(null);

async function toggleFullscreen() {
  try {
    const doc = document;
    if (!doc.fullscreenElement) {
      await stageEl.value.requestFullscreen({ navigationUI: "hide" });
    } else {
      await doc.exitFullscreen();
    }
  } catch (e) {
    toast("当前环境不支持全屏", "err");
  }
}

function onFsChange() {
  fullscreenOn.value = !!document.fullscreenElement;
  if (!fullscreenOn.value && noise.value !== "off" && mode.value === "clock") applyNoise();
}

onMounted(() => document.addEventListener("fullscreenchange", onFsChange));
onBeforeUnmount(() => {
  document.removeEventListener("fullscreenchange", onFsChange);
  noiseEngine.stop();
});
onUnmounted(() => {
  if (customObjUrl) URL.revokeObjectURL(customObjUrl);
});

// 时钟显示
const clockParts = computed(() => {
  const d = now.value;
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return clock.value.showSeconds ? [hh, mm, ss] : [hh, mm];
});

const dateLine = computed(() => {
  const d = now.value;
  return `${fmtDateCN(d)}`;
});
</script>

<template>
  <div ref="stageEl" class="clock-stage" :style="bgStyle">
    <div class="clock-tint"></div>

    <!-- 顶部 -->
    <div class="top-bar" :class="{ 'in-fs': fullscreenOn }">
      <button class="glass-btn" @click="navigate('home')">
        <Icon name="back" :size="18" />
        <span class="hide-sm">返回</span>
      </button>

      <div class="mode-tabs">
        <button
          v-for="m in MODES"
          :key="m.id"
          class="mode-tab"
          :class="{ on: mode === m.id }"
          @click="mode = m.id"
        >
          <Icon :name="m.icon" :size="15" />
          <span>{{ m.label }}</span>
        </button>
      </div>

      <div class="top-right">
        <button class="glass-btn" @click="showPanel = !showPanel">
          <Icon name="image" :size="17" />
          <span class="hide-sm">背景·声音</span>
        </button>
        <button v-if="fullscreenOn" class="glass-btn accent" @click="toggleFullscreen">
          <Icon name="collapse" :size="17" />
          <span>退出全屏</span>
        </button>
        <button v-else class="glass-btn" @click="toggleFullscreen">
          <Icon name="fullscreen" :size="17" />
          <span class="hide-sm">全屏</span>
        </button>
      </div>
    </div>

    <!-- 主体 -->
    <div class="clock-body">
      <!-- 时钟：翻页 -->
      <div v-if="mode === 'clock'" class="flip-zone">
        <FlipDisplay :parts="clockParts" blink class="flip-time" />
        <div class="flip-date">{{ dateLine }}</div>
        <div v-if="noise !== 'off'" class="noise-on-chip">
          <span class="pulse-dot"></span> 正在播放{{ NOISE_TYPES.find((x) => x.id === noise)?.label }}
        </div>
      </div>

      <!-- 计时器 -->
      <Stopwatch v-else-if="mode === 'stopwatch'" />
      <Countdown v-else-if="mode === 'countdown'" />
      <Pomodoro v-else-if="mode === 'pomodoro'" />
    </div>

    <!-- 设置面板：背景 / 声音 / 秒 -->
    <Transition name="fade-slide">
      <div v-if="showPanel" class="ctl-panel">
        <div class="ctl-head">
          <span class="ctl-title">外观与声音</span>
          <button class="glass-btn sm" @click="showPanel = false"><Icon name="x" :size="16" /></button>
        </div>

        <div class="ctl-sec">
          <span class="ctl-label">背景预设</span>
          <div v-if="state.clockskin.equipped" class="bg-skin-notice">
            <span class="bg-skin-name">已启用商城皮肤：{{ clockSkinById(state.clockskin.equipped)?.name }}</span>
            <button class="glass-chip" @click="store.unequipExtra('clockskin')">
              <Icon name="refresh" :size="13" /> 使用预设 / 自定义
            </button>
          </div>
          <div class="bg-grid">
            <button
              v-for="p in CLOCK_PRESETS"
              :key="p.id"
              class="bg-swatch"
              :class="{ on: !clock.bgKey && clock.preset === p.id && !state.clockskin.equipped }"
              :style="{ background: p.css }"
              @click="clock.preset = p.id; clock.bgKey = null; store.unequipExtra('clockskin')"
            >
              <span class="swatch-name">{{ p.name }}</span>
              <span v-if="!clock.bgKey && clock.preset === p.id" class="swatch-check">
                <Icon name="check" :size="12" :stroke="3" />
              </span>
            </button>
          </div>
          <div class="bg-ops">
            <label class="glass-chip">
              <Icon name="upload" :size="14" /> 自定义图片
              <input type="file" accept="image/*" hidden @change="onPickBgFile" />
            </label>
            <button v-if="clock.bgKey" class="glass-chip danger" @click="clearCustomBg">
              <Icon name="trash" :size="14" /> 移除
            </button>
          </div>
        </div>

        <div v-if="mode === 'clock'" class="ctl-sec">
          <span class="ctl-label">白噪音</span>
          <div class="noise-row">
            <button
              v-for="n in NOISE_TYPES"
              :key="n.id"
              class="noise-chip"
              :class="{ on: noise === n.id }"
              @click="noise = n.id"
            >
              <Icon :name="n.icon" :size="13" /> {{ n.label }}
            </button>
          </div>
          <div v-if="noise !== 'off'" class="vol-row">
            <Icon name="volume" :size="14" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              :value="clock.noiseVol || 0.35"
              @input="setNoiseVol(Number($event.target.value))"
            />
          </div>
        </div>

        <label v-if="mode === 'clock'" class="switch-row">
          <span>显示秒</span>
          <button class="sw" :class="{ on: clock.showSeconds }" @click="clock.showSeconds = !clock.showSeconds">
            <span class="sw-knob"></span>
          </button>
        </label>
      </div>
    </Transition>

    <div v-if="fullscreenOn" class="fs-tip">
      <Icon name="collapse" :size="13" /> 点击右上角「退出全屏」返回
    </div>
  </div>
</template>

<style scoped>
.clock-stage {
  position: relative;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  color: #f4f3ec;
  display: flex;
  flex-direction: column;
  background: #14171a;
}

.clock-tint {
  position: absolute;
  inset: 0;
  background: radial-gradient(120% 100% at 50% 0%, rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.4));
  pointer-events: none;
}

/* 顶栏 */
.top-bar {
  position: relative;
  z-index: 8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 14px clamp(10px, 2vw, 24px);
  padding-top: calc(14px + var(--safe-t));
  flex-wrap: wrap;
}

.top-right {
  display: flex;
  gap: 8px;
}

.mode-tabs {
  display: flex;
  gap: 4px;
  background: rgba(0, 0, 0, 0.28);
  border: 1px solid rgba(255, 255, 255, 0.12);
  padding: 4px;
  border-radius: 999px;
  backdrop-filter: blur(10px);
  order: 3;
  width: 100%;
  justify-content: center;
}

@media (min-width: 680px) {
  .mode-tabs {
    order: 0;
    width: auto;
  }
}

.mode-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 36px;
  padding: 0 15px;
  border-radius: 999px;
  color: rgba(255, 255, 255, 0.75);
  font-size: 13.5px;
  font-weight: 650;
  transition: background-color 0.18s, color 0.18s;
}

.mode-tab.on {
  background: rgba(255, 255, 255, 0.95);
  color: #191c18;
}

.glass-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 40px;
  padding: 0 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.16);
  color: #f0efe7;
  font-size: 13.5px;
  font-weight: 600;
  backdrop-filter: blur(8px);
  transition: background-color 0.18s, transform 0.15s var(--ease-out);
}

.glass-btn:hover {
  background: rgba(255, 255, 255, 0.18);
}

.glass-btn:active {
  transform: scale(0.96);
}

.glass-btn.accent {
  background: rgba(247, 248, 240, 0.94);
  color: #191c18;
}

.glass-btn.sm {
  width: 38px;
  padding: 0;
  justify-content: center;
}

/* 主体 */
.clock-body {
  position: relative;
  z-index: 3;
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 16px 6vh;
  overflow-y: auto;
  /* 容器查询：让翻页数字按可用宽度缩放，手机全屏不截断 */
  container-type: inline-size;
}

.flip-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(12px, 2.4vh, 26px);
  text-align: center;
}

.flip-time {
  /* 回退方案：先按视口比例，支持容器查询的浏览器再用 cqw 精确适配 */
  font-size: clamp(36px, 21vmin, 230px);
  font-size: clamp(28px, 15.5cqw, 230px);
  text-shadow: 0 22px 70px rgba(0, 0, 0, 0.5);
}

.flip-date {
  font-size: clamp(14px, 2.4vw, 22px);
  letter-spacing: 0.18em;
  color: rgba(255, 255, 255, 0.88);
  text-shadow: 0 6px 30px rgba(0, 0, 0, 0.4);
}

.noise-on-chip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 12.5px;
  color: rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.14);
  padding: 6px 13px;
  border-radius: 999px;
  backdrop-filter: blur(6px);
}

.pulse-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #9be3bd;
  animation: soft-pulse 1.8s ease-in-out infinite;
}

/* 面板 */
.ctl-panel {
  position: absolute;
  right: clamp(10px, 2vw, 26px);
  top: calc(64px + var(--safe-t));
  z-index: 9;
  width: min(380px, calc(100vw - 24px));
  max-height: calc(100% - 120px);
  overflow-y: auto;
  background: rgba(20, 22, 18, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 24px;
  padding: 16px;
  backdrop-filter: blur(18px);
  box-shadow: 0 30px 90px -20px rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ctl-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ctl-title {
  font-weight: 750;
  font-size: 15px;
}

.ctl-sec {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.ctl-label {
  font-size: 12px;
  letter-spacing: 0.12em;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 700;
}

.bg-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.bg-swatch {
  position: relative;
  aspect-ratio: 16 / 10;
  border-radius: 12px;
  border: 2px solid transparent;
  overflow: hidden;
  transition: transform 0.15s var(--ease-out);
}

.bg-swatch:hover {
  transform: scale(1.05);
}

.bg-swatch.on {
  border-color: rgba(255, 255, 255, 0.9);
}

.swatch-name {
  position: absolute;
  left: 8px;
  bottom: 6px;
  font-size: 10px;
  color: #fff;
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.7);
}

.swatch-check {
  position: absolute;
  right: 6px;
  top: 6px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  color: #17331f;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.bg-ops {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.bg-skin-notice {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  padding: 8px 12px;
  margin-bottom: 10px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.14);
}
.bg-skin-name {
  font-size: 12.5px;
  font-weight: 650;
  color: #eef3ff;
}

.glass-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 13px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.16);
  color: #f0efe7;
  font-size: 12.5px;
  font-weight: 650;
  cursor: pointer;
}

.glass-chip.danger {
  color: #ffc9b8;
}

.noise-row {
  display: flex;
  gap: 7px;
  flex-wrap: wrap;
}

.noise-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 7px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.09);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.85);
  font-size: 12.5px;
  font-weight: 650;
  transition: all 0.16s var(--ease-out);
}

.noise-chip.on {
  background: #f7f6f0;
  color: #191c18;
}

.vol-row {
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgba(255, 255, 255, 0.8);
}

.vol-row input[type="range"] {
  flex: 1;
  accent-color: #8fd6b2;
}

.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 13.5px;
  font-weight: 650;
  color: rgba(255, 255, 255, 0.9);
}

.sw {
  width: 46px;
  height: 26px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.22);
  position: relative;
  transition: background-color 0.2s;
}

.sw.on {
  background: #7cc7a8;
}

.sw-knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.22s var(--ease-out);
}

.sw.on .sw-knob {
  transform: translateX(20px);
}

.fs-tip {
  position: absolute;
  bottom: 14px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 7;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
  background: rgba(0, 0, 0, 0.3);
  padding: 7px 14px;
  border-radius: 999px;
  backdrop-filter: blur(6px);
}
</style>
