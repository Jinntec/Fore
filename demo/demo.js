// import '@polymer/iron-demo-helpers/demo-snippet.js';
import '../index.js';

const main = async () => {
  // These imports are required to run early. Vite seems to not play nicely with the implicit
  // dependencies in polymer code
  await import('@polymer/polymer/lib/utils/boot.js');

  // Monkeypatch in marked. Polymer uses an ancient version that has ESM import issues
  const marked = await import('marked');
  window.marked = marked.default;
  for (const exp in marked) {
    window.marked[exp] = marked[exp];
  }

  await import('@polymer/polymer/polymer-legacy.js');
  await import('@polymer/marked-element/marked-element.js');
  await import('@polymer/prism-element/prism-highlighter.js');
  await import('@polymer/prism-element/prism-theme-default.js');

  await import('./js/demo-snippet-vanilla.js');

  await import('@polymer/paper-input/paper-input.js');
  await import('@polymer/paper-checkbox/paper-checkbox.js');
  await import('@polymer/paper-button/paper-button.js');
  await import('../src/lab/instance-inspector.js');
  await import('../tools/fx-lens.js');
  await import('../doc/fore-corner.js');
};
main();
