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

// Vite plugin: strip woff and ttf font files from KaTeX (only woff2 needed in Electron/Chromium)
function stripLegacyFonts() {
  return {
    name: 'strip-legacy-fonts',
    generateBundle(_: any, bundle: any) {
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (fileName.endsWith('.css') && typeof (chunk as any).source === 'string') {
          (chunk as any).source = (chunk as any).source
            // Remove @font-face blocks that reference .woff (not woff2) or .ttf
            .replace(/@font-face\{[^}]*\.woff[^2][^}]*\}/g, '')
            .replace(/@font-face\{[^}]*\.ttf[^}]*\}/g, '')
        }
        // Delete woff and ttf asset files
        if (fileName.match(/KaTeX.*\.(woff|ttf)$/)) {
          delete bundle[fileName]
        }
      }
    }
  }
}

export default defineConfig({
  plugins: [react(), stripLegacyFonts()],
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
