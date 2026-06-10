<template>
  <div class="canvas-container" @contextmenu.prevent="handleContextMenu">
    <VueFlow
      v-model:nodes="store.nodes"
      v-model:edges="store.edges"
      :default-viewport="{ x: 0, y: 0, zoom: 0.8 }"
      :min-zoom="0.2"
      :max-zoom="4"
      :snap-to-grid="true"
      :snap-grid="[15, 15]"
      :connectable="true"
      @node-click="handleNodeClick"
      @node-double-click="handleNodeDoubleClick"
      @pane-click="handlePaneClick"
      @dragover="handleDragOver"
      @drop="handleDrop"
      @connect="handleConnect"
      @pane-context-menu="handlePaneContextMenu"
      @nodes-change="handleNodesChange"
      @edges-change="handleEdgesChange"
    >
      <!-- 背景 -->
      <Background pattern-color="#e0e0e0" :gap="20" />

      <!-- 迷你地图 -->
      <MiniMap pannable zoomable node-class-name="minimap-node" mask-color="rgba(240, 240, 240, 0.6)" />

      <!-- 控制面板 -->
      <Controls position="bottom-right" />

      <!-- 自定义节点 -->
      <template #node-custom="props">
        <CustomNode v-bind="props" />
      </template>

      <!-- Group 节点 -->
      <template #node-group="props">
        <GroupNode v-bind="props" @delete="handleGroupDelete" @resize="handleGroupResize" />
      </template>
    </VueFlow>

    <!-- 右键菜单 -->
    <div
      v-if="contextMenuVisible"
      class="context-menu"
      :style="{ left: contextMenuPosition.x + 'px', top: contextMenuPosition.y + 'px' }"
    >
      <div class="context-menu-item" @click="handleInsertGroup">
        <span class="menu-icon">📦</span>
        <span>插入 Group 组</span>
      </div>
    </div>

    <!-- 提示信息 -->
    <div class="canvas-hint">
      <div>滚轮缩放 · 拖拽移动画布 · 双击节点编辑 · Shift+点击多选 · Ctrl+C复制 · Ctrl+V粘贴 · Delete删除 · 右键插入Group · Ctrl+Z撤销 · Ctrl+S保存</div>
    </div>

    <!-- 保存提示 -->
    <div v-if="saveHintVisible" class="save-hint">
      {{ saveHintMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { MiniMap } from '@vue-flow/minimap'
import { Controls } from '@vue-flow/controls'
import CustomNode from './CustomNode.vue'
import GroupNode from './GroupNode.vue'
import { useWorkflowStore } from '@/stores/workflow'
import type { NodeTemplate, CustomNode as CustomNodeType } from '@/types/workflow'
import type { NodeMouseEvent, Connection } from '@vue-flow/core'
import { isDualNode } from '@/types/workflow'
import { modalAlert, modalConfirm } from '@/composables/useModal'

const store = useWorkflowStore()
const { getSelectedNodes, getSelectedEdges, screenToFlowCoordinate } = useVueFlow()

// 复制的节点数据（用于粘贴）
const copiedNodes = ref<CustomNodeType[]>([])

// 右键菜单状态
const contextMenuVisible = ref(false)
const contextMenuPosition = ref({ x: 0, y: 0 })

// 节点点击
const handleNodeClick = (event: NodeMouseEvent) => {
  const node = event.node
  const ctrlPressed = event.event?.ctrlKey || event.event?.metaKey
  const shiftPressed = event.event?.shiftKey
  
  // 如果按住 Shift 键，切换当前节点的选中状态（多选）
  if (shiftPressed) {
    // 切换当前节点的选中状态
    const isSelected = (node as any).selected
    ;(node as any).selected = !isSelected
    return
  }
  
  // 如果按住 Ctrl 键，只选中当前节点
  if (ctrlPressed) {
    // 取消所有节点的选中状态
    store.nodes.forEach(n => (n as any).selected = false)
    // 只选中当前节点
    ;(node as any).selected = true
    return
  }
  
  // 如果点击的是 group 节点，选中 group 和框内所有节点
  if (node.type === 'group') {
    const nodesInsideGroup = getNodesInsideGroup(node)
    
    // 取消所有节点的选中状态
    store.nodes.forEach(n => (n as any).selected = false)
    
    // 选中 group 和框内节点
    ;(node as any).selected = true
    nodesInsideGroup.forEach(n => (n as any).selected = true)
  } else {
    store.selectNode(node.id)
  }
}

// 获取 group 框内的所有节点
const getNodesInsideGroup = (groupNode: any) => {
  const groupX = groupNode.position?.x || 0
  const groupY = groupNode.position?.y || 0
  const groupWidth = groupNode.data?.config?.width || 300
  const groupHeight = groupNode.data?.config?.height || 200
  
  return store.nodes.filter(node => {
    if (node.id === groupNode.id) return false
    
    const nodeX = node.position?.x || 0
    const nodeY = node.position?.y || 0
    
    // 简单的矩形碰撞检测
    return nodeX >= groupX && 
           nodeX <= groupX + groupWidth && 
           nodeY >= groupY && 
           nodeY <= groupY + groupHeight
  })
}

// 节点双击 - 打开配置面板
const handleNodeDoubleClick = (event: NodeMouseEvent) => {
  store.openConfigPanel(event.node.id)
}

// 处理节点变化（位置移动等）
const handleNodesChange = (changes: any[]) => {
  // 检查是否有位置变化
  const hasPositionChange = changes.some(c => c.type === 'position' && c.dragging === false)
  if (hasPositionChange) {
    store.saveHistory()
  }
}

// 处理边变化
const handleEdgesChange = (changes: any[]) => {
  // 检查是否有移除操作
  const hasRemove = changes.some(c => c.type === 'remove')
  if (hasRemove) {
    store.saveHistory()
  }
}

// 画布点击 - 取消选择
const handlePaneClick = () => {
  store.selectNode(null)
  hideContextMenu()
}

// 右键点击 - 显示菜单
const handleContextMenu = (e: MouseEvent) => {
  e.preventDefault()
}

// 处理画布右键菜单
const handlePaneContextMenu = (event: MouseEvent) => {
  event.preventDefault()
  contextMenuPosition.value = {
    x: event.clientX,
    y: event.clientY
  }
  contextMenuVisible.value = true
}

// 隐藏右键菜单
const hideContextMenu = () => {
  contextMenuVisible.value = false
}

// 处理插入 Group
const handleInsertGroup = () => {
  store.saveHistory()
  const position = screenToFlowCoordinate({
    x: contextMenuPosition.value.x,
    y: contextMenuPosition.value.y
  })

  console.log('Inserting Group at screen:', contextMenuPosition.value)
  console.log('Converted to flow:', position)

  // 使用转换后的flow坐标
  store.addGroupNode(position.x, position.y)
  console.log('Nodes after insert:', store.nodes)
  hideContextMenu()
}

// 处理 Group 删除
const handleGroupDelete = (id: string) => {
  store.saveHistory()
  store.deleteGroupNode(id)
}

// 处理 Group 调整大小
const handleGroupResize = (id: string, width: number, height: number) => {
  console.log('Resizing group:', id, width, height)
  store.saveHistory()
  store.resizeGroupNode(id, width, height)
}

// 监听点击其他地方关闭菜单
if (typeof window !== 'undefined') {
  window.addEventListener('click', hideContextMenu)
}

// 拖拽经过
const handleDragOver = (e: DragEvent) => {
  e.preventDefault()
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'copy'
  }
}

// 放置节点或文件
const handleDrop = (e: DragEvent) => {
  e.preventDefault()

  // 检查是否有文件被拖入
  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    // 处理文件拖入
    const file = files[0]
    if (file && (file.type === 'application/json' || file.name.endsWith('.json'))) {
      handleFileDrop(file)
    } else {
      modalAlert('请拖入 JSON 格式文件', '提示', 'warning')
    }
    return
  }

  // 处理节点模板拖入
  const data = e.dataTransfer?.getData('application/json')
  if (!data) return

  try {
    const template = JSON.parse(data) as NodeTemplate

    // 使用 Vue Flow 的 screenToFlowCoordinate 将屏幕坐标转换为画布坐标
    const position = screenToFlowCoordinate({
      x: e.clientX,
      y: e.clientY,
    })

    // 节点尺寸（与 CustomNode.vue 中的样式一致）
    const nodeWidth = 160
    const nodeHeight = 60 // 估算高度

    // 让节点居中显示：减去节点宽高的一半
    const centeredX = position.x - nodeWidth / 2
    const centeredY = position.y - nodeHeight / 2

    // 添加节点并保存历史
    store.saveHistory()
    store.addNode(template.type, centeredX, centeredY)
  } catch (err) {
    console.error('Failed to parse drop data:', err)
  }
}

