<template>
  <!-- Camera -->
  <TresPerspectiveCamera 
    ref="camera"
    :position="cameraPosition"
    :fov="fov"
    :near="0.1"
    :far="1000"
    :look-at="[0, 1, 0]"
  />

  <!-- Orbit Controls -->
  <OrbitControls 
    v-if="enableControls"
    ref="controls"
    :enabled="true"
    :enable-damping="true"
    :damping-factor="0.05"
    :enable-zoom="true"
    :auto-rotate="false"
  />
</template>

<script setup lang="ts">
import { watch, ref, onMounted, nextTick, withDefaults } from 'vue'
import { OrbitControls } from '@tresjs/cientos'

interface Props {
  cameraPosition: [number, number, number]
  fov: number
  enableControls?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  enableControls: true
})
const camera = ref()
const controls = ref()

// Watch for FOV changes and manually update the camera
watch(() => props.fov, (newFov) => {
  console.log('FOV changed to:', newFov)
  
  // Use nextTick to ensure the camera component is updated
  nextTick(() => {
    if (camera.value) {
      // Try different ways to access the camera object
      let cameraObj = null
      
      if (camera.value.value) {
        cameraObj = camera.value.value
      } else if (camera.value.$el) {
        cameraObj = camera.value.$el
      } else if (camera.value.object) {
        cameraObj = camera.value.object
      } else {
        cameraObj = camera.value
      }
      
      if (cameraObj && cameraObj.fov !== undefined) {
        console.log('Updating camera FOV from', cameraObj.fov, 'to', newFov)
        cameraObj.fov = newFov
        cameraObj.updateProjectionMatrix()
        console.log('Camera FOV updated successfully')
      } else {
        console.log('Camera object not found or invalid:', cameraObj)
      }
    } else {
      console.log('Camera ref not available')
    }
  })
}, { immediate: true })

// Setup orbit controls logging
onMounted(async () => {
  await nextTick()
  console.log('SceneCamera mounted with FOV:', props.fov, 'Controls enabled:', props.enableControls)

  // Setup orbit controls real-time logging only if controls are enabled
  if (props.enableControls) {
    setTimeout(() => {
      setupOrbitControlsLogging()
    }, 1000) // Wait for controls to be fully initialized
  }
})

const setupOrbitControlsLogging = () => {
  if (controls.value) {
    let controlsObj = null

    // Try different ways to access the controls object
    if (controls.value.value) {
      controlsObj = controls.value.value
    } else if (controls.value.$el) {
      controlsObj = controls.value.$el
    } else if (controls.value.object) {
      controlsObj = controls.value.object
    } else {
      controlsObj = controls.value
    }

    if (controlsObj && controlsObj.addEventListener) {
      console.log('🎮 Setting up orbit controls real-time logging...')

      // Log on change events
      controlsObj.addEventListener('change', () => {
        if (camera.value) {
          const cameraObj = camera.value.value || camera.value.object || camera.value

          if (cameraObj && cameraObj.position) {
            const pos = cameraObj.position
            const target = controlsObj.target || { x: 0, y: 0, z: 0 }

            // Calculate distance (zoom level)
            const distance = Math.sqrt(
              Math.pow(pos.x - target.x, 2) +
              Math.pow(pos.y - target.y, 2) +
              Math.pow(pos.z - target.z, 2)
            )

            // Calculate spherical coordinates for orbit angles
            const dx = pos.x - target.x
            const dy = pos.y - target.y
            const dz = pos.z - target.z

            const azimuth = Math.atan2(dx, dz) * (180 / Math.PI) // Horizontal rotation
            const elevation = Math.atan2(dy, Math.sqrt(dx * dx + dz * dz)) * (180 / Math.PI) // Vertical rotation

            console.log('📹 Camera Controls:', {
              position: `[${pos.x.toFixed(3)}, ${pos.y.toFixed(3)}, ${pos.z.toFixed(3)}]`,
              target: `[${target.x.toFixed(3)}, ${target.y.toFixed(3)}, ${target.z.toFixed(3)}]`,
              distance: distance.toFixed(3),
              azimuth: azimuth.toFixed(1) + '°',
              elevation: elevation.toFixed(1) + '°',
              zoom: `${((10 / distance) * 100).toFixed(0)}%` // Relative zoom percentage
            })
          }
        }
      })

      console.log('✅ Orbit controls logging enabled - move camera to see real-time updates!')
    } else {
      console.log('❌ Could not access orbit controls object:', controlsObj)
      // Retry after another second
      setTimeout(setupOrbitControlsLogging, 1000)
    }
  } else {
    console.log('❌ Controls ref not available, retrying...')
    setTimeout(setupOrbitControlsLogging, 1000)
  }
}
</script>
