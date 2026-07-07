import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DecimalPipe, SlicePipe } from '@angular/common';
import { environment } from '../../../environments/environment';
import { BusinessContextService } from '../../core/services/business-context.service';
import { LocaleService } from '../../core/services/locale.service';
import { AuthService } from '../../core/services/auth.service';
import { ApiResponse, DashboardSummary } from '../../core/models/api.models';
import { apiErrorMessage } from '../../core/utils/http-error';
import { PlanId } from '../../core/config/subscription.config';
import { PlanFeatureService } from '../../core/services/plan-feature.service';
import { PaymentMethodContextService } from '../../core/services/payment-method-context.service';
import { PaymentMethodLogoComponent } from '../../shared/payment-method-logo.component';
import { findPaymentMethod } from '../../shared/payment-methods';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, DecimalPipe, SlicePipe, PaymentMethodLogoComponent],
  template: `
    <div class="page-shell">
      <header class="page-header !mb-0">
        <div>
          <h1 class="page-title">{{ locale.t('nav.dashboard') }}</h1>
          <p class="page-subtitle">{{ locale.t('dashboard.subtitle') }}</p>
        </div>
        <span class="plan-pill">{{ locale.t(planNameKey()) }}</span>
      </header>

      <section class="grid grid-cols-2 gap-3 sm:gap-4">
        <a routerLink="/app/transactions" [queryParams]="{ type: 'income' }" class="dash-quick-income group">
          <span class="dash-quick-icon" aria-hidden="true">+</span>
          <span class="dash-quick-label">{{ locale.t('transactions.addIncome') }}</span>
        </a>
        <a routerLink="/app/transactions" [queryParams]="{ type: 'expense' }" class="dash-quick-expense group">
          <span class="dash-quick-icon" aria-hidden="true">−</span>
          <span class="dash-quick-label">{{ locale.t('transactions.addExpense') }}</span>
        </a>
      </section>

      <nav class="shortcut-row" [attr.aria-label]="locale.t('dashboard.shortcuts')">
        <a routerLink="/app/transactions" class="shortcut-chip">{{ locale.t('nav.transactions') }}</a>
        <a routerLink="/app/inventory" class="shortcut-chip">{{ locale.t('nav.inventory') }}</a>
        <a routerLink="/app/debts" class="shortcut-chip">{{ locale.t('nav.debts') }}</a>
        <a routerLink="/app/reports" class="shortcut-chip">{{ locale.t('nav.reports') }}</a>
      </nav>

      @if (summary()?.lowStockCount) {
        <a routerLink="/app/inventory" class="block rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm font-medium text-amber-950 shadow-sm transition hover:bg-amber-100/80">
          {{ locale.t('dashboard.lowStockAlert') }}: {{ summary()!.lowStockCount }}
        </a>
      }

      @if (error()) {
        <div class="alert-error flex items-center justify-between gap-4">
          <span>{{ error() }}</span>
          <button type="button" class="btn-secondary shrink-0 !py-1.5 !px-3 text-xs" (click)="load()">
            {{ locale.t('common.retry') }}
          </button>
        </div>
      }

      @if (loading()) {
        <div class="grid gap-4 sm:grid-cols-3">
          @for (i of [1, 2, 3]; track i) {
            <div class="dash-stat-highlight skeleton h-28"></div>
          }
        </div>
      } @else if (summary()) {
        <section>
          <div class="mb-4 flex items-center justify-between">
            <h2 class="dash-section-label">{{ locale.t('dashboard.todaySection') }}</h2>
          </div>
          <div class="grid gap-4 sm:grid-cols-3">
            <div class="dash-stat-highlight border-l-4 border-l-emerald-500">
              <p class="text-sm text-slate-500">{{ locale.t('dashboard.todayIncome') }}</p>
              <p class="mt-2 text-2xl font-bold tabular-nums text-emerald-600">
                {{ summary()!.todayIncome | number: '1.2-2' }}
                <span class="text-sm font-normal text-slate-400">ETB</span>
              </p>
            </div>
            <div class="dash-stat-highlight border-l-4 border-l-orange-500">
              <p class="text-sm text-slate-500">{{ locale.t('dashboard.todayExpenses') }}</p>
              <p class="mt-2 text-2xl font-bold tabular-nums text-orange-600">
                {{ summary()!.todayExpenses | number: '1.2-2' }}
                <span class="text-sm font-normal text-slate-400">ETB</span>
              </p>
            </div>
            <div class="dash-stat-highlight border-l-4 border-l-brand-500">
              <p class="text-sm text-slate-500">{{ locale.t('dashboard.profit') }}</p>
              <p
                class="mt-2 text-2xl font-bold tabular-nums"
                [class.text-emerald-600]="summary()!.todayProfit >= 0"
                [class.text-red-600]="summary()!.todayProfit < 0"
              >
                {{ summary()!.todayProfit | number: '1.2-2' }}
                <span class="text-sm font-normal text-slate-400">ETB</span>
              </p>
              <p class="mt-1 text-xs text-slate-400">{{ locale.t('dashboard.profitHint') }}</p>
            </div>
          </div>
        </section>

        @if (summary()!.analytics) {
          <section class="card p-5">
            <h2 class="section-title mb-4">{{ locale.t('dashboard.analyticsTitle') }}</h2>
            <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div class="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                <p class="text-xs text-slate-500">{{ locale.t('dashboard.txCountToday') }}</p>
                <p class="mt-1 text-xl font-bold tabular-nums text-slate-900">{{ summary()!.analytics!.todayTransactionCount }}</p>
              </div>
              <div class="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                <p class="text-xs text-slate-500">{{ locale.t('dashboard.txCountWeek') }}</p>
                <p class="mt-1 text-xl font-bold tabular-nums text-slate-900">{{ summary()!.analytics!.weekTransactionCount }}</p>
              </div>
              <div class="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                <p class="text-xs text-slate-500">{{ locale.t('dashboard.txCountMonth') }}</p>
                <p class="mt-1 text-xl font-bold tabular-nums text-slate-900">{{ summary()!.analytics!.monthTransactionCount }}</p>
              </div>
              <div class="rounded-xl border border-brand-100 bg-brand-50/40 p-3">
                <p class="text-xs text-slate-500">{{ locale.t('dashboard.collectionsToday') }}</p>
                <p class="mt-1 text-xl font-bold tabular-nums text-brand-800">
                  {{ summary()!.todayCollections | number: '1.2-2' }} ETB
                </p>
              </div>
            </div>
            <div class="mt-4 grid gap-3 sm:grid-cols-2">
              <div class="rounded-xl border border-slate-100 p-3">
                <p class="text-xs text-slate-500">{{ locale.t('dashboard.profitMargin') }}</p>
                <p
                  class="mt-1 text-lg font-bold tabular-nums"
                  [class.text-emerald-600]="summary()!.analytics!.monthProfitMargin >= 0"
                  [class.text-red-600]="summary()!.analytics!.monthProfitMargin < 0"
                >
                  {{ summary()!.analytics!.monthProfitMargin | number: '1.1-1' }}%
                </p>
              </div>
              <div class="rounded-xl border border-slate-100 p-3">
                <p class="text-xs text-slate-500">{{ locale.t('dashboard.topPayment') }}</p>
                <p class="mt-1 font-semibold text-slate-800">{{ summary()!.analytics!.topPaymentMethod }}</p>
                <p class="text-xs tabular-nums text-slate-500">
                  {{ summary()!.analytics!.topPaymentMethodTotal | number: '1.2-2' }} ETB
                </p>
              </div>
            </div>
          </section>
        }

        <section>
          <h2 class="dash-section-label mb-4">{{ locale.t('dashboard.monthSection') }}</h2>
          <div class="grid gap-4 sm:grid-cols-3">
            @for (m of monthMetrics(); track m.label) {
              <div class="dash-stat-highlight">
                <p class="text-sm text-slate-500">{{ m.label }}</p>
                <p class="mt-2 text-lg font-semibold tabular-nums text-slate-900">{{ m.value | number: '1.2-2' }} ETB</p>
                @if (summary()!.periodComparison && m.changeKey) {
                  <p
                    class="mt-1 text-xs font-medium"
                    [class.text-emerald-600]="changePercent(m.changeKey) >= 0"
                    [class.text-red-600]="changePercent(m.changeKey) < 0"
                  >
                    {{ formatChange(changePercent(m.changeKey)) }} {{ locale.t('dashboard.vsLastMonth') }}
                  </p>
                }
              </div>
            }
          </div>
        </section>

        @if (summary()!.netAfterDebts != null) {
          <div class="dash-stat-highlight border-brand-200/80 bg-brand-50/30">
            <p class="text-sm text-slate-500">{{ locale.t('dashboard.netAfterDebts') }}</p>
            <p
              class="mt-2 text-2xl font-bold tabular-nums"
              [class.text-emerald-600]="summary()!.netAfterDebts! >= 0"
              [class.text-red-600]="summary()!.netAfterDebts! < 0"
            >
              {{ summary()!.netAfterDebts | number: '1.2-2' }} ETB
            </p>
            <p class="mt-1 text-xs text-slate-500">{{ locale.t('dashboard.netAfterDebtsHint') }}</p>
          </div>
        }

        @if (summary()!.topExpenseCategories?.length || summary()!.topIncomeCategories?.length) {
          <div class="grid gap-4 lg:grid-cols-2">
            <div class="card p-5">
              <h2 class="mb-4 text-sm font-semibold text-slate-800">{{ locale.t('dashboard.categoryBreakdown') }}</h2>
              @if (summary()!.topExpenseCategories?.length) {
                <ul class="space-y-2">
                  @for (c of summary()!.topExpenseCategories!; track c.categoryName) {
                    <li class="flex items-center justify-between gap-2 text-sm">
                      <span class="truncate text-slate-700">{{ c.categoryName }}</span>
                      <span class="shrink-0 font-semibold tabular-nums text-orange-600">{{ c.amount | number: '1.2-2' }}</span>
                    </li>
                  }
                </ul>
              } @else {
                <p class="text-sm text-slate-500">{{ locale.t('dashboard.noCategoryData') }}</p>
              }
            </div>
            <div class="card p-5">
              <h2 class="mb-4 text-sm font-semibold text-slate-800">{{ locale.t('dashboard.incomeByCategory') }}</h2>
              @if (summary()!.topIncomeCategories?.length) {
                <ul class="space-y-2">
                  @for (c of summary()!.topIncomeCategories!; track c.categoryName) {
                    <li class="flex items-center justify-between gap-2 text-sm">
                      <span class="truncate text-slate-700">{{ c.categoryName }}</span>
                      <span class="shrink-0 font-semibold tabular-nums text-emerald-600">{{ c.amount | number: '1.2-2' }}</span>
                    </li>
                  }
                </ul>
              } @else {
                <p class="text-sm text-slate-500">{{ locale.t('dashboard.noCategoryData') }}</p>
              }
            </div>
          </div>
        }

        <div class="dash-stat-highlight flex flex-wrap items-center justify-between gap-4 border-amber-200/80 bg-amber-50/30">
          <div>
            <p class="text-sm text-slate-500">{{ locale.t('dashboard.unpaidDebts') }}</p>
            <p class="mt-1 text-xl font-bold tabular-nums text-amber-800">
              {{ summary()!.unpaidDebts | number: '1.2-2' }} ETB
            </p>
          </div>
          <a routerLink="/app/debts" class="btn-secondary text-sm">{{ locale.t('nav.debts') }}</a>
        </div>

        @if (planFeatures.canAdvancedDashboard() && summary()!.paymentMethodBreakdown?.length) {
          <div class="card p-6">
            <h2 class="mb-1 text-sm font-semibold text-slate-800">{{ locale.t('dashboard.proInsights') }}</h2>
            <p class="mb-5 text-xs text-slate-500">{{ locale.t('dashboard.paymentBreakdown') }}</p>
            <div class="grid gap-3 sm:grid-cols-2">
              @for (row of summary()!.paymentMethodBreakdown!; track row.method) {
                <div class="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                  <div class="flex items-center gap-2.5">
                    <app-payment-method-logo
                      [methodId]="paymentMethodId(row.method)"
                      [logoUrl]="paymentLogoUrl(row.method)"
                      [alt]="row.method"
                    />
                    <p class="font-semibold text-slate-800">{{ row.method }}</p>
                  </div>
                  <div class="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p class="text-slate-500">{{ locale.t('dashboard.incomeLabel') }}</p>
                      <p class="font-semibold tabular-nums text-emerald-600">{{ row.income | number: '1.2-2' }}</p>
                    </div>
                    <div>
                      <p class="text-slate-500">{{ locale.t('dashboard.expenseLabel') }}</p>
                      <p class="font-semibold tabular-nums text-orange-600">{{ row.expenses | number: '1.2-2' }}</p>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        } @else if (!planFeatures.canAdvancedDashboard() && auth.subscriptionActive()) {
          <div class="rounded-xl border border-violet-200 bg-violet-50/80 px-4 py-3 text-sm text-violet-950">
            {{ locale.t('feature.locked.advancedDashboard') }}
          </div>
        }

        @if (summary()!.weeklyChart.length) {
          <div class="card p-6">
            <h2 class="mb-6 text-sm font-semibold text-slate-800">{{ locale.t('dashboard.chartTitle') }}</h2>
            <div class="flex h-36 items-end justify-between gap-2">
              @for (point of summary()!.weeklyChart; track point.date) {
                <div class="flex flex-1 flex-col items-center gap-2">
                  <div class="flex h-28 w-full max-w-[2.75rem] flex-col justify-end gap-1">
                    <div
                      class="w-full rounded-t-md bg-emerald-400 transition-all duration-500"
                      [style.height.%]="barHeight(point.income)"
                    ></div>
                    <div
                      class="w-full rounded-t-md bg-orange-400/90 transition-all duration-500"
                      [style.height.%]="barHeight(point.expenses)"
                    ></div>
                  </div>
                  <span class="text-[10px] font-medium text-slate-400">{{ point.date | slice: 5:10 }}</span>
                </div>
              }
            </div>
            <div class="mt-4 flex gap-6 text-xs text-slate-500">
              <span class="flex items-center gap-2"><span class="h-2.5 w-2.5 rounded-sm bg-emerald-400"></span> {{ locale.t('dashboard.incomeLabel') }}</span>
              <span class="flex items-center gap-2"><span class="h-2.5 w-2.5 rounded-sm bg-orange-400"></span> {{ locale.t('dashboard.expenseLabel') }}</span>
            </div>
          </div>
        }
      }
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly business = inject(BusinessContextService);
  private readonly destroyRef = inject(DestroyRef);
  readonly locale = inject(LocaleService);
  readonly auth = inject(AuthService);
  readonly planFeatures = inject(PlanFeatureService);
  private readonly paymentMethods = inject(PaymentMethodContextService);

  readonly summary = signal<DashboardSummary | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');

  private maxChart = 1;

  ngOnInit() {
    this.load();
    this.business.businessChanged$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.summary.set(null);
        this.load();
      });
  }

  planNameKey(): string {
    const p: PlanId = this.auth.subscriptionPlan();
    return `plan.${p}.name`;
  }

  monthMetrics() {
    const s = this.summary();
    if (!s) return [];
    return [
      { label: this.locale.t('dashboard.monthIncome'), value: s.monthIncome, changeKey: 'income' as const },
      { label: this.locale.t('dashboard.monthExpenses'), value: s.monthExpenses, changeKey: 'expense' as const },
      { label: this.locale.t('dashboard.monthProfit'), value: s.monthProfit, changeKey: 'profit' as const },
    ];
  }

  changePercent(key: 'income' | 'expense' | 'profit'): number {
    const p = this.summary()?.periodComparison;
    if (!p) return 0;
    if (key === 'income') return p.incomeChangePercent;
    if (key === 'expense') return p.expenseChangePercent;
    return p.profitChangePercent;
  }

  formatChange(pct: number): string {
    const sign = pct > 0 ? '+' : '';
    return `${sign}${Number(pct).toFixed(1)}%`;
  }

  load() {
    this.loading.set(true);
    this.error.set('');
    this.business.ensureBusinessId().subscribe({
      next: (bid) => this.fetch(bid),
      error: (e) => {
        this.error.set(apiErrorMessage(e, 'Could not load business'));
        this.loading.set(false);
      },
    });
  }

  private fetch(bid: string) {
    this.http.get<ApiResponse<DashboardSummary>>(`${environment.apiUrl}/businesses/${bid}/dashboard`).subscribe({
      next: (res) => {
        const data = res.data;
        this.maxChart = Math.max(1, ...(data.weeklyChart || []).flatMap((p) => [p.income, p.expenses]));
        this.summary.set(data);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(apiErrorMessage(e, 'Failed to load dashboard'));
        this.loading.set(false);
      },
    });
  }

  barHeight(value: number): number {
    return Math.min(100, Math.round((value / this.maxChart) * 100));
  }

  paymentMethodId(method: string): string {
    return findPaymentMethod(method)?.id ?? method;
  }

  paymentLogoUrl(method: string): string | null | undefined {
    const key = method.trim().toLowerCase();
    const match = this.paymentMethods.methods().find(
      (m) => m.id.toLowerCase() === key || m.label.toLowerCase() === key
    );
    return match?.logoUrl;
  }
}
