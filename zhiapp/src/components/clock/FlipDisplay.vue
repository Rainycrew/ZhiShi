<script setup>
import FlipCell from "./FlipCell.vue";

// 翻页数字显示器：parts=['12','34','56'] → 12:34:56
const props = defineProps({
  parts: { type: Array, required: true }, // 每个元素为 2 位数字字符串
  sep: { type: String, default: ":" },
  blink: Boolean
});
</script>

<template>
  <span class="fd">
    <template v-for="(p, i) in parts" :key="i">
      <span v-if="i" class="fd-sep" :class="{ blink: blink }">{{ sep }}</span>
      <span class="fd-part">
        <FlipCell :value="p[0]" />
        <FlipCell :value="p[1]" />
      </span>
    </template>
  </span>
</template>

<style scoped>
.fd {
  display: inline-flex;
  align-items: center;
  gap: 0.04em;
  font-size: inherit;
  line-height: 1;
}

.fd-part {
  display: inline-flex;
  gap: 0.03em;
}

.fd-sep {
  margin: 0 0.08em;
  color: rgba(255, 255, 255, 0.55);
  font-weight: 600;
  transform: translateY(-0.06em);
}

.fd-sep.blink {
  animation: sep-pulse 1s steps(1) infinite;
}

@keyframes sep-pulse {
  0%,
  49% {
    opacity: 1;
  }
  50%,
  100% {
    opacity: 0.15;
  }
}
</style>
