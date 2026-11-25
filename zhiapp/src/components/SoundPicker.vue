<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from "vue";
import Modal from "./Modal.vue";
import Icon from "./Icon.vue";
import { BUILTIN_TONES, AUDIO_DIR, EXAM_SOUNDS } from "../config.js";
import { loadManifest, refreshManifest, fileUrl } from "../audio/manifest.js";
import { playBuiltin, stopOneShot, playUrlOnce } from "../audio/engine.js";
import { media } from "../store/media.js";
import { toast } from "../ui.js";

// 为某个提示节点选择音频。
// 输出 descriptor：null | {mode:'builtin',tone} | {mode:'folder',file}
//                 | {mode:'library', key, name}
const props = defineProps({
  show: Boolean,
  current: { type: Object, default: null }
});
const emit = defineEmits(["close", "pick"]);

const tab = ref("builtin");
const folderList = ref([]);
const library = ref([]);
const loading = ref(false);

async function loadData() {
  folderList.value = await loadManifest();
  const rows = await media.list("audio");
  library.value = rows.sort((a, b) => b.addedAt - a.addedAt);
}

watch(
  () => props.show,
  async (v) => {
    if (v) {
      loading.value = true;
      await loadData();
      loading.value = false;
    } else {
      stopOneShot();
    }
  }
);

onBeforeUnmount(stopOneShot);

async function refreshFolder() {
  await refreshManifest();
  folderList.value = await loadManifest();
}

async function refreshLibrary() {
  const rows = await media.list("audio");
  library.value = rows.sort((a, b) => b.addedAt - a.addedAt);
}

function preview(item) {
  stopOneShot();
  if (item.mode === "builtin") playBuiltin(item.tone);
  else if (item.mode === "folder") playUrlOnce(fileUrl(item.file));
  else if (item.mode === "library" && item.key) {
    media.url(item.key).then((u) => u && playUrlOnce(u));
  }
}

function isActive(item) {
  if (!props.current) return false;
  const c = props.current;
  if (item.mode === "builtin") return c.mode === "builtin" && c.tone === item.tone;
  if (item.mode === "folder") return c.mode === "folder" && c.file === item.file;
  if (item.mode === "library") return c.mode === "library" && c.key === item.key;
  return false;
}

function pick(item) {
  if (item.mode === "builtin") emit("pick", { mode: "builtin", tone: item.tone });
  else if (item.mode === "folder") emit("pick", { mode: "folder", file: item.file });
  else if (item.mode === "library")
    emit("pick", { mode: "library", key: item.key, name: item.name });
}

const fileInput = ref(null);
async function onUpload(ev) {
  const f = ev.target.files && ev.target.files[0];
  ev.target.value = "";
  if (!f) return;
  if (!f.type.startsWith("audio/")) {
    toast("请选择音频文件", "err");
    return;
  }
  try {
    await media.put("audio", f);
    await refreshLibrary();
    toast("已加入音频库");
  } catch (e) {
    toast("保存失败：" + e.message, "err");
  }
}

function doPick(value) {
  stopOneShot();
  emit("pick", value);
}
</script>

