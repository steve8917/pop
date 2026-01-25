import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['vite.svg', 'pwa/icon.svg', 'pwa/icon-maskable.svg'],
      manifest: {
        name: 'TepuApp - Sistema Turni',
        short_name: 'TepuApp',
        description: 'Gestione turni e chat per la testimonianza pubblica',
        start_url: '/',
        display: 'standalone',
        background_color: '#0f172a',
        theme_color: '#7c3aed',
        icons: [
          {
            src: '/pwa/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml'
          },
          {
            src: '/pwa/icon-maskable.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'maskable'
          }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true
      }
    }
  }
});
