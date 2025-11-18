import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.jpeg', 'image.png'],
      manifest: {
        name: 'Wasillah - Social Impact Platform',
        short_name: 'Wasillah',
        description: 'Connect students, volunteers, and NGOs for meaningful social impact projects in Pakistan',
        theme_color: '#1e3a8a',
        background_color: '#1e3a8a',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/logo.jpeg',
            sizes: '192x192',
            type: 'image/jpeg',
            purpose: 'any maskable'
          },
          {
            src: '/logo.jpeg',
            sizes: '512x512',
            type: 'image/jpeg',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,jpeg,svg,webp}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'firebase-storage-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firestore-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 // 1 hour
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: false // Disable in development for faster HMR
      }
    })
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: {
          firebase: [
            'firebase/app',
            'firebase/auth',
            'firebase/firestore',
            'firebase/storage',
          ],
          vendor: [
            'react',
            'react-dom',
            'react-router-dom',
          ],
          lucide: ['lucide-react'],
        },
      },
    },
  },
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
    },
  },
});