// 处理文件拖入导入
const handleFileDrop = async (file: File) => {
  // 文件大小限制：2MB
  const MAX_FILE_SIZE = 2 * 1024 * 1024

  if (file.size > MAX_FILE_SIZE) {
    modalAlert(`导入失败：文件大小超过限制（最大 ${MAX_FILE_SIZE / 1024 / 1024}MB）`, '导入失败', 'danger')
    return
  }

  const reader = new FileReader()
  reader.onload = async (event) => {
    try {
      // 安全的 JSON 解析（防止原型链污染）
      const text = event.target?.result as string
      const sanitized = text
        .replace(/"__proto__"\s*:/g, '"__proto__removed":')
        .replace(/"constructor"\s*:\s*\{/g, '"constructor_removed":{')
        .replace(/"prototype"\s*:/g, '"prototype_removed":')
      const data = JSON.parse(sanitized)

      // 验证 JSON 结构
      const validation = validateWorkflowJson(data)
      if (!validation.valid) {
        await modalAlert(`导入失败：${validation.error}`, '导入失败', 'danger')
        return
      }

      // 导入工作流
      const confirmed = await modalConfirm('导入工作流将覆盖当前画布内容，是否继续？', '确认导入', 'warning')
      if (confirmed) {
        store.importWorkflow(data)
        store.saveHistory()
      }
    } catch (err) {
      await modalAlert('导入失败：无效的 JSON 文件', '导入失败', 'danger')
    }
  }
  reader.onerror = async () => {
    await modalAlert('导入失败：文件读取错误', '导入失败', 'danger')
  }
  reader.readAsText(file)
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

// 处理连接事件
const handleConnect = (connection: Connection) => {
  console.log('Connecting:', connection)
  if (connection.source && connection.target) {
    // 检查源节点是否为双线节点（使用 type 判断）
    const sourceNode = store.nodes.find(n => n.id === connection.source)
    const isDual = sourceNode?.data?.type ? isDualNode(sourceNode.data.type) : false

    // 获取源节点的现有输出连接
    const existingEdges = store.edges.filter(e => e.source === connection.source)

    // 检查是否已达到最大连接数限制
    if (isDual) {
      // 双线节点：最多2个连接（true和false各一个）
      if (existingEdges.length >= 2) {
        console.warn('双线节点最多只能连接两个目标节点')
        return
      }
      // 检查是否重复连接同一个条件
      const sourceHandle = connection.sourceHandle || 'true'
      const hasCondition = existingEdges.some(e => {
        const edgeSourceHandle = e.sourceHandle || 'true'
        return edgeSourceHandle === sourceHandle
      })
      if (hasCondition) {
        console.warn(`该条件(${sourceHandle})已经存在连接`)
        return
      }
    } else {
      // 单线节点：最多1个连接
      if (existingEdges.length >= 1) {
        console.warn('单线节点只能连接一个目标节点')
        return
      }
    }

    // 根据连接点确定边类型
    let edgeType: 'default' | 'condition' = 'default'
    let condition: 'true' | 'false' | undefined = undefined

    if (isDual && connection.sourceHandle) {
      edgeType = 'condition'
      condition = connection.sourceHandle as 'true' | 'false'
    }

    // 添加连线并保存历史
    store.saveHistory()
    store.addEdge(connection.source, connection.target, edgeType, condition, connection.sourceHandle || undefined)
  }
}

// 保存工作流到浏览器缓存
const saveToLocalStorage = () => {
  try {
    const workflowData = store.exportWorkflow()
    const saveData = {
      timestamp: new Date().toISOString(),
      data: workflowData
    }
    localStorage.setItem('vue_workflow_cache', JSON.stringify(saveData))
    console.log('工作流已保存到浏览器缓存', saveData.timestamp)
    return true
  } catch (error) {
    console.error('保存失败:', error)
    return false
  }
}

// 从浏览器缓存加载工作流
const loadFromLocalStorage = () => {
  try {
    const cached = localStorage.getItem('vue_workflow_cache')
    if (cached) {
      const saveData = JSON.parse(cached)
      return saveData
    }
    return null
  } catch (error) {
    console.error('加载失败:', error)
    return null
  }
}

// 保存提示状态
const saveHintVisible = ref(false)
const saveHintMessage = ref('')

// 显示保存提示
const showSaveHint = (message: string) => {
  saveHintMessage.value = message
  saveHintVisible.value = true
  setTimeout(() => {
    saveHintVisible.value = false
  }, 2000)
}

// 键盘事件 - 删除选中节点和连线、复制粘贴、撤销、保存
const handleKeyDown = (e: KeyboardEvent) => {
  // 处理 Ctrl+S 保存到浏览器缓存（即使配置面板打开也允许保存）
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    const success = saveToLocalStorage()
    if (success) {
      const now = new Date().toLocaleTimeString()
      showSaveHint(`✅ 已保存 ${now}`)
    } else {
      showSaveHint('❌ 保存失败')
    }
    return
  }

  // 如果配置面板打开，不处理其他快捷键（避免与输入框冲突）
  if (store.configPanelVisible) {
    return
  }

  // 处理 Ctrl+Z 撤销
  if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
    e.preventDefault()
    store.undo()
    return
  }

  // 处理 Ctrl+C 复制节点
  if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
    e.preventDefault()
    const selectedNodes = getSelectedNodes.value
    if (selectedNodes.length > 0) {
      // 深拷贝选中的节点数据
      copiedNodes.value = JSON.parse(JSON.stringify(selectedNodes))
      console.log('Copied nodes:', copiedNodes.value)
    }
    return
  }

  // 处理 Ctrl+V 粘贴节点
  if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
    e.preventDefault()
    if (copiedNodes.value.length > 0) {
      store.saveHistory()
      // 计算偏移量（相对于画布中心）
      const offset = { x: 50, y: 50 }
      
      copiedNodes.value.forEach((node) => {
        // 确保 node.data 存在
        if (!node.data) return
        
        // 创建新节点，位置偏移
        const newNode = store.addNode(
          node.data.type,
          node.position.x + offset.x,
          node.position.y + offset.y
        )
        
        // 更新节点配置（保留原始配置）
        if (node.data.config) {
          store.updateNodeConfig(newNode.id, node.data.config)
        }
      })
      
      // 清空剪贴板
      copiedNodes.value = []
    }
    return
  }

  // 只处理 Delete 键，Backspace 键不处理（避免与输入框冲突）
  if (e.key === 'Delete') {
    // 删除选中的节点
    const selectedNodes = getSelectedNodes.value
    const selectedEdges = getSelectedEdges.value
    
    if (selectedNodes.length > 0 || selectedEdges.length > 0) {
      store.saveHistory()
      
      selectedNodes.forEach((node) => {
        store.deleteNode(node.id)
      })

      selectedEdges.forEach((edge) => {
        store.deleteEdge(edge.id)
      })
    }
  }
}

