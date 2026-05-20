import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // `server-only` testuose mestų klaidą — aliasuojam į no-op shim'ą,
      // kad galėtume testuoti server-side modulius (pvz. view-token, rate-limit).
      'server-only': fileURLToPath(
        new URL('./src/test-utils/server-only-shim.ts', import.meta.url)
      ),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
