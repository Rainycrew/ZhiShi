// 生成 public/audio/ 下的占位提示音（WAV 正弦音），用户可后续用真实音频替换同名文件。
// 用法：node scripts/generate-placeholder-audio.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public", "audio");
mkdirSync(outDir, { recursive: true });

const SR = 22050;

function build(segments, gain = 0.5) {
  // segments: [{f, t0, dur, amp}] 正弦叠加，t 秒
  const len = Math.ceil((segments.reduce((m, s) => Math.max(m, s.t0 + s.dur), 0) + 0.15) * SR);
  const samples = new Float32Array(len);
  for (const s of segments) {
    const start = Math.floor(s.t0 * SR);
    const n = Math.floor(s.dur * SR);
    for (let i = 0; i < n; i++) {
      const idx = start + i;
      if (idx >= len) break;
      const env = Math.min(1, i / 80, (n - i) / 160); // 淡入淡出防爆音
      samples[idx] += s.amp * Math.sin((2 * Math.PI * s.f * i) / SR) * env;
    }
  }
  // 16-bit PCM
  const data = Buffer.alloc(len * 2);
  for (let i = 0; i < len; i++) {
    let v = Math.max(-1, Math.min(1, samples[i] * gain));
    data.writeInt16LE(Math.round(v * 32767), i * 2);
  }
  return data;
}

function wavHeader(dataLen) {
  const b = Buffer.alloc(44);
  b.write("RIFF", 0);
  b.writeUInt32LE(36 + dataLen, 4);
  b.write("WAVE", 8);
  b.write("fmt ", 12);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20); // PCM
  b.writeUInt16LE(1, 22); // mono
  b.writeUInt32LE(SR, 24);
  b.writeUInt32LE(SR * 2, 28);
  b.writeUInt16LE(2, 32);
  b.writeUInt16LE(16, 34);
  b.write("data", 36);
  b.writeUInt32LE(dataLen, 40);
  return b;
}

function save(name, segments, gain) {
  const data = build(segments, gain);
  writeFileSync(join(outDir, name), Buffer.concat([wavHeader(data.length), data]));
  console.log("生成", name);
}

// 开考提示：两声上行 + 高音
save("start.wav", [
  { f: 659.25, t0: 0.0, dur: 0.16, amp: 0.9 },
  { f: 659.25, t0: 0.2, dur: 0.12, amp: 0.85 },
  { f: 987.77, t0: 0.34, dur: 0.4, amp: 0.95 }
]);

// 提醒：三连短音
save(
  "warn.wav",
  [0, 1, 2].map((i) => ({ f: 880, t0: i * 0.24, dur: 0.12, amp: 0.9 }))
);

// 结束：下行长音
save("end.wav", [
  { f: 659.25, t0: 0.0, dur: 0.28, amp: 0.9 },
  { f: 523.25, t0: 0.3, dur: 0.3, amp: 0.9 },
  { f: 392.0, t0: 0.62, dur: 0.7, amp: 0.95 }
]);

// 自定义：单音叮
save("custom.wav", [{ f: 783.99, t0: 0.0, dur: 0.5, amp: 0.95 }]);

console.log("完成。将真实音频放入 public/audio/ 并保持同名即可替换。");
