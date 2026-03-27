# Monaco TypeScript Mode Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 Monaco 编辑器固定运行在 TypeScript 模式，并使现有类型提示与自定义补全在该模式下生效。

**Architecture:** 不改 Monaco 封装结构，只在现有组件里把默认语言、语言服务 defaults 和补全注册从 JavaScript 切到 TypeScript，再用轻量脚本做配置回归验证。

**Tech Stack:** Angular、Monaco Editor、TypeScript、Node 校验脚本

---

## Chunk 1: 固定 TypeScript 模式

### Task 1: 切换编辑器默认语言与语言服务入口

**Files:**
- Modify: `src/app/plugin/monaco-editor/monaco-editor.component.ts`
- Test: `scripts/verify-monaco-typescript-mode.mjs`

- [ ] **Step 1: 写失败测试**

新增脚本 `scripts/verify-monaco-typescript-mode.mjs`，断言：

- `editorOptions.language` 为 `typescript`
- 使用 `typescriptDefaults.setModeConfiguration(...)`
- 不再依赖 `javascriptDefaults.setModeConfiguration(...)`

- [ ] **Step 2: 运行测试确认失败**

Run: `node scripts/verify-monaco-typescript-mode.mjs`  
Expected: FAIL。

- [ ] **Step 3: 写最小实现**

在 `src/app/plugin/monaco-editor/monaco-editor.component.ts`：

- 改 `language: "typescript"`
- 把 `javascriptDefaults.setModeConfiguration(...)` 改成 `typescriptDefaults.setModeConfiguration(...)`

- [ ] **Step 4: 运行测试确认通过**

Run: `node scripts/verify-monaco-typescript-mode.mjs`  
Expected: PASS。

## Chunk 2: 补全和额外类型声明切到 TS

### Task 2: 让自定义补全与 extraLib 跟随 TS 模式

**Files:**
- Modify: `src/app/plugin/monaco-editor/monaco-editor.component.ts`
- Test: `scripts/verify-monaco-typescript-mode.mjs`

- [ ] **Step 1: 写失败测试**

扩展同一个脚本，额外断言：

- `registerCompletionItemProvider("typescript", ...)`
- `typescriptDefaults.addExtraLib(...)`

- [ ] **Step 2: 运行测试确认失败**

Run: `node scripts/verify-monaco-typescript-mode.mjs`  
Expected: FAIL。

- [ ] **Step 3: 写最小实现**

在组件中：

- 把补全 provider 注册目标从 `javascript` 改成 `typescript`
- 把 `addExtraLib(...)` 挂到 `typescriptDefaults`

- [ ] **Step 4: 运行测试确认通过**

Run: `node scripts/verify-monaco-typescript-mode.mjs`  
Expected: PASS。

## Chunk 3: 最终验证

### Task 3: 做构建与类型回归

**Files:**
- None

- [ ] **Step 1: 运行回归脚本**

Run: `node scripts/verify-monaco-typescript-mode.mjs`

- [ ] **Step 2: 运行前端类型检查**

Run: `npx tsc -p tsconfig.app.json --noEmit`

- [ ] **Step 3: 运行前端构建**

Run: `npm run build`

- [ ] **Step 4: 记录交付说明**

在最终交付中说明：Monaco 现在固定为 TypeScript 模式，未来若要支持切换需单独设计。
