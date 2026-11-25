import { state } from "../store/state.js";
import { ACHIEVEMENTS, computeStats, TIER_NAME } from "./achievements.js";
import { EXPORT_STYLE } from "./exportStyle.js";
import { dayKey, longestStreak, pad2 } from "../utils.js";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result).split(",")[1] || "");
    fr.onerror = () => reject(fr.error);
    fr.readAsDataURL(blob);
  });
}

// 把「学习时长 / 打卡 / 勋章」绘制成一张竖版成就卡并保存
export function exportStatsCard() {
  return new Promise((resolve, reject) => {
    const s = computeStats();
    const W = EXPORT_STYLE.w || 1080;
    const H = EXPORT_STYLE.h || 1560;
    const cv = document.createElement("canvas");
    cv.width = W;
    cv.height = H;
    const ctx = cv.getContext("2d");
    if (!ctx) return reject(new Error("canvas 不可用"));

    const ink = EXPORT_STYLE.colors.ink;
    const card = EXPORT_STYLE.colors.card;
    const accent = EXPORT_STYLE.colors.accent;
    const gold = EXPORT_STYLE.colors.gold;
    const txt = EXPORT_STYLE.colors.txt;
    const sub = EXPORT_STYLE.colors.sub;

    // 背景
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, EXPORT_STYLE.colors.bg1);
    bg.addColorStop(1, EXPORT_STYLE.colors.bg2);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // 装饰圆
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(W - 120, 120, 260, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.05;
    ctx.fillStyle = gold;
    ctx.beginPath();
    ctx.arc(60, H - 160, 320, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.font = "600 30px sans-serif";
    ctx.fillStyle = sub;
    ctx.fillText("ZHISHI · 学习成就卡", 90, 100);

    // 头部
    ctx.font = "800 84px sans-serif";
    ctx.fillStyle = txt;
    const nm = state.profile.name || "知时用户";
    ctx.fillText(nm, 90, 220);
    ctx.font = "600 34px sans-serif";
    ctx.fillStyle = accent;
    ctx.fillText(`${state.records.length > 0 ? "把时间用在学习上的人" : "今天也要加油"}`, 90, 290);

    // 主要数字卡
    const stats = [
      { v: fmtMin2(s.totalFocusMin), l: "专注时长" },
      { v: s.checkinTotal + " 天", l: "打卡天数" },
      { v: longestStreak(state.checkins.map((c) => c.date)) + " 天", l: "最长连续" },
      { v: Object.keys(state.achievements).length + " 枚", l: "已获勋章" },
      { v: s.examDone + " 场", l: "完成考试" },
      { v: s.certCount + " / " + s.awardCount, l: "证书 / 奖状" }
    ];
    let x = 90;
    let y = 400;
    const bw = 300;
    const bh = 210;
    stats.forEach((st, i) => {
      const cx = x + (i % 3) * (bw + 30);
      const cy = y + Math.floor(i / 3) * (bh + 30);
      ctx.fillStyle = card;
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 2;
      roundRect(ctx, cx, cy, bw, bh, 34);
      ctx.fill();
      ctx.stroke();
      ctx.font = "800 70px sans-serif";
      ctx.fillStyle = i % 3 === 2 ? gold : accent;
      ctx.textAlign = "center";
      ctx.fillText(st.v, cx + bw / 2, cy + 105);
      ctx.font = "500 30px sans-serif";
      ctx.fillStyle = sub;
      ctx.fillText(st.l, cx + bw / 2, cy + 160);
      ctx.textAlign = "left";
    });

    // 已解锁勋章
    y += bh * 2 + 70;
    ctx.font = "600 34px sans-serif";
    ctx.fillStyle = txt;
    ctx.fillText("已解锁勋章", 90, y);
    const unlocked = ACHIEVEMENTS.filter((a) => state.achievements[a.id]);
    y += 30;
    if (!unlocked.length) {
      ctx.font = "400 30px sans-serif";
      ctx.fillStyle = sub;
      ctx.fillText("暂无，去完成打卡与专注任务吧", 90, y + 70);
    } else {
      const show = unlocked.slice(0, 6);
      show.forEach((a, i) => {
        const col = Math.floor(i / 2);
        const row = i % 2;
        const cx = 90 + col * 500;
        const cy2 = y + 10 + row * 90;
        ctx.fillStyle = card;
        roundRect(ctx, cx, cy2, 470, 74, 22);
        ctx.fill();
        ctx.fillStyle = gold;
        ctx.beginPath();
        ctx.arc(cx + 44, cy2 + 37, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#241d02";
        ctx.font = "800 24px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("V", cx + 44, cy2 + 45);
        ctx.textAlign = "left";
        ctx.fillStyle = txt;
        ctx.font = "600 30px sans-serif";
        ctx.fillText(a.name, cx + 78, cy2 + 44);
        ctx.fillStyle = sub;
        ctx.font = "400 22px sans-serif";
        ctx.fillText("· " + (TIER_NAME[a.tier] || "") + "级", cx + 78, cy2 + 68);
      });
    }

    // 脚注
    const d = new Date();
    ctx.font = "500 28px sans-serif";
    ctx.fillStyle = sub;
    ctx.textAlign = "center";
    ctx.fillText(
      `生成于 ${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} · 知时APP`,
      W / 2,
      H - 80
    );
    ctx.textAlign = "left";

    cv.toBlob(async (blob) => {
      if (!blob) return reject(new Error("生成失败"));
      const fileName = `zhishi-成就卡-${dayKey()}.png`;
      // 原生：写入应用目录并拉起系统分享（可存相册/文件）
      if (Capacitor.isNativePlatform()) {
        try {
          const base64 = await blobToBase64(blob);
          const { uri } = await Filesystem.writeFile({ path: fileName, data: base64, directory: Directory.Cache });
          await Share.share({ title: "知时成就卡", files: [uri], dialogTitle: "分享 / 保存成就卡" });
          return resolve("share");
        } catch (e) {
          console.warn("成就卡原生保存失败，回退下载", e);
        }
      }
      const file = new File([blob], fileName, { type: "image/png" });
      // 网页：优先系统分享
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: "知时成就卡" });
          return resolve("share");
        } catch (e) {
          if (e && e.name === "AbortError") return resolve("cancel");
        }
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      resolve("download");
    }, "image/png");
  });
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fmtMin2(m) {
  m = Math.round(m);
  if (m < 60) return m + " 分";
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return mm ? `${h}时${mm}分` : `${h} 小时`;
}
