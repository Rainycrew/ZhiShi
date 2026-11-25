<script setup>
import { ref, reactive, computed } from "vue";
import { state, store } from "../../store/state.js";
import { media } from "../../store/media.js";
import { PANEL_URL } from "../../config.js";
import Icon from "../Icon.vue";
import Avatar from "../Avatar.vue";
import VMark from "../VMark.vue";
import Modal from "../Modal.vue";
import ConfirmDialog from "../ConfirmDialog.vue";
import { toast } from "../../ui.js";
import { fmtBytes, fmtDateTime } from "../../utils.js";
import { exportAll, buildBackup, importFile } from "../../lib/backup.js";
import { evaluateAchievements } from "../../lib/achievements.js";
import { dev, closeDev } from "../../store/dev.js";
import { DEFAULT_MARK, MARK_BADGES, DEV_MARKS, markById, markImgUrl } from "../../lib/skins.js";

const DEV_MAIL = "rainycrew@qq.com";
const DEV_PASS = "000";
const RESET_PHRASE = "我已知道上述操作风险";

const profile = computed(() => state.profile);
const nameBuf = ref(profile.value.name);

// 本地可编辑缓冲（解锁后才能改）
const titleBuf = ref(profile.value.title);
const panelBuf = ref(profile.value.panelUrl || PANEL_URL || "");
const pointsBuf = ref(state.points);

// 开发者解锁：由顶部「设置」按钮连点 5 下触发（见 dev.js），仅本次会话有效
const unlocked = computed(() => dev.unlocked);

// 头像
const avatarBusy = ref(false);
async function onAvatarFile(ev) {
  const f = ev.target.files && ev.target.files[0];
  ev.target.value = "";
  if (!f) return;
  if (!f.type.startsWith("image/")) return toast("请选择图片", "err");
  avatarBusy.value = true;
  try {
    if (profile.value.avatarKey) await media.remove(profile.value.avatarKey).catch(() => {});
    const rec = await media.put("avatar", f);
    profile.value.avatarKey = rec.key;
    const setup = store.rewardSetup();
    toast(setup ? `头像已更新，积分 +${setup}` : "头像已更新");
  } finally {
    avatarBusy.value = false;
  }
}

// ===== 黄V称号 / 看板地址 / 积分数量：默认锁定 → 开发者解锁 =====
function syncBufs() {
  titleBuf.value = profile.value.title;
  panelBuf.value = profile.value.panelUrl || PANEL_URL || "";
  pointsBuf.value = state.points;
}

function submitDevPass() {
  if (dev.pass.trim() === DEV_PASS) {
    dev.unlocked = true;
    dev.showPass = false;
    dev.pass = "";
    syncBufs();
    toast("已验证，可修改");
  } else {
    toast("口令错误", "err");
    dev.pass = "";
  }
}

function saveProfile() {
  if (!nameBuf.value.trim()) return toast("请填写姓名", "err");
  profile.value.name = nameBuf.value.trim();
  if (unlocked.value) {
    profile.value.title = titleBuf.value.trim();
    profile.value.panelUrl = panelBuf.value.trim();
    state.points = Math.max(0, Math.floor(Number(pointsBuf.value) || 0));
  }
  const setup = store.rewardSetup();
  toast(setup ? `已保存，积分 +${setup}` : "已保存");
  // 称号 / 看板 / 积分属于开发者项：每次保存后重新上锁，下次修改需重新解锁
  if (unlocked.value) {
    dev.unlocked = false;
    dev.showPass = false;
  }
}

// 标识徽章选择：默认黄V + 已拥有徽章 + 开发者专属（开发者1/2 仅解锁后可设）
const allMarks = computed(() => {
  const list = [{ id: DEFAULT_MARK, name: "默认黄V" }];
  for (const b of MARK_BADGES) if (state.mark.owned.includes(b.id)) list.push({ id: b.id, name: b.name });
  if (unlocked.value) for (const d of DEV_MARKS) list.push(d);
  return list;
});
function setMark(id) {
  if (id && !state.mark.owned.includes(id)) state.mark.owned.push(id);
  state.mark.equipped = id;
  toast(`标识已设为${markById(id)?.name || ""}`);
}

