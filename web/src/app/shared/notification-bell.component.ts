import { Component, HostListener, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService } from '../core/services/notification.service';
import { LocaleService } from '../core/services/locale.service';
import { AppNotification } from '../core/models/api.models';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  template: `
    <div class="notif-bell relative">
      <button
        type="button"
        class="notif-bell-btn"
        (click)="toggle()"
        [attr.aria-expanded]="open()"
        aria-label="Notifications"
      >
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        @if (notifications.unreadCount() > 0) {
          <span class="notif-bell-badge">{{ notifications.unreadCount() > 9 ? '9+' : notifications.unreadCount() }}</span>
        }
      </button>

      @if (open()) {
        <div class="notif-bell-panel" role="dialog" aria-label="Notifications">
          <div class="notif-bell-panel-head">
            <h2 class="text-sm font-semibold text-slate-900">{{ locale.t('notifications.title') }}</h2>
          </div>
          <div class="notif-bell-panel-body">
            @if (loading()) {
              <p class="p-4 text-center text-sm text-slate-500">{{ locale.t('common.loading') }}</p>
            } @else if (!items().length) {
              <p class="p-6 text-center text-sm text-slate-500">{{ locale.t('notifications.empty') }}</p>
            } @else {
              @for (n of items(); track n.id) {
                <button
                  type="button"
                  class="notif-item"
                  [class.notif-item-unread]="!n.read"
                  (click)="openNotification(n)"
                >
                  <p class="font-medium text-slate-900">{{ n.title }}</p>
                  <p class="mt-0.5 text-xs text-slate-600">{{ n.message }}</p>
                </button>
              }
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  readonly notifications = inject(NotificationService);
  readonly locale = inject(LocaleService);
  private readonly router = inject(Router);

  readonly open = signal(false);
  readonly loading = signal(false);
  readonly items = signal<AppNotification[]>([]);

  private pollTimer: ReturnType<typeof setInterval> | null = null;

  ngOnInit() {
    this.notifications.refresh();
    this.pollTimer = setInterval(() => this.notifications.refresh(), 5 * 60 * 1000);
  }

  ngOnDestroy() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
    }
  }

  toggle() {
    this.open.update((v) => !v);
    if (this.open()) {
      this.loadList();
    }
  }

  private loadList() {
    this.loading.set(true);
    this.notifications.list().subscribe({
      next: (res) => {
        this.items.set(res.data?.content ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.items.set([]);
        this.loading.set(false);
      },
    });
  }

  openNotification(n: AppNotification) {
    if (!n.read) {
      this.notifications.markRead(n.id).subscribe({
        next: () => {
          this.items.update((list) => list.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
          this.notifications.refreshUnreadCount();
        },
      });
    }
    if (n.type === 'DEBT_REMINDER') {
      this.open.set(false);
      void this.router.navigate(['/app/debts']);
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.notif-bell')) {
      this.open.set(false);
    }
  }
}
