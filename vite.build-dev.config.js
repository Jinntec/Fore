import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';

const { version } = JSON.parse(readFileSync('./package.json', 'utf-8'));

function versionInject() {
  return {
    name: 'version-inject',
    transform(code) {
      if (!code.includes('[VI]')) return null;
      const date = new Date().toISOString().split('T')[0];
      return {
        code: code.replace(/\[VI\].*?\[\/VI\]/gs, `Version: ${version} - built on ${date}`),
        map: null,
      };
    },
  };
}

export default defineConfig({
  plugins: [versionInject()],
  publicDir: false,
  build: {
    lib: {
      entry: './index.js',
      formats: ['es'],
      fileName: 'fore-dev',
    },
    outDir: 'dist',
    emptyOutDir: false,
    minify: 'esbuild',
    target: 'es2020',
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        entryFileNames: 'fore-dev.js',
      },
    },
  },
});
