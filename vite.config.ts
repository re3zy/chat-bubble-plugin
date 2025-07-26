import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // Allow connections from Sigma (iframe)
    host: true,
    headers: {
      // Required for iframe embedding
      'X-Frame-Options': 'ALLOWALL'
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Enable source maps for debugging
    sourcemap: true,
    // Optimize for embedding
    cssCodeSplit: false
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@types': path.resolve(__dirname, './src/types'),
      '@utils': path.resolve(__dirname, './src/utils')
    }
  }
})