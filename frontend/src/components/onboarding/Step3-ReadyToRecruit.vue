<template>
  <v-card flat>
    <v-card-title class="text-center">
      <h2 class="text-h4 mb-2">🎉 Welcome to Fusion FC!</h2>
      <p class="text-h6 font-weight-regular">Your team is ready and you have your recruitment budget</p>
    </v-card-title>
    
    <v-card-subtitle class="text-center text-body-1 mb-4">
      Time to build your championship squad
    </v-card-subtitle>

    <v-card-text>
      <!-- Team Summary -->
      <v-card variant="outlined" class="mb-4 team-summary-card">
        <v-card-text class="text-center">
          <div class="d-flex align-center justify-center mb-3">
            <v-img
              v-if="data.team?.logo"
              :src="data.team.logo"
              :height="80"
              :width="80"
              class="team-logo-small rounded-circle me-3"
              contain
            >
              <template v-slot:placeholder>
                <v-progress-circular indeterminate color="primary" />
              </template>
            </v-img>
            <div v-else class="fallback-logo-small rounded-circle me-3">
              <v-icon size="40" color="white">mdi-soccer</v-icon>
            </div>
            
            <div class="text-left">
              <h3 class="text-h5 mb-1">{{ data.team?.name || 'Your Team' }}</h3>
              <p class="text-body-2 text-medium-emphasis">{{ data.team?.location?.city || 'Home City' }}</p>
            </div>
          </div>
          
          <div class="colors-preview mb-3">
            <div 
              class="color-chip me-2" 
              :style="{ backgroundColor: data.team?.colors?.primary }"
            ></div>
            <div 
              class="color-chip" 
              :style="{ backgroundColor: data.team?.colors?.secondary }"
            ></div>
          </div>
        </v-card-text>
      </v-card>

      <!-- Manager & Budget -->
      <v-card variant="outlined" class="mb-4 manager-budget-card">
        <v-card-text>
          <v-row align="center">
            <v-col cols="12" sm="6" class="text-center">
              <v-avatar size="80" class="mb-2">
                <v-img 
                  :src="data.manager?.avatar" 
                  :alt="data.manager?.name"
                  cover
                >
                  <template v-slot:placeholder>
                    <v-icon size="40">mdi-account-circle</v-icon>
                  </template>
                </v-img>
              </v-avatar>
              <h3 class="text-h6">{{ data.manager?.name || 'Manager' }}</h3>
              <p class="text-caption text-medium-emphasis">Amateur Manager</p>
            </v-col>
            
            <v-col cols="12" sm="6" class="text-center">
              <div class="budget-display">
                <v-icon size="48" color="success" class="mb-2">mdi-currency-usd</v-icon>
                <h2 class="text-h4 font-weight-bold text-success">$100K</h2>
                <p class="text-body-2 text-medium-emphasis">Recruitment Budget</p>
                <v-chip color="success" variant="outlined" size="small">
                  <v-icon start size="small">mdi-account-plus</v-icon>
                  Ready to recruit!
                </v-chip>
              </div>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Stadium Info -->
      <v-card variant="outlined" class="mb-4 stadium-summary-card">
        <v-card-text class="text-center">
          <v-icon size="40" color="primary" class="mb-2">mdi-stadium</v-icon>
          <h3 class="text-h6 mb-2">{{ data.team?.stadium?.name || 'Team Stadium' }}</h3>
          <div class="d-flex justify-center align-center">
            <v-chip size="small" variant="outlined" class="me-2">
              <v-icon start size="small">mdi-account-group</v-icon>
              {{ formatCapacity(data.team?.stadium?.capacity) }}
            </v-chip>
            <v-chip size="small" variant="outlined">
              <v-icon start size="small">mdi-star</v-icon>
              {{ data.team?.stadium?.atmosphere || 85 }}% atmosphere
            </v-chip>
          </div>
        </v-card-text>
      </v-card>

      <!-- Next Steps -->
      <v-alert type="info" variant="tonal" class="mb-4">
        <template v-slot:prepend>
          <v-icon>mdi-information</v-icon>
        </template>
        <p class="text-body-2 mb-2"><strong>What's Next?</strong></p>
        <ul class="text-body-2">
          <li>Use your $100K budget to recruit players</li>
          <li>Build a balanced squad (goalkeepers, defenders, midfielders, forwards)</li>
          <li>Start playing matches and climb the league rankings</li>
          <li>Earn reputation and unlock better players</li>
        </ul>
      </v-alert>

      <!-- Action Buttons -->
      <v-row class="mt-6" justify="center">
        <v-col cols="12" sm="6">
          <game-button
            block
            variant="outlined"
            size="large"
            label="Back"
            prepend-icon="mdi-arrow-left"
            @click="goBack"
            click-sound="pop"
          />
        </v-col>
        
        <v-col cols="12" sm="6">
          <game-button
            block
            color="success"
            size="large"
            label="Start Recruiting!"
            append-icon="mdi-account-plus"
            @click="completeOnboarding"
            :loading="completing"
            click-sound="success"
          />
        </v-col>
      </v-row>

      <!-- Future Features Hint -->
      <p class="text-center text-caption text-medium-emphasis mt-4">
        💡 <strong>Coming Soon:</strong> Advanced tactics, training facilities, transfers, and league competitions!
      </p>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue';
