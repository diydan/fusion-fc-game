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
      <v-app-bar-title class="text-h6 font-weight-bold">
        <v-icon class="me-2" color="primary">mdi-soccer</v-icon>
        Fusion FC
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
      <v-app-bar-title class="text-h5 font-weight-bold">
        <v-icon class="me-2" color="primary" size="28">mdi-soccer</v-icon>
        Fusion FC Game
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
          <v-list-item to="/Theme ">
            <v-list-item-title>Theme  </v-list-item-title>
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

        <v-divider class="my-2"></v-divider>

        <v-list-item
          prepend-icon="mdi-palette"
          title="Theme  "
          to="/Theme "
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
  background: #090979 !important;
  backdrop-filter: blur(10px);
  border-right: 1px solid rgba(0, 63, 237, 0.5) !important;
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
  background: #1048ac !important;
  border-bottom: 1px solid rgba(0, 63, 237, 0.5) !important;
  backdrop-filter: blur(10px);
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
  background: #1048ac !important;
  border-bottom: 1px solid rgba(0, 63, 237, 0.5) !important;
  backdrop-filter: blur(10px);
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
  background: #090979 !important;
  border-top: 1px solid rgba(0, 63, 237, 0.5) !important;
  backdrop-filter: blur(10px);
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
    background: #090979 !important;
    border-right: 1px solid rgba(0, 63, 237, 0.5) !important;
    backdrop-filter: blur(10px);
  }
}
</style>