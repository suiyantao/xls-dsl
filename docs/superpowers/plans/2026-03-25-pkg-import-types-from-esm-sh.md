# pkg.import Types From esm.sh Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 Monaco 能基于 `esm.sh` 自动为 `pkg.import(name, version)` 注入第三方包类型，并为字面量包名/版本生成对应的返回类型提示。

**Architecture:** 在 Monaco 组件内扫描 `pkg.import("name", "version")`，按 `esm.sh` 拉取 `.d.ts` 入口及依赖，再通过 `addExtraLib(...)` 注入类型；同时生成 `pkg.import` overload 声明，把具体 `name@version` 绑定到对应虚拟模块类型。

**Tech Stack:** Angular、Monaco Editor、TypeScript、`esm.sh`、Node 校验脚本

---

## Chunk 1: 代码扫描与失败校验

### Task 1: 提取 `pkg.import("name", "version")` 字面量调用

**Files:**
- Modify: `src/app/plugin/monaco-editor/monaco-editor.component.ts`
- Test: `scripts/verify-monaco-pkg-import-types.mjs`

- [ ] **Step 1: 写失败测试**

新增脚本 `scripts/verify-monaco-pkg-import-types.mjs`，断言组件里存在：

- `pkg.import` 代码扫描逻辑
- `name@version` 去重集合

- [ ] **Step 2: 运行测试确认失败**

Run: `node scripts/verify-monaco-pkg-import-types.mjs`  
Expected: FAIL。

- [ ] **Step 3: 写最小实现**

在组件里新增 helper，提取字面量形式的 `pkg.import("name", "version")`。

- [ ] **Step 4: 运行测试确认通过**

Run: `node scripts/verify-monaco-pkg-import-types.mjs`  
Expected: PASS。

## Chunk 2: 从 esm.sh 拉取并注入 `.d.ts`

### Task 2: 增加类型获取与 `addExtraLib` 注入

**Files:**
- Modify: `src/app/plugin/monaco-editor/monaco-editor.component.ts`
- Test: `scripts/verify-monaco-pkg-import-types.mjs`

- [ ] **Step 1: 写失败测试**

扩展脚本，断言组件中存在：

- `esm.sh` 类型请求逻辑
- `addExtraLib(...)` 注入逻辑
- 基于虚拟 URI 的缓存结构

- [ ] **Step 2: 运行测试确认失败**

Run: `node scripts/verify-monaco-pkg-import-types.mjs`  
Expected: FAIL。

- [ ] **Step 3: 写最小实现**

在组件里：

- 拉取 `.d.ts` 主入口
- 递归获取相对依赖
- 用稳定虚拟 URI 调 `addExtraLib(...)`

- [ ] **Step 4: 运行测试确认通过**

Run: `node scripts/verify-monaco-pkg-import-types.mjs`  
Expected: PASS。

## Chunk 3: 生成 `pkg.import` overload

### Task 3: 把具体 `name@version` 绑定到模块返回类型

**Files:**
- Modify: `src/app/plugin/monaco-editor/monaco-editor.component.ts`
- Test: `scripts/verify-monaco-pkg-import-types.mjs`

- [ ] **Step 1: 写失败测试**

扩展脚本，断言组件里存在：

- `declare const pkg` 的 overload 生成逻辑
- `typeof import("ts:pkg-import-types/..." )` 的返回类型桥接

- [ ] **Step 2: 运行测试确认失败**

Run: `node scripts/verify-monaco-pkg-import-types.mjs`  
Expected: FAIL。

- [ ] **Step 3: 写最小实现**

根据当前已识别到的 `name@version` 集合生成额外声明，并通过 `addExtraLib(...)` 注入。

- [ ] **Step 4: 运行测试确认通过**

Run: `node scripts/verify-monaco-pkg-import-types.mjs`  
Expected: PASS。

## Chunk 4: 最终验证

### Task 4: 做前端回归验证

**Files:**
- None

- [ ] **Step 1: 运行 pkg.import 类型脚本**

Run: `node scripts/verify-monaco-pkg-import-types.mjs`

- [ ] **Step 2: 运行现有 Monaco 配置回归**

Run: `node scripts/verify-monaco-typescript-mode.mjs && node scripts/verify-monaco-extra-lib-globals.mjs`

- [ ] **Step 3: 运行前端类型检查**

Run: `npx tsc -p tsconfig.app.json --noEmit`

- [ ] **Step 4: 运行前端构建**

Run: `npm run build`

- [ ] **Step 5: 记录限制**

在最终交付中说明：目前只支持字面量 `pkg.import("name", "version")` 的自动类型注入。
