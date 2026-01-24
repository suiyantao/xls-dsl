# DenoJS Runtime Desktop

一个以 **DenoJS 运行时** 为核心的桌面应用框架，通过 Rust 扩展函数提供强大的系统能力，使用 Tauri + Angular 作为现代化的 GUI 载体。专为 Excel DSL (领域特定语言) 处理和通用脚本执行而设计。

## 🎯 核心架构

### ⚙️ DenoJS 运行时引擎
- **原生 JavaScript/TypeScript 执行** - 无需转译，直接运行现代 JS/TS 代码
- **异步编程模型** - 完整的 async/await 支持
- **标准库兼容** - 支持 Deno 标准库和第三方模块
- **安全沙箱** - 可配置的运行时权限控制

### 🔧 Rust 扩展函数系统
- **文件系统操作** - 读写、复制、删除、目录管理等
- **网络请求** - HTTP 客户端，支持 GET/POST/PUT/DELETE
- **加密工具** - MD5、UUID、Snowflake ID 生成
- **模板引擎** - Handlebars 模板渲染
- **Excel 处理** - 基于 Calamine 的 XLS 文件解析

### 🖥️ 现代化 GUI 载体
- **Tauri 2.0** - 轻量级、安全的桌面应用框架
- **Angular 19** - 响应式、组件化的前端架构
- **Monaco Editor** - VS Code 级别的代码编辑体验
- **多主题支持** - 亮色/暗色主题切换

## 🌟 主要特性

### 🚀 DenoJS 运行时能力
```javascript
// 文件系统操作
await fs.write('/path/to/file.txt', 'Hello Deno!');
const content = await fs.read_to_string('/path/to/file.txt');

// HTTP 请求
const response = await http.get('https://api.example.com/data');
console.log(response);

// Excel 处理
const data = await fs.read_xls('/path/to/data.xlsx');
console.table(data);

// 加密工具
const hash = md5('password');
const uuid = uuid();
const snowflakeId = snowid();
```

### 🔩 Rust 扩展函数
- **op_fs_*** - 完整的文件系统操作
- **op_http_*** - 网络请求处理
- **op_md5/op_uuid/op_snowid** - 加密和 ID 生成
- **op_read_xls** - Excel 文件解析
- **op_handlebars_render** - 模板渲染

### 🎨 现代化界面
- **代码编辑器** - Monaco Editor 集成，支持语法高亮、智能提示
- **文件管理** - 树形文件浏览器，支持拖拽操作
- **终端模拟** - 内置终端，支持多标签
- **对话框系统** - 动态创建各种对话框
- **主题切换** - 亮色/暗色主题支持

## 🏗️ 技术架构

### 核心层
```
┌─────────────────────────────────────┐
│          Angular GUI                │  ← 用户界面层
├─────────────────────────────────────┤
│          Tauri Runtime               │  ← 桌面应用框架
├─────────────────────────────────────┤
│        DenoJS Core Runtime          │  ← JS/TS 执行引擎
├─────────────────────────────────────┤
│      Rust Extension Functions       │  ← 系统能力扩展
├─────────────────────────────────────┤
│          System OS                  │  ← 操作系统层
└─────────────────────────────────────┘
```

### 数据流向
```
用户操作 → Angular组件 → Tauri命令 → Rust处理 → DenoJS执行 → 结果返回
```

## 📋 系统要求

- **操作系统**: Windows 10+, macOS 10.15+, Linux
- **Node.js**: 18.0.0+ (用于前端构建)
- **Rust**: 1.70.0+ (用于 Tauri 后端)
- **Deno**: 1.40.0+ (运行时环境)
- **内存**: 最少 4GB RAM
- **存储**: 1GB 可用空间

## 🚀 快速开始

### 环境准备

1. **安装 Deno**
   ```bash
   curl -fsSL https://deno.land/install.sh | sh
   ```

2. **安装 Node.js 和 Rust**
   ```bash
   # Node.js (使用 nvm)
   nvm install 18
   nvm use 18
   
   # Rust
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

3. **安装 Tauri CLI**
   ```bash
   cargo install tauri-cli
   ```

### 安装和运行

```bash
# 克隆项目
git clone https://github.com/your-username/denojs-desktop.git
cd denojs-desktop

# 安装依赖
npm install

# 启动开发环境
npm run dev
```

### 第一个脚本

创建 `test.js`：
```javascript
// 测试 DenoJS 运行时
console.log('Hello from DenoJS Runtime!');

// 测试文件操作
await fs.write('test.txt', 'DenoJS is awesome!');
const content = await fs.read_to_string('test.txt');
console.log('File content:', content);

