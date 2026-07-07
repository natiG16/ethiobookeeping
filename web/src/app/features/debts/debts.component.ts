import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { HttpClient } from '@angular/common/http';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { DecimalPipe } from '@angular/common';

import { environment } from '../../../environments/environment';

import { BusinessContextService } from '../../core/services/business-context.service';

import { LocaleService } from '../../core/services/locale.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmDialogService } from '../../core/services/confirm-dialog.service';
import { PlanFeatureService } from '../../core/services/plan-feature.service';
import { UpgradePlanModalService } from '../../core/services/upgrade-plan-modal.service';

import { ApiResponse, Debt, Page } from '../../core/models/api.models';

import { apiErrorMessage } from '../../core/utils/http-error';

import { PaginationComponent } from '../../shared/pagination.component';
import { AppDatePickerComponent } from '../../shared/app-date-picker.component';
import { LocaleDatePipe } from '../../shared/locale-date.pipe';
import { todayGregorianIso } from '../../core/utils/ethiopian-calendar';



const PAGE_SIZE = 20;



@Component({

  selector: 'app-debts',

  standalone: true,

  imports: [ReactiveFormsModule, DecimalPipe, AppDatePickerComponent, LocaleDatePipe, PaginationComponent],

  template: `

    <div class="space-y-6">

      <header class="page-header">

        <div>

          <h1 class="page-title">{{ locale.t('nav.debts') }}</h1>

          <p class="page-subtitle">{{ totalElements() }} customers</p>

        </div>

        <button type="button" class="btn-primary" [disabled]="!planFeatures.canWrite()" (click)="openAdd()">+ {{ locale.t('debts.add') }}</button>

      </header>



      @if (error()) {

        <div class="alert-error">{{ error() }}</div>

      }



      @if (showForm()) {

        <div class="card border-2 border-amber-200 p-5">

          <form [formGroup]="form" (ngSubmit)="save()" class="grid gap-3 sm:grid-cols-2">

            <input class="input-field" placeholder="Customer name *" formControlName="customerName" />

            <input class="input-field" placeholder="Phone" formControlName="customerPhone" />

            <input class="input-field" type="number" min="0.01" step="0.01" placeholder="Amount (ETB) *" formControlName="totalAmount" />

            <app-date-picker formControlName="dueDate" [optional]="true" [label]="locale.t('debts.dueDate')" />

            <div class="flex gap-2 sm:col-span-2">

              <button type="submit" class="btn-primary" [disabled]="saving()">{{ saving() ? '…' : locale.t('common.save') }}</button>

              <button type="button" class="btn-secondary" (click)="showForm.set(false)">{{ locale.t('common.cancel') }}</button>

            </div>

          </form>

        </div>

      }



      @if (loading()) {

        <div class="grid gap-4 sm:grid-cols-2">

          @for (i of [1,2]; track i) {

            <div class="card skeleton h-40"></div>

          }

        </div>

      } @else if (items().length) {

        <div class="grid gap-4 sm:grid-cols-2">

          @for (d of items(); track d.id) {

            <div class="card p-5">

              <div class="flex items-start justify-between gap-2">

                <div>

                  <p class="font-semibold text-lg">{{ d.customerName }}</p>

                  @if (d.customerPhone) {

                    <p class="text-sm text-slate-500">{{ d.customerPhone }}</p>

                  }

                </div>

                <span [class]="d.status === 'PAID' ? 'badge-paid' : 'badge-active'">{{ d.status }}</span>

              </div>

              <p class="mt-4 text-2xl font-bold text-amber-600 tabular-nums">

                {{ d.remainingAmount | number:'1.2-2' }} <span class="text-sm font-normal text-slate-400">ETB {{ locale.t('debts.remaining') }}</span>

              </p>

              @if (d.dueDate) {
                <p class="mt-1 flex flex-wrap items-center gap-2 text-xs">
                  <span class="text-slate-500">{{ locale.t('debts.dueDate') }} {{ d.dueDate | localeDate }}</span>
                  @if (dueLabel(d); as label) {
                    <span [class]="dueBadgeClass(d)">{{ label }}</span>
                  }
                </p>
              }

              <div class="mt-3 h-2 overflow-hidden rounded-full bg-brand-100">

                <div class="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all" [style.width.%]="progress(d)"></div>

              </div>

              <p class="mt-1 text-xs text-slate-400">{{ d.paidAmount | number:'1.0-0' }} / {{ d.totalAmount | number:'1.0-0' }} ETB paid</p>

              <div class="mt-4 flex flex-col gap-2 sm:flex-row">
                @if (d.status !== 'PAID') {
                  <button type="button" class="btn-secondary flex-1 text-sm" [disabled]="!planFeatures.canWrite() || marking() === d.id" (click)="markPaid(d.id)">
                    {{ marking() === d.id ? '…' : locale.t('debts.markPaid') }}
                  </button>
                }
                <button
                  type="button"
                  class="btn-ghost flex-1 text-sm text-red-600 hover:bg-red-50"
                  [disabled]="!planFeatures.canWrite() || deleting() === d.id"
                  (click)="confirmDelete(d)"
                >
                  {{ deleting() === d.id ? '…' : locale.t('common.delete') }}
                </button>
              </div>

            </div>

          }

        </div>

        <app-pagination

          [page]="page()"

          [totalPages]="totalPages()"

          [totalElements]="totalElements()"

          [pageSize]="pageSize"

          (pageChange)="onPageChange($event)"

        />

      } @else {

        <div class="empty-state">

          <p class="text-4xl mb-3">🤝</p>

          <p class="text-slate-500">{{ locale.t('debts.empty') }}</p>

          <button type="button" class="btn-primary mt-4" [disabled]="!planFeatures.canWrite()" (click)="openAdd()">{{ locale.t('debts.add') }}</button>

        </div>

      }

    </div>

  `,

})

