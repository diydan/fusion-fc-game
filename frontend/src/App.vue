<template>
  <v-app>

    <!-- Mobile Header (hidden on login page) -->
    <v-app-bar
      v-if="!isLoginPage"
      app
      class="d-md-none mobile-header"
      color="surface"
      elevation="1"
      height="56"
    >
      <v-app-bar-title class="header-title">
        <div class="header-content">
          <v-img
            src="/Fusion-FC-logo.png"
            :width="40"
            :height="40"
            class="header-logo"
            contain
          />
          <span class="title-logo">Fusion FC</span>
        </div>
      </v-app-bar-title>

      <template v-slot:append>
        <v-btn icon size="small" to="/settings">
          <v-avatar size="32" color="primary">
            <v-icon size="18">mdi-account</v-icon>
          </v-avatar>
        </v-btn>
      </template>
    </v-app-bar>

    <!-- Desktop Header (hidden on login page) -->
    <v-app-bar
      v-if="!isLoginPage"
      app
      class="d-none d-md-flex desktop-header"
      color="surface"
      elevation="1"
      height="64"
      fixed
    >
      <v-app-bar-title class="header-title">
        <div class="header-content">
          <v-img
            src="/Fusion-FC-logo.png"
            :width="40"
            :height="40"
            class="header-logo"
            contain
          />
          <span class="title-logo">Fusion FC</span>
        </div>
      </v-app-bar-title>

      <v-spacer></v-spacer>

      <v-btn icon size="small" class="me-2">
        <v-icon>mdi-bell-outline</v-icon>
      </v-btn>

      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn icon v-bind="props">
            <v-avatar size="32" color="primary">
              <v-icon>mdi-account</v-icon>
            </v-avatar>
          </v-btn>
        </template>
        <v-list>
          <v-list-item to="/profile">
            <v-list-item-title>Profile</v-list-item-title>
          </v-list-item>
          <v-list-item to="/settings">
            <v-list-item-title>Settings</v-list-item-title>
          </v-list-item>
          <v-list-item to="/theme">
            <v-list-item-title>Theme</v-list-item-title>
          </v-list-item>
          <v-divider></v-divider>
          <v-list-item @click="logout">
            <v-list-item-title>Logout</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>



    <!-- Desktop Navigation Drawer (hidden on login page) -->
    <v-navigation-drawer
      v-if="!isLoginPage"
      v-model="drawer"
      app
      class="d-none d-md-flex"
      permanent
      width="256"
    >
      <v-list density="compact" class="px-2 mt-4">
        <v-list-item
          prepend-icon="mdi-view-dashboard"
          title="Dashboard"
          to="/"
          rounded="xl"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-account-group"
          title="My Team"
          to="/my-team"
          rounded="xl"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-gamepad-variant"
          title="My Games"
          to="/my-games"
          rounded="xl"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-account-plus"
          title="Recruit"
          to="/recruit"
          rounded="xl"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-trophy"
          title="Leaderboards"
          to="/leaderboards"
          rounded="xl"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-wallet"
          title="Tokens & PowerUps"
          to="/tokens"
          rounded="xl"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-robot"
          title="Character Creator"
          to="/character-creator"
          rounded="xl"
        ></v-list-item>

        <v-divider class="my-2"></v-divider>

        <v-list-item
          prepend-icon="mdi-palette"
          title="Theme"
          to="/theme"
          rounded="xl"
        ></v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-main :class="isLoginPage ? 'login-main' : 'main-content'">
      <div v-if="!isLoginPage" class="mobile-container">
        <v-container fluid class="pa-2 pa-md-4 full-width-container">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </v-container>
      </div>
      <div v-else class="login-container">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </v-main>

    <v-bottom-navigation
      v-if="!isLoginPage"
      v-model="bottomNav"
      grow
      class="d-md-none"
      color="primary"
    >
      <v-btn to="/">
        <v-icon>mdi-view-dashboard</v-icon>
        <span class="text-caption">Dashboard</span>
      </v-btn>
      <v-btn to="/my-team">
        <v-icon>mdi-account-group</v-icon>
        <span class="text-caption">My Team</span>
      </v-btn>
      <v-btn to="/my-games">
        <v-icon>mdi-gamepad-variant</v-icon>
        <span class="text-caption">My Games</span>
      </v-btn>
      <v-btn to="/recruit">
        <v-icon>mdi-account-plus</v-icon>
        <span class="text-caption">Recruit</span>
      </v-btn>
      <v-btn to="/leaderboards">
        <v-icon>mdi-trophy</v-icon>
        <span class="text-caption">Leaders</span>
      </v-btn>
      <v-btn to="/tokens">
        <v-icon>mdi-wallet</v-icon>
        <span class="text-caption">Tokens</span>
      </v-btn>
      <v-btn to="/settings">
        <v-icon>mdi-cog</v-icon>
        <span class="text-caption">Settings</span>
      </v-btn>
    </v-bottom-navigation>
  </v-app>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const drawer = ref(true)
