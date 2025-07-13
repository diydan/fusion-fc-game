import * as THREE from 'three'

export interface MaterialPair {
  base: THREE.MeshStandardMaterial
  overlay: THREE.MeshStandardMaterial
}

/**
 * Creates a base and overlay material pair for the main character
 * @param baseTexture - The base texture to use for the base material
 * @param overlayTexture - The overlay texture to use for the overlay material
 * @param brightness - Material brightness setting (default: 1)
 * @returns Object containing base and overlay materials
 */
export function createMainCharacterMaterials(
  baseTexture: THREE.Texture,
  overlayTexture: THREE.Texture,
  brightness: number = 1
): MaterialPair {
  // Create base material
  const baseMaterial = new THREE.MeshStandardMaterial({
    map: baseTexture,
    metalness: 0.3,  // Reduced from 0.6 for less metallic look
    roughness: 0.3,  // Increased from 0.1 for softer reflections
    emissive: 0x666666,  // Brighter emissive color
    emissiveIntensity: 0.4,  // Increased from 0.2
    envMapIntensity: 1,
    transparent: true,
    opacity: 1,
    side: THREE.DoubleSide
  })
  baseMaterial.color.setScalar(brightness)

  // Store default emissive values for power-up flash effects
  baseMaterial.userData.defaultEmissive = baseMaterial.emissive.clone()
  baseMaterial.userData.defaultEmissiveIntensity = baseMaterial.emissiveIntensity

  // Create overlay material
  const overlayMaterial = new THREE.MeshStandardMaterial({
    map: overlayTexture,
    metalness: 0,
    roughness: 0.8,
    emissive: 0x44444,
    emissiveIntensity: 0.2,
    envMapIntensity: 0.2,
    transparent: true,
    opacity: 1,
    side: THREE.DoubleSide
  })

  // Set initial color to blue (hue: 218, saturation: 100%, lightness: 50%)
  overlayMaterial.color.setHSL(218/360, 1, 0.5)

  return {
    base: baseMaterial,
    overlay: overlayMaterial
  }
}

/**
 * Creates a layered mesh group from a source mesh using base and overlay materials
 * @param sourceMesh - The source THREE.Mesh to clone and layer
 * @param materials - The material pair containing base and overlay materials
 * @returns A THREE.Group containing the layered meshes
 */
export function createLayeredMeshGroup(
  sourceMesh: THREE.Mesh,
  materials: MaterialPair
): THREE.Group {
  const group = new THREE.Group()

  // Create base mesh
  const baseMesh = sourceMesh.clone()
  baseMesh.material = materials.base
  baseMesh.castShadow = true
  baseMesh.receiveShadow = false

  // Create overlay mesh
  const overlayMesh = sourceMesh.clone()
  overlayMesh.material = materials.overlay
  overlayMesh.castShadow = false
  overlayMesh.receiveShadow = false

  // Add both meshes to the group
  group.add(baseMesh)
  group.add(overlayMesh)

  return group
}

/**
 * Convenience function that creates materials and applies them to a mesh
 * @param sourceMesh - The source THREE.Mesh to apply materials to
 * @param baseTexture - The base texture
 * @param overlayTexture - The overlay texture
 * @param brightness - Material brightness setting (default: 1)
 * @returns Object containing both the materials and the layered group
 */
export function createMainCharacterMeshWithMaterials(
  sourceMesh: THREE.Mesh,
  baseTexture: THREE.Texture,
  overlayTexture: THREE.Texture,
  brightness: number = 1
): { materials: MaterialPair; group: THREE.Group } {
  const materials = createMainCharacterMaterials(baseTexture, overlayTexture, brightness)
  const group = createLayeredMeshGroup(sourceMesh, materials)
  
  return { materials, group }
}
