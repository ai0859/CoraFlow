<template>
  <div v-if="store.configPanelVisible" class="config-panel-overlay" @click="handleOverlayClick">
    <div class="config-panel" @click.stop>
      <div class="panel-header">
        <h3>节点配置</h3>
        <button class="close-btn" @click="store.closeConfigPanel">×</button>
      </div>

      <div v-if="node && node.data" class="panel-content">
        <!-- 通用配置 -->
        <div class="config-section">
          <div class="form-group">
            <label>节点名称</label>
            <input v-model="node.data.name" type="text" class="form-input" />
          </div>
        </div>

        <!-- 设置窗口大小配置 -->
        <template v-if="isSetWindowSize">
          <div class="config-section">
            <div class="form-row">
              <div class="form-group">
                <label>宽度</label>
                <input v-model.number="config.width" type="number" class="form-input" />
              </div>
              <div class="form-group">
                <label>高度</label>
                <input v-model.number="config.height" type="number" class="form-input" />
              </div>
            </div>
          </div>
        </template>

        <!-- 延时配置 -->
        <template v-if="isDelay">
          <div class="config-section">
            <div class="form-group">
              <label>延迟时间（毫秒）</label>
              <input v-model.number="config.ms" type="number" class="form-input" min="0" />
            </div>
          </div>
        </template>

        <!-- 判断图片点击配置 -->
        <template v-if="isClickIfImageExist">
          <div class="config-section">

            <div class="form-group">
              <label>选择图片</label>
              <input ref="imageInput" type="file" accept="image/*" style="display: none" @change="handleImageSelect" />
              <button type="button" class="file-select-btn" @click="triggerImageSelect">
                浏览...
              </button>
              <span v-if="config.image" class="file-name">{{ config.image }}</span>
              <div class="form-group">
                <label>图片路径</label>
                <input v-model="config.image" type="text" class="form-input"
                  placeholder="如: C:\\Users\\Administrator\\Desktop\\image.png" />
              </div>
            </div>
            <div v-if="imagePreview" class="image-preview">
              <img :src="imagePreview" alt="预览" />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>阈值 (0-1)</label>
                <input v-model.number="config.threshold" type="number" class="form-input" min="0" max="1" step="0.1" />
              </div>
              <div class="form-group">
                <label>偏移量</label>
                <input v-model.number="config.offset" type="number" class="form-input" />
              </div>
            </div>
            <!-- 区域配置 -->
            <div class="config-section">
              <div class="form-row">
                <div class="form-group">
                  <label>查找区域</label>
                  <select v-model="regionMode" class="form-input" @change="handleRegionModeChange">
                    <option value="full">全窗口</option>
                    <option value="custom">自定义区域</option>
                  </select>
                </div>
              </div>
              <template v-if="regionMode === 'custom'">
                <div class="form-row">
                  <div class="form-group">
                    <label>开始 X</label>
                    <input v-model.number="regionStartX" type="number" class="form-input" placeholder="0"
                      @paste="handlePasteCoordinates($event, 'start')" />
                  </div>
                  <div class="form-group">
                    <label>开始 Y</label>
                    <input v-model.number="regionStartY" type="number" class="form-input" placeholder="0" />
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>结束 X</label>
                    <input v-model.number="regionEndX" type="number" class="form-input" placeholder="1920"
                      @paste="handlePasteCoordinates($event, 'end')" />
                  </div>
                  <div class="form-group">
                    <label>结束 Y</label>
                    <input v-model.number="regionEndY" type="number" class="form-input" placeholder="1080" />
                  </div>
                </div>
              </template>
            </div>
          </div>
        </template>

        <!-- 判断图片存在配置 -->
        <template v-if="isImageExist">
          <div class="config-section">


            <div class="form-group">
              <label>选择图片</label>
              <input ref="imageInput" type="file" accept="image/*" style="display: none" @change="handleImageSelect" />
              <button type="button" class="file-select-btn" @click="triggerImageSelect">
                浏览...
              </button>
              <span v-if="config.image" class="file-name">{{ config.image }}</span>
            </div>
            <div v-if="imagePreview" class="image-preview">
              <img :src="imagePreview" alt="预览" />
            </div>
            <div class="form-group">
              <label>图片路径（可手动修改）</label>
              <input v-model="config.image" type="text" class="form-input"
                placeholder="如: C:\\Users\\Administrator\\Desktop\\image.png" />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>阈值 (0-1)</label>
                <input v-model.number="config.threshold" type="number" class="form-input" min="0" max="1" step="0.1" />
              </div>
            </div>
            <!-- 区域配置 -->
            <div class="config-section">
              <div class="form-row">
                <div class="form-group">
                  <label>查找区域</label>
                  <select v-model="regionMode" class="form-input" @change="handleRegionModeChange">
                    <option value="full">全窗口</option>
                    <option value="custom">自定义区域</option>
                  </select>
                </div>
              </div>
              <template v-if="regionMode === 'custom'">
                <div class="form-row">
                  <div class="form-group">
                    <label>开始 X</label>
                    <input v-model.number="regionStartX" type="number" class="form-input" placeholder="0"
                      @paste="handlePasteCoordinates($event, 'start')" />
                  </div>
                  <div class="form-group">
                    <label>开始 Y</label>
                    <input v-model.number="regionStartY" type="number" class="form-input" placeholder="0" />
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>结束 X</label>
                    <input v-model.number="regionEndX" type="number" class="form-input" placeholder="1920"
                      @paste="handlePasteCoordinates($event, 'end')" />
                  </div>
                  <div class="form-group">
                    <label>结束 Y</label>
                    <input v-model.number="regionEndY" type="number" class="form-input" placeholder="1080" />
                  </div>
                </div>
              </template>
            </div>
          </div>
        </template>

        <!-- 循环配置 -->
        <template v-if="isLoop">
          <div class="config-section">
            <div class="form-group">
              <label>循环模式</label>
              <select v-model="loopMode" class="form-input" @change="handleLoopModeChange">
                <option value="infinite">无限循环</option>
                <option value="count">指定次数</option>
              </select>
            </div>
            <div v-if="loopMode === 'count'" class="form-group">
              <label>循环次数</label>
              <input v-model.number="config.count" type="number" class="form-input" min="1" />
            </div>
          </div>
        </template>

        <!-- 检测区域变化配置 -->
        <template v-if="isCheckRegionChange">
          <div class="config-section">
            <div class="form-row">
              <div class="form-group">
                <label>变化阈值 (0-1)</label>
                <input v-model.number="config.diff_threshold" type="number" class="form-input" min="0" max="1"
                  step="0.01" />
              </div>
              <div class="form-group">
                <label>变量名</label>
                <input v-model="config.var" type="text" class="form-input" placeholder="changed" />
              </div>
            </div>
            <!-- 区域配置 - 4个坐标必填 -->
            <div class="config-section">
              <div class="section-title">检测区域（必填）</div>
              <div class="form-row">
                <div class="form-group">
                  <label>开始 X *</label>
                  <input v-model.number="regionStartX" type="number" class="form-input" placeholder="0" required
                    @paste="handlePasteCoordinates($event, 'start')" />
                </div>
                <div class="form-group">
                  <label>开始 Y *</label>
                  <input v-model.number="regionStartY" type="number" class="form-input" placeholder="0" required />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>结束 X *</label>
                  <input v-model.number="regionEndX" type="number" class="form-input" placeholder="1920" required
                    @paste="handlePasteCoordinates($event, 'end')" />
                </div>
                <div class="form-group">
                  <label>结束 Y *</label>
                  <input v-model.number="regionEndY" type="number" class="form-input" placeholder="1080" required />
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- 判断颜色存在配置 -->
        <template v-if="isClickIfColorExist">
          <div class="config-section">
            <div class="form-group">
              <label>目标颜色 (如: #ff0000)</label>
              <input v-model="config.color" type="text" class="form-input" placeholder="#ff0000" />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>X 偏移量</label>
                <input v-model.number="config.offset_x" type="number" class="form-input" placeholder="0"
                  @paste="handlePasteOffsetCoordinates" />
              </div>
              <div class="form-group">
                <label>Y 偏移量</label>
                <input v-model.number="config.offset_y" type="number" class="form-input" placeholder="0" />
              </div>
            </div>
            <!-- 区域配置 - 4个坐标必填 -->
            <div class="config-section">
              <div class="section-title">检测区域（必填）</div>
              <div class="form-row">
                <div class="form-group">
                  <label>开始 X *</label>
                  <input v-model.number="regionStartX" type="number" class="form-input" placeholder="0" required
                    @paste="handlePasteCoordinates($event, 'start')" />
                </div>
                <div class="form-group">
                  <label>开始 Y *</label>
                  <input v-model.number="regionStartY" type="number" class="form-input" placeholder="0" required />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>结束 X *</label>
                  <input v-model.number="regionEndX" type="number" class="form-input" placeholder="1920" required
                    @paste="handlePasteCoordinates($event, 'end')" />
                </div>
                <div class="form-group">
                  <label>结束 Y *</label>
                  <input v-model.number="regionEndY" type="number" class="form-input" placeholder="1080" required />
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- 左键点击配置 -->
        <template v-if="isClick">
          <div class="config-section">
            <div class="form-row">
              <div class="form-group">
                <label>X 坐标</label>
                <input v-model.number="config.x" type="number" class="form-input"
                  @paste="handlePasteClickCoordinates" />
              </div>
              <div class="form-group">
                <label>Y 坐标</label>
                <input v-model.number="config.y" type="number" class="form-input" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>X 上下随机偏移</label>
                <input v-model.number="config.random_x" type="number" min="0" class="form-input" placeholder="0" />
              </div>
              <div class="form-group">
                <label>Y 上下随机偏移</label>
                <input v-model.number="config.random_y" type="number" min="0" class="form-input" placeholder="0" />
              </div>
            </div>
          </div>
        </template>

        <!-- 右键点击配置 -->
        <template v-if="isRightClick">
          <div class="config-section">
            <div class="form-row">
              <div class="form-group">
                <label>X 坐标</label>
                <input v-model.number="config.x" type="number" class="form-input"
                  @paste="handlePasteClickCoordinates" />
              </div>
              <div class="form-group">
                <label>Y 坐标</label>
                <input v-model.number="config.y" type="number" class="form-input" />
              </div>
            </div>
          </div>
        </template>

        <!-- 拖拽配置 -->
        <template v-if="isDrag">
          <div class="config-section">
            <div class="form-row">
              <div class="form-group">
                <label>起点 X</label>
                <input v-model.number="config.x1" type="number" class="form-input"
                  @paste="handlePasteDragStartCoordinates" />
              </div>
              <div class="form-group">
                <label>起点 Y</label>
                <input v-model.number="config.y1" type="number" class="form-input" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>终点 X</label>
                <input v-model.number="config.x2" type="number" class="form-input"
                  @paste="handlePasteDragEndCoordinates" />
              </div>
              <div class="form-group">
                <label>终点 Y</label>
                <input v-model.number="config.y2" type="number" class="form-input" />
              </div>
            </div>
            <div class="form-group">
              <label>移动时长（秒）</label>
              <input v-model.number="config.duration" type="number" class="form-input" min="0.1" step="0.1" />
            </div>
            <div class="form-group">
              <label>释放延迟（秒）</label>
              <input v-model.number="config.release_delay" type="number" class="form-input" min="0" step="0.1" />
            </div>
          </div>
        </template>

        <!-- 打印配置 -->
        <template v-if="isPrint">
          <div class="config-section">
            <div class="form-group">
              <label>消息内容</label>
              <textarea v-model="config.message" class="form-textarea" rows="3" placeholder="要输出的消息内容"></textarea>
            </div>
          </div>
        </template>

        <!-- 中止配置 -->
        <template v-if="isAbort">
          <div class="config-section">

            <div class="form-group">
              <label>循环次数条件，0表示立即中止</label>
              <div class="input-with-suffix"><input v-model.number="config.loop_count" type="number" min="0"
                  class="form-input" placeholder="0"><span class="input-suffix">次</span></div>
            </div>
            <div class="form-group">
              <label>提示信息</label>
              <textarea v-model="config.message" class="form-textarea" rows="3" placeholder="工作流被中止时输出的异常信息"></textarea>
            </div>
          </div>
        </template>

        <!-- 识别数字配置 -->
        <template v-if="isRecognizeNumber">
          <div class="config-section">
            <div class="section-title">识别数字并比较</div>
            <div class="form-row">
              <div class="form-group">
                <label>第一个值</label>
                <select v-model="config.var_a" class="form-input">
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                </select>
              </div>
              <div class="form-group">
                <label>运算符</label>
                <select v-model="config.operator" class="form-input">
                  <option value=">">大于 (>) </option>
                  <option value="<">小于 (<) </option>
                  <option value="=">等于 (=) </option>
                  <option value="in">属于 (in) </option>
                </select>
              </div>
              <div class="form-group">
                <label>第二个值</label>
                <select v-model="config.var_b" class="form-input">
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>百分比阈值</label>
                <div class="input-with-suffix">
                  <input v-model.number="config.threshold" type="number" class="form-input" min="0" max="100" />
                  <span class="input-suffix">%</span>
                </div>
              </div>
            </div>
            <!-- 区域配置 - 4个坐标必填 -->
            <div class="config-section">
              <div class="section-title">识别区域（必填）</div>
              <div class="form-row">
                <div class="form-group">
                  <label>开始 X *</label>
                  <input v-model.number="regionStartX" type="number" class="form-input" placeholder="0" required
                    @paste="handlePasteCoordinates($event, 'start')" />
                </div>
                <div class="form-group">
                  <label>开始 Y *</label>
                  <input v-model.number="regionStartY" type="number" class="form-input" placeholder="0" required />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>结束 X *</label>
                  <input v-model.number="regionEndX" type="number" class="form-input" placeholder="1920" required
                    @paste="handlePasteCoordinates($event, 'end')" />
                </div>
                <div class="form-group">
                  <label>结束 Y *</label>
                  <input v-model.number="regionEndY" type="number" class="form-input" placeholder="1080" required />
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- 识别文字配置 -->
        <template v-if="isRecognizeText">
          <div class="config-section">
            <div class="section-title">识别文字并判断</div>
            <div class="form-group">
              <label>要查找的文本</label>
              <input v-model="config.text_to_find" type="text" class="form-input" placeholder="输入要查找的文本" />
            </div>
            <!-- 区域配置 - 4个坐标必填 -->
            <div class="config-section">
              <div class="section-title">识别区域（必填）</div>
              <div class="form-row">
                <div class="form-group">
                  <label>开始 X *</label>
                  <input v-model.number="regionStartX" type="number" class="form-input" placeholder="0" required
                    @paste="handlePasteCoordinates($event, 'start')" />
                </div>
                <div class="form-group">
                  <label>开始 Y *</label>
                  <input v-model.number="regionStartY" type="number" class="form-input" placeholder="0" required />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>结束 X *</label>
                  <input v-model.number="regionEndX" type="number" class="form-input" placeholder="1920" required
                    @paste="handlePasteCoordinates($event, 'end')" />
                </div>
                <div class="form-group">
                  <label>结束 Y *</label>
                  <input v-model.number="regionEndY" type="number" class="form-input" placeholder="1080" required />
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- 按钮 -->
        <div class="panel-actions">
          <button class="btn btn-primary" @click="handleSave">保存</button>
          <button class="btn btn-secondary" @click="store.closeConfigPanel">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useWorkflowStore } from '@/stores/workflow'
