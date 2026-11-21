import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Libraries ship as their own files (site polish, 2026-11-21), so the app's
// own code stays small and a release only re-downloads what changed.
// No production source maps: the code is not published in readable form.
const VENDOR: [RegExp, string][] = [
  [/node_modules\/(react|react-dom|scheduler|react-router|react-router-dom)\//, 'react'],
  [/node_modules\/(motion|motion-dom|motion-utils|framer-motion)\//, 'motion'],
];

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          for (const [re, name] of VENDOR) if (re.test(id)) return name;
          return undefined;
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
  },
});
