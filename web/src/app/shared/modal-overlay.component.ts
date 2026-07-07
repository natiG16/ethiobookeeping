import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  output,
} from '@angular/core';
import { lockBodyScroll, unlockBodyScroll } from '../core/utils/body-scroll-lock';

@Component({
  selector: 'app-modal-overlay',
  standalone: true,
  template: `
    <div
      class="modal-overlay"
      role="presentation"
      (click)="onBackdropClick()"
      (keydown.escape)="close.emit()"
    >
      <div
        [class]="panelClass()"
        [attr.role]="panelRole()"
        [attr.aria-labelledby]="panelLabelledBy()"
        aria-modal="true"
        (click)="$event.stopPropagation()"
      >
        <ng-content />
      </div>
    </div>
  `,
})
export class ModalOverlayComponent {
  readonly panelClass = input('modal-overlay-panel');
  readonly panelRole = input<'dialog' | 'alertdialog'>('dialog');
  readonly panelLabelledBy = input<string | null>(null);
  readonly closeOnBackdrop = input(true);
  readonly close = output<void>();

  private readonly doc = inject(DOCUMENT);
  private readonly host = inject(ElementRef<HTMLElement>);
  private portaled = false;

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const el = this.host.nativeElement;
      if (el.parentElement !== this.doc.body) {
        this.doc.body.appendChild(el);
        this.portaled = true;
      }
      lockBodyScroll(this.doc);
    });

    destroyRef.onDestroy(() => {
      unlockBodyScroll(this.doc);
      if (this.portaled && this.host.nativeElement.parentElement === this.doc.body) {
        this.host.nativeElement.remove();
      }
    });
  }

  onBackdropClick(): void {
    if (this.closeOnBackdrop()) {
      this.close.emit();
    }
  }
}
