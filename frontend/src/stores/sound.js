import { defineStore } from 'pinia'
import { useGameSound } from '@/composables/useGameSound'

export const useSoundStore = defineStore('sound', {
  state: () => ({
    isMuted: false,
    volume: 0.7,
    soundEffectsEnabled: true,
    musicEnabled: true,
    audioContext: null,
    audioElements: new Map()
  }),

  getters: {
    effectiveVolume: (state) => state.isMuted ? 0 : state.volume,
    canPlaySounds: (state) => state.soundEffectsEnabled && !state.isMuted,
    canPlayMusic: (state) => state.musicEnabled && !state.isMuted
  },

  actions: {
    // Initialize audio context
    initializeAudio() {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
      }
    },

    // Toggle mute state
    toggleMute() {
      this.isMuted = !this.isMuted
      this.updateAllAudioVolumes()
    },

    // Set volume level (0-1)
    setVolume(volume) {
      this.volume = Math.max(0, Math.min(1, volume))
      this.updateAllAudioVolumes()
    },

    // Toggle sound effects
    toggleSoundEffects() {
      this.soundEffectsEnabled = !this.soundEffectsEnabled
    },

    // Toggle background music
    toggleMusic() {
      this.musicEnabled = !this.musicEnabled
      this.updateAllAudioVolumes()
    },

    // Play a sound effect
    playSound(soundId, options = {}) {
      if (!this.canPlaySounds) return

      const {
        volume = this.effectiveVolume,
        loop = false,
        onended = null
      } = options

      try {
        // Use synthetic sound system instead of audio files
        const { playSound } = useGameSound()
        return playSound(soundId, { volume, loop })
      } catch (error) {
        console.warn(`Failed to play sound: ${soundId}`, error)
      }
    },

    // Play background music
    playMusic(musicId, options = {}) {
      if (!this.canPlayMusic) return

      const {
        volume = this.effectiveVolume * 0.5, // Music typically quieter
        loop = true,
        fadeIn = false
      } = options

      try {
        let audio = this.audioElements.get(`music_${musicId}`)
        if (!audio) {
          audio = new Audio(`/music/${musicId}.mp3`)
          audio.preload = 'auto'
          this.audioElements.set(`music_${musicId}`, audio)
        }

        audio.volume = fadeIn ? 0 : volume
        audio.loop = loop
        audio.currentTime = 0
        
        const playPromise = audio.play()
        
        if (fadeIn && playPromise) {
          playPromise.then(() => {
            this.fadeInAudio(audio, volume, 2000) // 2 second fade in
          })
        }

        return playPromise
      } catch (error) {
        console.warn(`Failed to play music: ${musicId}`, error)
      }
    },

    // Stop a specific audio
    stopAudio(audioId) {
      const audio = this.audioElements.get(audioId)
      if (audio) {
        audio.pause()
        audio.currentTime = 0
      }
    },

    // Stop all audio
    stopAllAudio() {
      this.audioElements.forEach(audio => {
        audio.pause()
        audio.currentTime = 0
      })
    },

    // Update volume for all currently playing audio
    updateAllAudioVolumes() {
      this.audioElements.forEach((audio, id) => {
        if (id.startsWith('music_')) {
          audio.volume = this.canPlayMusic ? this.effectiveVolume * 0.5 : 0
        } else {
          audio.volume = this.canPlaySounds ? this.effectiveVolume : 0
        }
      })
    },

    // Fade in audio
    fadeInAudio(audio, targetVolume, duration) {
      const steps = 20
      const stepTime = duration / steps
      const volumeStep = targetVolume / steps
      let currentStep = 0

      const fadeInterval = setInterval(() => {
        currentStep++
        audio.volume = Math.min(volumeStep * currentStep, targetVolume)
        
        if (currentStep >= steps) {
          clearInterval(fadeInterval)
        }
      }, stepTime)
    },

    // Fade out audio
    fadeOutAudio(audio, duration, stopAfterFade = true) {
      const startVolume = audio.volume
      const steps = 20
      const stepTime = duration / steps
      const volumeStep = startVolume / steps
      let currentStep = 0

      const fadeInterval = setInterval(() => {
        currentStep++
        audio.volume = Math.max(startVolume - (volumeStep * currentStep), 0)
        
        if (currentStep >= steps) {
          clearInterval(fadeInterval)
          if (stopAfterFade) {
            audio.pause()
            audio.currentTime = 0
          }
        }
      }, stepTime)
    },

    // Preload audio files
    preloadAudio(audioFiles) {
      audioFiles.forEach(({ id, type = 'sound', src }) => {
        try {
          const audio = new Audio(src || `/${type}s/${id}.mp3`)
          audio.preload = 'auto'
          this.audioElements.set(type === 'music' ? `music_${id}` : id, audio)
        } catch (error) {
          console.warn(`Failed to preload audio: ${id}`, error)
        }
      })
    },

    // Load settings from localStorage
    loadSettings() {
      try {
        const savedSettings = localStorage.getItem('soundSettings')
        if (savedSettings) {
          const settings = JSON.parse(savedSettings)
          this.isMuted = settings.isMuted ?? false
          this.volume = settings.volume ?? 0.7
          this.soundEffectsEnabled = settings.soundEffectsEnabled ?? true
          this.musicEnabled = settings.musicEnabled ?? true
        }
      } catch (error) {
        console.warn('Failed to load sound settings from localStorage', error)
      }
    },

    // Save settings to localStorage
    saveSettings() {
      try {
        const settings = {
          isMuted: this.isMuted,
          volume: this.volume,
          soundEffectsEnabled: this.soundEffectsEnabled,
          musicEnabled: this.musicEnabled
        }
        localStorage.setItem('soundSettings', JSON.stringify(settings))
      } catch (error) {
        console.warn('Failed to save sound settings to localStorage', error)
      }
    }
  }
})
