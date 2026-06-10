import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  NodeType,
  NodeTemplate,
  WorkflowJson,
  CustomNode,
  CustomEdge,
  NodeConfig,
  WorkflowNodeData,
} from '@/types/workflow'
import type { Connection } from '@vue-flow/core'

// 生成节点ID计数器
let nodeIdCounter = 1
let edgeIdCounter = 1
let groupIdCounter = 1

// 生成简洁的节点ID
const generateNodeId = () => `node_${nodeIdCounter++}`
const generateEdgeId = () => `edge_${edgeIdCounter++}`

const generateGroupId = () => `group_${groupIdCounter++}`

// 重置计数器
const resetIdCounters = () => {
  nodeIdCounter = 1
  edgeIdCounter = 1
  groupIdCounter = 1
}

export const useWorkflowStore = defineStore('workflow', () => {
  // Vue Flow 节点和边
  const nodes = ref<CustomNode[]>([])
  const edges = ref<CustomEdge[]>([])
  
  // 撤销历史记录
  const history = ref<{ nodes: CustomNode[]; edges: CustomEdge[] }[]>([])
  const historyIndex = ref(-1)
  
  // 当前工作流信息
  const currentWorkflow = ref<{
    id: string
    name: string
    filePath?: string
  }>({
    id: '',
    name: '未命名工作流'
  })

  // 选中的节点ID
  const selectedNodeId = ref<string | null>(null)

  // 配置面板状态
  const configPanelVisible = ref(false)
  const editingNodeId = ref<string | null>(null)

  // 节点模板 - 根据 test_window_resize.json 定义
  const nodeTemplates: NodeTemplate[] = [
    {
      type: 'set_window_size',
      name: '设置窗口',
      icon: '📐',
      description: '设置窗口宽高',
    },
    {
      type: 'delay',
      name: '延时',
      icon: '⏱️',
      description: '延迟执行',
    },
    {
      type: 'loop',
      name: '循环',
      icon: '🔁',
      description: '循环开始',
    },
    {
      type: 'end_loop',
      name: '结束循环',
      icon: '⏹️',
      description: '循环结束',
    },
    {
      type: 'drag',
      name: '拖拽',
      icon: '✋',
      description: '从起点拖拽到终点',
    },
    {
      type: 'print',
      name: '打印',
      icon: '📢',
      description: '打印消息',
    },
    {
      type: 'click_if_image_exist',
      name: '图片点击',
      icon: '🖱️',
      description: '图片存在则点击',
    },
    {
      type: 'check_region_change',
      name: '图片变动',
      icon: '📸',
      description: '检测指定区域是否有变化',
    },
    {
      type: 'is_image_exist',
      name: '判断图片',
      icon: '🔍',
      description: '判断图片是否存在',
    },
    {
      type: 'click_if_color_exist',
      name: '点击颜色',
      icon: '🎨',
      description: '判断指定区域内是否存在目标颜色，存在则点击',
    },
    {
      type: 'abort',
      name: '中止',
      icon: '⛔',
      description: '停止工作流运行并打印异常信息',
    },
    {
      type: 'recognize_number',
      name: '识别数字',
      icon: '🔢',
      description: '识别区域中的数字并比较',
    },
    {
      type: 'recognize_text',
      name: '识别文字',
      icon: '📝',
      description: '识别区域中的文字并判断是否包含指定文本',
    },
    {
      type: 'click',
      name: '左键点击',
      icon: '🖱️',
      description: '在指定坐标左键点击',
    },
    {
      type: 'right_click',
      name: '右键点击',
      icon: '🖱️',
      description: '在指定坐标右键点击',
    },
  ]

  // 计算属性
  const selectedNode = computed((): CustomNode | null => {
    if (!selectedNodeId.value) return null
    const nodeId = selectedNodeId.value
    for (const n of nodes.value) {
      if (n.id === nodeId) return n as CustomNode
    }
    return null
  })

  const editingNode = computed((): CustomNode | null => {
    if (!editingNodeId.value) return null
    const nodeId = editingNodeId.value
    for (const n of nodes.value) {
      if (n.id === nodeId) return n as CustomNode
    }
    return null
  })

  const getNodeById = (id: string): CustomNode | undefined => {
    for (const n of nodes.value) {
      if (n.id === id) return n as CustomNode
    }
    return undefined
  }

  // 获取默认配置
  const getDefaultConfig = (type: NodeType): NodeConfig => {
    switch (type) {
      case 'start':
        return {}
      case 'set_window_size':
        return { width: 837, height: 510 }
      case 'delay':
        return { ms: 500 }
      case 'click_if_image_exist':
        return { image: '', threshold: 0.8, offset: 10, var: 'clicked' }
      case 'is_image_exist':
        return { image: '', threshold: 0.8, var: 'result' }
      case 'check_region_change':
        return { region: [0, 0, 0, 0], diff_threshold: 0.1, var: 'changed' }
      case 'click_if_color_exist':
        return { color: '#FF0000', offset_x: 0, offset_y: 0, region: [0, 0, 0, 0] }
      case 'click':
        return { x: 0, y: 0, random_x: 0, random_y: 0 }
      case 'right_click':
        return { x: 0, y: 0 }
      case 'drag':
        return { x1: 0, y1: 0, x2: 100, y2: 100, duration: 0.5 }
      case 'loop':
        return { count: -1 }
      case 'end_loop':
        return {}
      case 'print':
        return { message: '' }
      case 'abort':
        return { message: '工作流被中止' }
      case 'recognize_number':
        return { var_a: 'A', operator: '>', var_b: 'A', threshold: 100, region: [0, 0, 100, 50] }
      case 'recognize_text':
        return { text_to_find: '请输入', region: [0, 0, 100, 50] }
      default:
        return {}
    }
  }

  // 初始化默认开始节点
  const initStartNode = () => {
    // 如果已经存在 node_1，则不创建
    if (nodes.value.some(n => n.id === 'node_1')) {
      return
    }
    
    const startNode: CustomNode = {
      id: 'node_1',
      type: 'custom',
      position: { x: 100, y: 100 },
      data: {
        name: '开始',
        type: 'start',
        config: {},
      },
    }
    nodes.value.push(startNode)
    
    // 确保计数器从 2 开始
    nodeIdCounter = Math.max(nodeIdCounter, 2)
  }

  // 添加节点
  const addNode = (type: NodeType, x: number, y: number): CustomNode => {
    const template = nodeTemplates.find((t) => t.type === type)!
    const id = generateNodeId()

    const node: CustomNode = {
      id,
      type: 'custom',
      position: { x, y },
      data: {
        name: template.name,
        type: type,
        config: getDefaultConfig(type),
      },
    }

    nodes.value.push(node)
    return node
  }

  // 添加 Group 节点
  const addGroupNode = (x: number, y: number): CustomNode => {
    // 确保生成唯一的ID
    let id = generateGroupId()
    while (nodes.value.some(n => n.id === id)) {
      id = generateGroupId()
    }

    const node: CustomNode = {
      id,
      type: 'group',
      position: { x, y },
      data: {
        name: 'Group',
        type: 'group',
        config: {
          width: 300,
          height: 200
        },
      },
    }

    nodes.value.push(node)
    return node
  }

  // 更新 Group 节点
  const updateGroupNode = (id: string, updates: Partial<CustomNode>) => {
    const nodeIndex = nodes.value.findIndex((n) => n.id === id)
    if (nodeIndex !== -1) {
      const existingNode = nodes.value[nodeIndex]
      if (existingNode && existingNode.type === 'group') {
        nodes.value[nodeIndex] = {
          ...existingNode,
          ...updates,
          id: existingNode.id,
          type: existingNode.type,
          position: updates.position ?? existingNode.position,
          data: updates.data ?? existingNode.data
        } as CustomNode
      }
    }
  }

  // 删除 Group 节点
  const deleteGroupNode = (id: string) => {
    nodes.value = nodes.value.filter((n) => n.id !== id)
  }

  // 调整 Group 节点大小
  const resizeGroupNode = (id: string, width: number, height: number) => {
    const node = nodes.value.find((n) => n.id === id)
    if (node && node.type === 'group' && node.data) {
      node.data.config = node.data.config || {}
      node.data.config.width = width
      node.data.config.height = height
    }
  }

  // 更新节点
  const updateNode = (id: string, updates: Partial<CustomNode>) => {
    const nodeIndex = nodes.value.findIndex((n) => n.id === id)
    if (nodeIndex !== -1) {
      const existingNode = nodes.value[nodeIndex]
      if (!existingNode) return
      
      nodes.value[nodeIndex] = { 
        ...existingNode, 
        ...updates,
        id: existingNode.id,
        type: existingNode.type,
        position: updates.position ?? existingNode.position,
        data: updates.data ?? existingNode.data
      } as CustomNode
    }
  }

  // 更新节点数据
  const updateNodeData = (id: string, data: Partial<WorkflowNodeData>) => {
    const node = getNodeById(id)
    if (node && node.data) {
      node.data = { 
        name: data.name ?? node.data.name,
        type: data.type ?? node.data.type,
        config: data.config ?? node.data.config
      }
    }
  }

  // 更新节点配置
  const updateNodeConfig = (id: string, config: NodeConfig) => {
    const node = getNodeById(id)
    if (node && node.data) {
      node.data.config = config
    }
  }

  // 删除节点
  const deleteNode = (id: string) => {
    // 不允许删除开始节点
    if (id === 'node_1') {
      return
    }
    nodes.value = nodes.value.filter((n) => n.id !== id)
    // 同时删除相关的边
    edges.value = edges.value.filter((e) => e.source !== id && e.target !== id)

    if (selectedNodeId.value === id) {
      selectedNodeId.value = null
    }
  }

  // 选择节点
  const selectNode = (id: string | null) => {
    selectedNodeId.value = id
  }

  // 添加边
  const addEdge = (
    source: string,
    target: string,
    edgeType: 'default' | 'condition' = 'default',
    condition?: 'true' | 'false',
    sourceHandle?: string
  ): CustomEdge => {
    const edge: CustomEdge = {
      id: generateEdgeId(),
      source,
      target,
      type: edgeType,
    }

    // 如果是条件边，添加条件值和sourceHandle
    if (edgeType === 'condition' && condition) {
      edge.condition = condition
      edge.sourceHandle = sourceHandle || condition
    }

    edges.value.push(edge)
    return edge
  }

  // 判断节点是否为双线节点
  const isDualNode = (nodeId: string): boolean => {
    const node = getNodeById(nodeId)
    return node?.data?.name === '判断图片存在'
  }

  // 获取节点的输出连接数量
  const getNodeOutgoingEdges = (nodeId: string): CustomEdge[] => {
    return edges.value.filter((e) => e.source === nodeId)
  }

  // 删除边
  const deleteEdge = (id: string) => {
    edges.value = edges.value.filter((e) => e.id !== id)
  }

  // 打开配置面板
  const openConfigPanel = (nodeId: string) => {
    editingNodeId.value = nodeId
    configPanelVisible.value = true
  }

  // 关闭配置面板
  const closeConfigPanel = () => {
    configPanelVisible.value = false
    editingNodeId.value = null
  }

  // 根据节点名称获取节点类型 - 精确匹配
  const getNodeTypeByName = (name: string): NodeType => {
    // 首先尝试精确匹配
    const exactMatch = nodeTemplates.find(t => t.name === name)
    if (exactMatch) return exactMatch.type

    // 如果没有精确匹配，尝试部分匹配（用于兼容旧数据）
    const partialMatch = nodeTemplates.find(t => name.includes(t.name))
    if (partialMatch) return partialMatch.type

    // 默认返回 print 类型
    return 'print'
  }

  // ==================== 导出为工作流 JSON 格式 ====================
  const exportWorkflow = (): WorkflowJson => {
    return {
      id: `workflow_${Date.now()}`,
      name: currentWorkflow.value.name,
      description: '由工作流编辑器生成',
      author: 'GameAutomation',
      version: '1.0',
      nodes: nodes.value.map(node => ({
        id: node.id,
        type: node.data?.type || 'print',
        position: node.position,
        // 确保数据格式一致
        data: {
          name: node.data?.name ?? '未命名节点',
          config: node.data?.config ?? {},
        },
      })),
      edges: edges.value.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type || 'default',
        condition: edge.condition,
        sourceHandle: edge.sourceHandle,
      })),
    }
  }

  // ==================== 从工作流 JSON 格式导入 ====================
  const importWorkflow = (workflow: WorkflowJson) => {
    // 清空现有数据并重置计数器
    nodes.value = []
    edges.value = []
    selectedNodeId.value = null
    resetIdCounters()

    // 更新当前工作流信息
    currentWorkflow.value = {
      id: workflow.id || '',
      name: workflow.name || '未命名工作流',
    }

    // 导入节点
    if (workflow.nodes && Array.isArray(workflow.nodes)) {
      // 检查是否已有开始节点
      const hasStartNode = workflow.nodes.some(n => n.id === 'node_1' || n.type === 'start')
      
      nodes.value = workflow.nodes.map((node, index) => {
        // 保留原始类型，特别是 group 类型
        const nodeType = node.type === 'group' ? 'group' : 'custom'
        
        return {
          id: node.id || generateNodeId(),
          type: nodeType,
          position: node.position || { x: 100, y: 100 + index * 100 },
          data: {
            name: node.data?.name || '未命名节点',
            type: node.type as NodeType || 'print',
            config: node.data?.config || {},
          },
        }
      })

      // 如果没有开始节点，自动创建
      if (!hasStartNode) {
        initStartNode()
      }

      // 更新节点ID计数器，确保新节点ID不会与导入的节点冲突
      const maxNodeId = workflow.nodes.reduce((max, node) => {
        const match = node.id?.match(/node_(\d+)/)
        if (match && match[1]) {
          const num = parseInt(match[1], 10)
          return Math.max(max, num)
        }
        return max
      }, 0)
      nodeIdCounter = Math.max(maxNodeId + 1, nodeIdCounter)
    } else {
      // 没有节点时创建开始节点
      initStartNode()
    }

    // 导入边
    if (workflow.edges && Array.isArray(workflow.edges)) {
      edges.value = workflow.edges.map((edge) => ({
        id: edge.id || generateEdgeId(),
        source: edge.source,
        target: edge.target,
        type: edge.type || 'default',
        condition: edge.condition,
        sourceHandle: edge.sourceHandle,
      }))

      // 更新边ID计数器
      const maxEdgeId = workflow.edges.reduce((max, edge) => {
        const match = edge.id?.match(/edge_(\d+)/)
        if (match && match[1]) {
          const num = parseInt(match[1], 10)
          return Math.max(max, num)
        }
        return max
      }, 0)
      edgeIdCounter = maxEdgeId + 1
    }
  }

  // 保存历史记录
  const saveHistory = () => {
    const snapshot = {
      nodes: JSON.parse(JSON.stringify(nodes.value)),
      edges: JSON.parse(JSON.stringify(edges.value))
    }
    
    // 如果在历史中间，删除后面的历史
    if (historyIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, historyIndex.value + 1)
    }
    
    history.value.push(snapshot)
    historyIndex.value = history.value.length - 1
    
    // 限制历史记录数量
    const maxHistory = 50
    if (history.value.length > maxHistory) {
      history.value = history.value.slice(-maxHistory)
      historyIndex.value = history.value.length - 1
    }
    
    // 保存到 localStorage
    saveHistoryToStorage()
  }
  
  // 保存历史到 localStorage
  const saveHistoryToStorage = () => {
    try {
      const data = {
        history: history.value,
        historyIndex: historyIndex.value
      }
      localStorage.setItem('workflow_history', JSON.stringify(data))
    } catch (e) {
      console.warn('Failed to save history to localStorage:', e)
    }
  }
  
  // 从 localStorage 加载历史
  const loadHistoryFromStorage = () => {
    try {
      const data = localStorage.getItem('workflow_history')
      if (data) {
        const parsed = JSON.parse(data)
        history.value = parsed.history || []
        historyIndex.value = parsed.historyIndex || -1
      }
    } catch (e) {
      console.warn('Failed to load history from localStorage:', e)
    }
  }
  
  // 撤销
  const undo = () => {
    if (historyIndex.value >= 0) {
      historyIndex.value--
      if (historyIndex.value >= 0) {
        const snapshot = history.value[historyIndex.value]
        if (snapshot) {
          nodes.value = JSON.parse(JSON.stringify(snapshot.nodes))
          edges.value = JSON.parse(JSON.stringify(snapshot.edges))
        }
      } else {
        // 回到初始状态
        nodes.value = []
        edges.value = []
        initStartNode()
      }
      
      // 保存到 localStorage
      saveHistoryToStorage()
    }
  }
  
  // 是否可以撤销
  const hasUndo = () => {
    return historyIndex.value >= 0
  }
  
  // 清空工作流
  const clearWorkflow = () => {
    nodes.value = []
    edges.value = []
    selectedNodeId.value = null
    resetIdCounters()
    currentWorkflow.value = {
      id: '',
      name: '未命名工作流'
    }
    // 清空后自动创建开始节点
    initStartNode()
  }

  // 新建工作流
  const newWorkflow = () => {
    clearWorkflow()
    currentWorkflow.value = {
      id: `workflow_${Date.now()}`,
      name: '未命名工作流'
    }
  }

  // 设置工作流名称
  const setWorkflowName = (name: string) => {
    currentWorkflow.value.name = name
  }

  return {
    nodes,
    edges,
    selectedNodeId,
    configPanelVisible,
    editingNodeId,
    nodeTemplates,
    selectedNode,
    editingNode,
    currentWorkflow,
    getNodeById,
    addNode,
    addGroupNode,
    updateGroupNode,
    deleteGroupNode,
    resizeGroupNode,
    updateNode,
    updateNodeData,
    updateNodeConfig,
    deleteNode,
    selectNode,
    addEdge,
    deleteEdge,
    openConfigPanel,
    closeConfigPanel,
    exportWorkflow,
    importWorkflow,
    clearWorkflow,
    newWorkflow,
    setWorkflowName,
    initStartNode,
    isDualNode,
    getNodeOutgoingEdges,
    saveHistory,
    undo,
    hasUndo,
    loadHistoryFromStorage,
  }
})
