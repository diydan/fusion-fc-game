import { ref, shallowRef, reactive, computed } from 'vue'
import * as THREE from 'three'
import { TextureLoader, Vector3 } from 'three'
import { FBXLoader } from 'three-stdlib'
import type { 
  SceneRefs, 
  LightingSettings, 
  MaterialSettings, 
  SceneSettings, 
  VideoSettings,
  AllSettings 
} from '@/types/scene'

export function useSceneSetup() {
  // Constants
  const POWER_PREFERENCE = 'high-performance' as const
  const BALL_RADIUS = 0.1

  // Loading state
  const loadingStatus = ref('Loading...')
  const isScreenShaking = ref(false)

  // Scene settings
  const sceneOffsetY = ref(0)
  const characterScale = ref(0.02)
  const showGrass = ref(true)
  const showGrassTexture = ref(true)
  const showCenterCircle = ref(true)
  const showFieldLines = ref(true)
  const videoOffsetY = ref(0)
  const videoBlur = ref(0)
  const cameraBlur = ref(0)
  const cameraBloom = ref(0)
  const bloomEnabled = ref(false)
  const cameraFov = ref(42)
  const dofEnabled = ref(true)
  const dofFocus = ref(60) // Focus area size as percentage
  const dofAperture = ref(2) // Shape control (1.0 = circle, higher = oval)
  const dofMaxBlur = ref(1.2) // Blur intensity
  const dofCenterX = ref(50) // Focus center X position (0-100%)
  const dofCenterY = ref(20) // Focus center Y position (0-100%)
  
  // Fog settings
  const fogEnabled = ref(false)
  const fogType = ref('linear') // 'linear' or 'exponential'
  const fogNear = ref(10)
  const fogFar = ref(50)
  const fogDensity = ref(0.01) // For exponential fog
  const fogColor = ref('#87CEEB') // Sky blue default
  const fogOpacity = ref(0.8)

  // Lighting settings
  const lightingSettings = reactive<LightingSettings>({
    keyLightIntensity: 3,      // Increased from 2
    fillLightIntensity: 4,     // Increased from 3
    fillLight2Intensity: 4,    // Increased from 3
    frontLightIntensity: 1.2,  // Increased from 0.8
    rimLightIntensity: 5,      // Increased from 4
    ambientIntensity: 3,       // Increased from 2
    shadowEnabled: true
  })

  // Material settings
  const materialSettings = reactive<MaterialSettings>({
    metalness: 0.6,
    roughness: 0.1,
    emissiveIntensity: 0.06,
    envMapIntensity: 1.2,
    brightness: 1.5,  // Increased from 1 to make robot body brighter
    clearcoat: 0.0,
    clearcoatRoughness: 0.0,
    transparent: true,
    opacity: 1
  })

  // Scene refs
  const sceneRefs = reactive<SceneRefs>({
    scene: null,
    camera: null,
    renderer: null,
    model: null,
    modelGroup: null,
    mixer: null,
    actions: null,
    ballModel: null,
    ballModelGroup: null,
    torus: null,
    pitch: null,
    grassField: null,
    centerCircle: null,
    fieldLines: null,
    goalpost: null,
    cornerFlags: null,
    composer: null,
    outlinePass: null,
    decalTexture: null,
    decalMaterial: null,
    // Additional properties for internal use
    controls: null,
    decals: [],
    innerTorusMesh: null as THREE.Mesh | null,
    torusDefaultScale: null as THREE.Vector3 | null
  } as SceneRefs & { 
    controls: any,
    decals: any[],
    innerTorusMesh: THREE.Mesh | null,
    torusDefaultScale: THREE.Vector3 | null
  })

  // Position tracking
  const cameraPosition = ref<[number, number, number]>([ -1.331, 1.805, 11.576 ])
  const characterPosition = ref<[number, number, number]>([0, -0.21, 0])

  // Function to update camera position from controls
  const updateCameraPosition = (newPosition: [number, number, number]) => {
    cameraPosition.value = newPosition
  }

  // Computed properties
  const isReady = computed(() => 
    loadingStatus.value === 'Ready' &&
    !!sceneRefs.scene &&
    !!sceneRefs.camera &&
    !!sceneRefs.renderer &&
    !!sceneRefs.model
  )

  const allSettings = computed<AllSettings>(() => ({
    lighting: { ...lightingSettings },
    materials: { ...materialSettings },
    scene: {
      sceneOffsetY: sceneOffsetY.value,
      characterScale: characterScale.value,
      showShadowPlane: showGrass.value
    },
    video: {
      offsetY: videoOffsetY.value,
      blur: videoBlur.value
    },
    camera: {
      position: cameraPosition.value
    },
    character: {
      position: characterPosition.value
    },
    ball: {
      position: [0, 0, 0], // Will be updated by ball physics composable
      hidden: false
    }
  }))

  // Scene creation handler
  const onSceneCreated = (event: any) => {
    sceneRefs.scene = event.scene
    sceneRefs.camera = event.camera
    sceneRefs.renderer = event.renderer

    // Start animation loop
    animate()
  }

  // Scene ready handler
  const onSceneReady = (event: any) => {
    loadingStatus.value = 'Ready'

    // Find character in scene
    const character = event.scene.children.find((child: any) => child.name === 'Character')
    if (character) {
      sceneRefs.character = character
      
      // Create default torus after character is loaded
      createTorus()
    } else {
      }
  }

  // Update materials
  const updateMaterials = () => {
    if (!sceneRefs.model) return
    
    let materialCount = 0
    const materialTypes: string[] = []
    
    sceneRefs.model.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const material = child.material as THREE.MeshStandardMaterial
        if (material.isMeshStandardMaterial) {
          // Log material properties before update
          // Skip overlay material (identified by being transparent and having no metalness/roughness)
          if (material.transparent && material.metalness === 0 && material.roughness === 0) {
            return
          }
          
          materialTypes.push('MeshStandardMaterial')
          
          material.metalness = materialSettings.metalness
          material.roughness = materialSettings.roughness
          material.emissiveIntensity = materialSettings.emissiveIntensity
          material.envMapIntensity = materialSettings.envMapIntensity
          material.transparent = materialSettings.transparent
          material.opacity = materialSettings.opacity
          
          const brightness = materialSettings.brightness
          if (material.map) {
            material.map.colorSpace = THREE.SRGBColorSpace
          }
          material.color.setScalar(brightness)
          
          // Log material properties after update
          materialCount++
        }
      }
    })
    
    }

  // Export settings
  const exportSettings = () => {
    const settings = allSettings.value
    // Export functionality removed
  }

  // Screen shake
  const triggerScreenShake = (duration: number = 500) => {
    if (isScreenShaking.value) return
    
    isScreenShaking.value = true
    setTimeout(() => {
      isScreenShaking.value = false
    }, duration)
  }

  // Load Pitch.FBX model with Saha.png texture
  const loadPitchModel = async () => {
    try {
      // Load texture first
      const textureLoader = new TextureLoader()
      const pitchTexture = await new Promise<THREE.Texture>((resolve, reject) => {
        textureLoader.load(
          '/props/Pitch/Textures/Saha.png',
          (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace

            resolve(texture)
          },
          undefined,
          reject
        )
      })
      
      const loader = new FBXLoader()
      const pitchModel = await loader.loadAsync('/props/Pitch/Source/Saha.fbx')
      
      // PITCH SETTINGS - Easy to adjust
      const PITCH_SCALE = 0.3         // Scale: 4x bigger (0.4 = 40% of original, 2x from previous 0.2)
      const PITCH_POSITION_X = 0       // X Position: Aligned to 0
      const PITCH_POSITION_Y = -15       // Y Position: Aligned to 0
      const PITCH_POSITION_Z = -20       // Z Position: Aligned to 0
      const PITCH_ROTATION_X = 0       // X Rotation: Pitch up/down (radians)
      const PITCH_ROTATION_Y = Math.PI / 2  // Y Rotation: 90 degrees (π/2 radians)
      const PITCH_ROTATION_Z = 0       // Z Rotation: Roll (radians)
      
      // Apply settings
      pitchModel.scale.setScalar(PITCH_SCALE)
      pitchModel.position.set(PITCH_POSITION_X, PITCH_POSITION_Y, PITCH_POSITION_Z)
      pitchModel.rotation.set(PITCH_ROTATION_X, PITCH_ROTATION_Y, PITCH_ROTATION_Z)
      
      // Apply texture and enable shadows
      pitchModel.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          // Apply the Saha.png texture
          if (child.material) {
            const material = new THREE.MeshStandardMaterial({
              map: pitchTexture,
              normalMap: child.material.normalMap || null,
              roughness: 0.8,
              metalness: 0.1
            })
            child.material = material
            }
          
          child.castShadow = true
          child.receiveShadow = true
        }
      })
      
      // Add to scene
      if (sceneRefs.scene) {
        sceneRefs.scene.add(pitchModel)
        sceneRefs.pitch = pitchModel
        }
      
    } catch (error) {
      }
  }

  // Load Goalpost.FBX models (both ends of the field)
  const loadGoalpostModel = async () => {
    try {
      const loader = new FBXLoader()
      
      // GOALPOST SETTINGS - Easy to adjust
      const GOALPOST_SCALE = 0.02         // Scale: Small size for football field
      const GOALPOST_POSITION_X = 0        // X Position: Center of field
      const GOALPOST_POSITION_Y = 1        // Y Position: Ground level
      const GOALPOST_POSITION_Z_1 = -19.5    // Z Position: First goalpost
      const GOALPOST_POSITION_Z_2 = 19.5     // Z Position: Second goalpost (mirror)
      const GOALPOST_ROTATION_X = 0        // X Rotation: No pitch
      const GOALPOST_ROTATION_Y = 0        // Y Rotation: Face forward
      const GOALPOST_ROTATION_Z = 0        // Z Rotation: No roll
      
      // Create a group to hold both goalposts
      const goalpostGroup = new THREE.Group()
      
      // Load first goalpost
      const goalpostModel1 = await loader.loadAsync('/props/Goalpost.fbx')
      goalpostModel1.scale.setScalar(GOALPOST_SCALE)
      goalpostModel1.position.set(GOALPOST_POSITION_X, GOALPOST_POSITION_Y, GOALPOST_POSITION_Z_1)
      goalpostModel1.rotation.set(GOALPOST_ROTATION_X, GOALPOST_ROTATION_Y, GOALPOST_ROTATION_Z)
      
      // Enable shadows for first goalpost
      goalpostModel1.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true
          child.receiveShadow = true
        }
      })
      
      // Load second goalpost (mirror position)
      const goalpostModel2 = await loader.loadAsync('/props/Goalpost.fbx')
      goalpostModel2.scale.setScalar(GOALPOST_SCALE)
      goalpostModel2.position.set(GOALPOST_POSITION_X, GOALPOST_POSITION_Y, GOALPOST_POSITION_Z_2)
      goalpostModel2.rotation.set(GOALPOST_ROTATION_X, GOALPOST_ROTATION_Y + Math.PI, GOALPOST_ROTATION_Z) // Rotate 180 degrees
      
      // Enable shadows for second goalpost
      goalpostModel2.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true
          child.receiveShadow = true
        }
      })
      
      // Add both goalposts to the group
      goalpostGroup.add(goalpostModel1)
      goalpostGroup.add(goalpostModel2)
      
      // Add group to scene
      if (sceneRefs.scene) {
        sceneRefs.scene.add(goalpostGroup)
        sceneRefs.goalpost = goalpostGroup
        }
      
    } catch (error) {
      }
  }

  // Load Corner Flag.FBX models (4 corners of the field)
  const loadCornerFlags = async () => {
    try {
      const loader = new FBXLoader()
      
      // CORNER FLAG SETTINGS - Easy to adjust
      const FLAG_SCALE = 0.1              // Scale: Larger size for visibility
      const FLAG_POSITION_Y = 0             // Y Position: Above ground level
      const FIELD_WIDTH = 15                // Half width of the field (smaller to stay visible)
      const FIELD_LENGTH = 20               // Half length of the field (smaller to stay visible)
      const FLAG_ROTATION_X = 0             // X Rotation: No pitch
      const FLAG_ROTATION_Y = 0             // Y Rotation: Face forward
      const FLAG_ROTATION_Z = 0             // Z Rotation: No roll
      
      // Corner positions for a football field
      const cornerPositions = [
        { x: -FIELD_WIDTH+0.3, z: -FIELD_LENGTH }, // Top-left corner
        { x: FIELD_WIDTH+0.1, z: -FIELD_LENGTH },  // Top-right corner
        { x: -FIELD_WIDTH+0.3, z: FIELD_LENGTH },  // Bottom-left corner
        { x: FIELD_WIDTH+0.1, z: FIELD_LENGTH }    // Bottom-right corner
      ]
      
      // Create a group to hold all corner flags
      const cornerFlagsGroup = new THREE.Group()
      
      // Load and position each corner flag
      for (let i = 0; i < cornerPositions.length; i++) {
        const position = cornerPositions[i]
        
        const flagModel = await loader.loadAsync('/props/Flag.fbx')
        // Apply settings
        flagModel.scale.setScalar(FLAG_SCALE)
        flagModel.position.set(position.x, FLAG_POSITION_Y, position.z)
        flagModel.rotation.set(FLAG_ROTATION_X, FLAG_ROTATION_Y, FLAG_ROTATION_Z)
        
        // Enable shadows and log mesh info
        let meshCount = 0
        flagModel.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true
            child.receiveShadow = true
            meshCount++
          }
        })
        
        // Add to the group
        cornerFlagsGroup.add(flagModel)
      }
      
      // Add group to scene
      if (sceneRefs.scene) {
        sceneRefs.scene.add(cornerFlagsGroup)
        sceneRefs.cornerFlags = cornerFlagsGroup
        }
      
    } catch (error) {
      }
  }

  // Add torus settings state
  const torusSettings = ref({
    radius: 3.5,
    tube: 0.5,
    position: { x: 0, y: 5.5, z: 9.8 },
    rotation: { x: -3.5, y: 3, z: 0 }, // Converted from radians to degrees
    brightness: 0.5, // Increased initial brightness for noticeable glow
    color: 0x00FF00,
    emissionColor:0x00FF00
  })

  // Add torus to character
  const addTorusToCharacter = () => {
    if (!sceneRefs.model) {
      return
    }

    // Remove existing torus if any
    if (sceneRefs.torus) {
      // Remove from parent
      if (sceneRefs.torus.parent) {
        sceneRefs.torus.parent.remove(sceneRefs.torus)
      }
      // Dispose of geometries and materials
      sceneRefs.torus.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry) child.geometry.dispose()
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(material => material.dispose())
            } else {
              child.material.dispose()
            }
          }
        }
      })
      sceneRefs.torus = null;
      if (sceneRefs.innerTorusMesh) {
        // Inner torus mesh is a direct child of the torus group, its geometry/material are handled by the group's traverse
        // We just need to nullify the reference if we stored it separately and it wasn't part of the group's direct children for some reason
        // However, standard practice is it would be part of the group, so the group traversal should handle it.
        // For safety, if we directly manipulated innerTorusMesh's geometry/material outside group, dispose here.
        // Assuming innerTorusMesh is part of sceneRefs.torus (the group), its resources are disposed above.
        sceneRefs.innerTorusMesh = null; 
        }
    }

    // Find the spine2 bone
    let spine1Bone: THREE.Bone | null = null
    sceneRefs.model.traverse((child) => {
      if (child instanceof THREE.Bone) {
        if (child.name.toLowerCase().includes('spine1')) {
          spine1Bone = child
          }
      }
    })

    if (!spine1Bone) {
      return
    }

    // Create torus with current settings
    const torusGeometry = new THREE.TorusGeometry(
      torusSettings.value.radius,
      torusSettings.value.tube,
      30,
      55
    )
    const torusMaterial = new THREE.MeshStandardMaterial({
      color: 0x00FF00,
      emissive: new THREE.Color(0x00FF00),
      emissiveIntensity: torusSettings.value.brightness,
      transparent: true,
      opacity: 0.9,
      metalness: 0.0,
      roughness: 0.5
    })
    
    const torus = new THREE.Mesh(torusGeometry, torusMaterial)
    
    // Create a group to hold the torus
    const torusGroup = new THREE.Group()
    torusGroup.add(torus)
    
    // Set position from current settings
    torusGroup.position.set(
      torusSettings.value.position.x,
      torusSettings.value.position.y,
      torusSettings.value.position.z
    )
    
    // Set rotation from current settings
    torusGroup.rotation.set(
      torusSettings.value.rotation.x * (Math.PI / 180),
      torusSettings.value.rotation.y * (Math.PI / 180),
      torusSettings.value.rotation.z * (Math.PI / 180)
    )
    
    // Add debug helpers
    const axesHelper = new THREE.AxesHelper(0)
    torusGroup.add(axesHelper);

    // Create Inner Torus
    const mainTorusInitialColor = new THREE.Color(0x00FF00); // Matching main torus initial color
    const innerTorusRadius = torusSettings.value.radius * 0.5; // Made smaller: 50% of main radius
    const innerTorusTube = torusSettings.value.tube * 0.5;   // Made smaller: 50% of main tube
    const innerTorusGeometry = new THREE.TorusGeometry(innerTorusRadius, innerTorusTube, 20, 40);
    const innerTorusMaterial = new THREE.MeshStandardMaterial({
      color: mainTorusInitialColor.clone(),
      emissive: mainTorusInitialColor.clone(),
      emissiveIntensity: 0.5 , // Match main torus brightness
      transparent: true,
      opacity: 1, // Match main torus opacity
      metalness: 0.0,
      roughness: 0.4
    });
    const innerTorusMesh = new THREE.Mesh(innerTorusGeometry, innerTorusMaterial);
    innerTorusMesh.position.z = torusSettings.value.tube * 0.5; // Optional: slight offset for visibility
    torusGroup.add(innerTorusMesh);
    sceneRefs.innerTorusMesh = innerTorusMesh;
    // Ensure the previously added inner torus creation logic is removed if it was separate
    // This replaces the block that was previously inserted using this same old_str anchor.

    // Add a point light to help visualize the torus
    const pointLight = new THREE.PointLight(torusSettings.value.color, torusSettings.value.brightness, 20)
    pointLight.position.set(0, 0, 0)
    torusGroup.add(pointLight)

    // Store the default scale of the main torus mesh
    const mainTorusMeshForScale = torusGroup.children[0] as THREE.Mesh;

    // Store default emissive properties for the main torus mesh
    if (mainTorusMeshForScale && mainTorusMeshForScale.isMesh && mainTorusMeshForScale.material instanceof THREE.MeshStandardMaterial) {
      const mat = mainTorusMeshForScale.material as THREE.MeshStandardMaterial;
      mainTorusMeshForScale.userData.defaultEmissive = mat.emissive.clone();
      mainTorusMeshForScale.userData.defaultEmissiveIntensity = mat.emissiveIntensity;
    }

    if (mainTorusMeshForScale && mainTorusMeshForScale.isMesh) {
      sceneRefs.torusDefaultScale = mainTorusMeshForScale.scale.clone();
    }

    // Add the torus group as a child of the spine2 bone
    spine1Bone.add(torusGroup)
    sceneRefs.torus = torusGroup

    // Log the torus's world position
    const worldPos = new THREE.Vector3()
    torusGroup.getWorldPosition(worldPos)
    }

  // Update torus
  const updateTorus = (settings: {
    position: { x: number; y: number; z: number }
    rotation: { x: number; y: number; z: number }
    radius: number
    tube: number
    color: { r: number; g: number; b: number }
    emissionColor: { r: number; g: number; b: number }
    brightness: number
  }) => {
    if (!sceneRefs.torus) {
      return
    }

    try {
      // Find the torus mesh in the group (first child should be the torus mesh)
      const torusMesh = sceneRefs.torus.children[0] as THREE.Mesh
      if (!torusMesh || !(torusMesh instanceof THREE.Mesh)) {
        return
      }

      // Update geometry
      const newGeometry = new THREE.TorusGeometry(
        settings.radius * 5,
        settings.tube * 5,
        32,
        100
      )
      torusMesh.geometry.dispose()
      torusMesh.geometry = newGeometry;

      // Update Inner Torus Geometry
      if (sceneRefs.innerTorusMesh) {
        const mainTorusNewParams = newGeometry.parameters;
        const innerTorusNewRadius = mainTorusNewParams.radius * 0.5; // Consistent 50% ratio
        const innerTorusNewTube = mainTorusNewParams.tube * 0.5;   // Consistent 50% ratio
        const newInnerTorusGeometry = new THREE.TorusGeometry(innerTorusNewRadius, innerTorusNewTube, 20, 40);
        sceneRefs.innerTorusMesh.geometry.dispose();
        sceneRefs.innerTorusMesh.geometry = newInnerTorusGeometry;
        }

      // Update position
      sceneRefs.torus.position.set(
        settings.position.x,
        settings.position.y,
        settings.position.z
      )

      // Update rotation (convert degrees to radians)
      sceneRefs.torus.rotation.set(
        settings.rotation.x,
        settings.rotation.y,
        settings.rotation.z
      )

      // Create THREE.Color objects with safety checks
      const baseColor = settings.color && typeof settings.color.r !== 'undefined' 
        ? new THREE.Color(settings.color.r, settings.color.g, settings.color.b)
        : new THREE.Color(0x57d5ff) // Default cyan color
      
      const emissionColor = settings.emissionColor && typeof settings.emissionColor.r !== 'undefined'
        ? new THREE.Color(settings.emissionColor.r, settings.emissionColor.g, settings.emissionColor.b)
        : new THREE.Color(0x57d5ff) // Default cyan color

      // Update material
      const material = torusMesh.material as THREE.MeshStandardMaterial
      if (material) {
        // Update base color
        material.color = baseColor
        // Update emission color and intensity
        material.emissive = emissionColor
        material.emissiveIntensity = settings.brightness * 2;
      }

      // Update Inner Torus Material
      if (sceneRefs.innerTorusMesh) {
        const innerMaterial = sceneRefs.innerTorusMesh.material as THREE.MeshStandardMaterial;
        if (innerMaterial) {
          innerMaterial.color = baseColor; // Use the same baseColor as main torus
          innerMaterial.emissive = emissionColor; // Use the same emissionColor
          innerMaterial.emissiveIntensity = 0.2; // Match brightness
          innerMaterial.opacity = 1;
          }
      }

      // Update point light if it exists
      const pointLight = sceneRefs.torus.children[2] as THREE.PointLight
      if (pointLight instanceof THREE.PointLight) {
        pointLight.color = emissionColor
        pointLight.intensity = settings.brightness * 2
      }
    } catch (error) {
      }
  }

  // Update torus color
  const updateTorusColor = (newColor: THREE.Color) => {
    if (!sceneRefs.torus) {
      return;
    }

    // Update Main Torus
    const mainTorusMesh = sceneRefs.torus.children[0] as THREE.Mesh;
    if (mainTorusMesh && mainTorusMesh.material && mainTorusMesh.material instanceof THREE.MeshStandardMaterial) {
      const mainMaterial = mainTorusMesh.material as THREE.MeshStandardMaterial;
      mainMaterial.color.copy(newColor);
      mainMaterial.emissive.copy(newColor);
      // Emissive intensity is preserved from its current state (e.g., initial 0.7)
      mainMaterial.needsUpdate = true;
    } else {
      // Main material not found
    }

    // Update Inner Torus
    if (sceneRefs.innerTorusMesh && sceneRefs.innerTorusMesh.material && sceneRefs.innerTorusMesh.material instanceof THREE.MeshStandardMaterial) {
      const innerMaterial = sceneRefs.innerTorusMesh.material as THREE.MeshStandardMaterial;
      innerMaterial.color.copy(newColor);
      innerMaterial.emissive.copy(newColor);
      innerMaterial.emissiveIntensity = 0.2;
      // Emissive intensity is preserved from its current state (e.g., initial 0.7)
      innerMaterial.needsUpdate = true;
    }

    // Update point light color on the main torus group
    const pointLight = sceneRefs.torus.children.find(child => child instanceof THREE.PointLight) as THREE.PointLight | undefined;
    if (pointLight) {
      pointLight.color.copy(newColor);
      // pointLight.intensity could also be preserved or adjusted if needed (e.g., match material.emissiveIntensity)
    }
  }

  // Animation state
  const isAnimationPaused = ref(false)
  const isCharacterAnimationPaused = ref(false)

  // Animation loop
  const animate = () => {
    if (!sceneRefs.scene || !sceneRefs.camera || !sceneRefs.renderer) return

    // Update camera position for smooth follow
    if (sceneRefs.camera && sceneRefs.character) {
      const targetPosition = new THREE.Vector3()
      sceneRefs.character.getWorldPosition(targetPosition)
      targetPosition.y += 2 // Adjust height offset
      targetPosition.z += 5 // Adjust distance

      sceneRefs.camera.position.lerp(targetPosition, 0.05)
      sceneRefs.camera.lookAt(sceneRefs.character.position)
    }

    // Only animate if not paused
    if (!isAnimationPaused.value) {
      // Animate torus
      if (sceneRefs.torus) {
        sceneRefs.torus.rotation.y += 0.01
        sceneRefs.torus.rotation.x += 0.005
      }

      // Animate character if not paused
      if (sceneRefs.character && !isCharacterAnimationPaused.value) {
        sceneRefs.character.rotation.y += 0.01
      }
    }

    // Render scene
    sceneRefs.renderer.render(sceneRefs.scene, sceneRefs.camera)
    requestAnimationFrame(animate)
  }

  // Toggle animation
  const toggleAnimation = () => {
    isAnimationPaused.value = !isAnimationPaused.value
    }

  // Toggle character animation
  const toggleCharacterAnimation = () => {
    isCharacterAnimationPaused.value = !isCharacterAnimationPaused.value
    }

  // Toggle grass texture visibility
  const toggleGrassTexture = (visible: boolean) => {
    showGrassTexture.value = visible
    if (sceneRefs.grassField) {
      sceneRefs.grassField.visible = visible
      }
  }

  // Toggle center circle visibility
  const toggleCenterCircle = (visible: boolean) => {
    showCenterCircle.value = visible
    if (sceneRefs.centerCircle) {
      sceneRefs.centerCircle.visible = visible
      }
  }

  // Toggle all field lines visibility
  const toggleFieldLines = (visible: boolean) => {
    showFieldLines.value = visible
    if (sceneRefs.fieldLines) {
      sceneRefs.fieldLines.visible = visible
      }
  }

  // Create grass field with PBR texture
  const createGrassField = async () => {
    if (!sceneRefs.scene) return

    try {
      const textureLoader = new TextureLoader()
      
      // Load PBR texture maps (using correct filenames)
      const grassDiffuse = await new Promise<THREE.Texture>((resolve, reject) => {
        textureLoader.load('/textures/grass1-bl/grass1-albedo3.png', resolve, undefined, reject)
      })
      
      const grassNormal = await new Promise<THREE.Texture>((resolve, reject) => {
        textureLoader.load('/textures/grass1-bl/grass1-normal1-ogl.png', resolve, undefined, reject)
      })
      
      const grassRoughness = await new Promise<THREE.Texture>((resolve, reject) => {
        textureLoader.load('/textures/grass1-bl/grass1-rough.png', resolve, undefined, reject)
      })
      
      const grassAO = await new Promise<THREE.Texture>((resolve, reject) => {
        textureLoader.load('/textures/grass1-bl/grass1-ao.png', resolve, undefined, reject)
      })
      
      // Configure texture settings for tiling
      const configureTexture = (texture: THREE.Texture, repeatX: number = 8, repeatY: number = 8) => {
        texture.wrapS = THREE.RepeatWrapping
        texture.wrapT = THREE.RepeatWrapping
        texture.repeat.set(repeatX, repeatY)
        texture.colorSpace = THREE.SRGBColorSpace

        texture.center.set(0,0.582)
        return texture
      }
      
      // Configure all textures
      configureTexture(grassDiffuse,  10, 10)
      configureTexture(grassNormal,  10, 10)
      configureTexture(grassRoughness,  10, 10)
      configureTexture(grassAO, 10, 10)
      
      // Create grass material
      const grassMaterial = new THREE.MeshStandardMaterial({
        map: grassDiffuse,
        normalMap: grassNormal,
        roughnessMap: grassRoughness,
        aoMap: grassAO,
        aoMapIntensity: 0.8,
        roughness: 0.9,
        metalness: 0.0,
        color: 0x8bbe1b // Slightly green tint for natural look
      })
      
      // Create large grass field plane
      const fieldGeometry = new THREE.PlaneGeometry(40, 50) // Larger than current field
      const grassField = new THREE.Mesh(fieldGeometry, grassMaterial)
      grassField.rotation.x = -Math.PI / 2
      grassField.position.set(0, -0.005, 0) // Slightly below the lines
      grassField.receiveShadow = true
      grassField.name = 'GrassField'
      sceneRefs.scene.add(grassField)
      sceneRefs.grassField = grassField
      return grassField
      
    } catch (error) {
      // Create fallback material
      const fallbackMaterial = new THREE.MeshStandardMaterial({
        color: 0x4a7c4e,
        roughness: 0.9,
        metalness: 0.0
      })
      
      // Create fallback field geometry
      const fieldGeometry = new THREE.PlaneGeometry(40, 50)
      const grassField = new THREE.Mesh(fieldGeometry, fallbackMaterial)
      grassField.rotation.x = -Math.PI / 2
      grassField.position.set(0, -0.005, 0)
      grassField.receiveShadow = true
      
      grassField.name = 'GrassField'
      
      sceneRefs.scene.add(grassField)
      sceneRefs.grassField = grassField
      return grassField
    }
  }

  // Create center circle (outer ring only - center spot stays with main field)
  const createCenterCircle = () => {
    if (!sceneRefs.scene) return

    const centerGroup = new THREE.Group()
    centerGroup.name = 'CenterCircle'
    
    // Line material (same as field lines)
    const lineMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.5,
      roughness: 0.4,
      emissive: 0xffffff,
      emissiveIntensity: 2,
      transparent: true,
      opacity: 0.9
    })
    
    // Center circle (outer ring only)
    const centerCircleRadius = 4
    const lineWidth = 0.1
    const centerCircleGeometry = new THREE.RingGeometry(centerCircleRadius - lineWidth/2, centerCircleRadius + lineWidth/2, 32)
    const centerCircle = new THREE.Mesh(centerCircleGeometry, lineMaterial)
    centerCircle.rotation.x = -Math.PI / 2
    centerCircle.position.set(0, 0.001, 0)
    centerCircle.receiveShadow = true
    centerGroup.add(centerCircle)
    
    // Add to scene and store reference
    sceneRefs.scene.add(centerGroup)
    sceneRefs.centerCircle = centerGroup
    // Center circle created and added to scene
    
    return centerGroup
  }

  // Create football field lines
  const createFootballFieldLines = () => {
    if (!sceneRefs.scene) return

    const fieldGroup = new THREE.Group()
    fieldGroup.name = 'FootballField'
    
    // Field dimensions (scaled for the scene)
    const fieldWidth = 30
    const fieldLength = 40
    const lineWidth = 0.1
    const lineHeight = 0.01
    
    // White line material with 0.6 opacity
    const lineMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.5,
      roughness: 0.4,
      emissive: 0xffffff,
      emissiveIntensity: 2,
      transparent: true,
      opacity: 0.9
    })
    
    // Helper function to create a line
    const createLine = (width: number, length: number, x: number, z: number, rotationY: number = 0) => {
      const geometry = new THREE.BoxGeometry(width, lineHeight, length)
      const line = new THREE.Mesh(geometry, lineMaterial)
      line.position.set(x, 0.001, z) // Slightly above ground to prevent z-fighting
      line.rotation.y = rotationY
      line.receiveShadow = true
      return line
    }
    
    // Outer boundary lines
    // Top and bottom touchlines
    fieldGroup.add(createLine(fieldWidth, lineWidth, 0, fieldLength / 2))
    fieldGroup.add(createLine(fieldWidth, lineWidth, 0, -fieldLength / 2))
    
    // Left and right goal lines
    fieldGroup.add(createLine(lineWidth, fieldLength, -fieldWidth / 2, 0))
    fieldGroup.add(createLine(lineWidth, fieldLength, fieldWidth / 2, 0))
    
    // Center line
    fieldGroup.add(createLine(fieldWidth, lineWidth, 0, 0))
    
    // Center spot (always visible)
    const centerSpotGeometry = new THREE.CircleGeometry(0.3, 16)
    const centerSpot = new THREE.Mesh(centerSpotGeometry, lineMaterial)
    centerSpot.rotation.x = -Math.PI / 2
    centerSpot.position.set(0, 0.001, 0)
    centerSpot.receiveShadow = true
    fieldGroup.add(centerSpot)
    
    // Penalty areas (18-yard box)
    const penaltyWidth = 16
    const penaltyLength = 6
    
    // Top penalty area
    fieldGroup.add(createLine(penaltyWidth, lineWidth, 0, fieldLength / 2 - penaltyLength))
    fieldGroup.add(createLine(lineWidth, penaltyLength, -penaltyWidth / 2, fieldLength / 2 - penaltyLength / 2))
    fieldGroup.add(createLine(lineWidth, penaltyLength, penaltyWidth / 2, fieldLength / 2 - penaltyLength / 2))
    
    // Bottom penalty area
    fieldGroup.add(createLine(penaltyWidth, lineWidth, 0, -fieldLength / 2 + penaltyLength))
    fieldGroup.add(createLine(lineWidth, penaltyLength, -penaltyWidth / 2, -fieldLength / 2 + penaltyLength / 2))
    fieldGroup.add(createLine(lineWidth, penaltyLength, penaltyWidth / 2, -fieldLength / 2 + penaltyLength / 2))
    
    // Goal areas (6-yard box)
    const goalWidth = 8
    const goalLength = 2.5
    
    // Top goal area
    fieldGroup.add(createLine(goalWidth, lineWidth, 0, fieldLength / 2 - goalLength))
    fieldGroup.add(createLine(lineWidth, goalLength, -goalWidth / 2, fieldLength / 2 - goalLength / 2))
    fieldGroup.add(createLine(lineWidth, goalLength, goalWidth / 2, fieldLength / 2 - goalLength / 2))
    
    // Bottom goal area
    fieldGroup.add(createLine(goalWidth, lineWidth, 0, -fieldLength / 2 + goalLength))
    fieldGroup.add(createLine(lineWidth, goalLength, -goalWidth / 2, -fieldLength / 2 + goalLength / 2))
    fieldGroup.add(createLine(lineWidth, goalLength, goalWidth / 2, -fieldLength / 2 + goalLength / 2))
    
    // Penalty spots
    const penaltySpotGeometry = new THREE.CircleGeometry(0.3, 16)
    
    // Top penalty spot
    const topPenaltySpot = new THREE.Mesh(penaltySpotGeometry, lineMaterial)
    topPenaltySpot.rotation.x = -Math.PI / 2
    topPenaltySpot.position.set(0, 0.001, fieldLength / 2 - 4.5)
    topPenaltySpot.receiveShadow = true
    fieldGroup.add(topPenaltySpot)
    
    // Bottom penalty spot
    const bottomPenaltySpot = new THREE.Mesh(penaltySpotGeometry, lineMaterial)
    bottomPenaltySpot.rotation.x = -Math.PI / 2
    bottomPenaltySpot.position.set(0, 0.001, -fieldLength / 2 + 4.5)
    bottomPenaltySpot.receiveShadow = true
    fieldGroup.add(bottomPenaltySpot)
    
    // Corner arcs
    const cornerRadius = 1
    const cornerArcGeometry = new THREE.RingGeometry(cornerRadius - lineWidth/2, cornerRadius + lineWidth/2, 16, 1, 0, Math.PI / 2)
    
    // Four corner arcs
    const corners = [
      { x: fieldWidth / 2 - cornerRadius, z: fieldLength / 2 - cornerRadius, rotation: 0 },
      { x: -fieldWidth / 2 + cornerRadius, z: fieldLength / 2 - cornerRadius, rotation: Math.PI / 2 },
      { x: -fieldWidth / 2 + cornerRadius, z: -fieldLength / 2 + cornerRadius, rotation: Math.PI },
      { x: fieldWidth / 2 - cornerRadius, z: -fieldLength / 2 + cornerRadius, rotation: 3 * Math.PI / 2 }
    ]
    
    corners.forEach(corner => {
      const cornerArc = new THREE.Mesh(cornerArcGeometry, lineMaterial)
      cornerArc.rotation.x = -Math.PI / 2
      cornerArc.rotation.z = corner.rotation
      cornerArc.position.set(corner.x, 0.001, corner.z)
      cornerArc.receiveShadow = true
      fieldGroup.add(cornerArc)
    })
    
    // Add field to scene and store reference
    sceneRefs.scene.add(fieldGroup)
    sceneRefs.fieldLines = fieldGroup
    return fieldGroup
  }

  // Create torus
  const createTorus = () => {
    try {
      // Create torus group
      const torusGroup = new THREE.Group()

      // Create torus geometry with default values
      const geometry = new THREE.TorusGeometry(2.5, 0.5, 32, 100)
      const material = new THREE.MeshStandardMaterial({
        color: 0x57d5ff,
        emissive: 0x57d5ff,
        emissiveIntensity: 2,
        metalness: 0.8,
        roughness: 0.2
      })

      // Create torus mesh
      const torus = new THREE.Mesh(geometry, material)
      torusGroup.add(torus)

      // Set default position and rotation
      torusGroup.position.set(0.4, -1.7, 9.6)
      torusGroup.rotation.set(0.10471975511965978, 3.141592653589793, -1.7453292519943295)

      // Add point light
      const pointLight = new THREE.PointLight(0x57d5ff, 0.2, 10)
      pointLight.position.set(0, 0, 0)
      torusGroup.add(pointLight)

      // Add ambient light
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
      torusGroup.add(ambientLight)

      // Add torus to character if available
      if (sceneRefs.character) {
        sceneRefs.character.add(torusGroup)
        } else {
        sceneRefs.scene?.add(torusGroup)
        }

      sceneRefs.torus = torusGroup

      } catch (error) {
      }
  }

  return {
    // Constants
    POWER_PREFERENCE,
    BALL_RADIUS,
    
    // State
    loadingStatus,
    isScreenShaking,
    isReady,
    isAnimationPaused,
    isCharacterAnimationPaused,
    
    // Settings
    sceneOffsetY,
    characterScale,
    showGrass,
    showGrassTexture,
    showCenterCircle,
    showFieldLines,
    videoOffsetY,
    videoBlur,
    cameraBlur,
    cameraBloom,
    bloomEnabled,
    cameraFov,
    dofEnabled,
    dofFocus,
    dofAperture,
    dofMaxBlur,
    dofCenterX,
    dofCenterY,
    fogEnabled,
    fogType,
    fogNear,
    fogFar,
    fogDensity,
    fogColor,
    fogOpacity,
    lightingSettings,
    materialSettings,
    allSettings,
    
    // Refs
    sceneRefs,
    cameraPosition,
    characterPosition,
    
    // Methods
    onSceneCreated,
    onSceneReady,
    updateMaterials,
    exportSettings,
    triggerScreenShake,
    addTorusToCharacter,
    updateTorus,
    updateTorusColor,
    toggleAnimation,
    toggleCharacterAnimation,
    toggleGrassTexture,
    toggleCenterCircle,
    toggleFieldLines,
    createTorus,
    createCenterCircle,
    createGrassField,
    createFootballFieldLines,
    loadPitchModel,
    loadGoalpostModel,
    loadCornerFlags,
    updateCameraPosition
  }
}
