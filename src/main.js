import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'
import './styles/global.scss'
import './styles/buttons.scss'
import { useUserStore } from './stores/user'
import GameButton from './components/GameButton.vue'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(vuetify)

// Register global components
app.component('GameButton', GameButton)

// Initialize authentication before mounting
const userStore = useUserStore()
userStore.initializeAuth()

app.mount('#app')