// ===== 存储清理 =====
const showStorage = ref(false);
const usage = reactive({ lsBytes: 0, audio: 0, listen: 0, img: 0, avatar: 0 });
const cleanup = ref(null);
const cleanupStep = ref(1);
const fileInput = ref(null);
const importOpen = ref(false);

// ===== 恢复出厂（输入确认句后才清空） =====
const resetOpen = ref(false);
const resetPhrase = ref("");
const resetBusy = ref(false);
const resetMatched = computed(() => resetPhrase.value.trim() === RESET_PHRASE);

function openReset() {
  resetPhrase.value = "";
  resetOpen.value = true;
}

function cancelReset() {
  resetOpen.value = false;
  resetPhrase.value = "";
}

async function doReset() {
  if (!resetMatched.value || resetBusy.value) return;
  resetBusy.value = true;
  try {
    // 1) 清空媒体
    const rows = await media.list();
    await media.removeMany(rows.map((r) => r.key));
  } catch (e) {}
  // 2) 清空本地数据并重置页面
  try {
    localStorage.removeItem("zhishi.pad.v1");
  } catch (e) {}
  location.hash = "#/";
  location.reload();
}

async function refreshUsage() {
  const [audio, listen, img, avatar] = await Promise.all([
    media.size("audio"),
    media.size("listen"),
    media.size("img"),
    media.size("avatar")
  ]);
  usage.audio = audio;
  usage.listen = listen;
  usage.img = img;
  usage.avatar = avatar;
  usage.lsBytes = new Blob([localStorage.getItem("zhishi.pad.v1") || ""]).size;
}

async function openStorage() {
  await refreshUsage();
  showStorage.value = true;
}

const storageRows = computed(() => [
  { id: "records", icon: "exam", title: "考试记录", sub: `${state.records.length} 条` },
  { id: "templates", icon: "exam", title: "考试模板", sub: `${state.templates.length} 个` },
  { id: "honors", icon: "award", title: "证书与奖状", sub: `${state.certs.length} 证书 · ${state.awards.length} 奖状（含图片）` },
  { id: "plans", icon: "panel", title: "计划与打卡", sub: `${state.plans.length} 计划 · ${state.checkins.length} 天打卡` },
  { id: "focus", icon: "timer", title: "专注记录", sub: `${state.focus.length} 条` },
  { id: "diary", icon: "note", title: "心情日记", sub: `${state.diary.length} 篇` },
  { id: "badges", icon: "medal", title: "勋章解锁记录", sub: `${Object.keys(state.achievements).length} 枚` },
  { id: "audio", icon: "volume", title: "音频库", sub: fmtBytes(usage.audio) },
  { id: "listen", icon: "listen", title: "听力文件", sub: fmtBytes(usage.listen) },
  { id: "images", icon: "image", title: "图片（头像/背景/证书图）", sub: fmtBytes(usage.img + usage.avatar) },
  { id: "all", icon: "trash", title: "全部数据（恢复出厂）", sub: "清除上面所有内容", danger: true }
]);

async function openCleanup(id) {
  if (id === "all") {
    showStorage.value = false;
    openReset();
    return;
  }
  await refreshUsage();
  const descMap = {
    records: `将删除 ${state.records.length} 条考试记录`,
    templates: `将删除 ${state.templates.length} 个考试模板`,
    honors: `将删除 ${state.certs.length} 份证书与 ${state.awards.length} 张奖状，含图片文件`,
    plans: `将删除 ${state.plans.length} 个计划与 ${state.checkins.length} 天打卡`,
    focus: `将删除 ${state.focus.length} 条专注记录`,
    diary: `将删除 ${state.diary.length} 篇心情日记`,
    badges: `将清除已解锁的 ${Object.keys(state.achievements).length} 枚勋章记录`,
    audio: `将删除音频库 ${fmtBytes(usage.audio)}`,
    listen: `将删除听力文件 ${fmtBytes(usage.listen)}`,
    images: `将删除头像/背景/证书图片等 ${fmtBytes(usage.img + usage.avatar)}`,
    all: "将清除全部本地数据与媒体文件，恢复默认"
  };
  cleanup.value = { id, desc: descMap[id] || "" };
  cleanupStep.value = 1;
  showStorage.value = false;
}

