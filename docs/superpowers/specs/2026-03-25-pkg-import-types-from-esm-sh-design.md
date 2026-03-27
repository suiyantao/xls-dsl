# pkg.import 第三方包类型自动注入设计

## 背景

当前运行时已经支持 `pkg.import(name, version)` 从 `esm.sh` 动态加载第三方包，但编辑器里的 TypeScript 语言服务只知道：

```ts
declare const pkg: {
  import(name: string, version: string): Promise<unknown>;
};
```

因此：

- 运行时可执行
- Monaco 无法推断导入包的导出类型
- `const lodash = await pkg.import("lodash", "4.17.21")` 的结果会被视为 `unknown`

用户希望基于 `esm.sh` 自动注入第三方包类型，让 `pkg.import(...)` 拿到更接近真实包的自动提示体验。

## 目标

- 从编辑器代码里识别 `pkg.import("包名", "版本")` 调用。
- 基于 `esm.sh` 拉取对应版本的 `.d.ts` 入口。
- 把获取到的类型声明通过 `monaco.languages.typescript.typescriptDefaults.addExtraLib(...)` 注入 Monaco。
- 同一包同一版本只注入一次。
- 包版本变化时，能够替换旧注入。

## 非目标

- 不支持变量拼接形式的 `pkg.import(nameVar, versionVar)`。
- 不保证所有 npm 包都能自动拿到完整类型。
- 不在本次做完整 npm 类型解析器或 lockfile。
- 不修改运行时 `pkg.import` 执行逻辑。

## 方案对比

### 方案 A：泛型手工标注

- 用户写 `await pkg.import<LodashModule>(...)`

优点：实现最小。  
缺点：不是自动提示，仍要手写类型。

### 方案 B：从 `esm.sh` 自动拉取并注入类型（推荐）

- 前端检测 `pkg.import("name", "version")`
- 拉取 `esm.sh` 对应 `.d.ts`
- 注入 Monaco 语言服务

优点：与运行时来源一致，版本更容易保持同步。  
缺点：需要处理 `.d.ts` 依赖链与缓存。

### 方案 C：少量包手工映射

- 只给常用包硬编码类型入口

优点：简单。  
缺点：不通用，维护成本高。

## 采用方案

采用方案 B。

## 架构设计

### 1. 检测层

在 `src/app/plugin/monaco-editor/monaco-editor.component.ts` 中增加一层代码扫描：

- 监听当前编辑器内容
- 用正则或轻量解析提取：

```ts
pkg.import("lodash", "4.17.21")
```

首版只支持字符串字面量。

输出规范：

- 包名 `name`
- 版本 `version`
- 去重后的 `name@version` 集合

### 2. 获取层

新增一个前端辅助模块或组件内 helper，负责：

- 根据 `name@version` 生成 `esm.sh` 类型入口请求地址
- 获取 `.d.ts` 主入口文本
- 解析其中继续引用的相对 `.d.ts` 依赖
- 递归下载依赖

类型来源统一来自 `esm.sh`，保证与运行时导入源一致。

### 3. 注入层

把每个 `.d.ts` 文件映射到稳定虚拟 URI，例如：

```text
ts:pkg-import-types/lodash@4.17.21/index.d.ts
ts:pkg-import-types/lodash@4.17.21/chunk.d.ts
```

再通过：

```ts
monaco.languages.typescript.typescriptDefaults.addExtraLib(source, uri)
```

注入。

### 4. 缓存与失效

组件内维护两层缓存：

- **请求缓存**：避免同一 `name@version` 重复下载
- **注入缓存**：避免同一虚拟 URI 重复 `addExtraLib`

当编辑器代码变化时：

- 新增的 `name@version`：补拉取并注入
- 不再出现的 `name@version`：可先不立即删除（首版允许只增不减），避免频繁抖动

### 5. 类型可见性

要让下面这种写法自动拿到提示：

```ts
const lodash = await pkg.import("lodash", "4.17.21");
lodash.chunk(...)
```

仅仅注入 `.d.ts` 还不够，语言服务还需要知道 `pkg.import("lodash", "4.17.21")` 返回的是哪个模块类型。

首版采用“生成重载声明”的方式扩展 `pkg.import`：

```ts
declare const pkg: {
  import(name: "lodash", version: "4.17.21"): Promise<typeof import("ts:pkg-import-types/lodash@4.17.21/index")>;
  import(name: string, version: string): Promise<unknown>;
};
```

这样能把动态字符串导入和已注入的模块类型接起来。

### 6. 错误处理

- 拉取失败：只记录 warning，不影响编辑器基础功能
- 某个包没有类型：保留 `Promise<unknown>`
- 递归依赖失败：主入口类型可先注入，失败依赖记录 warning

## 数据流

```text
用户输入 pkg.import("lodash", "4.17.21")
  -> 组件扫描代码
  -> 提取 lodash@4.17.21
  -> 从 esm.sh 拉取 index.d.ts 与依赖 .d.ts
  -> addExtraLib(每个 d.ts)
  -> 生成 pkg.import 的 overload 声明
  -> addExtraLib(overload 声明)
  -> Monaco 推断 lodash 的导出类型
```

## 测试策略

### 前端静态回归脚本

新增脚本校验：

- 组件里存在 `pkg.import` 扫描逻辑
- 存在 `esm.sh` 类型请求逻辑
- 存在 `addExtraLib(...)` 注入逻辑
- 存在基于 `name@version` 生成 `pkg.import` overload 的逻辑

### 运行验证

- `npx tsc -p tsconfig.app.json --noEmit`
- `npm run build`

## 已知限制

- 首版只支持字面量 `pkg.import("name", "version")`
- 不保证所有 `esm.sh` 包都能完美拿到完整类型链
- 首版可接受“只增不减”的类型缓存策略，必要时后续再做清理
