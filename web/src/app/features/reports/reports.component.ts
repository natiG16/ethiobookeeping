import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { BusinessContextService } from '../../core/services/business-context.service';
import { AuthService } from '../../core/services/auth.service';
import { LocaleService } from '../../core/services/locale.service';
import { PlanFeatureService } from '../../core/services/plan-feature.service';
import { UpgradePlanModalService } from '../../core/services/upgrade-plan-modal.service';
import { ToastService } from '../../core/services/toast.service';
import { ApiResponse, ReportAnalytics } from '../../core/models/api.models';
import { apiErrorMessage, apiErrorMessageAsync } from '../../core/utils/http-error';
import { todayGregorianIso } from '../../core/utils/ethiopian-calendar';
import { AppDatePickerComponent } from '../../shared/app-date-picker.component';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [DecimalPipe, FormsModule, AppDatePickerComponent],
  template: `
    <div class="reports-page space-y-6">
      <header class="page-header">
        <div>
          <h1 class="page-title">{{ locale.t('nav.reports') }}</h1>
          <p class="page-subtitle">{{ locale.t('reports.subtitle') }}</p>
          @if (auth.businessName(); as businessName) {
            <p class="mt-1 text-sm font-semibold text-brand-800">
              {{ locale.t('reports.forBusiness', { name: businessName }) }}
            </p>
          }
        </div>
      </header>

      @if (!planFeatures.canPdfReports()) {
        <div class="reports-upgrade-banner">
          <div class="reports-upgrade-icon" aria-hidden="true">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div class="min-w-0 flex-1">
            <p class="font-semibold text-violet-950">{{ locale.t('feature.locked.pdfReports') }}</p>
            <button type="button" class="link-brand mt-1 text-sm font-semibold" (click)="openUpgrade()">
              {{ locale.t('feature.upgrade') }}
            </button>
          </div>
        </div>
      }

      @if (error()) {
        <div class="alert-error">{{ error() }}</div>
      }

      <section class="reports-panel card overflow-hidden p-0" [class.reports-panel-locked]="!planFeatures.canPdfReports()">
        <div class="reports-panel-head">
          <div>
            <h2 class="reports-panel-title">{{ locale.t('reports.statementsTitle') }}</h2>
            <p class="reports-panel-desc">{{ locale.t('reports.analyticsHint') }}</p>
          </div>
          <div class="reports-period-tabs" role="tablist">
            @for (p of periods; track p.key) {
              <button
                type="button"
                role="tab"
                class="reports-period-tab"
                [class.reports-period-tab-active]="selectedPeriod() === p.key"
                [attr.aria-selected]="selectedPeriod() === p.key"
                [disabled]="!planFeatures.canPdfReports()"
                (click)="selectPeriod(p.key)"
              >
                {{ locale.t('reports.' + p.key) }}
              </button>
            }
          </div>
        </div>

        @if (planFeatures.canPdfReports()) {
          @if (previewLoading()) {
            <div class="reports-preview-skeleton grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
              @for (i of [1, 2, 3, 4]; track i) {
                <div class="skeleton h-20 rounded-xl"></div>
              }
            </div>
          } @else if (preview()) {
            <div class="reports-metrics grid gap-3 border-b border-slate-100 p-5 sm:grid-cols-2 lg:grid-cols-4">
              <div class="reports-metric">
                <p class="reports-metric-label">{{ locale.t('reports.txCount') }}</p>
                <p class="reports-metric-value">{{ preview()!.transactionCount }}</p>
              </div>
              <div class="reports-metric reports-metric-income">
                <p class="reports-metric-label">{{ locale.t('transactions.income') }}</p>
                <p class="reports-metric-value text-emerald-700">+{{ preview()!.incomeTotal | number: '1.2-2' }}</p>
                <p class="reports-metric-sub">ETB</p>
              </div>
              <div class="reports-metric reports-metric-expense">
                <p class="reports-metric-label">{{ locale.t('transactions.expense') }}</p>
                <p class="reports-metric-value text-orange-700">−{{ preview()!.expenseTotal | number: '1.2-2' }}</p>
                <p class="reports-metric-sub">ETB</p>
              </div>
              <div class="reports-metric reports-metric-profit">
                <p class="reports-metric-label">{{ locale.t('reports.profitMargin') }}</p>
                <p class="reports-metric-value text-brand-800">{{ preview()!.profitMarginPercent | number: '1.1-1' }}%</p>
                <p class="reports-metric-sub">
                  {{ locale.t('reports.topPayment') }}: {{ preview()!.topPaymentMethod }}
                </p>
              </div>
            </div>
          }

          <div class="border-b border-slate-100 p-5">
            <h3 class="text-sm font-semibold text-slate-800">{{ locale.t('reports.customRange') }}</h3>
            <p class="mt-1 text-xs text-slate-500">{{ locale.t('reports.customRangeHint') }}</p>
            <div class="mt-4 grid gap-4 sm:grid-cols-2">
              <app-date-picker [(ngModel)]="customFrom" [label]="locale.t('transactions.dateFrom')" name="reportFrom" />
              <app-date-picker [(ngModel)]="customTo" [label]="locale.t('transactions.dateTo')" name="reportTo" />
            </div>
            <div class="mt-4 flex flex-wrap gap-2">
              <button type="button" class="btn-secondary" (click)="loadCustomPreview()">
                {{ locale.t('reports.previewRange') }}
              </button>
              <button
                type="button"
                class="btn-primary"
                [disabled]="downloading() === 'custom'"
                (click)="downloadCustom()"
              >
                {{ downloading() === 'custom' ? locale.t('reports.downloading') : locale.t('reports.generateStatement') }}
              </button>
            </div>
          </div>

          <div class="reports-download-grid p-5">
            @for (p of periods; track p.key) {
              <article
                class="reports-download-card"
                [class.reports-download-card-active]="selectedPeriod() === p.key"
              >
                <div class="reports-download-icon" aria-hidden="true">{{ p.icon }}</div>
                <h3 class="reports-download-title">{{ locale.t('reports.' + p.key) }}</h3>
                <p class="reports-download-hint">{{ locale.t('reports.cardHint') }}</p>
                <button
                  type="button"
                  class="btn-primary reports-download-btn"
                  [disabled]="downloading() === p.key"
                  (click)="download(p.key)"
                >
                  @if (downloading() === p.key) {
                    <span class="reports-download-spinner" aria-hidden="true"></span>
                    {{ locale.t('reports.downloading') }}
                  } @else {
                    {{ locale.t('reports.download') }}
                  }
                </button>
              </article>
            }
          </div>
        } @else {
          <div class="p-8 text-center text-sm text-slate-500">
            {{ locale.t('reports.previewLocked') }}
          </div>
        }
      </section>
    </div>
  `,
})
export class ReportsComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly business = inject(BusinessContextService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(ToastService);

  readonly locale = inject(LocaleService);
  readonly auth = inject(AuthService);
  readonly planFeatures = inject(PlanFeatureService);
  private readonly upgradeModal = inject(UpgradePlanModalService);

  readonly downloading = signal<string | null>(null);
  readonly error = signal('');
  readonly preview = signal<ReportAnalytics | null>(null);
  readonly previewLoading = signal(false);
  readonly selectedPeriod = signal('daily');
  customFrom = '';
  customTo = todayGregorianIso();

  readonly periods = [
    { key: 'daily', icon: '📅' },
    { key: 'weekly', icon: '📆' },
    { key: 'monthly', icon: '🗓️' },
  ];

  ngOnInit() {
    const today = todayGregorianIso();
    this.customTo = today;
    const monthStart = today.slice(0, 8) + '01';
    this.customFrom = monthStart;
    if (this.planFeatures.canPdfReports()) {
      this.loadPreview('daily');
    }
    this.business.businessChanged$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.preview.set(null);
        if (this.planFeatures.canPdfReports()) {
          this.loadPreview(this.selectedPeriod());
        }
      });
  }

  openUpgrade() {
    this.upgradeModal.show();
  }

  selectPeriod(period: string) {
    this.selectedPeriod.set(period);
    if (this.planFeatures.canPdfReports()) {
      this.loadPreview(period);
    }
  }

  loadCustomPreview() {
    if (!this.customFrom || !this.customTo) {
      this.error.set(this.locale.t('reports.dateRangeRequired'));
      return;
    }
    this.selectedPeriod.set('custom');
    this.previewLoading.set(true);
    this.business.ensureBusinessId().subscribe({
      next: (bid) => {
        this.http
          .get<ApiResponse<ReportAnalytics>>(`${environment.apiUrl}/businesses/${bid}/reports/analytics`, {
            params: { from: this.customFrom, to: this.customTo },
          })
          .subscribe({
            next: (res) => {
              this.preview.set(res.data ?? null);
              this.previewLoading.set(false);
            },
            error: () => {
              this.preview.set(null);
              this.previewLoading.set(false);
            },
          });
      },
      error: () => this.previewLoading.set(false),
    });
  }

  downloadCustom() {
    if (!this.customFrom || !this.customTo) {
      this.error.set(this.locale.t('reports.dateRangeRequired'));
      return;
    }
    this.downloadWithParams(new HttpParams().set('from', this.customFrom).set('to', this.customTo), 'custom');
  }

  loadPreview(period: string) {
    this.previewLoading.set(true);
    this.business.ensureBusinessId().subscribe({
      next: (bid) => {
        this.http
          .get<ApiResponse<ReportAnalytics>>(
            `${environment.apiUrl}/businesses/${bid}/reports/analytics`,
            { params: { period } }
          )
          .subscribe({
            next: (res) => {
              this.preview.set(res.data ?? null);
              this.previewLoading.set(false);
            },
            error: () => {
              this.preview.set(null);
              this.previewLoading.set(false);
            },
          });
      },
      error: () => this.previewLoading.set(false),
    });
  }

  download(period: string) {
    if (!this.planFeatures.canPdfReports()) {
      this.openUpgrade();
      return;
    }
    this.selectPeriod(period);
    this.downloadWithParams(new HttpParams().set('period', period).set('t', String(Date.now())), period);
  }

  private downloadWithParams(params: HttpParams, label: string) {
    if (!this.planFeatures.canPdfReports()) {
      this.openUpgrade();
      return;
    }
    this.error.set('');
    this.downloading.set(label);
    this.business.ensureBusinessId().subscribe({
      next: (bid) => {
        this.http
          .get(`${environment.apiUrl}/businesses/${bid}/reports/pdf`, {
            params,
            responseType: 'blob',
            observe: 'response',
          })
          .subscribe({
            next: (res) => void this.handlePdfResponse(res, label),
            error: (e) => void this.failDownload(e, 'Download failed'),
          });
      },
      error: (e) => {
        this.error.set(apiErrorMessage(e, 'Could not load business'));
        this.downloading.set(null);
      },
    });
  }

  private async handlePdfResponse(res: HttpResponse<Blob>, period: string): Promise<void> {
    const body = res.body;
    if (!body) {
      this.error.set(this.locale.t('reports.downloadFailed'));
      this.downloading.set(null);
      return;
    }

    const isPdf =
      (res.headers.get('content-type') || '').toLowerCase().includes('pdf') ||
      (await this.readPdfHeader(body));

    if (!isPdf) {
      let msg = this.locale.t('reports.downloadFailed');
      try {
        const parsed = JSON.parse(await body.text()) as { message?: string };
        if (parsed.message) {
          msg = parsed.message;
        }
      } catch {
        /* not JSON */
      }
      this.error.set(msg);
      this.downloading.set(null);
      return;
    }

    const pdfBlob =
      body.type === 'application/pdf' ? body : new Blob([body], { type: 'application/pdf' });
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mysuq-statement-${period}-${new Date().toISOString().slice(0, 10)}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    this.downloading.set(null);
    this.toast.success(this.locale.t('reports.downloadSuccess'));
  }

  private async readPdfHeader(blob: Blob): Promise<boolean> {
    const header = await blob.slice(0, 5).text();
    return header.startsWith('%PDF');
  }

  private async failDownload(err: unknown, fallback: string): Promise<void> {
    this.error.set(await apiErrorMessageAsync(err, fallback));
    this.downloading.set(null);
  }
}
