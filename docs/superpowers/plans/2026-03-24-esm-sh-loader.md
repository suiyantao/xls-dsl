# esm.sh Loader Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为当前内嵌 Deno 运行时增加基于 `esm.sh` 的 npm 第三方包动态加载能力，并通过 `pkg.import(name, version)` 暴露给脚本使用。

**Architecture:** 保持现有 `run_js()` 和扩展注入模式不变，在 Rust 侧新增一个最小自定义 `ModuleLoader`，统一处理 `file:` 与 `https://esm.sh/` 模块加载；在 JS 侧新增 `pkg.import()` 作为受控入口，把“包名 + 版本号”映射到远程 ESM 地址。缓存先采用本地磁盘缓存，避免重复下载。

**Tech Stack:** Rust、`deno_core`、`reqwest`、Tauri、内嵌 ESM runtime

**Execution Context:** 所有 `cargo test` 命令都在 `src-tauri` 目录执行；等价写法是 `cargo test --manifest-path src-tauri/Cargo.toml ...`。

---

## Chunk 1: 运行时 API

### Task 1: 注入 `pkg.import()` 并校验空参数

**Files:**
- Modify: `src-tauri/src/runtime.js`
- Test: `src-tauri/src/deno/lib.rs`

- [ ] **Step 1: 写失败测试**

在 `src-tauri/src/deno/lib.rs` 中新增测试 `pkg_import_rejects_empty_name_before_loader`，执行：

```js
await pkg.import("", "4.17.21");
```

断言当前因为 `pkg` 未定义而失败；实现后同一测试改为断言抛出 `pkg.import requires name and version`，完成红绿闭环。

- [ ] **Step 2: 运行测试确认失败**

Run: `cargo test pkg_import_rejects_empty_name_before_loader -- --nocapture`  
Expected: FAIL，错误原因为 `pkg is not defined` 或等价未注入错误。

- [ ] **Step 3: 写最小实现**

在 `src-tauri/src/runtime.js` 增加：

```js
globalThis.pkg = {
  import: async (name, version) => {
    if (!name || !version) {
      throw new Error("pkg.import requires name and version");
    }
    return await import(`https://esm.sh/${name}@${version}`);
  },
};
```

- [ ] **Step 4: 再跑测试确认通过**

Run: `cargo test pkg_import_rejects_empty_name_before_loader -- --nocapture`  
Expected: PASS。

### Task 2: 接通远程导入入口

**Files:**
- Modify: `src-tauri/src/runtime.js`
- Test: `src-tauri/src/deno/lib.rs`

- [ ] **Step 1: 写失败测试**

新增测试 `pkg_import_remote_requires_loader_support`，执行：

```js
const lodash = await pkg.import("lodash", "4.17.21");
console.log(typeof lodash);
```

断言当前因为远程 loader 尚未实现而失败。

- [ ] **Step 2: 运行测试确认失败**

Run: `cargo test pkg_import_remote_requires_loader_support -- --nocapture`  
Expected: FAIL，错误原因为远程模块无法加载。

- [ ] **Step 3: 保持最小实现不变**

这里不新增功能；确认当前 `pkg.import()` 已把问题收敛到 loader 缺失。

- [ ] **Step 4: 再跑测试确认失败原因正确**

Run: `cargo test pkg_import_remote_requires_loader_support -- --nocapture`  
Expected: FAIL，且失败原因来自远程 loader 缺失而不是 `pkg` 未定义。

## Chunk 2: Loader 骨架与回归保护

### Task 3: 新增 loader 骨架并实现 URL 解析

**Files:**
- Create: `src-tauri/src/deno/loader.rs`
- Modify: `src-tauri/src/deno/mod.rs`
- Test: `src-tauri/src/deno/loader.rs`

- [ ] **Step 1: 写失败测试**

在 `src-tauri/src/deno/loader.rs` 中新增：

- `loader_resolve_relative_remote_specifier`
- `loader_resolve_root_remote_specifier`

分别断言：

- `./chunk.js` 能解析到基于 referrer 的远程 URL
- `/chunk.js` 能解析到 `https://esm.sh/chunk.js`

