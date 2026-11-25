import { ref, onBeforeUnmount, onMounted } from "vue";

// 每秒更新的当前时间
export function useNow(interval = 1000) {
  const now = ref(new Date());
  let timer = null;

  onMounted(() => {
    timer = setInterval(() => {
      now.value = new Date();
    }, interval);
  });

  onBeforeUnmount(() => {
    if (timer) clearInterval(timer);
  });

  return now;
}
