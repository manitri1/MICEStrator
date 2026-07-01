import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  root: 'E:/work/ClaudeCode/MICEstrator',
  test: {
    root: 'E:/work/ClaudeCode/MICEstrator',
    environment: 'node',
    globals: true,
    setupFiles: [],
    pool: 'forks',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['lib/**/*.ts', 'components/**/*.tsx', 'app/api/**/*.ts'],
      exclude: ['lib/db/**', 'lib/prompts/**', '**/*.d.ts'],
    },
  },
  resolve: {
    alias: {
      '@': 'E:/work/ClaudeCode/MICEstrator',
    },
  },
})
