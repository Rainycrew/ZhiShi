<script setup>
import { ref, computed, onMounted } from "vue";
import { state } from "../store/state.js";
import { PANEL_URL, DEV_CONTACT } from "../config.js";
import { toast } from "../ui.js";
import { tapDev } from "../store/dev.js";
import { computeStats } from "../lib/achievements.js";
import { usePageMotion } from "../composables/useMotion.js";
import Icon from "../components/Icon.vue";
import Avatar from "../components/Avatar.vue";
import VMark from "../components/VMark.vue";
import ExamRecords from "../components/profile/ExamRecords.vue";
import FocusSection from "../components/profile/FocusSection.vue";
import HonorsSection from "../components/profile/HonorsSection.vue";
import BadgesSection from "../components/profile/BadgesSection.vue";
import DiarySection from "../components/profile/DiarySection.vue";
import DataSection from "../components/profile/DataSection.vue";

const tabs = [
  { id: "records", label: "考试记录", icon: "exam" },
  { id: "focus", label: "专注", icon: "timer" },
  { id: "honors", label: "证书奖状", icon: "award" },
  { id: "badges", label: "勋章", icon: "medal" },
  { id: "diary", label: "心情", icon: "note" },
  { id: "data", label: "设置", icon: "settings" }
];

const active = ref("records");
const profile = computed(() => state.profile);
const stats = computed(() => computeStats());

function switchTab(id) {
  active.value = id;
}

// 点「设置」按钮即进入设置页；同时累计 5 下触发开发者解锁
function onSettings() {
  active.value = "data";
  tapDev();
}

function goPanel() {
  const url = profile.value.panelUrl || PANEL_URL;
  if (!url) {
    toast("尚未配置数据看板地址（开发者权限）", "err");
    active.value = "data";
    return;
  }
  window.open(url, "_blank", "noopener");
}

onMounted(() => {
  const q = new URLSearchParams(location.hash.split("?")[1] || "").get("tab");
  const map = { records: "records", focus: "focus", certs: "honors", awards: "honors", honors: "honors", badges: "badges", diary: "diary", data: "data", settings: "data" };
  if (q && map[q]) active.value = map[q];
});

const viewMap = {
  records: ExamRecords,
  focus: FocusSection,
  honors: HonorsSection,
  badges: BadgesSection,
  diary: DiarySection,
  data: DataSection
};

const root = ref(null);
usePageMotion(root);
</script>

<template>
  <div ref="root">
    <!-- 身份卡 -->
    <section class="id-card card" data-reveal>
      <Avatar :avatar-key="profile.avatarKey" :name="profile.name" :size="92" :frame="state.avatarframe.equipped || ''">
        <template v-if="profile.vEnabled" #badge>
          <span class="avatar-v-ring"><VMark :size="26" /></span>
        </template>
      </Avatar>

      <div class="id-main">
        <h1 class="id-name">{{ profile.name || "未设置姓名" }}</h1>
        <div class="id-title-row">
          <span v-if="profile.vEnabled && profile.title" class="title-pill">
            <VMark :size="17" />
            <span class="title-text">{{ profile.title }}</span>
          </span>
          <span v-else class="id-sub">本地数据 · 无需联网</span>
        </div>
        <div class="id-stats">
          <button class="istat" @click="active = 'records'">
            <b class="tnum" :data-count="stats.examDone">{{ stats.examDone }}</b><span>完成考试</span>
          </button>
          <button class="istat" @click="active = 'focus'">
            <b class="tnum" :data-count="Math.round(stats.totalFocusMin)">{{ Math.round(stats.totalFocusMin) }}</b><span>专注分钟</span>
          </button>
          <button class="istat" @click="active = 'badges'">
            <b class="tnum" :data-count="Object.keys(state.achievements).length">{{ Object.keys(state.achievements).length }}</b><span>勋章</span>
          </button>
          <button class="istat" @click="active = 'data'">
            <b class="tnum" :data-count="stats.checkinTotal">{{ stats.checkinTotal }}</b><span>打卡天数</span>
          </button>
        </div>
      </div>

      <div class="id-actions">
        <button class="btn btn-ghost btn-sm" @click="onSettings">
          <Icon name="settings" :size="14" /> 设置
        </button>
        <button class="btn btn-primary btn-sm" @click="goPanel">
          <Icon name="panel" :size="14" /> 数据看板
        </button>
      </div>
    </section>

    <!-- 分段导航 -->
    <nav class="tabbar">
      <button
        v-for="t in tabs"
        :key="t.id"
        class="tabbar-btn"
        :class="{ on: active === t.id }"
        @click="switchTab(t.id)"
      >
        <Icon :name="t.icon" :size="16" />
        <span>{{ t.label }}</span>
      </button>
    </nav>

    <!-- 分区容器 -->
    <section class="tab-panel card rise">
      <Transition name="fade-slide" mode="out-in">
        <component :is="viewMap[active]" :key="active" />
      </Transition>
    </section>
  </div>
