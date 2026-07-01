import { defineConfig } from 'vite';

export default defineConfig({
  appType: 'mpa',
  server: {
    open: '/doc/index.html',
    hmr: {
      overlay: false,
    },
  },
});
