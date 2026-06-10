---
name: "coraflow-skill"
description: "生成游戏自动化工作流 JSON 脚本。当用户想要创建新的工作流脚本、描述游戏自动化流程，或提到'生成脚本'、'创建工作流'时调用。"
---

# 工作流脚本生成器

根据用户描述生成游戏自动化工作流 JSON 脚本。

## 触发条件

当用户：

- 要求创建新的工作流脚本
- 描述游戏自动化流程
- 提到"生成脚本"、"创建工作流"
- 描述一系列自动化操作步骤

## 工作流结构

每个工作流脚本包含以下基本结构：

```json
{
  "id": "workflow_<timestamp>",
  "name": "<脚本名称>",
  "description": "由工作流编辑器生成",
  "author": "GameAutomation",
  "version": "1.0",
  "nodes": [...],
  "edges": [...]
}
```

---

## ⚠️ 节点格式规则（必须严格遵守）

### 节点结构

每个节点**必须**包含 `id`、`type`、`position`、`data` 四个字段，且 `data` 字段包含 `name` 和 `config`。

```json
{
  "id": "node_1",
  "type": "start",
  "position": { "x": 105, "y": 105 },
  "data": {
    "name": "开始",
    "config": {}
  }
}
```

### ❌ 错误格式：name/config 在 data 外

```json
// 错误！name 和 config 不应该在 data 外
{
  "id": "node_1",
  "type": "start",
  "name": "开始",
  "config": {},
  "position": { "x": 50, "y": 300 }
}
```

### ✅ 正确格式：name/config 在 data 内

```json
// 正确！
{
  "id": "node_1",
  "type": "start",
  "position": { "x": 105, "y": 105 },
  "data": {
    "name": "开始",
    "config": {}
  }
}
```

### 节点字段顺序

为保持 JSON 整洁，建议按以下顺序排列字段：

```json
{
  "id": "node_1",
  "type": "<类型>",
  "position": { "x": 105, "y": 105 },
  "data": {
    "name": "<名称>",
    "config": { ... }
  }
}
```

---

## ⚠️ 画布布局规则（必须严格遵守）

### 节点位置规范

- **画布单行最多 10 个节点**，超过 10 个节点必须换行
- **起始 x 坐标必须是 105**（不是 50 或其他值）
- 同行节点 x 坐标间隔：210
- 不同行 y 坐标间隔：240

| 行号    | y 坐标            |
| ------- | ----------------- |
| 第 1 行 | 105               |
| 第 2 行 | 345               |
| 第 3 行 | 585               |
| 第 4 行 | 825               |
| 第 N 行 | 105 + (N-1) × 240 |

### 位置计算公式

```
行号 = floor((节点索引 - 1) / 10)  // 从 0 开始
列号 = (节点索引 - 1) % 10           // 从 0 开始
x = 105 + 列号 × 210
y = 105 + 行号 × 240
```

### ✅ 正确位置示例（前 19 个节点）

```json
// 第 1 行 (y=105)
{ "id": "node_1",  "position": { "x": 105,  "y": 105 } },
{ "id": "node_2",  "position": { "x": 315,  "y": 105 } },
{ "id": "node_3",  "position": { "x": 525,  "y": 105 } },
{ "id": "node_4",  "position": { "x": 735,  "y": 105 } },
{ "id": "node_5",  "position": { "x": 945,  "y": 105 } },
{ "id": "node_6",  "position": { "x": 1155, "y": 105 } },
{ "id": "node_7",  "position": { "x": 1365, "y": 105 } },
{ "id": "node_8",  "position": { "x": 1575, "y": 105 } },
{ "id": "node_9",  "position": { "x": 1785, "y": 105 } },
{ "id": "node_10", "position": { "x": 1995, "y": 105 } },
// 第 2 行 (y=345)
{ "id": "node_11", "position": { "x": 105,  "y": 345 } },
{ "id": "node_12", "position": { "x": 315,  "y": 345 } },
{ "id": "node_13", "position": { "x": 525,  "y": 345 } },
{ "id": "node_14", "position": { "x": 735,  "y": 345 } },
{ "id": "node_15", "position": { "x": 945,  "y": 345 } },
{ "id": "node_16", "position": { "x": 1155, "y": 345 } },
{ "id": "node_17", "position": { "x": 1365, "y": 345 } },
{ "id": "node_18", "position": { "x": 1575, "y": 345 } },
{ "id": "node_19", "position": { "x": 1785, "y": 345 } }
```

