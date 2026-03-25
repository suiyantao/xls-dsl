import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = '/Users/suiyantao/Documents/GitHub/xls-dsl';
const angularConfig = JSON.parse(
  readFileSync(path.join(repoRoot, 'angular.json'), 'utf8'),
);

const assets = angularConfig.projects['xls-dsl'].architect.build.options.assets;

const hasMonacoMin = assets.some(
  (asset) => typeof asset === 'object'
    && asset.input === 'node_modules/monaco-editor/min'
    && asset.output === 'assets/monaco-editor/min',
);

const hasMonacoMinMaps = assets.some(
  (asset) => typeof asset === 'object'
    && asset.input === 'node_modules/monaco-editor/min-maps'
    && asset.output === 'assets/monaco-editor/min-maps',
);

assert.equal(hasMonacoMin, true, 'missing monaco min asset copy');
assert.equal(
  hasMonacoMinMaps,
  true,
  'missing monaco min-maps asset copy for loader.js.map',
);

console.log('Monaco asset configuration is valid.');
