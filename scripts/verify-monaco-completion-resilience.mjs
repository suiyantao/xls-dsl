import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = '/Users/suiyantao/Documents/GitHub/xls-dsl';
const filePath = path.join(
  repoRoot,
  'src/app/plugin/monaco-editor/monaco-editor.component.ts',
);
const source = readFileSync(filePath, 'utf8');

assert.match(source, /async\s+loadExtraLibText\s*\(/, 'missing loadExtraLibText helper');
assert.match(source, /registerCompletionItemProvider\("javascript"/, 'missing javascript completion provider registration');
assert.match(source, /try\s*\{[\s\S]*loadExtraLibText\(/, 'missing try/catch around extra lib loading');
assert.match(source, /console\.warn\(['"]Failed to load Monaco extra lib/, 'missing graceful warning for extra lib load failure');

console.log('Monaco completion resilience is configured.');
