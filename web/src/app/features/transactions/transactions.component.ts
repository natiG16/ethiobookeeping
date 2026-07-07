import { Component, computed, DestroyRef, effect, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { HttpClient, HttpParams } from '@angular/common/http';

import { FormBuilder, FormsModule, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';

import { DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { ModalOverlayComponent } from '../../shared/modal-overlay.component';

import { environment } from '../../../environments/environment';

import { BusinessContextService } from '../../core/services/business-context.service';

import { LocaleService } from '../../core/services/locale.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmDialogService } from '../../core/services/confirm-dialog.service';
import { PlanFeatureService } from '../../core/services/plan-feature.service';
import { UpgradePlanModalService } from '../../core/services/upgrade-plan-modal.service';

import { ApiResponse, Page, Transaction, TransactionListSummary } from '../../core/models/api.models';

import { apiErrorMessage } from '../../core/utils/http-error';
import { blockQtyDecimalKey, parseWholeQty, sanitizeQtyInput } from '../../core/utils/whole-qty';

import { PaymentMethodSelectComponent } from '../../shared/payment-method-select.component';
import { PaymentMethodContextService } from '../../core/services/payment-method-context.service';
import { ProductContextService } from '../../core/services/product-context.service';
import {
  TransactionSortSelectComponent,
  TransactionSortKey,
} from '../../shared/transaction-sort-select.component';

import { PaymentMethodBadgeComponent } from '../../shared/payment-method-badge.component';

import { PaginationComponent } from '../../shared/pagination.component';
import { AppDatePickerComponent } from '../../shared/app-date-picker.component';
import { CategorySelectComponent } from '../../shared/category-select.component';
import { ProductSelectComponent } from '../../shared/product-select.component';
import { LocaleDatePipe } from '../../shared/locale-date.pipe';
import { todayGregorianIso } from '../../core/utils/ethiopian-calendar';



const PAGE_SIZE = 20;

const TRANSACTION_SORT_PARAMS: Record<TransactionSortKey, string[]> = {
  dateDesc: ['transactionDate,desc', 'createdAt,desc'],
  dateAsc: ['transactionDate,asc', 'createdAt,desc'],
  amountDesc: ['amount,desc', 'createdAt,desc'],
  amountAsc: ['amount,asc', 'createdAt,desc'],
  createdDesc: ['createdAt,desc'],
};

function minAmountValidator(control: AbstractControl): ValidationErrors | null {
  const n = Number(control.value);
  if (control.value === '' || control.value == null) return null;
  if (!Number.isFinite(n) || n < 0.01) return { minAmount: true };
  return null;
}

@Component({

  selector: 'app-transactions',

  standalone: true,

  imports: [

    ReactiveFormsModule,
    FormsModule,

    DecimalPipe,
    NgTemplateOutlet,

    PaymentMethodSelectComponent,
    CategorySelectComponent,
    ProductSelectComponent,
    TransactionSortSelectComponent,
    AppDatePickerComponent,
    LocaleDatePipe,

    PaymentMethodBadgeComponent,

    PaginationComponent,
    RouterLink,
    ModalOverlayComponent,

  ],

  template: `

    <div class="page-shell">

      <header class="page-header !mb-0">
        <div>
          <h1 class="page-title">{{ locale.t('nav.transactions') }}</h1>
          <p class="page-subtitle">{{ totalElements() }} {{ locale.t('transactions.records') }}</p>
        </div>
        <button type="button" class="btn-secondary shrink-0" [disabled]="exporting()" (click)="exportCsv()">
          {{ exporting() ? locale.t('common.loading') : locale.t('transactions.exportCsv') }}
        </button>
      </header>

      <div class="toolbar-card">
        <div class="toolbar-card-body">
          <label class="toolbar-search">
            <span class="sr-only">{{ locale.t('transactions.search') }}</span>
            <svg class="toolbar-search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
            </svg>
            <input
              id="txn-search"
              class="input-field w-full"
              [(ngModel)]="draftSearch"
              (ngModelChange)="onSearchInput($event)"
              [placeholder]="locale.t('transactions.search')"
            />
          </label>
          <div class="toolbar-actions" [attr.aria-label]="locale.t('transactions.quickActions')">
            <button
              type="button"
              class="txn-action-btn txn-action-btn-income"
              [class.txn-action-btn-active]="showForm() && formType() === 'INCOME'"
              [disabled]="!planFeatures.canWrite()"
              (click)="openForm('INCOME')"
            >
              <span class="txn-action-btn-icon" aria-hidden="true">+</span>
              <span class="txn-action-btn-label">{{ locale.t('transactions.addIncome') }}</span>
            </button>
            <button
              type="button"
              class="txn-action-btn txn-action-btn-expense"
              [class.txn-action-btn-active]="showForm() && formType() === 'EXPENSE'"
              [disabled]="!planFeatures.canWrite()"
              (click)="openForm('EXPENSE')"
            >
              <span class="txn-action-btn-icon" aria-hidden="true">−</span>
              <span class="txn-action-btn-label">{{ locale.t('transactions.addExpense') }}</span>
            </button>
          </div>
        </div>
        <div class="toolbar-secondary">
          <button
            type="button"
            class="toolbar-batch-btn toolbar-batch-btn-income"
            [disabled]="!planFeatures.canWrite()"
            (click)="goToBatch('income')"
          >
            {{ locale.t('transactions.addMultipleIncome') }}
          </button>
          <button
            type="button"
            class="toolbar-batch-btn toolbar-batch-btn-expense"
            [disabled]="!planFeatures.canWrite()"
            (click)="goToBatch('expense')"
          >
            {{ locale.t('transactions.addMultipleExpense') }}
          </button>
        </div>
      </div>



      <section
        class="filter-panel"
        [class.filter-panel-expanded]="filtersOpen()"
        [attr.aria-label]="locale.t('transactions.filtersTitle')"
      >
        <button
          type="button"
          class="filter-panel-head filter-panel-toggle"
          (click)="toggleFilters()"
          [attr.aria-expanded]="filtersOpen()"
          [attr.aria-controls]="'txn-filter-panel-body'"
        >
          <div class="filter-panel-head-text">
            <svg class="filter-panel-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <h2 class="filter-panel-title">{{ locale.t('transactions.filtersTitle') }}</h2>
            @if (hasActiveFilters()) {
              <span class="filter-active-badge">{{ locale.t('transactions.filtersActive') }}</span>
            }
          </div>
          <span class="filter-panel-toggle-meta">
            <span class="filter-panel-toggle-label">
              {{ filtersOpen() ? locale.t('transactions.hideFilters') : locale.t('transactions.showFilters') }}
            </span>
            <svg
              class="filter-panel-chevron"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </button>

        @if (filtersOpen()) {
        <div id="txn-filter-panel-body" class="filter-panel-collapsible">
        <form class="filter-panel-body" (ngSubmit)="applyFilters()">
          <div class="filter-panel-section">
            <p class="filter-panel-section-label">{{ locale.t('transactions.filterDateRange') }}</p>
            <div class="filter-panel-dates">
              <div class="filter-panel-field">
                <app-date-picker
                  [label]="locale.t('transactions.dateFrom')"
                  [optional]="true"
                  [(ngModel)]="draftFrom"
                  name="draftFrom"
                />
              </div>
              <div class="filter-panel-field">
                <app-date-picker
                  [label]="locale.t('transactions.dateTo')"
                  [optional]="true"
                  [(ngModel)]="draftTo"
                  name="draftTo"
                />
              </div>
            </div>
          </div>

          @if (planFeatures.canAdvancedFilters() || planFeatures.canPaymentMethodFilter()) {
            <div class="filter-panel-section">
              <p class="filter-panel-section-label">{{ locale.t('transactions.filterRefine') }}</p>
              <div class="filter-panel-refine">
                @if (planFeatures.canAdvancedFilters()) {
                  <div class="filter-panel-field sm:col-span-2">
                    <span class="input-label mb-2 block">{{ locale.t('transactions.type') }}</span>
                    <div class="filter-type-pills" role="group" [attr.aria-label]="locale.t('transactions.type')">
                      <button
                        type="button"
                        class="filter-type-pill"
                        [class.filter-type-pill-active]="!draftType"
                        (click)="setDraftType('')"
                      >
                        {{ locale.t('transactions.filterAllTypes') }}
                      </button>
                      <button
                        type="button"
                        class="filter-type-pill filter-type-pill-income"
                        [class.filter-type-pill-active]="draftType === 'INCOME'"
                        (click)="setDraftType('INCOME')"
                      >
                        ↑ {{ locale.t('transactions.income') }}
                      </button>
                      <button
                        type="button"
                        class="filter-type-pill filter-type-pill-expense"
                        [class.filter-type-pill-active]="draftType === 'EXPENSE'"
                        (click)="setDraftType('EXPENSE')"
                      >
                        ↓ {{ locale.t('transactions.expense') }}
                      </button>
                    </div>
                  </div>
                }
                @if (planFeatures.canPaymentMethodFilter()) {
                  <div class="filter-panel-field">
                    <app-payment-method-select
                      [label]="locale.t('common.paymentMethod')"
                      [optional]="true"
                      [compact]="true"
                      [ngModel]="draftPayment"
                      (ngModelChange)="onDraftPaymentChange($event)"
                      name="draftPayment"
                    />
                  </div>
                }
              </div>
            </div>
          }

          <div class="filter-panel-actions">
            <button type="submit" class="btn-primary filter-apply-btn">
              {{ locale.t('transactions.applyFilters') }}
            </button>
            @if (hasActiveFilters()) {
              <button type="button" class="btn-ghost" (click)="clearFilters()">
                {{ locale.t('transactions.clearFilters') }}
              </button>
            }
          </div>
        </form>

        @if (!loading() && totalElements() > 0) {
          <div class="filter-panel-summary">
            <div class="filter-summary-chip filter-summary-chip-income">
              <p class="filter-summary-chip-label">{{ locale.t('transactions.income') }}</p>
              <p class="filter-summary-chip-value text-emerald-700">+{{ summary().incomeTotal | number: '1.2-2' }}</p>
              <p class="filter-summary-chip-meta">{{ summary().incomeCount }} {{ locale.t('transactions.records') }}</p>
            </div>
            <div class="filter-summary-chip filter-summary-chip-expense">
              <p class="filter-summary-chip-label">{{ locale.t('transactions.expense') }}</p>
              <p class="filter-summary-chip-value text-orange-700">−{{ summary().expenseTotal | number: '1.2-2' }}</p>
              <p class="filter-summary-chip-meta">{{ summary().expenseCount }} {{ locale.t('transactions.records') }}</p>
            </div>
          </div>
        }
        </div>
        }

        <div class="filter-panel-foot">
          <span class="filter-panel-foot-label">{{ locale.t('transactions.sortBy') }}</span>
          <app-transaction-sort-select
            class="filter-sort-field"
            [ngModel]="sortBy()"
            (ngModelChange)="onSortChange($event)"
            name="txnSort"
          />
        </div>
      </section>



      @if (error() && !showForm()) {

        <div class="alert-error">{{ error() }}</div>

      }



      <section class="txn-results-section">
      @if (loading()) {
        <div class="space-y-3">
          @for (i of [1, 2, 3]; track i) {
            <div class="list-row skeleton h-20 !p-0"></div>
          }
        </div>
      } @else if (totalElements() === 0) {
        <div class="empty-state">
          <div class="empty-state-icon" aria-hidden="true">
            <svg class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V6m0 12v-2m9-4a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p class="empty-state-title">{{ locale.t('transactions.emptyTitle') }}</p>
          <p class="empty-state-text">{{ locale.t('transactions.empty') }}</p>
          <button type="button" class="btn-primary mt-5" [disabled]="!planFeatures.canWrite()" (click)="openForm('INCOME')">
            {{ locale.t('transactions.addIncome') }}
          </button>
        </div>
      } @else {
        <div class="txn-list-panel">
          <div class="txn-list-panel-head">
            <h3 class="txn-list-panel-title">{{ locale.t('transactions.resultsTitle') }}</h3>
            <span class="text-xs text-slate-500">{{ totalElements() }} {{ locale.t('transactions.records') }}</span>
          </div>
          <div class="txn-list-panel-body">
            @for (tx of items(); track tx.id) {
              <div class="txn-list-row-wrap">
                <ng-container *ngTemplateOutlet="txnRow; context: { $implicit: tx }" />
              </div>
            }
          </div>
        </div>

        <div class="mt-4">
        <app-pagination
          [page]="page()"
          [totalPages]="totalPages()"
          [totalElements]="totalElements()"
          [pageSize]="pageSize"
          (pageChange)="onPageChange($event)"
        />
        </div>
      }
      </section>

      <ng-template #txnRow let-tx>
        <div class="list-row group">
          <a
            [routerLink]="['/app/transactions', tx.id]"
            class="flex min-w-0 flex-1 items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <div
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg"
              [class.bg-emerald-100]="tx.type === 'INCOME'"
              [class.bg-orange-100]="tx.type === 'EXPENSE'"
            >
              {{ tx.type === 'INCOME' ? '↑' : '↓' }}
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <p class="font-medium truncate">{{ tx.description || tx.type }}</p>
                <span [class]="tx.type === 'INCOME' ? 'badge-income' : 'badge-expense'">{{ tx.type }}</span>
              </div>
              <p class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                <span>{{ tx.transactionDate | localeDate }}</span>
                <span class="text-slate-300">·</span>
                <app-payment-method-badge [raw]="tx.paymentMethod" />
                @if (tx.productName) {
                  <span class="text-slate-300">·</span>
                  <span>{{ tx.productName }} × {{ tx.productQuantity }}</span>
                }
              </p>
            </div>
            <p
              class="shrink-0 text-lg font-bold tabular-nums"
              [class.text-emerald-600]="tx.type === 'INCOME'"
              [class.text-orange-600]="tx.type === 'EXPENSE'"
            >
              {{ tx.type === 'INCOME' ? '+' : '−' }}{{ tx.amount | number: '1.2-2' }}
            </p>
          </a>
          <button
            type="button"
            class="btn-danger shrink-0"
            [disabled]="!planFeatures.canWrite()"
            (click)="remove(tx.id); $event.stopPropagation()"
          >
            {{ locale.t('common.delete') }}
          </button>
        </div>
      </ng-template>

      @if (showForm()) {
        <app-modal-overlay
          [panelClass]="'txn-modal-card animate-scale-in ' + (formType() === 'INCOME' ? 'txn-modal-income' : 'txn-modal-expense')"
          panelLabelledBy="txn-form-title"
          (close)="closeForm()"
        >
            <div class="txn-form-header !border-0 !px-0 !pt-0">
              <div [class]="formType() === 'INCOME' ? 'txn-form-header-icon-income' : 'txn-form-header-icon-expense'">
                {{ formType() === 'INCOME' ? '+' : '−' }}
              </div>
              <div class="flex-1 min-w-0">
                <h2 id="txn-form-title" class="font-display text-lg font-bold text-slate-900">
                  {{ formType() === 'INCOME' ? locale.t('transactions.addIncome') : locale.t('transactions.addExpense') }}
                </h2>
                <p class="mt-0.5 text-sm text-slate-500">{{ locale.t('transactions.formSubtitle') }}</p>
              </div>
              <button
                type="button"
                class="logo-menu-btn shrink-0"
                (click)="closeForm()"
                [attr.aria-label]="locale.t('common.cancel')"
              >
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            @if (error()) {
              <div class="alert-error mt-4 text-left">{{ error() }}</div>
            }

            <form [formGroup]="form" (ngSubmit)="save()" class="txn-form mt-4">
              @if (formType() === 'INCOME') {
                <div class="rounded-2xl border border-emerald-200/80 bg-gradient-to-b from-emerald-50/80 to-white p-4 space-y-3">
                  <p class="text-sm font-semibold text-emerald-900">{{ locale.t('transactions.saleSection') }}</p>
                  <div class="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_5.5rem]">
                    <div class="form-field">
                      <app-product-select
                        formControlName="productId"
                        [descriptionControl]="form.controls.description"
                        [label]="locale.t('transactions.whatSold')"
                      />
                    </div>
                    <div class="form-field">
                      <label class="input-label" for="productQty">{{ locale.t('transactions.qty') }}</label>
                      <input
                        id="productQty"
                        class="input-field text-center text-lg font-semibold"
                        type="number"
                        min="1"
                        step="1"
                        inputmode="numeric"
                        formControlName="productQuantity"
                        (keydown)="blockQtyDecimalKey($event)"
                        (input)="onQtyInput($event)"
                      />
                    </div>
                  </div>
                  @if (selectedProduct(); as p) {
                    <p class="text-xs font-medium text-emerald-800">
                      {{ locale.t('transactions.stockNow') }}: {{ p.quantityOnHand | number: '1.0-3' }} {{ p.unit }}
                      @if (saleQty() > 0) {
                        → {{ p.quantityOnHand - saleQty() | number: '1.0-3' }} {{ locale.t('transactions.afterSale') }}
                      }
                    </p>
                  } @else if (!(form.get('description')?.value ?? '').trim()) {
                    <p class="text-xs text-emerald-700">{{ locale.t('transactions.typeWhatSold') }}</p>
                  }
                </div>

                <div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div class="form-field">
                    <label class="input-label" for="amount">{{ locale.t('transactions.amount') }} (ETB)</label>
                    <input
                      id="amount"
                      class="input-field text-lg font-semibold"
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="0.00"
                      formControlName="amount"
                    />
                  </div>
                  <app-payment-method-select formControlName="paymentMethod" [label]="locale.t('common.paymentMethod')" />
                  <div class="form-field sm:col-span-2">
                    <app-category-select
                      formControlName="categoryId"
                      [optional]="true"
                      [label]="locale.t('transactions.category')"
                    />
                  </div>
                </div>
              } @else {
                <div class="space-y-3">
                  <div class="form-field">
                    <label class="input-label" for="amount-exp">{{ locale.t('transactions.amount') }} (ETB)</label>
                    <input
                      id="amount-exp"
                      class="input-field text-lg font-semibold"
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="0.00"
                      formControlName="amount"
                    />
                  </div>
                  <app-payment-method-select formControlName="paymentMethod" [label]="locale.t('common.paymentMethod')" />
                  <app-category-select
                    formControlName="categoryId"
                    [optional]="true"
                    [label]="locale.t('transactions.category')"
                  />
                </div>
              }

              @if (form.get('amount')?.invalid && form.get('amount')?.touched) {
                <p class="mt-2 text-xs text-red-600">Enter an amount of at least 0.01 ETB</p>
              }

              <div class="modal-actions mt-5 !text-left">
                <button type="button" class="btn-secondary flex-1" (click)="closeForm()">
                  {{ locale.t('common.cancel') }}
                </button>
                <button type="submit" class="btn-primary flex-1 text-base" [disabled]="saving()">
                  {{ saving() ? locale.t('common.loading') : (formType() === 'INCOME' ? locale.t('transactions.recordSale') : locale.t('common.save')) }}
                </button>
              </div>
            </form>
        </app-modal-overlay>
      }

    </div>

  `,

})

export class TransactionsComponent implements OnInit {

  private readonly http = inject(HttpClient);

  private readonly business = inject(BusinessContextService);

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly fb = inject(FormBuilder);

  readonly locale = inject(LocaleService);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  readonly planFeatures = inject(PlanFeatureService);
  private readonly paymentMethodContext = inject(PaymentMethodContextService);
  readonly productContext = inject(ProductContextService);
  private readonly upgradeModal = inject(UpgradePlanModalService);

  readonly pageSize = PAGE_SIZE;

  readonly items = signal<Transaction[]>([]);

  readonly page = signal(0);

  readonly totalPages = signal(0);

  readonly totalElements = signal(0);

  readonly showForm = signal(false);
  readonly formType = signal<'INCOME' | 'EXPENSE'>('INCOME');

  readonly loading = signal(true);
  readonly exporting = signal(false);

  readonly saving = signal(false);

  readonly error = signal('');

  readonly filterType = signal('');

  readonly filterFrom = signal('');

  readonly filterTo = signal('');

  readonly filterPayment = signal('');

  readonly filterSearch = signal('');

  readonly filtersOpen = signal(false);

  readonly sortBy = signal<TransactionSortKey>('dateDesc');
  readonly selectedProductId = signal('');
  readonly saleQty = signal(0);

  readonly selectedProduct = computed(() => {
    const id = this.selectedProductId();
    if (!id) return null;
    return this.productContext.products().find((p) => p.id === id) ?? null;
  });

  readonly summary = signal<TransactionListSummary>({
    incomeTotal: 0,
    expenseTotal: 0,
    incomeCount: 0,
    expenseCount: 0,
  });

  draftType = '';
  draftFrom = '';
  draftTo = '';
  draftPayment = '';
  draftSearch = '';

  businessId = '';
  private searchDebounce?: ReturnType<typeof setTimeout>;

  form = this.fb.group({
    amount: ['', [Validators.required, minAmountValidator]],
    description: [''],
    categoryId: [''],
    productId: [''],
    productQuantity: [null as number | null],
    paymentMethod: ['Cash', Validators.required],
    transactionDate: [todayGregorianIso(), Validators.required],
  });



  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    effect(() => {
      this.productContext.products();
      if (this.selectedProductId()) {
        this.syncSaleFields();
      }
    });
  }

  ngOnInit() {

    this.route.queryParams.subscribe((p) => {

      if (p['type'] === 'income') this.openForm('INCOME');

      if (p['type'] === 'expense') this.openForm('EXPENSE');

    });

    this.load();

    this.form
      .get('productId')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((id) => {
        const productId = (id ?? '').trim();
        this.selectedProductId.set(productId);
        if (productId && !this.form.get('productQuantity')?.value) {
          this.form.patchValue({ productQuantity: 1 }, { emitEvent: true });
        }
        this.syncSaleFields();
      });

    this.form
      .get('productQuantity')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((qty) => {
        const n = Number(qty);
        this.saleQty.set(Number.isFinite(n) && n > 0 ? parseWholeQty(n, 0) : 0);
        this.syncSaleFields();
      });

    this.business.businessChanged$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.closeForm();
        this.page.set(0);
        this.items.set([]);
        this.summary.set({ incomeTotal: 0, expenseTotal: 0, incomeCount: 0, expenseCount: 0 });
        this.load();
      });

  }



  openUpgrade() {
    this.upgradeModal.show();
  }

  goToBatch(kind: 'income' | 'expense') {
    if (!this.planFeatures.canWrite()) return;
    void this.router.navigate([`/app/transactions/batch/${kind}`]);
  }

  readonly blockQtyDecimalKey = blockQtyDecimalKey;

  onQtyInput(event: Event): void {
    const el = event.target as HTMLInputElement;
    sanitizeQtyInput(el);
    const ctrl = this.form.get('productQuantity');
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

  openForm(type: 'INCOME' | 'EXPENSE') {
    if (!this.planFeatures.canWrite()) {
      this.error.set(this.locale.t('feature.locked.write'));
      return;
    }
    if (this.showForm() && this.formType() === type) {
      this.closeForm();
      return;
    }
    this.form.reset({
      amount: '',
      description: '',
      categoryId: '',
      productId: '',
      productQuantity: type === 'INCOME' ? 1 : null,
      paymentMethod: 'Cash',
      transactionDate: todayGregorianIso(),
    });
    this.selectedProductId.set('');
    this.saleQty.set(type === 'INCOME' ? 1 : 0);
    this.formType.set(type);
    this.showForm.set(true);
    this.error.set('');
    this.business.ensureBusinessId().subscribe({
      next: (bid) => this.productContext.loadForBusiness(bid),
    });
  }

  private syncSaleFields() {
    const product = this.selectedProduct();
    if (!product) return;
    const qty = this.saleQty();
    if (!this.form.get('description')?.dirty) {
      this.form.patchValue({ description: product.name }, { emitEvent: false });
    }
    if (product.sellPrice != null && qty > 0 && !this.form.get('amount')?.dirty) {
      const total = Math.round(product.sellPrice * qty * 100) / 100;
      this.form.patchValue({ amount: String(total) }, { emitEvent: false });
    }
  }

  closeForm() {
    this.showForm.set(false);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { type: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }



  setDraftType(value: string) {
    this.draftType = value;
  }

  toggleFilters() {
    this.filtersOpen.update((open) => !open);
  }

  applyFilters() {
    this.closeForm();
    let from = this.draftFrom?.trim() ?? '';
    let to = this.draftTo?.trim() ?? '';
    if (from && !to) {
      to = from;
    } else if (to && !from) {
      from = to;
    }
    this.draftFrom = from;
    this.draftTo = to;
    this.filterFrom.set(from);
    this.filterTo.set(to);
    if (this.planFeatures.canAdvancedFilters()) {
      this.filterType.set(this.draftType);
    } else if (this.draftType) {
      this.error.set(this.locale.t('feature.locked.advancedFilters'));
      this.openUpgrade();
      return;
    }
    if (this.planFeatures.canPaymentMethodFilter()) {
      this.filterPayment.set(this.paymentMethodContext.resolveFilterValue(this.draftPayment));
    } else if (this.draftPayment?.trim()) {
      this.error.set(this.locale.t('feature.locked.advancedFilters'));
      this.openUpgrade();
      return;
    }
    this.page.set(0);
    this.load();
  }

  hasActiveFilters(): boolean {
    return this.activeFilterCount() > 0;
  }

  activeFilterCount(): number {
    let n = 0;
    if (this.filterFrom()) n++;
    if (this.filterTo()) n++;
    if (this.filterType()) n++;
    if (this.filterPayment()) n++;
    if (this.filterSearch()) n++;
    return n;
  }

  onSearchInput(value: string) {
    this.draftSearch = value;
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => {
      const term = value.trim();
      if (term === this.filterSearch()) return;
      this.filterSearch.set(term);
      this.page.set(0);
      this.load();
    }, 350);
  }

  clearFilters() {
    this.closeForm();
    this.draftType = '';
    this.draftFrom = '';
    this.draftTo = '';
    this.draftPayment = '';
    this.draftSearch = '';
    this.filterType.set('');
    this.filterFrom.set('');
    this.filterTo.set('');
    this.filterPayment.set('');
    this.filterSearch.set('');
    this.page.set(0);
    this.load();
  }



  onPageChange(nextPage: number) {

    this.page.set(nextPage);

    this.load();

  }

  onSortChange(value: TransactionSortKey) {
    this.sortBy.set(value);
    this.page.set(0);
    this.load();
  }



  load() {

    this.loading.set(true);

    this.error.set('');

    this.business.ensureBusinessId().subscribe({

      next: (bid) => {

        this.businessId = bid;

        const params = this.buildListParams();

        this.http
          .get<ApiResponse<Page<Transaction>>>(
            `${environment.apiUrl}/businesses/${bid}/transactions`,
            { params: params as HttpParams }
          )
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
              this.error.set(apiErrorMessage(e, 'Failed to load transactions'));
              this.loading.set(false);
            },
          });

        this.loadSummary(bid);

      },

      error: (e) => {

        this.error.set(apiErrorMessage(e, 'Could not load business'));

        this.loading.set(false);

      },

    });

  }



  private buildListParams(): HttpParams {
    let params = new HttpParams()
      .set('page', String(this.page()))
      .set('size', String(PAGE_SIZE));
    for (const sort of TRANSACTION_SORT_PARAMS[this.sortBy()]) {
      params = params.append('sort', sort);
    }
    if (this.filterFrom()) params = params.set('from', this.filterFrom());
    if (this.filterTo()) params = params.set('to', this.filterTo());
    if (this.planFeatures.canAdvancedFilters() && this.filterType()) {
      params = params.set('type', this.filterType());
    }
    if (this.planFeatures.canPaymentMethodFilter() && this.filterPayment()) {
      params = params.set('paymentMethod', this.filterPayment());
    }
    if (this.filterSearch()) params = params.set('search', this.filterSearch());
    return params;
  }

  private buildSummaryParams(): Record<string, string> {
    const params: Record<string, string> = {};
    if (this.filterFrom()) params['from'] = this.filterFrom();
    if (this.filterTo()) params['to'] = this.filterTo();
    if (this.planFeatures.canAdvancedFilters() && this.filterType()) {
      params['type'] = this.filterType();
    }
    if (this.planFeatures.canPaymentMethodFilter() && this.filterPayment()) {
      params['paymentMethod'] = this.filterPayment();
    }
    if (this.filterSearch()) params['search'] = this.filterSearch();
    return params;
  }

  onDraftPaymentChange(value: string) {
    this.draftPayment = value ?? '';
    if (!this.planFeatures.canPaymentMethodFilter()) {
      return;
    }
    this.filterPayment.set(this.paymentMethodContext.resolveFilterValue(this.draftPayment));
    this.page.set(0);
    this.load();
  }

  exportCsv() {
    this.exporting.set(true);
    this.business.ensureBusinessId().subscribe({
      next: (bid) => {
        let params = new HttpParams();
        const filters = this.buildSummaryParams();
        for (const [key, value] of Object.entries(filters)) {
          params = params.set(key, value);
        }
        this.http
          .get(`${environment.apiUrl}/businesses/${bid}/transactions/export`, {
            params,
            responseType: 'blob',
          })
          .subscribe({
            next: (blob) => {
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
              a.click();
              URL.revokeObjectURL(url);
              this.toast.success(this.locale.t('transactions.exportSuccess'));
              this.exporting.set(false);
            },
            error: async (e) => {
              this.error.set(await this.exportErrorMessage(e));
              this.exporting.set(false);
            },
          });
      },
      error: (e) => {
        this.error.set(apiErrorMessage(e, 'Could not load business'));
        this.exporting.set(false);
      },
    });
  }

  private async exportErrorMessage(err: unknown): Promise<string> {
    const e = err as { error?: Blob | { message?: string } };
    if (e.error instanceof Blob) {
      try {
        const text = await e.error.text();
        const parsed = JSON.parse(text) as { message?: string };
        if (parsed.message) return parsed.message;
      } catch {
        /* not json */
      }
    }
    return apiErrorMessage(err, 'Export failed');
  }

  private loadSummary(businessId: string): void {
    this.http
      .get<ApiResponse<TransactionListSummary>>(
        `${environment.apiUrl}/businesses/${businessId}/transactions/summary`,
        { params: this.buildSummaryParams() }
      )
      .subscribe({
        next: (res) => {
          if (res.data) {
            this.summary.set(res.data);
          }
        },
        error: () => {
          this.summary.set({
            incomeTotal: 0,
            expenseTotal: 0,
            incomeCount: 0,
            expenseCount: 0,
          });
        },
      });
  }

  save() {
    if (!this.planFeatures.canWrite()) {
      this.error.set(this.locale.t('feature.locked.write'));
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Please enter a valid amount and date.');
      return;
    }

    const v = this.form.getRawValue();
    const amount = Number(v.amount);
    if (!Number.isFinite(amount) || amount < 0.01) {
      this.error.set('Please enter a valid amount (min 0.01 ETB).');
      return;
    }

    this.saving.set(true);
    this.error.set('');

    const bid = this.businessId;
    const payload: Record<string, unknown> = {
      type: this.formType(),
      amount,
      description: (v.description ?? '').trim() || null,
      paymentMethod: v.paymentMethod || 'Cash',
      transactionDate: v.transactionDate,
    };
    const categoryId = (v.categoryId ?? '').trim();
    if (categoryId) {
      payload['categoryId'] = categoryId;
    }
    const productId = ((v.productId ?? '').trim() || this.selectedProductId()).trim();
    if (this.formType() === 'INCOME' && productId) {
      const qty = parseWholeQty(v.productQuantity);
      payload['productId'] = productId;
      payload['productQuantity'] = qty;
      if (!(v.description ?? '').trim()) {
        const product = this.productContext.products().find((p) => p.id === productId);
        payload['description'] = product?.name ?? null;
      }
    }

    const save$ = (businessId: string) =>
      this.http.post<ApiResponse<Transaction>>(
        `${environment.apiUrl}/businesses/${businessId}/transactions`,
        payload
      );

    const onSuccess = (res?: ApiResponse<Transaction>) => {
      this.saving.set(false);
      if (this.businessId) {
        this.productContext.loadForBusiness(this.businessId);
      }
      const tx = res?.data;
      if (tx?.productName && tx.productQuantity != null) {
        this.toast.success(
          `${this.locale.t('transactions.saleRecorded')} — ${tx.productName} × ${tx.productQuantity}`
        );
      }
      this.closeForm();
      this.form.reset({
        amount: '',
        description: '',
        categoryId: '',
        productId: '',
        productQuantity: null,
        paymentMethod: 'Cash',
        transactionDate: todayGregorianIso(),
      });
      this.page.set(0);
      this.load();
      if (!tx?.productName) {
        this.toast.success(this.locale.t('toast.saved'));
      }
    };

    const onError = (e: unknown) => {
      const msg = apiErrorMessage(e, 'Failed to save');
      this.error.set(msg);
      this.toast.error(msg);
      this.saving.set(false);
    };

    if (bid) {
      save$(bid).subscribe({ next: (res) => onSuccess(res), error: onError });
      return;
    }

    this.business.ensureBusinessId().subscribe({
      next: (id) => {
        this.businessId = id;
        save$(id).subscribe({ next: (res) => onSuccess(res), error: onError });
      },
      error: (e) => onError(e),
    });
  }



  async remove(id: string) {
    if (!this.planFeatures.canWrite()) {
      this.error.set(this.locale.t('feature.locked.write'));
      return;
    }
    if (!this.businessId) return;

    const confirmed = await this.confirmDialog.confirm({
      title: this.locale.t('confirm.deleteTitle'),
      message: this.locale.t('confirm.deleteMessage'),
      confirmLabel: this.locale.t('confirm.delete'),
      cancelLabel: this.locale.t('common.cancel'),
      danger: true,
    });
    if (!confirmed) return;

    this.http

      .delete(`${environment.apiUrl}/businesses/${this.businessId}/transactions/${id}`)

      .subscribe({

        next: () => {

          if (this.items().length === 1 && this.page() > 0) {

            this.page.update((p) => p - 1);

          }

          this.load();

        },

        error: (e) => this.error.set(apiErrorMessage(e, 'Failed to delete')),

      });

  }

}

