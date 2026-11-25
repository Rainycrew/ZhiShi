<script setup>
import { ref, computed } from "vue";
import { state } from "../../store/state.js";
import Icon from "../Icon.vue";
import Modal from "../Modal.vue";
import { ACHIEVEMENTS, TIER_NAME } from "../../lib/achievements.js";
import { exportStatsCard } from "../../lib/exportImage.js";
import { toast } from "../../ui.js";
import { fmtDateTime } from "../../utils.js";

const all = ACHIEVEMENTS;
const earnedCount = computed(() => Object.keys(state.achievements).length);
const earned = computed(() => all.filter((a) => state.achievements[a.id]));
const locked = computed(() => all.filter((a) => !state.achievements[a.id]));

const tierClass = (t) => `t${t}`;
const showDetail = ref(null);

async function exportCard() {
  try {
    const how = await exportStatsCard();
    if (how === "share") toast("已调起系统分享");
    else if (how === "download") toast("成就卡已生成并保存");
    else if (how === "cancel") toast("已取消");
  } catch (e) {
    console.error("成就卡生成失败", e);
    toast("生成失败：" + (e && e.message ? e.message : String(e)), "err", 6000);
  }
}

function openDetail(a) {
  showDetail.value = a;
}
</script>

<template>
  <div class="comp">
    <div class="comp-head">
      <div>
        <h2 class="comp-title">勋章墙</h2>
        <p class="comp-sub">达成条件自动点亮；可查看全部勋章与解锁要求</p>
      </div>
      <button class="btn btn-primary btn-sm" @click="exportCard">
        <Icon name="image" :size="15" /> 导出成就卡
      </button>
    </div>

    <div class="stat-line">
      <span class="chip chip-accent">{{ earnedCount }} / {{ all.length }} 已解锁</span>
      <span class="hint">连续打卡、晨间/深夜打卡、单次专注 2 小时… 点击查看要求</span>
    </div>

    <!-- 已解锁 -->
    <div v-if="earned.length" class="sec-label">
      <Icon name="medal" :size="14" /> 已解锁
    </div>
    <div class="badge-grid">
      <button
        v-for="a in earned"
        :key="a.id"
        class="badge earned"
        :class="tierClass(a.tier)"
        @click="openDetail(a)"
      >
        <span class="badge-ic"><Icon :name="a.icon" :size="22" /></span>
        <span class="badge-name">{{ a.name }}</span>
        <span class="badge-tier">{{ TIER_NAME[a.tier] }}级</span>
      </button>
    </div>

    <!-- 未解锁 -->
    <div class="sec-label muted-sec">
      <Icon name="lock" :size="14" /> 未解锁 · 点击查看要求
    </div>
    <div class="lock-list">
      <button v-for="a in locked" :key="a.id" class="lock-row" @click="openDetail(a)">
        <span class="lock-ic"><Icon :name="a.icon" :size="16" /></span>
        <span class="lock-main">
          <span class="lock-name">{{ a.name }}</span>
          <span class="lock-req">{{ a.req }}</span>
        </span>
        <Icon name="chevR" :size="14" class="lock-go" />
      </button>
    </div>

    <!-- 详情 -->
    <Modal :show="!!showDetail" :title="showDetail ? showDetail.name : ''" @close="showDetail = null">
      <div v-if="showDetail" class="detail">
        <div class="detail-ic" :class="tierClass(showDetail.tier)">
          <Icon :name="showDetail.icon" :size="40" />
        </div>
        <p class="detail-req">{{ showDetail.req }}</p>
        <p v-if="state.achievements[showDetail.id]" class="detail-date">
          解锁于 {{ fmtDateTime(state.achievements[showDetail.id]) }}
        </p>
        <p v-else class="detail-date muted">尚未解锁</p>
      </div>
      <div class="modal-foot">
        <button class="btn btn-primary" @click="showDetail = null">知道了</button>
      </div>
    </Modal>
  </div>
</template>

<style scoped>
.comp {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.comp-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
}

.comp-title {
  font-size: 18px;
  font-weight: 800;
}

.comp-sub {
  font-size: 12.5px;
  color: var(--ink-3);
  margin-top: 3px;
}

.stat-line {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.sec-label {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12.5px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--accent);
  margin-top: 8px;
}

.muted-sec {
  color: var(--ink-3);
}

.badge-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(108px, 1fr));
  gap: 10px;
}

.badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  padding: 16px 6px 12px;
  border-radius: 18px;
  border: 1px solid var(--line);
  background: var(--surface);
  transition: transform 0.2s var(--ease-out), box-shadow 0.2s var(--ease-out);
}

.badge:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: var(--shadow-1);
}

.badge-ic {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.badge-name {
  font-size: 12px;
  font-weight: 700;
  text-align: center;
  line-height: 1.3;
}

.badge-tier {
  font-size: 10px;
  color: var(--ink-3);
  font-weight: 650;
}

.badge.t1 .badge-ic {
  background: #efe6d4;
  color: #8a6a2f;
}

.badge.t2 .badge-ic {
  background: #e9edf3;
  color: #52698a;
}

.badge.t3 .badge-ic {
  background: #faf0cc;
  color: #c08a13;
}

.badge.t4 .badge-ic {
  background: linear-gradient(150deg, #ffe9c2, #f2cf7e);
  color: #6d4a06;
}

.lock-list {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.lock-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 14px;
  border: 1px solid var(--line);
  background: var(--surface);
  text-align: left;
  transition: transform 0.16s var(--ease-out);
}

.lock-row:hover {
  transform: translateX(3px);
}

.lock-ic {
  width: 36px;
  height: 36px;
  border-radius: 11px;
  background: var(--bg-2);
  color: var(--ink-3);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
}

.lock-main {
  flex: 1;
  min-width: 0;
}

.lock-name {
  display: block;
  font-weight: 650;
  font-size: 14px;
}

.lock-req {
  font-size: 12px;
  color: var(--ink-3);
}

.lock-go {
  color: var(--ink-3);
  flex: none;
}

.detail {
  padding: 14px 22px 22px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  text-align: center;
}

.detail-ic {
  width: 84px;
  height: 84px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.detail-ic.t1 {
  background: #efe6d4;
  color: #8a6a2f;
}

.detail-ic.t2 {
  background: #e9edf3;
  color: #52698a;
}

.detail-ic.t3 {
  background: #faf0cc;
  color: #c08a13;
}

.detail-ic.t4 {
  background: linear-gradient(150deg, #ffe9c2, #f2cf7e);
  color: #6d4a06;
}

.detail-req {
  font-size: 15px;
  line-height: 1.7;
  color: var(--ink-2);
}

.detail-date {
  font-size: 13px;
  color: var(--accent);
  font-weight: 600;
}
</style>
