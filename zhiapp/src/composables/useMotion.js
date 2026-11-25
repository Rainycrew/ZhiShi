import { onMounted, onUnmounted } from "vue";
import { gsap } from "gsap";

// 页面级动效工具（GSAP）
//   [data-reveal]  入场淡入上移
//   [data-count]   数字从 0 滚动到 data-count（data-prec=1 保留一位小数）
//   [data-float]   轻微上下漂浮（装饰物）
// 自动响应 prefers-reduced-motion，组件卸载时全部回收
export function usePageMotion(rootRef, opts = {}) {
  let mm = null;

  onMounted(() => {
    const root = rootRef.value;
    if (!root) return;
    mm = gsap.matchMedia();

    mm.add(
      {
        motion: "(prefers-reduced-motion: no-preference)",
        isDesktop: "(min-width: 900px)"
      },
      (ctx) => {
        const { motion } = ctx.conditions;
        if (!motion) return () => {};

        // 1) 数字滚动
        root.querySelectorAll("[data-count]").forEach((el) => {
          const end = parseFloat(el.getAttribute("data-count") || "0");
          if (!isFinite(end)) return;
          const precise = el.getAttribute("data-prec") === "1";
          const obj = { v: 0 };
          gsap.to(obj, {
            v: end,
            duration: 1.2,
            ease: "power2.out",
            delay: 0.15,
            onUpdate() {
              el.textContent = precise ? obj.v.toFixed(1) : Math.round(obj.v).toString();
            }
          });
        });

        // 2) 入场元素（transform + opacity，避免布局抖动）
        const reveals = root.querySelectorAll("[data-reveal]");
        if (reveals.length) {
          gsap.set(reveals, { autoAlpha: 0, y: 20 });
          gsap.to(reveals, {
            autoAlpha: 1,
            y: 0,
            duration: 0.7,
            ease: "power3.out",
            stagger: 0.06,
            delay: 0.05
          });
        }

        // 3) 漂浮装饰
        root.querySelectorAll("[data-float]").forEach((el, i) => {
          gsap.to(el, {
            y: i % 2 ? 16 : -14,
            duration: 2.6 + i * 0.4,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
            delay: i * 0.2
          });
        });

        return () => {};
      },
      root
    );
  });

  onUnmounted(() => {
    if (mm) mm.revert();
  });
}

// 卡片聚焦微反馈（用一次即可，卸载时自动随 matchMedia 回收）
export function cardTilt(rootRef) {
  const mm = gsap.matchMedia();
  mm.add(
    { motion: "(prefers-reduced-motion: no-preference)", wide: "(min-width: 900px)" },
    () => {
      const root = rootRef.value;
      if (!root) return () => {};
      const cards = root.querySelectorAll("[data-tilt]");
      if (!cards.length) return () => {};
      cards.forEach((card) => {
        const to = gsap.quickTo(card, "y", { duration: 0.5, ease: "power3.out" });
        card.addEventListener("mouseenter", () => to(-5));
        card.addEventListener("mouseleave", () => to(0));
      });
      return () => {};
    }
  );
  return mm;
}
