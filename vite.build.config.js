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

function minifyBundle() {
  return {
    name: 'minify-bundle',
    async renderChunk(code) {
      const { transform } = await import('esbuild');
      const result = await transform(code, {
        loader: 'js',
        minify: true,
        target: 'es2020',
        drop: ['console', 'debugger'],
      });
      return { code: result.code, map: result.map || null };
    },
  };
}

export default defineConfig({
  plugins: [versionInject()],
  publicDir: false,
  build: {
    lib: {
      entry: './index-build.js',
      formats: ['es'],
      fileName: 'fore',
    },
    outDir: 'dist',
    emptyOutDir: false,
    minify: false,
    target: 'es2020',
    rollupOptions: {
      plugins: [minifyBundle()],
      output: {
        inlineDynamicImports: true,
        entryFileNames: 'fore.js',
      },
    },
  },
});
