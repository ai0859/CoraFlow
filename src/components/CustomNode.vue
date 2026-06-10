<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import type { WorkflowNodeData } from '@/types/workflow'
import { isDualNode, type NodeType } from '@/types/workflow'

const props = defineProps<{
  data: WorkflowNodeData
  selected?: boolean
  id: string
  type: string
}>()

// 判断是否为双线节点 - 使用 type 判断
const isDual = computed(() => {
  return isDualNode(props.data.type)
})

// 获取节点类型的图标 - 使用 type 判断
const nodeIcon = computed(() => {
  const type = props.data.type
  switch (type) {
    case 'set_window_size':
      return '📐'
    case 'delay':
      return '⏱️'
    case 'click_if_image_exist':
      return '🖱️'
    case 'is_image_exist':
      return '🔍'
    case 'check_region_change':
      return '📸'
    case 'click_if_color_exist':
      return '🎨'
    case 'click':
      return '👆'
    case 'right_click':
      return '👇'
    case 'drag':
      return '🔄'
    case 'loop':
      return '🔁'
    case 'end_loop':
      return '⏹️'
    case 'print':
      return '📢'
    case 'abort':
      return '⛔'
    default:
      return '📦'
  }
})

// 获取预览文本
const previewText = computed(() => {
  const config = props.data.config
  const parts: string[] = []

  if (config.count !== undefined) parts.push(`循环${config.count}次`)
  if (config.x !== undefined && config.y !== undefined) parts.push(`(${config.x}, ${config.y})`)
  if (config.message) parts.push(config.message)

  return parts.join(' | ') || '无配置'
})

// 检查必填项是否已填写
const isValid = computed(() => {
  const type = props.data.type
  const config = props.data.config

  // 判断图片变动：检测区域4个坐标都为0时表示未配置
  if (type === 'check_region_change') {
    const region = config.region
    if (!region || region.length !== 4) return false
    // 如果4个坐标都为0，表示未配置
    if (region.every((v: number) => v === 0)) return false
  }

  // 判断颜色存在：检测区域4个坐标都为0时表示未配置
  if (type === 'click_if_color_exist') {
    const region = config.region
    if (!region || region.length !== 4) return false
    // 如果4个坐标都为0，表示未配置
    if (region.every((v: number) => v === 0)) return false
  }

  return true
})
</script>

<template>
  <div class="workflow-node" :class="{ selected, 'dual-node': isDual, 'invalid-node': !isValid }">
    <!-- 输入连接点 -->
    <Handle type="target" :position="Position.Left" class="vue-flow__handle" />

    <!-- 节点内容 -->
    <div class="node-content">
      <div class="node-header">
        <span class="node-icon">{{ nodeIcon }}</span>
        <span class="node-label">{{ data.name }}</span>
      </div>
      <div class="node-preview" :title="previewText">
        {{ previewText }}
      </div>
    </div>

    <!-- 单线节点输出连接点 -->
    <Handle
      v-if="!isDual"
      type="source"
      :position="Position.Right"
      class="vue-flow__handle"
      id="default"
    />

    <!-- 双线节点输出连接点 - 上方绿色（true） -->
    <Handle
      v-if="isDual"
      type="source"
      :position="Position.Right"
      class="vue-flow__handle handle-true"
      :style="{ top: '35%' }"
      id="true"
    />

    <!-- 双线节点输出连接点 - 下方红色（false） -->
    <Handle
      v-if="isDual"
      type="source"
      :position="Position.Right"
      class="vue-flow__handle handle-false"
      :style="{ top: '65%' }"
      id="false"
    />

    <!-- 双线节点标签 -->
    <div v-if="isDual" class="handle-label label-true">是</div>
    <div v-if="isDual" class="handle-label label-false">否</div>
  </div>
</template>

<style scoped>
.workflow-node {
  width: 160px;
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  user-select: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.2s;
}

.workflow-node:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  transform: translateY(-1px);
}

.workflow-node.selected {
  border-color: #4a9eff;
  box-shadow: 0 0 0 3px rgba(74, 158, 255, 0.2);
}

/* 双线节点样式 */
.dual-node {
  border-color: #9c27b0;
}

.dual-node.selected {
  border-color: #9c27b0;
  box-shadow: 0 0 0 3px rgba(156, 39, 176, 0.2);
}

/* 必填项未填写的节点样式 */
.invalid-node {
  background: #ffebee;
  border-color: #ef9a9a;
}

.invalid-node:hover {
  background: #ffcdd2;
  border-color: #e57373;
}

.invalid-node.selected {
  background: #ffcdd2;
  border-color: #ef5350;
  box-shadow: 0 0 0 3px rgba(239, 83, 80, 0.2);
}

.node-content {
  padding: 8px;
}

.node-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.node-icon {
  font-size: 16px;
}

.node-label {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.node-preview {
  font-size: 11px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 连接点标签 */
.handle-label {
  position: absolute;
  right: -20px;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  pointer-events: none;
}

.label-true {
  top: 28%;
  color: #4caf50;
  background: rgba(76, 175, 80, 0.1);
}

.label-false {
  top: 58%;
  color: #f44336;
  background: rgba(244, 67, 54, 0.1);
}

/* 连接点样式覆盖 */
:deep(.handle-true) {
  border-color: #4caf50 !important;
}

:deep(.handle-true:hover) {
  background: #4caf50 !important;
}

:deep(.handle-false) {
  border-color: #f44336 !important;
}

:deep(.handle-false:hover) {
  background: #f44336 !important;
}
</style>
