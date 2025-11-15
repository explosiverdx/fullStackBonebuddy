import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        credentials: true,
      },
      '/api/v1/admin/allocate-session': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        credentials: true,
      },
      '/uploads': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        credentials: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          jspdf: ['jspdf'],
          xlsx: ['xlsx'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
})
