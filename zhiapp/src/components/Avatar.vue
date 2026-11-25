<script setup>
import { ref, watch } from "vue";
import { media } from "../store/media.js";
import Icon from "./Icon.vue";

// 头像：有图显示图，否则显示姓氏首字占位
const props = defineProps({
  avatarKey: { type: String, default: null },
  name: { type: String, default: "" },
  size: { type: [Number, String], default: 56 },
  frame: { type: String, default: "" } // 头像框图片id：01/02/03（public/img/{id}.png）
});

const url = ref(null);
let objUrl = null;

// 光环框（经典 ring）用 CSS 光环；01/02/03 为图片框
const RING_IDS = ["gold", "silver", "aurora"];
const isRingFrame = () => RING_IDS.includes(props.frame);
const frameUrl = () =>
  props.frame && !isRingFrame()
    ? (import.meta.env.BASE_URL || "./") + "img/" + props.frame + ".png"
    : "";

const initial = () => (props.name || "?").trim().charAt(0).toUpperCase();

watch(
  () => props.avatarKey,
  async (k) => {
    if (objUrl) URL.revokeObjectURL(objUrl);
    objUrl = null;
    url.value = null;
    if (!k) return;
    try {
      objUrl = await media.url(k);
      url.value = objUrl;
    } catch (e) {}
  },
  { immediate: true }
);
</script>

<template>
  <span
    class="avatar"
    :class="isRingFrame() ? 'avatar-ring-' + props.frame : ''"
    :style="{
      width: size + 'px',
      height: size + 'px',
      fontSize: Math.round(size * 0.42) + 'px'
    }"
  >
    <img v-if="url" :src="url" alt="头像" class="avatar-img" />
    <template v-else>
      <Icon v-if="!name" name="user" :size="Math.round(size * 0.52)" />
      <span v-else class="avatar-char">{{ initial() }}</span>
    </template>
    <img v-if="frameUrl()" :src="frameUrl()" alt="" class="avatar-frame" />
    <span v-if="$slots.badge" class="avatar-badge">
      <slot name="badge" />
    </span>
  </span>
</template>

<style scoped>
.avatar {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  border-radius: 50%;
  background: linear-gradient(150deg, #d9e8df, #b6d0c2);
  color: var(--accent-ink);
  font-weight: 700;
  overflow: visible;
  user-select: none;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.avatar-badge {
  position: absolute;
  right: -2px;
  bottom: -2px;
  line-height: 0;
  z-index: 3;
}

/* 头像框图片：套在头像外（195%，圆环外径≈头像139%，居中；不受全局 img max-width 限制） */
.avatar-frame {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 195%;
  height: 195%;
  max-width: none;
  max-height: none;
  object-fit: contain;
  object-position: center;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 2;
}

/* 经典光环框（CSS ring） */
.avatar-ring-gold { box-shadow: 0 0 0 3px #fff, 0 0 0 6px #e2ab25, 0 6px 16px rgba(0,0,0,0.18); }
.avatar-ring-silver { box-shadow: 0 0 0 3px #fff, 0 0 0 6px #b8c2cf, 0 6px 16px rgba(0,0,0,0.14); }
.avatar-ring-aurora { box-shadow: 0 0 0 3px #fff, 0 0 0 6px #6a8cff, 0 6px 18px rgba(106,140,255,0.3); animation: av-aurora 3s ease-in-out infinite; }
@keyframes av-aurora {
  0%, 100% { box-shadow: 0 0 0 3px #fff, 0 0 0 6px #6a8cff, 0 6px 18px rgba(106,140,255,0.3); }
  50% { box-shadow: 0 0 0 3px #fff, 0 0 0 6px #b06cff, 0 6px 18px rgba(176,108,255,0.34); }
}
</style>
