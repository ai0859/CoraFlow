<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="modal-overlay" @click="handleOverlayClick">
        <div class="modal-container" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title">{{ title }}</h3>
            <button v-if="showClose" class="modal-close" @click="handleCancel">×</button>
          </div>
          <div class="modal-body">
            <p class="modal-message">{{ message }}</p>
          </div>
          <div class="modal-footer">
            <button
              v-if="showCancel"
              class="modal-btn modal-btn-cancel"
              @click="handleCancel"
            >
              {{ cancelText }}
            </button>
            <button
              class="modal-btn modal-btn-confirm"
              :class="{ 'modal-btn-danger': type === 'danger' }"
              @click="handleConfirm"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
export type ModalType = 'info' | 'success' | 'warning' | 'danger'

interface Props {
  visible: boolean
  title?: string
  message: string
  type?: ModalType
  confirmText?: string
  cancelText?: string
  showCancel?: boolean
  showClose?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '提示',
  type: 'info',
  confirmText: '确定',
  cancelText: '取消',
  showCancel: false,
  showClose: true,
})

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  emit('cancel')
}

const handleOverlayClick = () => {
  if (props.showClose) {
    handleCancel()
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-container {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
}

.modal-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.modal-close {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  font-size: 20px;
  color: #999;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.modal-close:hover {
  background: #f0f0f0;
  color: #666;
}

.modal-body {
  padding: 20px;
}

.modal-message {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: #555;
  word-break: break-word;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #e0e0e0;
  background: #fafafa;
}

.modal-btn {
  padding: 8px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.modal-btn-cancel {
  background: #e0e0e0;
  color: #666;
}

.modal-btn-cancel:hover {
  background: #d0d0d0;
}

.modal-btn-confirm {
  background: #4a9eff;
  color: white;
}

.modal-btn-confirm:hover {
  background: #3a8eef;
}

.modal-btn-danger {
  background: #f44336;
}

.modal-btn-danger:hover {
  background: #e53935;
}

/* 过渡动画 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.9);
  opacity: 0;
}
</style>
