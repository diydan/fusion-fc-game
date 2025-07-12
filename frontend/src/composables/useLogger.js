import { ref, computed } from 'vue'

// Global logs state
const logs = ref([])
const maxLogs = ref(100)

// Log levels
export const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
}

export function useLogger() {
  // Add a new log entry
  const addLog = (level, message, details = null) => {
    const log = {
      id: Date.now() + Math.random(),
      level,
      message,
      details,
      timestamp: Date.now()
    }

    logs.value.push(log)

    // Keep only the latest maxLogs entries
    if (logs.value.length > maxLogs.value) {
      logs.value = logs.value.slice(-maxLogs.value)
    }

    // Also log to console for development
    if (import.meta.env.DEV) {
      const consoleMethod = level === 'error' ? 'error' : 
                           level === 'warn' ? 'warn' : 
                           level === 'debug' ? 'debug' : 'log'
      
      if (details) {
        console[consoleMethod](`[${level.toUpperCase()}] ${message}`, details)
      } else {
        console[consoleMethod](`[${level.toUpperCase()}] ${message}`)
      }
    }

    return log.id
  }

  // Convenience methods for different log levels
  const error = (message, details = null) => {
    return addLog(LOG_LEVELS.ERROR, message, details)
  }

  const warn = (message, details = null) => {
    return addLog(LOG_LEVELS.WARN, message, details)
  }

  const info = (message, details = null) => {
    return addLog(LOG_LEVELS.INFO, message, details)
  }

  const debug = (message, details = null) => {
    return addLog(LOG_LEVELS.DEBUG, message, details)
  }

  // Log API errors with proper formatting
  const apiError = (error, context = '') => {
    let message = 'API Error'
    let details = null

    if (context) {
      message = `API Error (${context})`
    }

    if (typeof error === 'string') {
      message += `: ${error}`
    } else if (error?.message) {
      message += `: ${error.message}`
      details = error.stack || JSON.stringify(error, null, 2)
    } else if (error?.response) {
      message += `: ${error.response.status} ${error.response.statusText}`
      details = error.response.data ? JSON.stringify(error.response.data, null, 2) : null
    } else {
      details = JSON.stringify(error, null, 2)
    }

    return addLog(LOG_LEVELS.ERROR, message, details)
  }

  // Log async operation errors
  const asyncError = (operation, error) => {
    const message = `${operation} failed`
    const details = error?.stack || JSON.stringify(error, null, 2)
    return addLog(LOG_LEVELS.ERROR, message, details)
  }

  // Clear all logs
  const clearLogs = () => {
    logs.value = []
  }

  // Get logs by level
  const getLogsByLevel = (level) => {
    return logs.value.filter(log => log.level === level)
  }

  // Computed properties
  const errorLogs = computed(() => getLogsByLevel(LOG_LEVELS.ERROR))
  const warnLogs = computed(() => getLogsByLevel(LOG_LEVELS.WARN))
  const infoLogs = computed(() => getLogsByLevel(LOG_LEVELS.INFO))
  const debugLogs = computed(() => getLogsByLevel(LOG_LEVELS.DEBUG))

  const hasErrors = computed(() => errorLogs.value.length > 0)
  const hasWarnings = computed(() => warnLogs.value.length > 0)

  // Get recent logs (last N entries)
  const getRecentLogs = (count = 10) => {
    return logs.value.slice(-count)
  }

  // Export logs for debugging/reporting
  const exportLogs = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      logs: logs.value,
      summary: {
        total: logs.value.length,
        errors: errorLogs.value.length,
        warnings: warnLogs.value.length,
        info: infoLogs.value.length,
        debug: debugLogs.value.length
      }
    }
    
    return JSON.stringify(exportData, null, 2)
  }

  return {
    // State
    logs,
    maxLogs,
    
    // Methods
    addLog,
    error,
    warn,
    info,
    debug,
    apiError,
    asyncError,
    clearLogs,
    getLogsByLevel,
    getRecentLogs,
    exportLogs,
    
    // Computed
    errorLogs,
    warnLogs,
    infoLogs,
    debugLogs,
    hasErrors,
    hasWarnings
  }
}