import type { NodeConfig } from '@/types/workflow'

const store = useWorkflowStore()
const imageInput = ref<HTMLInputElement>()
const imagePreview = ref<string>('')

// 区域配置相关
const regionMode = ref<'full' | 'custom'>('full')
const regionStartX = ref<number>(0)
const regionStartY = ref<number>(0)
const regionEndX = ref<number>(1920)
const regionEndY = ref<number>(1080)

// 循环模式相关
const loopMode = ref<'infinite' | 'count'>('infinite')

const node = computed(() => store.editingNode)

// 判断节点类型 - 使用 node.data.type 而不是 node.data.name
const isSetWindowSize = computed(() => node.value?.data?.type === 'set_window_size')
const isDelay = computed(() => node.value?.data?.type === 'delay')
const isClickIfImageExist = computed(() => node.value?.data?.type === 'click_if_image_exist')
const isImageExist = computed(() => node.value?.data?.type === 'is_image_exist')
const isCheckRegionChange = computed(() => node.value?.data?.type === 'check_region_change')
const isClickIfColorExist = computed(() => node.value?.data?.type === 'click_if_color_exist')
const isClick = computed(() => node.value?.data?.type === 'click')
const isRightClick = computed(() => node.value?.data?.type === 'right_click')
const isDrag = computed(() => node.value?.data?.type === 'drag')
const isLoop = computed(() => node.value?.data?.type === 'loop')
const isPrint = computed(() => node.value?.data?.type === 'print')
const isAbort = computed(() => node.value?.data?.type === 'abort')
const isRecognizeNumber = computed(() => node.value?.data?.type === 'recognize_number')
const isRecognizeText = computed(() => node.value?.data?.type === 'recognize_text')

