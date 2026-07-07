import { DecimalPipe } from '@angular/common';
import { Component, DestroyRef, effect, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BusinessContextService } from '../../core/services/business-context.service';
import { LocaleService } from '../../core/services/locale.service';
import { PlanFeatureService } from '../../core/services/plan-feature.service';
import { ToastService } from '../../core/services/toast.service';
import { ApiResponse, Product, Transaction } from '../../core/models/api.models';
import { apiErrorMessage } from '../../core/utils/http-error';
import { blockQtyDecimalKey, parseWholeQty, sanitizeQtyInput } from '../../core/utils/whole-qty';
import { todayGregorianIso } from '../../core/utils/ethiopian-calendar';
import { AppDatePickerComponent } from '../../shared/app-date-picker.component';
import { PaymentMethodSelectComponent } from '../../shared/payment-method-select.component';
import { CategorySelectComponent } from '../../shared/category-select.component';
import { ProductSelectComponent } from '../../shared/product-select.component';
import { PaymentMethodContextService } from '../../core/services/payment-method-context.service';
import { ProductContextService } from '../../core/services/product-context.service';
import { CategoryContextService } from '../../core/services/category-context.service';

const MAX_ROWS = 50;

function minAmountValidator(control: AbstractControl): ValidationErrors | null {
  const n = Number(control.value);
  if (control.value === '' || control.value == null) return null;
  if (!Number.isFinite(n) || n < 0.01) return { minAmount: true };
  return null;
}