import GameButton from '@/components/GameButton.vue';
import { useSoundStore } from '@/stores/sound';

const props = defineProps({
  data: {
    type: Object,
    required: true
  },
  complete: {
    type: Function,
    required: true
  },
  prev: {
    type: Function,
    required: true
  }
});

const soundStore = useSoundStore();
const completing = ref(false);

// Helper methods
const formatCapacity = (capacity) => {
  if (!capacity) return '25,000';
  return capacity.toLocaleString();
};

const goBack = () => {
  props.prev();
};

const completeOnboarding = async () => {
  completing.value = true;
  
  try {
    // Add recruitment budget to the data
    const completeData = {
      ...props.data,
      manager: {
        ...props.data.manager,
        recruitmentBudget: 100000, // $100K budget
        rank: 'Amateur'
      },
      team: {
        ...props.data.team,
        squad: [], // Empty squad to start
        finances: {
          ...props.data.team?.finances,
          recruitmentBudget: 100000
        }
      },
      nextStep: '/recruit' // Redirect to recruitment page
    };
    
    await props.complete(completeData);
  } catch (error) {
    console.error('Onboarding completion error:', error);
  } finally {
    completing.value = false;
  }
};
</script>

<style scoped>
:deep(.v-card) {
  background-color: rgba(var(--v-theme-surface), 0.9);
}

.team-summary-card {
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.05) 0%, rgba(var(--v-theme-secondary), 0.05) 100%);
  border: 1px solid rgba(var(--v-theme-primary), 0.2);
}

.manager-budget-card {
  background: linear-gradient(135deg, rgba(var(--v-theme-success), 0.05) 0%, rgba(var(--v-theme-warning), 0.05) 100%);
  border: 1px solid rgba(var(--v-theme-success), 0.2);
}

.stadium-summary-card {
  background: linear-gradient(135deg, rgba(var(--v-theme-info), 0.05) 0%, rgba(var(--v-theme-secondary), 0.05) 100%);
  border: 1px solid rgba(var(--v-theme-info), 0.2);
}

.team-logo-small {
  border: 2px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.fallback-logo-small {
  width: 80px;
  height: 80px;
  background: linear-gradient(45deg, var(--v-theme-primary), var(--v-theme-secondary));
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.colors-preview {
  display: flex;
  justify-content: center;
  align-items: center;
}

.color-chip {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.budget-display {
  padding: 16px;
  background: rgba(var(--v-theme-success), 0.1);
  border-radius: 12px;
  border: 1px solid rgba(var(--v-theme-success), 0.3);
}

ul {
  padding-left: 20px;
}

li {
  margin-bottom: 4px;
}
</style>