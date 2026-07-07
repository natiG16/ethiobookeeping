import { NgTemplateOutlet } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { LocaleService } from '../core/services/locale.service';
import { BrandLogoComponent } from '../shared/brand-logo.component';
import { ToastContainerComponent } from '../shared/toast-container.component';
import { ConfirmDialogComponent } from '../shared/confirm-dialog.component';
import { UpgradePlanModalComponent } from '../shared/upgrade-plan-modal.component';
import { UpgradePlanModalService } from '../core/services/upgrade-plan-modal.service';
import { PlanFeatureService } from '../core/services/plan-feature.service';
import { SupportContactComponent } from '../shared/support-contact.component';
import { BusinessSwitcherComponent } from '../shared/business-switcher.component';
import { PaymentMethodContextService } from '../core/services/payment-method-context.service';
import { CategoryContextService } from '../core/services/category-context.service';
import { ProductContextService } from '../core/services/product-context.service';
import { BusinessContextService } from '../core/services/business-context.service';
import { UserMenuComponent } from '../shared/user-menu.component';
import { NotificationBellComponent } from '../shared/notification-bell.component';

type NavKey = 'dashboard' | 'transactions' | 'customers' | 'debts' | 'suppliers' | 'inventory' | 'reports' | 'settings';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    BrandLogoComponent,
    NgTemplateOutlet,
    ToastContainerComponent,
    ConfirmDialogComponent,
    UpgradePlanModalComponent,
    SupportContactComponent,
    BusinessSwitcherComponent,
    UserMenuComponent,
    NotificationBellComponent,
  ],
  template: `
    <div class="flex min-h-screen bg-mesh-app">
      <!-- Desktop sidebar -->
      <aside
        class="app-sidebar hidden flex-col border-r border-slate-200/60 shadow-slick backdrop-blur-xl transition-all duration-300 lg:flex"
        [class.w-[17rem]]="!desktopSidebarCollapsed()"
        [class.w-[4.5rem]]="desktopSidebarCollapsed()"
      >
        <div class="flex items-center gap-2 border-b border-slate-100 p-4">
          <button
            type="button"
            class="logo-menu-btn shrink-0"
            (click)="toggleDesktopSidebar()"
            [attr.aria-pressed]="desktopSidebarCollapsed()"
            aria-label="Toggle menu"
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          @if (!desktopSidebarCollapsed()) {
            <app-brand-logo [name]="locale.t('app.name')" size="sm" />
          }
        </div>

        <nav class="flex flex-1 flex-col gap-0.5 p-3">
          @for (item of nav; track item.path) {
            <a [routerLink]="item.path" routerLinkActive="nav-link-active" class="nav-link" [title]="locale.t(item.key)">
              <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                <ng-container *ngTemplateOutlet="navIcon; context: { $implicit: item.icon }" />
              </span>
              @if (!desktopSidebarCollapsed()) {
                <span class="flex min-w-0 flex-1 items-center gap-2">
                  {{ locale.t(item.key) }}
                  @if (item.icon === 'reports' && !planFeatures.canPdfReports()) {
                    <span class="shrink-0 rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-violet-700">
                      {{ locale.t('nav.reports.locked') }}
                    </span>
                  }
                </span>
              }
            </a>
          }
          <button
            type="button"
            class="nav-link w-full text-left"
            [title]="locale.t('plan.upgrade.cta')"
            (click)="openUpgrade()"
          >
            <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
              <svg class="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </span>
            @if (!desktopSidebarCollapsed()) {
              {{ locale.t('plan.upgrade.cta') }}
            }
          </button>
        </nav>

        @if (!desktopSidebarCollapsed()) {
          <div class="border-t border-slate-100 p-4">
            <div class="rounded-xl border border-brand-100 bg-brand-50/50 p-3">
              <p class="truncate text-xs font-medium text-brand-900">{{ auth.user()?.fullName }}</p>
              <p class="truncate text-[11px] text-slate-400">{{ auth.user()?.email }}</p>
            </div>
          </div>
        }
      </aside>

      <div class="flex min-h-screen min-w-0 flex-1 flex-col">
        <header class="app-header safe-top sticky top-0 z-40 border-b border-slate-200/60 bg-white/80 shadow-slick backdrop-blur-xl">
          <div class="app-header-bar mx-auto grid max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3 lg:px-8">
            <div class="flex items-center justify-start lg:hidden">
              <button
                type="button"
                class="logo-menu-btn"
                (click)="toggleMenu()"
                [attr.aria-expanded]="menuOpen()"
                aria-label="Open menu"
              >
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
            <div class="hidden lg:block"></div>

            <div class="flex min-w-0 justify-center px-1">
              <app-business-switcher />
            </div>

            <div class="flex shrink-0 items-center justify-end gap-1 sm:gap-2">
              <app-notification-bell />
              <app-user-menu />
            </div>
          </div>
        </header>

        <main class="flex-1 p-4 lg:p-8">
          <div class="mx-auto max-w-6xl animate-fade-in">
            @if (!auth.isServiceActive()) {
              <div class="card flex flex-col items-center px-6 py-16 text-center">
                <div class="empty-state-icon mb-2" aria-hidden="true">
                  <svg class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 class="font-display text-xl font-bold text-slate-900">{{ locale.t('service.deactivated.title') }}</h2>
                <p class="mt-3 max-w-md text-sm text-slate-600">{{ locale.t('service.deactivated.message') }}</p>
                <div class="mt-6 w-full max-w-md">
                  <app-support-contact />
                </div>
                <button type="button" class="btn-secondary mt-8" (click)="auth.logout()">
                  {{ locale.t('auth.logout') }}
                </button>
              </div>
            } @else {
              @if (!planFeatures.canPdfReports()) {
                <div class="upgrade-banner">
                  <span>{{ locale.t('plan.upgrade.banner') }}</span>
                  <button type="button" class="btn-secondary !py-1.5 !text-xs" (click)="openUpgrade()">
                    {{ locale.t('plan.upgrade.cta') }}
                  </button>
                </div>
              }
              <router-outlet />
            }
          </div>
        </main>
      </div>

      @if (menuOpen()) {
        <button
          type="button"
          class="fixed inset-0 z-50 bg-brand-900/20 backdrop-blur-[2px] lg:hidden"
          aria-label="Close menu"
          (click)="closeMenu()"
        ></button>
      }

      <!-- Mobile nav drawer -->
      <aside
        class="fixed inset-y-0 left-0 z-[60] flex w-[min(280px,85vw)] flex-col border-r border-brand-100 bg-white shadow-xl transition-transform duration-300 ease-out lg:hidden"
        [class.-translate-x-full]="!menuOpen()"
        [class.translate-x-0]="menuOpen()"
      >
        <div class="flex items-center gap-2 border-b border-slate-100 p-4">
          <button type="button" class="logo-menu-btn shrink-0" (click)="closeMenu()" aria-label="Close menu">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <app-brand-logo [name]="locale.t('app.name')" size="sm" />
        </div>

        <nav class="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          @for (item of nav; track item.path) {
            <a
              [routerLink]="item.path"
              routerLinkActive="nav-link-active"
              class="nav-link"
              (click)="closeMenu()"
            >
              <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                <ng-container *ngTemplateOutlet="navIcon; context: { $implicit: item.icon }" />
              </span>
              <span class="flex flex-1 items-center gap-2">
                {{ locale.t(item.key) }}
                @if (item.icon === 'reports' && !planFeatures.canPdfReports()) {
                  <span class="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-violet-700">
                    {{ locale.t('nav.reports.locked') }}
                  </span>
                }
              </span>
            </a>
          }
          <button type="button" class="nav-link w-full text-left" (click)="openUpgrade(); closeMenu()">
            <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
              <svg class="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </span>
            {{ locale.t('plan.upgrade.cta') }}
          </button>
        </nav>

        <div class="border-t border-brand-100 p-4">
          <div class="rounded-xl border border-brand-100 bg-brand-50/50 p-3">
            <p class="truncate text-xs font-medium text-brand-900">{{ auth.user()?.fullName }}</p>
            <p class="truncate text-[11px] text-slate-400">{{ auth.user()?.email }}</p>
          </div>
          <button type="button" class="btn-secondary mt-3 w-full text-sm" (click)="toggleLang(); closeMenu()">
            {{ locale.t('lang.switch') }}
          </button>
          <button type="button" class="btn-secondary mt-2 w-full text-sm !border-red-200 !text-red-600 hover:!bg-red-50" (click)="auth.logout(); closeMenu()">
            {{ locale.t('auth.logout') }}
          </button>
        </div>
      </aside>

      <app-toast-container />
      <app-confirm-dialog />
      <app-upgrade-plan-modal />
    </div>

    <ng-template #navIcon let-icon>
      <svg class="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        @switch (icon) {
          @case ('dashboard') {
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
          }
          @case ('transactions') {
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
          }
          @case ('customers') {
            <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
          }
          @case ('debts') {
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          }
          @case ('suppliers') {
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
          }
          @case ('inventory') {
            <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
          }
          @case ('reports') {
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          }
          @case ('settings') {
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          }
        }
      </svg>
    </ng-template>
  `,
})
export class MainLayoutComponent {
  private readonly router = inject(Router);
  private readonly upgradeModal = inject(UpgradePlanModalService);
  readonly auth = inject(AuthService);
  readonly locale = inject(LocaleService);
  readonly planFeatures = inject(PlanFeatureService);
  private readonly paymentMethods = inject(PaymentMethodContextService);
  private readonly categories = inject(CategoryContextService);
  private readonly products = inject(ProductContextService);
  private readonly businessContext = inject(BusinessContextService);
  private readonly destroyRef = inject(DestroyRef);

