<script setup>
// 打卡成功后的「打卡天数卡片」：金奖杯卡 + 头像 + 姓名 + 连续天数 + 累计打卡。
// 弹出时用 GSAP 做入场动画（响应 prefers-reduced-motion），可关闭。
import { ref, watch, nextTick, onUnmounted } from "vue";
import { gsap } from "gsap";
import Icon from "./Icon.vue";
import Avatar from "./Avatar.vue";

const props = defineProps({
  show: { type: Boolean, default: false },
  name: { type: String, default: "" },
  avatarKey: { type: String, default: null },
  streak: { type: Number, default: 0 }, // 当前连续天数
  total: { type: Number, default: 0 }, // 累计打卡天数
  gained: { type: Number, default: 0 }, // 本次获得积分
  skin: { type: String, default: "gold" } // 天数卡片皮肤：gold | obsidian | sakura | starlight
});

const emit = defineEmits(["close"]);

const reduce = typeof window !== "undefined" && window.matchMedia
  ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
  : false;

const layer = ref(null);
let tl = null;

function play() {
  if (!layer.value) return;
  const el = layer.value;
  const card = el.querySelector(".dc-card");
  const parts = el.querySelectorAll(".dc-item");
  if (reduce) return;
  gsap.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, ease: "power2.out" });
  gsap.fromTo(
    card,
    { y: 26, scale: 0.92, autoAlpha: 0 },
    { y: 0, scale: 1, autoAlpha: 1, duration: 0.55, ease: "back.out(1.5)" }
  );
  tl = gsap.timeline({ delay: 0.35 });
  tl.fromTo(parts, { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.45, ease: "power3.out", stagger: 0.09 });
}

watch(
  () => props.show,
  (v) => {
    if (v) {
      nextTick(play);
    } else if (tl) {
      tl.kill();
      tl = null;
    }
  }
);

function close() {
  emit("close");
}
</script>

