<template>
  <onboarding-wrapper
    ref="wrapper"
    @complete="handleComplete"
    @step-change="handleStepChange"
  >
    <!-- Step 1: Manager Setup -->
    <template #step1="{ next, data }">
      <step2-manager-setup
        :data="data"
        :next="next"
        :prev="() => {}"
      />
    </template>

    <!-- Step 2: Initial Team -->
    <template #step2="{ next, prev, data }">
      <step1-initial-team
        :data="data"
        :next="handleTeamNext"
        :prev="prev"
      />
    </template>

  </onboarding-wrapper>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { useSoundStore } from '@/stores/sound';
import { 
  createTeam,
  updateTeam, 
  updateUser, 
  updateOnboardingProgress 
} from '@/services/database';
import { saveTeamLogo } from '@/services/logo-generator';
import { uploadAvatar } from '@/services/storage';

// Components
import OnboardingWrapper from '@/components/onboarding/OnboardingWrapper.vue';
import Step1InitialTeam from '@/components/onboarding/Step1-InitialTeam.vue';
import Step2ManagerSetup from '@/components/onboarding/Step2-ManagerSetup.vue';

const router = useRouter();
const userStore = useUserStore();
const soundStore = useSoundStore();

// Refs
const wrapper = ref(null);

// Handle team step completion (step 2)
const handleTeamNext = (data) => {
  // Go to next step (which will now complete onboarding)
  wrapper.value.nextStep(data);
};

// Handle step changes
const handleStepChange = async (step) => {
  // Save progress to database
  try {
    const result = await updateOnboardingProgress(userStore.currentUser.uid, step);
    if (!result.success) {
      console.error('Failed to save progress:', result.error);
    }
  } catch (error) {
    console.error('Failed to save progress:', error);
  }
};

// Handle onboarding completion
const handleComplete = async (data) => {
  try {
    console.log('Completing onboarding with data:', data);
    
    // 1. Create the team in Firestore
    const teamData = {
      name: data.team.name,
      colors: data.team.colors,
      logoPrompt: data.team.logoPrompt,
      managerId: userStore.currentUser.uid,
      location: data.location
    };
    
    const { id: teamId, error: teamError } = await createTeam(teamData);
    if (teamError) throw new Error(teamError);
    
    console.log('Team created with ID:', teamId);
    
    // 2. Save logo to Firebase Storage
    if (data.team.tempLogo && !data.team.isFallback) {
      const { logoUrl, storagePath, error: logoError } = await saveTeamLogo(
        teamId,
        data.team.tempLogo
      );
      
      if (logoError) {
        console.error('Logo save error:', logoError);
        // Continue anyway with temp URL
      } else {
        // Update team with permanent logo URL
        await updateTeam(teamId, {
          logo: logoUrl,
          logoPath: storagePath
        });
      }
    }
    
    // 3. Upload manager avatar if needed
    let managerAvatarUrl = data.manager.avatar;
    if (data.manager.avatarSource === 'uploaded' && data.manager.avatarFile) {
      const { url, error: avatarError } = await uploadAvatar(
        userStore.currentUser.uid,
        data.manager.avatarFile
      );
      
      if (!avatarError && url) {
        managerAvatarUrl = url;
        userStore.updateAvatar(url);
      }
    }
    
    // 4. Update user profile
    const userUpdates = {
      managerProfile: {
        name: data.manager.name,
        bio: data.manager.bio,
        avatar: managerAvatarUrl,
        avatarSource: data.manager.avatarSource,
        teamId: teamId,
        rank: 'Amateur',
        recruitmentBudget: 100000,
        // Manager stats
        experience: 0,
        reputation: 'Amateur',
        personality: 'Ambitious',
        specialties: ['Learning', 'Development']
      },
      onboardingCompleted: true,
      onboardingStep: 'completed'
    };
    
    // Add email if provided
    if (data.manager.email && userStore.authMethod === 'metamask') {
      userUpdates.email = data.manager.email;
    }
    
    const { error: updateError } = await updateUser(
      userStore.currentUser.uid,
      userUpdates
    );
    
    if (updateError) throw new Error(updateError);
    
    // 5. Update user store
    await userStore.fetchUserProfile(userStore.currentUser.uid);
    
    // 6. Play success sound
    soundStore.playSound('success');
    
    // 7. Navigate to dashboard
    setTimeout(() => {
      router.push('/dashboard');
    }, 1500);
    
  } catch (error) {
    console.error('Onboarding completion error:', error);
    // Show error to user
    // The wrapper component handles error display
    throw error;
  }
};
</script>

<style scoped>
/* All styling handled by child components */
</style>