// 监听键盘事件
window.addEventListener('keydown', handleKeyDown)

// 组件挂载时检查是否有缓存
onMounted(async () => {
  const cached = loadFromLocalStorage()
  if (cached && cached.data && cached.data.nodes && cached.data.nodes.length > 0) {
    const savedTime = new Date(cached.timestamp).toLocaleString()
    const confirmed = await modalConfirm(
      `发现浏览器缓存中有保存的工作流（${savedTime}），是否恢复？\n\n节点数: ${cached.data.nodes.length}\n连线数: ${cached.data.edges?.length || 0}`,
      '恢复工作流'
    )
    if (confirmed) {
      store.importWorkflow(cached.data)
      showSaveHint('✅ 已恢复缓存的工作流')
    }
  }
})
</script>

<style>
@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/core/dist/theme-default.css';
@import '@vue-flow/controls/dist/style.css';
@import '@vue-flow/minimap/dist/style.css';

.canvas-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

/* Vue Flow 样式覆盖 */
.vue-flow {
  background: #fafafa;
}

.vue-flow__node {
  padding: 0;
  border: none;
  background: transparent;
}

.vue-flow__node.selected {
  box-shadow: none;
}

.vue-flow__edge-path {
  stroke: #999;
  stroke-width: 2;
}

.vue-flow__edge.selected .vue-flow__edge-path {
  stroke: #4a9eff;
  stroke-width: 3;
}

