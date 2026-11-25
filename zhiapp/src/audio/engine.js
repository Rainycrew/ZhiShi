// ============ 音频引擎 ============
// 1) 内置提示音：WebAudio 合成，不依赖任何文件
// 2) 单文件播放器：管理当前正在播放的一次性音频（节点提示音）
// 3) 听力播放器：持续播放，支持暂停/跳转/重播，供管理员控制

let audioCtx = null;

export function getCtx() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) audioCtx = new AC();
  }
  if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function env(gainNode, t0, peak, dur) {
  const g = gainNode.gain;
  g.setValueAtTime(0.0001, t0);
  g.exponentialRampToValueAtTime(peak, t0 + 0.02);
  g.exponentialRampToValueAtTime(0.0001, t0 + dur);
}

function tone(freq, t0, dur, peak = 0.16, type = "sine") {
  const ctx = getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  env(gain, t0, peak, dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

// toneId: begin | warn | end | ding
export function playBuiltin(toneId) {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  switch (toneId) {
    case "begin": {
      tone(659.25, now, 0.16, 0.14);
      tone(659.25, now + 0.2, 0.12, 0.12);
      tone(987.77, now + 0.34, 0.34, 0.15);
      break;
    }
    case "warn": {
      for (let i = 0; i < 3; i++) {
        tone(880, now + i * 0.24, 0.11, 0.13, "triangle");
      }
      break;
    }
    case "end": {
      tone(523.25, now, 0.28, 0.14);
      tone(392, now + 0.3, 0.3, 0.14);
      tone(329.63, now + 0.62, 0.55, 0.15);
      break;
    }
    case "ding": {
      tone(783.99, now, 0.2, 0.14);
      tone(1174.66, now + 0.1, 0.34, 0.12);
      break;
    }
    default:
      tone(880, now, 0.2, 0.12);
  }
}

// ---------- 一次性提示音播放 ----------
let _oneShot = null;
export function stopOneShot() {
  if (_oneShot) {
    _oneShot.pause();
    _oneShot = null;
  }
}

export function playUrlOnce(url) {
  stopOneShot();
  const el = new Audio();
  el.src = url;
  el.volume = 0.9;
  el.play().catch(() => {});
  _oneShot = el;
  return el;
}

// ---------- 听力播放器（持续播放、可管理） ----------
export class ListeningPlayer {
  constructor() {
    this.el = new Audio();
    this.el.preload = "auto";
    this._src = null;
    this._objectUrl = null;
    this.onState = null; // 回调：当前状态变化
    this.el.addEventListener("timeupdate", () => this.onState && this.onState());
    this.el.addEventListener("ended", () => this.onState && this.onState());
    this.el.addEventListener("play", () => this.onState && this.onState());
    this.el.addEventListener("pause", () => this.onState && this.onState());
  }

  async loadUrl(url) {
    this.stop();
    this._src = url;
    this.el.src = url;
  }

  async loadObjectUrl(objUrl) {
    if (this._objectUrl) URL.revokeObjectURL(this._objectUrl);
    this._objectUrl = objUrl;
    await this.loadUrl(objUrl);
  }

  get src() {
    return this._src;
  }

  play() {
    return this.el.play().catch(() => {});
  }

  pause() {
    this.el.pause();
  }

  stop() {
    this.el.pause();
    try {
      this.el.currentTime = 0;
    } catch (e) {}
  }

  get paused() {
    return this.el.paused;
  }

  get ended() {
    return this.el.ended;
  }

  get duration() {
    return isFinite(this.el.duration) ? this.el.duration : 0;
  }

  get currentTime() {
    return this.el.currentTime;
  }

  seek(t) {
    if (isFinite(this.el.duration) && t >= 0) {
      this.el.currentTime = Math.min(t, this.el.duration);
    }
  }

  setVolume(v) {
    this.el.volume = Math.min(1, Math.max(0, v));
  }

  destroy() {
    this.stop();
    if (this._objectUrl) URL.revokeObjectURL(this._objectUrl);
    this._objectUrl = null;
  }
}
