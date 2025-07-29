// src/main.ts
import { createApp } from 'vue'
import App from './App.vue'
import { createVuetify } from 'vuetify'
import "vuetify/styles/main.css"
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'

const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi },
  },
})

createApp(App).use(vuetify).mount('#app')
