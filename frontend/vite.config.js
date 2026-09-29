import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // Vitest 3 runs on its own Vite 7, which compiles JSX with esbuild.
  // The React plugin only configures Vite 8's compiler (oxc), so in tests we
  // tell esbuild to use the automatic JSX runtime (no `import React` needed).
  ...(mode === 'test' && { esbuild: { jsx: 'automatic' } }),
  server: {
    // In development, send /api to the local FastAPI server, like CloudFront
    // does in production. The frontend code only ever uses relative /api URLs.
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './vitest.setup.js',
    globals: true,
  },
}))