<template>
  <Modal :show="show" title="选择提示音频" @close="emit('close')">
    <div class="pick">
      <div class="seg pick-tabs">
        <button :class="{ on: tab === 'builtin' }" @click="tab = 'builtin'">内置提示音</button>
        <button :class="{ on: tab === 'exam' }" @click="tab = 'exam'">考试</button>
        <button :class="{ on: tab === 'folder' }" @click="tab = 'folder'">audio 文件夹</button>
        <button :class="{ on: tab === 'library' }" @click="tab = 'library'">我的音频库</button>
      </div>

      <!-- 考试专栏 -->
      <div v-if="tab === 'exam'" class="pick-list">
        <p class="hint pick-hint">
          考试专用音效（公共/audio/kaoshi 目录）：开考、剩 15 分钟、结束、闹钟/倒计时结束。
        </p>
        <button
          v-for="e in EXAM_SOUNDS"
          :key="e.file"
          class="pick-row"
          :class="{ active: isActive({ mode: 'folder', file: e.file }) }"
          @click="pick({ mode: 'folder', file: e.file })"
        >
          <span class="pick-icon"><Icon name="alarm" :size="17" /></span>
          <span class="pick-name">
            {{ e.name }}
            <i class="pick-sub">{{ e.file }}</i>
          </span>
          <span class="pick-play" @click.stop="preview({ mode: 'folder', file: e.file })">
            <Icon name="play" :size="16" />
          </span>
        </button>
      </div>

      <!-- 内置提示音 -->
      <div v-if="tab === 'builtin'" class="pick-list">
        <button
          v-for="t in BUILTIN_TONES"
          :key="t.id"
          class="pick-row"
          :class="{ active: isActive({ mode: 'builtin', tone: t.id }) }"
          @click="pick({ mode: 'builtin', tone: t.id })"
        >
          <span class="pick-icon"><Icon name="volume" :size="17" /></span>
          <span class="pick-name">{{ t.name }}</span>
          <span class="pick-play" @click.stop="preview({ mode: 'builtin', tone: t.id })">
            <Icon name="play" :size="16" />
          </span>
        </button>
        <p class="hint pick-hint">
          内置提示音由系统合成，无需音频文件；适合“开始 / 最后提醒 / 结束”节点。
        </p>
      </div>

      <!-- 文件夹音频 -->
      <div v-if="tab === 'folder'" class="pick-list">
        <div class="folder-head">
          <p class="hint">
            文件位于 <b>public/{{ AUDIO_DIR }}</b> 目录，替换同名文件即更新；新增文件需登记到
            manifest.json。
          </p>
          <button class="btn btn-ghost btn-sm" @click="refreshFolder">
            <Icon name="refresh" :size="14" /> 刷新
          </button>
        </div>
        <div v-if="!folderList.length" class="empty">
          <Icon name="folder" :size="30" />
          <p class="empty-title">尚未登记音频</p>
          <p class="hint">把 .mp3/.wav/.m4a/.ogg 放入 public/audio/ 并登记 manifest.json</p>
        </div>
        <button
          v-for="f in folderList"
          :key="f.file"
          class="pick-row"
          :class="{ active: isActive({ mode: 'folder', file: f.file }) }"
          @click="pick({ mode: 'folder', file: f.file })"
        >
          <span class="pick-icon"><Icon name="folder" :size="17" /></span>
          <span class="pick-name">
            {{ f.label || f.file }}
            <i class="pick-sub">{{ f.file }}</i>
          </span>
          <span class="pick-play" @click.stop="preview({ mode: 'folder', file: f.file })">
            <Icon name="play" :size="16" />
          </span>
        </button>
      </div>

      <!-- 音频库 -->
      <div v-if="tab === 'library'" class="pick-list">
        <label class="upload-zone">
          <Icon name="upload" :size="18" />
          <span>上传音频到我的音频库</span>
          <input ref="fileInput" type="file" accept="audio/*" hidden @change="onUpload" />
        </label>
        <p v-if="!library.length" class="hint">音频库为空，可先上传 .mp3/.wav 等音频文件。</p>
        <button
          v-for="a in library"
          :key="a.key"
          class="pick-row"
          :class="{ active: isActive({ mode: 'library', key: a.key }) }"
          @click="pick({ mode: 'library', key: a.key, name: a.name })"
        >
          <span class="pick-icon"><Icon name="audio" :size="17" /></span>
          <span class="pick-name">
            {{ a.name || a.key }}
            <i class="pick-sub">{{ (a.size / 1024 / 1024).toFixed(1) }} MB</i>
          </span>
          <span
            class="pick-play"
            @click.stop="preview({ mode: 'library', key: a.key, name: a.name })"
          >
            <Icon name="play" :size="16" />
          </span>
        </button>
      </div>
    </div>

    <div class="modal-foot">
      <button class="btn btn-ghost" @click="emit('close')">取消</button>
      <button
        class="btn btn-ghost"
        @click="doPick(null)"
        :class="{ 'btn-danger-ghost': current }"
      >
        <Icon name="stop" :size="15" /> 该节点静音
      </button>
      <button class="btn btn-primary" @click="emit('close')">完成</button>
    </div>
  </Modal>
</template>

<style scoped>
.pick {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 8px 22px 4px;
  min-height: 240px;
}

.pick-tabs {
  align-self: flex-start;
  flex-wrap: wrap;
}

.pick-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
  padding-right: 4px;
}

.pick-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1.5px solid var(--line);
  background: var(--surface);
  text-align: left;
  transition: border-color 0.18s, background-color 0.18s;
}

.pick-row.active {
  border-color: var(--accent);
  background: var(--accent-tint);
}

.pick-icon {
  flex: none;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-2);
  color: var(--ink-2);
}

.pick-row.active .pick-icon {
  background: #fff;
  color: var(--accent);
}

.pick-name {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pick-sub {
  display: block;
  font-style: normal;
  font-weight: 400;
  font-size: 11.5px;
  color: var(--ink-3);
}

.pick-play {
  flex: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--ink-3);
}

.pick-play:hover {
  background: #fff;
  color: var(--accent);
}

.pick-hint {
  padding: 0 2px;
}

.folder-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.upload-zone {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  padding: 14px;
  border: 1.6px dashed #c8cabd;
  border-radius: 14px;
  color: var(--accent);
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.18s;
}

.upload-zone:hover {
  background: var(--accent-tint);
}
</style>