</template>

<style scoped>
/* 身份卡 */
.id-card {
  display: flex;
  align-items: center;
  gap: clamp(16px, 2.8vw, 26px);
  padding: clamp(18px, 3vw, 28px);
  flex-wrap: wrap;
}

.avatar-v-ring {
  width: 30px;
  height: 30px;
  border-radius: 10px;
  background: #fff;
  padding: 2px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.16);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.id-main {
  flex: 1;
  min-width: 240px;
}

.id-name {
  font-size: clamp(22px, 3vw, 28px);
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 10px;
  overflow-wrap: anywhere;
}

.id-title-row {
  margin-top: 8px;
}

/* 称号：黄V 独立在左侧，不与文字融为一体 */
.title-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--surface-2);
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 4px 12px 4px 6px;
}

.title-text {
  font-size: 13px;
  font-weight: 700;
  color: var(--ink-2);
}

.id-sub {
  font-size: 13px;
  color: var(--ink-3);
}

.id-stats {
  display: flex;
  gap: 6px;
  margin-top: 16px;
  flex-wrap: wrap;
}

.istat {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 7px 16px 7px 0;
  border-right: 1px solid var(--line);
  margin-right: 8px;
  transition: transform 0.15s var(--ease-out);
}

.istat:hover {
  transform: translateY(-1px);
}

.istat b {
  font-size: 18px;
  font-weight: 800;
  line-height: 1.2;
}

.istat span {
  font-size: 11px;
  color: var(--ink-3);
}

.id-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* 分段：允许换行，任何设备都无需横向滑动 */
.tabbar {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin: 16px 0 14px;
}

.tabbar-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 15px;
  border-radius: 13px;
  background: var(--surface);
  border: 1px solid var(--line);
  color: var(--ink-2);
  font-size: 13.5px;
  font-weight: 650;
  white-space: nowrap;
  transition: all 0.18s var(--ease-out);
}

.tabbar-btn:active {
  transform: scale(0.97);
}

.tabbar-btn.on {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
  box-shadow: 0 8px 18px -10px rgba(23, 74, 60, 0.6);
}

/* 面板 */
.tab-panel {
  padding: clamp(16px, 2.6vw, 26px);
  min-height: 260px;
}

@media (max-width: 560px) {
  .id-card {
    padding: 14px 12px;
    gap: 12px;
  }

  .id-card > .avatar,
  .id-card :deep(.avatar) {
    width: 68px !important;
    height: 68px !important;
    font-size: 24px !important;
  }

  .id-name {
    font-size: 19px;
  }

  .title-pill {
    padding: 3px 10px 3px 4px;
  }

  .istat {
    padding: 5px 10px 5px 0;
    margin-right: 4px;
  }

  .istat b {
    font-size: 15px;
  }

  .istat span {
    font-size: 10px;
  }

  .tabbar-btn {
    padding: 8px 11px;
    font-size: 12.5px;
  }

  .tab-panel {
    padding: 13px 12px;
  }
}
</style>
