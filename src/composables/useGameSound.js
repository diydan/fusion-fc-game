import { ref, computed } from 'vue'

// Global sound settings
const soundEnabled = ref(true)
const masterVolume = ref(0.5)

// Audio cache to prevent loading same sounds multiple times
const audioCache = new Map()
const audioPool = new Map() // For frequently used sounds

// Preload common sounds
const preloadedSounds = {
  'button-click': '/sounds/button-click.mp3',
  'button-hover': '/sounds/button-hover.mp3',
  'success': '/sounds/success.mp3',
  'error': '/sounds/error.mp3',
  'coin': '/sounds/coin.mp3',
  'pop': '/sounds/pop.mp3',
  'whoosh': '/sounds/whoosh.mp3',
  'level-up': '/sounds/level-up.mp3',
  'notification': '/sounds/notification.mp3'
}

export function useGameSound() {
  // Initialize audio pool for frequently used sounds
  const initializeAudioPool = (soundName, poolSize = 3) => {
    // Not needed for synthetic sounds, kept for compatibility
    return
  }

  // Play sound from pool (for rapid repeated sounds)
  const playPooledSound = (soundName) => {
    if (!soundEnabled.value) return
    
    // For synthetic sounds, just play them directly
    return playSound(soundName)
  }

  // Create synthetic sound using Web Audio API
  const createSyntheticSound = (type) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    // Apply master volume to all sounds
    const baseVolume = masterVolume.value
    
    // Configure different sound types
    switch(type) {
      case 'button-click':
      case 'pop':
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1)
        gainNode.gain.setValueAtTime(0.3 * baseVolume, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.1)
        break
      case 'coin':
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime)
        oscillator.frequency.setValueAtTime(1500, audioContext.currentTime + 0.1)
        gainNode.gain.setValueAtTime(0.3 * baseVolume, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.2)
        break
      case 'success':
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime)
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1)
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2)
        gainNode.gain.setValueAtTime(0.3 * baseVolume, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.3)
        break
      case 'error':
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime)
        oscillator.type = 'sawtooth'
        gainNode.gain.setValueAtTime(0.3 * baseVolume, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.2)
        break
      case 'whoosh':
        const noise = audioContext.createBufferSource()
        const buffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.2, audioContext.sampleRate)
        const data = buffer.getChannelData(0)
        for (let i = 0; i < buffer.length; i++) {
          data[i] = Math.random() * 2 - 1
        }
        noise.buffer = buffer
        
        const filter = audioContext.createBiquadFilter()
        filter.type = 'highpass'
        filter.frequency.setValueAtTime(1000, audioContext.currentTime)
        filter.frequency.exponentialRampToValueAtTime(5000, audioContext.currentTime + 0.2)
        
        noise.connect(filter)
        filter.connect(gainNode)
        gainNode.gain.setValueAtTime(0.2 * baseVolume, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
        noise.start(audioContext.currentTime)
        break
      default:
        // Default click
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime)
        gainNode.gain.setValueAtTime(0.1 * baseVolume, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05)
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.05)
    }
  }

  // Play sound (general purpose)
  const playSound = async (soundNameOrUrl, options = {}) => {
    if (!soundEnabled.value) return
    
    try {
      // Always use synthetic sounds for better compatibility
      createSyntheticSound(soundNameOrUrl, options)
      return true
    } catch (error) {
      console.error('Error playing sound:', error)
      return null
    }
  }

  // Stop all sounds
  const stopAllSounds = () => {
    audioCache.forEach(audio => {
      audio.pause()
      audio.currentTime = 0
    })
  }

  // Preload sounds for better performance
  const preloadSounds = (soundList = Object.keys(preloadedSounds)) => {
    // Since we're using synthetic sounds, we don't need to preload audio files
    // This function is kept for compatibility but doesn't do anything
    return
  }

  // Toggle sound on/off
  const toggleSound = () => {
    soundEnabled.value = !soundEnabled.value
    if (!soundEnabled.value) {
      stopAllSounds()
    }
    return soundEnabled.value
  }

  // Set master volume
  const setMasterVolume = (volume) => {
    masterVolume.value = Math.max(0, Math.min(1, volume))
    
    // Update all cached audio volumes
    audioCache.forEach(audio => {
      audio.volume = masterVolume.value
    })
    
    // Update pooled audio volumes
    audioPool.forEach(({ pool }) => {
      pool.forEach(audio => {
        audio.volume = masterVolume.value
      })
    })
  }

  return {
    // State
    soundEnabled: computed(() => soundEnabled.value),
    masterVolume: computed(() => masterVolume.value),
    
    // Methods
    playSound,
    playPooledSound,
    stopAllSounds,
    preloadSounds,
    toggleSound,
    setMasterVolume,
    initializeAudioPool
  }
}