// 创建一个可编辑的配置副本
const config = ref<NodeConfig>({})

// 当节点变化时，更新配置副本
watch(
  () => store.editingNode?.data?.config,
  (newConfig) => {
    if (newConfig) {
      config.value = JSON.parse(JSON.stringify(newConfig))
      // 清除图片预览
      imagePreview.value = ''
      // 初始化区域配置
      initRegionConfig()
      // 初始化循环模式
      initLoopMode()
    }
  },
  { immediate: true },
)

// 初始化区域配置
const initRegionConfig = () => {
  const region = config.value.region
  // 识别数字和识别文字节点需要强制使用自定义区域
  if (isRecognizeNumber.value || isRecognizeText.value) {
    regionMode.value = 'custom'
    if (region && region.length === 4) {
      regionStartX.value = region[0]
      regionStartY.value = region[1]
      regionEndX.value = region[2]
      regionEndY.value = region[3]
    } else {
      regionStartX.value = 0
      regionStartY.value = 0
      regionEndX.value = 100
      regionEndY.value = 50
    }
  } else if (region && region.length === 4) {
    regionMode.value = 'custom'
    regionStartX.value = region[0]
    regionStartY.value = region[1]
    regionEndX.value = region[2]
    regionEndY.value = region[3]
  } else {
    regionMode.value = 'full'
    regionStartX.value = 0
    regionStartY.value = 0
    regionEndX.value = 1920
    regionEndY.value = 1080
  }
}