async function doCleanup() {
  const id = cleanup.value && cleanup.value.id;
  if (!id) return;
  if (id === "records") store.clearRecords();
  else if (id === "templates") store.clearTemplates();
  else if (id === "honors") {
    const keys = [...state.certs, ...state.awards].map((x) => x.imgKey).filter(Boolean);
    await media.removeMany(keys);
    state.certs = [];
    state.awards = [];
  } else if (id === "plans") {
    state.plans = [];
    state.checkins = [];
  } else if (id === "focus") state.focus = [];
  else if (id === "diary") state.diary = [];
  else if (id === "badges") state.achievements = {};
  else if (id === "audio") {
    const keys = await media.clearKind("audio");
    state.templates.forEach((t) =>
      (t.nodes || []).forEach((n) => {
        if (n.sound && n.sound.mode === "library" && keys.includes(n.sound.key)) n.sound = null;
      })
    );
  } else if (id === "listen") {
    const keys = await media.clearKind("listen");
    state.templates.forEach((t) => {
      if (t.listeningKey && keys.includes(t.listeningKey)) {
        t.listeningKey = null;
        t.listeningName = "";
      }
    });
  } else if (id === "images") {
    await media.clearKind("img");
    await media.clearKind("avatar");
    profile.value.avatarKey = null;
    state.clock.bgKey = null;
    state.certs.forEach((c) => (c.imgKey = null));
    state.awards.forEach((a) => (a.imgKey = null));
  } else if (id === "all") {
    const keys = (await media.list()).map((r) => r.key);
    await media.removeMany(keys);
    localStorage.removeItem("zhishi.pad.v1");
    location.hash = "#/";
    location.reload();
    return;
  }
  cleanup.value = null;
  evaluateAchievements();
  await refreshUsage();
  toast("清理完成");
}

// ===== 导出 / 导入 =====
const backupText = ref("");
const showBackupText = ref(false);
const copyOk = ref(false);

async function doExport() {
  try {
    const r = await exportAll();
    if (r.status === "saved") toast("备份已保存到所选位置");
    else if (r.status === "download") {
      toast("备份文件已开始下载");
      // 部分环境（如内嵌页面）会拦截下载：给出文本兜底提示
      if (!window.showSaveFilePicker) {
        toast("若未弹出下载，请点「查看并复制备份文本」", "ach", 5200);
      }
    } else if (r.status === "share") {
      toast("请在系统分享面板里选择「保存到文件 / 发送」", "ach", 5200);
    } else if (r.status === "cancel") toast("已取消");
  } catch (e) {
    console.error("导出数据失败", e);
    toast("导出失败：" + (e && e.message ? e.message : String(e)), "err", 6000);
  }
}

async function showBackup() {
  try {
    const b = await buildBackup();
    backupText.value = b.json;
    copyOk.value = false;
    showBackupText.value = true;
  } catch (e) {
    toast("生成失败：" + (e && e.message ? e.message : e), "err");
  }
}

async function copyBackupText() {
  try {
    await navigator.clipboard.writeText(backupText.value);
    copyOk.value = true;
    toast("已复制到剪贴板");
  } catch (e) {
    // 兼容兜底
    const ta = document.createElement("textarea");
    ta.value = backupText.value;
    document.body.appendChild(ta);
    ta.select();
    const done = document.execCommand("copy");
    ta.remove();
    copyOk.value = done;
    toast(done ? "已复制到剪贴板" : "复制失败，请手动长按选择复制", done ? "ok" : "err");
  }
}

function onImportFile(ev) {
  const f = ev.target.files && ev.target.files[0];
  ev.target.value = "";
  if (!f) return;
  importOpen.value = true;
  importFileInput.value = f;
}

