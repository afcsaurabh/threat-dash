import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// VITE_BASE is set by GitHub Actions for Pages deployment (/threat-dash/).
// Local dev leaves it unset → defaults to '/'.
const base = process.env.VITE_BASE || '/'

export default defineConfig({
  plugins: [react()],
  base,
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
})
