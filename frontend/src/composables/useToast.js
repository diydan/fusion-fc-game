import { ref, reactive } from 'vue'

// Global toast state
const toasts = ref([])
const nextId = ref(1)

// Toast types
export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
}

// Default toast options
const defaultOptions = {
  type: TOAST_TYPES.INFO,
  duration: 5000,
  persistent: false,
  showClose: true,
  position: 'top-right'
}

export function useToast() {
  // Add a new toast
  const show = (message, options = {}) => {
    const toast = {
      id: nextId.value++,
      message,
      ...defaultOptions,
      ...options,
      visible: true,
      timestamp: Date.now()
    }

    toasts.value.push(toast)

    // Auto-remove toast after duration (unless persistent)
    if (!toast.persistent && toast.duration > 0) {
      setTimeout(() => {
        remove(toast.id)
      }, toast.duration)
    }

    return toast.id
  }

  // Remove a toast by ID
  const remove = (id) => {
    const index = toasts.value.findIndex(toast => toast.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }

  // Remove all toasts
  const clear = () => {
    toasts.value = []
  }

  // Convenience methods for different toast types
  const success = (message, options = {}) => {
    return show(message, { ...options, type: TOAST_TYPES.SUCCESS })
  }

  const error = (message, options = {}) => {
    return show(message, { 
      ...options, 
      type: TOAST_TYPES.ERROR,
      duration: 7000, // Longer duration for errors
      persistent: options.persistent !== undefined ? options.persistent : true
    })
  }

  const warning = (message, options = {}) => {
    return show(message, { ...options, type: TOAST_TYPES.WARNING })
  }

  const info = (message, options = {}) => {
    return show(message, { ...options, type: TOAST_TYPES.INFO })
  }

  // Show API error with proper formatting
  const apiError = (error, options = {}) => {
    let message = 'An unexpected error occurred'
    
    if (typeof error === 'string') {
      message = error
    } else if (error?.message) {
      message = error.message
    } else if (error?.response?.data?.message) {
      message = error.response.data.message
    } else if (error?.response?.statusText) {
      message = `${error.response.status}: ${error.response.statusText}`
    }

    return show(message, {
      ...options,
      type: TOAST_TYPES.ERROR,
      duration: 8000,
      persistent: true
    })
  }

  return {
    toasts,
    show,
    remove,
    clear,
    success,
    error,
    warning,
    info,
    apiError
  }
}
