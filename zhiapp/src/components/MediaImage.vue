<script setup>
import { ref, watch, onBeforeUnmount } from "vue";
import { media } from "../store/media.js";

// 展示 IndexedDB 中的媒体图片（头像/证书图/背景图预览）
const props = defineProps({
  mediaKey: { type: String, default: null },
  alt: { type: String, default: "" }
});

const url = ref(null);
let curKey = null;
let objUrl = null;

async function refresh(k) {
  if (objUrl) URL.revokeObjectURL(objUrl);
  url.value = null;
  objUrl = null;
  curKey = k;
  if (!k) return;
  try {
    objUrl = await media.url(k);
    url.value = objUrl;
  } catch (e) {
    url.value = null;
  }
}

watch(
  () => props.mediaKey,
  (k) => refresh(k),
  { immediate: true }
);

onBeforeUnmount(() => {
  if (objUrl) URL.revokeObjectURL(objUrl);
});
</script>

<template>
  <img v-if="url" :src="url" :alt="alt" loading="lazy" />
</template>
