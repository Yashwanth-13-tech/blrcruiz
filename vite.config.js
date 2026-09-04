import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { razorpayApiPlugin } from './server/viteApiPlugin.js'

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [
    react(),
    razorpayApiPlugin(),
  ],

  build: {
    // Target modern browsers — smaller/faster output, no legacy polyfills
    target: 'es2020',

    // Enable CSS code splitting per chunk
    cssCodeSplit: true,

    // Reduce chunk size warning threshold (keep bundles lean)
    chunkSizeWarningLimit: 600,

    rollupOptions: {
      output: {
        // Split vendor libraries into separate cacheable chunks
        manualChunks: {
          // React runtime stays in its own long-lived cache chunk
          'vendor-react': ['react', 'react-dom'],
          // Lucide icons are large — isolated so they can be cached separately
          'vendor-icons': ['lucide-react'],
        },
      },
    },
  },

  // Dev server configuration
  server: {
    hmr: true,
  },
})
