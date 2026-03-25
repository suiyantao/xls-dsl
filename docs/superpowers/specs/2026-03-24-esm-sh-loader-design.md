# esm.sh 第三方包加载设计

## 背景

当前项目在 `src-tauri/src/deno/lib.rs` 中通过 `deno_core::FsModuleLoader` 创建运行时，只支持本地文件模块加载。脚本源码虽然能直接执行，但无法解析 `npm:`、`jsr:` 或远程 `https:` 模块，因此也不支持“给定包名和版本号后动态加载第三方包”。

本次目标是先做一个最小可用实现：只支持把 npm 包名和版本号映射到 `esm.sh`，并在脚本运行时通过辅助 API 动态导入第三方包。

## 目标

- 支持脚本调用 `pkg.import(name, version)` 动态导入第三方包。
- 导入地址固定映射为 `https://esm.sh/<name>@<version>`。
- 运行时能够下载、编译并缓存 `esm.sh` 返回的 ESM 代码。
- 对非法输入、网络失败和非 2xx 响应给出明确错误。

## 非目标

- 不支持 `jsr:`。
- 不支持 semver range，如 `^4`、`latest`。
- 不支持用户直接在脚本里写裸 `import "npm:lodash"`。
- 不保证所有 Node 内建模块 polyfill 都能工作。

## 方案对比

### 方案 A：辅助 API + 自定义远程 Loader（推荐）

- 前端脚本调用 `await pkg.import("lodash", "4.17.21")`。
- Rust 侧实现自定义 `ModuleLoader`，识别 `https://esm.sh/...` 并负责下载与缓存。
- 保留当前“脚本文本作为主模块执行”的模式，只在需要外部包时走动态导入。

优点：改动集中、易于测试、和当前架构兼容。  
缺点：用户需要使用 `pkg.import()`，不是原生静态 `import` 语法。

### 方案 B：自定义 `pkg:` 协议

- 允许用户写 `import _ from "pkg:lodash@4.17.21"`。
- Loader 再将其解析到 `esm.sh`。

优点：使用体验更像模块系统。  
缺点：需要额外处理静态导入解析、相对复杂度更高。

### 方案 C：预下载到本地缓存后再走 `file://`

- 在脚本执行前先下载包内容到本地缓存目录。
- 继续使用 `FsModuleLoader` 加载缓存文件。

优点：能最大限度复用现有 loader。  
缺点：相对导入、依赖链、缓存命名和失效控制都更麻烦。

## 采用方案

采用方案 A。

## 架构设计

### 1. JS 暴露层

在 `src-tauri/src/runtime.js` 中新增：

```js
globalThis.pkg = {
  import: async (name, version) => {
    const specifier = `https://esm.sh/${name}@${version}`;
    return await import(specifier);
  },
};
```

这里不直接暴露 `https` 拼接细节给用户，保证未来切换 CDN 或增加参数时只改一处。

### 2. Rust 模块加载层

新增 `src-tauri/src/deno/loader.rs`，实现自定义 `ModuleLoader`：

- `resolve()`：
  - 保留 `load_main_es_module_from_code()` 产生的合成主模块入口，不对它做磁盘读取。
  - 支持 `https://esm.sh/...` 绝对地址。
  - 支持远程模块内部的相对路径导入（例如 `./chunk-xxx.mjs`、`../shared.mjs`）。
  - 支持站点根路径导入（例如 `/lodash@4.17.21/es2022/chunk-xxx.mjs`）。
  - 统一使用“基于 referrer URL 的标准 URL 解析”处理远程依赖，避免为不同形式单独写分支。
- `load()`：
  - 对真正落到 loader 的 `file:` 模块委托本地文件读取。
  - 对 `https:` 通过 `reqwest` 拉取源码。
  - 根据响应头或后缀推断 `ModuleType::JavaScript`。

### 2.1 合成主模块兼容

当前运行入口是：

```rust
js_runtime.load_main_es_module_from_code(&main_module, code)
```

这里的主模块源码已经由调用方直接提供，不应再被 loader 按 `file://` 读取。实现上要把 loader 的职责限制为：

- 主模块运行后产生的动态导入；
- 这些动态导入继续展开出的依赖模块。

这样可以避免替换 `FsModuleLoader` 后误伤当前“数据库脚本文本直执行”的入口。

### 3. 缓存层

首版使用磁盘缓存，路径放在 Tauri 应用缓存目录下，例如：

```text
<cache_dir>/esm-cache/<md5(url)>.js
<cache_dir>/esm-cache/index.json
```

