# Deno 文件 API 兼容层设计

## 背景

当前项目使用的是 `deno_core` + 自定义 runtime，而不是完整 Deno CLI 运行时。脚本环境里已经存在 `Deno` 与 `Deno.core`，并且 `runtime.js` 里还有一个未实现的 `Deno.writeFileSync` 占位；但标准 `Deno.readFileSync`、`Deno.writeFile`、`Deno.readTextFile` 等文件 API 仍然缺失，现有文件能力主要通过项目自定义的 `fs.*` 暴露。

用户希望脚本能够直接使用接近标准 Deno 的文件读写接口，并且本次范围包含文本与二进制两类 API。

## 目标

- 在脚本运行时补齐以下 API：
  - `Deno.writeFileSync`
  - `Deno.writeTextFileSync`
  - `Deno.writeFile`
  - `Deno.writeTextFile`
  - `Deno.readFileSync`
  - `Deno.readTextFileSync`
  - `Deno.readFile`
  - `Deno.readTextFile`
- `writeFile*` 支持 `string` 与 `Uint8Array` 输入。
- `readFile*` 返回 `Uint8Array`。
- 保持现有 `fs.*` API 不回退。
- 为 Monaco 补充对应类型提示。

## 非目标

- 不尝试完整复刻 Deno 全部 `Deno.*` 文件系统 API。
- 不支持文件权限模型、`AbortSignal`、流式读写、文件句柄等高级特性。
- 不引入 Node 风格 Buffer 兼容层。

## 方案对比

### 方案 A：只在 `runtime.js` 包一层文本兼容

- `Deno.writeTextFileSync` -> `fs.write`
- `Deno.readTextFileSync` -> `fs.read_to_string`

优点：改动小。  
缺点：无法真实支持 `Uint8Array`，与用户目标不符。

### 方案 B：JS 兼容层 + 最小二进制 op（推荐）

- JS 层统一提供 `Deno.*` API 形状。
- Rust 层只补最少的二进制读写 op。
- 文本 API 继续复用现有字符串 op。

优点：兼容面足够、实现集中、风险可控。  
缺点：需要同时改 Rust、runtime.js、类型声明。

### 方案 C：完整仿真 Deno 文件系统层

- 大范围补齐 `Deno.*` 文件 API。

优点：最像 Deno。  
缺点：范围膨胀，测试和维护成本高。

## 采用方案

采用方案 B。

## 架构设计

### 1. Rust 文件 op 层

在 `src-tauri/src/deno/fs_funs.rs` 新增最小二进制读写能力：

- `op_fs_read_binary(path: String) -> Vec<u8>`
- `op_fs_write_binary(path: String, contents: Vec<u8>) -> Result<(), AnyError>`

保留现有：

- `op_fs_read_to_string`
- `op_fs_write`

这样文本路径继续走已有实现，二进制路径不强行塞进字符串接口。

新的 `op_fs_write_binary` 必须复用现有 `op_fs_write` 的父目录/文件自动创建语义，避免：

- `fs.write(path, text)` 能成功
- `Deno.writeFileSync(path, uint8)` 却因父目录不存在而失败

### 2. Runtime JS 兼容层

在 `src-tauri/src/runtime.js` 上扩展现有 `globalThis.Deno`：

- 只扩展已有 `Deno`
- 绝不覆盖 `Deno.core`
- 把当前空实现的 `writeFileSync` 收敛为真实兼容层

提供以下方法：

- `Deno.writeTextFileSync(path, text)`
- `Deno.writeTextFile(path, text)`
- `Deno.readTextFileSync(path)`
- `Deno.readTextFile(path)`
- `Deno.writeFileSync(path, data)`
- `Deno.writeFile(path, data)`
- `Deno.readFileSync(path)`
- `Deno.readFile(path)`

### 3. 参数规范

- `path` 只接受字符串
- `writeTextFile*` 只接受字符串
- `writeFile*` 接受：
  - `Uint8Array`
  - `ArrayBuffer`
  - `string`（按 UTF-8 编码）
- 非法类型在 JS 层立即抛出清晰错误

### 4. 返回值规范

- `readTextFile*` 返回字符串
- `readFile*` 返回 `Uint8Array`
- `write*` 返回 `void` 或 `Promise<void>`

### 5. 同步 / 异步语义

- `*Sync` 直接走同步 op
- 非 `Sync` 版本首版仍可包装同步 op 并返回 `Promise.resolve(...)`
- 本次不引入真正异步文件 op；这是实现上的最小兼容，而不是性能优化目标

### 6. 类型提示

在 `src-tauri/data/extraLib.d.ts` 中扩展全局值声明 `Deno`，覆盖本次 8 个 API，并保留 `core` 字段的现有可用性。

目标是 Monaco 至少能为这些 API 提供：

- 方法名提示
- 参数签名提示
- 返回类型提示

## 数据流

```text
脚本调用 Deno.writeFileSync(path, data)
  -> runtime.js 判断 data 类型
  -> string ? 编码为 UTF-8 : Uint8Array 直接透传
  -> Deno.core.ops.op_fs_write_binary(...)
  -> Rust fs::write

脚本调用 Deno.readTextFileSync(path)
  -> runtime.js
  -> Deno.core.ops.op_fs_read_to_string(path)
  -> Rust fs::read_to_string
```

## 错误处理

- `path` 非字符串：抛 `TypeError`
- `writeTextFile*` 收到非字符串：抛 `TypeError`
- `writeFile*` 收到不支持的数据类型：抛 `TypeError`
- 读取不存在文件、权限不足等：沿用 Rust 文件错误并透传到 JS

## 测试策略

### Rust / runtime 集成测试

在 `src-tauri/src/deno/lib.rs` 补以下测试：

- 文本同步写入 + 读取
- 文本异步写入 + 读取
- 二进制同步写入 + 读取
- 二进制异步写入 + 读取
- `Uint8Array` 往返字节不变
- `ArrayBuffer` 输入可写入
- `string` 走 `writeFile*` 时按 UTF-8 编码
- 非法参数时报清晰错误
- 现有 `fs.write/read_to_string` 路径不回退
- `Deno.core` 不被覆盖
- 二进制写入保留“自动创建父目录”的现有语义

### Rust 单元测试

在 `src-tauri/src/deno/fs_funs.rs` 补 op 级测试，单独验证：

- `op_fs_write_binary` 能创建父目录
- `op_fs_read_binary` 能原样读回字节

这样可以把 Rust op 打通与 JS 兼容层打通分成两层红绿循环。

### 前端类型回归

扩展现有 `scripts/verify-monaco-extra-lib-globals.mjs` 或新增紧邻脚本，验证 `extraLib.d.ts` 中包含新的 `Deno.*` 声明，避免 Monaco 再次只有运行时能力、没有类型提示。

## 兼容性说明

- 这是“项目内 Deno 兼容层”，不是完整标准 Deno 实现。
- 目标是优先兼容常用脚本写法，而不是一比一复刻所有边角行为。
