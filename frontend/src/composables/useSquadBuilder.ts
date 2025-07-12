import { ref, computed, type Ref } from 'vue'
import type { Position, Player } from '@/types/player'

/**
 * Squad Builder Composable
 * 
 * This composable provides a complete drag-and-drop squad building interface
 * with type safety, validation, and visual feedback.
 * 
 * Features:
 * - Strongly typed reactive state with null safety
 * - Position validation based on player roles
 * - Drag and drop handlers with visual feedback
 * - Player swapping and bench management
 * - Real-time squad statistics
 * - Mobile-friendly touch support with touch events
 * 
 * Usage:
 * ```typescript
 * const {
 *   placedPlayers,
 *   availablePlayers,
 *   isComplete,
 *   handleDragStart,
 *   handleDrop,
 *   saveSquad
 * } = useSquadBuilder()
 * ```
 */

// Formation types for 5-a-side football
export type FormationType = '1-2-1-1' | '1-1-2-1' | '1-3-1' | '1-2-2'

// Squad positions that can vary based on formation
export type SquadPosition = 'GK' | 'DEF1' | 'DEF2' | 'DEF3' | 'MID1' | 'MID2' | 'FWD1' | 'FWD2' | 'SUB1'

// Formation configurations
export const FORMATIONS: Record<FormationType, {
  name: string
  description: string
  positions: SquadPosition[]
  layout: Record<SquadPosition, { top: string; left: string; label: string }>
}> = {
  '1-2-1-1': {
    name: '1-2-1-1',
    description: 'Balanced formation',
    positions: ['GK', 'DEF1', 'DEF2', 'MID1', 'FWD1'],
    layout: {
      GK: { top: '32px', left: '50%', label: 'GK' },
      DEF1: { top: '120px', left: '25%', label: 'LB' },
      DEF2: { top: '120px', left: '75%', label: 'RB' },
      MID1: { top: '50%', left: '50%', label: 'MID' },
      FWD1: { top: 'calc(100% - 80px)', left: '50%', label: 'FWD' },
      DEF3: { top: '0', left: '0', label: '' }, // Unused
      MID2: { top: '0', left: '0', label: '' }, // Unused
      FWD2: { top: '0', left: '0', label: '' }  // Unused
    }
  },
  '1-1-2-1': {
    name: '1-1-2-1',
    description: 'Midfield heavy',
    positions: ['GK', 'DEF1', 'MID1', 'MID2', 'FWD1'],
    layout: {
      GK: { top: '32px', left: '50%', label: 'GK' },
      DEF1: { top: '120px', left: '50%', label: 'CB' },
      MID1: { top: '45%', left: '25%', label: 'LM' },
      MID2: { top: '45%', left: '75%', label: 'RM' },
      FWD1: { top: 'calc(100% - 80px)', left: '50%', label: 'FWD' },
      DEF2: { top: '0', left: '0', label: '' }, // Unused
      DEF3: { top: '0', left: '0', label: '' }, // Unused
      FWD2: { top: '0', left: '0', label: '' }  // Unused
    }
  },
  '1-3-1': {
    name: '1-3-1',
    description: 'Defensive formation',
    positions: ['GK', 'DEF1', 'DEF2', 'DEF3', 'FWD1'],
    layout: {
      GK: { top: '32px', left: '50%', label: 'GK' },
      DEF1: { top: '120px', left: '20%', label: 'LB' },
      DEF2: { top: '120px', left: '50%', label: 'CB' },
      DEF3: { top: '120px', left: '80%', label: 'RB' },
      FWD1: { top: 'calc(100% - 80px)', left: '50%', label: 'FWD' },
      MID1: { top: '0', left: '0', label: '' }, // Unused
      MID2: { top: '0', left: '0', label: '' }, // Unused
      FWD2: { top: '0', left: '0', label: '' }  // Unused
    }
  },
  '1-2-2': {
    name: '1-2-2',
    description: 'Attacking formation',
    positions: ['GK', 'DEF1', 'DEF2', 'FWD1', 'FWD2'],
    layout: {
      GK: { top: '32px', left: '50%', label: 'GK' },
      DEF1: { top: '120px', left: '25%', label: 'LB' },
      DEF2: { top: '120px', left: '75%', label: 'RB' },
      FWD1: { top: 'calc(100% - 80px)', left: '30%', label: 'LW' },
      FWD2: { top: 'calc(100% - 80px)', left: '70%', label: 'RW' },
      DEF3: { top: '0', left: '0', label: '' }, // Unused
      MID1: { top: '0', left: '0', label: '' }, // Unused
      MID2: { top: '0', left: '0', label: '' }  // Unused
    }
  }
}

/**
 * Represents a player in the squad builder system
 * Robots have no predefined positions - they get assigned when dropped
 */
