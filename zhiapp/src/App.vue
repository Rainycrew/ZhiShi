<script setup>
import { computed, ref, watch, onMounted, onBeforeUnmount } from "vue";
import route, { navigate } from "./router.js";
import { state } from "./store/state.js";
import Icon from "./components/Icon.vue";
import Avatar from "./components/Avatar.vue";
import Toast from "./components/Toast.vue";
import UnlockToast from "./components/UnlockToast.vue";
import GlassSurface from "./components/GlassSurface.vue";
import { themeById } from "./lib/skins.js";

import HomeView from "./views/HomeView.vue";
import ExamCenterView from "./views/ExamCenterView.vue";
import ExamEditView from "./views/ExamEditView.vue";
import ExamRunView from "./views/ExamRunView.vue";
import ClockView from "./views/ClockView.vue";
import PlansView from "./views/PlansView.vue";
import ProfileView from "./views/ProfileView.vue";
import ShopView from "./views/ShopView.vue";

const view = computed(() => {
  switch (route.name) {
    case "exam":
      return ExamCenterView;
    case "exam-edit":
      return ExamEditView;
    case "exam-run":
      return ExamRunView;
    case "clock":
      return ClockView;
    case "shop":
      return ShopView;
    case "plan":
      return PlansView;
    case "profile":
      return ProfileView;
    default:
      return HomeView;
  }
});

const plain = computed(
  () => route.name === "exam-run" || (route.name === "clock" && !isWide.value)
);
const isWide = ref(false);
const scrollEl = ref(null);

const navItems = [
  { to: "home", label: "首页", icon: "home" },
  { to: "exam", label: "考试", icon: "exam" },
  { to: "clock", label: "时钟", icon: "clock" },
  { to: "plan", label: "计划", icon: "panel" },
  { to: "shop", label: "商城", icon: "bag" },
  { to: "profile", label: "我的", icon: "user" }
];

// 底部/侧栏图标：public/img 下拼音命名的 PNG
const NAV_BASE = (import.meta.env.BASE_URL || "./") + "img/";
const NAV_ICONS = {
  home: NAV_BASE + "shouye1.png",
  exam: NAV_BASE + "kaoshi.png",
  clock: NAV_BASE + "shizhong.png",
  plan: NAV_BASE + "jihua.png",
  shop: NAV_BASE + "shop.png",
  profile: NAV_BASE + "wode.png"
};

function activeFor(item) {
  if (item.to === "exam") return ["exam", "exam-edit"].includes(route.name);
  return route.name === item.to;
}

// 主题色皮肤：把已装备主题的 CSS 变量应用到应用根节点
const themeVars = computed(() => {
  const t = themeById(state.theme.equipped);
  return t ? t.vars : {};
});

function onResize() {
  isWide.value = window.innerWidth >= 900;
}

watch(
  () => route.name + ":" + route.params.id,
  () => {
    if (scrollEl.value) scrollEl.value.scrollTop = 0;
  }
);

onMounted(() => {
  onResize();
  window.addEventListener("resize", onResize);
});
onBeforeUnmount(() => window.removeEventListener("resize", onResize));
</script>

