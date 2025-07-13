import { ref, reactive, shallowRef } from 'vue'
import { FBXLoader } from 'three-stdlib'
import * as THREE from 'three'
import type { AnimationState, AnimationConfig, AnimationTiming, SceneRefs, MaterialSettings } from '@/types/scene'
import { createMainCharacterMaterials, createLayeredMeshGroup, type MaterialPair } from '@/utils/materialHelpers'

export function useAnimations(sceneRefs: SceneRefs, materialSettings: MaterialSettings) {
  const arcreactorMeshRef = shallowRef<THREE.Mesh | null>(null);
  const isArcreactorSpinning = ref(false);
  const arcreactorSpinEndTime = ref(0);
  const newHeadModelRef = shallowRef<THREE.Group | null>(null);
  const isNewHeadVisible = ref(true);
  const currentWaveAction = shallowRef<THREE.AnimationAction | null>(null);
  // Store materials for easy access
  const materials = reactive({
    base: null as THREE.MeshStandardMaterial | null,
    overlay: null as THREE.MeshStandardMaterial | null,
    arcreactor: null as THREE.MeshStandardMaterial | null
  })

  // Animation configuration
  const animations: AnimationConfig[] = [
    { name: '🛡️ Offensive Idle', file: '/bot1/offensive idle.fbx' },
    { name: '🏃 Strike Jog', file: '/bot1/Strike Foward Jog.fbx' },
    { name: '🏃‍♂️ Running', file: '/bot1/Running.fbx' },
  ]

  const waveAnimationPath = '/bot1/Samba Dancing.fbx';

  const animationTiming: AnimationTiming = {
    strikeJog: {
      contactFrame: 0.3,
      duration: 2.5
    }
  }

  // Animation state
  const animationState = reactive<AnimationState>({
    currentIndex: 0,
    isStrikeSequenceActive: false,
    time: 0,
    interactionState: {
      isStriking: false,
      strikeStartTime: 0,
      strikeTransitionTriggered: false,
      ballIncoming: false
    }
  })

  const clock = new THREE.Clock()

  // Load character model
  const loadCharacterModel = async () => {
    try {
      // Load both textures
      const textureLoader = new THREE.TextureLoader()
      const [baseTexture, overlayTexture] = await Promise.all([
        new Promise<THREE.Texture>((resolve, reject) => {
          textureLoader.load(
            '/bot1/bot1_original.png',
            (texture) => {
              texture.colorSpace = THREE.SRGBColorSpace
              resolve(texture)
            },
            undefined,
            reject
          )
        }),
        new Promise<THREE.Texture>((resolve, reject) => {
          textureLoader.load(
            '/bot1/bot1_shorts.png',
            (texture) => {
              texture.colorSpace = THREE.SRGBColorSpace
              resolve(texture)
            },
            undefined,
            reject
          )
        })
      ])

      const loader = new FBXLoader()
      const characterModel = await loader.loadAsync('/bot1/soccer_player_humanoid__texture2.fbx')
      
      characterModel.scale.setScalar(1)
      characterModel.position.set(0, 0, 0)
      
      // Log all mesh names
      characterModel.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          // Found mesh
        }
        if (child.isBone) { // THREE.Bone is a subclass of Object3D, .isBone is a type guard
          // Found bone
        }
      })
      
      // Create materials using helper function
      const materialPair = createMainCharacterMaterials(baseTexture, overlayTexture, materialSettings.brightness)
      materials.base = materialPair.base
      materials.overlay = materialPair.overlay
      
      // Convert materials to MeshStandardMaterial
      characterModel.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.name.toLowerCase().includes('arcreactor') && child.material) {
            arcreactorMeshRef.value = child;
            if (Array.isArray(child.material)) {
              materials.arcreactor = child.material[0] as THREE.MeshStandardMaterial;
            } else {
              materials.arcreactor = child.material as THREE.MeshStandardMaterial;
            }
            if (arcreactorMeshRef.value && materials.arcreactor) {
              arcreactorMeshRef.value.userData.defaultEmissive = materials.arcreactor.emissive.clone();
              arcreactorMeshRef.value.userData.defaultEmissiveIntensity = materials.arcreactor.emissiveIntensity;
            }
          }
          if (child.material && (child.material instanceof THREE.MeshPhongMaterial || 
              child.material instanceof THREE.MeshBasicMaterial || 
              child.material instanceof THREE.MeshStandardMaterial)) {
            
            // Create layered mesh group using helper function
            const layeredGroup = createLayeredMeshGroup(child, materialPair)
            
            // Replace the original mesh with the layered group
            child.parent?.add(layeredGroup)
            child.parent?.remove(child)
          }
          child.castShadow = true
          child.receiveShadow = true
        }
      })
      
      if (sceneRefs.modelGroup) {
        sceneRefs.modelGroup.add(characterModel)
        sceneRefs.model = characterModel
        // Attach new head model
        try {
          const headLoader = new FBXLoader(); // FBXLoader is already imported
          const newHeadModel = await headLoader.loadAsync('/bot1/bot2-head.fbx');
          let headBone = null;
          characterModel.traverse((child) => {
            if (child.isBone && child.name === 'mixamorigHead') {
              headBone = child;
            }
          });

          if (headBone) {

            // Load texture and create new material for the head
            const headTextureLoader = new THREE.TextureLoader();
            const headTexture = await new Promise<THREE.Texture>((resolve, reject) => {
              headTextureLoader.load(
                '/bot1/bot2-head.png',
                (texture) => {
                  texture.colorSpace = THREE.SRGBColorSpace;
                  texture.renderOrder
                  resolve(texture);
                },
                undefined,
                (err) => {
                  reject(err); // Important to reject the promise on error
                }
              );
            });
            const newHeadMaterial = new THREE.MeshStandardMaterial({
              map: headTexture,
            });
            newHeadModel.traverse((node) => {
              if (node instanceof THREE.Mesh) {
                node.material = newHeadMaterial;
                }
            });
            
            // Adjust scale, position, rotation as needed
            newHeadModel.scale.set(1.01, 1.01, 1.01); // Adjust as necessary
            newHeadModel.position.set(0, -88, 2);   // Adjust as necessary
            newHeadModel.rotation.set(0, 0, 0);   // Adjust as necessary

            headBone.add(newHeadModel);
            newHeadModelRef.value = newHeadModel; // Store the reference to the new head model
            } else {
            }
        } catch (headLoadError) {
          }
        // End of new head attachment logic
        await loadAnimations()
      }
      
    } catch (error) {
      throw error
    }
  }

  // Load animations
  const loadAnimations = async () => {
    if (!sceneRefs.model) return
    
    try {
      const loader = new FBXLoader()
      const animationFiles = animations.map(anim => anim.file)
      const loadedActions: THREE.AnimationAction[] = []
      
      sceneRefs.mixer = new THREE.AnimationMixer(sceneRefs.model)
      
      for (let i = 0; i < animationFiles.length; i++) {
        const animationFBX = await loader.loadAsync(animationFiles[i])
        
        if (animationFBX.animations && animationFBX.animations.length > 0) {
          const clip = animationFBX.animations[0]
          const action = sceneRefs.mixer!.clipAction(clip)
          loadedActions.push(action)
          }
      }
      
      sceneRefs.actions = loadedActions
      
      // Start with idle animation
      if (sceneRefs.actions.length > 0) {
        sceneRefs.actions[0].play()
        }
      
      } catch (error) {
      throw error
    }
  }

  // Update animation mixer
  const updateAnimations = () => {
    const deltaTime = clock.getDelta()
    
    if (sceneRefs.mixer) {
      sceneRefs.mixer.update(deltaTime)
    }

    // Continuous Arcreactor spin
    if (arcreactorMeshRef.value) {
      arcreactorMeshRef.value.rotation.z += 0.04; // Adjust for desired slow spin speed
    }

    // Arcreactor spin logic for power-up
    if (isArcreactorSpinning.value && arcreactorMeshRef.value) {
      if (Date.now() < arcreactorSpinEndTime.value) {
        arcreactorMeshRef.value.rotation.z += 0.1; // Adjust spin speed as needed
      } else {
        isArcreactorSpinning.value = false;
        }
    }
    
    return deltaTime
  }

  // Switch animation
  const switchAnimation = (index: number) => {
    if (!sceneRefs.actions || index >= sceneRefs.actions.length) return
    
    // Stop current animation
    if (sceneRefs.actions[animationState.currentIndex]) {
      sceneRefs.actions[animationState.currentIndex].stop()
    }
    
    // Play new animation
    animationState.currentIndex = index
    sceneRefs.actions[index].reset().play()
  }

  // Get current animation info
  const getCurrentAnimation = () => {
    if (!sceneRefs.actions || !sceneRefs.actions[animationState.currentIndex]) {
      return {
        name: 'Loading...',
        duration: 0
      }
    }
    
    return {
      name: animations[animationState.currentIndex].name,
      duration: sceneRefs.actions[animationState.currentIndex].getClip().duration
    }
  }

  // Update overlay color
  const updateOverlayColor = (hue: number, saturation: number, lightness: number) => {
    if (materials.overlay) {
      materials.overlay.color.setHSL(hue/360, saturation, lightness)
    }
  }

  // Update arcreactor color
  const updateArcreactorColor = (hue: number, saturation: number, lightness: number) => {
    if (materials.arcreactor) {
      materials.arcreactor.color.setHSL(hue/360, saturation, lightness)
    }
  }

  const triggerPowerUpFlash = (target: 'character' | 'torus') => {
    let arcreactorToFlash: THREE.MeshStandardMaterial | null = null;
    let baseToFlash: THREE.MeshStandardMaterial | null = null;
    let torusToFlash: THREE.MeshStandardMaterial | null = null;

    let arcreactorOriginalEmissive: THREE.Color | null = null;
    let arcreactorOriginalIntensity: number | null = null;
    let baseOriginalEmissive: THREE.Color | null = null;
    let baseOriginalIntensity: number | null = null;
    let torusOriginalEmissive: THREE.Color | null = null;
    let torusOriginalIntensity: number | null = null;

    if (target === 'character') {
      // Prioritize materials.arcreactor if available
      if (materials.arcreactor) {
        arcreactorToFlash = materials.arcreactor;
      } else if (arcreactorMeshRef.value && arcreactorMeshRef.value.material instanceof THREE.MeshStandardMaterial) {
        // Fallback to arcreactorMeshRef if model is loaded but materials.arcreactor isn't (should be rare)
        arcreactorToFlash = arcreactorMeshRef.value.material as THREE.MeshStandardMaterial;
        }

      if (arcreactorToFlash) {
        if (arcreactorToFlash.userData.defaultEmissive && typeof arcreactorToFlash.userData.defaultEmissiveIntensity === 'number') {
          arcreactorOriginalEmissive = (arcreactorToFlash.userData.defaultEmissive as THREE.Color).clone();
          arcreactorOriginalIntensity = arcreactorToFlash.userData.defaultEmissiveIntensity as number;
        } else {
          arcreactorOriginalEmissive = arcreactorToFlash.emissive.clone();
          arcreactorOriginalIntensity = arcreactorToFlash.emissiveIntensity;
        }
        arcreactorToFlash.emissive.setHex(0x00FF00); // Green flash
        arcreactorToFlash.emissiveIntensity = 0.2;
      }

      if (materials.base) {
        baseToFlash = materials.base;
        if (baseToFlash.userData.defaultEmissive && typeof baseToFlash.userData.defaultEmissiveIntensity === 'number') {
          baseOriginalEmissive = (baseToFlash.userData.defaultEmissive as THREE.Color).clone();
          baseOriginalIntensity = baseToFlash.userData.defaultEmissiveIntensity as number;
        } else {
          baseOriginalEmissive = baseToFlash.emissive.clone();
          baseOriginalIntensity = baseToFlash.emissiveIntensity;
        }
        baseToFlash.emissive.setHex(0x00FF00); // Green flash
        baseToFlash.emissiveIntensity = 0.5;
      }
    } else if (target === 'torus' && sceneRefs.torus) {
      const torusMesh = sceneRefs.torus.children[0] as THREE.Mesh;
      if (torusMesh && torusMesh.material instanceof THREE.MeshStandardMaterial) {
        torusToFlash = torusMesh.material as THREE.MeshStandardMaterial;
        // Use userData to get default emissive if available, otherwise clone current
        if (torusMesh.userData.defaultEmissive && typeof torusMesh.userData.defaultEmissiveIntensity === 'number') {
            torusOriginalEmissive = (torusMesh.userData.defaultEmissive as THREE.Color).clone();
            torusOriginalIntensity = torusMesh.userData.defaultEmissiveIntensity as number;
        } else {
            torusOriginalEmissive = torusToFlash.emissive.clone();
            torusOriginalIntensity = torusToFlash.emissiveIntensity;
        }
        torusToFlash.emissive.setHex(0x00FF00); // Green flash
        torusToFlash.emissiveIntensity = 2.0; // Brighter flash
      }
    }

    // Proceed if any material was set up for flashing
    if (arcreactorToFlash || baseToFlash || torusToFlash) {
      setTimeout(() => {
        if (arcreactorToFlash && arcreactorOriginalEmissive && arcreactorOriginalIntensity !== null) {
          arcreactorToFlash.emissive.copy(arcreactorOriginalEmissive);
          arcreactorToFlash.emissiveIntensity = arcreactorOriginalIntensity;
        }
        if (baseToFlash && baseOriginalEmissive && baseOriginalIntensity !== null) {
          baseToFlash.emissive.copy(baseOriginalEmissive);
          baseToFlash.emissiveIntensity = baseOriginalIntensity;
        }
        if (torusToFlash && torusOriginalEmissive && torusOriginalIntensity !== null) {
          torusToFlash.emissive.copy(torusOriginalEmissive);
          torusToFlash.emissiveIntensity = torusOriginalIntensity;
        }
        // Scaling logic ONLY for torus
        if (target === 'torus' && sceneRefs.torus) {
          const torusMeshForScaling = sceneRefs.torus.children[0] as THREE.Mesh;
          const defaultTorusScale = sceneRefs.torusDefaultScale ? sceneRefs.torusDefaultScale.clone() : null;

          if (torusMeshForScaling && torusMeshForScaling.isMesh && defaultTorusScale) {
            // if (gsap) gsap.killTweensOf(torusMeshForScaling.scale); // If GSAP were used
            torusMeshForScaling.scale.set(defaultTorusScale.x * 1.2, defaultTorusScale.y * 1.2, defaultTorusScale.z * 1.2);
            setTimeout(() => {
              if (torusMeshForScaling && torusMeshForScaling.parent) { // Check if still part of scene
                torusMeshForScaling.scale.copy(defaultTorusScale);
                }
            }, 150); // Scale pulse duration
          } else {
          }
        }
      }, 200); // Flash duration 200ms

      if (target === 'torus' && arcreactorMeshRef.value) {
        isArcreactorSpinning.value = true;
        arcreactorSpinEndTime.value = Date.now() + 1000; // Spin for 1 second
      }
    } else {
      }
  };

  const stopWaveAnimation = () => {
    if (currentWaveAction.value) {
      currentWaveAction.value.fadeOut(0.5);
      currentWaveAction.value = null;
    }
  };

  // Play power-up animation when hit by coin
  const playPowerUpAnimation = async () => {
    if (!sceneRefs.mixer || !sceneRefs.model) {
      return
    }

    try {
      const loader = new FBXLoader()
      const powerUpFBX = await loader.loadAsync('/bot1/PowerUp.fbx')
      
      if (powerUpFBX.animations && powerUpFBX.animations.length > 0) {
        const clip = powerUpFBX.animations[0]
        // Store current animation state before PowerUp
        const previousAnimationIndex = animationState.currentIndex
        const previousAction = sceneRefs.actions && sceneRefs.actions[previousAnimationIndex] ? sceneRefs.actions[previousAnimationIndex] : null
        // Fade out current animation
        if (previousAction) {
          previousAction.fadeOut(0.2)
        }

        const powerUpAction = sceneRefs.mixer.clipAction(clip)
        powerUpAction.setLoop(THREE.LoopOnce, 1)
        powerUpAction.clampWhenFinished = true
        powerUpAction.timeScale = 3.0 // Play at 3x speed
        powerUpAction.reset().fadeIn(0.2).play()
        
        // Return to previous animation after 1 second
        setTimeout(() => {
          powerUpAction.fadeOut(0.2)

          // Return to previous animation state
          if (previousAction) {
            animationState.currentIndex = previousAnimationIndex
            previousAction.reset().fadeIn(0.2).play()
            } else if (sceneRefs.actions && sceneRefs.actions[0]) {
            // Fallback to idle if previous action not available
            animationState.currentIndex = 0
            sceneRefs.actions[0].reset().fadeIn(0.2).play()
            }
        }, 1000) // 1 second timeout
      }
    } catch (error) {
      }
  }

  const playWaveAnimation = async () => {
    // New Log

    if (!sceneRefs.model || !sceneRefs.mixer) {
      // Enhanced Log
      return;
    }
    // New Log

    try {
      const loader = new FBXLoader();
      const animationFBX = await loader.loadAsync(waveAnimationPath);
      // New Log

      if (animationFBX.animations && animationFBX.animations.length > 0) {
        const clip = animationFBX.animations[0];
        // Enhanced Log

        if (sceneRefs.actions && sceneRefs.actions[animationState.currentIndex]) {
          sceneRefs.actions[animationState.currentIndex].fadeOut(0.5);
        } else {
          // New Log
        }

        const waveAction = sceneRefs.mixer.clipAction(clip);
        // New Log
        waveAction.setLoop(THREE.LoopRepeat, Infinity);
        waveAction.reset().fadeIn(0.5).play();
        currentWaveAction.value = waveAction;
        // New Log

        const onWaveAnimationFinished = (event: any) => {
          if (event.action === waveAction) {
            // Enhanced Log
            sceneRefs.mixer!.removeEventListener('finished', onWaveAnimationFinished);
            waveAction.fadeOut(0.5);

            if (sceneRefs.actions && sceneRefs.actions[0]) {
              animationState.currentIndex = 0; // Revert to idle animation
              sceneRefs.actions[0].reset().fadeIn(0.5).play();
              } else {
              // New Log
            }
          }
        };
        sceneRefs.mixer.addEventListener('finished', onWaveAnimationFinished);
        // New Log

      } else {
        // Enhanced Log
      }
    } catch (error) {
      // Enhanced Log
    }
  };

  const toggleNewHead = () => {
    if (newHeadModelRef.value) {
      isNewHeadVisible.value = !isNewHeadVisible.value;
      newHeadModelRef.value.visible = isNewHeadVisible.value;
      }
  };

  return {
    animations,
    animationTiming,
    animationState,

    loadCharacterModel,
    loadAnimations,
    updateAnimations,
    switchAnimation,
    getCurrentAnimation,
    updateOverlayColor,
    updateArcreactorColor,
    materials,
    triggerPowerUpFlash,
    arcreactorMeshRef, // Correctly placed

    // New additions
    isNewHeadVisible,
    newHeadModelRef, // Exposing the ref for the head model
    toggleNewHead,
    playWaveAnimation,
    stopWaveAnimation,
    currentWaveAction,
    playPowerUpAnimation
  };
}