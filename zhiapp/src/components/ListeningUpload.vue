<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import Icon from "./Icon.vue";
import { media } from "../store/media.js";
import { playUrlOnce, stopOneShot } from "../audio/engine.js";
import { toast } from "../ui.js";

// 英语听力考试：上传 / 更换 听力音频
const keyModel = defineModel("key", { type: String, default: null });
const nameModel = defineModel("name", { type: String, default: "" });

const library = ref([]);
const busy = ref(false);

async function refresh() {
  const [a, l] = await Promise.all([media.list("audio"), media.list("listen")]);
  library.value = [...a, ...l].sort((x, y) => y.addedAt - x.addedAt);
}

onMounted(refresh);
onBeforeUnmount(stopOneShot);

async function onFile(ev) {
  const f = ev.target.files && ev.target.files[0];
  ev.target.value = "";
  if (!f) return;
  if (!f.type.startsWith("audio/")) {
    toast("请选择音频文件", "err");
    return;
  }
  busy.value = true;
  try {
    // 若有旧文件则删除，避免占用空间
    if (keyModel.value) await media.remove(keyModel.value).catch(() => {});
    const rec = await media.put("listen", f);
    keyModel.value = rec.key;
    nameModel.value = rec.name;
    toast("听力音频已上传");
    await refresh();
  } catch (e) {
    toast("上传失败：" + e.message, "err");
  } finally {
    busy.value = false;
  }
}

function removeCurrent() {
  if (!keyModel.value) return;
  media.remove(keyModel.value).catch(() => {});
  keyModel.value = null;
  nameModel.value = "";
  toast("已移除听力音频");
}

function preview(key) {
  stopOneShot();
  media.url(key).then((u) => u && playUrlOnce(u));
}

function useLib(item) {
  if (keyModel.value && keyModel.value !== item.key) {
    media.remove(keyModel.value).catch(() => {});
  }
  keyModel.value = item.key;
  nameModel.value = item.name || "听力音频";
  toast("已选用：" + (item.name || "听力音频"));
}
</script>

<template>
  <div class="field listen-block">
    <label>听力音频（开考自动播放，考试期间不可暂停 / 回放）</label>

    <div v-if="keyModel" class="current card">
      <span class="cur-ic"><Icon name="listen" :size="18" /></span>
      <span class="cur-main">
        <span class="cur-name">{{ nameModel || "已上传听力音频" }}</span>
        <span class="cur-note">已就绪 · 开考时自动播放</span>
      </span>
      <span class="cur-ops">
        <button class="icon-btn" title="试听" @click="preview(keyModel)">
          <Icon name="play" :size="17" />
        </button>
        <label class="icon-btn" title="更换文件" style="cursor: pointer">
          <Icon name="upload" :size="17" />
          <input type="file" accept="audio/*" hidden @change="onFile" />
        </label>
        <button class="icon-btn danger-hover" title="移除" @click="removeCurrent">
          <Icon name="trash" :size="17" />
        </button>
      </span>
    </div>

    <label v-else class="drop" :class="{ busy }">
      <Icon name="upload" :size="22" />
      <span>{{ busy ? "正在上传…" : "点击上传听力音频" }}</span>
      <small>支持 .mp3 / .wav / .m4a / .ogg，本地存储，不上传网络</small>
      <input type="file" accept="audio/*" hidden @change="onFile" />
    </label>

    <details class="lib-details">
      <summary>从音频库中选用（可复用已上传音频）</summary>
      <div v-if="!library.length" class="hint" style="padding: 8px 2px">音频库为空。</div>
      <div v-else class="lib-list">
        <button
          v-for="a in library"
          :key="a.key"
          class="lib-row"
          :class="{ on: keyModel === a.key }"
          @click="useLib(a)"
        >
          <Icon name="audio" :size="15" />
          <span class="lib-name">{{ a.name || a.key }}</span>
          <span
            class="lib-play"
            title="试听"
            @click.stop="preview(a.key)"
          >
            <Icon name="play" :size="14" />
          </span>
        </button>
      </div>
    </details>

    <p class="hint">
      考试开始即自动从头播放；考生端不提供暂停 / 重播，输入管理员口令 000 后可控制播放。
    </p>
  </div>
</template>

<style scoped>
.listen-block {
  border-top: 1px dashed var(--line);
  padding-top: 18px;
  margin-top: 18px !important;
}

.current {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 16px;
}

.cur-ic {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #e7eefb;
  color: #31527e;
  flex: none;
}

.cur-main {
  flex: 1;
  min-width: 0;
}

.cur-name {
  display: block;
  font-weight: 650;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cur-note {
  font-size: 12px;
  color: var(--ok);
}

.cur-ops {
  display: flex;
  gap: 4px;
}

.danger-hover:hover {
  color: var(--danger);
  background: var(--danger-tint);
}

.drop {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 130px;
  border: 1.8px dashed #c6c9ba;
  border-radius: 18px;
  color: var(--accent);
  font-weight: 650;
  cursor: pointer;
  text-align: center;
  padding: 16px;
  transition: background-color 0.2s;
}

.drop:hover {
  background: var(--accent-tint);
  border-color: var(--accent);
}

.drop.busy {
  opacity: 0.6;
}

.drop small {
  color: var(--ink-3);
  font-weight: 400;
  font-size: 12px;
}

.lib-details {
  font-size: 13px;
  color: var(--ink-2);
}

.lib-details summary {
  cursor: pointer;
  padding: 6px 2px;
  font-weight: 600;
}

.lib-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 180px;
  overflow-y: auto;
  padding: 4px 2px;
}

.lib-row {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 10px;
  border-radius: 11px;
  border: 1px solid var(--line);
  background: var(--surface);
  text-align: left;
  transition: border-color 0.16s;
}

.lib-row.on {
  border-color: var(--accent);
  background: var(--accent-tint);
}

.lib-name {
  flex: 1;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lib-play {
  display: inline-flex;
  padding: 4px;
  border-radius: 50%;
  color: var(--ink-3);
}

.lib-play:hover {
  color: var(--accent);
  background: #fff;
}
</style>
