// 白噪音 / 雨声 / 风声（WebAudio 实时合成，无需音频文件；商城购买的白噪音皮肤则播放音频文件循环）
import { noiseSkinById, noiseSkinUrl } from "../lib/skins.js";

class NoiseEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.nodes = [];
    this.media = null; // 文件型白噪音的 <audio> 元素
    this.current = "off";
    this.volume = 0.35;
  }

  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  }

  noiseBuffer(seconds = 2, color = "white") {
    const ctx = this.ctx;
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (color === "brown") {
        last = (last + 0.02 * w) / 1.02;
        data[i] = last * 3.5;
      } else {
        data[i] = w;
      }
    }
    return buf;
  }

  stop() {
    this.nodes.forEach((n) => {
      try {
        n.stop();
      } catch (e) {}
      try {
        n.disconnect();
      } catch (e) {}
    });
    if (this.media) {
      try {
        this.media.pause();
      } catch (e) {}
    }
    this.nodes = [];
    this.current = "off";
  }

  setVolume(v) {
    this.volume = v;
    if (this.master) this.master.gain.value = v;
    if (this.media) this.media.volume = v;
  }

  play(type, volume) {
    const ctx = this.ensure();
    this.stop();
    this.volume = volume;
    if (this.master) this.master.gain.value = volume;
    this.current = type;

    // 文件型白噪音皮肤：循环播放音频文件
    const skin = noiseSkinById(type);
    if (skin) {
      if (!this.media) {
        this.media = new Audio();
        this.media.loop = true;
      }
      this.media.src = noiseSkinUrl(type);
      this.media.volume = volume;
      this.media.play().catch(() => {});
      return;
    }
    if (!ctx) return;

    const mkSrc = (color) => {
      const s = ctx.createBufferSource();
      s.buffer = this.noiseBuffer(2, color);
      s.loop = true;
      return s;
    };

    const mkLfo = (rate, depth, target) => {
      const lfo = ctx.createOscillator();
      const g = ctx.createGain();
      lfo.frequency.value = rate;
      g.gain.value = depth;
      lfo.connect(g);
      g.connect(target);
      lfo.start();
      this.nodes.push(lfo);
      return lfo;
    };

    if (type === "white") {
      const src = mkSrc("white");
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 240;
      src.connect(hp).connect(this.master);
      src.start();
      this.nodes.push(src);
    } else if (type === "rain") {
      const src = mkSrc("white");
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 1350;
      bp.Q.value = 0.35;
      const wet = ctx.createGain();
      wet.gain.value = 0.9;
      const g = ctx.createGain();
      g.gain.value = 1;
      mkLfo(0.35, 0.12, g.gain);
      src.connect(bp);
      bp.connect(g).connect(wet).connect(this.master);
      // 中低频雨幕
      const src2 = mkSrc("white");
      const bp2 = ctx.createBiquadFilter();
      bp2.type = "bandpass";
      bp2.frequency.value = 380;
      bp2.Q.value = 0.8;
      const g2 = ctx.createGain();
      g2.gain.value = 0.5;
      mkLfo(0.2, 0.1, g2.gain);
      src2.connect(bp2).connect(g2).connect(this.master);
      src.start();
      src2.start();
      this.nodes.push(src, src2);
    } else if (type === "wind") {
      const src = mkSrc("brown");
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 420;
      const g = ctx.createGain();
      g.gain.value = 1;
      const lfo = ctx.createOscillator();
      const lfoG = ctx.createGain();
      lfo.type = "sine";
      lfo.frequency.value = 0.09;
      lfoG.gain.value = 300;
      lfo.connect(lfoG);
      lfoG.connect(lp.frequency);
      lfo.start();
      src.connect(lp).connect(g).connect(this.master);
      src.start();
      this.nodes.push(src, lfo);
    }
  }
}

export const noiseEngine = new NoiseEngine();