const importFileInput = ref(null);
async function doImport() {
  const f = importFileInput.value;
  if (!f) return;
  try {
    await importFile(f);
    importOpen.value = false;
    toast("导入成功，正在刷新…");
    setTimeout(() => location.reload(), 700);
  } catch (e) {
    importOpen.value = false;
    toast("导入失败：" + e.message, "err");
  }
}
</script>

<template>
  <div class="comp">
    <div class="comp-head">
      <div>
        <h2 class="comp-title">资料与设置</h2>
        <p class="comp-sub"></p>
      </div>
    </div>

    <div class="form-grid">
      <div class="avatar-cell">
        <Avatar :avatar-key="profile.avatarKey" :name="nameBuf" :size="88" :frame="state.avatarframe.equipped || ''">
          <template v-if="profile.vEnabled" #badge>
            <span class="ds-v-ring"><VMark :size="26" /></span>
          </template>
        </Avatar>
        <div class="avatar-ops">
          <label class="btn btn-ghost btn-sm">
            <Icon name="upload" :size="13" /> {{ avatarBusy ? "上传中" : "更换头像" }}
            <input type="file" accept="image/*" hidden @change="onAvatarFile" />
          </label>
          <button
            v-if="profile.avatarKey"
            class="btn btn-danger-ghost btn-sm"
            @click="media.remove(profile.avatarKey).then(() => { profile.avatarKey = null; toast('已移除头像'); })"
          >
            <Icon name="trash" :size="13" /> 移除
          </button>
        </div>
      </div>

      <div class="fields-cell">
        <div class="field">
          <label for="s-name">姓名</label>
          <input id="s-name" v-model="nameBuf" class="input" maxlength="24" placeholder="你的名字" />
        </div>

        <!-- 称号（黄V，开发者项） -->
        <div class="field">
          <label for="s-title">称号（黄V）</label>
          <input
            id="s-title"
            v-model="titleBuf"
            class="input"
            maxlength="12"
            :readonly="!unlocked"
            :placeholder="unlocked ? '例如：认证学霸' : '需开发者权限解锁'"
          />
        </div>

        <!-- 看板地址（开发者项） -->
        <div class="field">
          <label for="s-panel">数据看板地址</label>
          <input
            id="s-panel"
            v-model="panelBuf"
            class="input"
            type="url"
            :readonly="!unlocked"
            :placeholder="unlocked ? 'https://…' : '需开发者权限解锁'"
          />
        </div>

        <!-- 积分数量（开发者项，解锁后可改） -->
        <div class="field">
          <label for="s-pts">积分数量</label>
          <input
            id="s-pts"
            v-model="pointsBuf"
            class="input tnum"
            type="number"
            min="0"
            :readonly="!unlocked"
            :placeholder="unlocked ? '当前 ' + state.points : '需开发者权限解锁'"
          />
        </div>

        <!-- 标识徽章 -->
        <div class="field">
          <label>标识（称号/头像旁的小图标）</label>
          <div class="mark-row">
            <button
              v-for="m in allMarks"
              :key="m.id"
              class="mark-opt"
              :class="{ on: state.mark.equipped === m.id }"
              :title="m.name"
              @click="setMark(m.id)"
            >
              <img :src="markImgUrl(m.id)" class="mark-opt-img" :alt="m.name" />
            </button>
          </div>
          <p class="hint">默认标识；其余在商城里用积分购买</p>
        </div>

        <label class="switch-row">
          <span class="sw-label">
            展示黄V标识
            <small v-if="profile.vEnabled && profile.title">首页与「我的」将显示「V + {{ profile.title }}」</small>
          </span>
          <button class="sw" :class="{ on: profile.vEnabled }" @click="profile.vEnabled = !profile.vEnabled">
            <span class="sw-knob"></span>
          </button>
        </label>

        <div class="row-actions">
          <button class="btn btn-primary btn-sm" @click="saveProfile">
            <Icon name="check" :size="14" /> 保存
          </button>
          <a v-if="unlocked" class="btn btn-ghost btn-sm" :href="'mailto:' + DEV_MAIL" target="_blank">
            <Icon name="ext" :size="13" /> 联系开发者
          </a>
        </div>
      </div>
    </div>

    <!-- 数据管理 -->
    <div class="data-box">
      <div class="box-title">
        <Icon name="folder" :size="16" /> 数据管理（无后端 · 全部存本机）
      </div>
      <p class="hint">
        本地占用：媒体 {{ fmtBytes(usage.audio + usage.listen + usage.img + usage.avatar) }} + 数据 {{ fmtBytes(usage.lsBytes) }}
      </p>
      <div class="btn-row">
        <button class="btn btn-ghost btn-sm" @click="doExport">
          <Icon name="download" :size="14" /> 导出数据文件
        </button>
        <button class="btn btn-ghost btn-sm" @click="showBackup">
          <Icon name="doc" :size="14" /> 查看 / 复制备份文本
        </button>
        <label class="btn btn-ghost btn-sm">
          <Icon name="upload" :size="14" /> 导入数据文件
          <input ref="fileInput" type="file" accept=".json,application/json" hidden @change="onImportFile" />
        </label>
        <button class="btn btn-danger-ghost btn-sm" @click="openStorage">
          <Icon name="trash" :size="14" /> 清理存储
        </button>
      </div>
      <p class="hint">
        导出为 .json（含打卡/专注/计划/勋章/考试/证书/奖状/积分/已解锁皮肤与图片音频），在“指定文件夹”保存；
        若浏览器拦截了下载，可用「查看 / 复制备份文本」手动保存；换设备时用“导入”一键恢复。
      </p>
    </div>

    <!-- 危险区：恢复出厂 -->
    <div class="reset-box">
      <div class="reset-head">
        <span class="reset-ic"><Icon name="trash" :size="17" /></span>
        <div class="reset-text">
          <b>恢复出厂设置</b>
          <span>清空姓名、头像、考试模板与记录、证书、奖状、计划打卡、专注、日记、勋章及全部图片音频，并恢复默认。</span>
        </div>
      </div>
      <button class="btn btn-danger" @click="openReset">
        <Icon name="trash" :size="15" /> 恢复出厂设置
      </button>
    </div>

    <!-- 开发者口令弹层（顶部「设置」连点 5 下触发） -->
    <Modal :show="dev.showPass" title="开发者验证" @close="closeDev">
      <div class="dev-modal">
        <p class="dev-tip">
          称号、数据看板地址与积分数量属于开发者预留功能。点击顶部「设置」按钮连点 5 下即可弹出本框；
          验证通过后可修改，保存后自动重新上锁。联系开发者：<b>{{ DEV_MAIL }}</b>
        </p>
        <div class="pass-row pop">
          <input
            v-model="dev.pass"
            class="input tnum"
            type="password"
            inputmode="numeric"
            maxlength="6"
            placeholder="输入口令"
            @keyup.enter="submitDevPass"
          />
          <button class="btn btn-primary" @click="submitDevPass">验证</button>
        </div>
      </div>
    </Modal>

    <!-- 备份文本预览/复制 -->
    <Modal :show="showBackupText" title="备份内容（JSON）" width="min(760px,100%)" @close="showBackupText = false">
      <div class="backup-preview">
        <p class="hint">
          若下载被浏览器拦截，可复制全部内容 → 新建一个 <b>xxx.json</b> 文本文件粘贴保存（UTF-8）→
          之后用“导入数据文件”恢复。共 {{ backupText.length.toLocaleString() }} 字符。
        </p>
        <textarea ref="backupTa" class="input backup-ta" readonly :value="backupText"></textarea>
      </div>
      <div class="modal-foot">
        <button class="btn btn-ghost" @click="showBackupText = false">关闭</button>
        <button class="btn btn-primary" @click="copyBackupText">
          <Icon :name="copyOk ? 'check' : 'doc'" :size="15" /> {{ copyOk ? "已复制" : "复制备份文本" }}
        </button>
      </div>
    </Modal>

    <!-- 存储管理 -->
    <Modal :show="showStorage" title="清理存储内容" width="min(660px,100%)" @close="showStorage = false">
      <div class="storage-list">
        <p class="hint" style="padding: 0 0 10px">分类清理，每次需二次确认。</p>
        <div v-for="r in storageRows" :key="r.id" class="store-row">
          <span class="store-ic" :class="{ danger: r.danger }"><Icon :name="r.icon" :size="16" /></span>
          <div class="store-main">
            <span class="store-title">{{ r.title }}</span>
            <span class="store-sub">{{ r.sub }}</span>
          </div>
          <button
            class="btn btn-sm"
            :class="r.danger ? 'btn-danger-ghost' : 'btn-ghost'"
            @click="openCleanup(r.id)"
          >
            清理
          </button>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-ghost" @click="showStorage = false">关闭</button>
      </div>
    </Modal>

    <!-- 清理二次确认 -->
    <ConfirmDialog
      :show="!!cleanup"
      :title="'清理 · ' + (cleanup ? storageRows.find((r) => r.id === cleanup.id)?.title || '' : '')"
      :message="cleanup ? cleanup.desc : ''"
      :detail="cleanupStep === 1 ? '点击“继续”进入第二次确认。' : '再次确认：操作不可撤销，请谨慎。'"
      :confirm-text="cleanupStep === 1 ? '继续' : '确认清理'"
      danger
      @cancel="cleanup = null"
      @confirm="cleanupStep === 1 ? (cleanupStep = 2) : doCleanup()"
    />

    <!-- 导入确认 -->
    <ConfirmDialog
      :show="importOpen"
      title="导入数据文件"
      message="导入将覆盖当前全部数据（含媒体文件），是否继续？"
      detail="建议先「导出数据文件」备份当前内容。"
      confirm-text="覆盖并导入"
      danger
      @cancel="importOpen = false"
      @confirm="doImport"
    />

    <!-- 恢复出厂（输入确认句） -->
    <Modal :show="resetOpen" title="恢复出厂设置" width="min(520px,100%)" @close="cancelReset">
      <div class="reset-modal">
        <div class="rm-ic"><Icon name="trash" :size="26" /></div>
        <p class="rm-title">此操作将清空本设备上的全部内容</p>
        <ul class="rm-list">
          <li>姓名、头像、称号与看板设置</li>
          <li>考试模板、考试记录、专注记录</li>
          <li>证书与奖状（含图片）</li>
          <li>计划、打卡天数、勋章、心情日记</li>
          <li>全部上传的音频与图片</li>
        </ul>
        <div class="rm-note">
          <Icon name="info" :size="15" />
          清空后不可恢复，建议先「导出数据文件」备份。
        </div>
        <div class="field">
          <label>请输入以下内容确认（不含引号）：</label>
          <div class="phrase-demo">“{{ RESET_PHRASE }}”</div>
          <input
            v-model="resetPhrase"
            class="input rm-input"
            maxlength="40"
            :placeholder="RESET_PHRASE"
            @keyup.enter="doReset"
          />
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-ghost" @click="cancelReset">取消</button>
        <button class="btn btn-danger" :disabled="!resetMatched || resetBusy" @click="doReset">
          <Icon name="trash" :size="15" />
          {{ resetBusy ? "正在清空…" : "确认并恢复出厂" }}
        </button>
      </div>
    </Modal>
  </div>