- [ ] **Step 2: 运行测试确认失败**

Run: `cargo test loader_resolve_ -- --nocapture`  
Expected: FAIL，提示 `loader` 尚未实现。

- [ ] **Step 3: 创建 loader 骨架**

创建 `src-tauri/src/deno/loader.rs`，定义：

```rust
pub struct EsmShModuleLoader { /* cache dir, client, base url */ }
```

先只把模块结构、构造函数、基础测试入口搭起来。

- [ ] **Step 4: 固定配置注入接口**

在 `src-tauri/src/deno/loader.rs` 中增加 `LoaderConfig`，明确：

- 生产路径使用默认 `https://esm.sh`
- 测试路径允许传入 mock server base URL
- 缓存目录由调用方注入，测试使用临时目录

- [ ] **Step 5: 实现 resolve 最小能力**

只实现：

- `https://esm.sh/...` 绝对地址
- 基于 referrer 的 `./...` / `../...`
- 基于 referrer host 的 `/...`

- [ ] **Step 6: 跑测试确认通过**

Run: `cargo test loader_resolve_ -- --nocapture`  
Expected: PASS。

### Task 4: 保持现有脚本文本执行能力不回退

**Files:**
- Modify: `src-tauri/src/deno/lib.rs`
- Test: `src-tauri/src/deno/lib.rs`

- [ ] **Step 1: 写回归测试**

新增测试 `local_runtime_still_executes_inline_code`，只执行本地脚本文本、不做任何远程导入，断言 `console.log` 或现有 `http/fs` API 仍可运行。

- [ ] **Step 2: 先跑一遍建立绿色基线**

Run: `cargo test local_runtime_still_executes_inline_code -- --nocapture`  
Expected: PASS，作为替换 loader 前的基线。

- [ ] **Step 3: 接入运行时构造**

把 `src-tauri/src/deno/lib.rs` 中的 `FsModuleLoader` 替换为 `Rc::new(EsmShModuleLoader::new(...))`，并确保合成主模块不误走磁盘读取。

- [ ] **Step 4: 跑测试确认通过**

Run: `cargo test local_runtime_still_executes_inline_code -- --nocapture`  
Expected: PASS。

## Chunk 3: 下载、缓存、错误处理

### Task 5: 接通远程源码下载

**Files:**
- Modify: `src-tauri/src/deno/loader.rs`
- Test: `src-tauri/src/deno/loader.rs`

- [ ] **Step 1: 写失败测试**

使用 test-only base URL，新增测试 `loader_fetches_remote_module_source`，通过本地 mock server 返回固定 JS 模块源码，验证 loader 能下载并返回源码。

mock server 方案固定为：测试内启动本地 HTTP server，返回预设的 JS 文本与子模块引用；不依赖真实 `esm.sh`。

- [ ] **Step 2: 运行测试确认失败**

Run: `cargo test loader_fetches_remote_module_source -- --nocapture`  
Expected: FAIL。

- [ ] **Step 3: 写最小实现**

在 `load()` 中加入 `reqwest` 下载逻辑，仅支持 `https://esm.sh/...` 与测试注入的 base URL。

- [ ] **Step 4: 跑测试确认通过**

Run: `cargo test loader_fetches_remote_module_source -- --nocapture`  
Expected: PASS。

### Task 6: 为远程源码增加本地缓存

**Files:**
- Modify: `src-tauri/src/deno/loader.rs`
- Test: `src-tauri/src/deno/loader.rs`

- [ ] **Step 1: 写失败测试**

新增测试 `cache_reuses_downloaded_remote_module_across_loader_instances`：第一次下载后写入缓存文件，第二次在新的 runtime/loader 实例中读取同一 URL 时直接命中缓存，不再依赖网络响应。

- [ ] **Step 2: 运行测试确认失败**

Run: `cargo test cache_reuses_downloaded_remote_module_across_loader_instances -- --nocapture`  
Expected: FAIL，提示缓存未命中或无缓存文件。

