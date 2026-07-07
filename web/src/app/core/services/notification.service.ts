import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiResponse, AppNotification, Page } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  readonly unreadCount = signal(0);

  /** Sync due-date debt reminders, then refresh unread badge. */
  refresh() {
    this.http
      .post<ApiResponse<{ created: number }>>(`${environment.apiUrl}/notifications/sync-debt-reminders`, {})
      .subscribe({
        next: () => this.refreshUnreadCount(),
        error: () => this.refreshUnreadCount(),
      });
  }

  refreshUnreadCount() {
    this.http
      .get<ApiResponse<{ count: number }>>(`${environment.apiUrl}/notifications/unread-count`)
      .subscribe({
        next: (res) => this.unreadCount.set(res.data?.count ?? 0),
        error: () => this.unreadCount.set(0),
      });
  }

  list(page = 0, size = 20) {
    return this.http.get<ApiResponse<Page<AppNotification>>>(
      `${environment.apiUrl}/notifications?page=${page}&size=${size}`
    );
  }

  markRead(id: string) {
    return this.http.patch<ApiResponse<void>>(`${environment.apiUrl}/notifications/${id}/read`, {});
  }
}
