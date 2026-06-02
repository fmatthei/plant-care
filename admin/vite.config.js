import { defineConfig } from 'vite'

// Standalone admin backoffice. Runs on its own port and reuses the main app's
// Supabase credentials from the repo-root .env (envDir points one level up).
export default defineConfig({
  envDir: '..',
  server: {
    port: 5174,
  },
})
