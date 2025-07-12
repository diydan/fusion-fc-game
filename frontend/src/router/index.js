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
      next('/')
    } else {
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
      beforeEnter: requireAuth
    },
    {
      path: '/my-team',
      name: 'my-team',
      component: () => import('@/views/MyTeam.vue'),
      beforeEnter: requireAuth
    },
    {
      path: '/recruit',
      name: 'recruit',
      component: () => import('@/views/Recruit.vue'),
      beforeEnter: requireAuth
    },
    {
      path: '/my-games',
      name: 'my-games',
      component: () => import('@/views/MyGames.vue'),
      beforeEnter: requireAuth
    },
    {
      path: '/leaderboards',
      name: 'leaderboards',
      component: () => import('@/views/Leaderboards.vue'),
      beforeEnter: requireAuth
    },
    {
      path: '/tokens',
      name: 'tokens',
      component: () => import('@/views/TokensPowerUps.vue'),
      beforeEnter: requireAuth
    },
    {
      path: '/select-bot',
      name: 'select-bot',
      component: () => import('@/views/SelectBot.vue'),
      beforeEnter: requireAuth
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/views/Profile.vue'),
      beforeEnter: requireAuth
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/Settings.vue'),
      beforeEnter: requireAuthOnly
    },
    {
      path: '/theme',
      name: 'theme',
      component: () => import('@/views/Theme.vue'),
      beforeEnter: requireAuth
    },
    {
      path: '/buttons',
      name: 'buttons',
      component: () => import('@/views/ButtonDemo.vue'),
      beforeEnter: requireAuth
    },
    {
      path: '/sound-test',
      name: 'sound-test',
      component: () => import('@/views/SoundTest.vue'),
      beforeEnter: requireAuth
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFound.vue')
    }
  ]
})

export default router