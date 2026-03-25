import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = '/Users/suiyantao/Documents/GitHub/xls-dsl';

const componentSource = readFileSync(
  path.join(repoRoot, 'src/app/plugin/monaco-editor/monaco-editor.component.ts'),
  'utf8',
);
const tauriConfig = JSON.parse(
  readFileSync(path.join(repoRoot, 'src-tauri/tauri.conf.json'), 'utf8'),
);

assert.match(
  componentSource,
  /resolveResource\("data\/extraLib\.d\.ts"\)/,
  'Monaco component should load extraLib.d.ts',
);

assert.equal(
  tauriConfig.bundle.resources.includes('data/extraLib.d.ts'),
  true,
  'Tauri bundle should include extraLib.d.ts',
);

const extraLibSource = readFileSync(
  path.join(repoRoot, 'src-tauri/data/extraLib.d.ts'),
  'utf8',
);

assert.match(extraLibSource, /declare const fs:/, 'missing global fs declaration');
assert.match(extraLibSource, /declare const http:/, 'missing global http declaration');
assert.match(extraLibSource, /declare function uuid\(/, 'missing global uuid declaration');
assert.doesNotMatch(extraLibSource, /export class HttpClient/, 'extra lib should not export HttpClient as a module export');

console.log('Monaco extra lib globals are configured.');
