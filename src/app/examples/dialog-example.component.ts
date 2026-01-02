import { Component } from '@angular/core';
import { DialogService } from '../plugin/dialog/dialog.service';

/**
 * 动态对话框使用示例
 */
@Component({
  selector: 'app-dialog-example',
  template: `
    <div class="p-6">
      <h2 class="text-2xl font-bold mb-6 text-[var(--app-text-color)] dark:text-[var(--app-text-color-dark)]">
        动态对话框示例
      </h2>
      
      <div class="space-y-4">
        <!-- 基本对话框 -->
        <button 
          (click)="showBasicDialog()" 
          class="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500">
          显示基本对话框
        </button>
        
        <!-- 确认对话框 -->
        <button 
          (click)="showConfirmDialog()" 
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
          显示确认对话框
        </button>
        
        <!-- 警告对话框 -->
        <button 
          (click)="showAlertDialog()" 
          class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500">
          显示警告对话框
        </button>
        
        <!-- 自定义对话框 -->
        <button 
          (click)="showCustomDialog()" 
          class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500">
          显示自定义对话框
        </button>
      </div>
      
      <!-- 结果显示 -->
      <div *ngIf="lastResult" class="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-md">
        <h3 class="font-semibold text-[var(--app-text-color)] dark:text-[var(--app-text-color-dark)]">结果:</h3>
        <p class="text-[var(--app-text-color)] dark:text-[var(--app-text-color-dark)]">{{ lastResult }}</p>
      </div>
    </div>
  `,
  standalone: false
})
export class DialogExampleComponent {
  lastResult: string = '';

  constructor(private dialogService: DialogService) {}

  /**
   * 显示基本对话框
   */
  showBasicDialog(): void {
    const dialog = this.dialogService.create({
      title: '基本对话框',
      data: { message: '这是一个动态创建的基本对话框！' }
    });
    
    // 设置内容
    dialog.setContent('欢迎使用动态对话框功能。你可以在这里显示任何内容。');
    
    // 监听关闭
    setTimeout(() => {
      this.lastResult = '基本对话框已关闭';
    }, 100);
  }

  /**
   * 显示确认对话框
   */
  async showConfirmDialog(): Promise<void> {
    try {
      const result = await this.dialogService.confirm(
        '你确定要删除这个文件吗？此操作无法撤销。',
        '删除确认'
      );
      
      this.lastResult = result ? '用户点击了确认' : '用户点击了取消';
      
      if (result) {
        // 执行删除操作
        console.log('执行删除操作');
      }
    } catch (error) {
      this.lastResult = '确认对话框出现错误';
    }
  }

  /**
   * 显示警告对话框
   */
  async showAlertDialog(): Promise<void> {
    await this.dialogService.alert(
      '这是一个重要的警告消息！请仔细阅读。',
      '警告'
    );
    
    this.lastResult = '警告对话框已关闭';
  }

  /**
   * 显示自定义对话框
   */
  showCustomDialog(): void {
    const dialog = this.dialogService.create({
      title: '自定义对话框',
      width: '600px',
      data: { 
        type: 'custom',
        content: '这是自定义内容',
        buttons: [
          { text: '保存', action: 'save' },
          { text: '取消', action: 'cancel' }
        ]
      }
    });
    
    // 设置自定义内容
    dialog.setContent(`
      <div class="space-y-4">
        <p>这是一个自定义对话框，可以包含复杂的HTML内容。</p>
        <div class="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md">
          <p class="text-sm text-yellow-800 dark:text-yellow-200">
            提示：你可以在这里添加表单、表格或其他任何内容。
          </p>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">字段1</label>
            <input type="text" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">字段2</label>
            <input type="text" class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
          </div>
        </div>
      </div>
    `);
    
    // 添加自定义按钮处理
    dialog.onConfirm = () => {
      this.lastResult = '自定义对话框 - 确认操作';
      dialog.close();
    };
    
    dialog.onCancel = () => {
      this.lastResult = '自定义对话框 - 取消操作';
      dialog.close();
    };
  }
}

/**
 * 在XLS编辑器中使用动态对话框的示例
 */
export class XlsEditorDialogExample {
  
  constructor(private dialogService: DialogService) {}

  /**
   * 删除文件前的确认
   */
  async deleteFile(fileName: string): Promise<void> {
    const confirmed = await this.dialogService.confirm(
      `确定要删除文件 "${fileName}" 吗？`,
      '删除确认'
    );
    
    if (confirmed) {
      // 执行删除操作
      console.log(`删除文件: ${fileName}`);
    }
  }

  /**
   * 显示操作结果
   */
  showResult(message: string, success: boolean = true): void {
    this.dialogService.alert(
      message,
      success ? '成功' : '错误'
    );
  }

  /**
   * 显示文件信息
   */
  showFileInfo(fileInfo: any): void {
    const dialog = this.dialogService.create({
      title: '文件信息',
      width: '500px',
      data: { fileInfo }
    });
    
    dialog.setContent(`
      <div class="space-y-3">
        <div class="flex justify-between">
          <span class="font-medium">文件名:</span>
          <span>${fileInfo.name}</span>
        </div>
        <div class="flex justify-between">
          <span class="font-medium">大小:</span>
          <span>${this.formatFileSize(fileInfo.size)}</span>
        </div>
        <div class="flex justify-between">
          <span class="font-medium">修改时间:</span>
          <span>${new Date(fileInfo.modified).toLocaleString()}</span>
        </div>
      </div>
    `);
  }
  
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}