/* 条件边样式 - 绿色表示true */
.vue-flow__edge[data-type="condition"][data-condition="true"] .vue-flow__edge-path {
  stroke: #4caf50;
  stroke-width: 3;
}

/* 条件边样式 - 红色表示false */
.vue-flow__edge[data-type="condition"][data-condition="false"] .vue-flow__edge-path {
  stroke: #f44336;
  stroke-width: 3;
}

/* 连接点样式 */
.vue-flow__handle {
  width: 20px !important;
  height: 20px !important;
  background: white !important;
  border: 2px solid #4a9eff !important;
  border-radius: 50% !important;
  opacity: 0;
  transition: opacity 0.2s, background 0.2s, transform 0.2s;
}

.vue-flow__node:hover .vue-flow__handle,
.vue-flow__node.selected .vue-flow__handle {
  opacity: 1;
}

.vue-flow__handle:hover {
  background: #4a9eff !important;
  transform: scale(1.2);
}

/* 双线节点连接点样式 */
.vue-flow__handle[id="true"] {
  border-color: #4caf50 !important;
}

.vue-flow__handle[id="true"]:hover {
  background: #4caf50 !important;
}

.vue-flow__handle[id="false"] {
  border-color: #f44336 !important;
}

.vue-flow__handle[id="false"]:hover {
  background: #f44336 !important;
}

