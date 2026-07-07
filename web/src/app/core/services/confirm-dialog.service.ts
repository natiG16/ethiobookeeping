import { Injectable, signal } from '@angular/core';

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

export interface ConfirmDialogState extends ConfirmDialogOptions {
  open: true;
  confirmLabel: string;
  cancelLabel: string;
  danger: boolean;
}

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  readonly state = signal<ConfirmDialogState | null>(null);

  private resolver: ((value: boolean) => void) | null = null;

  confirm(options: ConfirmDialogOptions): Promise<boolean> {
    return new Promise((resolve) => {
      this.resolver = resolve;
      this.state.set({
        open: true,
        title: options.title,
        message: options.message,
        confirmLabel: options.confirmLabel ?? 'Confirm',
        cancelLabel: options.cancelLabel ?? 'Cancel',
        danger: options.danger ?? false,
      });
    });
  }

  close(confirmed: boolean) {
    this.state.set(null);
    this.resolver?.(confirmed);
    this.resolver = null;
  }
}
