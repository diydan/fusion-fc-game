import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '@/views/Dashboard.vue'
import { useUserStore } from '@/stores/user'

// Route guards
const requireAuth = (to, from, next) => {
  const userStore = useUserStore()
  
  if (userStore.loading) {
    // Wait for auth to initialize
    const unwatch = userStore.$subscribe((mutation, state) => {
      if (!state.loading) {
        unwatch()
        if (state.isAuthenticated) {
          // Check if onboarding is complete
          if (!state.isOnboardingComplete && to.path !== '/onboarding') {
            next('/onboarding')
          } else {
            next()
          }
        } else {
          next('/login')
        }
      }
    })
  } else if (userStore.isAuthenticated) {
    // Check if onboarding is complete
    if (!userStore.isOnboardingComplete && to.path !== '/onboarding') {
      next('/onboarding')
    } else {
      next()
    }
  } else {
    next('/login')
  }
}

const requireOnboarding = (to, from, next) => {
  const userStore = useUserStore()
  
  console.log('requireOnboarding guard - isOnboardingComplete:', userStore.isOnboardingComplete)
  console.log('requireOnboarding guard - userProfile:', userStore.userProfile)
  
  if (userStore.loading) {
    // Wait for auth to initialize
    const unwatch = userStore.$subscribe((mutation, state) => {
      if (!state.loading) {
        unwatch()
        if (state.isAuthenticated) {
          if (state.isOnboardingComplete) {
            next('/')
          } else {
            next()
          }
        } else {
          next('/login')
        }
      }
    })
  } else if (userStore.isAuthenticated) {
    if (userStore.isOnboardingComplete) {
      console.log('User has completed onboarding, redirecting to dashboard')
      next('/')
    } else {
      console.log('User has NOT completed onboarding, allowing access')
      next()
    }
  } else {
    next('/login')
  }
}

const requireGuest = (to, from, next) => {
  const userStore = useUserStore()
  
  if (userStore.loading) {
    // Wait for auth to initialize
    const unwatch = userStore.$subscribe((mutation, state) => {
      if (!state.loading) {
        unwatch()
        if (!state.isAuthenticated) {
          next()
        } else {
          next('/')
        }
      }
    })
  } else if (!userStore.isAuthenticated) {
    next()
  } else {
    next('/')
  }
}

const requireAuthOnly = (to, from, next) => {
  const userStore = useUserStore()
  
  if (userStore.loading) {
    // Wait for auth to initialize
    const unwatch = userStore.$subscribe((mutation, state) => {
      if (!state.loading) {
        unwatch()
        if (state.isAuthenticated) {
          next()
        } else {
          next('/login')
        }
      }
    })
  } else if (userStore.isAuthenticated) {
    next()
  } else {
    next('/login')
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/Login.vue'),
      beforeEnter: requireGuest
    },
    {
      path: '/onboarding',
      name: 'onboarding',
      component: () => import('@/views/Onboarding.vue'),
      beforeEnter: requireOnboarding
    },
    {
      path: '/',
      name: 'dashboard',
      component: Dashboard,
      
    },
    {
      path: '/my-team',
      name: 'my-team',
      component: () => import('@/views/MyTeam.vue'),
      
    },
    {
      path: '/recruit',
      name: 'recruit',
      component: () => import('@/views/Recruit.vue'),
      
    },
    {
      path: '/my-games',
      name: 'my-games',
      component: () => import('@/views/MyGames.vue'),
      
    },
    {
      path: '/play-game/:matchId?',
      name: 'play-game',
      component: () => import('@/views/PlayGame.vue'),
      
    },
    {
      path: '/leaderboards',
      name: 'leaderboards',
      component: () => import('@/views/Leaderboards.vue'),
      
    },
    {
      path: '/tokens',
      name: 'tokens',
      component: () => import('@/views/TokensPowerUps.vue'),
      
    },
    {
      path: '/character-creator',
      name: 'character-creator',
      component: () => import('@/views/CharacterCreator.vue'),
      
    },
    {
      path: '/intro',
      name: 'intro',
      component: () => import('@/views/Intro.vue'),
      
    },
    {
      path: '/dance',
      name: 'dance',
      component: () => import('@/views/Dance.vue'),
      
    },
    {
      path: '/matchmaking',
      name: 'matchmaking',
      component: () => import('@/components/multiplayer/WaitingRoom.vue'),
      
    },
    {
      path: '/game/h2h/:matchId',
      name: 'h2h-game',
      component: () => import('@/views/H2HGameView.vue'),
      
    },
    {
      path: '/game/spectate/:matchId',
      name: 'spectate-game',
      component: () => import('@/views/SpectateView.vue'),
      
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/views/Profile.vue'),
      
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/Settings.vue'),
  
    },
    {
      path: '/theme',
      name: 'theme',
      component: () => import('@/views/Theme.vue'),
      
    },
    {
      path: '/buttons',
      name: 'buttons',
      component: () => import('@/views/ButtonDemo.vue'),
      
    },
    {
      path: '/sound-test',
      name: 'sound-test',
      component: () => import('@/views/SoundTest.vue'),
      
    },
    {
      path: '/demo',
      name: 'DemoPage',
      component: () => import('@/views/DemoPage.vue'),
      
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFound.vue')
    }
  ]
})

export default router