</template>

<style scoped>
.comp {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comp-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
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

.form-grid {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 22px;
}

@media (max-width: 640px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}

.avatar-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.ds-v-ring {
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

.avatar-ops {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: center;
}

.fields-cell {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

.lock-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.lock-label label {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-2);
}

.lock-hint {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11.5px;
  color: var(--ink-3);
  padding: 3px 8px;
  border-radius: 999px;
  background: var(--bg-2);
}

.lock-hint:hover {
  color: var(--accent);
}

.input-row {
  position: relative;
}

.mark-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.mark-opt {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: 1.5px solid var(--line);
  background: var(--surface-2);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.18s, transform 0.15s, box-shadow 0.18s;
}
.mark-opt:hover {
  border-color: var(--accent);
  transform: translateY(-1px);
}
.mark-opt.on {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-tint);
}
.mark-opt-img {
  width: 26px;
  height: 26px;
  object-fit: contain;
}

.lock-badge-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  padding: 3px;
  border-radius: 8px;
}

.lock-badge-btn .v-mark {
  width: 20px;
  height: 20px;
  border-radius: 6px;
  background: var(--v-yellow);
  color: #3a2a00;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.row-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 4px 2px;
}

.sw-label {
  font-size: 14px;
  font-weight: 600;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sw-label small {
  font-size: 11.5px;
  color: var(--ink-3);
  font-weight: 400;
}

.sw {
  width: 48px;
  height: 28px;
  border-radius: 999px;
  background: var(--bg-2);
  position: relative;
  transition: background-color 0.2s;
  flex: none;
}

.sw.on {
  background: var(--accent);
}

.sw-knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  transition: transform 0.22s var(--ease-out);
}

