import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    // Use jsdom to simulate a browser environment for component/hook tests
    environment: 'jsdom',
    globals: true,
    // Run lib/ and hooks/ tests only (constitution: business logic lives here)
    include: [
      'lib/**/*.test.{ts,tsx}',
      'hooks/**/*.test.{ts,tsx}',
    ],
    coverage: {
      provider: 'v8',
      include: ['lib/**/*.ts', 'hooks/**/*.ts'],
      exclude: ['lib/**/*.test.ts', 'hooks/**/*.test.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
