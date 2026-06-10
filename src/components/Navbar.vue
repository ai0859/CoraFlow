<template>
  <div class="navbar">
    <div class="navbar-left">
      <h2 class="app-title">工作流编辑器</h2>
      <div class="workflow-name-wrapper">
        <span v-if="!isEditingName" class="workflow-name" @click="startEditingName" title="点击重命名">
          {{ store.currentWorkflow.name }}
        </span>
        <input v-else ref="nameInput" v-model="editingName" class="workflow-name-input" type="text"
          @blur="finishEditingName" @keyup.enter="finishEditingName" @keyup.esc="cancelEditingName" />
      </div>
    </div>

    <div class="navbar-right">
      <div class="action-buttons">
        <button class="nav-btn" @click="handleExport">
          <span class="btn-icon">💾</span>
          导出JSON
        </button>
        <button class="nav-btn" @click="handleImport">
          <span class="btn-icon">📂</span>
          导入JSON
        </button>
        <button class="nav-btn danger" @click="handleClear">
          <span class="btn-icon">🗑️</span>
          清空画布
        </button>
      </div>
    </div>

    <input ref="fileInput" type="file" accept=".json" style="display: none" @change="handleFileChange" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useWorkflowStore } from '@/stores/workflow'
import type { WorkflowJson } from '@/types/workflow'
import { modalAlert, modalConfirm } from '@/composables/useModal'

const store = useWorkflowStore()
const fileInput = ref<HTMLInputElement>()
const nameInput = ref<HTMLInputElement>()

const isEditingName = ref(false)
const editingName = ref('')

const startEditingName = () => {
  editingName.value = store.currentWorkflow.name
  isEditingName.value = true
  nextTick(() => {
    nameInput.value?.focus()
    nameInput.value?.select()
  })
}

const finishEditingName = () => {
  const trimmedName = editingName.value.trim()
  if (trimmedName) {
    store.setWorkflowName(trimmedName)
  }
  isEditingName.value = false
}

const cancelEditingName = () => {
  isEditingName.value = false
}

// 验证节点必填项是否已填写
const validateNodesRequiredFields = (): { valid: boolean; invalidNodeName?: string } => {
  for (const node of store.nodes) {
    const type = node.data?.type
    const config = node.data?.config

    // 判断图片变动：检测区域4个坐标都为0时表示未配置
    if (type === 'check_region_change') {
      const region = config?.region
      if (!region || region.length !== 4 || region.every((v: number) => v === 0)) {
        return { valid: false, invalidNodeName: node.data?.name || '判断图片变动' }
      }
    }

    // 判断颜色存在：检测区域4个坐标都为0时表示未配置
    if (type === 'click_if_color_exist') {
      const region = config?.region
      if (!region || region.length !== 4 || region.every((v: number) => v === 0)) {
        return { valid: false, invalidNodeName: node.data?.name || '判断颜色存在' }
      }
    }
  }

  return { valid: true }
}

const handleExport = async () => {
  // 验证工作流是否已命名
  const workflowName = store.currentWorkflow.name.trim()
  if (!workflowName || workflowName === '未命名工作流') {
    await modalAlert('工作流未命名，无法导出', '导出失败', 'warning')
    return
  }

  // 验证必填项
  const validation = validateNodesRequiredFields()
  if (!validation.valid) {
    await modalAlert(`"${validation.invalidNodeName}" 节点存在未填写项，无法导出`, '导出失败', 'warning')
    return
  }

  const data = store.exportWorkflow()
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  // 文件名与工作流名称一致，确保以.json结尾
  const fileName = workflowName.replace(/\.json$/i, '') + '.json'
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
}

const handleImport = () => {
  fileInput.value?.click()
}

// 文件大小限制：2MB
const MAX_FILE_SIZE = 2 * 1024 * 1024