/* 迷你地图样式 */
.minimap-node {
  fill: #e0e0e0;
}

.vue-flow__minimap-node.selected {
  fill: #4a9eff;
}

/* 提示信息 */
.canvas-hint {
  position: absolute;
  bottom: 20px;
  left: 20px;
  padding: 10px 16px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 6px;
  font-size: 12px;
  color: white;
  pointer-events: none;
  z-index: 1000;
}

/* 保存提示 */
.save-hint {
  position: absolute;
  top: 20px;
  right: 20px;
  padding: 12px 20px;
  background: rgba(76, 175, 80, 0.95);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: white;
  pointer-events: none;
  z-index: 1001;
  animation: fadeInOut 2s ease-in-out;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

@keyframes fadeInOut {
  0% {
    opacity: 0;
    transform: translateY(-10px);
  }
  10% {
    opacity: 1;
    transform: translateY(0);
  }
  80% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateY(-10px);
  }
}

/* 右键菜单 */
.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 6px 0;
  z-index: 9999;
  min-width: 160px;
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  cursor: pointer;
  font-size: 13px;
  color: #333;
  transition: background 0.15s;
}

.context-menu-item:hover {
  background: #f0f7ff;
  color: #4a9eff;
}

.menu-icon {
  font-size: 16px;
}
</style>
