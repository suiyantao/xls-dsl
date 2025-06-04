import { Component, signal, WritableSignal } from "@angular/core";
import { MqType } from "src/app/enums/mq-type";
import { MessageService } from "src/app/service/message.service";

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    standalone: false
})
export class HeaderComponent {
  

  leftFold: WritableSignal<boolean> = signal(false);

 
  bottomFold: WritableSignal<boolean> = signal(false);


  constructor(public messageSrv: MessageService){}


  lPanelClick($event: MouseEvent){  
    this.leftFold.set(!this.leftFold());
    this.messageSrv.send({
      type: this.leftFold()? MqType.LEFT_FOLD_OFF: MqType.LEFT_FOLD
    })
  }

  bPanelClick($event: MouseEvent){
    this.bottomFold.set(!this.bottomFold());
    this.messageSrv.send({
      type: this.bottomFold() ? MqType.BOTTOM_FOLD_OFF: MqType.BOTTOM_FOLD
    })
  }

}