<script setup>
import { ref, reactive, computed } from "vue";
import { state, store } from "../../store/state.js";
import Icon from "../Icon.vue";
import Modal from "../Modal.vue";
import ConfirmDialog from "../ConfirmDialog.vue";
import { toast } from "../../ui.js";
import { announce } from "../../lib/focus.js";
import { fmtDateTime, dayKey } from "../../utils.js";

// 心情档位：图标取自 public/img/xingqin/（拼音命名）
const MOOD_BASE = (import.meta.env.BASE_URL || "./") + "img/xingqin/";
const MOODS = [
  { v: 1, label: "很低落", color: "#7a869c", img: MOOD_BASE + "hengdiluo.png" },
  { v: 2, label: "低落", color: "#98a3b5", img: MOOD_BASE + "diluo.png" },
  { v: 3, label: "平静", color: "#9fae9d", img: MOOD_BASE + "pingjing.png" },
  { v: 4, label: "愉悦", color: "#e6b45c", img: MOOD_BASE + "yuyue.png" },
  { v: 5, label: "极佳", color: "#dd7b68", img: MOOD_BASE + "jijia.png" }
];

const items = computed(() =>
  [...state.diary].sort((a, b) => (b.date === a.date ? (b.createdAt || 0) - (a.createdAt || 0) : b.date.localeCompare(a.date)))
);

const moodOf = (v) => MOODS.find((m) => m.v === v) || MOODS[2];

const addOpen = ref(false);
const editId = ref(null);
const draft = reactive({ date: "", mood: 3, text: "" });
const delId = ref(null);

function openNew() {
  Object.assign(draft, { date: dayKey(), mood: 3, text: "" });
  editId.value = null;
  addOpen.value = true;
}

function openEdit(item) {
  Object.assign(draft, { date: item.date, mood: item.mood, text: item.text });
  editId.value = item.id;
  addOpen.value = true;
}

function save() {
  if (!draft.text.trim()) {
    toast("写点什么再保存吧", "err");
    return;
  }
  if (editId.value) {
    store.updateDiary(editId.value, { date: draft.date, mood: draft.mood, text: draft.text.trim() });
    toast("已保存");
  } else {
    store.addDiary({ date: draft.date, mood: draft.mood, text: draft.text.trim() });
    announce();
    toast("已记录今天的心情");
  }
  addOpen.value = false;
}

function doDel() {
  if (delId.value) {
    store.removeDiary(delId.value);
    toast("已删除");
  }
  delId.value = null;
}
</script>

<template>
  <div class="comp">
    <div class="comp-head">
      <div>
        <h2 class="comp-title">心情日记</h2>
        <p class="comp-sub">随手记下每天的状态，累计可解锁「写下心情」勋章</p>
      </div>
      <button class="btn btn-primary btn-sm" @click="openNew">
        <Icon name="plus" :size="15" /> 写一篇
      </button>
    </div>

    <div v-if="!items.length" class="empty-state">
      <Icon name="note" :size="28" />
      <p>还没有日记。今天的感受如何？写下来吧。</p>
    </div>

    <ul v-else class="list">
      <li
        v-for="(it, i) in items"
        :key="it.id"
        class="diary-row"
        :style="{ animationDelay: i * 26 + 'ms' }"
      >
        <button class="diary-main" @click="openEdit(it)">
          <span class="date-col">
            <span class="d-num tnum">{{ it.date.slice(8, 10) }}</span>
            <span class="d-mon">{{ it.date.slice(0, 7) }}</span>
          </span>
          <span class="diary-body">
            <span class="mood-line">
              <img class="mood-dot" :src="moodOf(it.mood).img" alt="" />
              <span class="mood-name">{{ moodOf(it.mood).label }}</span>
              <span class="d-time tnum">{{ fmtDateTime(it.createdAt || 0).slice(11, 16) }}</span>
            </span>
            <span class="diary-text">{{ it.text }}</span>
          </span>
        </button>
        <button class="icon-btn danger" @click="delId = it.id">
          <Icon name="trash" :size="16" />
        </button>
      </li>
    </ul>

    <!-- 编辑 -->
    <Modal :show="addOpen" :title="editId ? '编辑日记' : '写日记'" @close="addOpen = false">
      <div class="modal-form">
        <div class="field">
          <label>日期</label>
          <input v-model="draft.date" class="input" type="date" />
        </div>
        <div class="field">
          <label>今天的心情</label>
          <div class="mood-pick">
            <button
              v-for="m in MOODS"
              :key="m.v"
              class="mood-btn"
              :class="{ on: draft.mood === m.v }"
              @click="draft.mood = m.v"
            >
              <img class="mood-big" :src="m.img" alt="" />
              <span>{{ m.label }}</span>
            </button>
          </div>
        </div>
        <div class="field">
          <label>想说的话</label>
          <textarea v-model="draft.text" class="input" rows="6" maxlength="2000" placeholder="今天的收获、烦恼或一句鼓励…"></textarea>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-ghost" @click="addOpen = false">取消</button>
        <button class="btn btn-primary" @click="save"><Icon name="check" :size="15" /> 保存</button>
      </div>
    </Modal>

    <ConfirmDialog
      :show="!!delId"
      title="删除日记"
      message="确定删除这篇日记吗？"
      confirm-text="删除"
      danger
      @cancel="delId = null"
      @confirm="doDel"
    />
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
  gap: 10px;
}

.diary-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 12px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 16px;
  animation: rise-in 0.35s var(--ease-out) both;
}

.diary-main {
  flex: 1;
  display: flex;
  gap: 14px;
  text-align: left;
  min-width: 0;
}

.date-col {
  flex: none;
  width: 52px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-right: 1px solid var(--line-2);
  padding-right: 12px;
}

.d-num {
  font-size: 26px;
  font-weight: 800;
  line-height: 1.1;
  color: var(--ink);
}

.d-mon {
  font-size: 11px;
  color: var(--ink-3);
}

.diary-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mood-line {
  display: flex;
  align-items: center;
  gap: 7px;
}

.mood-dot {
  width: 20px;
  height: 20px;
  object-fit: contain;
  border-radius: 6px;
  flex: none;
}

.mood-name {
  font-size: 12.5px;
  font-weight: 650;
}

.d-time {
  font-size: 11.5px;
  color: var(--ink-3);
}

.diary-text {
  font-size: 13.5px;
  line-height: 1.6;
  color: var(--ink-2);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.icon-btn.danger:hover {
  color: var(--danger);
  background: var(--danger-tint);
}

.modal-form {
  padding: 6px 22px 16px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.mood-pick {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.mood-btn {
  flex: 1;
  min-width: 86px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 6px;
  border-radius: 14px;
  border: 1.5px solid var(--line);
  font-size: 12px;
  font-weight: 600;
  color: var(--ink-2);
  transition: all 0.16s var(--ease-out);
}

.mood-btn.on {
  border-color: var(--accent);
  background: var(--accent-tint);
  color: var(--ink);
  transform: translateY(-2px);
}

.mood-big {
  width: 30px;
  height: 30px;
  object-fit: contain;
  border-radius: 8px;
}
</style>
