import { OverlayRef } from '@angular/cdk/overlay';
import { Observable, Subject } from 'rxjs';

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
  
  /** 最小宽度 */
  minWidth?: string;
  
  /** 最小高度 */
  minHeight?: string;
  
  /** 最大宽度 */
  maxWidth?: string;
  
  /** 最大高度 */
  maxHeight?: string;
  
  /** 是否有背景遮罩 */
  hasBackdrop?: boolean;
  
  /** 背景遮罩类名 */
  backdropClass?: string;
  
  /** 面板类名 */
  panelClass?: string;
  
  /** 是否禁用ESC键和背景点击关闭 */
  disableClose?: boolean;
  
  /** 传递给对话框的数据 */
  data?: any;
}

/**
 * 对话框引用类
 */
export class DialogRef<T = any> {
  private _afterClosed = new Subject<T>();
  
  constructor(private overlayRef: OverlayRef) {}
  
  /**
   * 关闭对话框
   * @param result 返回结果
   */
  close(result?: T): void {
    this.overlayRef.dispose();
    if (result !== undefined) {
      this._afterClosed.next(result);
    }
    this._afterClosed.complete();
  }
  
  /**
   * 监听对话框关闭事件
   */
  afterClosed(): Observable<T> {
    return this._afterClosed.asObservable();
  }
}