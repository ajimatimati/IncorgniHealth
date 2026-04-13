import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    // Force a single React instance — prevents 'Invalid hook call' when
    // packages like @jitsi/react-sdk or @react-three/fiber bundle their own React.
    dedupe: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime'],
  },
  plugins: [
    react(),
    nodePolyfills({
      include: ['events', 'process', 'util', 'stream', 'buffer'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      }
    }),
  ],
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      }
    }
  },
})

