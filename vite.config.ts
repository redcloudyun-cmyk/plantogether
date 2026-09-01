/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Served from https://redcloudyun-cmyk.github.io/plantogether/ on GitHub Pages;
  // keep the base at "/" for local dev.
  base: process.env.GITHUB_ACTIONS ? '/plantogether/' : '/',
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
