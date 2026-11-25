<script setup>
import { ref, computed } from "vue";
import { state, store } from "../../store/state.js";
import Icon from "../Icon.vue";
import ConfirmDialog from "../ConfirmDialog.vue";
import { toast } from "../../ui.js";
import { fmtDateTime } from "../../utils.js";

// 专注记录（正计时/倒计时/番茄钟产生），独立于考试记录
const items = computed(() => state.focus);
const TYPE_LABEL = { stopwatch: "正计时", countdown: "倒计时", pomodoro: "番茄钟" };

const summary = computed(() => {
  const min = items.value.reduce((s, f) => s + f.minutes, 0);
  return { count: items.value.length, min: Math.round(min) };
});

// 最近 7 天柱状
const weekBars = computed(() => {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const min = items.value.filter((f) => f.date === key).reduce((s, f) => s + f.minutes, 0);
    days.push({ key, label: `${d.getMonth() + 1}/${d.getDate()}`, min });
  }
  const max = Math.max(60, ...days.map((x) => x.min));
  return { days, max };
});

const delId = ref(null);
const showClear = ref(false);

function doDel() {
  if (delId.value) store.removeFocus(delId.value);
  delId.value = null;
  toast("已删除");
}

function doClear() {
  store.clearFocus();
  showClear.value = false;
  toast("已清空专注记录");
}
</script>

<template>
  <div class="comp">
    <div class="comp-head">
      <div>
        <h2 class="comp-title">专注记录</h2>
        <p class="comp-sub">时钟里的正计时 / 倒计时 / 番茄钟所记录，每天累计</p>
      </div>
      <div class="sum-chips">
        <span class="chip chip-accent">{{ summary.count }} 次</span>
        <span class="chip muted">共 {{ summary.min }} 分钟</span>
      </div>
    </div>

    <!-- 周柱状 -->
    <div class="week-card">
      <div class="bars">
        <div v-for="b in weekBars.days" :key="b.key" class="bar-col">
          <div class="bar-track">
            <div
              class="bar-fill"
              :class="{ today: b.key === weekBars.days[6].key && b.min > 0 }"
              :style="{ height: Math.max(b.min ? 8 : 2, (b.min / weekBars.max) * 100) + '%' }"
            ></div>
          </div>
          <span class="bar-label">{{ b.label }}</span>
          <span class="bar-min" v-if="b.min">{{ Math.round(b.min) }}m</span>
        </div>
      </div>
    </div>

    <div v-if="!items.length" class="empty-state">
      <Icon name="timer" :size="28" />
      <p>暂无专注记录。到「时钟 → 正计时/番茄钟」开始第一次专注吧。</p>
    </div>

    <ul v-else class="list">
      <li v-for="f in items" :key="f.id" class="row">
        <span class="type-ic" :class="`tp-${f.type}`">
          <Icon :name="f.type === 'pomodoro' ? 'note' : f.type === 'countdown' ? 'alarm' : 'timer'" :size="16" />
        </span>
        <div class="row-main">
          <span class="row-title">
            {{ f.activity || TYPE_LABEL[f.type] || "专注" }}
            <em class="type-tag">{{ TYPE_LABEL[f.type] || "" }}</em>
          </span>
          <span class="row-sub tnum">{{ fmtDateTime(f.startAt) }}</span>
        </div>
        <span class="minutes tnum">{{ Math.round(f.minutes) }} 分钟</span>
        <button class="icon-btn danger" aria-label="删除" @click="delId = f.id">
          <Icon name="trash" :size="16" />
        </button>
      </li>
    </ul>

    <div v-if="items.length" class="comp-foot">
      <button class="btn btn-danger-ghost btn-sm" @click="showClear = true">
        <Icon name="trash" :size="14" /> 清空专注记录
      </button>
    </div>

    <ConfirmDialog
      :show="!!delId"
      title="删除专注记录"
      message="确定删除这条专注记录吗？"
      confirm-text="删除"
      danger
      @cancel="delId = null"
      @confirm="doDel"
    />
    <ConfirmDialog
      :show="showClear"
      title="清空专注记录"
      message="将删除全部专注记录"
      detail="二次确认：删除后不可恢复。"
      confirm-text="确认清空"
      danger
      @cancel="showClear = false"
      @confirm="doClear"
    />
  </div>
</template>

<style scoped>
.comp {
  display: flex;
  flex-direction: column;
  gap: 14px;
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

.sum-chips {
  display: flex;
  gap: 8px;
}

.week-card {
  background: linear-gradient(160deg, #1d2621, #151a17);
  border-radius: 20px;
  padding: 16px 14px 10px;
}

.bars {
  display: flex;
  gap: 8px;
  height: 110px;
  align-items: flex-end;
}

.bar-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  height: 100%;
  justify-content: flex-end;
}

.bar-track {
  width: 100%;
  max-width: 34px;
  height: 74px;
  display: flex;
  align-items: flex-end;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  overflow: hidden;
}

.bar-fill {
  width: 100%;
  border-radius: 8px;
  background: linear-gradient(180deg, #a9e3c5, #58a583);
  transition: height 0.4s var(--ease-out);
}

.bar-fill.today {
  background: linear-gradient(180deg, #ffe2a0, #e8b44c);
}

.bar-label {
  font-size: 10.5px;
  color: rgba(255, 255, 255, 0.55);
}

.bar-min {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.75);
  font-variant-numeric: tabular-nums;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 34px 10px;
  color: var(--ink-3);
  border: 1px dashed var(--line);
  border-radius: 18px;
  text-align: center;
  font-size: 13.5px;
}

.list {
  display: flex;
  flex-direction: column;
}

.row {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 12px 8px;
  border-bottom: 1px solid var(--line-2);
  animation: rise-in 0.32s var(--ease-out) both;
}

.row:last-child {
  border-bottom: 0;
}

.type-ic {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
}

.tp-stopwatch {
  background: var(--accent-tint);
  color: var(--accent);
}

.tp-countdown {
  background: var(--warn-tint);
  color: var(--warn);
}

.tp-pomodoro {
  background: #f3e3f5;
  color: #7a3d83;
}

.row-main {
  flex: 1;
  min-width: 0;
}

.row-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 650;
  font-size: 14.5px;
  flex-wrap: wrap;
}

.type-tag {
  font-style: normal;
  font-size: 10.5px;
  background: var(--bg-2);
  color: var(--ink-2);
  padding: 1px 8px;
  border-radius: 999px;
}

.row-sub {
  font-size: 12px;
  color: var(--ink-3);
}

.minutes {
  flex: none;
  font-weight: 750;
  font-size: 14px;
  color: var(--accent);
}

.icon-btn.danger:hover {
  color: var(--danger);
  background: var(--danger-tint);
}

.comp-foot {
  display: flex;
  justify-content: flex-end;
}
</style>