// 处理区域模式变化
const handleRegionModeChange = () => {
  if (regionMode.value === 'full') {
    config.value.region = null
  } else {
    config.value.region = [regionStartX.value, regionStartY.value, regionEndX.value, regionEndY.value]
  }
}

// 初始化循环模式
const initLoopMode = () => {
  // 如果 count 为 -1 或未定义，表示无限循环
  if (config.value.count === -1 || config.value.count === undefined) {
    loopMode.value = 'infinite'
    config.value.count = -1
  } else {
    loopMode.value = 'count'
  }
}

// 处理循环模式变化
const handleLoopModeChange = () => {
  if (loopMode.value === 'infinite') {
    config.value.count = -1
  } else {
    config.value.count = config.value.count || 6
  }
}

// 监听区域坐标变化，自动更新 config
watch([regionStartX, regionStartY, regionEndX, regionEndY], () => {
  // 识别数字和识别文字节点强制使用自定义区域
  if (regionMode.value === 'custom' || isRecognizeNumber.value || isRecognizeText.value) {
    config.value.region = [regionStartX.value, regionStartY.value, regionEndX.value, regionEndY.value]
  }
})

// 处理粘贴事件，支持逗号分隔的坐标 - 用于检测区域
const handlePasteCoordinates = (e: ClipboardEvent, target: 'start' | 'end') => {
  const pastedText = e.clipboardData?.getData('text')
  if (!pastedText) return

  // 检查是否包含逗号
  if (pastedText.includes(',')) {
    e.preventDefault()
    const parts = pastedText.split(',').map(s => s.trim()).filter(s => s)

    if (parts.length >= 2) {
      const x = parseInt(parts[0] || '0', 10)
      const y = parseInt(parts[1] || '0', 10)

      if (!isNaN(x) && !isNaN(y)) {
        if (target === 'start') {
          regionStartX.value = x
          regionStartY.value = y
        } else {
          regionEndX.value = x
          regionEndY.value = y
        }
      }
    }
  }
}

