<script setup>
import { ref, computed, watch } from "vue";
import route, { navigate } from "../router.js";
import { state, store, createTemplate } from "../store/state.js";
import Icon from "../components/Icon.vue";
import SoundPicker from "../components/SoundPicker.vue";
import ListeningUpload from "../components/ListeningUpload.vue";
import ConfirmDialog from "../components/ConfirmDialog.vue";
import { toast } from "../ui.js";
import { fmtMin } from "../utils.js";
import { uid } from "../utils.js";

// 打开/新建模板：仅“保存”时才写入模板列表，进入页面不自动创建
const tplId = computed(() => route.params.id || "");
const isNew = computed(
  () => tplId.value === "new" || !state.templates.some((t) => t.id === tplId.value)
);
const draftKind = computed(() =>
  route.query.kind === "listening" ? "listening" : "standard"
);

const draft = ref(null);
const dirty = ref(false);

watch(
  () => (isNew.value ? `new:${draftKind.value}` : tplId.value),
  () => {
    if (isNew.value) {
      if (!draft.value || draft.value.kind !== draftKind.value) {
        draft.value = createTemplate(draftKind.value);
      }
    } else {
      const t = state.templates.find((x) => x.id === tplId.value);
      if (t) draft.value = JSON.parse(JSON.stringify(t));
    }
  },
  { immediate: true }
);

// 声音选择
const pickerFor = ref(null); // 正在编辑的节点
const showPicker = computed(() => !!pickerFor.value);

function nodeSummary(sound) {
  if (!sound) return "静音";
  if (sound.mode === "builtin") {
    const map = { begin: "内置 · 开考", warn: "内置 · 提醒", end: "内置 · 结束", ding: "内置 · 单音" };
    return map[sound.tone] || "内置音";
  }
  if (sound.mode === "folder") return `audio/${sound.file}`;
  if (sound.mode === "library") return sound.name || "音频库";
  return "未知";
}

function onPickSound(value) {
  if (pickerFor.value && draft.value) {
    const node = draft.value.nodes.find((n) => n.id === pickerFor.value);
    if (node) node.sound = value;
    dirty.value = true;
  }
  pickerFor.value = null;
}

// 节点时间
const typeOps = [
  { v: "start", label: "开考时（0:00）" },
  { v: "beforeEnd", label: "结束前 N 分钟" },
  { v: "end", label: "结束时" },
  { v: "atSec", label: "自定义时间点" }
];

function secToParts(sec) {
  sec = Number(sec) || 0;
  return { h: Math.floor(sec / 3600), m: Math.floor((sec % 3600) / 60), s: sec % 60 };
}

function partsToSec(h, m, s) {
  return (Number(h) || 0) * 3600 + (Number(m) || 0) * 60 + (Number(s) || 0);
}

function nodeParts(n) {
  return secToParts(n.value);
}

function nodeWhenText(n) {
  if (n.atType === "start") return "开考 0:00";
  if (n.atType === "end") return "考试结束";
  if (n.atType === "beforeEnd") return `结束前 ${n.value} 分钟`;
  const p = secToParts(n.value);
  return `第 ${String(p.h).padStart(2, "0")}:${String(p.m).padStart(2, "0")}:${String(p.s).padStart(2, "0")}`;
}

// 添加节点
function addNode(atType, value = 15, label = "") {
  if (!draft.value) return;
  const labels = {
    start: "考试开始",
    beforeEnd: "最后提醒",
    end: "考试结束",
    atSec: "自定义提示"
  };
  draft.value.nodes.push({
    id: uid(),
    label: label || labels[atType] || "提示",
    atType,
    value,
    sound: { mode: "builtin", tone: atType === "end" ? "end" : "warn" }
  });
  dirty.value = true;
}

function removeNode(id) {
  if (!draft.value) return;
  const i = draft.value.nodes.findIndex((n) => n.id === id);
  if (i >= 0) {
    draft.value.nodes.splice(i, 1);
    dirty.value = true;
  }
}