// 测试 HTTP 请求
const response = await http.get('https://api.github.com/users/denoland');
console.log('GitHub API response:', JSON.parse(response).name);
```

## 📖 使用指南

### DenoJS 运行时使用

1. **执行 JavaScript/TypeScript**
   - 直接在编辑器中编写 JS/TS 代码
   - 支持所有现代 JavaScript 特性
   - 完整的异步编程支持

2. **使用扩展函数**
   ```javascript
   // 文件操作
   await fs.create_dir('./new-folder');
   await fs.write('./data.json', JSON.stringify({key: 'value'}));
   
   // 网络请求
   const data = await http.post('https://api.example.com', {}, {data: 'value'});
   
   // Excel 处理
   const excelData = await fs.read_xls('./template.xlsx');
   ```

3. **错误处理**
   ```javascript
   try {
     await fs.read_to_string('/nonexistent/file.txt');
   } catch (error) {
     console.error('File read error:', error);
   }
   ```

### GUI 界面使用

1. **文件管理**
   - 左侧文件树浏览项目文件
   - 支持新建、重命名、删除文件
   - 拖拽文件到编辑器打开

2. **代码编辑**
   - 使用 Monaco Editor 进行代码编写
   - 支持语法高亮、代码折叠
   - 快捷键支持 (Ctrl+S, Ctrl+Z 等)

3. **终端使用**
   - 底部集成终端模拟器
   - 支持多标签页
   - 可自定义主题和字体

### Excel DSL 处理

1. **加载 Excel 模板**
   ```javascript
   const template = await fs.read_xls('./template.xlsx');
   console.log('Excel data:', template);
   ```

2. **数据处理**
   ```javascript
   // 处理 Excel 数据
   const processedData = template.map(row => ({
     ...row,
     calculated: row.value * 2
   }));
   ```

3. **生成报告**
   ```javascript
   // 使用模板引擎生成报告
   const report = await Handlebars.render(templateString, processedData);
   await fs.write('./report.html', report);
   ```

## 🔧 扩展开发

### 添加新的 Rust 扩展函数

1. **在 `src-tauri/src/deno/` 创建新的函数模块**
   ```rust
   use deno_core::{error::AnyError, op2};
   
   #[op2(fast)]
   pub fn op_my_function(#[string] input: String) -> Result<String, AnyError> {
       // 你的逻辑
       Ok(format!("Processed: {}", input))
   }
   ```

2. **在 `src-tauri/src/deno/mod.rs` 注册函数**
   ```rust
   deno_core::Extension::builder("my_extension")
       .ops(vec![
           op_my_function::decl(),
       ])
       .build()
   ```

3. **在 `runtime.js` 中暴露给 JavaScript**
   ```javascript
   globalThis.myAPI = {
     process: (input) => core.ops.op_my_function(input),
   };
   ```

### 前端组件开发

1. **创建 Angular 组件**
   ```bash
   ng generate component components/my-component
   ```

2. **集成到主界面**
   - 在 `app.module.ts` 中声明组件
   - 在模板中使用组件

## ⚙️ 配置说明

### Deno 运行时配置

运行时配置在 `src-tauri/src/deno/lib.rs`：
```rust
let mut js_runtime = deno_core::JsRuntime::new(deno_core::RuntimeOptions {
    module_loader: Some(Rc::new(deno_core::FsModuleLoader)),
    extensions: vec![runjs::init_ops_and_esm()],
    ..Default::default()
});
```

### Tauri 配置

应用配置在 `src-tauri/tauri.conf.json`：
```json
{
  "package": {
    "productName": "DenoJS Desktop",
    "version": "1.0.0"
  },
  "build": {
    "devUrl": "http://localhost:4200",
    "frontendDist": "../dist"
  }
}
```

### 构建配置

生产构建优化在 `src-tauri/Cargo.toml`：
```toml
[profile.release]
opt-level = 'z'          # 优化二进制大小
strip = true             # 移除调试符号
panic = 'abort'          # 遇到 panic 时终止
lto = true               # 启用链接时优化
codegen-units = 1        # 减少代码生成单元
```

## 🛠️ 开发规范

### 代码组织

```
src-tauri/
├── src/
│   ├── deno/              # Deno 运行时扩展
│   │   ├── fs_funs.rs     # 文件系统函数
│   │   ├── http_funs.rs   # HTTP 请求函数
│   │   ├── crypto_funs.rs # 加密函数
│   │   └── core_funs.rs   # 核心函数
│   ├── dao/               # 数据访问层
│   └── handlers/          # Tauri 命令处理器
├── data/
│   ├── extraLib.js        # 额外的 JavaScript 库
│   └── runtime.js         # Deno 运行时环境
└── Cargo.toml             # Rust 依赖配置
```

### 命名规范

- **Rust 函数**: `op_功能_操作` (例如: `op_fs_read_to_string`)
- **JavaScript API**: 简洁的动词名词组合 (例如: `fs.read()`)
- **Tauri 命令**: 小写+下划线 (例如: `execute_script`)

### 错误处理

- Rust 层使用 `Result<T, AnyError>`
- JavaScript 层使用 `try/catch`
- 用户界面层提供友好的错误提示

## 🤝 贡献指南

我们欢迎所有形式的贡献！

### 贡献类型

- 🐛 **Bug 修复** - 修复运行时或 GUI 问题
- ✨ **新功能** - 添加新的 Rust 扩展函数
- 🚀 **性能优化** - 提升运行时性能
- 📚 **文档改进** - 改进 README 和 API 文档
- 🎨 **UI/UX** - 改进用户界面体验

### 开发流程

1. Fork 项目并创建特性分支
2. 编写代码并添加测试
3. 提交清晰的 commit message
4. 创建 Pull Request 并描述更改

### 代码规范

- Rust 代码遵循官方风格指南
- TypeScript 使用严格模式
- 添加适当的代码注释
- 编写单元测试

## 📄 许可证

本项目采用 MIT 许可证开源 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Deno](https://deno.land/) - 下一代 JavaScript 运行时
- [Tauri](https://tauri.app/) - 构建轻量级桌面应用
- [Angular](https://angular.io/) - 现代前端框架
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - 代码编辑器
- [Calamine](https://github.com/tafia/calamine) - Excel 文件解析

## 🔗 相关资源

- [Deno 官方文档](https://deno.land/manual)
- [Tauri 开发指南](https://tauri.app/v2/guides/)
- [Angular 教程](https://angular.io/tutorial)
- [项目 Wiki](https://github.com/your-username/denojs-desktop/wiki)

---

**🌟 如果这个项目对你有帮助，请给我们一个星标！**