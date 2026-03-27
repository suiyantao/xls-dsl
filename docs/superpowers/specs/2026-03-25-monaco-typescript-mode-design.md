# Monaco 固定 TypeScript 模式设计

## 背景

当前运行时已经支持主脚本文本与本地依赖模块按 TypeScript 直接运行，但编辑器 `src/app/plugin/monaco-editor/monaco-editor.component.ts` 仍固定使用 `language: "javascript"`，并且自定义补全与额外类型声明也挂在 `javascriptDefaults` 上。这会造成运行时支持 TS、编辑器却仍按 JS 服务工作的错位体验。

用户要求本次直接把编辑器固定到 TypeScript 模式，不做 JS/TS 切换 UI。

## 目标

- Monaco 编辑器固定使用 `typescript` 语言模式。
- 现有 `fori` / `log` 自定义补全在 TypeScript 模式下可用。
- `extraLib.d.ts` 继续为 TS 语言服务提供全局类型提示。
- 不影响现有保存、读取、布局和主题逻辑。

## 非目标

- 不新增 JS / TS 手动切换。
- 不新增按文件扩展名自动切换语言模式。
- 不重构 Monaco 封装层架构。

## 方案对比

### 方案 A：只改 `language: "typescript"`

- 把默认语言从 `javascript` 改成 `typescript`

优点：最小。  
缺点：自定义补全和类型注入仍挂在 JS defaults，体验不完整。

### 方案 B：固定 TS 模式并同步切换服务入口（推荐）

- `editorOptions.language = "typescript"`
- `typescriptDefaults` 负责模式配置与 `addExtraLib`
- 自定义补全提供器注册到 `typescript`

优点：行为一致、改动集中、和当前目标完全一致。  
缺点：若以后还要支持 JS，需要再抽象语言配置。

### 方案 C：同时给 JS 和 TS 都注册

- 默认仍可切换，但当前固定使用 TS

优点：未来扩展更灵活。  
缺点：超出当前范围，增加不必要分支。

## 采用方案

采用方案 B。

## 架构设计

### 1. 编辑器默认语言

在 `src/app/plugin/monaco-editor/monaco-editor.component.ts` 中：

- 把 `editorOptions.language` 从 `javascript` 改为 `typescript`

### 2. 语言服务配置入口

当前代码使用：

- `monaco.languages.typescript.javascriptDefaults.setModeConfiguration(...)`
- `javascriptDefaults.addExtraLib(...)`

需要改为：

- `monaco.languages.typescript.typescriptDefaults.setModeConfiguration(...)`
- `typescriptDefaults.addExtraLib(...)`

这样 Monaco 会在 TS 语言模式下提供正确的语法与类型服务。

### 3. 自定义补全提供器

当前 `registerCompletionProvider()` 只注册到 `javascript`。本次改为注册到 `typescript`。

保留现有：

- `fori`
- `log`

不扩展额外 snippet，避免范围膨胀。

### 4. 额外类型声明

保留现有 `extraLib.d.ts` 资源文件与加载流程：

- `resolveResource("data/extraLib.d.ts")`
- `readTextFile(...)`
- `addExtraLib(...)`

只是把注入目标从 `javascriptDefaults` 改到 `typescriptDefaults`。

## 数据流

```text
打开编辑器
  -> Monaco model language = typescript
  -> typescriptDefaults.setModeConfiguration(...)
  -> 读取 extraLib.d.ts
  -> typescriptDefaults.addExtraLib(...)
  -> registerCompletionItemProvider("typescript", ...)
  -> TS 语法高亮 / 诊断 / 类型提示 / 自定义 snippet 一起生效
```

## 测试策略

由于当前项目没有稳定可执行的 Angular 单测目标，本次继续使用轻量静态校验脚本：

- 断言 `language: "typescript"`
- 断言补全 provider 注册到 `typescript`
- 断言 `typescriptDefaults.addExtraLib(...)` 存在
- 断言不再使用 `javascriptDefaults.setModeConfiguration(...)`

同时跑：

- `npx tsc -p tsconfig.app.json --noEmit`
- `npm run build`

## 兼容性说明

- 现在编辑器固定用 TypeScript 模式，即便写纯 JS，也会按 TS 宽松模式编辑；这通常不会影响使用。
- 如果未来要恢复 JS/TS 双模式，建议再单独做“编辑器语言策略”设计，不在这次范围内。