// 安全的 JSON 解析（防止原型链污染）
const safeJSONParse = (text: string): any => {
  // 移除可能导致原型链污染的关键字
  const sanitized = text
    .replace(/"__proto__"\s*:/g, '"__proto__removed":')
    .replace(/"constructor"\s*:\s*\{/g, '"constructor_removed":{')
    .replace(/"prototype"\s*:/g, '"prototype_removed":')
  return JSON.parse(sanitized)
}

// 验证工作流 JSON 结构
const validateWorkflowJson = (data: any): { valid: boolean; error?: string } => {
  // 检查基本结构
  if (!data || typeof data !== 'object') {
    return { valid: false, error: '数据必须是对象' }
  }

  // 检查 nodes 字段
  if (!data.nodes || !Array.isArray(data.nodes)) {
    return { valid: false, error: '缺少 nodes 数组' }
  }

  // 检查 edges 字段（可选）
  if (data.edges !== undefined && !Array.isArray(data.edges)) {
    return { valid: false, error: 'edges 必须是数组' }
  }

  // 验证每个节点的结构
  for (let i = 0; i < data.nodes.length; i++) {
    const node = data.nodes[i]
    if (!node.id || typeof node.id !== 'string') {
      return { valid: false, error: `第 ${i + 1} 个节点缺少 id` }
    }
    if (!node.type || typeof node.type !== 'string') {
      return { valid: false, error: `节点 ${node.id} 缺少 type` }
    }
    if (!node.position || typeof node.position !== 'object') {
      return { valid: false, error: `节点 ${node.id} 缺少 position` }
    }
    if (typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
      return { valid: false, error: `节点 ${node.id} 的 position 必须是数字` }
    }
    if (!node.data || typeof node.data !== 'object') {
      return { valid: false, error: `节点 ${node.id} 缺少 data` }
    }
  }

  // 验证边的结构
  if (data.edges) {
    for (let i = 0; i < data.edges.length; i++) {
      const edge = data.edges[i]
      if (!edge.source || typeof edge.source !== 'string') {
        return { valid: false, error: `第 ${i + 1} 条边缺少 source` }
      }
      if (!edge.target || typeof edge.target !== 'string') {
        return { valid: false, error: `第 ${i + 1} 条边缺少 target` }
      }
    }
  }

  return { valid: true }
}

const handleFileChange = async (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  // 1. 检查文件类型
  if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
    await modalAlert('导入失败：请选择 JSON 格式文件', '导入失败', 'danger')
    target.value = ''
    return
  }

  // 2. 检查文件大小（最大 2MB）
  if (file.size > MAX_FILE_SIZE) {
    await modalAlert(`导入失败：文件大小超过限制（最大 ${MAX_FILE_SIZE / 1024 / 1024}MB）`, '导入失败', 'danger')
    target.value = ''
    return
  }

  const reader = new FileReader()
  reader.onload = async (event) => {
    try {
      // 3. 安全的 JSON 解析
      const data = safeJSONParse(event.target?.result as string)

      // 4. 验证 JSON 结构
      const validation = validateWorkflowJson(data)
      if (!validation.valid) {
        await modalAlert(`导入失败：${validation.error}`, '导入失败', 'danger')
        target.value = ''
        return
      }

      store.importWorkflow(data as WorkflowJson)
    } catch (err) {
      await modalAlert('导入失败：无效的 JSON 文件', '导入失败', 'danger')
    }
    target.value = ''
  }
  reader.onerror = async () => {
    await modalAlert('导入失败：文件读取错误', '导入失败', 'danger')
    target.value = ''
  }
  reader.readAsText(file)
}

const handleClear = async () => {
  const confirmed = await modalConfirm('确定要清空画布吗？所有节点和连线将被删除。', '确认清空', 'danger')
  if (confirmed) {
    store.clearWorkflow()
  }
}

onMounted(() => {
  // 初始化时新建一个工作流
  if (store.nodes.length === 0) {
    store.newWorkflow()
  }
})
</script>

<style scoped>
.navbar {
  height: 50px;
  background: #2c3e50;
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.navbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.app-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  white-space: nowrap;
}

.workflow-name-wrapper {
  display: flex;
  align-items: center;
}

.workflow-name {
  font-size: 14px;
  color: #bdc3c7;
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
}

.workflow-name:hover {
  background: rgba(255, 255, 255, 0.2);
}

.workflow-name-input {
  font-size: 14px;
  padding: 4px 12px;
  border: 2px solid #4a9eff;
  border-radius: 4px;
  background: white;
  color: #333;
  outline: none;
  min-width: 150px;
}

.navbar-right {
  display: flex;
  align-items: center;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  background: #34495e;
  color: white;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
}

.nav-btn:hover {
  background: #4a5568;
}

.nav-btn.danger:hover {
  background: #e74c3c;
}

.btn-icon {
  font-size: 14px;
}
</style>
