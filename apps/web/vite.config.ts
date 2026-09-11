import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// On GitHub Pages the app is served from /treasure-box-inventory/; locally from
// root. `base` prefixes all built asset URLs and is exposed as BASE_URL.
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/treasure-box-inventory/' : '/',
  plugins: [react(), tailwindcss()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'supabase', test: /node_modules[\\/]@supabase[\\/]/ },
            { name: 'dexie', test: /node_modules[\\/]dexie[\\/]/ },
          ],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts'
  }
}));
