// 音频文件夹 manifest 读取：public/audio/manifest.json
// manifest 形如 [{"file":"start.wav","label":"开考提示","hint":"考试开始时播放"}]

import { AUDIO_DIR } from "../config.js";

let cache = null;

export async function loadManifest() {
  if (cache) return cache;
  try {
    const base = import.meta.env.BASE_URL || "./";
    const res = await fetch(`${base}${AUDIO_DIR}manifest.json`, { cache: "no-store" });
    if (!res.ok) throw new Error("manifest not found");
    cache = await res.json();
  } catch (e) {
    cache = [];
  }
  return cache || [];
}

export function fileUrl(file) {
  const base = import.meta.env.BASE_URL || "./";
  const segs = String(file).split("/");
  return `${base}${AUDIO_DIR}${segs.map(encodeURIComponent).join("/")}`;
}

export async function refreshManifest() {
  cache = null;
  return loadManifest();
}
