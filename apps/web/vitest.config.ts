import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.tsx'],
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '.next/',
        'tests/setup.tsx',
        '**/*.d.ts',
        '**/*.config.*',
        '**/types/**',
        'app/**', // Exclude app routes from coverage for now
        'hooks/**', // Hooks require more complex mocking
        'lib/db/**', // Database setup
        'lib/cache/**', // Cache utilities
        'lib/cloudinary/**', // External service
        'lib/pusher/**', // External service
        'lib/qr/**', // QR code generation
        'lib/auth/auth.ts', // Auth config file
        'lib/api/error-handler.ts', // Will test with API tests
        'lib/query/**', // Query client setup
        'lib/actions/**', // Server actions
        'stores/**', // State stores
      ],
      include: [
        'components/**/*.{ts,tsx}',
        'lib/utils.ts',
        'lib/validations/**/*.{ts,tsx}',
      ],
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
