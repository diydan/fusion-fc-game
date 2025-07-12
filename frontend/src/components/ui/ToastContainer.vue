<template>
  <div class="toast-container">
    <TransitionGroup name="toast" tag="div" class="toast-wrapper">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast-item"
        :class="getToastClasses(toast)"
      >
        <v-snackbar
          :model-value="toast.visible"
          :color="toast.type"
          :timeout="toast.persistent ? -1 : toast.duration"
          :location="toast.position"
          multi-line
          @update:model-value="(value) => !value && remove(toast.id)"
        >
          <div class="toast-content">
            <v-icon
              :icon="getToastIcon(toast.type)"
              size="20"
              class="toast-icon"
            />
            <div class="toast-message">
              {{ toast.message }}
            </div>
            <v-btn
              v-if="toast.showClose"
              icon
              size="small"
              variant="text"
              @click="remove(toast.id)"
              class="toast-close"
            >
              <v-icon size="16">mdi-close</v-icon>
            </v-btn>
          </div>
        </v-snackbar>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { useToast } from '@/composables/useToast'

const { toasts, remove } = useToast()

// Get appropriate icon for toast type
const getToastIcon = (type) => {
  const icons = {
    success: 'mdi-check-circle',
    error: 'mdi-alert-circle',
    warning: 'mdi-alert',
    info: 'mdi-information'
  }
  return icons[type] || icons.info
}

// Get CSS classes for toast styling
const getToastClasses = (toast) => {
  return [
    `toast-${toast.type}`,
    `toast-${toast.position}`,
    { 'toast-persistent': toast.persistent }
  ]
}
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9999;
}

.toast-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.toast-item {
  position: absolute;
  pointer-events: auto;
  max-width: 400px;
  min-width: 300px;
}

/* Position classes */
.toast-top-right {
  top: 20px;
  right: 20px;
}

.toast-top-left {
  top: 20px;
  left: 20px;
}

.toast-bottom-right {
  bottom: 20px;
  right: 20px;
}

.toast-bottom-left {
  bottom: 20px;
  left: 20px;
}

.toast-top-center {
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
}

.toast-bottom-center {
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
}

/* Toast content styling */
.toast-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 4px 0;
}

.toast-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.toast-message {
  flex: 1;
  line-height: 1.4;
  word-wrap: break-word;
}

.toast-close {
  flex-shrink: 0;
  margin-left: auto;
  opacity: 0.7;
}

.toast-close:hover {
  opacity: 1;
}

/* Persistent toast styling */
.toast-persistent {
  border-left: 4px solid currentColor;
}

/* Animations */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-move {
  transition: transform 0.3s ease;
}

/* Mobile responsive */
@media (max-width: 600px) {
  .toast-item {
    max-width: calc(100vw - 32px);
    min-width: calc(100vw - 32px);
    left: 16px !important;
    right: 16px !important;
    transform: none !important;
  }
  
  .toast-top-center,
  .toast-bottom-center {
    left: 16px !important;
    transform: none !important;
  }
}
</style>
