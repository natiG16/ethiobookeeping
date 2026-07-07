import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../core/services/admin.service';
import { ToastService } from '../../core/services/toast.service';
import { AdminAccount } from '../../core/models/api.models';
import { apiErrorMessage } from '../../core/utils/http-error';

@Component({
  selector: 'app-admin-accounts',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="space-y-6 animate-fade-in">
      <header>
        <h1 class="page-title">Support — Customer accounts</h1>
        <p class="page-subtitle">Activate subscriptions, change plans, and manage user access.</p>
      </header>

      <div class="flex flex-wrap gap-3">
        <input
          class="input-field max-w-md flex-1"
          placeholder="Search name, email, or business…"
          [ngModel]="search()"
          (ngModelChange)="search.set($event)"
        />
        <button type="button" class="btn-secondary text-sm" (click)="load()" [disabled]="loading()">Refresh</button>
      </div>

      @if (error()) {
        <div class="alert-error">{{ error() }}</div>
      }

      @if (loading()) {
        <div class="card skeleton h-48"></div>
      } @else {
        <div class="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table class="w-full min-w-[720px] text-left text-sm">
            <thead class="border-b border-slate-100 bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th class="px-4 py-3">Customer</th>
                <th class="px-4 py-3">Business</th>
                <th class="px-4 py-3">Plan</th>
                <th class="px-4 py-3">Subscription</th>
                <th class="px-4 py-3">User</th>
                <th class="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (row of filtered(); track row.userId) {
                <tr class="border-b border-slate-50 hover:bg-slate-50/50">
                  <td class="px-4 py-3">
                    <p class="font-medium text-slate-900">{{ row.fullName }}</p>
                    <p class="text-xs text-slate-500">{{ row.email }}</p>
                  </td>
                  <td class="px-4 py-3 text-slate-700">{{ row.businessName || '—' }}</td>
                  <td class="px-4 py-3">
                    <select
                      class="input-field !py-1.5 !text-xs"
                      [ngModel]="row.subscriptionPlan || 'starter'"
                      (ngModelChange)="row.subscriptionPlan = $event"
                    >
                      <option value="starter">Starter</option>
                      <option value="business">Business</option>
                      <option value="pro">Pro</option>
                    </select>
                  </td>
                  <td class="px-4 py-3">
                    <label class="inline-flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        [ngModel]="row.subscriptionActive !== false"
                        (ngModelChange)="row.subscriptionActive = $event"
                      />
                      Active
                    </label>
                  </td>
                  <td class="px-4 py-3">
                    <span
                      class="rounded-full px-2 py-0.5 text-xs font-medium"
                      [class.bg-emerald-100]="row.userActive"
                      [class.text-emerald-800]="row.userActive"
                      [class.bg-red-100]="!row.userActive"
                      [class.text-red-800]="!row.userActive"
                    >
                      {{ row.userActive ? 'Active' : 'Deactivated' }}
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex flex-wrap gap-2">
                      <button
                        type="button"
                        class="btn-primary !py-1.5 !px-3 text-xs"
                        [disabled]="!row.businessId || savingId() === row.businessId"
                        (click)="saveSubscription(row)"
                      >
                        Save plan
                      </button>
                      <button
                        type="button"
                        class="btn-secondary !py-1.5 !px-3 text-xs"
                        [disabled]="savingId() === row.userId"
                        (click)="toggleUser(row)"
                      >
                        {{ row.userActive ? 'Deactivate user' : 'Activate user' }}
                      </button>
                    </div>
                  </td>
                </tr>
                @if (row.businessId) {
                  <tr class="border-b border-slate-100 bg-slate-50/40">
                    <td colspan="6" class="px-4 py-2">
                      <label class="text-xs font-medium text-slate-500">Support notes</label>
                      <input
                        class="input-field mt-1 !py-1.5 text-xs"
                        placeholder="Internal note (payment ref, date, etc.)"
                        [(ngModel)]="row.supportNotes"
                      />
                    </td>
                  </tr>
                }
              } @empty {
                <tr>
                  <td colspan="6" class="px-4 py-8 text-center text-slate-500">No accounts found.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
})
export class AdminAccountsComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);

  readonly accounts = signal<AdminAccount[]>([]);
  readonly search = signal('');
  readonly loading = signal(true);
  readonly error = signal('');
  readonly savingId = signal('');

  ngOnInit() {
    this.load();
  }

  filtered() {
    const q = this.search().trim().toLowerCase();
    const list = this.accounts();
    if (!q) return list;
    return list.filter(
      (a) =>
        a.fullName?.toLowerCase().includes(q) ||
        a.email?.toLowerCase().includes(q) ||
        a.businessName?.toLowerCase().includes(q)
    );
  }

  load() {
    this.loading.set(true);
    this.error.set('');
    this.admin.listAccounts().subscribe({
      next: (res) => {
        this.accounts.set(res.data ?? []);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(apiErrorMessage(e, 'Failed to load accounts'));
        this.loading.set(false);
      },
    });
  }

  saveSubscription(row: AdminAccount) {
    if (!row.businessId) return;
    this.savingId.set(row.businessId);
    this.admin
      .updateSubscription(row.businessId, {
        subscriptionPlan: row.subscriptionPlan || 'starter',
        subscriptionActive: row.subscriptionActive !== false,
        supportNotes: row.supportNotes,
      })
      .subscribe({
        next: (res) => {
          this.patchRow(res.data);
          this.toast.success('Subscription updated');
          this.savingId.set('');
        },
        error: (e) => {
          this.toast.error(apiErrorMessage(e, 'Update failed'));
          this.savingId.set('');
        },
      });
  }

  toggleUser(row: AdminAccount) {
    this.savingId.set(row.userId);
    this.admin.setUserActive(row.userId, !row.userActive).subscribe({
      next: (res) => {
        this.patchRow(res.data);
        this.toast.success(res.data.userActive ? 'User activated' : 'User deactivated');
        this.savingId.set('');
      },
      error: (e) => {
        this.toast.error(apiErrorMessage(e, 'Update failed'));
        this.savingId.set('');
      },
    });
  }

  private patchRow(updated: AdminAccount) {
    this.accounts.update((list) =>
      list.map((a) => (a.userId === updated.userId ? { ...a, ...updated } : a))
    );
  }
}
