export function createDebugId(prefix = 'fx') {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function now() {
  return performance.now();
}

export function isDebugEnabled(element) {
  const fore = element?.closest?.('fx-fore');
  return fore?.hasAttribute?.('debug') || fore?.hasAttribute?.('devtools');
}