// 删除整个模板
const confirmDelete = ref(false);

function save() {
  if (!draft.value) return;
  const name = draft.value.name.trim();
  if (!name) {
    toast("请填写考试名称", "err");
    return;
  }
  if (!draft.value.durationMin || draft.value.durationMin < 1) {
    toast("请填写有效时长", "err");
    return;
  }
  if (draft.value.kind === "listening" && !draft.value.listeningKey) {
    toast("听力考试需要先上传听力音频", "err");
    return;
  }
  if (draft.value.kind === "listening" && draft.value.nodes.length === 0) {
    draft.value.nodes.push({
      id: uid(),
      label: "考试结束",
      atType: "end",
      value: 0,
      sound: { mode: "builtin", tone: "end" }
    });
  }
  draft.value.updatedAt = Date.now();
  store.upsertTemplate(JSON.parse(JSON.stringify(draft.value)));
  dirty.value = false;
  toast("已保存");
  navigate("exam");
}

function removeTpl() {
  if (!draft.value) return;
  store.removeTemplate(draft.value.id);
  confirmDelete.value = false;
  toast("模板已删除");
  navigate("exam");
}

function goRun() {
  if (!draft.value) return;
  if (!draft.value.name.trim()) {
    toast("请填写考试名称", "err");
    return;
  }
  if (!draft.value.durationMin || draft.value.durationMin < 1) {
    toast("请填写有效时长", "err");
    return;
  }
  if (draft.value.kind === "listening" && !draft.value.listeningKey) {
    toast("听力考试需要先上传听力音频", "err");
    return;
  }
  draft.value.updatedAt = Date.now();
  store.upsertTemplate(JSON.parse(JSON.stringify(draft.value)));
  dirty.value = false;
  navigate("exam-run", { id: draft.value.id });
}

const durationPresets = [15, 30, 45, 60, 90, 120];
</script>

