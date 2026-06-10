<template>
  <div class="workflow-editor">
    <Navbar />
    <div class="main-content">
      <Toolbar />
      <Canvas />
    </div>
    <ConfigPanel />
    <!-- 全局弹窗 -->
    <Modal
      :visible="modal.modalState.value.visible"
      :title="modal.modalState.value.title"
      :message="modal.modalState.value.message"
      :type="modal.modalState.value.type"
      :confirm-text="modal.modalState.value.confirmText"
      :cancel-text="modal.modalState.value.cancelText"
      :show-cancel="modal.modalState.value.showCancel"
      @confirm="modal.onConfirm"
      @cancel="modal.onCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import Navbar from './components/Navbar.vue'
import Toolbar from './components/Toolbar.vue'
import Canvas from './components/Canvas.vue'
import ConfigPanel from './components/ConfigPanel.vue'
import Modal from './components/Modal.vue'
import { useModal, initGlobalModal } from './composables/useModal'
import { useWorkflowStore } from './stores/workflow'

const modal = useModal()
const store = useWorkflowStore()

onMounted(() => {
  // 初始化全局弹窗
  initGlobalModal()
  
  // 加载撤销历史记录
  store.loadHistoryFromStorage()
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  overflow: hidden;
}

#app {
  width: 100%;
  height: 100%;
}

.workflow-editor {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: #fff;
}

.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}
</style>
