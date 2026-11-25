<script setup>
import Icon from "./Icon.vue";

defineProps({
  show: Boolean,
  title: { type: String, default: "" },
  width: { type: String, default: "min(560px, 100%)" }
});
const emit = defineEmits(["close"]);
</script>

<template>
  <Teleport to="body">
    <Transition name="overlay">
      <div v-if="show" class="overlay" @click.self="emit('close')">
        <div class="modal-card pop" :style="{ width }" role="dialog" aria-modal="true">
          <div v-if="title" class="modal-head">
            <h3 class="modal-title">{{ title }}</h3>
            <button class="icon-btn" aria-label="关闭" @click="emit('close')">
              <Icon name="x" :size="19" />
            </button>
          </div>
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
