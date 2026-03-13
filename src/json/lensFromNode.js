import { JSONLens } from './JSONLens.js';

export function lensFromNode(jsonRoot, jsonNode) {
  return new JSONLens(jsonRoot, jsonNode.getPath());
}
