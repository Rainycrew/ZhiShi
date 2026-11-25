<script setup>
import { ref } from "vue";
import { state, store } from "../store/state.js";
import { navigate } from "../router.js";
import { usePageMotion } from "../composables/useMotion.js";
import Icon from "../components/Icon.vue";
import ConfirmDialog from "../components/ConfirmDialog.vue";
import { toast } from "../ui.js";
import { fmtDateTime, fmtMin } from "../utils.js";

const root = ref(null);
usePageMotion(root);

const confirmDel = ref(null); // {id,name}

// 只跳转到编辑器草稿，不落库；用户点“保存”后才成为模板
function newExam(kind) {
  navigate("exam-edit", { id: "new" }, { kind });
}

function edit(id) {
  navigate("exam-edit", { id });
}

function askDelete(t) {
  confirmDel.value = { id: t.id, name: t.name };
}

function doDelete() {
  if (!confirmDel.value) return;
  store.removeTemplate(confirmDel.value.id);
  toast("已删除模板");
  confirmDel.value = null;
}

function run(t) {
  if (t.kind === "listening" && !t.listeningKey) {
    toast("该听力考试尚未上传听力音频", "err");
    navigate("exam-edit", { id: t.id });
    return;
  }
  navigate("exam-run", { id: t.id });
}
</script>

<template>
  <div ref="root">
    <div class="page-head">
      <div>
        <div class="eyebrow">Exam · 考试系统</div>
        <h1 class="page-title">考试中心</h1>
        <p class="page-sub">
          配置考试时长与定点提示音频；英语听力考试支持上传听力文件、开考自动播放。
        </p>
      </div>
      <div class="head-actions">
        <button class="btn btn-primary" @click="newExam('standard')">
          <Icon name="plus" :size="16" /> 新建普通考试
        </button>
      </div>
    </div>

    <!-- 新建入口双卡片 -->
    <section class="create-row">
      <button class="create-card card" data-reveal @click="newExam('standard')">
        <span class="cc-icon cc-standard"><Icon name="exam" :size="24" /></span>
        <span class="cc-title">普通考试</span>
        <span class="cc-desc">设置名称与时长，按时间点播放开始 / 提醒 / 结束音频，可加自定义节点。</span>
        <span class="cc-link"><Icon name="plus" :size="15" /> 新建</span>
      </button>
      <button class="create-card card" data-reveal @click="newExam('listening')">
        <span class="cc-icon cc-listen"><Icon name="listen" :size="24" /></span>
        <span class="cc-title">英语听力考试</span>
        <span class="cc-desc">上传听力音频，开考自动播放且不可暂停回放；管理员凭口令可控制。</span>
        <span class="cc-link"><Icon name="plus" :size="15" /> 新建</span>
      </button>
    </section>

    <!-- 模板列表 -->
    <section style="margin-top: 28px">
      <h2 class="list-title">已保存模板（{{ state.templates.length }}）</h2>

      <div v-if="!state.templates.length" class="empty card" data-reveal>
        <Icon name="exam" :size="32" />
        <p class="empty-title">还没有考试模板</p>
        <p class="hint">点击上方卡片创建一场普通考试或英语听力考试。</p>
      </div>

      <div v-else class="tpl-list">
        <article v-for="t in state.templates" :key="t.id" class="tpl card" data-reveal>
          <div class="tpl-head">
            <span class="tpl-kind" :class="t.kind === 'listening' ? 'kind-listen' : 'kind-standard'">
              <Icon :name="t.kind === 'listening' ? 'listen' : 'exam'" :size="15" />
              {{ t.kind === "listening" ? "英语听力" : "普通考试" }}
            </span>
            <button class="icon-btn" aria-label="删除" @click="askDelete(t)">
              <Icon name="trash" :size="17" />
            </button>
          </div>
          <h3 class="tpl-name">{{ t.name }}</h3>
          <p class="tpl-meta">
            时长 {{ fmtMin(t.durationMin) }}
            <span v-if="t.kind === 'listening'" class="dot">·</span>
            <span v-if="t.kind === 'listening'" :class="{ warn: !t.listeningKey }">
              {{ t.listeningKey ? "听力文件已就绪" : "未上传听力文件" }}
            </span>
          </p>
          <div class="tpl-foot">
            <span class="tpl-time">更新于 {{ fmtDateTime(t.updatedAt) }}</span>
            <div class="tpl-ops">
              <button class="btn btn-ghost btn-sm" @click="edit(t.id)">
                <Icon name="edit" :size="14" /> 配置
              </button>
              <button class="btn btn-primary btn-sm" @click="run(t)">
                <Icon name="play" :size="14" /> 开考
              </button>
            </div>
          </div>
        </article>
      </div>
    </section>

    <ConfirmDialog
      :show="!!confirmDel"
      title="删除考试模板"
      :message="`确定删除模板「${confirmDel ? confirmDel.name : ''}」？`"
      detail="删除后需重新创建；历史考试记录不受影响。"
      confirm-text="删除"
      danger
      @cancel="confirmDel = null"
      @confirm="doDelete"
    />
  </div>
</template>

<style scoped>
.head-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.create-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 14px;
}

.create-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  gap: 8px;
  padding: 22px;
  transition: transform 0.22s var(--ease-out), box-shadow 0.22s var(--ease-out);
}

.create-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-2);
}

.cc-icon {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}

.cc-standard {
  background: var(--accent-tint);
  color: var(--accent);
}

.cc-listen {
  background: #e7eefb;
  color: #31527e;
}

.cc-title {
  font-size: 17px;
  font-weight: 750;
}

.cc-desc {
  font-size: 13px;
  color: var(--ink-2);
  line-height: 1.65;
  min-height: 62px;
}

.cc-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--accent);
  font-weight: 650;
  font-size: 14px;
}

.list-title {
  font-size: 16px;
  font-weight: 750;
  margin-bottom: 12px;
}

.tpl-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
}

.tpl {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: transform 0.22s var(--ease-out), box-shadow 0.22s var(--ease-out);
}

.tpl:hover {
  transform: translateY(-2px);
}

.tpl-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tpl-kind {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 11px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 650;
}

.kind-standard {
  background: var(--accent-tint);
  color: var(--accent-ink);
}

.kind-listen {
  background: #e7eefb;
  color: #31527e;
}

.tpl-name {
  font-size: 18px;
  font-weight: 750;
}

.tpl-meta {
  font-size: 13px;
  color: var(--ink-2);
}

.warn {
  color: var(--danger);
}

.dot {
  margin: 0 6px;
  color: var(--line);
}

.tpl-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--line-2);
  gap: 10px;
}

.tpl-time {
  font-size: 11.5px;
  color: var(--ink-3);
  font-variant-numeric: tabular-nums;
}

.tpl-ops {
  display: flex;
  gap: 8px;
}
</style>
