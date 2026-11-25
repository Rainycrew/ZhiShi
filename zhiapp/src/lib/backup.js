import { state } from "../store/state.js";
import { media } from "../store/media.js";
import { evaluateAchievements } from "./achievements.js";
import { dayKey } from "../utils.js";
import { toast } from "../ui.js";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

// ============ 全量数据备份 / 恢复（无后端，导出为 JSON 文件） ============

function snapState() {
  return JSON.parse(JSON.stringify(state));
}

async function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = () => reject(fr.error);
    fr.readAsDataURL(blob);
  });
}

async function collectMedia() {
  const rows = await media.list();
  const out = [];
  for (const r of rows) {
    try {
      const dataUrl = await blobToDataUrl(r.blob);
      out.push({
        key: r.key,
        name: r.name,
        mime: r.mime,
        size: r.size,
        addedAt: r.addedAt,
        dataUrl
      });
    } catch (e) {}
  }
  return out;
}

export async function buildBackup() {
  const mediaRows = await collectMedia();
  const payload = {
    app: "zhishi-pad",
    version: 2,
    exportedAt: Date.now(),
    state: snapState(),
    media: mediaRows
  };
  return {
    json: JSON.stringify(payload),
    fileName: `zhishi-backup-${dayKey()}.json`,
    size: mediaRows.length
  };
}

export async function exportAll() {
  const { json, fileName } = await buildBackup();
  // 原生：写入文档目录并拉起系统分享（可存到文件/发送）
  if (Capacitor.isNativePlatform()) {
    try {
      const { uri } = await Filesystem.writeFile({ path: fileName, data: json, directory: Directory.Documents });
      await Share.share({ title: "知时数据备份", files: [uri], dialogTitle: "保存 / 分享备份" });
      return { status: "share", fileName };
    } catch (e) {
      console.warn("备份原生保存失败，回退下载", e);
    }
  }
  // 优先让用户选择保存目录（Chromium），否则浏览器下载
  const save = window.showSaveFilePicker;
  if (save) {
    try {
      const handle = await save({ suggestedName: fileName, types: [{ description: "知时备份", accept: { "application/json": [".json"] } }] });
      const writable = await handle.createWritable();
      await writable.write(json);
      await writable.close();
      return { status: "saved" };
    } catch (e) {
      if (e && e.name === "AbortError") return { status: "cancel" };
      // 其它错误：降级到普通下载
    }
  }
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return { status: "download", fileName };
}

export async function importFile(file) {
  const text = await file.text();
  const data = JSON.parse(text);
  if (!data || data.app !== "zhishi-pad" || !data.state) {
    throw new Error("不是有效的知时备份文件");
  }
  const st = data.state;
  const need = ["profile", "templates", "records", "certs", "awards", "clock", "plans", "checkins", "focus", "diary", "achievements"];
  need.forEach((k) => {
    if (!(k in st)) throw new Error("备份文件缺少字段：" + k);
  });

  // 1) 清空媒体并写回
  const old = await media.list();
  await media.removeMany(old.map((r) => r.key));
  const mediaRows = Array.isArray(data.media) ? data.media : [];
  for (const m of mediaRows) {
    try {
      const res = await fetch(m.dataUrl);
      const blob = await res.blob();
      await media.putAs(m.key, new File([blob], m.name || "media", { type: m.mime || "" }));
    } catch (e) {}
  }

  // 2) 覆盖状态
  const base = { profile: {}, clock: {} };
  Object.assign(state.profile, base.profile, st.profile);
  state.templates = st.templates || [];
  state.records = st.records || [];
  state.certs = st.certs || [];
  state.awards = st.awards || [];
  Object.assign(state.clock, base.clock, st.clock);
  state.plans = st.plans || [];
  state.checkins = st.checkins || [];
  state.focus = st.focus || [];
  state.diary = st.diary || [];
  state.achievements = st.achievements || {};
  // v3：积分 / 皮肤 / 毛玻璃 / 连续奖励里程碑（旧备份缺失时给默认）
  state.points = Number.isFinite(st.points) ? st.points : 5;
  state.streakRewarded = Array.isArray(st.streakRewarded) ? st.streakRewarded : [];
  state.dailyRewarded = Array.isArray(st.dailyRewarded) ? st.dailyRewarded : [];
  state.skins = {
    owned: Array.isArray(st.skins?.owned) ? st.skins.owned : ["bi"],
    equipped: st.skins?.equipped || "bi"
  };
  state.glass = {
    owned: !!st.glass?.owned,
    equipped: !!st.glass?.equipped
  };
  const slotDef = (v) => ({ owned: Array.isArray(v?.owned) ? v.owned : [], equipped: v?.equipped || null });
  state.clockskin = slotDef(st.clockskin);
  state.theme = slotDef(st.theme);
  state.cardskin = slotDef(st.cardskin);
  state.avatarframe = slotDef(st.avatarframe);
  state.mark = {
    owned: Array.isArray(st.mark?.owned) && st.mark.owned.length ? st.mark.owned : ["yelloV"],
    equipped: st.mark?.equipped || "yelloV"
  };
  state.noiseskin = slotDef(st.noiseskin);

  evaluateAchievements();
  return true;
}

export function downloadTemplate() {
  toast("请在个人主页「数据与设置」中操作");
}
