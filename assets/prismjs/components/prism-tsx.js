/// BareSpecifier=prismjs/components/prism-tsx
var typescript = Prism.util.clone(Prism.languages.typescript);
Prism.languages.tsx = Prism.languages.extend('jsx', typescript);