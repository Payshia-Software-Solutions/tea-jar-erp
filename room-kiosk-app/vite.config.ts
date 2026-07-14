import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true, // test in dev mode
      },
      manifest: {
        name: 'Room Kiosk App',
        short_name: 'RoomKiosk',
        description: 'Hotel & Service Center Room Kiosk',
        theme_color: '#E8410A',
        background_color: '#F4F5F7',
        display: 'standalone',
        icons: [
          {
            src: '/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  server: {
    host: true, // Expose to local network
    proxy: {
      '/api': {
        target: 'http://localhost/rapair-management/server/public',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
        secure: false, // Don't verify SSL for local proxy
      },
    },
  },
})