// 处理粘贴事件，支持逗号分隔的坐标 - 用于点击坐标
const handlePasteClickCoordinates = (e: ClipboardEvent) => {
  const pastedText = e.clipboardData?.getData('text')
  if (!pastedText) return

  // 检查是否包含逗号
  if (pastedText.includes(',')) {
    e.preventDefault()
    const parts = pastedText.split(',').map(s => s.trim()).filter(s => s)

    if (parts.length >= 2) {
      const x = parseInt(parts[0] || '0', 10)
      const y = parseInt(parts[1] || '0', 10)

      if (!isNaN(x) && !isNaN(y)) {
        config.value.x = x
        config.value.y = y
      }
    }
  }
}

// 处理粘贴事件，支持逗号分隔的坐标 - 用于偏移量
const handlePasteOffsetCoordinates = (e: ClipboardEvent) => {
  const pastedText = e.clipboardData?.getData('text')
  if (!pastedText) return

  // 检查是否包含逗号
  if (pastedText.includes(',')) {
    e.preventDefault()
    const parts = pastedText.split(',').map(s => s.trim()).filter(s => s)

    if (parts.length >= 2) {
      const x = parseInt(parts[0] || '0', 10)
      const y = parseInt(parts[1] || '0', 10)

      if (!isNaN(x) && !isNaN(y)) {
        config.value.offset_x = x
        config.value.offset_y = y
      }
    }
  }
}

