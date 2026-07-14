import { defineConfig } from 'vite';

export default defineConfig({
  appType: 'mpa',
  server: {
    open: '/doc/index.html',
    hmr: {
      overlay: false,
    },
  },
  optimizeDeps: {
    // demo/edep/*.html are Jinks/TEI-Publisher server-templated pages whose
    // script src paths only resolve after server-side generation. Vite's default
    // dependency scan crawls every *.html and aborts entirely when it hits these
    // unresolvable paths, which skips pre-bundling and forces a lazy "discover
    // new deps mid-session" reload on the first real page visit instead.
    entries: ['**/*.html', '!**/demo/edep/**'],
  },
});