.sw.on .sw-knob {
  transform: translateX(20px);
}

.data-box {
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 16px 18px;
  background: var(--surface-2);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.box-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 750;
  font-size: 14.5px;
}

.btn-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.dev-modal {
  padding: 16px 22px 22px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  cursor: default;
}

.dev-tip {
  font-size: 14px;
  line-height: 1.7;
  color: var(--ink-2);
}

.pass-row {
  display: flex;
  gap: 8px;
}

.pass-row .input {
  flex: 1;
  text-align: center;
  letter-spacing: 0.4em;
}

.storage-list {
  padding: 4px 22px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 55vh;
  overflow-y: auto;
}

.backup-preview {
  padding: 8px 22px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.backup-ta {
  min-height: 46vh;
  font-family: Consolas, Menlo, monospace;
  font-size: 11.5px;
  line-height: 1.5;
  background: var(--surface-2);
}

/* 恢复出厂 */
.reset-box {
  border: 1px solid #ecd3c9;
  background: linear-gradient(180deg, #fdf6f3, #f9ece7);
  border-radius: 18px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.reset-head {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1;
}

.reset-ic {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: var(--danger-tint);
  color: var(--danger);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
}

.reset-text {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.reset-text b {
  font-size: 14.5px;
}

.reset-text span {
  font-size: 12px;
  color: var(--ink-2);
  line-height: 1.55;
}

.reset-modal {
  padding: 8px 22px 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
}

.rm-ic {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background: var(--danger-tint);
  color: var(--danger);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.rm-title {
  font-size: 16px;
  font-weight: 800;
}

.rm-list {
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: var(--ink-2);
  list-style: disc;
  padding-left: 18px;
}

.rm-note {
  display: inline-flex;
  align-items: flex-start;
  gap: 7px;
  font-size: 12.5px;
  color: var(--warn);
  background: var(--warn-tint);
  padding: 8px 12px;
  border-radius: 12px;
  line-height: 1.5;
}

.reset-modal .field {
  width: 100%;
  text-align: left;
}

.phrase-demo {
  font-size: 14px;
  font-weight: 700;
  color: var(--danger);
  background: var(--danger-tint);
  padding: 7px 12px;
  border-radius: 10px;
  margin-bottom: 8px;
  text-align: center;
}

.rm-input {
  text-align: center;
}

.store-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 9px 12px;
  border: 1px solid var(--line);
  border-radius: 13px;
}

.store-ic {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: var(--bg-2);
  color: var(--ink-2);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
}

.store-ic.danger {
  background: var(--danger-tint);
  color: var(--danger);
}

.store-main {
  flex: 1;
  min-width: 0;
}

.store-title {
  display: block;
  font-weight: 650;
  font-size: 13.5px;
}

.store-sub {
  font-size: 11.5px;
  color: var(--ink-3);
}
</style>