const bottomNav = ref(0)

// Check if current route is login page
const isLoginPage = computed(() => route.name === 'login')

const logout = async () => {
  const success = await userStore.logout()
  if (success) {
    router.push('/login')
  }
}
</script>

<style scoped>
.v-navigation-drawer {
  background: #010224 !important;
  backdrop-filter: blur(20px);
  border-right: 1px solid rgba(83, 52, 131, 0.3) !important;
  position: relative;
}

.v-navigation-drawer::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(circle at 30% 40%, rgba(0, 63, 237, 0.1) 0%, transparent 60%),
    radial-gradient(circle at 70% 70%, rgba(51, 102, 255, 0.08) 0%, transparent 60%);
  pointer-events: none;
}

.mobile-header {
  background: #010224 !important;
  border-bottom: 1px solid rgba(83, 52, 131, 0.3) !important;
  backdrop-filter: blur(20px);
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.5) !important;
}

.main-content {
  position: relative;
}

.main-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(circle at 70% 30%, rgba(0, 63, 237, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 30% 70%, rgba(9, 9, 121, 0.05) 0%, transparent 50%);
  pointer-events: none;
  z-index: 0;
}

.login-main {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  padding: 0 !important;
  margin: 0 !important;
  z-index: 1001 !important;
}

.login-container {
  width: 100%;
  height: 100%;
  position: relative;
  z-index: 1002;
}

@media (max-width: 959px) {
  .v-main {
    --v-layout-top: 20px !important;
    padding-top: 80px !important;
  }

  .v-main .mobile-container {
    padding-top: 0 !important;
  }
}

.desktop-header {
  background: #010224 !important;
  border-bottom: 1px solid rgba(83, 52, 131, 0.3) !important;
  backdrop-filter: blur(20px);
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.5) !important;
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  z-index: 1000 !important;
}

.v-bottom-navigation {
  height: 64px !important;
  position: fixed !important;
  bottom: 0 !important;
  left: 0 !important;
  right: 0 !important;
  width: 100vw !important;
  max-width: 100vw !important;
  z-index: 1000 !important;
  padding-bottom: env(safe-area-inset-bottom, 0px) !important;
  margin: 0 !important;
  background: #010224 !important;
  border-top: 1px solid rgba(83, 52, 131, 0.3) !important;
  backdrop-filter: blur(20px);
  box-shadow: 0 -2px 20px rgba(0, 0, 0, 0.5) !important;
}

.v-bottom-navigation .v-btn {
  height: 100% !important;
  min-width: 0 !important;
  flex: 1 !important;
}

.v-bottom-navigation .v-btn span {
  font-size: 10px !important;
  line-height: 1.2 !important;
  margin-top: 2px !important;
}

.header-title {
  height: 100% !important;
  display: flex !important;
  align-items: center !important;
}

.header-content {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  height: 100% !important;
}

.header-logo {
  flex-shrink: 0 !important;
}

.title-logo {
  font-family: 'Orbitron', monospace !important;
  font-weight: 700 !important;
  letter-spacing: 0.5px !important;
  line-height: 1 !important;
  margin: 0 !important;
  display: flex !important;
  align-items: center !important;
}

/* Mobile header adjustments */
@media (max-width: 959px) {
  .mobile-header .header-title {
    height: 56px !important;
  }

  .mobile-header .header-content {
    height: 56px !important;
  }
}

.full-width-container {
  width: 100vw !important;
  max-width: 100vw !important;
  margin: 0 !important;
  padding-left: 8px !important;
  padding-right: 8px !important;
  position: relative;
  z-index: 1;
}

@media (min-width: 960px) {
  .full-width-container {
    width: 100% !important;
    max-width: 1200px !important;
    margin: 0 auto !important;
    padding-left: 20px !important;
    padding-right: 20px !important;
  }

  .v-navigation-drawer {
    background: #010224 !important;
    border-right: 1px solid rgba(83, 52, 131, 0.3) !important;
    backdrop-filter: blur(20px);
  }
}
</style>