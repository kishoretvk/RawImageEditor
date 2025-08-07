import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Allow overriding base path via env. On Vercel, set VITE_BASE_PATH='/' when deploying at root.
  const base = env.VITE_BASE_PATH || '/RawImageEditor/'

  return {
    plugins: [react()],
    base,
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
      // Raise limit to avoid noisy warnings from ONNX/runtime and demo assets
      chunkSizeWarningLimit: 3000,
      rollupOptions: {
        output: {
          // Ensure unique asset file names (avoid map overwrite message)
          assetFileNames: (assetInfo) => {
            const name = assetInfo.name || 'asset'
            const ext = name.includes('.') ? name.split('.').pop() : 'bin'
            return `assets/[name]-[hash].${ext}`
          },
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
  }
})