---

## ⚠️ 边（edges）格式规则

### 边结构

每条边**必须**包含 `id`、`source`、`target`、`type` 四个字段。

```json
{
  "id": "edge_1",
  "source": "node_1",
  "target": "node_2",
  "type": "default"
}
```

### 边类型说明

| 类型        | 用途                         | 必填字段                                                      |
| ----------- | ---------------------------- | ------------------------------------------------------------- |
| `default`   | 单出口节点的连接             | `id`, `source`, `target`, `type`                              |
| `condition` | 双出口节点（判断节点）的连接 | `id`, `source`, `target`, `type`, `condition`, `sourceHandle` |

### 边 ID 命名规范

- 使用 `edge_1`, `edge_2`, `edge_3`, ... 递增格式
- 不允许使用 `判断A`、`点击A` 等中文/语义命名

### ❌ 错误：边没有 id 或 source/target

```json
// 错误！缺少 id
{ "source": "node_1", "target": "node_2", "type": "default" }
```

### ✅ 正确：边完整字段

```json
// 正确！
{ "id": "edge_1", "source": "node_1", "target": "node_2", "type": "default" }
```

---

## ⚠️ 节点出口数量规则（必须严格遵守）

**只有 3 个判断节点是双出口**，其他所有节点都是单出口。

### 双出口节点（2 条 condition 边）

| 节点类型              | 名称         | true 含义  | false 含义 |
| --------------------- | ------------ | ---------- | ---------- |
| `is_image_exist`      | 判断图片存在 | 图片存在   | 图片不存在 |
| `recognize_number`    | 识别数字     | 识别成功   | 识别失败   |
| `check_region_change` | 判断区域变化 | 区域有变化 | 区域无变化 |

**双出口节点的边示例**：

```json
{
  "id": "edge_true",
  "source": "node_isImageExist",
  "target": "node_action",
  "type": "condition",
  "condition": "true",
  "sourceHandle": "true"
},
{
  "id": "edge_false",
  "source": "node_isImageExist",
  "target": "node_print",
  "type": "condition",
  "condition": "false",
  "sourceHandle": "false"
}
```

### 单出口节点（1 条 default 边）

所有其他节点都只有 1 个出口，使用 `default` 类型边，**不要给它们加 condition 边**。

| 节点类型               | 名称           | 出口 |
| ---------------------- | -------------- | ---- |
| `start`                | 开始           | 1    |
| `set_window_size`      | 设置窗口大小   | 1    |
| `loop`                 | 循环           | 1    |
| `end_loop`             | 结束循环       | 1    |
| `delay`                | 延时           | 1    |
| `print`                | 打印           | 1    |
| `click_if_image_exist` | 图片存在则点击 | 1    |
| `left_click`           | 鼠标左键点击   | 1    |
| `right_click`          | 鼠标右键点击   | 1    |
| `drag`                 | 鼠标拖拽       | 1    |
| `key_press`            | 按键           | 1    |
| `wait_color`           | 等待颜色       | 1    |
| `ocr`                  | 文字识别       | 1    |

### 重要原则

1. **只有 `is_image_exist`、`recognize_number`、`check_region_change` 三个节点有双出口**
   - 它们既是检测也是判断，直接出 true/false 两路
   - **不需要额外的 if_condition 节点**
   - 必须输出一条 `condition: "true"` 边和一条 `condition: "false"` 边
   - 边的 `sourceHandle` 必须是 `"true"` 和 `"false"`

2. **其他所有节点都是单出口**
   - 包括 `click_if_image_exist`（虽然名字带 "if" 但它不是判断节点）
   - 输出边用 `default` 类型
   - **不要给它们加 condition 边！**

3. **不存在 if_condition 节点**
   - 不要使用 `if_condition` 类型
   - 不要使用其他不存在的节点类型

---

## 节点类型详情

### 基础节点

| 类型              | 名称         | 配置（data.config）                          | 出口 | 需要 count |
| ----------------- | ------------ | -------------------------------------------- | ---- | ---------- |
| `start`           | 开始         | `{}`                                         | 1    | ❌         |
| `set_window_size` | 设置窗口大小 | `{"width": 820, "height": 500, "count": -1}` | 1    | ✅         |
| `loop`            | 循环         | `{"count": -1}`                              | 1    | ✅         |
| `end_loop`        | 结束循环     | `{}`                                         | 1    | ❌         |
| `delay`           | 延时         | `{"ms": 1000, "count": -1}`                  | 1    | ✅         |
| `print`           | 打印         | `{"message": "消息内容", "count": -1}`       | 1    | ✅         |

