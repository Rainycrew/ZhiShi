import { gsap } from "gsap";

// 庆祝粒子与光环（GSAP 实现，transform/opacity 驱动，无 emoji）
const PALETTE = ["#f2bf1e", "#f6d465", "#6fbf9a", "#ffffff", "#e8845c", "#9fe0bd"];

let layer = null;
function ensureLayer() {
  if (!layer || !document.body.contains(layer)) {
    layer = document.createElement("div");
    layer.id = "fx-layer";
    layer.style.cssText =
      "position:fixed;inset:0;pointer-events:none;z-index:240;overflow:hidden;";
    document.body.appendChild(layer);
  }
  return layer;
}

// 在元素矩形中心炸开粒子
export function burstFromRect(rect, opts = {}) {
  if (!rect || !rect.width) return;
  const host = ensureLayer();
  const count = opts.count || 26;
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const maxDist = Math.min(rect.width + 90, Math.min(window.innerWidth / 3, 200));
  const parts = [];
  for (let i = 0; i < count; i++) {
    const p = document.createElement("i");
    const r = gsap.utils.random(5, 9);
    const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    const round = Math.random() < 0.5;
    p.style.cssText = `position:absolute;left:${cx}px;top:${cy}px;width:${r}px;height:${r}px;background:${color};border-radius:${round ? "50%" : "2px"};opacity:0.95;box-shadow:0 0 6px rgba(0,0,0,0.06);`;
    host.appendChild(p);
    parts.push(p);
    const ang = gsap.utils.random(0, Math.PI * 2);
    const dist = gsap.utils.random(30, maxDist);
    gsap.to(p, {
      x: Math.cos(ang) * dist,
      y: Math.sin(ang) * dist - 46,
      rotation: gsap.utils.random(-420, 420),
      autoAlpha: 0,
      duration: gsap.utils.random(0.7, 1.35),
      ease: "power2.out",
      delay: gsap.utils.random(0, 0.08),
      onComplete() {
        p.remove();
      }
    });
  }
  return parts;
}

// 扩散光环（涟漪）
export function ringFromRect(rect, color = "rgba(242,191,30,0.55)") {
  if (!rect || !rect.width) return;
  const host = ensureLayer();
  const size = Math.max(rect.width, rect.height) * 1.5;
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  for (let i = 0; i < 2; i++) {
    const ring = document.createElement("i");
    ring.style.cssText = `position:absolute;left:${cx - size / 2}px;top:${cy - size / 2}px;width:${size}px;height:${size}px;border:2px solid ${color};border-radius:50%;opacity:0.9;`;
    host.appendChild(ring);
    gsap.to(ring, {
      scale: 1.9,
      autoAlpha: 0,
      duration: 0.9 + i * 0.2,
      ease: "power2.out",
      delay: i * 0.14,
      onComplete() {
        ring.remove();
      }
    });
  }
}
