import { defineConfig } from 'vite';

export default defineConfig({
  appType: 'mpa',
  server: {
    hmr: {
      overlay: false,
    },
  },
});
