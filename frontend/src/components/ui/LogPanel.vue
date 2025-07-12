<template>
  <div class="log-panel" :class="{ 'expanded': isExpanded }">
    <!-- Toggle Button -->
    <v-btn
      @click="toggleExpanded"
      class="log-toggle-btn"
      :class="{ 'has-errors': hasErrors }"
      icon
      size="small"
      variant="flat"
      :color="hasErrors ? 'error' : 'primary'"
    >
      <v-icon>
        {{ isExpanded ? 'mdi-chevron-down' : 'mdi-chevron-up' }}
      </v-icon>
    </v-btn>

    <!-- Error Count Badge -->
    <v-badge
      v-if="errorCount > 0"
      :content="errorCount"
      color="error"
      class="error-badge"
    >
      <v-icon color="error">mdi-alert-circle</v-icon>
    </v-badge>

    <!-- Log Content -->
    <v-card
      v-if="isExpanded"
      class="log-content"
      elevation="8"
    >
      <v-card-title class="d-flex align-center">
        <v-icon class="me-2">mdi-console</v-icon>
        Application Logs
        <v-spacer />
        <v-btn
          @click="clearLogs"
          size="small"
          variant="text"
          icon
          :disabled="logs.length === 0"
        >
          <v-icon>mdi-delete</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-0">
        <div class="log-container" ref="logContainer">
          <div
            v-for="(log, index) in logs"
            :key="index"
            class="log-entry"
            :class="getLogClass(log.level)"
          >
            <div class="log-timestamp">
              {{ formatTime(log.timestamp) }}
            </div>
            <div class="log-level">
              <v-icon :color="getLogColor(log.level)" size="16">
                {{ getLogIcon(log.level) }}
              </v-icon>
              {{ log.level.toUpperCase() }}
            </div>
            <div class="log-message">
              {{ log.message }}
            </div>
            <div v-if="log.details" class="log-details">
              <pre>{{ log.details }}</pre>
            </div>
          </div>
          
          <div v-if="logs.length === 0" class="no-logs">
            <v-icon class="mb-2" size="48" color="grey">mdi-console</v-icon>
            <p>No logs available</p>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, watch } from 'vue'

const props = defineProps({
  logs: {
    type: Array,
    default: () => []
  },
  autoExpand: {
    type: Boolean,
    default: true
  },
  maxLogs: {
    type: Number,
    default: 100
  }
})

const emit = defineEmits(['clear-logs', 'toggle-expanded'])

// State
const isExpanded = ref(false)
const logContainer = ref(null)

// Computed properties
const errorCount = computed(() => {
  return props.logs.filter(log => log.level === 'error').length
})

const hasErrors = computed(() => {
  return errorCount.value > 0
})

// Methods
const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
  emit('toggle-expanded', isExpanded.value)
}

const clearLogs = () => {
  emit('clear-logs')
}

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString()
}

const getLogClass = (level) => {
  return `log-${level}`
}

const getLogColor = (level) => {
  const colors = {
    error: 'error',
    warn: 'warning',
    info: 'info',
    debug: 'grey'
  }
  return colors[level] || 'grey'
}

const getLogIcon = (level) => {
  const icons = {
    error: 'mdi-alert-circle',
    warn: 'mdi-alert',
    info: 'mdi-information',
    debug: 'mdi-bug'
  }
  return icons[level] || 'mdi-information'
}

const scrollToBottom = () => {
  nextTick(() => {
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight
    }
  })
}

// Watch for new logs and auto-expand on errors
watch(
  () => props.logs,
  (newLogs, oldLogs) => {
    if (newLogs.length > (oldLogs?.length || 0)) {
      const newLog = newLogs[newLogs.length - 1]
      
      // Auto-expand on error/exception
      if (props.autoExpand && newLog.level === 'error' && !isExpanded.value) {
        isExpanded.value = true
        emit('toggle-expanded', true)
      }
      
      // Auto-scroll to bottom if expanded
      if (isExpanded.value) {
        scrollToBottom()
      }
    }
  },
  { deep: true }
)

// Expose methods
defineExpose({
  expand: () => {
    isExpanded.value = true
    emit('toggle-expanded', true)
  },
  collapse: () => {
    isExpanded.value = false
    emit('toggle-expanded', false)
  },
  scrollToBottom
})
</script>

<style scoped>
.log-panel {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  max-width: 600px;
  min-width: 300px;
}

.log-toggle-btn {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 1001;
  transform: translateY(-50%);
}

.log-toggle-btn.has-errors {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
}

.error-badge {
  position: absolute;
  top: -10px;
  right: 40px;
  z-index: 1001;
}

.log-content {
  max-height: 400px;
  display: flex;
  flex-direction: column;
  margin-top: 20px;
}

.log-container {
  max-height: 300px;
  overflow-y: auto;
  padding: 0;
}

.log-entry {
  display: grid;
  grid-template-columns: 80px 80px 1fr;
  gap: 8px;
  padding: 8px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.4;
}

.log-entry.log-error {
  background-color: rgba(244, 67, 54, 0.1);
}

.log-entry.log-warn {
  background-color: rgba(255, 193, 7, 0.1);
}

.log-entry.log-info {
  background-color: rgba(33, 150, 243, 0.1);
}

.log-entry.log-debug {
  background-color: rgba(158, 158, 158, 0.1);
}

.log-timestamp {
  font-size: 10px;
  color: #888;
  white-space: nowrap;
}

.log-level {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: bold;
  font-size: 10px;
}

.log-message {
  word-wrap: break-word;
  white-space: pre-wrap;
}

.log-details {
  grid-column: 1 / -1;
  margin-top: 4px;
  padding: 8px;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.log-details pre {
  margin: 0;
  font-size: 11px;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.no-logs {
  text-align: center;
  padding: 40px 20px;
  color: #888;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .log-panel {
    bottom: 10px;
    right: 10px;
    left: 10px;
    max-width: none;
  }
  
  .log-content {
    max-height: 300px;
  }
  
  .log-container {
    max-height: 200px;
  }
  
  .log-entry {
    grid-template-columns: 60px 60px 1fr;
    gap: 6px;
    padding: 6px 12px;
  }
}
</style>
