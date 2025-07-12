<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-6">Profile</h1>
      </v-col>
    </v-row>

    <v-row>
      <!-- User Info Card -->
      <v-col cols="12" md="4">
        <v-card>
          <v-card-text class="text-center">
            <v-avatar size="120" class="mb-4">
              <v-img 
                v-if="userStore.avatarUrl" 
                :src="userStore.avatarUrl"
                :alt="userStore.displayName"
              />
              <v-icon v-else size="80">mdi-account-circle</v-icon>
            </v-avatar>
            
            <h2 class="text-h5 mb-2">{{ userStore.displayName }}</h2>
            
            <v-chip 
              :color="authMethodColor" 
              variant="tonal"
              prepend-icon="mdi-shield-check"
              class="mb-2"
            >
              {{ authMethodLabel }}
            </v-chip>
            
            <v-chip 
              v-if="userStore.userProfile?.managerProfile?.rank"
              color="primary" 
              variant="outlined"
              prepend-icon="mdi-account-star"
              class="mb-4"
            >
              {{ userStore.userProfile.managerProfile.rank }} Manager
            </v-chip>
            
            <v-list density="compact" class="transparent">
              <v-list-item v-if="userStore.currentUser?.email">
                <template v-slot:prepend>
                  <v-icon>mdi-email</v-icon>
                </template>
                <v-list-item-title>{{ userStore.currentUser.email }}</v-list-item-title>
              </v-list-item>
              
              <v-list-item v-if="userStore.userProfile?.walletAddress">
                <template v-slot:prepend>
                  <v-icon>mdi-ethereum</v-icon>
                </template>
                <v-list-item-title>{{ shortAddress }}</v-list-item-title>
              </v-list-item>
              
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon>mdi-calendar</v-icon>
                </template>
                <v-list-item-title>
                  Joined {{ joinDate }}
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card-text>
          
          <v-card-actions>
            <v-btn
              block
              color="primary"
              variant="outlined"
              @click="editDialog = true"
            >
              Edit Profile
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <!-- Game Stats Card -->
      <v-col cols="12" md="8">
        <v-card>
          <v-card-title>Game Statistics</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="6" sm="3">
                <div class="text-center">
                  <div class="text-h3 font-weight-bold text-primary">
                    {{ gameStore.score }}
                  </div>
                  <div class="text-caption">Total Score</div>
                </div>
              </v-col>
              
              <v-col cols="6" sm="3">
                <div class="text-center">
                  <div class="text-h3 font-weight-bold text-success">
                    {{ gameStore.stats.matchesWon }}
                  </div>
                  <div class="text-caption">Matches Won</div>
                </div>
              </v-col>
              
              <v-col cols="6" sm="3">
                <div class="text-center">
                  <div class="text-h3 font-weight-bold text-info">
                    {{ gameStore.stats.matchesPlayed }}
                  </div>
                  <div class="text-caption">Matches Played</div>
                </div>
              </v-col>
              
              <v-col cols="6" sm="3">
                <div class="text-center">
                  <div class="text-h3 font-weight-bold text-warning">
                    {{ gameStore.winRate }}%
                  </div>
                  <div class="text-caption">Win Rate</div>
                </div>
              </v-col>
            </v-row>

            <v-divider class="my-4" />

            <h3 class="text-h6 mb-3">Achievements</h3>
            <v-chip-group v-if="gameStore.achievements.length">
              <v-chip
                v-for="achievement in gameStore.achievements"
                :key="achievement"
                color="primary"
                variant="tonal"
              >
                {{ achievement }}
              </v-chip>
            </v-chip-group>
            <p v-else class="text-medium-emphasis">
              No achievements yet. Keep playing to unlock them!
            </p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- MetaMask Connection -->
    <v-row v-if="userStore.authMethod !== 'metamask'">
      <v-col cols="12">
        <h2 class="text-h5 mb-4">Web3 Integration</h2>
        <metamask-connect
          @connected="handleMetaMaskConnected"
        />
      </v-col>
    </v-row>

    <!-- Edit Profile Dialog -->
    <v-dialog v-model="editDialog" max-width="500">
      <v-card>
        <v-card-title>Edit Profile</v-card-title>
        <v-card-text>
          <v-form ref="editForm" v-model="editValid">
            <v-text-field
              v-model="editDisplayName"
              label="Display Name"
              variant="outlined"
              density="comfortable"
              :rules="[v => !!v || 'Name is required']"
              class="mb-2"
            />
            
            <v-file-input
              v-model="avatarFile"
              label="Profile Picture"
              variant="outlined"
              density="comfortable"
              accept="image/*"
              prepend-icon="mdi-camera"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="editDialog = false">Cancel</v-btn>
          <v-btn 
            color="primary" 
            @click="saveProfile"
            :loading="saving"
            :disabled="!editValid"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { useGameStore } from '@/stores/game'
import { uploadAvatar } from '@/services/storage'
import MetaMaskConnect from '@/components/auth/MetaMaskConnect.vue'

const userStore = useUserStore()
const gameStore = useGameStore()

// State
const editDialog = ref(false)
const editForm = ref(null)
const editValid = ref(false)
const editDisplayName = ref('')
const avatarFile = ref(null)
const saving = ref(false)

// Computed
const authMethodLabel = computed(() => {
  const methods = {
    google: 'Google Account',
    email: 'Email Account',
    metamask: 'MetaMask Wallet',
    unknown: 'Unknown'
  }
  return methods[userStore.authMethod] || 'Unknown'
})

const authMethodColor = computed(() => {
  const colors = {
    google: 'red',
    email: 'blue',
    metamask: 'orange',
    unknown: 'grey'
  }
  return colors[userStore.authMethod] || 'grey'
})

const shortAddress = computed(() => {
  const address = userStore.userProfile?.walletAddress
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
})

const joinDate = computed(() => {
  const date = userStore.userProfile?.createdAt
  if (!date) return 'Unknown'
  return new Date(date.seconds * 1000).toLocaleDateString()
})

// Methods
const saveProfile = async () => {
  if (!editForm.value.validate()) return
  
  saving.value = true
  
  try {
    // Upload avatar if changed
    if (avatarFile.value) {
      const userId = userStore.currentUser?.uid
      const { url, error } = await uploadAvatar(userId, avatarFile.value)
      
      if (!error && url) {
        userStore.updateAvatar(url)
      }
    }
    
    // Update display name
    if (editDisplayName.value !== userStore.displayName) {
      await userStore.updateUserProfile({
        displayName: editDisplayName.value
      })
    }
    
    editDialog.value = false
  } catch (error) {
    console.error('Error updating profile:', error)
  } finally {
    saving.value = false
  }
}

const handleMetaMaskConnected = async ({ address }) => {
  await userStore.updateUserProfile({
    walletAddress: address
  })
}

// Lifecycle
onMounted(() => {
  editDisplayName.value = userStore.displayName
  gameStore.initializeGame()
})
</script>