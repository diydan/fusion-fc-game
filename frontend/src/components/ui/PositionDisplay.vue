<template>
  <div class="text-xs opacity-90 p-2 bg-gray-800 rounded space-y-1">
    <div>
      <span class="text-blue-300">📹 Camera:</span>
      <span class="font-mono">[
        {{ cameraPosition[0].toFixed(3) }},
        {{ cameraPosition[1].toFixed(3) }},
        {{ cameraPosition[2].toFixed(3) }}
      ]</span>
    </div>
    <div>
      <span class="text-green-300">🤖 Character:</span>
      <span class="font-mono">[
        {{ characterPosition[0].toFixed(3) }},
        {{ characterPosition[1].toFixed(3) }},
        {{ characterPosition[2].toFixed(3) }}
      ]</span>
    </div>
    <div>
      <span class="text-white">⚽ Ball:</span>
      <span class="font-mono">[
        {{ ballPosition[0].toFixed(3) }},
        {{ ballPosition[1].toFixed(3) }},
        {{ ballPosition[2].toFixed(3) }}
      ]</span>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  cameraPosition: [number, number, number]
  characterPosition: [number, number, number]
  ballPosition: [number, number, number]
}

defineProps<Props>()
</script>
