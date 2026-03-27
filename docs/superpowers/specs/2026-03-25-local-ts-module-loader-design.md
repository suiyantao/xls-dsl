# 本地 TypeScript 模块支持设计

## 背景

当前项目在 `src-tauri/src/deno/lib.rs` 中通过 `load_main_es_module_from_code()` 执行主脚本文本，并使用 `src-tauri/src/deno/loader.rs` 处理模块加载。现有 loader 只把模块当 JavaScript 处理，没有 TypeScript 解析/转译链路，因此会出现“编辑器支持 TS 高亮，但运行时不支持 TS 语法”的落差。

用户本次明确要求：支持主脚本文本以及其本地依赖模块按 TypeScript 直接运行。

已确认的路径决策：本地相对导入（如 `import "./dep.ts"`）统一相对当前 `xlx_template` 文件的父目录解析，不新增脚本源码目录字段。

## 目标

- 支持主脚本文本中直接书写 TypeScript 语法。
- 支持主脚本通过相对路径导入本地 `.ts` / `.tsx` / `.mts` / `.cts` 模块。
- 多层本地 TS 依赖可继续解析并执行。
- 纯 JS 脚本与现有远程 `esm.sh` loader 行为不回退。
- TypeScript 语法错误能够返回可读的编译错误。

## 非目标

- 本次不支持远程 `https` TS 模块转译。
- 本次不支持 `pkg.import` 拉取的 TS 源码转译。
- 不支持完整 `tsconfig.json` 语义、路径别名、装饰器等高级特性。
- 不做类型检查，只做语法解析与转译。

## 方案对比

### 方案 A：主脚本执行前单独转译

- 只在 `run_js()` 前把主脚本文本 TS -> JS。
- 本地依赖模块仍按现有 JS loader 处理。

优点：实现最小。  
缺点：无法满足“本地依赖模块也支持 TS”的目标。

### 方案 B：统一 Loader 内部转译本地 TS（推荐）

- 主脚本与本地文件模块共享一套 TS 识别/转译逻辑。
- loader 负责判断扩展名、读取源码、转译后返回 JS。

优点：模型统一、易于扩展、本地模块链路一致。  
缺点：需要把主脚本入口与 loader 的边界重新理顺。

### 方案 C：前端预转译

- 在编辑器/前端先把 TS 编译成 JS，再发送给 Rust。

优点：后端改动少。  
缺点：把运行时能力绑在前端，且本地依赖解析仍不自然。

## 采用方案

采用方案 B。

## 架构设计

### 1. 统一脚本加载入口

当前主脚本走：

```rust
js_runtime.load_main_es_module_from_code(&main_module, code)
```

这条链路绕过了 loader 对源码读取的控制，因此无法统一处理“主模块是不是 TS”。

本次要改成：

- 把主脚本文本先写入一个临时文件（扩展名按脚本语言确定，首版可统一用 `.ts`）
- 用 `file://...` 主模块路径交给 loader 读取
- loader 对主模块和本地依赖模块统一判断并处理 TS/JS

这样入口与依赖模块走同一条加载路径。

### 2. Loader 本地文件分支

在 `src-tauri/src/deno/loader.rs` 中把 loader 扩展为：

- `file:` 本地模块：
  - 读取文件源码
  - 根据扩展名判断是 JS 还是 TS
  - TS -> 转译为 JS -> 返回 `ModuleSource`
  - JS -> 原样返回
- `http/https:` 远程模块：保持现有 `esm.sh` 逻辑

### 3. TypeScript 识别规则

视为 TS 的扩展名：

- `.ts`
- `.tsx`
- `.mts`
- `.cts`

视为 JS 的扩展名：

- `.js`
- `.mjs`
- `.cjs`

首版不做内容嗅探，避免“无扩展名但写了 TS”带来额外不确定性。

### 4. TS 转译实现

Rust 侧引入最小 TS 转译能力（建议 `deno_ast`）。

要求：

- 只做语法解析与 emit
- 不做类型检查
- 产出可直接交给 `deno_core` 执行的 JS 源码
- TS 语法错误返回清晰信息，包含文件路径和位置

### 5. 模块解析

`resolve()` 继续支持：

- 主模块 `file://...`
- 本地相对导入 `./foo.ts`
- 本地相对导入 `./foo.js`
- 现有远程 `https://esm.sh/...`

不额外引入 Node 风格后缀补全；首版要求脚本写明本地依赖扩展名。

### 6. 主模块基准目录与临时主模块文件

当前脚本只存储“代码文本”，没有独立的源码目录字段，因此本地依赖解析基准目录定义为：

- `base_dir = dirname(xlx_template)`

主脚本临时文件需要写入这个目录下的独立临时子目录，例如：

```text
<dirname(xlx_template)>/.xls-dsl-tmp/<run-id>/main.ts
```

这样：

- `import "./dep.ts"` 会稳定落到与 Excel 模板同目录的真实依赖文件
- 临时主模块本身不会污染真实业务文件目录结构

若 `xlx_template` 为空或没有父目录，则回退到系统临时目录，并明确说明此时本地相对依赖不可用或只能解析到临时目录。

### 7. 临时主模块文件

为让主脚本文本也走 loader：

- 在 `run_js` 路径里生成临时目录
- 把主脚本保存为临时 `main.ts`
- 用 `file://.../main.ts` 作为 `load_main_es_module` 的入口
- 执行结束后删除临时目录

### 8. 错误处理

- TS 语法错误：返回编译错误，包含文件名/行列
- 本地模块不存在：保持现有模块找不到错误
- 远程 TS 导入：本次不支持，维持现有远程 JS loader 语义

## 数据流

```text
主脚本文本
  -> 计算 base_dir = dirname(xlx_template)
  -> 写入 base_dir 下的临时 main.ts
  -> JsRuntime.load_main_es_module(file://.../main.ts)
  -> Loader.resolve/load
     -> file://main.ts -> 读取源码 -> TS 转译 -> JS
     -> import ./dep.ts -> 读取源码 -> TS 转译 -> JS
     -> import ./dep.js -> 原样读取 JS
     -> import https://esm.sh/... -> 现有远程分支
  -> V8 执行
```

## 测试策略

### 运行时集成测试

在 `src-tauri/src/deno/lib.rs` 中补测试：

- 主脚本 TS 基本语法可执行
- 主脚本导入本地 `dep.ts` 可执行
- 本地多层 TS 依赖可执行
- 主脚本导入本地 JS 仍可执行
- 本地相对路径确实相对 `xlx_template` 父目录解析
- 纯 JS 脚本回归不受影响
- 现有 `pkg.import()` 远程导入回归不受影响
- TS 语法错误返回清晰报错
- 主模块临时目录在成功/失败后都能清理

### Loader 级测试

在 `src-tauri/src/deno/loader.rs` 中补测试：

- `.ts` 被识别为需要转译
- `.js` 保持原样
- 本地相对路径解析不回退

## 兼容性说明

- 这是“本地 TS 直接运行”支持，不等于完整 Deno TS 模块图实现。
- 重点是让编辑器里的脚本文本与本地文件依赖可以直接写 TS，而不是覆盖远程模块生态。
