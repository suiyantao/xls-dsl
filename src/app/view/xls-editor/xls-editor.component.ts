import {
    AfterViewInit,
    Component,
    ElementRef,
    HostListener,
    inject,
    OnInit,
    QueryList,
    ViewChild,
    ViewChildren
} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {IOutputData, SplitAreaDirective, SplitComponent} from 'angular-split';
import {ask, open} from '@tauri-apps/plugin-dialog';
import {animate, sequence, state, style, transition, trigger} from '@angular/animations';
import {invoke} from "@tauri-apps/api/core";
import {TerminalComponent} from "../../plugin/terminal/terminal.component";
import { Menu, MenuItem } from '@tauri-apps/api/menu';
import { MonacoEditorComponent } from '../../plugin/monaco-editor/monaco-editor.component';
import { DialogComponent } from '../../plugin/dialog/dialog.component';
import { FileInfo } from '../../modal/file-info';
import { MessageService } from '../../service/message.service';
import { MqType } from '../../enums/mq-type';


@Component({
    selector: 'app-xls-editor',
    templateUrl: './xls-editor.component.html',
    styleUrl: './xls-editor.component.css',
    animations: [
        trigger('openClose', [
            state('true', style({
                opacity: 1,
            })),
            state('false', style({
                opacity: 0,
                display: "none"
            })),
            transition("false=>true", [
                sequence([
                    style({ display: "block", opacity: 0.1 }),
                    animate(500, style({ opacity: 1 }))
                ])
            ]),
            transition('* => *', [
                animate('0.2s ease')
            ])
        ])
    ],
    standalone: false
})
export class XlsEditorComponent implements AfterViewInit, OnInit {


    @ViewChild("splitEl") splitEl!: SplitComponent;
    @ViewChild("splitPEl") splitPEl!: SplitComponent;
    @ViewChildren(SplitAreaDirective) areasEl!: QueryList<SplitAreaDirective>
    @ViewChild("monacoEditor") monacoEditor!: MonacoEditorComponent;
    @ViewChild("fileDialog") fileDialog!: DialogComponent;
    @ViewChild("fileContentMenu") fileContentMenu!: ElementRef;

    @ViewChildren("fileItem") fileItem!: QueryList<ElementRef>
    @ViewChildren("fileItem") terminalComponent!: TerminalComponent

    menu = Menu.new({
        items: [
            {
                text: '新建',
                action: () => {
                    this.addFile();
                }
            },
            {
                text: '修改',
                action: () => {
                    this.editFile();
                }
            },
            {
                text: '删除',
                action: () => {
                    this.delFile();
                }
            }
        ]
    });

    xlsId!: number;

    fileList = Array<FileInfo>();

    fileForm = new FormGroup({
        id: new FormControl(''),
        name: new FormControl('', [Validators.required, Validators.minLength(4)]),
        xlxTemplate: new FormControl('', [Validators.required]),
    });

    messageSrv = inject(MessageService)

    ngOnInit() {
        invoke<Array<FileInfo>>("find_all_file").then(res => {            
            this.fileList = res;
        })
    }

    ngAfterViewInit(): void {

        this.messageSrv.onMessage(x => {
            switch (x.type) {
                case MqType.LEFT_FOLD:
                    this.areasEl.first.expand();
                    this.monacoEditor.fitEditor();
                    this.splitPEl.disabled = false;
                    break;
                case MqType.LEFT_FOLD_OFF:
                    this.areasEl.first.collapse(0, 'left');
                    this.monacoEditor.fitEditor();
                    this.splitPEl.disabled = true;
                    break;
                case MqType.BOTTOM_FOLD:
                    this.areasEl.last.expand();
                    this.monacoEditor.fitEditor();
                    this.splitEl.disabled = false;
                    break;
                case MqType.BOTTOM_FOLD_OFF:
                    this.areasEl.last.collapse(0, 'left');
                    this.monacoEditor.fitEditor();
                    this.splitEl.disabled = true;
                    break;
                default:
            }

        });
    }

    dragEnd($event: IOutputData) {
        this.messageSrv.send({
            type: MqType.SPLIT
        })
    }


    refresh($event: MouseEvent) {

    }

    addFile() {
        this.fileDialog.show();
        this.fileForm.reset();
        this.fileDialog.setTitle('新增');
    }

    editFile() {
        const selectedFile = this.fileList.filter(x=>x.selected)[0];
        this.fileForm.patchValue(selectedFile as any);
        this.fileDialog.show();
        this.fileDialog.setTitle('修改');
    }

    async delFile() {
        const yes: boolean = await ask('你确定删除?', {title: '系统提示', kind: 'warning'});
        if (yes) {
            const selectedFile = this.fileList.filter(x=>x.selected)[0];
            const res = await invoke<FileInfo>("remove_file", {id: selectedFile.id});
            const index = this.fileList.indexOf(selectedFile, 0);
            if (index > -1) {
                this.fileList.splice(index, 1);
            }
        }
    }

    @HostListener('document:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        if (event.key === 'Enter') {
             this.saveClick();
        }
    }

    async saveClick() {
        const fileForm = this.fileForm.value
        if(!fileForm.name){
             open({
                title: '系统提示',
                kind: 'warning',
                content: '请输入文件名'
             })
            return;
        }
        if(!fileForm.xlxTemplate){
             open({
                title: '系统提示',
                kind: 'warning',
                content: '请选择文件'
             })
            return;
        }
        if(fileForm.id){
            let add_form = {
                id : fileForm.id,
                name: fileForm.name as string,
                xls: fileForm.xlxTemplate as string
            }    
            const res = await invoke<FileInfo>("update_name_xls_by_id", {...add_form});
            this.fileList.forEach(x=>{
                if(x.id === fileForm.id){
                    x.name  = res.name;
                    x.xlxTemplate  = res.xlxTemplate;
                    x.code  = res.code;
                }
            })
        }else {
            let add_form = {
                name: fileForm.name as string,
                xlxTemplate: fileForm.xlxTemplate as string,
                code: ""
            }    
            const res = await invoke<FileInfo>("add_file", {newFile: add_form});
            this.fileList.push(res);
        }

       
        this.fileDialog.close();
    }


    fileClick($event: MouseEvent, filInfo: FileInfo) {
        filInfo.selected = true;
        this.xlsId = filInfo.id as number;
        this.fileList.forEach(x => {
            if (x != filInfo) {
                x.selected = false;
            }
        })
    }

    async fileContextmenu(event: MouseEvent, filInfo: FileInfo) {
        filInfo.selected = true;
        this.fileList.forEach(x => {
            if (x != filInfo) {
                x.selected = false;
            }
        })
        event.preventDefault();
        let menu =  await this.menu;
        menu.popup()
    }


    async runClick($event: String) {
       let fileInfo = this.fileList.find(x=>x.selected);
       if(!fileInfo){
           return
       }
       await invoke('run', {id: fileInfo.id});
    }

}
