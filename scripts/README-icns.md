# macOS icns 图标生成器

这是一个用于将 PNG 图片转换为 macOS 应用图标 (.icns 格式) 的 shell 脚本工具。

## 功能特性

- 🚀 **一键转换**: 快速将 PNG 转换为 icns 格式
- 📏 **智能尺寸**: 自动生成所有必需的图标尺寸 (16x16 到 1024x1024)
- 🎨 **高质量**: 使用 macOS 原生工具 `sips` 和 `iconutil`
- ⚡ **轻量级**: 无需安装额外软件
- 🛡️ **安全**: 本地处理，不上传任何数据
- 📝 **详细输出**: 可选的详细模式显示处理过程

## 系统要求

- macOS 操作系统
- 已安装 Xcode 命令行工具（包含 `sips` 和 `iconutil`）

## 安装

1. 克隆或下载脚本文件
2. 给脚本添加执行权限：
   ```bash
   chmod +x generate-icns.sh
   ```

## 使用方法

### 基本用法
```bash
./generate-icns.sh icon.png
```
这将生成 `icon.icns` 文件。

### 高级用法
```bash
# 指定输出文件名
./generate-icns.sh -o MyApp.icns icon.png

# 指定图标名称
./generate-icns.sh -n MyApp icon.png

# 显示详细处理过程
./generate-icns.sh -v icon.png

# 组合使用
./generate-icns.sh -n MyApp -o icons/MyApp.icns -v icon.png
```

## 参数说明

| 参数 | 长参数 | 说明 | 示例 |
|------|--------|------|------|
| `-h` | `--help` | 显示帮助信息 | `./generate-icns.sh -h` |
| `-o` | `--output` | 指定输出 icns 文件路径 | `./generate-icns.sh -o app.icns icon.png` |
| `-n` | `--name` | 指定图标名称 | `./generate-icns.sh -n MyApp icon.png` |
| `-v` | `--verbose` | 显示详细输出 | `./generate-icns.sh -v icon.png` |
| `-c` | `--clean` | 清理临时文件 | `./generate-icns.sh -c` |

## 图标尺寸规格

脚本会自动生成以下所有尺寸的图标：

| 尺寸 | 缩放 | 文件名 |
|------|------|--------|
| 16x16 | 1x | `icon_16x16.png` |
| 16x16 | 2x | `icon_16x16@2x.png` |
| 32x32 | 1x | `icon_32x32.png` |
| 32x32 | 2x | `icon_32x32@2x.png` |
| 64x64 | 1x | `icon_64x64.png` |
| 128x128 | 1x | `icon_128x128.png` |
| 128x128 | 2x | `icon_128x128@2x.png` |
| 256x256 | 1x | `icon_256x256.png` |
| 256x256 | 2x | `icon_256x256@2x.png` |
| 512x512 | 1x | `icon_512x512.png` |
| 512x512 | 2x | `icon_512x512@2x.png` |

## 最佳实践

### 输入图片建议
- **格式**: PNG（推荐）或 JPEG
- **尺寸**: 至少 1024x1024 像素
- **背景**: 透明背景（PNG）或纯色背景
- **内容**: 简洁明了的设计，避免过多细节

### 在 Xcode 中使用
1. 打开 Xcode 项目
2. 选择项目目标
3. 在 "App Icons and Launch Images" 部分
4. 将生成的 `.icns` 文件拖入 "App Icon" 字段

### 在 SwiftUI 中使用
```swift
Image(nsImage: NSImage(named: "YourIcon")!)
```

## 故障排除

### 缺少依赖工具
如果提示缺少 `sips` 或 `iconutil`，请安装 Xcode 命令行工具：
```bash
xcode-select --install
```

### 图片尺寸太小
如果输入图片小于 1024x1024，脚本会发出警告但仍会生成图标。建议使用更高分辨率的源图片。

### 生成失败
- 检查输入文件是否存在且为有效图片
- 确保有足够的磁盘空间
- 检查文件权限

## 技术原理

脚本使用以下 macOS 原生工具：

1. **sips** (Scriptable Image Processing System): 用于图片尺寸调整
2. **iconutil**: 用于将图标集 (.iconset) 编译为 .icns 格式

工作流程：
1. 验证输入文件
2. 创建临时目录
3. 使用 `sips` 生成所有必需的尺寸
4. 使用 `iconutil` 编译为 .icns 格式
5. 清理临时文件

## 更新日志

- v1.0.0: 初始版本，支持基本转换功能
- v1.1.0: 添加详细输出和错误处理
- v1.2.0: 优化性能和用户体验

## 许可证

MIT License - 可自由使用和修改

## 贡献

欢迎提交 Issue 和 Pull Request 来改进这个工具！