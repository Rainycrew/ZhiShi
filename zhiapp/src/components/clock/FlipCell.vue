<script setup>
// 翻页数字：每次数值变化时数字卡片以翻页动画重新翻入
// 单一数据源 + 动画随 key 重放，不存在双面状态错位 / 闪 0 的问题
defineProps({
  value: { type: [String, Number], default: "0" }
});
</script>

<template>
  <span class="flip-cell">
    <span class="digit tnum" :key="String(value)">{{ value }}</span>
  </span>
</template>

<style scoped>
.flip-cell {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 0.74em;
  height: 1.1em;
  perspective: 760px;
}

.digit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  border-radius: 0.14em;
  background: linear-gradient(180deg, #30353c 0%, #1b1e23 100%);
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 6px 22px rgba(0, 0, 0, 0.4), inset 0 -2px 6px rgba(0, 0, 0, 0.5);
  color: #fbfaf5;
  font-weight: 700;
  line-height: 1;
  transform-origin: 50% 100%;
  will-change: transform, opacity;
  animation: flip-in 0.5s cubic-bezier(0.2, 0.7, 0.3, 1) both;
}

@keyframes flip-in {
  0% {
    transform: rotateX(92deg);
    opacity: 0.3;
  }
  45% {
    opacity: 1;
  }
  100% {
    transform: rotateX(0deg);
    opacity: 1;
  }
}
</style>
