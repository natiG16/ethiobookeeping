import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { environment } from '../../../environments/environment';
import { BusinessContextService } from '../../core/services/business-context.service';
import { LocaleService } from '../../core/services/locale.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmDialogService } from '../../core/services/confirm-dialog.service';
import { PlanFeatureService } from '../../core/services/plan-feature.service';
import { ApiResponse, Transaction } from '../../core/models/api.models';
import { apiErrorMessage } from '../../core/utils/http-error';
import { PaymentMethodSelectComponent } from '../../shared/payment-method-select.component';
import { CategorySelectComponent } from '../../shared/category-select.component';
import { PaymentMethodBadgeComponent } from '../../shared/payment-method-badge.component';
import { AppDatePickerComponent } from '../../shared/app-date-picker.component';
import { LocaleDatePipe } from '../../shared/locale-date.pipe';

function minAmountValidator(control: AbstractControl): ValidationErrors | null {
  const n = Number(control.value);
  if (control.value === '' || control.value == null) return null;
  if (!Number.isFinite(n) || n < 0.01) return { minAmount: true };
  return null;
}

@Component({
  selector: 'app-transaction-detail',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    DecimalPipe,
    PaymentMethodSelectComponent,
    CategorySelectComponent,
    PaymentMethodBadgeComponent,
    AppDatePickerComponent,
    LocaleDatePipe,
  ],
  template: `
    <div class="space-y-6 animate-fade-in">
      <div class="flex flex-wrap items-center gap-3">
        <a routerLink="/app/transactions" class="btn-secondary !py-2 !px-3 text-sm">
          ← {{ locale.t('transactions.backToList') }}
        </a>
      </div>

      @if (error()) {
        <div class="alert-error">{{ error() }}</div>
      }

      @if (loading()) {
        <div class="card skeleton h-64"></div>
      }

      @if (tx() && !loading()) {
        @if (!editing()) {
          <div class="card overflow-hidden p-0">
            <div
              class="flex items-center gap-4 border-b border-slate-100 px-6 py-5"
              [class.bg-emerald-50]="tx()!.type === 'INCOME'"
              [class.bg-orange-50]="tx()!.type === 'EXPENSE'"
            >
              <div
                class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl"
                [class.bg-emerald-100]="tx()!.type === 'INCOME'"
                [class.bg-orange-100]="tx()!.type === 'EXPENSE'"
              >
                {{ tx()!.type === 'INCOME' ? '↑' : '↓' }}
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {{ locale.t('transactions.detailTitle') }}
                </p>
                <h1 class="font-display text-2xl font-bold text-slate-900 truncate">
                  {{ tx()!.description || (tx()!.type === 'INCOME' ? locale.t('transactions.income') : locale.t('transactions.expense')) }}
                </h1>
                <span [class]="tx()!.type === 'INCOME' ? 'badge-income' : 'badge-expense'" class="mt-2 inline-block">
                  {{ tx()!.type }}
                </span>
              </div>
              <p
                class="shrink-0 text-2xl font-bold tabular-nums"
                [class.text-emerald-600]="tx()!.type === 'INCOME'"
                [class.text-orange-600]="tx()!.type === 'EXPENSE'"
              >
                {{ tx()!.type === 'INCOME' ? '+' : '−' }}{{ tx()!.amount | number: '1.2-2' }} ETB
              </p>
            </div>

            <div class="grid gap-4 px-6 py-6 sm:grid-cols-2">
              <div>
                <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {{ locale.t('transactions.date') }}
                </p>
                <p class="mt-1 font-medium text-slate-900">{{ tx()!.transactionDate | localeDate }}</p>
              </div>
              <div>
                <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {{ locale.t('common.paymentMethod') }}
                </p>
                <div class="mt-1">
                  <app-payment-method-badge [raw]="tx()!.paymentMethod" />
                </div>
              </div>
              @if (tx()!.categoryName) {
                <div>
                  <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {{ locale.t('transactions.category') }}
                  </p>
                  <p class="mt-1 font-medium text-slate-900">{{ tx()!.categoryName }}</p>
                </div>
              }
              @if (tx()!.createdAt) {
                <div>
                  <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {{ locale.t('transactions.recordedAt') }}
                  </p>
                  <p class="mt-1 text-sm text-slate-700">{{ tx()!.createdAt | localeDate }}</p>
                </div>
              }
              <div class="sm:col-span-2">
                <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {{ locale.t('transactions.description') }}
                </p>
                <p class="mt-1 text-slate-800">{{ tx()!.description || '-' }}</p>
              </div>
            </div>

            <div class="flex flex-wrap gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4">
              <button
                type="button"
                class="btn-primary"
                [disabled]="!planFeatures.canWrite()"
                (click)="startEdit()"
              >
                {{ locale.t('common.edit') }}
              </button>
              <button type="button" class="btn-danger" [disabled]="!planFeatures.canWrite()" (click)="remove()">
                {{ locale.t('common.delete') }}
              </button>
            </div>
          </div>
        } @else {
          <div class="card p-6">
            <h2 class="font-display text-lg font-bold text-slate-900">{{ locale.t('transactions.editTitle') }}</h2>
            <form [formGroup]="form" (ngSubmit)="save()" class="mt-6 space-y-4">
              <div class="grid gap-4 sm:grid-cols-2">
                <div>
                  <label class="input-label">{{ locale.t('transactions.amount') }}</label>
                  <input class="input-field" type="number" min="0.01" step="0.01" formControlName="amount" />
                </div>
                <div>
                  <app-payment-method-select formControlName="paymentMethod" [label]="locale.t('common.paymentMethod')" />
                </div>
                <div>
                  <app-category-select
                    formControlName="categoryId"
                    [optional]="true"
                    [label]="locale.t('transactions.category')"
                  />
                </div>
                <div class="sm:col-span-2">
                  <label class="input-label">{{ locale.t('transactions.description') }}</label>
                  <input class="input-field" formControlName="description" />
                </div>
                <div>
                  <app-date-picker
                    formControlName="transactionDate"
                    [label]="locale.t('transactions.date')"
                  />
                </div>
                <div>
                  <label class="input-label">{{ locale.t('transactions.type') }}</label>
                  <select class="input-field" formControlName="type">
                    <option value="INCOME">{{ locale.t('transactions.income') }}</option>
                    <option value="EXPENSE">{{ locale.t('transactions.expense') }}</option>
                  </select>
                </div>
              </div>
              <div class="flex flex-wrap gap-2">
                <button type="button" class="btn-secondary" (click)="cancelEdit()">{{ locale.t('common.cancel') }}</button>
                <button type="submit" class="btn-primary" [disabled]="saving()">
                  {{ saving() ? locale.t('common.loading') : locale.t('common.save') }}
                </button>
              </div>
            </form>
          </div>
        }
      }
    </div>
  `,
})
export class TransactionDetailComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly business = inject(BusinessContextService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly locale = inject(LocaleService);
  readonly planFeatures = inject(PlanFeatureService);

  readonly tx = signal<Transaction | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly editing = signal(false);
  readonly error = signal('');

  private businessId = '';
  private transactionId = '';

  form = this.fb.group({
    type: ['INCOME' as 'INCOME' | 'EXPENSE', Validators.required],
    amount: ['', [Validators.required, minAmountValidator]],
    description: [''],
    paymentMethod: ['Cash', Validators.required],
    categoryId: [''],
    transactionDate: ['', Validators.required],
  });

  ngOnInit() {
    this.transactionId = this.route.snapshot.paramMap.get('id') ?? '';
    if (!this.transactionId) {
      void this.router.navigate(['/app/transactions']);
      return;
    }
    this.load();
    this.business.businessChanged$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        void this.router.navigate(['/app/transactions']);
      });
  }

  load() {
    this.loading.set(true);
    this.error.set('');
    this.business.ensureBusinessId().subscribe({
      next: (bid) => {
        this.businessId = bid;
        this.http
          .get<ApiResponse<Transaction>>(
            `${environment.apiUrl}/businesses/${bid}/transactions/${this.transactionId}`
          )
          .subscribe({
            next: (res) => {
              this.tx.set(res.data);
              this.loading.set(false);
            },
            error: (e) => {
              this.error.set(apiErrorMessage(e, 'Transaction not found'));
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

  startEdit() {
    const t = this.tx();
    if (!t || !this.planFeatures.canWrite()) return;
    this.form.patchValue({
      type: t.type,
      amount: String(t.amount),
      description: t.description ?? '',
      paymentMethod: t.paymentMethod ?? 'Cash',
      categoryId: t.categoryId ?? '',
      transactionDate: t.transactionDate,
    });
    this.editing.set(true);
  }

  cancelEdit() {
    this.editing.set(false);
  }

  save() {
    if (!this.planFeatures.canWrite() || this.form.invalid || !this.businessId) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const amount = Number(v.amount);
    if (!Number.isFinite(amount) || amount < 0.01) return;

    this.saving.set(true);
    this.http
      .put<ApiResponse<Transaction>>(
        `${environment.apiUrl}/businesses/${this.businessId}/transactions/${this.transactionId}`,
        {
          type: v.type,
          amount,
          description: v.description || null,
          paymentMethod: v.paymentMethod,
          categoryId: (v.categoryId ?? '').trim() || null,
          transactionDate: v.transactionDate,
        }
      )
      .subscribe({
        next: (res) => {
          this.tx.set(res.data);
          this.editing.set(false);
          this.saving.set(false);
          this.toast.success(this.locale.t('toast.saved'));
        },
        error: (e) => {
          this.error.set(apiErrorMessage(e, 'Failed to save'));
          this.saving.set(false);
        },
      });
  }

  async remove() {
    if (!this.planFeatures.canWrite() || !this.businessId) return;
    const confirmed = await this.confirmDialog.confirm({
      title: this.locale.t('confirm.deleteTitle'),
      message: this.locale.t('confirm.deleteMessage'),
      confirmLabel: this.locale.t('confirm.delete'),
      cancelLabel: this.locale.t('common.cancel'),
      danger: true,
    });
    if (!confirmed) return;

    this.http
      .delete(`${environment.apiUrl}/businesses/${this.businessId}/transactions/${this.transactionId}`)
      .subscribe({
        next: () => {
          this.toast.success(this.locale.t('toast.saved'));
          void this.router.navigate(['/app/transactions']);
        },
        error: (e) => this.error.set(apiErrorMessage(e, 'Failed to delete')),
      });
  }
}
