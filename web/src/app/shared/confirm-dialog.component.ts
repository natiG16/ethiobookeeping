import { Component, inject } from '@angular/core';
import { ConfirmDialogService } from '../core/services/confirm-dialog.service';
import { ModalOverlayComponent } from './modal-overlay.component';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [ModalOverlayComponent],
  template: `
    @if (dialog.state(); as s) {
      <app-modal-overlay
        panelClass="modal-card animate-scale-in"
        panelRole="alertdialog"
        panelLabelledBy="confirm-title"
        (close)="dialog.close(false)"
      >
        <div class="modal-icon" [class.modal-icon-danger]="s.danger">
          @if (s.danger) {
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          } @else {
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        </div>

        <h2 id="confirm-title" class="modal-title">{{ s.title }}</h2>
        <p class="modal-message">{{ s.message }}</p>

        <div class="modal-actions">
          <button type="button" class="btn-secondary flex-1" (click)="dialog.close(false)">
            {{ s.cancelLabel }}
          </button>
          <button
            type="button"
            class="flex-1"
            [class.btn-danger-solid]="s.danger"
            [class.btn-primary]="!s.danger"
            (click)="dialog.close(true)"
          >
            {{ s.confirmLabel }}
          </button>
        </div>
      </app-modal-overlay>
    }
  `,
})
export class ConfirmDialogComponent {
  readonly dialog = inject(ConfirmDialogService);
}
