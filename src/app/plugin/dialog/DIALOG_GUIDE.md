# 🎭 动态对话框系统

## ✨ 功能特性

### 🚀 核心功能
- **动态创建**: 运行时动态创建和销毁对话框
- **多种类型**: 支持基本、确认、警告等预设类型
- **自定义内容**: 支持HTML内容和动态数据
- **Promise API**: 现代化的异步操作处理
- **主题支持**: 完美支持亮色/暗色主题
- **动画效果**: 流畅的打开/关闭动画

### 🎯 对话框类型

#### 1. 基本对话框 (`create`)
```typescript
const dialog = this.dialogService.create({
  title: '自定义标题',
  content: '对话框内容',
  width: '500px'
});
```

#### 2. 确认对话框 (`confirm`)
```typescript
const result = await this.dialogService.confirm(
  '确定要删除这个文件吗？',
  '删除确认'
);
// result: true (确认) / false (取消)
```

#### 3. 警告对话框 (`alert`)
```typescript
await this.dialogService.alert(
  '操作成功完成！',
  '成功'
);
```

## 🔧 使用方法

### 1. 导入服务
```typescript
import { DialogService } from '../../plugin/dialog/dialog.service';

constructor(private dialogService: DialogService) {}
```

### 2. 基本使用
```typescript
// 显示基本对话框
const dialog = this.dialogService.create({
  title: '我的对话框',
  content: '这是对话框内容'
});

// 设置回调
dialog.onConfirm = () => {
  console.log('用户点击了确认');
  dialog.close();
};
```

### 3. 高级用法
```typescript
// 自定义配置
const dialog = this.dialogService.create({
  title: '文件信息',
  width: '600px',
  height: '400px',
  data: { 
    fileInfo: fileData,
    customButtons: ['保存', '取消', '应用']
  },
  disableClose: true, // 禁用ESC和背景关闭
  panelClass: 'custom-dialog-class'
});

// 设置HTML内容
dialog.setContent(`
  <div class="custom-content">
    <h3>文件详情</h3>
    <p>文件名: ${fileData.name}</p>
    <p>大小: ${fileData.size}</p>
  </div>
`);

// 设置回调函数
dialog.onConfirm = () => this.handleSave();
dialog.onCancel = () => this.handleCancel();
```

### 4. 异步操作
```typescript
async deleteFile(file: FileInfo): Promise<void> {
  // 显示确认对话框
  const confirmed = await this.dialogService.confirm(
    `确定要删除文件 "${file.name}" 吗？`,
    '删除确认'
  );
  
  if (confirmed) {
    try {
      // 执行删除操作
      await this.fileService.deleteFile(file.id);
      
      // 显示成功消息
      await this.dialogService.alert('文件删除成功！', '成功');
    } catch (error) {
      // 显示错误消息
      await this.dialogService.alert(`删除失败: ${error.message}`, '错误');
    }
  }
}
```

## 🎨 样式定制

### CSS变量支持
```css
:root {
  --app-text-color: #374151;
  --app-text-color-dark: #E5E7EB;
  --app-bg-color: #F9FAFB;
  --app-bg-color-dark: #1E1E1E;
  --app-border-color: #D1D5DB;
  --app-border-color-dark: #4B5563;
  --app-primary-color: #C2410C;
}
```

### 自定义样式类
```typescript
const dialog = this.dialogService.create({
  title: '自定义样式',
  panelClass: 'my-custom-dialog',
  backdropClass: 'my-custom-backdrop'
});
```

```css
.my-custom-dialog {
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.my-custom-backdrop {
  background-color: rgba(0, 0, 0, 0.7);
}
```

## 🎭 跑马灯效果

对话框标题支持跑马灯效果：

```css
/* 在对话框CSS中已内置跑马灯效果 */
.marquee-container {
  overflow: hidden;
  white-space: nowrap;
}

.marquee-text {
  animation: marquee 15s linear infinite;
}
```

## 📱 响应式设计

- 默认宽度：`min(90vw, 500px)`
- 最大宽度：`500px`
- 支持自定义宽度：`width: '600px'`
- 移动端友好：自动适配屏幕尺寸

## 🔧 API参考

### DialogService方法

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `create` | `DialogConfig` | `DialogComponent` | 创建基本对话框 |
| `confirm` | `message, title?` | `Promise<boolean>` | 显示确认对话框 |
| `alert` | `message, title?` | `Promise<void>` | 显示警告对话框 |
| `closeAll` | - | `void` | 关闭所有对话框 |
| `getActiveDialogCount` | - | `number` | 获取活动对话框数量 |

### DialogConfig接口

```typescript
interface DialogConfig {
  title?: string;           // 标题
  content?: string;         // 内容
  width?: string;           // 宽度
  height?: string;          // 高度
  data?: any;               // 自定义数据
  disableClose?: boolean;   // 禁用关闭
  panelClass?: string;      // 面板类名
  backdropClass?: string;   // 背景类名
}
```

### DialogComponent方法

| 方法 | 参数 | 说明 |
|------|------|------|
| `show` | - | 显示对话框 |
| `close` | - | 关闭对话框 |
| `setTitle` | `title: string` | 设置标题 |
| `setContent` | `content: string` | 设置内容 |
| `setData` | `data: any` | 设置数据 |
| `setType` | `type: DialogType` | 设置类型 |

## 🌟 最佳实践

### 1. 错误处理
```typescript
try {
  await this.dialogService.confirm('确定继续吗？');
  // 执行操作
} catch (error) {
  await this.dialogService.alert(`操作失败: ${error.message}`, '错误');
}
```

### 2. 用户反馈
```typescript
// 操作前确认
const confirmed = await this.dialogService.confirm('确定要保存更改吗？');

if (confirmed) {
  // 显示进度
  this.showLoading();
  
  try {
    await this.saveData();
    // 操作成功后显示成功消息
    await this.dialogService.alert('保存成功！', '成功');
  } catch (error) {
    // 操作失败后显示错误消息
    await this.dialogService.alert('保存失败，请重试', '错误');
  } finally {
    this.hideLoading();
  }
}
```

### 3. 复杂内容
```typescript
const dialog = this.dialogService.create({
  title: '文件预览',
  width: '800px',
  height: '600px'
});

dialog.setContent(`
  <div class="file-preview">
    <div class="preview-header">
      <h3>${file.name}</h3>
      <span class="file-size">${this.formatSize(file.size)}</span>
    </div>
    <div class="preview-content">
      <!-- 预览内容 -->
    </div>
  </div>
`);
```

## 🎉 总结

动态对话框系统提供了：
- ✅ 简单易用的API
- ✅ 丰富的预设类型
- ✅ 灵活的自定义选项
- ✅ 现代化的异步处理
- ✅ 完美的主题支持
- ✅ 流畅的动画效果

现在你可以轻松地在应用中添加各种对话框，提升用户体验！🚀