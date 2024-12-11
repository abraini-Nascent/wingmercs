import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  base: './',
  optimizeDeps: {
    exclude: ['@babylonjs/havok'],
    esbuildOptions: {
      target: 'esnext'
    }
  },
  server: {
    host: "0.0.0.0",
    https: true,
  },
  build: {
    outDir: 'dist/',
    assetsDir: 'assets', // Relative path to the assets directory
    rollupOptions: {
      output: {
        manualChunks: undefined // Disable chunking to avoid absolute paths in chunk names
      }
    },
    target: 'esnext'
  },
  plugins: [
    basicSsl()
  ]
})