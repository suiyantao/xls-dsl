import { ChangeDetectorRef, Component, ElementRef, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { message } from '@tauri-apps/plugin-dialog';
import { CdkVirtualScrollViewport } from "@angular/cdk/scrolling";
import { BehaviorSubject, debounceTime, fromEvent, Subject, throttleTime } from "rxjs";
import { MqType } from "../../enums/mq-type";
import { MessageService } from "../../service/message.service";
import { RunLog } from '../../modal/run-log';

const appWindow = getCurrentWebviewWindow();

@Component({
  selector: 'app-terminal',
  templateUrl: './terminal.component.html',
  styleUrl: './terminal.component.css',
  standalone: false
})
export class TerminalComponent implements OnInit {

  public running: boolean = false;

  @ViewChild("xterm") xterm!: ElementRef;

  @ViewChild("xtermView") xtermView!: ElementRef;

  @Output()
  runClick: EventEmitter<string> = new EventEmitter();

  @ViewChild("content") content!: ElementRef;

  @ViewChild(CdkVirtualScrollViewport, { static: true }) scrollViewport!: CdkVirtualScrollViewport;

  logSubject = new Subject<string>();

  messageProduct = new BehaviorSubject<RunLog[]>([]);
  message: RunLog[] = [];

  constructor(
    private messageSrv: MessageService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializeEventListeners();
    this.initializeResizeHandling();
    this.initializeMessageService();
  }

  private async initializeEventListeners(): Promise<void> {
    await appWindow.listen<RunLog>('println', (data) => {
      const res = data.payload;
      if (res.logType !== "result") {
        this.setAMsg(res);
      }
      if (res.logType === "result" || res.logType === "error") {
        this.running = false;
        this.changeDetectorRef.detectChanges();
        this.scrollToBottom();
      }
    });
  }

  private initializeResizeHandling(): void {
    fromEvent(window, "resize")
      .pipe(throttleTime(1000), debounceTime(1000))
      .subscribe(() => {
        setTimeout(() => {
          this.scrollViewport.checkViewportSize();
        }, 10);
      });
  }

  private initializeMessageService(): void {
    this.messageSrv.onMessage(message => {
      if (message.type === MqType.SPLIT) {
        setTimeout(() => {
          this.scrollViewport.checkViewportSize();
        }, 10);
      }
    });
  }

  private setAMsg(msg: RunLog): void {
    const lines = msg.msg.split(/[\n\r]/);
    lines.forEach(line => {
      if (line.trim()) {
        this.message.push({
          logType: msg.logType,
          msg: line
        });
      }
    });
    this.messageProduct.next([...this.message]);
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      this.scrollViewport.scrollTo({ bottom: 0, behavior: "smooth" });
    }, 10);
  }

  async play($event: MouseEvent): Promise<void> {
    $event.stopPropagation();
    await this.clear($event);
    this.running = true;
    this.runClick.emit("run");
  }

  async clear($event: MouseEvent): Promise<void> {
    $event.stopPropagation();
    this.message = [];
    this.messageProduct.next([]);
  }

  async copyClick($event: MouseEvent): Promise<void> {
    $event.stopPropagation();
    if (this.message.length === 0) {
      await message("没有可复制的内容", { title: "", kind: "warning" });
      return;
    }
    const copyText = this.message.map(x => x.msg).join("\n");
    try {
      await writeText(copyText);
      await message("复制成功", { title: "", kind: "info" });
    } catch (error) {
      console.error("复制失败:", error);
      await message("复制失败", { title: "", kind: "error" });
    }
  }

  xtermViewClick($event: MouseEvent): void {
    $event.stopPropagation();
  }

  xtermChange($event: Event): void {
    $event.preventDefault();
  }

  scrollViewportChange($event: Event): void {
    $event.stopPropagation();
  }

  trackByIndex(index: number, item: RunLog): number {
    return index;
  }

  getLineNumberWidth(): string {
    const lineCount = this.message.length;
    const digitCount = lineCount.toString().length;
    return `${Math.max(40, digitCount * 8)}px`;
  }
}
