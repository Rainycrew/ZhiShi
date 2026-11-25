<script setup>
import { computed } from "vue";
import { state } from "../store/state.js";
import { markImgUrl } from "../lib/skins.js";
import Icon from "./Icon.vue";

// 标识（称号/头像旁的徽章）：默认 public/img/yelloV.png；商城里买的徽章在 public/img/chenghao/
const props = defineProps({
  size: { type: Number, default: 18 }
});

const markUrl = computed(() => markImgUrl(state.mark.equipped || "yelloV"));
const useImg = computed(() => !!markUrl.value);
</script>

<template>
  <span
    class="vmark"
    :class="{ imaged: useImg }"
    :style="{
      width: size + 'px',
      height: size + 'px',
      borderRadius: useImg ? '0px' : Math.round(size * 0.3) + 'px'
    }"
  >
    <img v-if="useImg" :src="markUrl" class="vmark-img" alt="V" />
    <Icon v-else name="check" :size="Math.round(size * 0.62)" :stroke="3" />
  </span>
</template>

<style scoped>
.vmark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  background: linear-gradient(180deg, #ffe27a, #f0b60e);
  color: #3c2b00;
  box-shadow: inset 0 -1px 2px rgba(120, 80, 0, 0.25);
  overflow: hidden;
}

.vmark.imaged {
  background: transparent;
  box-shadow: none;
}

.vmark-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
