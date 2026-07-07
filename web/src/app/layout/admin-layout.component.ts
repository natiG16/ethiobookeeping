import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { BrandLogoComponent } from '../shared/brand-logo.component';
import { ToastContainerComponent } from '../shared/toast-container.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, BrandLogoComponent, ToastContainerComponent],
  template: `
    <div class="min-h-screen bg-slate-100">
      <header class="border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div class="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <app-brand-logo name="mysuq Admin" size="sm" />
            <nav class="hidden gap-4 sm:flex">
              <a routerLink="/admin/accounts" routerLinkActive="font-semibold text-brand-700" class="text-sm text-slate-600">
                Customer accounts
              </a>
            </nav>
          </div>
          <div class="flex items-center gap-2">
            <span class="hidden text-xs text-slate-500 sm:inline">{{ auth.user()?.email }}</span>
            <button type="button" class="btn-secondary text-xs" (click)="auth.logout()">Log out</button>
          </div>
        </div>
      </header>

      <main class="mx-auto max-w-6xl p-4 sm:p-6">
        <router-outlet />
      </main>

      <app-toast-container />
    </div>
  `,
})
export class AdminLayoutComponent {
  readonly auth = inject(AuthService);
}
