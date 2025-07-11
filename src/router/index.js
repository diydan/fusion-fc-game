import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '@/views/Dashboard.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: Dashboard
    },
    {
      path: '/my-team',
      name: 'my-team',
      component: () => import('@/views/MyTeam.vue')
    },
    {
      path: '/my-games',
      name: 'my-games',
      component: () => import('@/views/MyGames.vue')
    },
    {
      path: '/leaderboards',
      name: 'leaderboards',
      component: () => import('@/views/Leaderboards.vue')
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/Settings.vue')
    },
    {
      path: '/theme',
      name: 'theme',
      component: () => import('@/views/Theme.vue')
    }
  ]
})

export default router