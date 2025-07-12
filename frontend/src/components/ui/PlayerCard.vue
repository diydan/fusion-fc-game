<template>
  <div
    :class="[
      'player-card',
      'bg-white',
      'rounded-lg',
      'shadow-md',
      'hover:shadow-lg',
      'transition-transform',
      'duration-200',
      'ease-out',
      'border',
      'border-gray-200',
      'overflow-hidden',
      sizeClasses,
      draggable ? 'cursor-move hover:shadow-xl' : '',
      'select-none'
    ]"
    :draggable="draggable"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
  >
    <!-- Player Avatar -->
    <div :class="['flex', 'items-center', 'justify-center', 'bg-gray-100', avatarContainerClasses]">
      <div :class="['rounded-full', 'overflow-hidden', 'bg-gray-300', avatarClasses]">
        <img
          v-if="player.avatar"
          :src="player.avatar"
          :alt="`${player.name} avatar`"
          :class="['w-full', 'h-full', 'object-cover']"
        />
        <div
          v-else
          :class="['w-full', 'h-full', 'flex', 'items-center', 'justify-center', 'text-gray-500', 'font-semibold', avatarTextClasses]"
        >
          {{ getInitials(player.name) }}
        </div>
      </div>
    </div>

    <!-- Player Info -->
    <div :class="['p-3', size === 'sm' ? 'p-2' : 'p-3']">
      <!-- Player Name -->
      <h3 :class="['font-semibold', 'text-gray-800', 'mb-1', 'truncate', nameClasses]">
        {{ player.name }}
      </h3>

      <!-- Position Badge and Rating -->
      <div class="flex items-center justify-between">
        <!-- Position Badge -->
        <span
          :class="[
            'inline-flex',
            'items-center',
            'px-2',
            'py-0.5',
            'rounded-full',
            'text-xs',
            'font-medium',
            'bg-blue-100',
            'text-blue-800',
            'border',
            'border-blue-200',
            size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-0.5 text-xs'
          ]"
        >
          {{ player.position }}
        </span>

        <!-- Rating -->
        <div :class="['flex', 'items-center', 'gap-1']">
          <span :class="['text-gray-600', size === 'sm' ? 'text-xs' : 'text-sm']">
            {{ player.rating }}
          </span>
          <div :class="['flex', 'items-center']">
            <svg
              :class="['w-4', 'h-4', 'text-yellow-400', 'fill-current', size === 'sm' ? 'w-3 h-3' : 'w-4 h-4']"
              viewBox="0 0 20 20"
            >
              <path
                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Dragging Indicator -->
    <div
      v-if="draggable && isDragging"
      class="absolute inset-0 bg-blue-500 bg-opacity-20 rounded-lg border-2 border-blue-400 border-dashed"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Player {
  id: string | number
  name: string
  position: string
  rating: number
  avatar?: string
}

interface Props {
  player: Player
  draggable?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  draggable: false,
  size: 'md'
})

const emit = defineEmits<{
  dragStart: [player: Player, event: DragEvent]
  dragEnd: [player: Player, event: DragEvent]
}>()

const isDragging = ref(false)

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'w-24 md:w-32'
    case 'lg':
      return 'w-36 md:w-48'
    default:
      return 'w-32 md:w-40'
  }
})

const avatarContainerClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'h-16'
    case 'lg':
      return 'h-24'
    default:
      return 'h-20'
  }
})

const avatarClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'w-10 h-10'
    case 'lg':
      return 'w-16 h-16'
    default:
      return 'w-12 h-12'
  }
})

const avatarTextClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'text-xs'
    case 'lg':
      return 'text-lg'
    default:
      return 'text-sm'
  }
})

const nameClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'text-sm'
    case 'lg':
      return 'text-lg'
    default:
      return 'text-base'
  }
})

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const onDragStart = (event: DragEvent) => {
  if (!props.draggable) return
  
  isDragging.value = true
  
  // Set drag data
  if (event.dataTransfer) {
    event.dataTransfer.setData('application/json', JSON.stringify(props.player))
    event.dataTransfer.effectAllowed = 'move'
  }
  
  emit('dragStart', props.player, event)
}

const onDragEnd = (event: DragEvent) => {
  if (!props.draggable) return
  
  isDragging.value = false
  emit('dragEnd', props.player, event)
}
</script>

<style scoped>
.player-card {
  @apply relative select-none;
}

.player-card:hover {
  @apply -translate-y-0.5;
}

.player-card:active {
  @apply translate-y-0;
}

/* Dragging state */
.player-card[draggable="true"]:hover {
  @apply -translate-y-1;
}

.player-card[draggable="true"]:active {
  @apply scale-95;
}
</style>
