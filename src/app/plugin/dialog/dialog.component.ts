import {animate, sequence, state, style, transition, trigger} from '@angular/animations';
import {Component, ElementRef, HostListener, Input, ViewChild} from '@angular/core';

@Component({
    selector: 'app-dialog',
    templateUrl: './dialog.component.html',
    styleUrls: ['./dialog.component.css'],
    animations: [
        trigger('openClose', [
            state('true', style({
                opacity: 1,
                transform: 'scale(1) translateY(0)'
            })),
            state('false', style({
                opacity: 0,
                transform: 'scale(0.95) translateY(-10px)',
                display: "none"
            })),
            transition("false=>true", [
                sequence([
                    style({ display: "block", opacity: 0, transform: 'scale(0.95) translateY(-10px)' }),
                    animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'scale(1) translateY(0)' }))
                ])
            ]),
            transition("true=>false", [
                animate('200ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 0, transform: 'scale(0.95) translateY(-10px)' }))
            ])
        ]),
        trigger('backdropAnimation', [
            state('true', style({ opacity: 1 })),
            state('false', style({ opacity: 0 })),
            transition('false => true', [
                style({ opacity: 0 }),
                animate('300ms ease-out')
            ]),
            transition('true => false', [
                animate('200ms ease-in')
            ])
        ])
    ],
    standalone: false
})
export class DialogComponent{

  
  @Input({required:true}) title!: string;
  @Input() content?: string;
  @Input() type: 'default' | 'confirm' | 'alert' = 'default';

  @ViewChild("dialog") dialog!: ElementRef;

  visble: boolean = false;
  
  // 动态内容支持
  dialogData?: any;
  onConfirm?: () => void;
  onCancel?: () => void;
  onOk?: () => void;

  public close(){
    this.visble = false;
  }

  public show(){
    this.visble = true;
  }

  public setTitle(title:string){
    this.title = title;
  }
  
  // 动态内容方法
  public setContent(content: string): void {
    this.content = content;
  }
  
  public setData(data: any): void {
    this.dialogData = data;
  }
  
  public setType(type: 'default' | 'confirm' | 'alert'): void {
    this.type = type;
  }
  
  // 处理动态按钮点击
  handleConfirm(): void {
    if (this.onConfirm) {
      this.onConfirm();
    } else {
      this.close();
    }
  }
  
  handleCancel(): void {
    if (this.onCancel) {
      this.onCancel();
    } else {
      this.close();
    }
  }
  
  handleOk(): void {
    if (this.onOk) {
      this.onOk();
    } else {
      this.close();
    }
  }

  onBackdropClick() {
    this.close();
  }

  @HostListener('click', ['$event.target'])
  onClick(target: EventTarget | null): void {
    if (target instanceof HTMLElement && target.matches('.dialog-overlay')) {
      this.close();
    }
  }

  @HostListener('window:keydown', ['$event'])
  onEscape(event: KeyboardEvent): void {
    if (event.code === 'Escape') {
      this.close();
    }
  }

  public isVisible(): boolean {
    return this.visble;
  }



}
