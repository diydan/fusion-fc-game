<template>
  <BaseCharacterScene ref="baseScene" :show-hints="false">
    <template #content>
      <!-- Intro specific overlay content -->
      <div class="intro-overlay">
        <div class="intro-content">
          <h1 class="intro-title">Welcome to Fusion FC</h1>
          <p class="intro-subtitle">Experience the future of football</p>
          
          <div class="intro-controls">
            <v-btn 
              size="x-large" 
              color="primary" 
              rounded="xl"
              @click="startIntroSequence">
              Start Experience
            </v-btn>
            
            <v-btn 
              size="large" 
              variant="outlined"
              rounded="xl"
              class="mt-4"
              @click="skipIntro">
              Skip Intro
            </v-btn>
          </div>
        </div>
      </div>

      <!-- Intro sequence overlay -->
      <transition name="fade">
        <div v-if="isIntroPlaying" class="sequence-overlay">
          <div class="sequence-text">
            <transition name="slide-up" mode="out-in">
              <p :key="currentTextIndex" class="sequence-message">
                {{ introTexts[currentTextIndex] }}
              </p>
            </transition>
          </div>
        </div>
      </transition>
    </template>
  </BaseCharacterScene>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import BaseCharacterScene from '@/components/BaseCharacterScene.vue'

const router = useRouter()
const baseScene = ref()

// Intro state
const isIntroPlaying = ref(false)
const currentTextIndex = ref(0)

const introTexts = [
  "Welcome to the stadium...",
  "Where legends are born...",
  "And champions rise...",
  "Your journey begins now!"
]

const startIntroSequence = async () => {
  isIntroPlaying.value = true
  
  // Play through intro texts
  for (let i = 0; i < introTexts.length; i++) {
    currentTextIndex.value = i
    
    // Trigger effects based on text
    if (i === 2) {
      baseScene.value?.triggerScreenShake()
    }
    
    await new Promise(resolve => setTimeout(resolve, 3000))
  }
  
  // Navigate to character creator after intro
  setTimeout(() => {
    router.push('/character-creator')
  }, 1000)
}

const skipIntro = () => {
  router.push('/character-creator')
}

onMounted(() => {
  // Optional: Auto-start intro after a delay
  // setTimeout(startIntroSequence, 2000)
})
</script>

<style scoped>
.intro-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(ellipse at center, transparent 0%, rgba(0, 0, 0, 0.4) 100%);
  z-index: 10;
}

.intro-content {
  text-align: center;
  color: white;
  padding: 2rem;
}

.intro-title {
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 700;
  margin-bottom: 1rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
  letter-spacing: -0.02em;
}

.intro-subtitle {
  font-size: clamp(1.2rem, 3vw, 1.8rem);
  font-weight: 300;
  margin-bottom: 3rem;
  opacity: 0.9;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
}

.intro-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.sequence-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.8);
  z-index: 20;
}

.sequence-text {
  text-align: center;
  padding: 2rem;
}

.sequence-message {
  font-size: clamp(1.5rem, 4vw, 2.5rem);
  color: white;
  font-weight: 300;
  letter-spacing: 0.05em;
  text-shadow: 2px 2px 8px #010224;
}

/* Transitions */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active, .slide-up-leave-active {
  transition: all 0.5s ease;
}

.slide-up-enter-from {
  transform: translateY(20px);
  opacity: 0;
}

.slide-up-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}

/* Mobile adjustments */
@media (max-width: 600px) {
  .intro-content {
    padding: 1.5rem;
  }
  
  .intro-title {
    margin-bottom: 0.75rem;
  }
  
  .intro-subtitle {
    margin-bottom: 2rem;
  }
}
</style>