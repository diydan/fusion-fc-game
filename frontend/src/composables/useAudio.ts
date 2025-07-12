import { ref, reactive, watch, onUnmounted } from 'vue'
import type { AudioState } from '@/types/scene'

// Global audio state - shared across all components
let globalAudioState: AudioState | null = null
let currentAudio: HTMLAudioElement | null = null

export function useAudio() {
  // Audio elements for sound effects
  const ballBounceAudio = new Audio('/audio/ball_bounce.mp3')
  const ballKickAudio = new Audio('/audio/ball_kick_hit.mp3')
  const coinSpinAudio = new Audio('/audio/Spinning_01.mp3');
  const coinHitTorusAudio = new Audio('/audio/ReactorIgnitionLargeElectricalZaps.mp3');

  // Setup audio properties for sound effects
  ballBounceAudio.preload = 'auto'
  ballKickAudio.preload = 'auto'
  ballBounceAudio.volume = 0.7
  ballKickAudio.volume = 0.8
  coinSpinAudio.preload = 'auto';
  coinHitTorusAudio.preload = 'auto';
  coinSpinAudio.volume = 0.3;
  coinHitTorusAudio.volume = 0.5;

  // Track definitions
  const tracks = [
    {
      name: 'Fusion FC Anthem (Remix) with crowd',
      file: '/audio/Fusion FC Anthem (Remix) with crowd.mp3',
      hasLyrics: true
    },
    {
      name: 'Fusion FC Anthem (v2)',
      file: '/audio/Fusion FC Anthem (v2).mp3',
      hasLyrics: false
    },
    {
      name: 'Fusion FC Anthem (v3)',
      file: '/audio/Fusion FC Anthem (v3).mp3',
      hasLyrics: false
    },
    {
      name: 'Fusion FC Anthem (v4)',
      file: '/audio/Fusion FC Anthem (v4).mp3',
      hasLyrics: false
    }
  ]

  // Enhanced lyrics data with word-level timing for karaoke
  const lyrics = [
    {
      time: 5.84,
      text: "Oh la la, oh la la Fusion FC!",
      words: [
        { word: "Oh", start: 5.84, end: 6.0 },
        { word: "la", start: 6.0, end: 6.16 },
        { word: "la,", start: 6.16, end: 6.32 },
        { word: "oh", start: 6.32, end: 6.48 },
        { word: "la", start: 6.48, end: 6.64 },
        { word: "la", start: 6.64, end: 6.8 },
        { word: "Fusion", start: 6.8, end: 7.2 },
        { word: "FC!", start: 7.2, end: 7.6 }
      ]
    },
    {
      time: 8.52,
      text: "Allez! Allez! Allez!",
      words: [
        { word: "Allez!", start: 8.52, end: 9.0 },
        { word: "Allez!", start: 9.0, end: 9.48 },
        { word: "Allez!", start: 9.48, end: 9.96 }
      ]
    },
    {
      time: 11.12,
      text: "Fan tokens determine who wins!",
      words: [
        { word: "Fan", start: 11.12, end: 11.4 },
        { word: "tokens", start: 11.4, end: 11.8 },
        { word: "determine", start: 11.8, end: 12.4 },
        { word: "who", start: 12.4, end: 12.6 },
        { word: "wins!", start: 12.6, end: 13.0 }
      ]
    },
    {
      time: 24.04,
      text: "Metal warriors take the field tonight",
      words: [
        { word: "Metal", start: 24.04, end: 24.5 },
        { word: "warriors", start: 24.5, end: 25.1 },
        { word: "take", start: 25.1, end: 25.4 },
        { word: "the", start: 25.4, end: 25.6 },
        { word: "field", start: 25.6, end: 26.0 },
        { word: "tonight", start: 26.0, end: 26.8 }
      ]
    },
    {
      time: 27.72,
      text: "Robot strikers in the stadium lights",
      words: [
        { word: "Robot", start: 27.72, end: 28.2 },
        { word: "strikers", start: 28.2, end: 28.8 },
        { word: "in", start: 28.8, end: 29.0 },
        { word: "the", start: 29.0, end: 29.2 },
        { word: "stadium", start: 29.2, end: 29.8 },
        { word: "lights", start: 29.8, end: 30.3 }
      ]
    },
    { time: 71.76, text: "Metal strikers with electric speed" },
    { time: 75.24, text: "Fan token power is all we need" },
    { time: 79.04, text: "Fans vote with tokens, set the pace" },
    { time: 82.80, text: "Digital power wins the race" },
    { time: 87.44, text: "Token power controls who takes the crown" },
    { time: 91.76, text: "Fan tokens make our victory proud" },
    { time: 96.08, text: "A victor arises from the crowd" },
    { time: 99.08, text: "Fusion FC - who will be crowned!" },
    { time: 104.80, text: "Fans unite, tokens rise" },
    { time: 107.60, text: "Victory comes to the truly wise" },
    { time: 110.08, text: "Hold your favourite team tokens tight" },
    { time: 112.72, text: "Team tokens unite!" },
    { time: 126.04, text: "Token power controls who takes the crown" },
    { time: 129.00, text: "Socios faithful, wearing victory's gown" },
    { time: 134.40, text: "Fans unite, let the tokens surge" },
    { time: 136.68, text: "Victory flows where communities merge" },
    { time: 138.16, text: "Digital hearts with analog soul" },
    { time: 140.40, text: "Fusion FC - one will be crowned!" },
    { time: 142.76, text: "A champion will be crowned!" },
    { time: 146.88, text: "(Champion!)" },
    { time: 148.48, text: "Power to the tokens!" },
    { time: 150.72, text: "(Fan Tokens!)" },
    { time: 151.28, text: "Fusion FC!" },
    { time: 152.60, text: "(Fusion FC!)" },
    { time: 154.79, text: "Fan tokens determine who wins!" }
  ]

  // Initialize global audio state if it doesn't exist
  if (!globalAudioState) {
    globalAudioState = reactive<AudioState>({
      isMusicPlaying: false,
      isMusicPaused: false,
      showLyrics: true,
      currentLyricsTime: 0,
      autoPlayMusic: true,
      equalizerBars: [0, 0, 0, 0, 0],
      musicDuration: 0,
      musicCurrentTime: 0,
      trackName: tracks[0].name,
      progress: 0,
      currentLyric: '',
      previousLyric: '',
      nextLyric: '',
      currentTrackIndex: 0,
      availableTracks: tracks,
      // Karaoke word highlighting
      currentWords: [],
      currentWordIndex: -1
    })
  }

  // Use the global audio state
  const audioState = globalAudioState

  // Audio context refs
  const audioContext = ref<AudioContext | null>(null)
  const analyser = ref<AnalyserNode | null>(null)
  const dataArray = ref<Uint8Array | null>(null)
  const audioSource = ref<MediaElementAudioSourceNode | null>(null)

  // Event for music stop, to be watched by components
  const onMusicStop = ref(0)

  // Load audio track (lazy loading)
  const loadTrack = (trackIndex: number) => {
    if (trackIndex < 0 || trackIndex >= tracks.length) return

    try {
      // Clean up previous audio
      if (currentAudio) {
        currentAudio.pause()
        currentAudio = null
      }

      // Reset audio context
      if (audioSource.value) {
        audioSource.value.disconnect()
        audioSource.value = null
      }

      // Create new audio element
      currentAudio = new Audio(tracks[trackIndex].file)
      currentAudio.preload = 'none' // Lazy loading
      currentAudio.volume = 0.3
      currentAudio.loop = true

      // Update state
      audioState.currentTrackIndex = trackIndex
      audioState.trackName = tracks[trackIndex].name

      console.log(`🎵 Loaded track: ${tracks[trackIndex].name}`)
    } catch (error) {
      console.error('❌ Error loading track:', error)
    }
  }

  // Switch to next track
  const nextTrack = () => {
    const nextIndex = (audioState.currentTrackIndex + 1) % tracks.length
    const wasPlaying = audioState.isMusicPlaying
    
    // Stop current track if playing
    if (currentAudio && wasPlaying) {
      currentAudio.pause()
      audioState.isMusicPlaying = false
    }
    
    loadTrack(nextIndex)
    
    // If music was playing, start the new track
    if (wasPlaying) {
      startMusic()
    }
  }

  // Switch to previous track
  const previousTrack = () => {
    const prevIndex = audioState.currentTrackIndex === 0 ? tracks.length - 1 : audioState.currentTrackIndex - 1
    const wasPlaying = audioState.isMusicPlaying
    
    // Stop current track if playing
    if (currentAudio && wasPlaying) {
      currentAudio.pause()
      audioState.isMusicPlaying = false
    }
    
    loadTrack(prevIndex)
    
    // If music was playing, start the new track
    if (wasPlaying) {
      startMusic()
    }
  }

  // Start music (separate from toggle to avoid recursion)
  const startMusic = async () => {
    try {
      if (!currentAudio) {
        loadTrack(audioState.currentTrackIndex)
      }

      if (audioContext.value?.state === 'suspended') {
        await audioContext.value.resume()
      }
      
      if (!audioContext.value) {
        audioContext.value = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
      
      if (!analyser.value) {
        analyser.value = audioContext.value.createAnalyser()
        analyser.value.fftSize = 256
        analyser.value.smoothingTimeConstant = 0.8
      }
      
      if (!audioSource.value && currentAudio) {
        audioSource.value = audioContext.value.createMediaElementSource(currentAudio)
        audioSource.value.connect(analyser.value)
        analyser.value.connect(audioContext.value.destination)
        
        dataArray.value = new Uint8Array(analyser.value.frequencyBinCount)
      }
      
      await currentAudio?.play()
      audioState.isMusicPlaying = true
      console.log('🎵 Music playing')
      updateEqualizer()
    } catch (error) {
      console.error('❌ Error starting music:', error)
    }
  }

  // Toggle background music
  const toggleBackgroundMusic = async () => {
    try {
      if (!currentAudio) {
        loadTrack(audioState.currentTrackIndex)
      }

      if (audioState.isMusicPlaying) {
        currentAudio?.pause()
        audioState.isMusicPlaying = false
        console.log('🎵 Music paused')
      } else {
        await startMusic()
      }
    } catch (error) {
      console.error('❌ Error toggling music:', error)
    }
  }

  const stopMusic = () => {
    if (currentAudio) {
      currentAudio.pause()
      currentAudio.currentTime = 0
      audioState.progress = 0
      audioState.isMusicPlaying = false
      onMusicStop.value++
      console.log('🎵 Music stopped')
    }
  }

  // Update lyrics with word-level karaoke highlighting
  const updateLyrics = () => {
    if (!currentAudio || !tracks[audioState.currentTrackIndex].hasLyrics) {
      audioState.currentLyric = ''
      audioState.previousLyric = ''
      audioState.nextLyric = ''
      audioState.currentWords = []
      audioState.currentWordIndex = -1
      return
    }

    const currentTime = currentAudio.currentTime
    const currentIndex = lyrics.findIndex((lyric, index) => {
      const nextTime = lyrics[index + 1]?.time || Infinity
      return currentTime >= lyric.time && currentTime < nextTime
    })

    if (currentIndex >= 0) {
      const currentLyricData = lyrics[currentIndex]
      audioState.currentLyric = currentLyricData?.text || ''
      audioState.previousLyric = lyrics[currentIndex - 1]?.text || ''
      audioState.nextLyric = lyrics[currentIndex + 1]?.text || ''

      // Handle word-level highlighting for karaoke
      if (currentLyricData?.words) {
        // Update current words with highlighting status
        audioState.currentWords = currentLyricData.words.map(wordData => ({
          ...wordData,
          isHighlighted: currentTime >= wordData.start && currentTime <= wordData.end
        }))

        // Find current word index
        audioState.currentWordIndex = currentLyricData.words.findIndex(wordData =>
          currentTime >= wordData.start && currentTime <= wordData.end
        )
      } else {
        // Fallback for lyrics without word timing
        audioState.currentWords = []
        audioState.currentWordIndex = -1
      }
    } else {
      // Reset when no lyric is active
      audioState.currentWords = []
      audioState.currentWordIndex = -1
    }
  }

  // Update equalizer
  const updateEqualizer = () => {
    if (!analyser.value || !dataArray.value || !audioState.isMusicPlaying || !currentAudio) return
    
    analyser.value.getByteFrequencyData(dataArray.value)
    
    const frequencyRanges = [
      { min: 0, max: 500 },    // Lows (Covers more bins at the very low end)
      { min: 500, max: 1500 }, // Lower Mids
      { min: 1500, max: 4000 }, // Mids
      { min: 4000, max: 8000 }, // High Mids
      { min: 8000, max: 20000 } // Highs (up to 20kHz, which is typically the human hearing limit)
    ]
    
    const bars = frequencyRanges.map(range => {
      if (!audioContext.value || !analyser.value || !dataArray.value) return 0
      const startIndex = Math.floor(range.min * dataArray.value.length / audioContext.value.sampleRate)
      const endIndex = Math.floor(range.max * dataArray.value.length / audioContext.value.sampleRate)
      
      let sum = 0
      for (let i = startIndex; i < endIndex; i++) {
        sum += dataArray.value[i]
      }
      
      const average = sum / (endIndex - startIndex)
      return Math.min(average / 255, 1)
    })
    
    audioState.equalizerBars = bars
    audioState.progress = currentAudio.duration > 0 ? (currentAudio.currentTime / currentAudio.duration) * 100 : 0
    audioState.musicDuration = currentAudio.duration
    audioState.musicCurrentTime = currentAudio.currentTime
    
    // Update lyrics with music
    updateLyrics()
    
    if (audioState.isMusicPlaying) {
      requestAnimationFrame(updateEqualizer)
    }
  }

  // Play sound effects
  const playBallBounce = () => {
    ballBounceAudio.currentTime = 0
    ballBounceAudio.play().catch(e => console.log('Audio play failed:', e))
  }

  const playBallKick = () => {
    ballKickAudio.currentTime = 0
    ballKickAudio.play().catch(e => console.log('Audio play failed:', e))
  }

  const playCoinSpin = () => {
    coinSpinAudio.currentTime = 2.1;
    coinSpinAudio.play().catch(e => console.error('Coin spin audio play failed:', e));
  }

  const playCoinHitTorusSound = () => {
    coinHitTorusAudio.currentTime = 0.4;
    coinHitTorusAudio.play().catch(e => console.error('Coin hit torus audio play failed:', e));
  }

  // Cleanup
  onUnmounted(() => {
    if (audioContext.value) {
      audioContext.value.close()
    }
    if (currentAudio) {
      currentAudio.pause()
      currentAudio.currentTime = 0
    }
  })

  return {
    audioState,
    toggleBackgroundMusic,
    stopMusic,
    nextTrack,
    previousTrack,
    playBallBounce,
    playBallKick,
    playCoinSpin,
    playCoinHitTorusSound,
    onMusicStop
  }
}
