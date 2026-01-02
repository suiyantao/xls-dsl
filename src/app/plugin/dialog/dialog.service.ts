import { Injectable, TemplateRef, Type } from '@angular/core';
import { DialogComponent } from './dialog.component';

/**
 * 动态对话框服务
 * 提供创建和管理动态对话框的功能
 */
@Injectable({
  providedIn: 'root'
})
export class DialogService {
  
  private dialogs: DialogComponent[] = [];

  constructor() {}

  /**
   * 创建并显示一个动态对话框
   * @param config 对话框配置
   * @returns 对话框组件实例
   */
  create(config: DialogConfig = {}): DialogComponent {
    // 创建对话框元素
    const dialogElement = document.createElement('app-dialog');
    
    // 添加到DOM
    document.body.appendChild(dialogElement);
    
    // 获取组件实例
    const dialogInstance = (dialogElement as any).componentInstance as DialogComponent;
    
    if (dialogInstance) {
      // 应用配置
      if (config.title) {
        dialogInstance.setTitle(config.title);
      }
      
      if (config.data) {
        (dialogInstance as any).dialogData = config.data;
      }
      
      // 显示对话框
      dialogInstance.show();
      
      // 添加到管理列表
      this.dialogs.push(dialogInstance);
      
      // 监听关闭事件
      const originalClose = dialogInstance.close.bind(dialogInstance);
      dialogInstance.close = () => {
        originalClose();
        this.removeDialog(dialogInstance);
        // 清理DOM
        setTimeout(() => {
          if (dialogElement.parentNode) {
            dialogElement.parentNode.removeChild(dialogElement);
          }
        }, 300); // 等待动画完成
      };
    }
    
    return dialogInstance;
  }

  /**
   * 打开确认对话框
   */
  confirm(message: string, title: string = '确认'): Promise<boolean> {
    return new Promise((resolve) => {
      const dialog = this.create({
        title: title,
        data: { message, type: 'confirm' }
      });
      
      // 监听关闭事件
      const checkClose = () => {
        if (!dialog.visble) {
          resolve(false);
        } else {
          setTimeout(checkClose, 100);
        }
      };
      
      // 添加确认/取消按钮的处理
      (dialog as any).onConfirm = () => {
        dialog.close();
        resolve(true);
      };
      
      (dialog as any).onCancel = () => {
        dialog.close();
        resolve(false);
      };
      
      checkClose();
    });
  }

  /**
   * 打开警告对话框
   */
  alert(message: string, title: string = '提示'): Promise<void> {
    return new Promise((resolve) => {
      const dialog = this.create({
        title: title,
        data: { message, type: 'alert' }
      });
      
      // 监听关闭事件
      const checkClose = () => {
        if (!dialog.visble) {
          resolve();
        } else {
          setTimeout(checkClose, 100);
        }
      };
      
      // 添加确定按钮的处理
      (dialog as any).onOk = () => {
        dialog.close();
        resolve();
      };
      
      checkClose();
    });
  }

  /**
   * 关闭所有对话框
   */
  closeAll(): void {
    this.dialogs.forEach(dialog => {
      if (dialog.visble) {
        dialog.close();
      }
    });
    this.dialogs = [];
  }

  /**
   * 获取当前活动的对话框数量
   */
  getActiveDialogCount(): number {
    return this.dialogs.filter(dialog => dialog.visble).length;
  }

  private removeDialog(dialog: DialogComponent): void {
    const index = this.dialogs.indexOf(dialog);
    if (index > -1) {
      this.dialogs.splice(index, 1);
    }
  }
}

/**
 * 对话框配置接口
 */
export interface DialogConfig {
  /** 对话框标题 */
  title?: string;
  
  /** 对话框宽度 */
  width?: string;
  
  /** 对话框高度 */
  height?: string;
  
  /** 传递给对话框的数据 */
  data?: any;
  
  /** 是否禁用关闭 */
  disableClose?: boolean;
  
  /** 自定义类名 */
  panelClass?: string;
  
  /** 背景遮罩类名 */
  backdropClass?: string;
}