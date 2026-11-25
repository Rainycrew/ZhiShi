<script setup>
import { ref, watch, onMounted, nextTick } from "vue";
import { unlockQueue } from "../uiUnlocks.js";
import { burstFromRect, ringFromRect } from "../lib/celebrate.js";
import { gsap } from "gsap";
import Icon from "./Icon.vue";

const TIER_NAME = { 1: "铜", 2: "银", 3: "金", 4: "曜" };
const reduce = window.matchMedia
  ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
  : false;

const current = ref(null);
const layer = ref(null);
let busy = false;

async function pump() {
  if (busy) return;
  if (!unlockQueue.length) return;
  const batch = unlockQueue.shift();
  busy = true;
  current.value = batch;
  await nextTick();

  const el = layer.value;
  if (el) {
    const rect = el.getBoundingClientRect();
    if (!reduce) {
      burstFromRect(rect, { count: 34 });
      ringFromRect(rect, "rgba(242,191,30,0.4)");
      gsap.fromTo(
        el.querySelectorAll(".u-chip"),
        { autoAlpha: 0, y: 40, scale: 0.4 },
        { autoAlpha: 1, y: 0, scale: 1, stagger: 0.14, duration: 0.65, ease: "back.out(1.8)" }
      );
    }
    gsap.fromTo(el, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: "power3.out" });
  }

  const hold = reduce ? 1200 : 3600;
  setTimeout(() => {
    gsap.to(el, {
      autoAlpha: 0,
      y: -26,
      scale: 0.96,
      duration: reduce ? 0 : 0.5,
      ease: "power2.in",
      onComplete() {
        current.value = null;
        busy = false;
        pump();
      }
    });
  }, hold);
}

watch(
  () => unlockQueue.length,
  () => {
    if (!current.value) pump();
  }
);

onMounted(pump);
</script>

<template>
  <Teleport to="body">
    <div v-if="current" class="u-wrap" ref="layer">
      <div class="u-kicker"><Icon name="medal" :size="14" /> 成就解锁</div>
      <div class="u-card">
        <div
          v-for="(a, i) in current.items"
          :key="current.id + '-' + i"
          class="u-chip"
          :class="'t' + (a.tier || 1)"
        >
          <span class="u-ic"><Icon :name="a.icon" :size="22" /></span>
          <span class="u-main">
            <span class="u-name">{{ a.name }}</span>
            <span class="u-tier">{{ TIER_NAME[a.tier] || "" }}级勋章</span>
          </span>
          <Icon name="check" :size="16" class="u-check" :stroke="3" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.u-wrap {
  position: fixed;
  left: 50%;
  top: calc(14% + var(--safe-t));
  transform: translateX(-50%);
  z-index: 300;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  pointer-events: none;
  width: max-content;
  max-width: min(92vw, 460px);
}

.u-kicker {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.3em;
  color: #c99a1d;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(201, 154, 29, 0.35);
  padding: 6px 16px;
  border-radius: 999px;
  box-shadow: 0 10px 24px -12px rgba(120, 84, 10, 0.45);
  backdrop-filter: blur(8px);
}

.u-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.u-chip {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 18px 10px 10px;
  border-radius: 20px;
  background: linear-gradient(150deg, #fffdf4, #fdf3d0);
  border: 1px solid rgba(201, 154, 29, 0.4);
  box-shadow: 0 24px 60px -22px rgba(120, 84, 10, 0.6),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  width: 100%;
}

.u-ic {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
}

.u-chip.t1 .u-ic {
  background: linear-gradient(150deg, #f2e2c0, #c99a4a);
  color: #6d4a0a;
}

.u-chip.t2 .u-ic {
  background: linear-gradient(150deg, #eef3fb, #aebdd2);
  color: #31476a;
}

.u-chip.t3 .u-ic {
  background: linear-gradient(150deg, #ffe9ae, #e2ab25);
  color: #6d4a06;
}

.u-chip.t4 .u-ic {
  background: linear-gradient(150deg, #fff0d0, #eec25f);
  color: #7a5206;
  box-shadow: 0 0 0 3px rgba(226, 171, 37, 0.2);
}

.u-main {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.u-name {
  font-size: 17px;
  font-weight: 850;
  color: #2d2410;
  letter-spacing: 0.01em;
}

.u-tier {
  font-size: 11.5px;
  font-weight: 700;
  color: #9a7a2c;
  letter-spacing: 0.06em;
}

.u-check {
  margin-left: auto;
  color: #c9970f;
  flex: none;
}
</style>
