<script setup>
import { ref, reactive, computed } from "vue";
import { state, store } from "../../store/state.js";
import { media } from "../../store/media.js";
import Icon from "../Icon.vue";
import Modal from "../Modal.vue";
import ConfirmDialog from "../ConfirmDialog.vue";
import MediaImage from "../MediaImage.vue";
import { toast } from "../../ui.js";
import { announce } from "../../lib/focus.js";
import { fmtDateTime } from "../../utils.js";

// 证书 & 奖状：列表形态；点击行 → 弹层看大图与详情
const kind = ref("certs"); // certs | awards

// 默认图标：public/img/zhengshu.png（证书）/ public/img/jiangzhuang.png（奖状）
const BASE = import.meta.env.BASE_URL || "./";
const CERT_IMG = `${BASE}img/zhengshu.png`;
const AWARD_IMG = `${BASE}img/jiangzhuang.png`;

const list = computed(() => (kind.value === "certs" ? state.certs : state.awards));
const titleText = computed(() => (kind.value === "certs" ? "我的证书" : "我的奖状"));
const kindImg = computed(() => (kind.value === "certs" ? CERT_IMG : AWARD_IMG));

const detail = ref(null); // 查看详情
const addOpen = ref(false);
const draft = reactive({ name: "", code: "", org: "", file: null, preview: "" });
const delId = ref(null);

function switchKind(k) {
  kind.value = k;
}

function openAdd() {
  Object.assign(draft, { name: "", code: "", org: "", file: null, preview: "" });
  addOpen.value = true;
}

function onImg(ev) {
  const f = ev.target.files && ev.target.files[0];
  ev.target.value = "";
  if (!f) return;
  if (!f.type.startsWith("image/")) return toast("请选择图片", "err");
  if (draft.preview) URL.revokeObjectURL(draft.preview);
  draft.file = f;
  draft.preview = URL.createObjectURL(f);
}

async function saveAdd() {
  if (!draft.name.trim()) {
    toast("请填写名称", "err");
    return;
  }
  let imgKey = null;
  if (draft.file) {
    try {
      const rec = await media.put("img", draft.file);
      imgKey = rec.key;
    } catch (e) {
      return toast("图片保存失败", "err");
    }
  }
  if (kind.value === "certs") {
    store.addCert({ name: draft.name.trim(), no: draft.code.trim(), imgKey });
  } else {
    store.addAward({ name: draft.name.trim(), org: draft.org.trim(), imgKey });
  }
  if (draft.preview) URL.revokeObjectURL(draft.preview);
  addOpen.value = false;
  announce();
  toast("已添加");
}

function openDetail(item) {
  detail.value = item;
}

function removeDel() {
  const id = delId.value;
  if (!id) return;
  const item = (kind.value === "certs" ? state.certs : state.awards).find((x) => x.id === id);
  if (item && item.imgKey) media.remove(item.imgKey).catch(() => {});
  if (kind.value === "certs") store.removeCert(id);
  else store.removeAward(id);
  delId.value = null;
  toast("已删除");
}
</script>