export interface SquadPlayer {
  id: number           // Unique player identifier
  name: string         // Player name
  number: number       // Jersey number (1-99) 
  position: string | null // Current assigned position (null until dropped somewhere)
  rating: number       // Player skill rating
  avatar: string       // Player avatar/emoji
  isActive?: boolean   // Whether the player is currently placed on the pitch
}

// Cross-platform interaction state for both touch and mouse
export interface InteractionState {
  isDragging: boolean
  isTouch: boolean
  startPosition: { x: number; y: number } | null
  currentPosition: { x: number; y: number } | null
  selectedPlayer: SquadPlayer | null
  draggedFromPosition: SquadPosition | null
  hoverPosition: SquadPosition | null
  showDragHelper: boolean
  dragOffset: { x: number; y: number }
}

/**
 * Tracks the current drag and drop operation state
 * Used for visual feedback and validation during drag operations
 */
export interface DragState {
  isDragging: boolean                    // Whether a drag operation is in progress
  draggedPlayer: SquadPlayer | null      // The player currently being dragged
  draggedFromPosition: SquadPosition | null  // Original position (if dragging from pitch)
  dragOverPosition: SquadPosition | null     // Position currently being hovered over
  benchDragOver: boolean                     // Whether hovering over the bench area
}

/**
 * Manages validation feedback and warning messages
 * Provides user feedback for invalid operations
 */
export interface ValidationState {
  showWarning: boolean    // Whether to show the warning message
  message: string         // The warning message text
  timeout: number | null  // Timeout ID for auto-hiding warnings
}

/**
 * Complete state interface for the squad builder
 * Defines all reactive state used by the composable
 */
export interface SquadBuilderState {
  // Squad formation state - maps each position to a player or null
  placedPlayers: Ref<Record<SquadPosition, SquadPlayer | null>>
  // Complete player roster available for selection
  players: Ref<SquadPlayer[]>
  // Legacy drag state for backward compatibility
  dragState: Ref<DragState>
  // Unified interaction state for cross-platform support
  interactionState: Ref<InteractionState>
  // Validation and warning state
  validationState: Ref<ValidationState>
  // Track newly placed players for animation effects
  newlyPlacedPlayers: Ref<Set<string>>
}

