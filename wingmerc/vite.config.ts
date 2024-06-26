import { defineConfig } from 'vite';
export default defineConfig({
  base: './',
  optimizeDeps: {
    exclude: ['@babylonjs/havok'],
    esbuildOptions: {
      target: 'esnext'
    }
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
  }
})