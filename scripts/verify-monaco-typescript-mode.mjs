import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = '/Users/suiyantao/Documents/GitHub/xls-dsl';
const filePath = path.join(
  repoRoot,
  'src/app/plugin/monaco-editor/monaco-editor.component.ts',
);
const source = readFileSync(filePath, 'utf8');

assert.match(source, /language:\s*"typescript"/, 'editor language should be typescript');
assert.match(
  source,
  /typescriptDefaults\.setModeConfiguration\(/,
  'should configure typescriptDefaults',
);
assert.doesNotMatch(
  source,
  /javascriptDefaults\.setModeConfiguration\(/,
  'should not configure javascriptDefaults anymore',
);
assert.match(
  source,
  /registerCompletionItemProvider\("typescript",/,
  'completion provider should register for typescript',
);
assert.match(
  source,
  /typescriptDefaults\.addExtraLib\(/,
  'extra lib should attach to typescriptDefaults',
);
assert.match(
  source,
  /typescriptDefaults\.setCompilerOptions\(/,
  'should configure TypeScript compiler options',
);
assert.match(source, /module:\s*monaco\.languages\.typescript\.ModuleKind\.ESNext/, 'module should be ESNext');
assert.match(source, /target:\s*monaco\.languages\.typescript\.ScriptTarget\.ES2022/, 'target should allow top-level await');
assert.match(
  source,
  /typescriptDefaults\.setDiagnosticsOptions\(/,
  'should configure TypeScript diagnostics options',
);
assert.match(
  source,
  /setModeConfiguration\([\s\S]*hover:\s*true/,
  'hover should be enabled in modeConfiguration',
);
assert.match(source, /setModelLanguage\(/, 'should force the current model language to typescript');
assert.match(source, /Uri\.parse\([^)]*\.mts/, 'should assign an .mts URI so Monaco treats the file as a module');
assert.match(source, /editor\.setModel\(/, 'should replace the default anonymous model with a module-backed model');
assert.match(
  source,
  /setCompilerOptions\([\s\S]*setDiagnosticsOptions\([\s\S]*ensureTypescriptModuleModel\(/,
  'compiler and diagnostics options should be configured before replacing the model',
);

console.log('Monaco TypeScript mode is configured.');