- [ ] **Step 3: 写最小实现**

实现：

- 用 URL 的 hash 作为缓存文件名
- 先读缓存，再决定是否联网
- 确保缓存目录自动创建

- [ ] **Step 3.1: 先实现缓存命中最小闭环**

只完成“有缓存直接读、无缓存才下载并写入”。

- [ ] **Step 3.2: 再补原子写与恢复能力**

加入临时文件 + 原子 `rename`，并处理损坏缓存恢复。

- [ ] **Step 3.3: 最后补 URL 级锁**

避免并发写坏缓存。

- [ ] **Step 4: 跑测试确认通过**

Run: `cargo test cache_reuses_downloaded_remote_module_across_loader_instances -- --nocapture`  
Expected: PASS。

### Task 7: 收敛错误信息

**Files:**
- Modify: `src-tauri/src/deno/loader.rs`
- Modify: `src-tauri/src/runtime.js`
- Test: `src-tauri/src/deno/lib.rs`

- [ ] **Step 1: 写失败测试**

覆盖以下测试：

- `error_rejects_empty_name`
- `error_rejects_empty_version`
- `error_rejects_invalid_package_name`
- `error_reports_http_status_with_url`

断言错误信息包含调用参数或 URL。

- [ ] **Step 2: 运行测试确认失败**

Run: `cargo test error_ -- --nocapture`  
Expected: FAIL。

- [ ] **Step 3: 写最小实现**

在 JS 层校验空参数与非法包名，在 Rust 层为 HTTP 状态码和下载失败补充上下文。

- [ ] **Step 4: 跑测试确认通过**

Run: `cargo test error_ -- --nocapture`  
Expected: PASS。

## Chunk 4: 端到端验证

### Task 8: 验证 npm 包加载端到端流程

**Files:**
- Test: `src-tauri/src/deno/lib.rs`

- [ ] **Step 1: 写失败测试**

新增测试 `lodash_chunk_executes_via_pkg_import`：

```js
const lodash = await pkg.import("lodash", "4.17.21");
const result = lodash.chunk([1, 2, 3, 4], 2);
console.log(result);
```

断言执行成功，并且输出包含分块结果。该测试默认仍走 test-only base URL 指向本地 mock server，不依赖真实外网。

- [ ] **Step 2: 运行测试确认失败**

Run: `cargo test lodash_chunk_executes_via_pkg_import -- --nocapture`  
Expected: FAIL。

- [ ] **Step 3: 只修复端到端缺口**

只修复导致该测试失败的最小问题，不顺手扩展额外特性。

- [ ] **Step 4: 跑测试确认通过**

Run: `cargo test lodash_chunk_executes_via_pkg_import -- --nocapture`  
Expected: PASS。

- [ ] **Step 5: 跑回归测试**

依次运行：

- `cargo test rejects_ -- --nocapture`
- `cargo test pkg_import_ -- --nocapture`
- `cargo test loader_resolve_ -- --nocapture`
- `cargo test loader_fetches_remote_module_source -- --nocapture`
- `cargo test local_runtime_still_executes_inline_code -- --nocapture`
- `cargo test cache_reuses_downloaded_remote_module_across_loader_instances -- --nocapture`
- `cargo test error_ -- --nocapture`
- `cargo test lodash_chunk_executes_via_pkg_import -- --nocapture`

Expected: 全部 PASS。

## Chunk 5: 最终校验与文档

### Task 9: 补充说明并做最终验证

**Files:**
- Modify: `README.md`

- [ ] **Step 1: 更新 README 中 Deno 运行时能力说明**

补充 `pkg.import(name, version)` 的使用示例、当前只支持 `esm.sh` 的限制，以及失败场景说明。

- [ ] **Step 2: 运行最终验证**

Run: `cargo test -- --nocapture`  
Expected: 相关测试通过；若存在无关历史失败，在交付说明中明确指出。

- [ ] **Step 3: 整理交付说明**

把交付说明整理到最终响应中，记录修改文件、验证命令、已知限制和后续可扩展点。
