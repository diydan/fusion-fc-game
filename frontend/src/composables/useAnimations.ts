import { ref, reactive, shallowRef } from 'vue'
import { FBXLoader } from 'three-stdlib'
import * as THREE from 'three'
import type { AnimationState, AnimationConfig, AnimationTiming, SceneRefs, MaterialSettings } from '@/types/scene'

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
      console.log('🤖 Loading character model...')
      
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
      console.log('🔍 Logging all mesh names in the model:')
      characterModel.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          console.log(`Found mesh: ${child.name} (ID: ${child.uuid})`)
        }
        if (child.isBone) { // THREE.Bone is a subclass of Object3D, .isBone is a type guard
          console.log(`🦴 Found bone: ${child.name} (ID: ${child.uuid})`)
        }
      })
      
      // Convert materials to MeshStandardMaterial
      let overlayMaterialCreated = false
      characterModel.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          console.log(`🔍 Processing mesh: `);
          if (child.name.toLowerCase().includes('arcreactor') && child.material) {
            arcreactorMeshRef.value = child;
            if (Array.isArray(child.material)) {
              materials.arcreactor = child.material[0] as THREE.MeshStandardMaterial;
            } else {
              materials.arcreactor = child.material as THREE.MeshStandardMaterial;
            }
            console.log('✅ Arcreactor mesh and material stored:', child.name);
            if (arcreactorMeshRef.value && materials.arcreactor) {
              arcreactorMeshRef.value.userData.defaultEmissive = materials.arcreactor.emissive.clone();
              arcreactorMeshRef.value.userData.defaultEmissiveIntensity = materials.arcreactor.emissiveIntensity;
              console.log('✅ Stored default arcreactor emissive:', { 
                color: materials.arcreactor.emissive.getHexString(), 
                intensity: materials.arcreactor.emissiveIntensity 
              });
            }
          }
          if (child.material instanceof THREE.MeshPhongMaterial) {
            // Create base material
            const baseMaterial = new THREE.MeshStandardMaterial({
              map: baseTexture,
              normalMap: child.material.normalMap,
              aoMap: child.material.aoMap,
              aoMapIntensity: 1,
              metalness: 0.6,
              roughness: 0.1,
              emissive: 0x44444,
              emissiveIntensity: 0.2,
              envMapIntensity: 1,
              transparent: true,
              opacity: 1,
              side: THREE.DoubleSide
            })
            baseMaterial.color.setScalar(materialSettings.brightness)
            
            // Only set base material once
            if (!materials.base) {
              materials.base = baseMaterial
              console.log('✅ Base material created and stored')
              if (materials.base) {
                materials.base.userData.defaultEmissive = materials.base.emissive.clone();
                materials.base.userData.defaultEmissiveIntensity = materials.base.emissiveIntensity;
                console.log('✅ Stored default base material emissive:', { 
                  color: materials.base.emissive.getHexString(), 
                  intensity: materials.base.emissiveIntensity 
                });
              }
            }

            // Create overlay material
            const overlayMaterial = new THREE.MeshStandardMaterial({
              map: overlayTexture,
              normalMap: child.material.normalMap,
              aoMap: child.material.aoMap,
              aoMapIntensity: 1,
              metalness: 0,
              roughness: 0.8,
              emissive: 0x44444,
              emissiveIntensity: 0.2,
              envMapIntensity: 0.2,
              transparent: true,
              opacity: 1,
              side: THREE.DoubleSide
            })
            
            // Set initial color to specified blue
            overlayMaterial.color.setHSL(218/360, 1, 0.5) // Hue: 218, Saturation: 100%, Lightness: 50%
            
            // Only set overlay material once
            if (!overlayMaterialCreated) {
              materials.overlay = overlayMaterial
              overlayMaterialCreated = true
              console.log('✅ Overlay material created and stored:', {
                color: overlayMaterial.color.getHexString(),
                metalness: overlayMaterial.metalness,
                roughness: overlayMaterial.roughness,
                transparent: overlayMaterial.transparent
              })
            }
            
            // Create a group for the mesh and its overlay
            const group = new THREE.Group()
            const baseMesh = child.clone()
            baseMesh.material = baseMaterial
            baseMesh.castShadow = true
            baseMesh.receiveShadow = false
            const overlayMesh = child.clone()
            overlayMesh.material = overlayMaterial
            overlayMesh.castShadow = false
            overlayMesh.receiveShadow = false
            
            group.add(baseMesh)
            group.add(overlayMesh)
            
            // Replace the original mesh with the group
            child.parent?.add(group)
            child.parent?.remove(child)
          }
          child.castShadow = true
          child.receiveShadow = true
        }
      })
      
      console.log('🎨 Final materials state:', {
        base: !!materials.base,
        overlay: !!materials.overlay,
        arcreactor: !!materials.arcreactor
      })
      
      if (sceneRefs.modelGroup) {
        sceneRefs.modelGroup.add(characterModel)
        sceneRefs.model = characterModel
        console.log('✅ Character model loaded and added to scene')
        
        // Attach new head model
        try {
          console.log('💀 Loading new head model /bot1/bot2-head.fbx...');
          const headLoader = new FBXLoader(); // FBXLoader is already imported
          const newHeadModel = await headLoader.loadAsync('/bot1/bot2-head.fbx');
          console.log('💀 New head model loaded:', newHeadModel);

          let headBone = null;
          characterModel.traverse((child) => {
            if (child.isBone && child.name === 'mixamorigHead') {
              headBone = child;
            }
          });

          if (headBone) {

    
            // Load texture and create new material for the head
            console.log('💀 Loading new head texture /bot1/bot2-head.png...');
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
                  console.error('❌ Error loading head texture:', err);
                  reject(err); // Important to reject the promise on error
                }
              );
            });
            console.log('💀 New head texture loaded.');

            const newHeadMaterial = new THREE.MeshStandardMaterial({
              map: headTexture,
            });
            console.log('💀 Created new material for head.');

            newHeadModel.traverse((node) => {
              if (node instanceof THREE.Mesh) {
                node.material = newHeadMaterial;
                console.log(`💀 Applied new material to head mesh: ${node.name}`);
              }
            });
            
            // Adjust scale, position, rotation as needed
            newHeadModel.scale.set(1.01, 1.01, 1.01); // Adjust as necessary
            newHeadModel.position.set(0, -88, 2);   // Adjust as necessary
            newHeadModel.rotation.set(0, 0, 0);   // Adjust as necessary
            
         
            
            headBone.add(newHeadModel);
            newHeadModelRef.value = newHeadModel; // Store the reference to the new head model
            console.log('💀 New head model attached to bone:', headBone.name);

          } else {
            console.warn('⚠️ Target bone "mixamorig:Head" not found in the character model.');
          }
        } catch (headLoadError) {
          console.error('❌ Error loading or attaching new head model:', headLoadError);
        }
        // End of new head attachment logic
        await loadAnimations()
      }
      
    } catch (error) {
      console.error('❌ Error loading character model:', error)
      throw error
    }
  }

  // Load animations
  const loadAnimations = async () => {
    if (!sceneRefs.model) return
    
    try {
      console.log('🎬 Loading animations...')
      
      const loader = new FBXLoader()
      const animationFiles = animations.map(anim => anim.file)
      const loadedActions: THREE.AnimationAction[] = []
      
      sceneRefs.mixer = new THREE.AnimationMixer(sceneRefs.model)
      
      for (let i = 0; i < animationFiles.length; i++) {
        console.log(`🎬 Loading animation ${i + 1}: ${animationFiles[i]}`)
        
        const animationFBX = await loader.loadAsync(animationFiles[i])
        
        if (animationFBX.animations && animationFBX.animations.length > 0) {
          const clip = animationFBX.animations[0]
          const action = sceneRefs.mixer!.clipAction(clip)
          loadedActions.push(action)
          console.log(`✅ Animation ${i + 1} loaded: ${clip.name}`)
        }
      }
      
      sceneRefs.actions = loadedActions
      
      // Start with idle animation
      if (sceneRefs.actions.length > 0) {
        sceneRefs.actions[0].play()
        console.log('🎬 Started idle animation')
      }
      
      console.log('✅ All animations loaded successfully')
      
    } catch (error) {
      console.error('❌ Error loading animations:', error)
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
        console.log('🌀 Arcreactor spin finished.');
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
    console.log(`💥 Triggering power-up flash for: `);
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
        console.log("🎯 Used arcreactorMeshRef.value.material for character arcreactor flash.");
      }

      if (arcreactorToFlash) {
        if (arcreactorToFlash.userData.defaultEmissive && typeof arcreactorToFlash.userData.defaultEmissiveIntensity === 'number') {
          arcreactorOriginalEmissive = (arcreactorToFlash.userData.defaultEmissive as THREE.Color).clone();
          arcreactorOriginalIntensity = arcreactorToFlash.userData.defaultEmissiveIntensity as number;
          console.log(`🎨 Using stored default emissive for arcreactor flash: ${arcreactorOriginalEmissive.getHexString()}, intensity: ${arcreactorOriginalIntensity}`);
        } else {
          arcreactorOriginalEmissive = arcreactorToFlash.emissive.clone();
          arcreactorOriginalIntensity = arcreactorToFlash.emissiveIntensity;
          console.log(`🎨 Cloned current emissive for arcreactor flash (default not found): ${arcreactorOriginalEmissive.getHexString()}, intensity: ${arcreactorOriginalIntensity}`);
        }
        arcreactorToFlash.emissive.setHex(0x00FF00); // Green flash
        arcreactorToFlash.emissiveIntensity = 0.2;
      }

      if (materials.base) {
        baseToFlash = materials.base;
        if (baseToFlash.userData.defaultEmissive && typeof baseToFlash.userData.defaultEmissiveIntensity === 'number') {
          baseOriginalEmissive = (baseToFlash.userData.defaultEmissive as THREE.Color).clone();
          baseOriginalIntensity = baseToFlash.userData.defaultEmissiveIntensity as number;
          console.log(`🎨 Using stored default emissive for base material flash: ${baseOriginalEmissive.getHexString()}, intensity: ${baseOriginalIntensity}`);
        } else {
          baseOriginalEmissive = baseToFlash.emissive.clone();
          baseOriginalIntensity = baseToFlash.emissiveIntensity;
          console.log(`🎨 Cloned current emissive for base material flash (default not found): ${baseOriginalEmissive.getHexString()}, intensity: ${baseOriginalIntensity}`);
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
            console.log(`🎨 Using stored default emissive for torus flash: , intensity: `);
        } else {
            torusOriginalEmissive = torusToFlash.emissive.clone();
            torusOriginalIntensity = torusToFlash.emissiveIntensity;
            console.log(`🎨 Cloned current emissive for torus flash (default not found): , intensity: `);
        }
        torusToFlash.emissive.setHex(0x00FF00); // Green flash
        torusToFlash.emissiveIntensity = 2.0; // Brighter flash
      }
    }

    // Proceed if any material was set up for flashing
    if (arcreactorToFlash || baseToFlash || torusToFlash) {
      console.log(`💥 Setting timeout to revert flash for `);
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
        console.log(`✅ Emissive flash reverted for: `);

        // Scaling logic ONLY for torus
        if (target === 'torus' && sceneRefs.torus) {
          const torusMeshForScaling = sceneRefs.torus.children[0] as THREE.Mesh;
          const defaultTorusScale = sceneRefs.torusDefaultScale ? sceneRefs.torusDefaultScale.clone() : null;

          if (torusMeshForScaling && torusMeshForScaling.isMesh && defaultTorusScale) {
            // if (gsap) gsap.killTweensOf(torusMeshForScaling.scale); // If GSAP were used
            torusMeshForScaling.scale.set(defaultTorusScale.x * 1.2, defaultTorusScale.y * 1.2, defaultTorusScale.z * 1.2);
            console.log(`✅ Torus scaled up`);

            setTimeout(() => {
              if (torusMeshForScaling && torusMeshForScaling.parent) { // Check if still part of scene
                torusMeshForScaling.scale.copy(defaultTorusScale);
                console.log(`✅ Torus scale reverted`);
              }
            }, 150); // Scale pulse duration
          } else {
            console.log(`✅ No scaling applied for torus (mesh or defaultTorusScale not found)`);
          }
        }
      }, 200); // Flash duration 200ms

      if (target === 'torus' && arcreactorMeshRef.value) {
        console.log('🌀 Initiating Arcreactor spin due to torus hit.');
        isArcreactorSpinning.value = true;
        arcreactorSpinEndTime.value = Date.now() + 1000; // Spin for 1 second
      }
    } else {
      console.warn(`⚠️ Could not find material for target:  to apply flash.`);
    }
  };

  const stopWaveAnimation = () => {
    if (currentWaveAction.value) {
      console.log('💃 Stopping current wave animation smoothly');
      currentWaveAction.value.fadeOut(0.5);
      currentWaveAction.value = null;
    }
  };

  // Play power-up animation when hit by coin
  const playPowerUpAnimation = async () => {
    if (!sceneRefs.mixer || !sceneRefs.model) {
      console.warn('💥 Cannot play power-up animation - mixer or model not ready')
      return
    }

    try {
      console.log('💥 Loading PowerUp animation...')
      const loader = new FBXLoader()
      const powerUpFBX = await loader.loadAsync('/bot1/PowerUp.fbx')
      
      if (powerUpFBX.animations && powerUpFBX.animations.length > 0) {
        const clip = powerUpFBX.animations[0]
        console.log(`💥 Loaded PowerUp animation clip: ${clip.name}`)

        // Store current animation state before PowerUp
        const previousAnimationIndex = animationState.currentIndex
        const previousAction = sceneRefs.actions && sceneRefs.actions[previousAnimationIndex] ? sceneRefs.actions[previousAnimationIndex] : null
        console.log(`💥 Storing previous animation index: ${previousAnimationIndex}`)

        // Fade out current animation
        if (previousAction) {
          console.log(`💥 Fading out current animation for PowerUp`)
          previousAction.fadeOut(0.2)
        }

        const powerUpAction = sceneRefs.mixer.clipAction(clip)
        powerUpAction.setLoop(THREE.LoopOnce, 1)
        powerUpAction.clampWhenFinished = true
        powerUpAction.timeScale = 3.0 // Play at 3x speed
        powerUpAction.reset().fadeIn(0.2).play()
        
        console.log('💥 PowerUp animation started at 3x speed')

        // Return to previous animation after 1 second
        setTimeout(() => {
          console.log('💥 PowerUp timeout reached, returning to previous animation')
          powerUpAction.fadeOut(0.2)

          // Return to previous animation state
          if (previousAction) {
            animationState.currentIndex = previousAnimationIndex
            previousAction.reset().fadeIn(0.2).play()
            console.log(`💥 PowerUp finished, returned to previous animation index: ${previousAnimationIndex}`)
          } else if (sceneRefs.actions && sceneRefs.actions[0]) {
            // Fallback to idle if previous action not available
            animationState.currentIndex = 0
            sceneRefs.actions[0].reset().fadeIn(0.2).play()
            console.log('💥 PowerUp finished, fallback to idle animation')
          }
        }, 1000) // 1 second timeout
      }
    } catch (error) {
      console.error('💥 Error loading PowerUp animation:', error)
    }
  }

  const playWaveAnimation = async () => {
    console.log('💃 playWaveAnimation called.'); // New Log

    if (!sceneRefs.model || !sceneRefs.mixer) {
      console.warn('⚠️ Model or mixer not available to play wave animation. sceneRefs.model:', !!sceneRefs.model, 'sceneRefs.mixer:', !!sceneRefs.mixer); // Enhanced Log
      return;
    }
    console.log('💃 Model and mixer seem available.'); // New Log

    try {
      console.log(`💃 Loading animation from path: ${waveAnimationPath}`);
      const loader = new FBXLoader();
      const animationFBX = await loader.loadAsync(waveAnimationPath);
      console.log(`💃 Loaded FBX for wave animation:`, animationFBX); // New Log

      if (animationFBX.animations && animationFBX.animations.length > 0) {
        const clip = animationFBX.animations[0];
        console.log(`💃 Loaded wave animation clip: ${clip.name}`, clip); // Enhanced Log

        if (sceneRefs.actions && sceneRefs.actions[animationState.currentIndex]) {
          console.log(`💃 Fading out current animation: ${sceneRefs.actions[animationState.currentIndex].getClip().name}`); // New Log
          sceneRefs.actions[animationState.currentIndex].fadeOut(0.5);
        } else {
          console.warn('💃 No current animation to fade out or sceneRefs.actions not ready/found at currentIndex:', animationState.currentIndex); // New Log
        }

        const waveAction = sceneRefs.mixer.clipAction(clip);
        console.log(`💃 Created waveAction:`, waveAction); // New Log
        waveAction.setLoop(THREE.LoopRepeat, Infinity);
        waveAction.reset().fadeIn(0.5).play();
        currentWaveAction.value = waveAction;
        console.log(`💃 Wave animation "${clip.name}" should be playing.`); // New Log

        const onWaveAnimationFinished = (event: any) => {
          if (event.action === waveAction) {
            console.log(`💃 Wave animation "${clip.name}" finished event.`); // Enhanced Log
            sceneRefs.mixer!.removeEventListener('finished', onWaveAnimationFinished);
            waveAction.fadeOut(0.5);

            if (sceneRefs.actions && sceneRefs.actions[0]) {
              animationState.currentIndex = 0; // Revert to idle animation
              sceneRefs.actions[0].reset().fadeIn(0.5).play();
              console.log('🎬 Reverted to idle animation.');
            } else {
              console.warn('🎬 Could not revert to idle, sceneRefs.actions[0] not found.'); // New Log
            }
          }
        };
        sceneRefs.mixer.addEventListener('finished', onWaveAnimationFinished);
        console.log(`💃 Event listener for "finished" added for wave animation.`); // New Log

      } else {
        console.warn(`⚠️ No animations found in FBX file: ${waveAnimationPath}`); // Enhanced Log
      }
    } catch (error) {
      console.error(`❌ Error loading or playing wave animation:`, error); // Enhanced Log
    }
  };

  const toggleNewHead = () => {
    if (newHeadModelRef.value) {
      isNewHeadVisible.value = !isNewHeadVisible.value;
      newHeadModelRef.value.visible = isNewHeadVisible.value;
      console.log(`💀 New head visibility set to: ${isNewHeadVisible.value}`);
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