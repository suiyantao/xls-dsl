# Local TypeScript Module Loader Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让主脚本文本与其本地依赖模块可以直接使用 TypeScript 语法运行。

**Architecture:** 把主脚本文本改为先落成临时 `file://` 入口，再统一交给自定义 loader 处理。loader 负责识别本地 TS 文件并转译成 JS，远程 `esm.sh` 分支保持现有行为不变。

**Tech Stack:** Rust、`deno_core`、自定义 `ModuleLoader`、TypeScript 转译库（建议 `deno_ast`）

---

## Chunk 1: TS 转译最小能力

### Task 1: 增加 TS 转译辅助函数

**Files:**
- Modify: `src-tauri/Cargo.toml`
- Modify: `src-tauri/src/deno/loader.rs`
- Test: `src-tauri/src/deno/loader.rs`

- [ ] **Step 1: 写失败测试**

在 `src-tauri/src/deno/loader.rs` 新增测试：

- `transpile_typescript_source_removes_type_annotations`

示例源码：

```ts
const name: string = "ok";
export { name };
```

断言转译结果不再包含 `: string`，且仍包含可执行 JS。

- [ ] **Step 2: 运行测试确认失败**

Run: `cargo test --manifest-path src-tauri/Cargo.toml transpile_typescript_source_removes_type_annotations -- --nocapture`  
Expected: FAIL。

- [ ] **Step 3: 写最小实现**

在 `src-tauri/src/deno/loader.rs` 增加独立的 TS 转译辅助函数，并在 `Cargo.toml` 引入所需依赖。

- [ ] **Step 4: 运行测试确认通过**

Run: `cargo test --manifest-path src-tauri/Cargo.toml transpile_typescript_source_removes_type_annotations -- --nocapture`  
Expected: PASS。

## Chunk 2: Loader 识别本地 TS 文件

### Task 2: 让 loader 区分本地 TS / JS

**Files:**
- Modify: `src-tauri/src/deno/loader.rs`
- Test: `src-tauri/src/deno/loader.rs`

- [ ] **Step 1: 写失败测试**

补以下测试：

- `loader_identifies_ts_extensions_for_transpile`
- `loader_keeps_js_extensions_as_javascript`

- [ ] **Step 2: 运行测试确认失败**

Run: `cargo test --manifest-path src-tauri/Cargo.toml loader_identifies_ts_ -- --nocapture && cargo test --manifest-path src-tauri/Cargo.toml loader_keeps_js_ -- --nocapture`  
Expected: FAIL。

- [ ] **Step 3: 写最小实现**

在 loader 中增加扩展名判断函数，只覆盖本次设计列出的 TS / JS 扩展名。

- [ ] **Step 4: 运行测试确认通过**

Run: `cargo test --manifest-path src-tauri/Cargo.toml loader_identifies_ts_ -- --nocapture && cargo test --manifest-path src-tauri/Cargo.toml loader_keeps_js_ -- --nocapture`  
Expected: PASS。

## Chunk 3: 本地文件加载与转译

### Task 3: 让 `file:` 模块支持本地 TS/JS 读取

**Files:**
- Modify: `src-tauri/src/deno/loader.rs`
- Test: `src-tauri/src/deno/loader.rs`

- [ ] **Step 1: 写失败测试**

补以下测试：

- `loader_loads_local_typescript_module_as_javascript`
- `loader_loads_local_javascript_module_without_transpile`

使用临时文件夹分别创建 `.ts` 和 `.js` 文件。

- [ ] **Step 2: 运行测试确认失败**

Run: `cargo test --manifest-path src-tauri/Cargo.toml loader_loads_local_ -- --nocapture`  
Expected: FAIL。

- [ ] **Step 3: 写最小实现**

在 `load()` 的 `file:` 分支：

- 读取源码
- TS 文件走转译
- JS 文件原样返回

- [ ] **Step 4: 运行测试确认通过**