### 判断节点（双出口）

| 类型                  | 名称         | 配置（data.config）                                                                         | 出口                | 需要 count |
| --------------------- | ------------ | ------------------------------------------------------------------------------------------- | ------------------- | ---------- |
| `is_image_exist`      | 判断图片存在 | `{"image": "", "threshold": 0.8, "var": "result", "region": [0, 0, 100, 100], "count": -1}` | **2（true/false）** | ✅         |
| `recognize_number`    | 识别数字     | `{"region": [0, 0, 100, 100], "var": "num", "count": -1}`                                   | **2（true/false）** | ✅         |
| `check_region_change` | 判断区域变化 | `{"region": [0, 0, 100, 100], "diff_threshold": 0.5, "var": "changed", "count": -1}`        | **2（true/false）** | ✅         |

### 动作节点

| 类型                   | 名称           | 配置（data.config）                                                                                       | 出口 | 需要 count |
| ---------------------- | -------------- | --------------------------------------------------------------------------------------------------------- | ---- | ---------- |
| `click_if_image_exist` | 图片存在则点击 | `{"image": "", "threshold": 0.8, "offset": 3, "var": "clicked", "region": [0, 0, 100, 100], "count": -1}` | 1    | ✅         |
| `left_click`           | 左键点击       | `{"x": 100, "y": 200, "count": -1}`                                                                       | 1    | ✅         |
| `right_click`          | 右键点击       | `{"x": 100, "y": 200, "count": -1}`                                                                       | 1    | ✅         |
| `drag`                 | 拖拽           | `{"start_x": 100, "start_y": 200, "end_x": 300, "end_y": 400, "count": -1}`                               | 1    | ✅         |
| `key_press`            | 按键           | `{"key": "enter", "count": -1}`                                                                           | 1    | ✅         |
| `wait_color`           | 等待颜色       | `{"x": 100, "y": 200, "color": "#FFFFFF", "tolerance": 10, "count": -1}`                                  | 1    | ✅         |
| `ocr`                  | 文字识别       | `{"region": [0, 0, 100, 100], "var": "text", "count": -1}`                                                | 1    | ✅         |

---

## ⚠️ count 参数规则

- **所有节点都需要 `count` 参数**（特殊节点除外）
- `count: -1` 表示无限循环
- 特殊节点（不需要 count）：`start`、`end_loop`

**正确示例**：

```json
{
  "id": "node_2",
  "type": "delay",
  "position": { "x": 315, "y": 105 },
  "data": {
    "name": "延时",
    "config": { "ms": 1000, "count": -1 } // ✅ 有 count
  }
}
```

**错误示例**：

```json
{
  "id": "node_2",
  "type": "delay",
  "position": { "x": 315, "y": 105 },
  "data": {
    "name": "延时",
    "config": { "ms": 1000 } // ❌ 缺少 count
  }
}
```

---

## 连接模式示例

### 模式1：判断图片+点击

```
is_image_exist(A)
  ├─ true → click_if_image_exist(A) → 下一逻辑
  └─ false → print("未找到") → 下一逻辑
```

**JSON 边示例**：

```json
[
  {
    "id": "edge_true_1",
    "source": "node_judgeA",
    "target": "node_clickA",
    "type": "condition",
    "condition": "true",
    "sourceHandle": "true"
  },
  {
    "id": "edge_false_1",
    "source": "node_judgeA",
    "target": "node_printA",
    "type": "condition",
    "condition": "false",
    "sourceHandle": "false"
  },
  {
    "id": "edge_3",
    "source": "node_clickA",
    "target": "node_next",
    "type": "default"
  },
  {
    "id": "edge_4",
    "source": "node_printA",
    "target": "node_next",
    "type": "default"
  }
]
```

### 模式2：多个判断串联

```
判断A
  ├─ true → 动作A → 判断B
  │                  ├─ true → 动作B → 下一逻辑
  │                  └─ false → 打印B → 下一逻辑
  └─ false → 打印A → 判断B（同上）
```

**关键**：每个判断都是直接出 2 条边，不需要额外的 if 节点。

