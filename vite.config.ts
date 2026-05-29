import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { visualizer } from 'rollup-plugin-visualizer'
import viteCompression from 'vite-plugin-compression'
import { nitro } from 'nitro/vite'
import { existsSync, mkdirSync, cpSync } from 'node:fs'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [
    tailwindcss(),
    tanstackStart({
      spa: {
        enabled: true,
      },
    }),
    react(),
    ...(command === 'build'
      ? [
          nitro({
            preset: 'vercel',
            prerender: {
              routes: [],
              crawlLinks: false,
            },
          }),
          {
            name: 'nitro-ssr-bridge',
            closeBundle() {
              const srcDir = 'node_modules/.nitro/vite/services/ssr'
              if (!existsSync(srcDir)) return
              const destDir = 'dist/server'
              mkdirSync(destDir, { recursive: true })
              cpSync(srcDir, destDir, { recursive: true })
            },
          },
        ]
      : []),
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
    }),
    visualizer({
      open: false,
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
}))