<template>
  <div v-if="draft">
    <div class="page-head">
      <div class="head-left">
        <button class="back-btn" @click="navigate('exam')">
          <Icon name="back" :size="18" /> 考试中心
        </button>
        <div class="eyebrow">
          <Icon :name="draft.kind === 'listening' ? 'listen' : 'exam'" :size="13" />
          {{ draft.kind === "listening" ? "英语听力考试" : "普通考试" }}
        </div>
        <h1 class="page-title" style="margin-top: 6px">配置考试</h1>
      </div>
      <div class="head-actions">
        <button class="btn btn-ghost" @click="navigate('exam')">取消</button>
        <button class="btn btn-primary" @click="goRun">
          <Icon name="play" :size="15" /> 保存并开考
        </button>
      </div>
    </div>

    <div class="edit-grid">
      <!-- 基本信息 -->
      <section class="panel sec">
        <h2 class="sec-title">基本信息</h2>
        <div class="field">
          <label for="tpl-name">考试名称</label>
          <input
            id="tpl-name"
            v-model="draft.name"
            class="input"
            maxlength="40"
            placeholder="例如：八年级期中考试 / 高三英语听力模拟"
          />
        </div>

        <div class="field">
          <label>考试时长</label>
          <div class="dur-row">
            <div class="dur-input">
              <input
                v-model.number="draft.durationMin"
                class="input tnum"
                type="number"
                min="1"
                max="600"
                inputmode="numeric"
              />
              <span class="dur-unit">分钟</span>
            </div>
            <div class="dur-chips">
              <button
                v-for="d in durationPresets"
                :key="d"
                class="chip-btn"
                :class="{ on: draft.durationMin === d }"
                @click="draft.durationMin = d"
              >
                {{ d }}'
              </button>
            </div>
          </div>
          <p class="hint">共 {{ fmtMin(draft.durationMin || 0) }}，考试进行页将显示倒计时。</p>
        </div>

        <!-- 听力文件（仅听力考试） -->
        <ListeningUpload v-if="draft.kind === 'listening'" v-model:key="draft.listeningKey" v-model:name="draft.listeningName" />
      </section>

      <!-- 提示节点 -->
      <section class="panel sec">
        <div class="sec-head">
          <div>
            <h2 class="sec-title">时间点提示音频</h2>
            <p class="hint" style="margin-top: 4px">
              {{ draft.kind === "listening" ? "听力音频开考自动播放；此处可另加节点提示。" : "到点时播放指定音频。" }}
            </p>
          </div>
        </div>

        <div v-if="draft.nodes.length" class="node-list">
          <div v-for="(n, idx) in draft.nodes" :key="n.id" class="node-row">
            <div class="node-idx">{{ String(idx + 1).padStart(2, "0") }}</div>
            <div class="node-main">
              <input v-model="n.label" class="input node-label" maxlength="20" placeholder="节点名称" />
              <div class="node-sub">
                <div class="select-wrap">
                  <select v-model="n.atType" class="input select">
                    <option v-for="op in typeOps" :key="op.v" :value="op.v">{{ op.label }}</option>
                  </select>
                  <span class="chev"><Icon name="chevD" :size="15" /></span>
                </div>
                <input
                  v-if="n.atType === 'beforeEnd'"
                  v-model.number="n.value"
                  class="input node-val tnum"
                  type="number"
                  min="1"
                  max="240"
                  placeholder="分钟"
                />
                <div v-if="n.atType === 'atSec'" class="time-input">
                  <input
                    class="input node-val tnum"
                    type="number"
                    min="0"
                    placeholder="时"
                    :value="nodeParts(n).h"
                    @input="n.value = partsToSec($event.target.value, nodeParts(n).m, nodeParts(n).s); dirty = true"
                  />
                  <span class="colon">:</span>
                  <input
                    class="input node-val tnum"
                    type="number"
                    min="0"
                    max="59"
                    placeholder="分"
                    :value="nodeParts(n).m"
                    @input="n.value = partsToSec(nodeParts(n).h, $event.target.value, nodeParts(n).s); dirty = true"
                  />
                  <span class="colon">:</span>
                  <input
                    class="input node-val tnum"
                    type="number"
                    min="0"
                    max="59"
                    placeholder="秒"
                    :value="nodeParts(n).s"
                    @input="n.value = partsToSec(nodeParts(n).h, nodeParts(n).m, $event.target.value); dirty = true"
                  />
                </div>
              </div>
              <span class="node-when"><Icon name="clock" :size="13" /> {{ nodeWhenText(n) }}</span>
            </div>
            <div class="node-right">
              <button class="sound-chip" :class="{ silent: !n.sound }" @click="pickerFor = n.id">
                <Icon name="volume" :size="15" />
                {{ nodeSummary(n.sound) }}
              </button>
              <button class="icon-btn danger-hover" aria-label="删除节点" @click="removeNode(n.id)">
                <Icon name="trash" :size="16" />
              </button>
            </div>
          </div>
        </div>

        <div class="add-row">
          <button class="btn btn-ghost btn-sm" @click="addNode('start', 0, '考试开始')">
            <Icon name="plus" :size="14" /> 开考时
          </button>
          <button class="btn btn-ghost btn-sm" @click="addNode('beforeEnd', 15, '最后 15 分钟')">
            <Icon name="plus" :size="14" /> 结束前 15 分
          </button>
          <button class="btn btn-ghost btn-sm" @click="addNode('beforeEnd', 5, '最后 5 分钟')">
            <Icon name="plus" :size="14" /> 结束前 5 分
          </button>
          <button class="btn btn-ghost btn-sm" @click="addNode('end', 0, '考试结束')">
            <Icon name="plus" :size="14" /> 结束时
          </button>
          <button class="btn btn-ghost btn-sm" @click="addNode('atSec', 0, '自定义提示')">
            <Icon name="plus" :size="14" /> 自定义节点
          </button>
        </div>
        <p class="hint" style="margin-top: 10px">
          节点按时间顺序自动触发；可删除预设节点或添加自定义时间点。每个节点都可单独指定音频（内置音 / audio
          文件夹 / 我的音频库 / 静音）。
        </p>
      </section>
    </div>

    <div class="save-bar">
      <button v-if="!isNew" class="btn btn-danger-ghost" @click="confirmDelete = true">
        <Icon name="trash" :size="15" /> 删除模板
      </button>
      <button class="btn btn-primary btn-lg" @click="save">
        <Icon name="check" :size="16" /> 保存模板
      </button>
    </div>

    <!-- 声音选择弹窗 -->
    <SoundPicker
      v-if="draft"
      :show="showPicker"
      :current="pickerFor ? draft.nodes.find((n) => n.id === pickerFor)?.sound : null"
      @close="pickerFor = null"
      @pick="onPickSound"
    />

    <ConfirmDialog
      :show="confirmDelete"
      title="删除模板"
      :message="`确定删除「${draft.name}」？`"
      detail="已保存的考试记录不会受到影响。"
      confirm-text="删除模板"
      danger
      @cancel="confirmDelete = false"
      @confirm="removeTpl"
    />
  </div>

  <div v-else class="empty card">
    <Icon name="exam" :size="32" />
    <p class="empty-title">模板不存在或已被删除</p>
    <button class="btn btn-primary" @click="navigate('exam')">返回考试中心</button>
  </div>