export class DebtsComponent implements OnInit {

  private readonly http = inject(HttpClient);

  private readonly business = inject(BusinessContextService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly fb = inject(FormBuilder);

  readonly locale = inject(LocaleService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmDialogService);
  readonly planFeatures = inject(PlanFeatureService);
  private readonly upgradeModal = inject(UpgradePlanModalService);



  readonly pageSize = PAGE_SIZE;

  readonly items = signal<Debt[]>([]);

  readonly page = signal(0);

  readonly totalPages = signal(0);

  readonly totalElements = signal(0);

  readonly showForm = signal(false);

  readonly loading = signal(true);

  readonly saving = signal(false);

  readonly marking = signal<string | null>(null);

  readonly deleting = signal<string | null>(null);

  readonly error = signal('');



  private businessId = '';



  form = this.fb.group({

    customerName: ['', Validators.required],

    customerPhone: [''],

    totalAmount: ['', Validators.required],

    dueDate: [''],

  });



  ngOnInit() {
    this.load();
    this.business.businessChanged$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.showForm.set(false);
        this.page.set(0);
        this.load();
      });
  }

  openAdd() {
    if (!this.planFeatures.canWrite()) {
      this.error.set(this.locale.t('feature.locked.write'));
      return;
    }
    this.showForm.set(true);
  }



  progress(d: Debt): number {

    if (!d.totalAmount || d.totalAmount <= 0) return 0;

    return Math.min(100, (d.paidAmount / d.totalAmount) * 100);

  }

  dueLabel(d: Debt): string | null {
    const kind = this.dueKind(d);
    if (kind === 'overdue') return this.locale.t('debts.overdue');
    if (kind === 'today') return this.locale.t('debts.dueToday');
    if (kind === 'tomorrow') return this.locale.t('debts.dueTomorrow');
    return null;
  }

  dueBadgeClass(d: Debt): string {
    const kind = this.dueKind(d);
    if (kind === 'overdue') return 'rounded-full bg-red-100 px-2 py-0.5 font-semibold text-red-800';
    if (kind === 'today') return 'rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-900';
    return 'rounded-full bg-sky-100 px-2 py-0.5 font-semibold text-sky-800';
  }

  private dueKind(d: Debt): 'overdue' | 'today' | 'tomorrow' | null {
    if (!d.dueDate || d.status === 'PAID' || d.status === 'CANCELLED') return null;
    const today = todayGregorianIso();
    const tomorrow = this.addDaysIso(today, 1);
    if (d.dueDate < today || d.status === 'OVERDUE') return 'overdue';
    if (d.dueDate === today) return 'today';
    if (d.dueDate === tomorrow) return 'tomorrow';
    return null;
  }

  private addDaysIso(iso: string, days: number): string {
    const d = new Date(iso + 'T12:00:00');
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }



  onPageChange(nextPage: number) {

    this.page.set(nextPage);

    this.load();

  }



  load() {

    this.loading.set(true);

    this.error.set('');

    this.business.ensureBusinessId().subscribe({

      next: (bid) => {

        this.businessId = bid;

        this.http

          .get<ApiResponse<Page<Debt>>>(`${environment.apiUrl}/businesses/${bid}/debts`, {

            params: { page: String(this.page()), size: String(PAGE_SIZE) },

          })

          .subscribe({

            next: (res) => {

              const data = res.data;

              this.items.set(data.content || []);

              this.totalElements.set(data.totalElements ?? 0);

              this.totalPages.set(Math.max(1, data.totalPages ?? 1));

              if (data.number != null && data.number !== this.page()) {

                this.page.set(data.number);

              }

              this.loading.set(false);

            },

            error: (e) => {

              this.error.set(apiErrorMessage(e, 'Failed to load debts'));

              this.loading.set(false);

            },

          });

      },

      error: (e) => {

        this.error.set(apiErrorMessage(e, 'Could not load business'));

        this.loading.set(false);

      },

    });

  }



  save() {
    if (!this.planFeatures.canWrite()) {
      this.error.set(this.locale.t('feature.locked.write'));
      return;
    }
    if (!this.businessId || this.form.invalid) return;

    this.saving.set(true);

    const v = this.form.getRawValue();

    this.http

      .post(`${environment.apiUrl}/businesses/${this.businessId}/debts`, {

        customerName: v.customerName,

        customerPhone: v.customerPhone,

        totalAmount: +v.totalAmount!,

        dueDate: v.dueDate || null,

      })

      .subscribe({

        next: () => {

          this.saving.set(false);

          this.showForm.set(false);

          this.form.reset();

          this.page.set(0);

          this.load();

          this.toast.success(this.locale.t('toast.debtSaved'));

        },

        error: (e) => {

          this.error.set(apiErrorMessage(e, 'Failed to save debt'));

          this.saving.set(false);

        },

      });

  }



  markPaid(id: string) {
    if (!this.planFeatures.canWrite()) {
      this.error.set(this.locale.t('feature.locked.write'));
      return;
    }
    if (!this.businessId) return;

    this.marking.set(id);

    this.http.post(`${environment.apiUrl}/businesses/${this.businessId}/debts/${id}/mark-paid`, {}).subscribe({

      next: () => {

        this.marking.set(null);

        this.load();

        this.toast.success(this.locale.t('toast.markedPaid'));

      },

      error: (e) => {

        this.error.set(apiErrorMessage(e, 'Failed to update'));

        this.marking.set(null);

      },

    });

  }

  async confirmDelete(d: Debt) {
    if (!this.planFeatures.canWrite()) {
      this.error.set(this.locale.t('feature.locked.write'));
      return;
    }
    const ok = await this.confirm.confirm({
      title: this.locale.t('confirm.deleteDebtTitle'),
      message: this.locale.t('confirm.deleteDebtMessage'),
      confirmLabel: this.locale.t('common.delete'),
      cancelLabel: this.locale.t('common.cancel'),
      danger: true,
    });
    if (!ok || !this.businessId) {
      return;
    }
    this.deleting.set(d.id);
    this.http.delete(`${environment.apiUrl}/businesses/${this.businessId}/debts/${d.id}`).subscribe({
      next: () => {
        this.deleting.set(null);
        this.load();
        this.toast.success(this.locale.t('toast.debtDeleted'));
      },
      error: (e) => {
        this.error.set(apiErrorMessage(e, 'Failed to delete debt'));
        this.deleting.set(null);
      },
    });
  }

}


