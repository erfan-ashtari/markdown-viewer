import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
// @ts-ignore — auto-generated
import { pluginAliasPaths } from './src/generated-plugin-aliases'

// Resolve relative paths from core/ directory
const pluginAliases: Record<string, string> = {}
for (const [key, relativePath] of Object.entries(pluginAliasPaths)) {
  pluginAliases[key] = path.resolve(__dirname, relativePath)
}

export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@mdview/plugin-api': path.resolve(__dirname, '../plugin-api/src'),
      ...pluginAliases,
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        settings: path.resolve(__dirname, 'settings.html'),
      },
    },
  },
  server: {
    port: 3000,
    strictPort: true,
  },
})
