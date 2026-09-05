import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  esbuild: {
    logOverride: {
      'Module level directives cause errors when bundled': 'silent',
    },
  },
});
