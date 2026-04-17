import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5501,
    open: '/chat.html'
  },
  build: {
    outDir: 'dist'
  }
})
