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

  @ViewChild("dialog") dialog!: ElementRef;

  protected visble: boolean = false;

  public close(){
    this.visble = false;
  }

  public show(){
    this.visble = true;
  }

  public setTitle(title:string){
    this.title = title;
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



}
