<script setup>
import Modal from "./Modal.vue";
import Icon from "./Icon.vue";

const props = defineProps({
  show: Boolean,
  title: { type: String, default: "确认操作" },
  message: { type: String, default: "" },
  detail: { type: String, default: "" },
  confirmText: { type: String, default: "确认" },
  cancelText: { type: String, default: "取消" },
  danger: Boolean
});
const emit = defineEmits(["confirm", "cancel"]);
</script>

<template>
  <Modal :show="show" :title="title" @close="emit('cancel')">
    <div class="confirm-body">
      <p class="confirm-msg">{{ message }}</p>
      <p v-if="detail" class="confirm-detail">{{ detail }}</p>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" @click="emit('cancel')">{{ cancelText }}</button>
      <button class="btn" :class="danger ? 'btn-danger' : 'btn-primary'" @click="emit('confirm')">
        <Icon :name="danger ? 'trash' : 'check'" :size="16" />
        {{ confirmText }}
      </button>
    </div>
  </Modal>
</template>

<style scoped>
.confirm-body {
  padding: 8px 22px 4px;
}

.confirm-msg {
  font-size: 15px;
  line-height: 1.65;
}

.confirm-detail {
  margin-top: 10px;
  font-size: 13px;
  color: var(--ink-3);
  background: var(--surface-2);
  border: 1px dashed var(--line);
  border-radius: 12px;
  padding: 10px 14px;
  line-height: 1.6;
}
</style>
