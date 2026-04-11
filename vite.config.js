import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  define: {
    // Explicitly bake Sentry DSN from process.env so Vercel's injected env
    // vars are picked up even when .env files are absent in the build context.
    __SENTRY_DSN__: JSON.stringify(process.env.VITE_SENTRY_DSN || '')
  }
})
