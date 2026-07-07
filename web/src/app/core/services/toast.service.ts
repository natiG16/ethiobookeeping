import { Injectable, signal } from '@angular/core';

export type ToastKind = 'success' | 'error';

export interface Toast {
  id: number;
  message: string;
  kind: ToastKind;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 0;
  readonly toasts = signal<Toast[]>([]);

  success(message: string, durationMs = 2800) {
    this.show(message, 'success', durationMs);
  }

  error(message: string, durationMs = 4000) {
    this.show(message, 'error', durationMs);
  }

  private show(message: string, kind: ToastKind, durationMs: number) {
    const id = ++this.nextId;
    this.toasts.update((list) => [...list, { id, message, kind }]);
    window.setTimeout(() => this.dismiss(id), durationMs);
  }

  dismiss(id: number) {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }
}
