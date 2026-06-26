import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import cesium from 'vite-plugin-cesium'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), cesium()],
  resolve: {
    alias: {
      '@mall': path.resolve(__dirname, '../model/mall'),
      three: path.resolve(__dirname, 'node_modules/three'),
    },
  },
  server: {
    port: 3000,
    fs: {
      allow: [path.resolve(__dirname, '..')],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5005',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5005',
        changeOrigin: true,
      },
    },
  },
})
