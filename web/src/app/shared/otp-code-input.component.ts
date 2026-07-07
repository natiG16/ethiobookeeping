import { Component, computed, effect, ElementRef, input, output, signal, viewChildren } from '@angular/core';

type Digit = '' | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';

@Component({
  selector: 'app-otp-code-input',
  standalone: true,
  template: `
    <div class="grid grid-cols-6 gap-2 sm:gap-3">
      @for (i of idx(); track i) {
        <input
          #box
          class="otp-box"
          [attr.aria-label]="'Digit ' + (i + 1)"
          inputmode="numeric"
          autocomplete="one-time-code"
          maxlength="1"
          [disabled]="disabled()"
          [value]="digits()[i]"
          (input)="onInput(i, $event)"
          (keydown)="onKeyDown(i, $event)"
          (paste)="onPaste(i, $event)"
        />
      }
    </div>
  `,
})
export class OtpCodeInputComponent {
  readonly length = input<number>(6);
  readonly disabled = input<boolean>(false);
  readonly value = input<string>('');

  readonly valueChange = output<string>();
  readonly completed = output<string>();

  readonly digits = signal<Digit[]>(Array.from({ length: 6 }, () => ''));

  readonly idx = computed(() => Array.from({ length: this.length() }, (_, i) => i));
  private readonly boxes = viewChildren<ElementRef<HTMLInputElement>>('box');

  constructor() {
    effect(() => {
      const v = (this.value() || '').replace(/\D/g, '').slice(0, this.length());
      if (!v) return;
      const next = Array.from({ length: this.length() }, (_, i) => (v[i] as Digit) || '');
      this.digits.set(next);
    });
  }

  private emit() {
    const code = this.digits().join('');
    this.valueChange.emit(code);
    if (code.length === this.length() && !code.includes('')) {
      this.completed.emit(code);
    }
  }

  focus(index: number) {
    const el = this.boxes()?.[index]?.nativeElement;
    if (!el) return;
    el.focus();
    el.select();
  }

  onInput(index: number, e: Event) {
    if (this.disabled()) return;
    const raw = (e.target as HTMLInputElement).value;
    const d = raw.replace(/\D/g, '').slice(-1) as Digit;
    const next = [...this.digits()];
    next[index] = d || '';
    this.digits.set(next);
    this.emit();
    if (d && index < this.length() - 1) this.focus(index + 1);
  }

  onKeyDown(index: number, e: KeyboardEvent) {
    if (this.disabled()) return;
    if (e.key === 'Backspace') {
      const next = [...this.digits()];
      if (next[index]) {
        next[index] = '';
        this.digits.set(next);
        this.emit();
        e.preventDefault();
        return;
      }
      if (index > 0) {
        this.focus(index - 1);
        const after = [...this.digits()];
        after[index - 1] = '';
        this.digits.set(after);
        this.emit();
        e.preventDefault();
      }
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      this.focus(index - 1);
      e.preventDefault();
    }
    if (e.key === 'ArrowRight' && index < this.length() - 1) {
      this.focus(index + 1);
      e.preventDefault();
    }
  }

  onPaste(index: number, e: ClipboardEvent) {
    if (this.disabled()) return;
    const text = e.clipboardData?.getData('text') ?? '';
    const only = text.replace(/\D/g, '').slice(0, this.length() - index);
    if (!only) return;
    const next = [...this.digits()];
    for (let i = 0; i < only.length; i++) {
      next[index + i] = only[i] as Digit;
    }
    this.digits.set(next);
    this.emit();
    const end = Math.min(this.length() - 1, index + only.length - 1);
    this.focus(end);
    e.preventDefault();
  }
}
