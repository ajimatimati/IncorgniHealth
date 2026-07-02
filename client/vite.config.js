import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { VitePWA } from 'vite-plugin-pwa';

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
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'logo.png'],
      manifest: {
        name: "IncogniCare",
        short_name: "IncogniCare",
        description: "Anonymous healthcare built on zero-knowledge identity. Your health, your secret.",
        start_url: "/",
        display: "standalone",
        background_color: "#0a0a1a",
        theme_color: "#7c3aed",
        orientation: "portrait-primary",
        icons: [
          {
            src: "/favicon.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "/logo.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        navigateFallbackDenylist: [/^\/api/]
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