// 处理粘贴事件，支持逗号分隔的坐标 - 用于拖拽起点
const handlePasteDragStartCoordinates = (e: ClipboardEvent) => {
  const pastedText = e.clipboardData?.getData('text')
  if (!pastedText) return

  // 检查是否包含逗号
  if (pastedText.includes(',')) {
    e.preventDefault()
    const parts = pastedText.split(',').map(s => s.trim()).filter(s => s)

    if (parts.length >= 2) {
      const x = parseInt(parts[0] || '0', 10)
      const y = parseInt(parts[1] || '0', 10)

      if (!isNaN(x) && !isNaN(y)) {
        config.value.x1 = x
        config.value.y1 = y
      }
    }
  }
}

// 处理粘贴事件，支持逗号分隔的坐标 - 用于拖拽终点
const handlePasteDragEndCoordinates = (e: ClipboardEvent) => {
  const pastedText = e.clipboardData?.getData('text')
  if (!pastedText) return

  // 检查是否包含逗号
  if (pastedText.includes(',')) {
    e.preventDefault()
    const parts = pastedText.split(',').map(s => s.trim()).filter(s => s)

    if (parts.length >= 2) {
      const x = parseInt(parts[0] || '0', 10)
      const y = parseInt(parts[1] || '0', 10)

      if (!isNaN(x) && !isNaN(y)) {
        config.value.x2 = x
        config.value.y2 = y
      }
    }
  }
}

