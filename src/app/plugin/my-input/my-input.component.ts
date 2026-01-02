import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-my-input',
  templateUrl: './my-input.component.html',
  styleUrl: './my-input.component.css',
  standalone: false,
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => MyInputComponent),
    multi: true
  }]
})
export class MyInputComponent implements ControlValueAccessor {

  @Input() placeholder: string = '';
  @Input() label: string = '';
  innerValue: any;
  onChange: (value: any) => void = () => {};
  onTouched: () => void = () => {};

  id: string;

  constructor() {
    this.id = this.uuidv4();
  }
  writeValue(value: any): void {
    this.innerValue = value;
  }
  registerOnChange(fn: any): void {
     this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  setDisabledState?(): void {
    // 禁用状态处理可以在这里实现
  }

  onInput(value: any): void {
    this.innerValue = value;
    this.onChange(value);
  }

  getValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  uuidv4() {
    return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c =>
      (parseInt(c) ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> parseInt(c) / 4).toString(16)
    );
  }

}
