<template>
  <div
    class="group-node"
    :style="{
      width: width + 'px',
      height: height + 'px',
    }"
  >
    <div class="group-header">
      <span class="group-title">{{ title }}</span>
      <button class="group-delete" @click="handleDelete">×</button>
    </div>
    
    <!-- 调整大小手柄 -->
    <div 
      class="resize-handle" 
      @mousedown.stop.prevent="startResize"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

interface Props {
  id: string
  data: {
    name?: string
    config?: {
      width?: number
      height?: number
    }
  }
  dragging?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  dragging: false,
})

const emit = defineEmits<{
  (e: 'delete', id: string): void
  (e: 'resize', id: string, width: number, height: number): void
}>()

const title = computed(() => props.data?.name || 'Group')

const width = computed(() => props.data?.config?.width || 300)
const height = computed(() => props.data?.config?.height || 200)

const isResizing = ref(false)
const startPos = ref({ x: 0, y: 0 })
const startSize = ref({ width: 0, height: 0 })

const handleDelete = (e: MouseEvent) => {
  e.stopPropagation()
  emit('delete', props.id)
}

const startResize = (e: MouseEvent) => {
  e.stopPropagation()
  console.log('Start resize:', { width: width.value, height: height.value })
  isResizing.value = true
  startPos.value = { x: e.clientX, y: e.clientY }
  startSize.value = { width: width.value, height: height.value }
  
  document.addEventListener('mousemove', onResize)
  document.addEventListener('mouseup', stopResize)
}

const onResize = (e: MouseEvent) => {
  if (!isResizing.value) return
  
  const deltaX = e.clientX - startPos.value.x
  const deltaY = e.clientY - startPos.value.y
  
  const newWidth = Math.max(100, startSize.value.width + deltaX)
  const newHeight = Math.max(60, startSize.value.height + deltaY)
  
  emit('resize', props.id, newWidth, newHeight)
}

const stopResize = () => {
  isResizing.value = false
  document.removeEventListener('mousemove', onResize)
  document.removeEventListener('mouseup', stopResize)
}
</script>

<style scoped>
.group-node {
  width: 100%;
  height: 100%;
  background: rgba(74, 158, 255, 0.1);
  border: 2px dashed #4a9eff;
  border-radius: 8px;
  cursor: move;
  user-select: none;
  position: relative;
}

.group-header {
  position: absolute;
  top: -28px;
  left: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  background: rgba(74, 158, 255, 0.2);
  border-radius: 4px;
}

.group-title {
  font-size: 12px;
  color: #4a9eff;
  font-weight: 500;
}

.group-delete {
  width: 16px;
  height: 16px;
  padding: 0;
  border: none;
  background: rgba(255, 100, 100, 0.3);
  color: #ff6464;
  border-radius: 3px;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.group-delete:hover {
  background: rgba(255, 100, 100, 0.6);
  color: white;
}

.resize-handle {
  position: absolute;
  right: -6px;
  bottom: -6px;
  width: 14px;
  height: 14px;
  background: #4a9eff;
  border-radius: 50%;
  cursor: se-resize;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.resize-handle:hover {
  background: #2a7eff;
  transform: scale(1.2);
}
</style>