<template>
  <div class="app-root" :style="themeVars">
    <!-- 普通页面：导航 + 视口 -->
    <div v-if="!plain" class="shell" :class="{ 'is-rail': isWide }">
      <header v-if="isWide" class="rail">
        <nav class="rail-nav">
          <button
            v-for="item in navItems"
            :key="item.to"
            class="rail-item"
            :class="{ on: activeFor(item) }"
            @click="navigate(item.to)"
          >
            <img v-if="NAV_ICONS[item.to]" :src="NAV_ICONS[item.to]" alt="" class="nav-ic rail-ic" />
            <Icon v-else :name="item.icon" :size="20" class="nav-ic rail-ic" />
            <span>{{ item.label }}</span>
          </button>
        </nav>
        <div class="rail-foot">
          <button class="rail-avatar" @click="navigate('profile')">
            <Avatar :avatar-key="state.profile.avatarKey" :name="state.profile.name" :size="40" :frame="state.avatarframe.equipped || ''" />
          </button>
        </div>
      </header>

      <main ref="scrollEl" class="viewport">
        <div class="viewport-inner">
          <Transition name="page" mode="out-in">
            <component :is="view" :key="route.name + ':' + route.params.id" />
          </Transition>
        </div>
      </main>

      <nav v-if="!isWide" class="dock" :class="{ glass: state.glass.equipped, fixed: state.glass.equipped }">
        <GlassSurface
          v-if="state.glass.equipped"
          class="dock-glass-bg"
          :width="'100%'"
          :height="64"
          :border-radius="26"
          :border-width="0.05"
          :brightness="55"
          :opacity="0.9"
          :blur="5"
          :displace="0"
          :background-opacity="0.12"
          :saturation="0.6"
          :distortion-scale="-180"
          :red-offset="0"
          :green-offset="8"
          :blue-offset="16"
          mix-blend-mode="screen"
          :style="{ position: 'absolute', inset: 0, border: 'none' }"
        />
        <button
          v-for="item in navItems"
          :key="item.to"
          class="dock-item"
          :class="{ on: activeFor(item) }"
          @click="navigate(item.to)"
        >
          <img v-if="NAV_ICONS[item.to]" :src="NAV_ICONS[item.to]" alt="" class="nav-ic dock-ic" />
          <Icon v-else :name="item.icon" :size="23" class="nav-ic dock-ic" />
          <span>{{ item.label }}</span>
        </button>
      </nav>
    </div>

    <!-- 考试进行页：独占全屏 -->
    <div v-else class="plain-root">
      <Transition name="page" mode="out-in">
        <component :is="view" :key="route.name + ':' + route.params.id" />
      </Transition>
    </div>

    <Toast />
    <UnlockToast />
  </div>
</template>

<style scoped>
.app-root {
  height: 100dvh;
  overflow: hidden;
  background: var(--bg);
}

/* ============ 宽屏左侧导航 ============ */
.rail {
  grid-row: 1;
  grid-column: 1;
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 22px 16px;
  border-right: 1px solid var(--line);
  background: var(--surface);
}

.rail-brand {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 2px 8px 14px;
  border-bottom: 1px solid var(--line-2);
}

.brand-mark {
  width: 42px;
  height: 42px;
  border-radius: 13px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--accent);
  color: #f6f5ef;
  flex: none;
}

.brand-name {
  font-weight: 750;
  font-size: 16.5px;
  letter-spacing: 0.02em;
}

.brand-tag {
  font-size: 11px;
  color: var(--ink-3);
  letter-spacing: 0.04em;
}

.rail-nav {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.rail-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 14px;
  color: var(--ink-2);
  font-size: 15px;
  font-weight: 600;
  text-align: left;
  transition: background-color 0.18s, color 0.18s;
}

.rail-item:hover {
  background: var(--surface-2);
}

.rail-item.on {
  background: var(--accent-tint);
  color: var(--accent-ink);
}

.rail-foot {
  margin-top: auto;
  padding: 4px 8px;
}

.rail-avatar {
  line-height: 0;
}

/* ============ 底部 Dock ============ */
.dock {
  grid-row: 2;
  grid-column: 1 / -1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-around;
  gap: 4px;
  padding: 6px 10px calc(6px + var(--safe-b));
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(14px);
  border-top: 1px solid var(--line);
  z-index: 20;
}

/* 毛玻璃皮肤：用 GlassSurface 组件渲染磨砂背景（购买后装备生效） */
.dock.glass {
  background: transparent;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  border-top-color: transparent;
}
/* 启用毛玻璃时，Dock 悬浮在内容之上，磨砂真正透出滚动内容 */
.dock.glass.fixed {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
}
.dock-glass-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.dock.glass .dock-item {
  position: relative;
  z-index: 2;
  color: #2b2f29;
}
.dock.glass .dock-item.on {
  color: var(--accent);
}

.dock-item {
  flex: 1;
  max-width: 150px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 6px 2px;
  border-radius: 14px;
  color: var(--ink-3);
  font-size: 11px;
  font-weight: 600;
  transition: color 0.18s;
}

.dock-item.on {
  color: var(--accent);
}

/* PNG 导航图标 */
.nav-ic {
  object-fit: contain;
  filter: grayscale(1);
  opacity: 0.55;
  transition: filter 0.22s var(--ease-out), opacity 0.22s var(--ease-out),
    transform 0.22s var(--ease-out);
}

.rail-ic {
  width: 20px;
  height: 20px;
}

.dock-ic {
  width: 23px;
  height: 23px;
}

.dock-item.on .dock-ic,
.rail-item.on .rail-ic {
  filter: none;
  opacity: 1;
  transform: scale(1.15);
}

/* ============ 全屏页 ============ */
.plain-root {
  height: 100%;
  min-height: 0;
}
</style>
