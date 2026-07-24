#!/usr/bin/env node
// Bundles src/fore-codemirror.js + all its (isolated, sub-package-local) dependencies
// into a single self-contained ESM file, the same way jinn-codemirror-bundle.js is
// produced for @jinntec/jinn-codemirror - so a demo page can load it via a plain
// <script type="module"> with no bare specifiers to resolve and no dependency on
// Fore's own build pipeline, even when opened as a static file.

import * as esbuild from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

await esbuild.build({
  entryPoints: [path.resolve(__dirname, '../src/fore-codemirror.js')],
  outfile: path.resolve(__dirname, '../dist/fore-codemirror-bundle.js'),
  bundle: true,
  format: 'esm',
  sourcemap: true,
  target: 'es2022',
  logLevel: 'info',
});
