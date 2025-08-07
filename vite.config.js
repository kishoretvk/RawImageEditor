import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/RawImageEditor/',
  // Force workers to ESM format to avoid split-chunk + iife/umd errors
  worker: {
    format: 'es',
    rollupOptions: {
      output: {
        format: 'es'
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['react-router-dom']
        }
      }
    }
  },
  server: {
    port: 5173,
    open: true
  }
})
