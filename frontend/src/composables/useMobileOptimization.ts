import { ref } from 'vue'

/**
 * Mobile Optimization Composable
 * 
 * Provides device performance detection and optimization strategies
 * for mobile devices to ensure smooth 3D scene performance.
 */

export type PerformanceLevel = 'high' | 'medium' | 'low'

export interface DeviceInfo {
  userAgent: string
  platform: string
  hardwareConcurrency: number
  deviceMemory?: number
  webglRenderer?: string
  isMobile: boolean
  isTablet: boolean
  isIOS: boolean
  isAndroid: boolean
}

export interface OptimizationSettings {
  bloomEnabled: boolean
  fogEnabled: boolean
  shadowsEnabled: boolean
  showGrass: boolean
  videoPlayback: boolean
  particleCount: number
  renderScale: number
  targetFPS: number
}

export function useMobileOptimization() {
  const performanceLevel = ref<PerformanceLevel>('medium')
  const deviceInfo = ref<DeviceInfo | null>(null)
  const optimizationSettings = ref<OptimizationSettings | null>(null)

  /**
   * Detects device information and capabilities
   */
  const detectDeviceInfo = (): DeviceInfo => {
    const userAgent = navigator.userAgent.toLowerCase()
    
    // Detect platform
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
    const isTablet = /ipad|android(?!.*mobi)/i.test(userAgent)
    const isIOS = /iphone|ipad|ipod/i.test(userAgent)
    const isAndroid = /android/i.test(userAgent)
    
    // Get hardware info
    const hardwareConcurrency = navigator.hardwareConcurrency || 2
    const deviceMemory = (navigator as any).deviceMemory || undefined
    
    // Detect WebGL renderer for GPU info
    let webglRenderer = 'Unknown'
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
        if (debugInfo) {
          webglRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
        }
      }
    } catch (e) {
      console.warn('Could not detect WebGL renderer:', e)
    }

    return {
      userAgent,
      platform: navigator.platform,
      hardwareConcurrency,
      deviceMemory,
      webglRenderer,
      isMobile,
      isTablet,
      isIOS,
      isAndroid
    }
  }

  /**
   * Performs device performance benchmarking
   */
  const benchmarkDevice = async (): Promise<PerformanceLevel> => {
    // Simple performance benchmark
    const startTime = performance.now()
    
    // CPU benchmark: Math operations
    let result = 0
    for (let i = 0; i < 100000; i++) {
      result += Math.sin(i) * Math.cos(i)
    }
    
    const cpuTime = performance.now() - startTime
    
    // Memory benchmark
    const memoryScore = deviceInfo.value?.deviceMemory || 2
    const cpuScore = deviceInfo.value?.hardwareConcurrency || 2
    
    // WebGL benchmark
    let webglScore = 1
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl')
      if (gl) {
        const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE)
        const maxViewportDims = gl.getParameter(gl.MAX_VIEWPORT_DIMS)
        webglScore = Math.min(maxTextureSize / 2048, maxViewportDims[0] / 1024)
      }
    } catch (e) {
      console.warn('WebGL benchmark failed:', e)
    }

    // Calculate overall performance score
    const performanceScore = (
      (cpuScore * 0.3) +
      (memoryScore * 0.3) +
      (webglScore * 0.2) +
      ((100 - cpuTime) / 100 * 0.2) // Faster CPU = higher score
    )

    console.log('📊 Performance benchmark results:', {
      cpuTime,
      cpuScore,
      memoryScore,
      webglScore,
      performanceScore
    })

    // Classify performance level
    if (performanceScore >= 3) return 'high'
    if (performanceScore >= 1.5) return 'medium'
    return 'low'
  }

  /**
   * Detects overall device performance level
   */
  const detectPerformanceLevel = async (): Promise<PerformanceLevel> => {
    deviceInfo.value = detectDeviceInfo()
    
    // Quick classification based on known device patterns
    const userAgent = deviceInfo.value.userAgent
    
    // High-end devices
    if (
      /iphone.*(13|14|15)|ipad.*(pro|air.*4|mini.*6)/.test(userAgent) ||
      /samsung.*galaxy.*(s2[0-9]|note2[0-9]|fold|ultra)/.test(userAgent) ||
      /pixel.*[67]/.test(userAgent) ||
      deviceInfo.value.hardwareConcurrency >= 8 ||
      (deviceInfo.value.deviceMemory && deviceInfo.value.deviceMemory >= 6)
    ) {
      performanceLevel.value = 'high'
      return 'high'
    }
    
    // Low-end devices  
    if (
      /iphone.*[6-9](?![0-9])/.test(userAgent) ||
      /android.*[4-6]\./.test(userAgent) ||
      deviceInfo.value.hardwareConcurrency <= 2 ||
      (deviceInfo.value.deviceMemory && deviceInfo.value.deviceMemory <= 2)
    ) {
      performanceLevel.value = 'low'
      return 'low'
    }

    // For unknown devices, run benchmark
    const benchmarkResult = await benchmarkDevice()
    performanceLevel.value = benchmarkResult
    return benchmarkResult
  }

  /**
   * Gets optimal settings for detected performance level
   */
  const getOptimalSettings = (level: PerformanceLevel): OptimizationSettings => {
    const settings: Record<PerformanceLevel, OptimizationSettings> = {
      high: {
        bloomEnabled: true,
        fogEnabled: true,
        shadowsEnabled: true,
        showGrass: true,
        videoPlayback: true,
        particleCount: 100,
        renderScale: 1.0,
        targetFPS: 60
      },
      medium: {
        bloomEnabled: false,
        fogEnabled: true,
        shadowsEnabled: false,
        showGrass: true,
        videoPlayback: true,
        particleCount: 50,
        renderScale: 0.8,
        targetFPS: 30
      },
      low: {
        bloomEnabled: false,
        fogEnabled: false,
        shadowsEnabled: false,
        showGrass: false,
        videoPlayback: false,
        particleCount: 20,
        renderScale: 0.6,
        targetFPS: 24
      }
    }

    optimizationSettings.value = settings[level]
    return settings[level]
  }

  /**
   * Applies device-specific optimizations
   */
  const optimizeForDevice = (level?: PerformanceLevel) => {
    const targetLevel = level || performanceLevel.value
    const settings = getOptimalSettings(targetLevel)
    
    console.log(`🔧 Applying ${targetLevel} performance optimizations:`, settings)
    
    // Apply viewport optimizations
    if (deviceInfo.value?.isMobile) {
      // Disable iOS bounce scrolling
      if (deviceInfo.value.isIOS) {
        document.body.style.touchAction = 'manipulation'
        document.body.style.webkitOverflowScrolling = 'touch'
      }
      
      // Set viewport for consistent mobile rendering
      const viewport = document.querySelector('meta[name="viewport"]')
      if (viewport) {
        viewport.setAttribute('content', 
          'width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover'
        )
      }
    }

    return settings
  }

  /**
   * Enables power save mode with aggressive optimizations
   */
  const enablePowerSaveMode = () => {
    console.log('🔋 Enabling power save mode')
    
    const powerSaveSettings: OptimizationSettings = {
      bloomEnabled: false,
      fogEnabled: false,
      shadowsEnabled: false,
      showGrass: false,
      videoPlayback: false,
      particleCount: 10,
      renderScale: 0.5,
      targetFPS: 20
    }

    optimizationSettings.value = powerSaveSettings
    
    // Additional power save optimizations
    if (deviceInfo.value?.isMobile) {
      // Reduce animation frame rate
      const style = document.createElement('style')
      style.textContent = `
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-delay: 0.01ms !important;
          transition-duration: 0.01ms !important;
          transition-delay: 0.01ms !important;
        }
      `
      document.head.appendChild(style)
    }

    return powerSaveSettings
  }

  /**
   * Monitors device performance and adjusts settings dynamically
   */
  const startPerformanceMonitoring = () => {
    if (!('performance' in window)) return

    let frameCount = 0
    let lastTime = performance.now()
    let fps = 60

    const monitorFrame = () => {
      frameCount++
      const currentTime = performance.now()
      
      if (currentTime - lastTime >= 1000) {
        fps = frameCount
        frameCount = 0
        lastTime = currentTime
        
        // Auto-adjust settings if performance drops
        if (fps < 20 && performanceLevel.value !== 'low') {
          console.log('📉 Low FPS detected, reducing quality')
          optimizeForDevice('low')
        } else if (fps > 50 && performanceLevel.value === 'low') {
          console.log('📈 Good FPS detected, increasing quality')
          optimizeForDevice('medium')
        }
      }
      
      requestAnimationFrame(monitorFrame)
    }

    requestAnimationFrame(monitorFrame)
  }

  /**
   * Gets device-specific memory and storage limits
   */
  const getResourceLimits = () => {
    const level = performanceLevel.value
    
    return {
      maxTextureSize: level === 'high' ? 2048 : level === 'medium' ? 1024 : 512,
      maxGeometryComplexity: level === 'high' ? 10000 : level === 'medium' ? 5000 : 2000,
      maxParticles: level === 'high' ? 1000 : level === 'medium' ? 500 : 100,
      cacheSize: level === 'high' ? 50 : level === 'medium' ? 25 : 10
    }
  }

  return {
    // State
    performanceLevel,
    deviceInfo,
    optimizationSettings,
    
    // Methods
    detectDeviceInfo,
    detectPerformanceLevel,
    benchmarkDevice,
    getOptimalSettings,
    optimizeForDevice,
    enablePowerSaveMode,
    startPerformanceMonitoring,
    getResourceLimits
  }
}