缓存策略：

- 命中缓存时直接返回缓存内容。
- 未命中时联网下载到临时文件，再原子 `rename` 成正式缓存文件。
- 用 URL 级互斥锁避免并发导入时重复下载或写坏缓存。
- 若缓存文件损坏、为空或读取失败，则删除损坏缓存并重新拉取。
- 首版不做 TTL，但保留简单元数据文件，至少记录原始 URL 与最终 URL，便于排查和后续升级。

### 4. 运行时装配

在 `src-tauri/src/deno/lib.rs` 中把 `FsModuleLoader` 替换为新的 loader，同时保留现有 `runjs::init_ops_and_esm()` 扩展注册。

为避免生产与测试装配混在一起，loader 构造接口固定为：

```rust
pub struct LoaderConfig {
    pub base_url: Url,
    pub cache_dir: PathBuf,
}
```

运行时默认通过一个小型工厂函数创建：

- 生产环境：`base_url = https://esm.sh`
- 生产缓存目录：应用缓存目录下的 `esm-cache`
- 测试环境：允许传入 test-only `base_url` 和临时缓存目录

这样 `run_js()` 只负责拿到默认配置并构造 loader，而测试可以显式注入 mock server 地址和临时目录，避免改动生产路径。

## 数据流

```text
脚本调用 pkg.import("lodash", "4.17.21")
  -> runtime.js 生成 https://esm.sh/lodash@4.17.21
  -> JsRuntime 动态 import
  -> EsmShModuleLoader.resolve/load
  -> 本地缓存命中? 是 -> 返回缓存源码
  -> 否 -> 获取 URL 锁 -> reqwest 下载 -> 临时文件写入 -> 原子 rename -> 返回源码
  -> V8 编译执行
  -> 模块 namespace 返回给脚本
```

## 错误处理

- `name` 或 `version` 为空：在 JS 层立即抛错。
- 非法包名：在 JS 层做基础校验，允许普通包名、scoped package（如 `@scope/pkg`）和包子路径（如 `lodash/fp`、`@scope/pkg/subpath`），拒绝空格、协议前缀、前导 `/`、`..` 和空段。
- HTTP 非 2xx：在 Rust loader 中返回包含 URL 和状态码的错误。
- 网络超时或下载失败：返回包含根因的错误。
- 缓存写入失败：直接让本次导入失败，避免出现“本次看似成功、后续缓存状态不一致”的假成功。
- 远程模块若再次引用绝对 `https:` 地址，只允许同一远程源（默认 `esm.sh`，测试时可替换为 mock 源）；跨源 `https:` 直接拒绝。
- 远程模块若引用 `node:`、`npm:`、`jsr:` 等 specifier，首版统一返回“当前 loader 不支持该协议”的明确错误。

## 测试策略

### Rust 测试

- 验证当前行为：`npm:` 和直接 `https:` 在旧路径下不可用（已补充）。
- 验证 `pkg.import()` 注入成功，且空参数时报清晰错误。
- 验证 loader 能从缓存目录读取远程模块源码。
- 验证远程相对导入能够正确 resolve。
- 验证远程站点根路径导入能够正确 resolve。
- 验证 HTTP 错误能返回可读信息。
- 验证合成主模块入口仍能正常执行本地脚本文本。

### JS / 运行时行为测试

- 运行时集成测试使用可替换下载源，不直接依赖真实 `esm.sh`。
- `pkg.import("lodash", "4.17.21")` 成功返回模块对象。
- 调用真实导出，如 `chunk([1,2,3],2)` 得到预期结果。
- 重复导入同版本时命中缓存；验收方式是“两个独立 runtime 实例”共享同一个缓存目录，第二次在禁用网络下载的情况下仍成功导入，证明命中的是磁盘缓存而不是单个 runtime 的模块图缓存。

## 可测试性设计

为了避免把测试绑死在外网，loader 需要支持测试时注入下载源：

- 生产默认源：`https://esm.sh`
- 测试源：本地 mock server 或 test-only base URL

这样可以稳定覆盖以下场景：

- 相对导入与根路径导入
- 404 / 500 / 超时
- 缓存命中与损坏缓存恢复
- 并发导入同一 URL

## 兼容性与后续扩展

- 后续若要支持 `jsr:`，可以在 `pkg.import()` 中增加来源参数或新增 `pkg.importJsr()`。
- 后续若要支持静态 `import`，可以在现有 loader 基础上继续增加自定义协议解析。
- 后续若要增强稳定性，可增加缓存元数据、TTL、离线模式与下载锁。
