import { ref } from 'vue'
import type { ModalType } from '@/components/Modal.vue'

interface ModalOptions {
  title?: string
  message: string
  type?: ModalType
  confirmText?: string
  cancelText?: string
  showCancel?: boolean
}

interface ModalState extends ModalOptions {
  visible: boolean
  resolve: ((value: boolean) => void) | null
}

const modalState = ref<ModalState>({
  visible: false,
  message: '',
  title: '提示',
  type: 'info',
  confirmText: '确定',
  cancelText: '取消',
  showCancel: false,
  resolve: null,
})

export const useModal = () => {
  // 显示确认弹窗（有确定和取消按钮）
  const confirm = (options: ModalOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      modalState.value = {
        ...options,
        visible: true,
        resolve,
      }
    })
  }

  // 显示提示弹窗（只有确定按钮）
  const alert = (options: ModalOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      modalState.value = {
        ...options,
        visible: true,
        showCancel: false,
        resolve,
      }
    })
  }

  // 关闭弹窗
  const close = (result: boolean) => {
    modalState.value.visible = false
    modalState.value.resolve?.(result)
    modalState.value.resolve = null
  }

  // 确认
  const onConfirm = () => {
    close(true)
  }

  // 取消
  const onCancel = () => {
    close(false)
  }

  return {
    modalState,
    confirm,
    alert,
    onConfirm,
    onCancel,
  }
}

// 全局单例，用于在组件外调用
let globalModal: ReturnType<typeof useModal> | null = null

export const initGlobalModal = () => {
  globalModal = useModal()
  return globalModal
}

export const getGlobalModal = () => {
  if (!globalModal) {
    globalModal = useModal()
  }
  return globalModal
}

// 便捷方法：全局 alert
export const modalAlert = (message: string, title?: string, type?: ModalType) => {
  return getGlobalModal().alert({ message, title, type })
}

// 便捷方法：全局 confirm
export const modalConfirm = (message: string, title?: string, type?: ModalType) => {
  return getGlobalModal().confirm({
    message,
    title: title || '确认',
    type: type || 'warning',
    showCancel: true,
  })
}
