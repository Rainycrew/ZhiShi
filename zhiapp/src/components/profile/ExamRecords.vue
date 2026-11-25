<script setup>
import { ref, computed } from "vue";
import { state, store } from "../../store/state.js";
import Icon from "../Icon.vue";
import ConfirmDialog from "../ConfirmDialog.vue";
import { toast } from "../../ui.js";
import { fmtDateTime, fmtMin } from "../../utils.js";

// 考试记录：列表形态，独立删除 + 二次确认，问题修复版
const records = computed(() => state.records);
const summary = computed(() => {
  const done = records.value.filter((r) => r.status === "done").length;
  const mins = records.value.reduce((s, r) => s + (r.durationMin || 0), 0);
  return { total: records.value.length, done, mins };
});

const delId = ref(null);
const showClear = ref(false);

function askDel(id) {
  delId.value = id;
}

function doDel() {
  if (delId.value) {
    store.removeRecord(delId.value);
    toast("记录已删除");
  }
  delId.value = null;
}

function doClear() {
  store.clearRecords();
  showClear.value = false;
  toast("已清空考试记录");
}

function kindText(k) {
  return k === "listening" ? "英语听力" : "普通考试";
}
</script>

<template>
  <div class="comp">
    <div class="comp-head">
      <div class="comp-title-wrap">
        <h2 class="comp-title">考试记录</h2>
        <p class="comp-sub">类型 / 时长 / 开始时间，完成后自动记录</p>
      </div>
      <div class="sum-chips">
        <span class="chip muted">共 {{ summary.total }} 场</span>
        <span class="chip chip-accent">完成 {{ summary.done }}</span>
        <span class="chip muted">累计 {{ summary.mins }} 分钟</span>
      </div>
    </div>

    <div v-if="!records.length" class="empty-state">
      <Icon name="exam" :size="28" />
      <p>还没有考试记录。完成一场考试后会自动写入这里。</p>
    </div>

    <ul v-else class="list">
      <li v-for="r in records" :key="r.id" class="row">
        <span class="kind-ic" :class="r.kind === 'listening' ? 'ic-listen' : 'ic-standard'">
          <Icon :name="r.kind === 'listening' ? 'listen' : 'exam'" :size="17" />
        </span>
        <div class="row-main">
          <span class="row-title">{{ r.examName }}</span>
          <span class="row-sub">
            {{ kindText(r.kind) }} · {{ fmtMin(r.durationMin) }} · 开始
            <span class="tnum">{{ fmtDateTime(r.startAt) }}</span>
          </span>
        </div>
        <span class="status" :class="r.status === 'done' ? 'ok' : 'exit'">
          {{ r.status === "done" ? "已完成" : "提前退出" }}
        </span>
        <button class="icon-btn danger" aria-label="删除记录" @click="askDel(r.id)">
          <Icon name="trash" :size="16" />
        </button>
      </li>
    </ul>

    <div v-if="records.length" class="comp-foot">
      <button class="btn btn-danger-ghost btn-sm" @click="showClear = true">
        <Icon name="trash" :size="14" /> 清空全部记录
      </button>
    </div>

    <ConfirmDialog
      :show="!!delId"
      title="删除考试记录"
      message="确定删除这条考试记录吗？"
      detail="删除后不可恢复。"
      confirm-text="删除"
      danger
      @cancel="delId = null"
      @confirm="doDel"
    />

    <ConfirmDialog
      :show="showClear"
      title="清空考试记录"
      :message="`将删除全部 ${records.length} 条记录`"
      detail="请二次确认：此操作不可恢复。"
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
  align-items: flex-start;
  justify-content: space-between;
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
  flex-wrap: wrap;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 34px 10px;
  color: var(--ink-3);
  font-size: 13.5px;
  border: 1px dashed var(--line);
  border-radius: 18px;
  text-align: center;
}

.list {
  display: flex;
  flex-direction: column;
}

.row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 13px 10px;
  border-bottom: 1px solid var(--line-2);
  animation: rise-in 0.35s var(--ease-out) both;
}

.row:last-child {
  border-bottom: 0;
}

.kind-ic {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
}

.ic-standard {
  background: var(--accent-tint);
  color: var(--accent);
}

.ic-listen {
  background: #e7eefb;
  color: #31527e;
}

.row-main {
  flex: 1;
  min-width: 0;
}

.row-title {
  display: block;
  font-weight: 650;
  font-size: 14.5px;
}

.row-sub {
  font-size: 12.5px;
  color: var(--ink-3);
}

.status {
  flex: none;
  font-size: 12px;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 999px;
}

.status.ok {
  color: var(--ok);
  background: var(--ok-tint);
}

.status.exit {
  color: var(--warn);
  background: var(--warn-tint);
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