### 模式3：循环中打印

```
start → loop → delay → print → end_loop
```

### 模式4：识别数字后判断

```
recognize_number
  ├─ true → 动作 → 下一逻辑
  └─ false → 打印失败 → 下一逻辑
```

---

## 常见错误（必须避免）

### ❌ 错误1：使用不存在的 if_condition 节点

```json
// 错误！不存在 if_condition 节点
{ "id": "if_node", "type": "if_condition", "position": {...}, "data": {...} }
```

### ❌ 错误2：节点缺少 data 字段

```json
// 错误！name 和 config 在 data 外
{
  "id": "node_1",
  "type": "start",
  "name": "开始",
  "config": {},
  "position": { "x": 50, "y": 300 }
}
```

### ❌ 错误3：起始 x 坐标不是 105

```json
// 错误！起始 x 应该是 105
{ "id": "node_1", "position": { "x": 50, "y": 300 } }
// 正确！
{ "id": "node_1", "position": { "x": 105, "y": 105 } }
```

### ❌ 错误4：所有节点放在同一行

```json
// 错误！19 个节点都在 y=300，应该换行
{ "id": "node_1",  "position": { "x": 50,   "y": 300 } },
{ "id": "node_2",  "position": { "x": 260,  "y": 300 } },
...
{ "id": "node_19", "position": { "x": 3830, "y": 300 } }
```

### ❌ 错误5：给单出口节点加 condition 边

```json
// 错误！click_if_image_exist 只有 1 个出口
{
  "id": "edge_1",
  "source": "click_node",
  "target": "next",
  "type": "condition",
  "condition": "true"
}
```

### ❌ 错误6：判断节点只有 1 条边

```json
// 错误！判断节点必须有 2 条边
{
  "id": "edge_1",
  "source": "is_image_exist",
  "target": "next",
  "type": "default"
}
```

### ❌ 错误7：边缺少 id 字段

```json
// 错误！边必须有 id
{ "source": "node_1", "target": "node_2", "type": "default" }
```

### ❌ 错误8：节点缺少 count 参数

```json
// 错误！delay 节点必须包含 count
{ "data": { "name": "延时", "config": { "ms": 1000 } } }
// 正确！
{ "data": { "name": "延时", "config": { "ms": 1000, "count": -1 } } }
```

---

## 生成规则总结

1. **节点结构**：每个节点必须有 `id`、`type`、`position`、`data`，其中 `data` 包含 `name` 和 `config`
2. **节点 ID**：使用 `node_1`, `node_2`, ... 递增格式
3. **画布布局**：起始 x=105，y=105，x 间隔 210，y 间隔 240，每行最多 10 个节点
4. **边结构**：每条边必须有 `id`、`source`、`target`、`type`
5. **边 ID**：使用 `edge_1`, `edge_2`, ... 递增格式
6. **双出口节点**：`is_image_exist`、`recognize_number`、`check_region_change` 必须各有 2 条 condition 边（带 sourceHandle）
7. **单出口节点**：其他所有节点只有 1 条 default 边
8. **count 参数**：除 `start`、`end_loop` 外，所有节点都必须有 `count` 字段
9. **图片路径留空**：`image` 字段设为空字符串 `""`，由用户手动替换
10. **区域坐标**：`region` 使用占位符 `[0, 0, 100, 100]`
11. **不要使用不存在的节点类型**（如 `if_condition`）

---

## 输出格式

生成脚本后，输出：

```
✅ 工作流脚本已生成！

📄 文件名: <名称>.json
📍 保存位置: <路径>

📝 需要手动配置的内容:
- 图片路径: X 处
- 区域坐标: Y 处
- 窗口大小: 建议根据游戏窗口调整

🔗 连接验证:
- 判断节点（双出口）: N 个（每个 2 条边）✓
- 单出口节点: M 个（每个 1 条边）✓
- 不存在节点: 0 ✓

💡 提示:
- 图片路径填写相对于脚本文件的路径
- 区域坐标 [x1, y1, x2, y2] 表示左上角和右下角
- threshold 阈值范围 0-1，越大匹配越严格
```

---

## 使用流程

1. 用户描述工作流需求
2. AI 分析需求，识别需要的节点类型
3. 根据节点规则和画布布局规则生成 JSON 脚本
4. 提示用户需要手动填充的内容（图片路径、区域坐标、窗口大小等）
5. 保存到指定位置
