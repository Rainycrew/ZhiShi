<script setup>
import { toasts } from "../ui.js";
</script>

<template>
  <Teleport to="body">
    <div class="toast-host">
      <TransitionGroup name="toast">
        <div v-for="t in toasts" :key="t.id" class="toast" :class="`toast-${t.type}`">
          {{ t.message }}
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-host {
  position: fixed;
  left: 50%;
  bottom: calc(var(--nav-h) + 26px + var(--safe-b));
  transform: translateX(-50%);
  z-index: 200;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  pointer-events: none;
  width: max-content;
  max-width: min(92vw, 520px);
}

.toast {
  background: rgba(32, 35, 30, 0.94);
  color: #f7f6f1;
  padding: 10px 18px;
  border-radius: 999px;
  font-size: 13.5px;
  font-weight: 500;
  box-shadow: 0 12px 30px -10px rgba(20, 22, 18, 0.5);
  backdrop-filter: blur(6px);
  text-align: center;
  max-width: 100%;
}

.toast-danger {
  background: rgba(148, 47, 33, 0.96);
}

.toast-err {
  background: rgba(178, 74, 51, 0.96);
}

.toast-ach {
  background: linear-gradient(135deg, rgba(196, 140, 24, 0.98), rgba(146, 96, 8, 0.98));
  box-shadow: 0 12px 30px -8px rgba(120, 84, 10, 0.55);
  font-weight: 700;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.28s var(--ease-out);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
