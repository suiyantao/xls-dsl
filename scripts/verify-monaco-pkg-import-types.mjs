import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = '/Users/suiyantao/Documents/GitHub/xls-dsl';
const filePath = path.join(
  repoRoot,
  'src/app/plugin/monaco-editor/monaco-editor.component.ts',
);
const source = readFileSync(filePath, 'utf8');

assert.match(source, /pkgImportPattern/, 'should define a pkg.import detection pattern');
assert.match(source, /pkg\\\.import\\\(/, 'should inspect pkg.import calls via regex');
assert.match(source, /pkgImportTypeCache\s*=\s*new Map/, 'should keep a cache map for imported package types');
assert.match(source, /name@version|packageKey/, 'should build a package key from name and version');
assert.match(source, /addExtraLib\(/, 'should inject extra libs for package typings');
assert.match(source, /refreshPkgImportTypeRegistry\(/, 'should generate pkg.import type registry declarations');
assert.match(source, /typeof import\(/, 'should bridge pkg.import overloads to imported module types');
assert.match(source, /hasDefaultExport/, 'should detect runtime default exports from esm.sh');
assert.match(source, /default:\s*\$?\{?importedType\}?|default:\s*typeof import\(/, 'should augment overloads with default when runtime module exports default');
assert.match(source, /esm\.sh/, 'should fetch types from esm.sh');
assert.match(source, /interface PkgImportTypeRegistry/, 'should augment a mergeable pkg import type registry');

const extraLibPath = path.join(repoRoot, 'src-tauri/data/extraLib.d.ts');
const extraLibSource = readFileSync(extraLibPath, 'utf8');
assert.match(extraLibSource, /interface PkgImportApi/, 'extra lib should declare a mergeable PkgImportApi interface');
assert.match(extraLibSource, /interface PkgImportTypeRegistry \{\}/, 'extra lib should declare an empty PkgImportTypeRegistry interface');
assert.match(extraLibSource, /declare const pkg: PkgImportApi;/, 'pkg constant should reference PkgImportApi');
assert.match(extraLibSource, /keyof PkgImportTypeRegistry/, 'pkg import return type should be driven by the registry');

console.log('Monaco pkg.import type injection is configured.');