@Component({
  selector: 'app-transaction-batch-page',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    DecimalPipe,
    AppDatePickerComponent,
    PaymentMethodSelectComponent,
    CategorySelectComponent,
    ProductSelectComponent,
  ],
  template: `
    <div class="txn-batch-page space-y-6 animate-fade-in">
      <header class="page-header">
        <div class="min-w-0">
          <a routerLink="/app/transactions" class="txn-batch-back link-brand mb-2 inline-flex items-center gap-1 text-sm font-semibold">
            ← {{ locale.t('transactions.backToList') }}
          </a>
          <div class="flex flex-wrap items-center gap-3">
            <div [class]="txType() === 'INCOME' ? 'txn-form-header-icon-income' : 'txn-form-header-icon-expense'">
              {{ txType() === 'INCOME' ? '+' : '−' }}
            </div>
            <div>
              <h1 class="page-title">
                {{ txType() === 'INCOME' ? locale.t('transactions.batchIncomeTitle') : locale.t('transactions.batchExpenseTitle') }}
              </h1>
              <p class="page-subtitle">{{ locale.t('transactions.batchSubtitle') }}</p>
            </div>
          </div>
        </div>
      </header>

      @if (error()) {
        <div class="alert-error">{{ error() }}</div>
      }

      <form [formGroup]="form" (ngSubmit)="saveAll()" class="space-y-5">
        <section class="card p-5 sm:p-6">
          <h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            {{ locale.t('transactions.batchSharedDate') }}
          </h2>
          <app-date-picker formControlName="sharedDate" [label]="locale.t('transactions.date')" />
          <p class="mt-2 text-xs text-slate-500">{{ locale.t('transactions.batchSharedDateHint') }}</p>
        </section>

        <section class="card">
          <div class="flex flex-col gap-2 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-5">
            <h2 class="text-sm font-semibold text-slate-800">{{ locale.t('transactions.batchEntriesTitle') }}</h2>
            <button
              type="button"
              class="btn-secondary w-full !py-2.5 text-sm sm:w-auto"
              [disabled]="rows.length >= maxRows || saving()"
              (click)="addRow()"
            >
              {{ locale.t('transactions.addRow') }}
            </button>
          </div>

          @if (txType() === 'INCOME') {
            <p class="border-b border-slate-100 px-4 py-2 text-xs text-emerald-800 sm:px-5">
              {{ locale.t('transactions.batchSaleHint') }}
            </p>
          }

          <div class="txn-batch-scroll px-3 py-3 sm:px-5">
            <div
              class="txn-batch-table-head"
              [class.txn-batch-table-head--sale]="txType() === 'INCOME'"
              aria-hidden="true"
            >
              <span>#</span>
              @if (txType() === 'INCOME') {
                <span>{{ locale.t('transactions.whatSold') }}</span>
                <span>{{ locale.t('transactions.qty') }}</span>
              }
              <span>{{ locale.t('transactions.amount') }}</span>
              <span>{{ locale.t('common.paymentMethod') }}</span>
              @if (txType() === 'EXPENSE') {
                <span>{{ locale.t('transactions.description') }}</span>
              }
              <span>{{ locale.t('transactions.category') }}</span>
              <span></span>
            </div>

            <div formArrayName="rows" class="txn-batch-rows">
              @for (row of rows.controls; track $index; let i = $index) {
                <div
                  class="txn-batch-row"
                  [class.txn-batch-row--sale]="txType() === 'INCOME'"
                  [formGroupName]="i"
                >
                  <span class="txn-batch-num">{{ i + 1 }}</span>
                  <button
                    type="button"
                    class="txn-batch-remove-btn"
                    [disabled]="rows.length <= 1 || saving()"
                    (click)="removeRow(i)"
                    [attr.aria-label]="locale.t('transactions.removeRow')"
                    [attr.title]="locale.t('transactions.removeRow')"
                  >
                    <svg
                      class="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      stroke-width="2"
                      aria-hidden="true"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                  @if (txType() === 'INCOME') {
                    <div class="txn-batch-field txn-batch-field-product">
                      <app-product-select
                        class="txn-batch-payment"
                        formControlName="productId"
                        [descriptionControl]="rowDescription(i)"
                        [label]="locale.t('transactions.whatSold')"
                        [compact]="true"
                      />
                    </div>
                    <label class="txn-batch-field txn-batch-field-qty">
                      <span class="txn-batch-field-label">{{ locale.t('transactions.qty') }}</span>
                      <input
                        class="input-field text-sm"
                        type="number"
                        min="1"
                        step="1"
                        inputmode="numeric"
                        formControlName="productQuantity"
                        (keydown)="blockQtyDecimalKey($event)"
                        (input)="onRowQtyInput($event, i)"
                      />
                    </label>
                    @if (rowCustomerQty(i); as customerQty) {
                      <p class="txn-batch-customer-qty">{{ customerQty }}</p>
                    }
                  }
                  <label class="txn-batch-field txn-batch-field-amount">
                    <span class="txn-batch-field-label">{{ locale.t('transactions.amount') }}</span>
                    <input
                      class="input-field"
                      type="number"
                      inputmode="decimal"
                      min="0.01"
                      step="0.01"
                      placeholder="0.00"
                      formControlName="amount"
                    />
                  </label>
                  <div class="txn-batch-field txn-batch-field-payment">
                    <app-payment-method-select
                      class="txn-batch-payment"
                      formControlName="paymentMethod"
                      [label]="locale.t('common.paymentMethod')"
                      [compact]="true"
                    />
                  </div>
                  @if (txType() === 'EXPENSE') {
                    <label class="txn-batch-field txn-batch-field-desc">
                      <span class="txn-batch-field-label">{{ locale.t('transactions.description') }}</span>
                      <input
                        class="input-field"
                        type="text"
                        [placeholder]="locale.t('transactions.descriptionPlaceholder')"
                        formControlName="description"
                      />
                    </label>
                  }
                  <div class="txn-batch-field txn-batch-field-category">
                    <app-category-select
                      class="txn-batch-payment"
                      formControlName="categoryId"
                      [optional]="true"
                      [label]="locale.t('transactions.category')"
                      [compact]="true"
                    />
                  </div>
                </div>
              }
            </div>
          </div>
        </section>

        <div class="txn-batch-footer card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {{ locale.t('transactions.batchTotal') }}
            </p>
            <p class="text-2xl font-bold tabular-nums" [class.text-emerald-600]="txType() === 'INCOME'" [class.text-orange-600]="txType() === 'EXPENSE'">
              {{ txType() === 'INCOME' ? '+' : '−' }}{{ batchTotal() | number: '1.2-2' }} ETB
            </p>
            <p class="text-sm text-slate-500">{{ rows.length }} {{ locale.t('transactions.batchRows') }}</p>
            @if (txType() === 'INCOME' && batchUnitsForCustomer() > 0) {
              <p class="mt-1 text-sm font-medium text-emerald-700">
                {{ locale.t('transactions.totalUnitsForCustomer', { count: batchUnitsForCustomer() }) }}
              </p>
            }
          </div>
          <div class="flex flex-col gap-2 sm:flex-row sm:shrink-0">
            <a routerLink="/app/transactions" class="btn-secondary text-center">{{ locale.t('common.cancel') }}</a>
            <button type="submit" class="btn-primary" [disabled]="saving()">
              {{ saving() ? locale.t('common.loading') : locale.t('transactions.saveAll') }}
            </button>
          </div>
        </div>
      </form>
    </div>
  `,
})
export class TransactionBatchPageComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly business = inject(BusinessContextService);
  private readonly destroyRef = inject(DestroyRef);
  readonly locale = inject(LocaleService);
  readonly planFeatures = inject(PlanFeatureService);
  private readonly toast = inject(ToastService);
  private readonly paymentMethodContext = inject(PaymentMethodContextService);
  readonly productContext = inject(ProductContextService);
  private readonly categoryContext = inject(CategoryContextService);

  readonly maxRows = MAX_ROWS;
  readonly txType = signal<'INCOME' | 'EXPENSE'>('INCOME');
  readonly saving = signal(false);
  readonly error = signal('');

  private businessId = '';

  readonly form = this.fb.group({
    sharedDate: [todayGregorianIso(), Validators.required],
    rows: this.fb.array([this.createRow()]),
  });

  constructor() {
    effect(() => {
      this.productContext.products();
      if (this.txType() !== 'INCOME') return;
      for (const row of this.rows.controls) {
        this.syncRowSaleFields(row);
      }
    });
  }

  get rows(): FormArray<FormGroup> {
    return this.form.get('rows') as FormArray<FormGroup>;
  }

  ngOnInit(): void {
    const typeParam = this.route.snapshot.paramMap.get('type');
    this.txType.set(typeParam === 'expense' ? 'EXPENSE' : 'INCOME');

    if (!this.planFeatures.canWrite()) {
      void this.router.navigate(['/app/transactions']);
      return;
    }

    this.resetForm();
    this.business.ensureBusinessId().subscribe({
      next: (bid) => {
        this.businessId = bid;
        this.paymentMethodContext.loadForBusiness(bid);
        this.productContext.loadForBusiness(bid);
        this.categoryContext.loadForBusiness(bid);
      },
    });
    this.business.businessChanged$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((bid) => {
        this.businessId = bid;
        this.paymentMethodContext.invalidate();
        this.paymentMethodContext.loadForBusiness(bid);
        this.productContext.loadForBusiness(bid);
        this.categoryContext.loadForBusiness(bid);
        this.resetForm();
      });
  }

  readonly blockQtyDecimalKey = blockQtyDecimalKey;

  rowDescription(index: number): AbstractControl | null {
    return this.rows.at(index)?.get('description') ?? null;
  }

  onRowQtyInput(event: Event, index: number): void {
    const el = event.target as HTMLInputElement;
    sanitizeQtyInput(el);
    const ctrl = this.rows.at(index).get('productQuantity');
    if (!ctrl) return;
    if (el.value === '') {
      ctrl.setValue(null, { emitEvent: true });
      return;
    }
    const n = parseWholeQty(el.value, 0);
    if (n > 0) {
      el.value = String(n);
      ctrl.setValue(n, { emitEvent: true });
    }
  }

  batchTotal(): number {
    return this.rows.controls.reduce((sum, row) => {
      const n = Number(row.get('amount')?.value);
      return sum + (Number.isFinite(n) ? n : 0);
    }, 0);
  }

  batchUnitsForCustomer(): number {
    if (this.txType() !== 'INCOME') return 0;
    return this.rows.controls.reduce((sum, row) => {
      const productId = String(row.get('productId')?.value ?? '').trim();
      if (!productId) return sum;
      return sum + parseWholeQty(row.get('productQuantity')?.value);
    }, 0);
  }

  rowCustomerQty(index: number): string | null {
    if (this.txType() !== 'INCOME') return null;
    const row = this.rows.at(index);
    const productId = String(row.get('productId')?.value ?? '').trim();
    if (!productId) return null;
    const product = this.productContext.products().find((p) => p.id === productId);
    if (!product) return null;
    const units = parseWholeQty(row.get('productQuantity')?.value);
    return this.locale.t('transactions.customerGets', {
      qty: units,
      unit: product.unit,
      product: product.name,
    });
  }

  private createRow(): FormGroup {
    const isIncome = this.txType() === 'INCOME';
    return this.fb.group({
      amount: ['', [Validators.required, minAmountValidator]],
      paymentMethod: ['Cash', Validators.required],
      description: [''],
      productId: [''],
      productQuantity: [isIncome ? 1 : null],
      categoryId: [''],
    });
  }

  addRow(): void {
    if (this.rows.length >= MAX_ROWS) return;
    const last = this.rows.at(this.rows.length - 1);
    const row = this.createRow();
    row.patchValue(
      {
        paymentMethod: last?.get('paymentMethod')?.value ?? 'Cash',
        categoryId: last?.get('categoryId')?.value ?? '',
      },
      { emitEvent: false }
    );
    this.rows.push(row);
    this.wireRow(row);
  }

  removeRow(index: number): void {
    if (this.rows.length <= 1) return;
    this.rows.removeAt(index);
  }

  resetForm(): void {
    this.error.set('');
    this.form.setControl('sharedDate', this.fb.control(todayGregorianIso(), Validators.required));
    const row = this.createRow();
    this.form.setControl('rows', this.fb.array([row]));
    this.wireRow(row);
  }

  private wireRow(row: FormGroup): void {
    if (this.txType() !== 'INCOME') return;
    row
      .get('productId')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((id) => {
        const productId = String(id ?? '').trim();
        if (productId && !row.get('productQuantity')?.value) {
          row.patchValue({ productQuantity: 1 }, { emitEvent: true });
        }
        this.syncRowSaleFields(row);
      });
    row
      .get('productQuantity')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.syncRowSaleFields(row));
  }

  private syncRowSaleFields(row: FormGroup): void {
    const product = this.rowProduct(row);
    if (!product) return;
    const qty = parseWholeQty(row.get('productQuantity')?.value, 1);
    if (!row.get('productQuantity')?.value) {
      row.patchValue({ productQuantity: qty }, { emitEvent: false });
    }
    if (!row.get('description')?.dirty) {
      row.patchValue({ description: product.name }, { emitEvent: false });
    }
    if (product.sellPrice != null && qty > 0 && !row.get('amount')?.dirty) {
      const total = Math.round(product.sellPrice * qty * 100) / 100;
      row.patchValue({ amount: String(total) }, { emitEvent: false });
    }
  }

  private rowProduct(row: FormGroup): Product | undefined {
    const productId = String(row.get('productId')?.value ?? '').trim();
    if (!productId) return undefined;
    return this.productContext.products().find((p) => p.id === productId);
  }

  saveAll(): void {
    if (!this.planFeatures.canWrite()) {
      this.error.set(this.locale.t('feature.locked.write'));
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set(this.locale.t('transactions.batchValidationError'));
      return;
    }

    const sharedDate = this.form.get('sharedDate')?.value as string;
    const payloads = this.rows.controls.map((row) => {
      const amount = Number(row.get('amount')?.value);
      if (!Number.isFinite(amount) || amount < 0.01) {
        return null;
      }
      const payload: Record<string, unknown> = {
        type: this.txType(),
        amount,
        description: (row.get('description')?.value as string)?.trim() || null,
        paymentMethod: row.get('paymentMethod')?.value || 'Cash',
        transactionDate: sharedDate,
      };
      if (this.txType() === 'INCOME') {
        const productId = ((row.get('productId')?.value as string) ?? '').trim();
        if (productId) {
          payload['productId'] = productId;
          payload['productQuantity'] = parseWholeQty(row.get('productQuantity')?.value);
          if (!payload['description']) {
            const product = this.productContext.products().find((p) => p.id === productId);
            payload['description'] = product?.name ?? null;
          }
        }
      }
      const categoryId = ((row.get('categoryId')?.value as string) ?? '').trim();
      if (categoryId) {
        payload['categoryId'] = categoryId;
      }
      return payload;
    });

    if (payloads.some((p) => p === null)) {
      this.error.set(this.locale.t('transactions.batchValidationError'));
      return;
    }

    this.saving.set(true);
    this.error.set('');

    const submit = (bid: string) => {
      this.http
        .post<ApiResponse<Transaction[]>>(
          `${environment.apiUrl}/businesses/${bid}/transactions/sync`,
          { transactions: payloads }
        )
        .subscribe({
          next: (res) => {
            const count = res.data?.length ?? payloads.length;
            this.saving.set(false);
            this.productContext.loadForBusiness(bid);
            this.toast.success(this.locale.t('transactions.batchSaved', { count: String(count) }));
            void this.router.navigate(['/app/transactions']);
          },
          error: (e) => {
            this.error.set(apiErrorMessage(e, 'Failed to save transactions'));
            this.saving.set(false);
          },
        });
    };

    if (this.businessId) {
      submit(this.businessId);
      return;
    }

    this.business.ensureBusinessId().subscribe({
      next: (bid) => {
        this.businessId = bid;
        submit(bid);
      },
      error: (e) => {
        this.error.set(apiErrorMessage(e, 'Could not load business'));
        this.saving.set(false);
      },
    });
  }
}