<template>
  <div class="comp">
    <div class="comp-head">
      <div class="title-row">
        <h2 class="comp-title">{{ titleText }}</h2>
        <div class="seg">
          <button :class="{ on: kind === 'certs' }" @click="switchKind('certs')">证书 {{ state.certs.length }}</button>
          <button :class="{ on: kind === 'awards' }" @click="switchKind('awards')">奖状 {{ state.awards.length }}</button>
        </div>
      </div>
      <button class="btn btn-primary btn-sm" @click="openAdd">
        <img :src="kindImg" alt="" class="btn-img" /> 添加{{ kind === "certs" ? "证书" : "奖状" }}
      </button>
    </div>

    <p class="comp-sub">
      {{ kind === "certs" ? "点击记录可查看证书大图与编号详情" : "点击记录可查看奖状大图与学校信息" }}
    </p>

    <div v-if="!list.length" class="empty-state">
      <img :src="kindImg" :alt="kind === 'certs' ? '证书' : '奖状'" class="empty-ic" />
      <p>{{ kind === "certs" ? "还没有证书，点击右上角添加。" : "还没有奖状，点击右上角添加。" }}</p>
    </div>

    <!-- 列表形态 -->
    <ul v-else class="list">
      <li
        v-for="(it, i) in list"
        :key="it.id"
        class="row"
        :style="{ animationDelay: i * 30 + 'ms' }"
        @click="openDetail(it)"
      >
        <span class="thumb" :class="kind === 'certs' ? 'thumb-cert' : 'thumb-award'">
          <img :src="kindImg" :alt="kind === 'certs' ? '证书' : '奖状'" class="thumb-icon" />
          <span v-if="it.imgKey" class="has-img" title="已上传图片"></span>
        </span>
        <div class="row-main">
          <span class="row-title">{{ it.name }}</span>
        </div>
        <span class="view-hint">{{ it.imgKey ? "查看大图" : "查看详情" }} <Icon name="chevR" :size="14" /></span>
        <button class="icon-btn danger" @click.stop="delId = it.id">
          <Icon name="trash" :size="16" />
        </button>
      </li>
    </ul>

    <!-- 详情弹层 -->
    <Modal :show="!!detail" :title="detail ? detail.name : ''" width="min(680px,100%)" @close="detail = null">
      <div class="detail-body">
        <div class="detail-img">
          <MediaImage v-if="detail && detail.imgKey" :media-key="detail.imgKey" :alt="detail && detail.name" />
          <div v-else class="no-img"><Icon name="image" :size="34" /></div>
        </div>
        <div class="detail-meta">
          <p v-if="detail && kind === 'certs' && detail.no" class="meta-row">
            <Icon name="cert" :size="15" /> 编号：<b class="tnum">{{ detail.no }}</b>
          </p>
          <p v-if="detail && kind === 'awards' && detail.org" class="meta-row">
            <Icon name="award" :size="15" /> 学校 / 组织：<b>{{ detail.org }}</b>
          </p>
          <p class="meta-row muted"><Icon name="calendar" :size="15" /> 收录于 {{ fmtDateTime((detail && detail.createdAt) || 0) }}</p>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-ghost" @click="detail = null">关闭</button>
      </div>
    </Modal>

    <!-- 添加弹层 -->
    <Modal :show="addOpen" :title="`添加${kind === 'certs' ? '证书' : '奖状'}`" @close="addOpen = false">
      <div class="modal-form">
        <div class="field">
          <label>{{ kind === "certs" ? "证书名称 *" : "奖状名称 *" }}</label>
          <input v-model="draft.name" class="input" maxlength="40" placeholder="如：全国计算机二级 / 校级三好学生" />
        </div>
        <div v-if="kind === 'certs'" class="field">
          <label>证书编号</label>
          <input v-model="draft.code" class="input" maxlength="40" placeholder="选填" />
        </div>
        <div v-else class="field">
          <label>学校 / 组织</label>
          <input v-model="draft.org" class="input" maxlength="40" placeholder="选填，如：第一实验中学" />
        </div>
        <div class="field">
          <label>图片</label>
          <div v-if="draft.preview" class="img-prev"><img :src="draft.preview" alt="预览" /></div>
          <label class="btn btn-ghost btn-sm">
            <Icon name="upload" :size="14" /> {{ draft.file ? "更换图片" : "上传图片" }}
            <input type="file" accept="image/*" hidden @change="onImg" />
          </label>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-ghost" @click="addOpen = false">取消</button>
        <button class="btn btn-primary" @click="saveAdd"><Icon name="check" :size="15" /> 保存</button>
      </div>
    </Modal>

    <ConfirmDialog
      :show="!!delId"
      title="删除确认"
      message="确定删除这条记录吗？对应图片也会一并删除。"
      confirm-text="删除"
      danger
      @cancel="delId = null"
      @confirm="removeDel"
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
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.comp-title {
  font-size: 18px;
  font-weight: 800;
}

.comp-sub {
  font-size: 12.5px;
  color: var(--ink-3);
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
  gap: 14px;
  padding: 11px 10px;
  border-bottom: 1px solid var(--line-2);
  cursor: pointer;
  animation: rise-in 0.4s var(--ease-out) both;
  transition: background-color 0.18s;
  border-radius: 12px;
}

.row:hover {
  background: var(--surface-2);
}

.thumb {
  width: 52px;
  height: 52px;
  flex: none;
  border-radius: 15px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  border: 1px solid var(--line);
}

.thumb-cert {
  background: linear-gradient(150deg, var(--accent-tint), #d3e4d9);
  color: var(--accent);
}

.thumb-award {
  background: linear-gradient(150deg, var(--warn-tint), #f3e2bd);
  color: var(--warn);
}

/* 默认图标 PNG：等比显示在色块背景上 */
.thumb-icon {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 9px;
}

.btn-img {
  height: 15px;
  width: auto;
  object-fit: contain;
}

.empty-ic {
  height: 40px;
  object-fit: contain;
  opacity: 0.8;
}

.has-img {
  position: absolute;
  right: -3px;
  top: -3px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--ok);
  border: 2px solid var(--surface);
}

.row-main {
  flex: 1;
  min-width: 0;
}

.row-title {
  display: block;
  font-weight: 650;
  font-size: 14.5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.row-sub {
  font-size: 12.5px;
  color: var(--ink-3);
}

.view-hint {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  color: var(--accent);
  font-weight: 600;
}

.icon-btn.danger:hover {
  color: var(--danger);
  background: var(--danger-tint);
}

.detail-body {
  padding: 4px 22px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-img {
  border-radius: 16px;
  overflow: hidden;
  background: #f2f0e8;
  min-height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  max-height: 52vh;
}

.detail-img img {
  width: 100%;
  max-height: 52vh;
  object-fit: contain;
}

.no-img {
  color: var(--ink-3);
  display: flex;
  align-items: center;
  justify-content: center;
  height: 180px;
}

.detail-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.meta-row.muted {
  color: var(--ink-3);
  font-size: 12.5px;
}

.modal-form {
  padding: 6px 22px 16px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.img-prev {
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 8px;
  max-height: 220px;
}

.img-prev img {
  width: 100%;
  max-height: 220px;
  object-fit: contain;
  background: #fff;
}
</style>