  readonly menuOpen = signal(false);
  readonly desktopSidebarCollapsed = signal(false);

  nav: { path: string; key: string; icon: NavKey }[] = [
    { path: '/app/dashboard', key: 'nav.dashboard', icon: 'dashboard' },
    { path: '/app/transactions', key: 'nav.transactions', icon: 'transactions' },
    { path: '/app/customers', key: 'nav.customers', icon: 'customers' },
    { path: '/app/debts', key: 'nav.debts', icon: 'debts' },
    { path: '/app/suppliers', key: 'nav.suppliers', icon: 'suppliers' },
    { path: '/app/inventory', key: 'nav.inventory', icon: 'inventory' },
    { path: '/app/reports', key: 'nav.reports', icon: 'reports' },
    { path: '/app/settings', key: 'nav.settings', icon: 'settings' },
  ];

  constructor() {
    if (this.auth.isAdmin()) {
      void this.router.navigateByUrl('/admin/accounts', { replaceUrl: true });
    } else if (this.auth.isLoggedIn()) {
      this.auth.refreshAccountStatus().subscribe();
      this.paymentMethods.loadForBusiness(this.auth.businessId());
      this.categories.loadForBusiness(this.auth.businessId());
      this.products.loadForBusiness(this.auth.businessId());
      this.businessContext.businessChanged$
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((id) => {
          this.paymentMethods.invalidate();
          this.paymentMethods.loadForBusiness(id);
          this.categories.invalidate();
          this.categories.loadForBusiness(id);
          this.products.invalidate();
          this.products.loadForBusiness(id);
        });
    }
    this.router.events.subscribe(() => this.closeMenu());
  }

  toggleMenu() {
    this.menuOpen.update((v) => !v);
    document.body.style.overflow = this.menuOpen() ? 'hidden' : '';
  }

  closeMenu() {
    this.menuOpen.set(false);
    document.body.style.overflow = '';
  }

  toggleDesktopSidebar() {
    this.desktopSidebarCollapsed.update((v) => !v);
  }

  toggleLang() {
    this.locale.setLocale(this.locale.locale() === 'en' ? 'am' : 'en');
  }

  openUpgrade() {
    this.upgradeModal.show();
  }
}