const triggerImageSelect = () => {
  imageInput.value?.click()
}

const handleImageSelect = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  // 更新图片路径（使用文件名）
  config.value.image = file.name

  // 生成图片预览
  const reader = new FileReader()
  reader.onload = (event) => {
    imagePreview.value = event.target?.result as string
  }
  reader.readAsDataURL(file)

  // 清空input，允许重复选择同一文件
  target.value = ''
}

const handleOverlayClick = () => {
  store.closeConfigPanel()
}

const handleSave = () => {
  if (store.editingNodeId) {
    store.updateNodeConfig(store.editingNodeId, config.value)
    store.closeConfigPanel()
  }
}
</script>

<style scoped>
.config-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.config-panel {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 480px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
}

.panel-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.close-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-radius: 6px;
  font-size: 24px;
  color: #666;
  cursor: pointer;
}

.close-btn:hover {
  background: #f0f0f0;
  color: #333;
}

.panel-content {
  padding: 20px;
  overflow-y: auto;
  max-height: calc(90vh - 140px);
}

.config-section {
  margin-bottom: 24px;
}

.config-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  margin-bottom: 12px;
  letter-spacing: 0.5px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-row {
  display: flex;
  gap: 12px;
}

.form-row .form-group {
  flex: 1;
}

label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #333;
  margin-bottom: 6px;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  color: #333;
  background: white;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #4a9eff;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}

/* 图片上传样式 */
.image-upload-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.image-preview-box {
  width: 100%;
  height: 150px;
  border: 2px dashed #ddd;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  overflow: hidden;
  background: #f8f9fa;
}

.image-preview-box:hover {
  border-color: #4a9eff;
  background: #f0f7ff;
}

.image-preview {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #999;
}

.placeholder-icon {
  font-size: 32px;
}

.placeholder-text {
  font-size: 13px;
}

.image-path {
  font-size: 12px;
  color: #666;
  word-break: break-all;
  padding: 4px 8px;
  background: #f0f0f0;
  border-radius: 4px;
}

/* 文件选择按钮样式 */
.file-select-btn {
  padding: 8px 16px;
  background: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 13px;
  color: #333;
  cursor: pointer;
  transition: all 0.2s;
}

.file-select-btn:hover {
  background: #e0e0e0;
  border-color: #ccc;
}

.file-name {
  margin-left: 12px;
  font-size: 13px;
  color: #666;
}

/* 图片预览样式 */
.image-preview {
  margin-top: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  display: flex;
  justify-content: center;
  align-items: center;
  max-height: 200px;
  overflow: hidden;
}

.image-preview img {
  max-width: 100%;
  max-height: 180px;
  object-fit: contain;
  border-radius: 4px;
}

.panel-actions {
  display: flex;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
}

.btn {
  flex: 1;
  padding: 12px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #4a9eff;
  color: white;
}

.btn-primary:hover {
  background: #3a8eef;
}

.btn-secondary {
  background: #f0f0f0;
  color: #666;
}

.btn-secondary:hover {
  background: #e0e0e0;
  color: #333;
}

/* 带后缀的输入框样式 */
.input-with-suffix {
  display: flex;
  align-items: center;
  gap: 0;
}

.input-with-suffix .form-input {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  border-right: none;
}

.input-suffix {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
  height: 40px;
  background: #e9ecef;
  border: 1px solid #ced4da;
  border-left: none;
  border-top-right-radius: 6px;
  border-bottom-right-radius: 6px;
  color: #666;
  font-size: 14px;
  font-weight: 500;
}
</style>