<template>
  <Teleport to="body">
    <div v-if="show" ref="layer" class="dc-overlay" @click.self="close">
      <div class="dc-card" :class="'dc-' + skin">
        <button class="dc-close" @click="close" aria-label="关闭">
          <Icon name="x" :size="16" />
        </button>

        <div class="dc-outline dc-item">
          <svg class="dc-trophy" viewBox="0 0 1024 1024">
            <path fill="#ea9518" d="M469 683h85v128h-85zM435 811h154a8.5 8.5 0 0 1 8.5 8.5v34H427v-34a8.5 8.5 0 0 1 8.5-8.5z" />
            <path fill="#6e4a32" d="M384 853h256a42.7 42.7 0 0 1 42.7 42.7v42.6H341v-42.6a42.7 42.7 0 0 1 42.7-42.7z" />
            <path fill="#f4ea2a" d="M213 256v85a42.7 42.7 0 0 0 85.3 0V256H213zM171 213h171v128a85.3 85.3 0 1 1-171 0V213zM725 256v85a42.7 42.7 0 0 0 85.3 0V256h-85.3z m-42.7-42.7h171v128a85.3 85.3 0 1 1-171 0V213z" />
            <path fill="#f2be45" d="M299 85h426a42.7 42.7 0 0 1 42.7 42.7V469a256 256 0 1 1-512 0V128A42.7 42.7 0 0 1 299 85z" />
            <path fill="#FFF2A0" d="M512 469l-100 53 19-112-81-79 112-16 50-102 50 102 112 16-81 79 19 112z" />
          </svg>
          <div class="dc-streak">
            <span class="dc-num tnum">{{ streak }}</span>
            <span class="dc-word">天</span>
          </div>
          <div class="dc-split"></div>
          <div class="dc-user">
            <Avatar :avatar-key="avatarKey" :name="name" :size="40" />
            <span class="dc-name">{{ name || "未设置姓名" }}</span>
          </div>
        </div>

        <div class="dc-detail dc-item">
          <svg class="dc-medals" viewBox="0 0 1024 1024" width="72" height="72">
            <path fill="#E3A815" d="M299 256h427v213H299z" />
            <path fill="#FDDC3A" d="M512 661a320 320 0 1 0 640 0 320 320 0 1 0-640 0Z" />
            <path fill="#F5CF41" d="M512 661a213 213 0 1 0 426 0 213 213 0 1 0-426 0Z" />
            <path fill="#FFF2A0" d="M512 747l-100 53 19-112-81-79 112-16 50-102 50 102 112 16-81 79 19 112z" />
          </svg>
          <div class="dc-grades">
            <p class="dc-label">累计打卡</p>
            <p class="dc-total tnum">{{ total }} 天</p>
          </div>
          <div v-if="gained > 0" class="dc-gain">
            <Icon name="plus" :size="15" /> {{ gained }} 积分
          </div>
        </div>

        <p class="dc-tip dc-item">坚持打卡，去商城还可用积分换皮肤</p>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.dc-overlay {
  position: fixed;
  inset: 0;
  z-index: 320;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  background: rgba(28, 30, 24, 0.4);
  backdrop-filter: blur(6px) saturate(0.9);
}
.dc-card {
  position: relative;
  width: min(340px, 100%);
  padding-bottom: 14px;
}
.dc-close {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #fff;
  border: 1px solid var(--line);
  color: var(--ink-2);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  z-index: 3;
}
.dc-outline {
  position: relative;
  background: linear-gradient(45deg, #fffbf0, #ffdd87);
  padding: 22px 20px;
  border-radius: 25px;
  z-index: 2;
  overflow: hidden;
}
.dc-trophy {
  position: absolute;
  right: 8px;
  top: 8px;
  width: 96px;
  height: 96px;
}
.dc-streak {
  position: relative;
  display: flex;
  align-items: baseline;
  gap: 4px;
}
.dc-num {
  color: #ffc64b;
  font-size: 78px;
  font-weight: 800;
  line-height: 1;
}
.dc-word {
  font-size: 36px;
  color: #424c50;
  font-weight: 700;
}
.dc-split {
  position: relative;
  width: 100%;
  height: 10px;
  margin: 12px 0;
  background-image: linear-gradient(to right, transparent 10%, #ffe8a0 20%, #f7b733 50%, #ffe8a0 70%, transparent 90%);
}
.dc-user {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
}
.dc-name {
  font-weight: 600;
  color: #6b7578;
  font-size: 18px;
}
.dc-detail {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fff;
  margin-top: -14px;
  padding: 18px 20px 14px 14px;
  border-radius: 0 0 25px 25px;
  z-index: 1;
}
.dc-grades {
  display: flex;
  flex-direction: column;
}
.dc-label {
  color: #424c50;
  letter-spacing: 5px;
  font-size: 13px;
  font-weight: 800;
}
.dc-total {
  font-size: 25px;
  font-weight: 800;
  color: #ea9518;
  margin-top: 2px;
}
.dc-gain {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: linear-gradient(180deg, #ffe27a, #f2bf1e);
  color: #4a3500;
  font-weight: 700;
  font-size: 13px;
  padding: 6px 12px;
  border-radius: 999px;
}
.dc-tip {
  text-align: center;
  font-size: 12px;
  color: var(--ink-3);
  margin-top: 4px;
}

/* ---- 卡片皮肤 ---- */
/* 曜石 */
.dc-obsidian .dc-outline { background: linear-gradient(45deg, #1c1e24, #2b2f38); }
.dc-obsidian .dc-num { color: #e2b543; }
.dc-obsidian .dc-word { color: #cbcfd6; }
.dc-obsidian .dc-name { color: #aeb4bd; }
.dc-obsidian .dc-detail { background: #14161b; }
.dc-obsidian .dc-label { color: #8a919c; }
.dc-obsidian .dc-total { color: #e2b543; }
.dc-obsidian .dc-split { background-image: linear-gradient(to right, transparent 10%, #e2b543 50%, transparent 90%); }
.dc-obsidian .dc-tip { color: #6d747f; }
/* 樱粉 */
.dc-sakura .dc-outline { background: linear-gradient(45deg, #fff6f8, #ffd3de); }
.dc-sakura .dc-num { color: #f06f9a; }
.dc-sakura .dc-word { color: #a5637a; }
.dc-sakura .dc-detail { background: #fff; }
.dc-sakura .dc-total { color: #e05c86; }
.dc-sakura .dc-split { background-image: linear-gradient(to right, transparent 10%, #ffc0d0 50%, transparent 90%); }
/* 星光 */
.dc-starlight .dc-outline { background: linear-gradient(45deg, #10162e, #233056); }
.dc-starlight .dc-num { color: #8fb4ff; }
.dc-starlight .dc-word { color: #c4d0ee; }
.dc-starlight .dc-name { color: #aebad6; }
.dc-starlight .dc-detail { background: #0c1020; }
.dc-starlight .dc-label { color: #7f8bb0; }
.dc-starlight .dc-total { color: #8fb4ff; }
.dc-starlight .dc-split { background-image: linear-gradient(to right, transparent 10%, #8fb4ff 50%, transparent 90%); }
.dc-starlight .dc-outline::after { content: ""; position: absolute; inset: 0; border-radius: 25px; background-image: radial-gradient(1.5px 1.5px at 22% 32%, #fff, transparent), radial-gradient(1.5px 1.5px at 70% 18%, #fff, transparent), radial-gradient(1.5px 1.5px at 84% 62%, #fff, transparent), radial-gradient(1.5px 1.5px at 36% 76%, #fff, transparent), radial-gradient(1.5px 1.5px at 58% 50%, rgba(255,255,255,0.7), transparent); opacity: 0.85; pointer-events: none; }
</style>
