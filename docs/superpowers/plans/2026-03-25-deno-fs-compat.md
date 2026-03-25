# Deno FS Compatibility Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为当前内嵌运行时补齐常用 `Deno.*` 文件读写 API，并同时支持文本与二进制数据。

**Architecture:** 运行时 JS 层负责提供接近标准 Deno 的 API 形状与参数校验；Rust 层只增加最小二进制读写 op，文本读写继续复用现有字符串 op。Monaco 类型声明同步扩展到新的 `Deno.*` 方法。

**Tech Stack:** Rust、`deno_core`、Tauri、TypeScript、Monaco 类型声明

---

## Chunk 1: 二进制 op

### Task 1: 补齐 Rust 二进制读写 op

**Files:**
- Modify: `src-tauri/src/deno/fs_funs.rs`
- Modify: `src-tauri/src/deno/funs.rs`
- Test: `src-tauri/src/deno/fs_funs.rs`

- [ ] **Step 1: 写失败测试**

在 `src-tauri/src/deno/fs_funs.rs` 新增 Rust 单元测试：

- `op_fs_write_binary_creates_parent_dirs`
- `op_fs_read_binary_round_trips_bytes`

直接验证二进制 op 的字节读写与目录创建语义。

- [ ] **Step 2: 运行测试确认失败**

Run: `cargo test --manifest-path src-tauri/Cargo.toml op_fs_write_binary_ -- --nocapture && cargo test --manifest-path src-tauri/Cargo.toml op_fs_read_binary_ -- --nocapture`  
Expected: FAIL，错误为 op 尚未实现。

- [ ] **Step 3: 实现最小二进制 op**

在 `src-tauri/src/deno/fs_funs.rs` 增加：

- `op_fs_read_binary`
- `op_fs_write_binary`

并在 `src-tauri/src/deno/funs.rs` 注册。

- [ ] **Step 4: 运行测试确认仍失败但失败位置前移**

Run: `cargo test --manifest-path src-tauri/Cargo.toml op_fs_write_binary_ -- --nocapture && cargo test --manifest-path src-tauri/Cargo.toml op_fs_read_binary_ -- --nocapture`  
Expected: PASS。

## Chunk 2: JS 兼容层

### Task 2: 暴露 `Deno.write*` / `Deno.read*` API

**Files:**
- Modify: `src-tauri/src/runtime.js`
- Test: `src-tauri/src/deno/lib.rs`

- [ ] **Step 1: 写失败测试**

补以下测试：

- `deno_write_text_file_sync_round_trips_string`
- `deno_write_file_sync_round_trips_uint8array`
- `deno_write_text_file_async_round_trips_string`
- `deno_write_file_async_round_trips_uint8array`
- `deno_write_file_sync_preserves_deno_core`

- [ ] **Step 2: 运行测试确认失败**

Run: `cargo test --manifest-path src-tauri/Cargo.toml deno_write_ -- --nocapture`  
Expected: FAIL；不要假设一定是 `is not a function`，因为当前 `runtime.js` 已有 `writeFileSync` 空实现。

- [ ] **Step 3: 实现最小 JS 兼容层**

在 `src-tauri/src/runtime.js`：

- 扩展 `globalThis.Deno`
- 不覆盖 `Deno.core`
- 复用文本 op 实现 `readTextFile*` / `writeTextFile*`
- 调用新二进制 op 实现 `readFile*` / `writeFile*`
- 对 `string` / `ArrayBuffer` / `Uint8Array` 做最小转换
- `async` 版本首版用 `Promise.resolve(...)` 包装同步实现

- [ ] **Step 4: 运行测试确认通过**

Run: `cargo test --manifest-path src-tauri/Cargo.toml deno_write_ -- --nocapture`  
Expected: PASS。

## Chunk 3: 参数校验与回归

### Task 3: 收敛类型错误与兼容边界

**Files:**
- Modify: `src-tauri/src/runtime.js`
- Test: `src-tauri/src/deno/lib.rs`

- [ ] **Step 1: 写失败测试**

补以下测试：

- `deno_write_file_rejects_invalid_data_type`
- `deno_write_text_file_rejects_non_string`
- `deno_read_text_file_sync_round_trips_string`
- `deno_read_file_sync_returns_uint8array`
- `deno_write_file_accepts_array_buffer`
- `deno_write_file_string_encodes_utf8`

- [ ] **Step 2: 运行测试确认失败**

Run: `cargo test --manifest-path src-tauri/Cargo.toml deno_read_ -- --nocapture && cargo test --manifest-path src-tauri/Cargo.toml deno_write_file_rejects_ -- --nocapture && cargo test --manifest-path src-tauri/Cargo.toml deno_write_text_file_rejects_non_string -- --nocapture && cargo test --manifest-path src-tauri/Cargo.toml deno_write_file_accepts_array_buffer -- --nocapture && cargo test --manifest-path src-tauri/Cargo.toml deno_write_file_string_encodes_utf8 -- --nocapture`  
Expected: FAIL。

- [ ] **Step 3: 实现最小参数校验**

补清晰 `TypeError`，并保证 `readFile*` 返回 `Uint8Array`。

- [ ] **Step 4: 运行测试确认通过**

Run: `cargo test --manifest-path src-tauri/Cargo.toml deno_read_ -- --nocapture && cargo test --manifest-path src-tauri/Cargo.toml deno_write_file_rejects_ -- --nocapture && cargo test --manifest-path src-tauri/Cargo.toml deno_write_text_file_rejects_non_string -- --nocapture && cargo test --manifest-path src-tauri/Cargo.toml deno_write_file_accepts_array_buffer -- --nocapture && cargo test --manifest-path src-tauri/Cargo.toml deno_write_file_string_encodes_utf8 -- --nocapture`  
Expected: PASS。

## Chunk 4: Monaco 类型提示

### Task 4: 扩展 `extraLib.d.ts` 的 `Deno.*` 声明

**Files:**
- Modify: `src-tauri/data/extraLib.d.ts`
- Modify: `scripts/verify-monaco-extra-lib-globals.mjs`

- [ ] **Step 1: 写失败测试**

扩展现有脚本 `scripts/verify-monaco-extra-lib-globals.mjs`，断言 `extraLib.d.ts` 中存在本次 8 个 `Deno.*` API 的声明。

- [ ] **Step 2: 运行测试确认失败**

Run: `node scripts/verify-monaco-extra-lib-globals.mjs`  
Expected: FAIL。

- [ ] **Step 3: 写最小类型声明**

在 `src-tauri/data/extraLib.d.ts` 为 `Deno` 增加最小声明，覆盖本次 8 个 API。

- [ ] **Step 4: 运行测试确认通过**

Run: `node scripts/verify-monaco-extra-lib-globals.mjs`  
Expected: PASS。

## Chunk 5: 最终回归

### Task 5: 做定向验证并更新说明

**Files:**
- Modify: `README.md`

- [ ] **Step 1: 更新 README**

补充说明当前支持的 `Deno.*` 文件 API 范围，以及“项目内兼容层”而非完整 Deno 的边界。

- [ ] **Step 2: 运行最终定向验证**

Run:

- `cargo test --manifest-path src-tauri/Cargo.toml deno_ -- --nocapture`
- `node scripts/verify-monaco-extra-lib-globals.mjs`
- `node scripts/verify-monaco-completion-resilience.mjs`

Expected: 全部 PASS。

- [ ] **Step 3: 记录已知限制**

在最终交付说明中明确：未实现文件句柄、权限模型、流式 IO、AbortSignal。
