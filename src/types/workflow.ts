// 工作流节点类型
export type NodeType =
  | 'start'
  | 'set_window_size'
  | 'delay'
  | 'click_if_image_exist'
  | 'is_image_exist'
  | 'check_region_change'
  | 'click_if_color_exist'
  | 'loop'
  | 'end_loop'
  | 'print'
  | 'click'
  | 'right_click'
  | 'drag'
  | 'abort'
  | 'recognize_number'
  | 'recognize_text'
  | 'group'

// 工作流节点配置
export interface NodeConfig {
  // set_window_size
  width?: number
  height?: number
  // delay
  ms?: number
  // click_if_image_exist / is_image_exist
  image?: string
  threshold?: number
  offset?: number
  var?: string
  region?: [number, number, number, number] | null // [x1, y1, x2, y2] 开始坐标,结束坐标
  // check_region_change
  diff_threshold?: number // 变化检测阈值
  // click_if_color_exist
  color?: string // 目标颜色 (HEX格式, 如 #FF0000)
  color_threshold?: number // 颜色匹配阈值
  offset_x?: number // X坐标偏移量
  offset_y?: number // Y坐标偏移量
  // loop
  count?: number
  // print
  message?: string
  // click / right_click
  x?: number
  y?: number
  random_x?: number // X坐标随机偏移范围（-random_x 到 +random_x）
  random_y?: number // Y坐标随机偏移范围（-random_y 到 +random_y）
  // drag
  x1?: number
  y1?: number
  x2?: number
  y2?: number
  duration?: number
  release_delay?: number
  // recognize_number
  var_a?: string // 第一个值: 'A' 或 'B'
  operator?: string // 比较运算符: '>', '<', '=', 'in'
  var_b?: string // 第二个值: 'A' 或 'B'
  // 注: threshold 字段已在上方定义（用于图片识别阈值）
  // recognize_text
  text_to_find?: string // 要查找的文本
  // abort
  loop_count?: number // 循环次数条件：0表示立即中止，>0表示循环指定次数后中止
}

// 工作流节点数据
export interface WorkflowNodeData {
  name: string
  type: NodeType
  config: NodeConfig
}

// 自定义节点类型（简化版，兼容 Vue Flow）
export interface CustomNode {
  id: string
  type: string
  position: { x: number; y: number }
  data: WorkflowNodeData
  selected?: boolean
  dragging?: boolean
}

// 边类型 - 单线或条件边（双线）
export type EdgeType = 'default' | 'condition'

// 自定义边类型（兼容 Vue Flow）
export interface CustomEdge {
  id: string
  source: string
  target: string
  type?: EdgeType
  condition?: 'true' | 'false'
  sourceHandle?: string
  label?: string
}

// 节点分类 - 单线或双线
export type NodeCategory = 'single' | 'dual'

// 双线节点类型列表（条件判断节点，有true/false两个输出）
export const DUAL_NODE_TYPES: NodeType[] = ['is_image_exist', 'check_region_change', 'recognize_number', 'recognize_text']

// 判断节点是否为双线节点
export const isDualNode = (type: NodeType): boolean => {
  return DUAL_NODE_TYPES.includes(type)
}

// 工作流 JSON 格式
export interface WorkflowJson {
  id: string
  name: string
  description: string
  author: string
  version: string
  nodes: {
    id: string
    type: NodeType
    position: { x: number; y: number }
    data: {
      name: string
      config: NodeConfig
    }
  }[]
  edges: CustomEdge[]
}

// 工具栏节点模板
export interface NodeTemplate {
  type: NodeType
  name: string
  icon: string
  description?: string
}
