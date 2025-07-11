<template>
  <v-btn
    :class="buttonClasses"
    :size="size"
    :disabled="disabled"
    :loading="loading"
    :to="to"
    :href="href"
    :icon="icon"
    @click="handleClick"
    v-bind="$attrs"
  >
    <v-icon v-if="prependIcon && !icon" :icon="prependIcon" :size="iconSize" class="me-2" />
    <slot>{{ label }}</slot>
    <v-icon v-if="appendIcon && !icon" :icon="appendIcon" :size="iconSize" class="ms-2" />
  </v-btn>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  // Button content
  label: {
    type: String,
    default: ''
  },
  
  // Button style
  color: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'success', 'error', 'warning', 'info', 'gradient'].includes(value)
  },
  
  // Button type
  variant: {
    type: String,
    default: '3d', // '3d', 'flat', 'outlined', 'text', 'tonal'
    validator: (value) => ['3d', 'flat', 'outlined', 'text', 'tonal'].includes(value)
  },
  
  // Button size
  size: {
    type: String,
    default: 'default',
    validator: (value) => ['x-small', 'small', 'default', 'large', 'x-large'].includes(value)
  },
  
  // Icons
  prependIcon: String,
  appendIcon: String,
  icon: Boolean,
  fab: Boolean,
  
  // States
  disabled: Boolean,
  loading: Boolean,
  
  // Navigation
  to: [String, Object],
  href: String,
  
  // Sound options
  soundEnabled: {
    type: Boolean,
    default: true
  },
  clickSound: {
    type: String,
    default: 'button-click'
  },
  hoverSound: {
    type: String,
    default: null
  },
  customSoundUrl: String
})

const emit = defineEmits(['click', 'soundPlayed'])

// Sound management
import { useGameSound } from '@/composables/useGameSound'

const { playSound: playGameSound } = useGameSound()

const playSound = async (soundType) => {
  if (!props.soundEnabled) return
  
  try {
    const soundName = soundType === 'hover' ? props.hoverSound : props.clickSound
    if (!soundName) return
    
    // Use the global game sound system with synthetic fallback
    if (props.customSoundUrl && soundType === 'click') {
      await playGameSound(props.customSoundUrl)
    } else {
      await playGameSound(soundName)
    }
    
    emit('soundPlayed', { type: soundType, sound: soundName })
  } catch (error) {
    // Silent fail - synthetic sounds will be used as fallback
  }
}

// Computed classes
const buttonClasses = computed(() => {
  const classes = []
  
  if (props.variant === '3d') {
    classes.push('v-btn--elevated-3d')
    classes.push(`bg-${props.color}`)
    
    if (props.fab) {
      classes.push('v-btn--fab-3d')
    }
    
    if (props.color === 'gradient') {
      classes.push('v-btn--gradient-3d')
    }
  }
  
  return classes
})

const iconSize = computed(() => {
  const sizeMap = {
    'x-small': 14,
    'small': 16,
    'default': 20,
    'large': 24,
    'x-large': 28
  }
  return sizeMap[props.size] || 20
})

// Event handlers
const handleClick = (event) => {
  if (!props.disabled && !props.loading) {
    playSound('click')
    emit('click', event)
  }
}

// Public methods for parent components
defineExpose({
  playSound
})
</script>

<style scoped>
/* Component-specific styles if needed */
</style>