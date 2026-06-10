<template>
  <div class="toolbar">
    <div class="toolbar-header">
      <h3>工具箱</h3>
    </div>

    <div class="toolbar-section">
      <div class="node-list">
        <div v-for="template in store.nodeTemplates" :key="template.type" class="node-item" draggable="true"
          @dragstart="handleDragStart($event, template)">
          <span class="node-icon">{{ template.icon }}</span>
          <span class="node-label">{{ template.name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useWorkflowStore } from '@/stores/workflow'
import type { NodeTemplate } from '@/types/workflow'

const store = useWorkflowStore()

const handleDragStart = (e: DragEvent, template: NodeTemplate) => {
  e.dataTransfer?.setData('application/json', JSON.stringify(template))
  e.dataTransfer!.effectAllowed = 'copy'
}
</script>

<style scoped>
.toolbar {
  width: 200px;
  height: 100%;
  background: #f8f9fa;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.toolbar-header {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.toolbar-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.toolbar-section {
  padding: 12px;
  border-bottom: 1px solid #e0e0e0;
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  margin-bottom: 8px;
  letter-spacing: 0.5px;
}

.node-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.node-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 12px 8px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  cursor: grab;
  transition: all 0.2s;
  text-align: center;
  min-height: 70px;
}

.node-item:hover {
  background: #f0f7ff;
  border-color: #4a9eff;
  transform: translateY(-2px);
}

.node-item:active {
  cursor: grabbing;
}

.node-icon {
  font-size: 20px;
}

.node-label {
  font-size: 11px;
  color: #333;
  font-weight: 500;
  line-height: 1.2;
}
</style>