</template>

<style scoped>
.head-left {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--ink-2);
  font-size: 13px;
  font-weight: 600;
  padding: 4px 8px 4px 0;
}

.back-btn:hover {
  color: var(--ink);
}

.head-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.edit-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
}

@media (min-width: 980px) {
  .edit-grid {
    grid-template-columns: 380px minmax(0, 1fr);
    align-items: start;
  }
}

.sec {
  padding: clamp(18px, 2.6vw, 26px);
}

.sec-title {
  font-size: 16.5px;
  font-weight: 750;
  margin-bottom: 16px;
}

.sec-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.edit-grid .field + .field,
.edit-grid .sec > * + * {
  margin-top: 16px;
}

.dur-row {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.dur-input {
  position: relative;
  width: 150px;
  flex: none;
}

.dur-input .input {
  padding-right: 58px;
}

.dur-unit {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--ink-3);
  font-size: 13px;
  pointer-events: none;
}

.dur-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip-btn {
  min-height: 36px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: var(--surface);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  color: var(--ink-2);
  transition: all 0.16s var(--ease-out);
}

.chip-btn.on {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

/* 节点 */
.node-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 4px;
}

.node-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--surface-2);
}

.node-idx {
  flex: none;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 750;
  font-size: 12.5px;
  font-variant-numeric: tabular-nums;
  background: var(--accent-tint);
  color: var(--accent);
}

.node-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.node-label {
  min-height: 40px;
}

.node-sub {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.node-val {
  width: 84px;
  flex: none;
  text-align: center;
}

.time-input {
  display: flex;
  align-items: center;
  gap: 5px;
}

.time-input .node-val {
  width: 60px;
}

.colon {
  color: var(--ink-3);
  font-weight: 700;
}

.node-when {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--accent);
  font-weight: 600;
}

.node-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.sound-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  background: var(--accent-tint);
  color: var(--accent-ink);
  font-size: 12.5px;
  font-weight: 650;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: transform 0.15s var(--ease-out);
}

.sound-chip:hover {
  transform: scale(1.03);
}

.sound-chip.silent {
  background: var(--bg-2);
  color: var(--ink-3);
}

.danger-hover:hover {
  color: var(--danger);
  background: var(--danger-tint);
}

.add-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.save-bar {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px solid var(--line);
}

.btn-lg {
  min-height: 48px;
  padding: 0 26px;
  font-size: 15px;
}
</style>