Run: `cargo test --manifest-path src-tauri/Cargo.toml loader_loads_local_ -- --nocapture`  
Expected: PASS。

## Chunk 4: 主脚本入口改走统一 loader

### Task 4: 让主脚本文本也按 TS 文件路径执行

**Files:**
- Modify: `src-tauri/src/deno/lib.rs`
- Test: `src-tauri/src/deno/lib.rs`

- [ ] **Step 1: 写失败测试**

补以下测试：

- `main_typescript_script_executes_successfully`

示例脚本：

```ts
const name: string = "ok";
console.log(name);
```

- [ ] **Step 2: 运行测试确认失败**

Run: `cargo test --manifest-path src-tauri/Cargo.toml main_typescript_script_executes_successfully -- --nocapture`  
Expected: FAIL。

- [ ] **Step 3: 写最小实现**

在 `lib.rs` 中：

- 以 `dirname(xlx_template)` 作为依赖基准目录
- 在其下创建独立临时目录
- 写入 `main.ts`
- 用 `load_main_es_module` 走 `file://.../main.ts`
- 执行结束后清理临时目录

- [ ] **Step 4: 运行测试确认通过**

Run: `cargo test --manifest-path src-tauri/Cargo.toml main_typescript_script_executes_successfully -- --nocapture`  
Expected: PASS。

## Chunk 5: 本地依赖模块链路

### Task 5: 支持主脚本导入本地 `.ts` 依赖

**Files:**
- Modify: `src-tauri/src/deno/lib.rs`
- Modify: `src-tauri/src/deno/loader.rs`
- Test: `src-tauri/src/deno/lib.rs`

- [ ] **Step 1: 写失败测试**

补以下测试：

- `main_typescript_script_imports_local_ts_dependency`
- `main_typescript_script_imports_nested_local_ts_dependency`
- `main_typescript_script_imports_local_js_dependency`
- `main_typescript_script_resolves_relative_to_xlx_template_parent`

- [ ] **Step 2: 运行测试确认失败**

Run: `cargo test --manifest-path src-tauri/Cargo.toml main_typescript_script_imports_ -- --nocapture`  
Expected: FAIL。

- [ ] **Step 3: 写最小实现**

只修复本地依赖解析与转译链路所需的最小问题，不改远程模块逻辑。

- [ ] **Step 4: 运行测试确认通过**

Run: `cargo test --manifest-path src-tauri/Cargo.toml main_typescript_script_imports_ -- --nocapture`  
Expected: PASS。

## Chunk 6: 错误处理与回归

### Task 6: TS 编译错误可读并做回归验证

**Files:**
- Modify: `src-tauri/src/deno/loader.rs`
- Modify: `src-tauri/src/deno/lib.rs`
- Modify: `README.md`

- [ ] **Step 1: 写失败测试**

补以下测试：

- `main_typescript_script_reports_transpile_error`
- `pure_javascript_script_still_executes_after_ts_support`
- `pkg_import_still_works_after_local_ts_support`
- `temporary_main_ts_directory_is_cleaned_up`

- [ ] **Step 2: 运行测试确认失败**

Run: `cargo test --manifest-path src-tauri/Cargo.toml main_typescript_script_reports_transpile_error -- --nocapture && cargo test --manifest-path src-tauri/Cargo.toml pure_javascript_script_still_executes_after_ts_support -- --nocapture`  
Expected: FAIL。

- [ ] **Step 3: 写最小实现**

补清晰错误信息，并确保现有 JS 路径不回退。

- [ ] **Step 4: 更新 README**

说明当前支持“主脚本 + 本地依赖模块”的 TS 直接运行，以及暂不支持远程 TS 模块。

- [ ] **Step 5: 运行最终定向验证**

Run:

- `cargo test --manifest-path src-tauri/Cargo.toml main_typescript_ -- --nocapture`
- `cargo test --manifest-path src-tauri/Cargo.toml loader_ -- --nocapture`

Expected: 全部 PASS。