export function useSquadBuilder() {
  // ===== REACTIVE STATE =====

  /**
   * Current formation - will be managed by the parent component
   */
  const currentFormation = ref<FormationType>('1-2-1-1')

  /**
   * Squad formation state
   * Maps each position to a player or null using a strongly typed Record
   * This ensures type safety and prevents invalid position assignments
   */
  const placedPlayers = ref<Record<SquadPosition, SquadPlayer | null>>({
    GK: null,    // Goalkeeper position
    DEF1: null,  // Left defender position
    DEF2: null,  // Right defender position
    DEF3: null,  // Center defender position
    MID1: null,  // Midfielder position
    MID2: null,  // Second midfielder position
    FWD1: null,  // Forward position
    FWD2: null,  // Second forward position
    SUB1: null   // Substitute position
  })

  /**
   * Complete player roster
   * In a real application, this would typically be fetched from an API
   * Robots have no default positions - they get assigned when dropped
   */
  const players = ref<SquadPlayer[]>([
    { id: 1, name: 'Robo-Keeper', number: 1, position: null, rating: 85, avatar: '🤖', isActive: false },
    { id: 2, name: 'Steel-Guard', number: 2, position: null, rating: 82, avatar: '🤖', isActive: false },
    { id: 3, name: 'Iron-Wall', number: 3, position: null, rating: 79, avatar: '🤖', isActive: false },
    { id: 4, name: 'Cyber-Mid', number: 4, position: null, rating: 88, avatar: '🤖', isActive: false },
    { id: 5, name: 'Turbo-Strike', number: 5, position: null, rating: 90, avatar: '🤖', isActive: false },
    { id: 6, name: 'Nano-Wing', number: 6, position: null, rating: 86, avatar: '🤖', isActive: false },
  ])

  /**
   * Drag and drop operation state
   * Tracks all aspects of the current drag operation for visual feedback
   */
  const dragState = ref<DragState>({
    isDragging: false,           // No drag operation in progress
    draggedPlayer: null,         // No player being dragged
    draggedFromPosition: null,   // No source position
    dragOverPosition: null,      // No target position being hovered
    benchDragOver: false         // Not hovering over bench
  })

  /**
   * Unified interaction state for cross-platform drag and drop
   * Handles both touch and mouse operations with a single interface
   */
  const interactionState = ref<InteractionState>({
    isDragging: false,
    isTouch: false,
    startPosition: null,
    currentPosition: null,
    selectedPlayer: null,
    draggedFromPosition: null,
    hoverPosition: null,
    showDragHelper: false,
    dragOffset: { x: 0, y: 0 }
  })

  /**
   * Validation and user feedback state
   * Manages warning messages for invalid operations
   */
  const validationState = ref<ValidationState>({
    showWarning: false,  // No warning currently displayed
    message: '',         // Empty warning message
    timeout: null        // No active timeout
  })

  /**
   * Tracks newly placed players for animation effects
   * Used to trigger fade-in animations when players are placed
   */
  const newlyPlacedPlayers = ref<Set<string>>(new Set())

  // ===== COMPUTED PROPERTIES =====

  /**
   * Current formation configuration
   */
  const formationConfig = computed(() => FORMATIONS[currentFormation.value])

  /**
   * Active positions for current formation
   */
  const activePositions = computed(() => formationConfig.value.positions)

  /**
   * Total number of players in the roster
   */
  const totalPlayers = computed(() => players.value.length)
  
  /**
   * Number of players currently placed on the pitch (only in active positions)
   */
  const activePlayers = computed(() => {
    return activePositions.value
      .map(pos => placedPlayers.value[pos])
      .filter(Boolean).length
  })
  
  /**
   * Number of players available on the bench
   */
  const substitutes = computed(() => players.value.length - activePlayers.value)
  
  /**
   * Players available for selection (not currently placed on pitch)
   * Dynamically calculated by excluding placed players from the roster
   */
  const availablePlayers = computed(() => {
    const placedPlayerIds = Object.values(placedPlayers.value)
      .filter(Boolean)  // Remove null values
      .map(p => p!.id)  // Extract player IDs
    return players.value.filter(p => !placedPlayerIds.includes(p.id))
  })

  /**
   * Whether the squad is complete (all required positions filled)
   * Used to enable/disable the save button and show completion status
   */
  const isComplete = computed(() => {
    return activePositions.value.every(position => placedPlayers.value[position] !== null)
  })

  // ===== POSITION ASSIGNMENT =====
  
  /**
   * Assigns a position to a player when they are dropped
   * Updates the player's position property to reflect their current role
   * 
   * @param player - The player to assign a position to
   * @param position - The position to assign
   */
  const assignPlayerPosition = (player: SquadPlayer, position: SquadPosition): void => {
    // Update the player's position to reflect where they've been placed
    const playerIndex = players.value.findIndex(p => p.id === player.id)
    if (playerIndex !== -1) {
      players.value[playerIndex].position = position
    }
  }
  
  /**
   * Removes position assignment from a player (when they're removed from pitch)
   * 
   * @param player - The player to clear position from
   */
  const clearPlayerPosition = (player: SquadPlayer): void => {
    const playerIndex = players.value.findIndex(p => p.id === player.id)
    if (playerIndex !== -1) {
      players.value[playerIndex].position = null
    }
  }

  /**
   * Shows user feedback for invalid drop operations
   * Only used for position conflicts (trying to drop on occupied position)
   * 
   * @param message - The warning message to display
   */
  const showDropWarning = (message: string) => {
    validationState.value.message = message
    validationState.value.showWarning = true
    
    // Clear any existing timeout to prevent conflicts
    if (validationState.value.timeout) {
      clearTimeout(validationState.value.timeout)
    }
    
    // Auto-hide warning after 3 seconds for better UX
    validationState.value.timeout = setTimeout(() => {
      validationState.value.showWarning = false
    }, 3000)
  }

  // ===== DRAG AND DROP HANDLERS =====
  
  /**
   * Initiates a drag operation when a player is dragged
   * Sets up the drag state and data transfer for the operation
   * 
   * @param event - The drag start event
   * @param player - The player being dragged
   * @param fromPosition - The position the player is being dragged from (if on pitch)
   */
  const handleDragStart = (event: DragEvent, player: SquadPlayer, fromPosition?: SquadPosition) => {
    // Update drag state to track the current operation
    dragState.value.draggedPlayer = player
    dragState.value.draggedFromPosition = fromPosition || null
    dragState.value.isDragging = true
    
    // Also update interaction state for drag helper visibility
    interactionState.value = {
      isDragging: true,
      isTouch: false,
      startPosition: { x: event.clientX, y: event.clientY },
      currentPosition: { x: event.clientX, y: event.clientY },
      selectedPlayer: player,
      draggedFromPosition: fromPosition || null,
      hoverPosition: null,
      showDragHelper: true,
      dragOffset: { x: -30, y: -40 }
    }
    
    // Set up data transfer for cross-browser compatibility
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'  // Only allow move operations
      
      // Hide the default drag image to use our custom drag helper
      const emptyImage = new Image()
      emptyImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs='
      event.dataTransfer.setDragImage(emptyImage, 0, 0)
      
      // Store drag data as JSON for potential cross-component usage
      event.dataTransfer.setData('application/json', JSON.stringify({
        playerId: player.id,
        playerPosition: player.position,
        fromPosition: fromPosition || null
      }))
    }
  }

  /**
   * Cleans up drag state when a drag operation ends
   * Called regardless of whether the drop was successful
   */
  const handleDragEnd = () => {
    dragState.value.isDragging = false        // Clear dragging flag
    dragState.value.dragOverPosition = null   // Clear hover state
    dragState.value.benchDragOver = false     // Clear bench hover state
    
    // Also clear interaction state
    interactionState.value = {
      isDragging: false,
      isTouch: false,
      startPosition: null,
      currentPosition: null,
      selectedPlayer: null,
      draggedFromPosition: null,
      hoverPosition: null,
      showDragHelper: false,
      dragOffset: { x: 0, y: 0 }
    }
  }

  /**
   * Handles drag over events for drop zones
   * Provides visual feedback and validates potential drops
   * 
   * @param event - The dragover event
   * @param position - The position being hovered over
   */
  const handleDragOver = (event: DragEvent, position: SquadPosition) => {
    event.preventDefault()  // Required to allow dropping
    
    if (!dragState.value.draggedPlayer) return
    
    // All drops are valid since any robot can play any position
    const isEmpty = !placedPlayers.value[position]
    
    // Allow drop if (empty OR we're moving from another position)
    if (isEmpty || dragState.value.draggedFromPosition) {
      event.dataTransfer!.dropEffect = 'move'           // Show move cursor
      dragState.value.dragOverPosition = position       // Highlight the drop zone
    } else {
      event.dataTransfer!.dropEffect = 'none'           // Show invalid cursor (position occupied)
    }
  }

  /**
   * Handles when the drag leaves a drop zone
   * Clears the hover state for visual feedback
   * 
   * @param position - The position being left
   */
  const handleDragLeave = (position: SquadPosition) => {
    // Only clear if we're actually leaving this specific position
    if (dragState.value.dragOverPosition === position) {
      dragState.value.dragOverPosition = null
    }
  }

  /**
   * Handles the actual drop operation
   * Validates the drop, updates positions, and handles player swapping
   * 
   * @param event - The drop event
   * @param position - The target position for the drop
   */
  const handleDrop = (event: DragEvent, position: SquadPosition) => {
    event.preventDefault()                        // Prevent default handling
    dragState.value.dragOverPosition = null       // Clear hover state
    
    if (!dragState.value.draggedPlayer) return
    
    // No validation needed - any robot can play any position!
    
    // Remove player from their previous position (if moving from pitch)
    if (dragState.value.draggedFromPosition) {
      placedPlayers.value[dragState.value.draggedFromPosition] = null
    }
    
    // Handle player swapping if target position is occupied
    const existingPlayer = placedPlayers.value[position]
    if (existingPlayer && dragState.value.draggedFromPosition) {
      // Swap: move existing player to the source position
      placedPlayers.value[dragState.value.draggedFromPosition] = existingPlayer
    }
    
    // Place the dragged player in the target position
    placedPlayers.value[position] = dragState.value.draggedPlayer
    
    // Trigger fade-in animation for newly placed player
    newlyPlacedPlayers.value.add(`${dragState.value.draggedPlayer.id}-${position}`)
    setTimeout(() => {
      newlyPlacedPlayers.value.delete(`${dragState.value.draggedPlayer!.id}-${position}`)
    }, 500)  // Remove animation trigger after 500ms
    
    // Clean up drag state
    dragState.value.draggedPlayer = null
    dragState.value.draggedFromPosition = null
    dragState.value.isDragging = false
  }

  // ===== UNIFIED CROSS-PLATFORM HANDLERS =====
  
  /**
   * Unified drag start handler for both mouse and touch events
   * Detects input type and initializes appropriate drag sequence
   * 
   * @param event - Mouse or Touch event
   * @param player - Player being dragged
   * @param fromPosition - Position being dragged from (if on pitch)
   */
  const handleUnifiedDragStart = (event: MouseEvent | TouchEvent, player: SquadPlayer, fromPosition?: SquadPosition) => {
    // Detect if this is a touch or mouse event
    const isTouch = event.type.startsWith('touch')
    const clientX = isTouch ? (event as TouchEvent).touches[0].clientX : (event as MouseEvent).clientX
    const clientY = isTouch ? (event as TouchEvent).touches[0].clientY : (event as MouseEvent).clientY
    
    // Prevent default behavior
    event.preventDefault()
    
    // Calculate drag offset to center the drag helper under cursor/finger
    const dragOffset = {
      x: -30, // Offset to left so it doesn't interfere with finger/cursor
      y: -40 // Offset above finger/cursor for better visibility
    }
    
    // Initialize unified interaction state
    interactionState.value = {
      isDragging: true,
      isTouch,
      startPosition: { x: clientX, y: clientY },
      currentPosition: { x: clientX, y: clientY },
      selectedPlayer: player,
      draggedFromPosition: fromPosition || null,
      hoverPosition: null,
      showDragHelper: true,
      dragOffset
    }
    
    // Update legacy drag state for backward compatibility
    dragState.value.draggedPlayer = player
    dragState.value.draggedFromPosition = fromPosition || null
    dragState.value.isDragging = true
    
    // Provide haptic feedback for touch devices
    if (isTouch && 'vibrate' in navigator) {
      navigator.vibrate(50)
    }
    
    // Add visual feedback class to dragged element
    const target = event.currentTarget as HTMLElement
    target.classList.add('dragging')
    
    // For mobile, also add specific mobile dragging class
    if (isTouch) {
      target.classList.add('mobile-dragging')
    }
    
    console.log(`🎯 ${isTouch ? 'Touch' : 'Mouse'} drag started:`, player.name, fromPosition || 'bench')
  }
  
  /**
   * Unified drag move handler for both mouse and touch events
   * Updates position and provides visual feedback during drag
   * 
   * @param event - Mouse or Touch event
   */
  const handleUnifiedDragMove = (event: MouseEvent | TouchEvent) => {
    if (!interactionState.value.isDragging || !interactionState.value.selectedPlayer) return
    
    // Prevent default behavior
    event.preventDefault()
    
    // Get current position based on event type
    const isTouch = event.type.startsWith('touch')
    const clientX = isTouch ? (event as TouchEvent).touches[0].clientX : (event as MouseEvent).clientX
    const clientY = isTouch ? (event as TouchEvent).touches[0].clientY : (event as MouseEvent).clientY
    
    // Update current position
    interactionState.value.currentPosition = { x: clientX, y: clientY }
    
    // Find element under cursor/finger
    const element = document.elementFromPoint(clientX, clientY)
    
    // Clear previous hover states
    document.querySelectorAll('.drop-zone, .mobile-drop-zone').forEach(el => {
      el.classList.remove('drag-over', 'drag-valid', 'drag-invalid')
    })
    
    // Check if we're over a valid drop zone
    if (element && (element.classList.contains('drop-zone') || element.classList.contains('mobile-drop-zone'))) {
      const position = element.getAttribute('data-position') as SquadPosition
      if (position) {
        const isEmpty = !placedPlayers.value[position]
        const canDrop = isEmpty || interactionState.value.draggedFromPosition
        
        // Update hover state
        interactionState.value.hoverPosition = position
        dragState.value.dragOverPosition = position // Legacy compatibility
        
        // Add appropriate visual feedback
        if (canDrop) {
          element.classList.add('drag-over', 'drag-valid')
        } else {
          element.classList.add('drag-over', 'drag-invalid')
        }
        
        console.log(`🎯 Hovering over ${position}:`, { isEmpty, canDrop })
      }
    } else {
      // Not over a drop zone
      interactionState.value.hoverPosition = null
      dragState.value.dragOverPosition = null
    }
    
    // Position is automatically updated via Vue's reactive state
    // The drag helper in the template will follow interactionState.currentPosition
  }
  
  /**
   * Unified drag end handler for both mouse and touch events
   * Completes the drag and drop sequence with validation
   * 
   * @param event - Mouse or Touch event
   */
  const handleUnifiedDragEnd = (event: MouseEvent | TouchEvent) => {
    if (!interactionState.value.isDragging || !interactionState.value.selectedPlayer) return
    
    event.preventDefault()
    
    const isTouch = interactionState.value.isTouch
    const clientX = isTouch ? (event as TouchEvent).changedTouches[0].clientX : (event as MouseEvent).clientX
    const clientY = isTouch ? (event as TouchEvent).changedTouches[0].clientY : (event as MouseEvent).clientY
    
    // Find drop target
    const element = document.elementFromPoint(clientX, clientY)
    let dropSuccess = false
    
    // Check if we dropped on a valid drop zone
    if (element && (element.classList.contains('drop-zone') || element.classList.contains('mobile-drop-zone'))) {
      const position = element.getAttribute('data-position') as SquadPosition
      if (position) {
        const isEmpty = !placedPlayers.value[position]
        const canDrop = isEmpty || interactionState.value.draggedFromPosition
        
        if (canDrop) {
          // Perform the drop
          performPlayerPlacement(interactionState.value.selectedPlayer, position, interactionState.value.draggedFromPosition)
          dropSuccess = true
          
          // Provide success feedback
          if (isTouch && 'vibrate' in navigator) {
            navigator.vibrate([30, 10, 30]) // Success pattern
          }
          
          console.log(`✅ ${isTouch ? 'Touch' : 'Mouse'} drop successful:`, {
            player: interactionState.value.selectedPlayer.name,
            position,
            from: interactionState.value.draggedFromPosition || 'bench'
          })
        } else {
          // Invalid drop (position occupied and not swapping)
          console.log('❌ Cannot drop - position occupied and not swapping')
          
          if (isTouch && 'vibrate' in navigator) {
            navigator.vibrate(200) // Error pattern
          }
        }
      }
    }
    
    // Clean up all states
    cleanupDragOperation(dropSuccess)
  }
  
  /**
   * Performs the actual player placement with proper state management
   * 
   * @param player - Player to place
   * @param position - Target position
   * @param fromPosition - Source position (if moving from pitch)
   */
  const performPlayerPlacement = (player: SquadPlayer, position: SquadPosition, fromPosition?: SquadPosition | null) => {
    // Clear previous position assignment if moving from pitch
    if (fromPosition) {
      placedPlayers.value[fromPosition] = null
      clearPlayerPosition(player)
    }
    
    // Handle player swapping if target position is occupied
    const existingPlayer = placedPlayers.value[position]
    if (existingPlayer && fromPosition) {
      // Swap: move existing player to the source position
      placedPlayers.value[fromPosition] = existingPlayer
      assignPlayerPosition(existingPlayer, fromPosition)
    } else if (existingPlayer) {
      // Position occupied and can't swap - clear their position
      clearPlayerPosition(existingPlayer)
    }
    
    // Place the player in the target position
    placedPlayers.value[position] = player
    
    // Assign the new position to the player
    assignPlayerPosition(player, position)
    
    // Trigger fade-in animation for newly placed player
    newlyPlacedPlayers.value.add(`${player.id}-${position}`)
    setTimeout(() => {
      newlyPlacedPlayers.value.delete(`${player.id}-${position}`)
    }, 500)
  }
  
  // Drag helper position is now handled by Vue's reactive computed style
  // No need for manual DOM manipulation
  
  /**
   * Cleans up all drag operation states and visual effects
   * 
   * @param success - Whether the drop was successful
   */
  const cleanupDragOperation = (success: boolean) => {
    // Remove visual feedback classes
    document.querySelectorAll('.drop-zone, .mobile-drop-zone').forEach(el => {
      el.classList.remove('drag-over', 'drag-valid', 'drag-invalid')
    })
    
    document.querySelectorAll('.dragging').forEach(el => {
      el.classList.remove('dragging')
    })
    
    document.querySelectorAll('.mobile-dragging').forEach(el => {
      el.classList.remove('mobile-dragging')
    })
    
    // Drag helper is handled by Vue's reactive state - no manual cleanup needed
    
    // Reset interaction state
    interactionState.value = {
      isDragging: false,
      isTouch: false,
      startPosition: null,
      currentPosition: null,
      selectedPlayer: null,
      draggedFromPosition: null,
      hoverPosition: null,
      showDragHelper: false,
      dragOffset: { x: 0, y: 0 }
    }
    
    // Reset legacy drag state
    dragState.value.isDragging = false
    dragState.value.draggedPlayer = null
    dragState.value.draggedFromPosition = null
    dragState.value.dragOverPosition = null
    
    console.log('🧹 Drag operation cleanup completed:', { success })
  }
  
  // ===== BENCH DROP HANDLERS =====
  
  /**
   * Handles drag over events for the bench area
   * Only allows drops from players currently on the pitch
   * 
   * @param event - The dragover event
   */
  const handleBenchDragOver = (event: DragEvent) => {
    event.preventDefault()  // Required to allow dropping
    
    // Only allow bench drops for players coming from the pitch
    if (dragState.value.draggedFromPosition) {
      event.dataTransfer!.dropEffect = 'move'     // Show move cursor
      dragState.value.benchDragOver = true        // Highlight bench area
    } else {
      event.dataTransfer!.dropEffect = 'none'     // Prevent bench-to-bench moves
    }
  }

  /**
   * Handles when drag leaves the bench area
   * Clears the bench hover state
   */
  const handleBenchDragLeave = () => {
    dragState.value.benchDragOver = false
  }

  /**
   * Handles dropping a player back to the bench
   * Removes the player from their pitch position and clears their position assignment
   * 
   * @param event - The drop event
   */
  const handleBenchDrop = (event: DragEvent) => {
    event.preventDefault()                    // Prevent default handling
    dragState.value.benchDragOver = false    // Clear bench hover state
    
    // Only process drops from pitch positions
    if (!dragState.value.draggedPlayer || !dragState.value.draggedFromPosition) return
    
    // Clear the player's position assignment
    clearPlayerPosition(dragState.value.draggedPlayer)
    
    // Remove player from their pitch position (return to available players)
    placedPlayers.value[dragState.value.draggedFromPosition] = null
    
    // Clean up drag state
    dragState.value.draggedPlayer = null
    dragState.value.draggedFromPosition = null
    dragState.value.isDragging = false
  }

  // ===== VISUAL FEEDBACK FUNCTIONS =====
  
  /**
   * Generates CSS classes for drop zone visual feedback
   * Provides color-coded feedback based on drag state and validity
   * 
   * @param position - The position to generate classes for
   * @returns CSS class string for styling the drop zone
   */
  const getDropZoneClasses = (position: SquadPosition): string => {
    const classes = []
    
    // Only apply hover styles when this position is being hovered over
    if (dragState.value.dragOverPosition === position) {
      if (dragState.value.draggedPlayer && isValidPosition(dragState.value.draggedPlayer, position)) {
        const isEmpty = !placedPlayers.value[position]
        if (isEmpty || dragState.value.draggedFromPosition) {
          // Green: Valid drop zone (empty or can swap)
          classes.push('ring-4 ring-green-400 ring-opacity-50 bg-green-400 border-green-600')
        } else {
          // Yellow: Can drop but will replace existing player
          classes.push('ring-4 ring-yellow-400 ring-opacity-50 bg-yellow-400 border-yellow-600')
        }
      } else {
        // Red: Invalid drop zone for this player
        classes.push('ring-4 ring-red-400 ring-opacity-50 bg-red-400 border-red-600')
      }
    }
    
    return classes.join(' ')
  }

  /**
   * Generates CSS classes for bench drop zone visual feedback
   * Shows blue highlight when a player from the pitch is being dragged over
   * 
   * @returns CSS class string for styling the bench area
   */
  const getBenchDropZoneClasses = (): string => {
    const classes = []
    
    // Only highlight bench when dragging a player from the pitch
    if (dragState.value.benchDragOver && dragState.value.draggedFromPosition) {
      // Blue: Valid bench drop (return player to available pool)
      classes.push('ring-4 ring-blue-400 ring-opacity-30 bg-blue-50')
    }
    
    return classes.join(' ')
  }

  /**
   * Generates CSS classes for player cards during drag operations
   * Applies visual feedback to the card being dragged
   * 
   * @param player - The player to generate classes for
   * @returns CSS class string for styling the player card
   */
  const getPlayerCardClasses = (player: SquadPlayer): string => {
    const classes = []
    
    // Apply dragging styles to the card currently being dragged
    if (dragState.value.isDragging && dragState.value.draggedPlayer?.id === player.id) {
      // Reduce opacity and add transform for visual feedback
      classes.push('opacity-50 transform rotate-2 scale-95')
    }
    
    return classes.join(' ')
  }

  /**
   * Generates CSS classes for players placed on the pitch
   * Handles both drag feedback and placement animations
   * 
   * @param player - The placed player
   * @param position - The position the player is placed in
   * @returns CSS class string for styling the placed player
   */
  const getPlacedPlayerClasses = (player: SquadPlayer, position: SquadPosition): string => {
    const classes = []
    
    // Apply dragging styles when this player is being dragged
    if (dragState.value.isDragging && dragState.value.draggedPlayer?.id === player.id) {
      classes.push('opacity-50 transform rotate-2')
    }
    
    // Apply fade-in animation for newly placed players
    if (newlyPlacedPlayers.value.has(`${player.id}-${position}`)) {
      classes.push('animate-fade-in')
    }
    
    return classes.join(' ')
  }

  /**
   * Generates positioning CSS classes for players on the pitch
   * Provides responsive positioning for desktop and mobile layouts
   * 
   * @param position - The squad position
   * @param isMobile - Whether to use mobile positioning
   * @returns CSS class string for absolute positioning
   */
  const getPlayerPositionClasses = (position: SquadPosition, isMobile = false): string => {
    // Define position coordinates for each squad position
    // Mobile uses smaller spacing due to screen constraints
    const positions: Record<SquadPosition, string> = {
      'GK': isMobile 
        ? 'left-6 top-1/2 transform -translate-y-1/2'      // Mobile: closer to left edge
        : 'left-8 top-1/2 transform -translate-y-1/2',     // Desktop: more space from edge
      'DEF1': isMobile 
        ? 'left-16 top-1/4 transform -translate-y-1/2'     // Mobile: left defender, upper
        : 'left-24 top-1/4 transform -translate-y-1/2',    // Desktop: left defender, upper
      'DEF2': isMobile 
        ? 'left-16 top-3/4 transform -translate-y-1/2'     // Mobile: left defender, lower
        : 'left-24 top-3/4 transform -translate-y-1/2',    // Desktop: left defender, lower
      'MID': isMobile 
        ? 'left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2'  // Center midfielder
        : 'left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2',
      'FWD': isMobile 
        ? 'right-16 top-1/2 transform -translate-y-1/2'    // Mobile: forward, right side
        : 'right-24 top-1/2 transform -translate-y-1/2'    // Desktop: forward, right side
    }
    
    return positions[position] || ''
  }

  // ===== SQUAD MANAGEMENT FUNCTIONS =====
  
  /**
   * Saves the current squad configuration
   * Only allows saving when all positions are filled
   * In a real app, this would typically make an API call
   */
  const saveSquad = () => {
    if (!isComplete.value) return  // Prevent saving incomplete squads
    
    // TODO: Replace with actual API call in production
    console.log('Saving squad:', placedPlayers.value)
    
    // TODO: Replace alert with proper toast notification
    alert('Squad saved successfully!')
  }

  /**
   * Adds a new player to the roster
   * In a real app, this would validate and sync with backend
   * 
   * @param player - The player to add
   */
  const addPlayer = (player: SquadPlayer) => {
    players.value.push(player)
  }

  /**
   * Removes a player from the roster
   * Also removes them from any pitch position they occupy
   * 
   * @param playerId - The ID of the player to remove
   */
  const removePlayer = (playerId: number) => {
    // Find player and clear their position if they have one
    const player = players.value.find(p => p.id === playerId)
    if (player) {
      clearPlayerPosition(player)
    }
    
    // Remove from roster
    players.value = players.value.filter(p => p.id !== playerId)
    
    // Remove from placed players if present
    Object.keys(placedPlayers.value).forEach(position => {
      const pos = position as SquadPosition
      if (placedPlayers.value[pos]?.id === playerId) {
        placedPlayers.value[pos] = null
      }
    })
  }

  /**
   * Clears all players from the pitch
   * Returns all players to the available pool and clears their position assignments
   */
  const clearSquad = () => {
    // Clear position assignments for all placed players
    Object.values(placedPlayers.value).forEach(player => {
      if (player) {
        clearPlayerPosition(player)
      }
    })
    
    // Clear the pitch
    const positions: SquadPosition[] = ['GK', 'DEF1', 'DEF2', 'DEF3', 'MID1', 'MID2', 'FWD1', 'FWD2', 'SUB1']
    positions.forEach(position => {
      placedPlayers.value[position] = null
    })
  }

  // ===== FORMATION MANAGEMENT =====
  
  /**
   * Updates the current formation and clears all placed players
   * @param formation - The new formation to set
   */
  const setFormation = (formation: FormationType) => {
    currentFormation.value = formation
    // Clear all placed players when formation changes
    Object.keys(placedPlayers.value).forEach(position => {
      placedPlayers.value[position as SquadPosition] = null
    })
  }

  // ===== COMPOSABLE API =====
  
  /**
   * Return the complete API for the squad builder
   * Organized by category for easier consumption
   */
  return {
    // ===== REACTIVE STATE =====
    // Core squad formation state
    placedPlayers,         // Record<SquadPosition, SquadPlayer | null> - Players placed on pitch
    players,               // SquadPlayer[] - Complete roster of available players
    dragState,             // DragState - Current drag operation state (legacy)
    interactionState,      // InteractionState - Unified cross-platform interaction state
    validationState,       // ValidationState - Warning/error message state
    newlyPlacedPlayers,    // Set<string> - Track players for fade-in animations
    currentFormation,      // Ref<FormationType> - Current formation
    
    // ===== COMPUTED PROPERTIES =====
    // Formation configuration
    formationConfig,       // Computed formation layout and positions
    activePositions,       // SquadPosition[] - Active positions for current formation
    // Real-time squad statistics
    totalPlayers,          // number - Total players in roster
    activePlayers,         // number - Players currently on the pitch
    substitutes,           // number - Players available on the bench
    availablePlayers,      // SquadPlayer[] - Players not currently placed
    isComplete,            // boolean - Whether all positions are filled
    
    // ===== POSITION MANAGEMENT =====
    assignPlayerPosition,       // (player, position) => void - Assign position when dropped
    clearPlayerPosition,        // (player) => void - Clear position assignment
    showDropWarning,           // (message) => void - Show warning message
    
    // ===== DRAG AND DROP HANDLERS =====
    // Legacy drag and drop event handlers (for backward compatibility)
    handleDragStart,       // (event, player, fromPosition?) => void - Start drag operation
    handleDragEnd,         // () => void - Clean up after drag operation
    handleDragOver,        // (event, position) => void - Handle hover over drop zones
    handleDragLeave,       // (position) => void - Handle leaving drop zones
    handleDrop,            // (event, position) => void - Handle successful drop
    
    // Unified cross-platform handlers (recommended)
    handleUnifiedDragStart, // (event, player, fromPosition?) => void - Unified start handler
    handleUnifiedDragMove,  // (event) => void - Unified move handler
    handleUnifiedDragEnd,   // (event) => void - Unified end handler
    
    // Bench-specific drag and drop handlers
    handleBenchDragOver,   // (event) => void - Handle hover over bench
    handleBenchDragLeave,  // () => void - Handle leaving bench area
    handleBenchDrop,       // (event) => void - Handle drop on bench
    
    // ===== VISUAL FEEDBACK FUNCTIONS =====
    // CSS class generators for dynamic styling
    getDropZoneClasses,        // (position) => string - Drop zone highlight classes
    getBenchDropZoneClasses,   // () => string - Bench area highlight classes
    getPlayerCardClasses,      // (player) => string - Player card drag feedback
    getPlacedPlayerClasses,    // (player, position) => string - Placed player styling
    getPlayerPositionClasses,  // (position, isMobile?) => string - Position coordinates
    
    // ===== FORMATION MANAGEMENT =====
    setFormation,          // (formation) => void - Change formation and clear pitch
    
    // ===== SQUAD MANAGEMENT =====
    // High-level squad operations
    saveSquad,             // () => void - Save current squad (when complete)
    addPlayer,             // (player) => void - Add new player to roster
    removePlayer,          // (playerId) => void - Remove player from roster
    clearSquad            // () => void - Clear all players from pitch
  }
}
