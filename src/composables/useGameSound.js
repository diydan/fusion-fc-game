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
    if (!preloadedSounds[soundName]) return
    
    const pool = []
    for (let i = 0; i < poolSize; i++) {
      const audio = new Audio(preloadedSounds[soundName])
      audio.volume = masterVolume.value
      pool.push(audio)
    }
    audioPool.set(soundName, { pool, currentIndex: 0 })
  }

  // Play sound from pool (for rapid repeated sounds)
  const playPooledSound = (soundName) => {
    if (!soundEnabled.value) return
    
    const poolData = audioPool.get(soundName)
    if (!poolData) {
      initializeAudioPool(soundName)
      return playSound(soundName)
    }
    
    const audio = poolData.pool[poolData.currentIndex]
    audio.currentTime = 0
    audio.volume = masterVolume.value
    audio.play().catch(err => console.warn('Failed to play pooled sound:', err))
    
    // Rotate to next audio in pool
    poolData.currentIndex = (poolData.currentIndex + 1) % poolData.pool.length
  }

  // Create synthetic sound using Web Audio API
  const createSyntheticSound = (type) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    // Configure different sound types
    switch(type) {
      case 'button-click':
      case 'pop':
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1)
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.1)
        break
      case 'coin':
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime)
        oscillator.frequency.setValueAtTime(1500, audioContext.currentTime + 0.1)
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.2)
        break
      case 'success':
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime)
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1)
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2)
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.3)
        break
      case 'error':
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime)
        oscillator.type = 'sawtooth'
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
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
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
        noise.start(audioContext.currentTime)
        break
      default:
        // Default click
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime)
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05)
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.05)
    }
  }

  // Play sound (general purpose)
  const playSound = async (soundNameOrUrl, options = {}) => {
    if (!soundEnabled.value) return
    
    const {
      volume = masterVolume.value,
      loop = false,
      fadeIn = false,
      fadeOut = false,
      fadeDuration = 1000,
      useSynthetic = true // New option to use synthetic sounds as fallback
    } = options
    
    try {
      let audioUrl = preloadedSounds[soundNameOrUrl] || soundNameOrUrl
      
      // Check cache first
      let audio = audioCache.get(audioUrl)
      if (!audio) {
        try {
          audio = new Audio(audioUrl)
          audioCache.set(audioUrl, audio)
        } catch (error) {
          // If loading fails and synthetic is enabled, create synthetic sound
          if (useSynthetic && preloadedSounds[soundNameOrUrl]) {
            createSyntheticSound(soundNameOrUrl)
            return
          }
          throw error
        }
      }
      
      // Clone for overlapping sounds
      const audioClone = audio.cloneNode()
      audioClone.volume = fadeIn ? 0 : volume
      audioClone.loop = loop
      
      // Add error handler for the clone
      audioClone.addEventListener('error', () => {
        // If real audio fails, try synthetic sound
        if (useSynthetic && preloadedSounds[soundNameOrUrl]) {
          createSyntheticSound(soundNameOrUrl)
        }
      })
      
      // Fade in effect
      if (fadeIn) {
        const fadeInInterval = setInterval(() => {
          if (audioClone.volume < volume) {
            audioClone.volume = Math.min(audioClone.volume + (volume / (fadeDuration / 100)), volume)
          } else {
            clearInterval(fadeInInterval)
          }
        }, 100)
      }
      
      // Fade out effect
      if (fadeOut && !loop) {
        audioClone.addEventListener('timeupdate', () => {
          const timeLeft = audioClone.duration - audioClone.currentTime
          if (timeLeft < fadeDuration / 1000) {
            audioClone.volume = Math.max(0, volume * (timeLeft / (fadeDuration / 1000)))
          }
        })
      }
      
      await audioClone.play()
      return audioClone // Return audio element for external control
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
    soundList.forEach(soundName => {
      const url = preloadedSounds[soundName] || soundName
      if (!audioCache.has(url)) {
        const audio = new Audio(url)
        audio.preload = 'auto'
        audioCache.set(url, audio)
      }
    })
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