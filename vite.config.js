import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Deploy at root for Vercel
  const base = './'

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
      open: true,
      // Ensure proper MIME types for WASM files in development
      headers: {
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
      },
      // Configure static file serving for ONNX Runtime WASM files
      fs: {
        allow: ['..'] // Allow serving from parent directories if needed
      }
    },
    optimizeDeps: {
      // Ensure onnxruntime-web is properly bundled
      include: ['onnxruntime-web']
    }
  }
})
