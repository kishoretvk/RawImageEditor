import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/RawImageEditor/', // Set the base path to match your GitHub Pages repository
  assetsInclude: ['**/*.js', '**/*.css', '**/*.jpg', '**/*.png'], // Include image files
  publicDir: 'src/assets/images', // Specify the directory for static assets
})