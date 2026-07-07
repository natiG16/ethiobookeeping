import { DecimalPipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BusinessContextService } from '../../core/services/business-context.service';
import { LocaleService } from '../../core/services/locale.service';
import { PlanFeatureService } from '../../core/services/plan-feature.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmDialogService } from '../../core/services/confirm-dialog.service';
import { ApiResponse, Supplier, SupplierPayable, SupplierPayment } from '../../core/models/api.models';
import { apiErrorMessage } from '../../core/utils/http-error';
import { LocaleDatePipe } from '../../shared/locale-date.pipe';
import { ModalOverlayComponent } from '../../shared/modal-overlay.component';
import { PaymentMethodSelectComponent } from '../../shared/payment-method-select.component';

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DecimalPipe,
    LocaleDatePipe,
    ModalOverlayComponent,
    PaymentMethodSelectComponent,
  ],
  template: `
    <div class="space-y-6">
      <header class="page-header">
        <div>
          <h1 class="page-title">{{ locale.t('nav.suppliers') }}</h1>
          <p class="page-subtitle">{{ locale.t('suppliers.subtitle') }}</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button type="button" class="btn-secondary" [disabled]="!planFeatures.canWrite()" (click)="openSupplier()">
            {{ locale.t('suppliers.add') }}
          </button>
          <button type="button" class="btn-primary" [disabled]="!planFeatures.canWrite() || !suppliers().length" (click)="openPayable()">
            {{ locale.t('suppliers.addPayable') }}
          </button>
        </div>
      </header>

      <section class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        @for (s of suppliers(); track s.id) {
          <article class="card p-5">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <h2 class="font-semibold text-slate-900">{{ s.name }}</h2>
                @if (s.phone) {
                  <p class="text-sm text-slate-500">{{ s.phone }}</p>
                }
                @if (s.contactPerson) {
                  <p class="text-sm text-slate-500">{{ s.contactPerson }}</p>
                }
              </div>
              <div class="flex shrink-0 gap-1">
                <button
                  type="button"
                  class="btn-ghost px-2 py-1 text-xs"
                  [disabled]="!planFeatures.canWrite()"
                  (click)="openEditSupplier(s)"
                >
                  {{ locale.t('common.edit') }}
                </button>
                <button
                  type="button"
                  class="btn-ghost px-2 py-1 text-xs !text-red-600"
                  [disabled]="!planFeatures.canWrite() || deletingId() === s.id"
                  (click)="removeSupplier(s)"
                >
                  {{ locale.t('common.delete') }}
                </button>
              </div>
            </div>
            <p class="mt-2 text-sm font-medium text-orange-700">
              {{ locale.t('suppliers.amountOwed') }}: {{ s.amountOwed | number: '1.2-2' }} ETB
            </p>
          </article>
        }
      </section>

      <section>
        <h2 class="mb-3 font-semibold text-slate-800">{{ locale.t('suppliers.payables') }}</h2>
        <div class="space-y-3">
          @for (p of payables(); track p.id) {
            <article class="card flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p class="font-medium text-slate-900">{{ p.supplierName }}</p>
                <p class="text-sm text-slate-500">
                  {{ p.remainingAmount | number: '1.2-2' }} / {{ p.totalAmount | number: '1.2-2' }} ETB
                  @if (p.dueDate) {
                    · {{ p.dueDate | localeDate }}
                  }
                </p>
              </div>
              @if (p.status === 'ACTIVE' || p.status === 'OVERDUE') {
                <button type="button" class="btn-primary text-sm" (click)="openPayment(p)">
                  {{ locale.t('suppliers.recordPayment') }}
                </button>
              }
            </article>
          } @empty {
            <p class="text-sm text-slate-500">{{ locale.t('suppliers.noPayables') }}</p>
          }
        </div>
      </section>

      @if (showSupplier()) {
        <app-modal-overlay panelClass="txn-modal-card max-w-md w-full p-6" (close)="closeSupplierForm()">
          <h2 class="font-display text-lg font-bold">
            {{ editingSupplier() ? locale.t('suppliers.edit') : locale.t('suppliers.add') }}
          </h2>
          <form [formGroup]="supplierForm" (ngSubmit)="saveSupplier()" class="mt-4 space-y-4">
            <div>
              <label class="input-label">{{ locale.t('suppliers.name') }}</label>
              <input class="input-field" formControlName="name" />
            </div>
            <div>
              <label class="input-label">{{ locale.t('suppliers.phone') }}</label>
              <input class="input-field" formControlName="phone" />
            </div>
            <div>
              <label class="input-label">{{ locale.t('suppliers.contactPerson') }}</label>
              <input class="input-field" formControlName="contactPerson" />
            </div>
            <div>
              <label class="input-label">{{ locale.t('suppliers.notes') }}</label>
              <input class="input-field" formControlName="notes" />
            </div>
            <div class="flex gap-2">
              <button type="button" class="btn-secondary flex-1" (click)="closeSupplierForm()">{{ locale.t('common.cancel') }}</button>
              <button type="submit" class="btn-primary flex-1" [disabled]="savingSupplier()">
                {{ savingSupplier() ? locale.t('common.loading') : locale.t('common.save') }}
              </button>
            </div>
          </form>
        </app-modal-overlay>
      }

      @if (showPayable()) {
        <app-modal-overlay panelClass="txn-modal-card max-w-md w-full p-6" (close)="showPayable.set(false)">
          <h2 class="font-display text-lg font-bold">{{ locale.t('suppliers.addPayable') }}</h2>
          <form [formGroup]="payableForm" (ngSubmit)="savePayable()" class="mt-4 space-y-4">
            <div>
              <label class="input-label">{{ locale.t('suppliers.name') }}</label>
              <select class="input-field" formControlName="supplierId">
                @for (s of suppliers(); track s.id) {
                  <option [value]="s.id">{{ s.name }}</option>
                }
              </select>
            </div>
            <div>
              <label class="input-label">{{ locale.t('transactions.amount') }}</label>
              <input class="input-field" type="number" min="0.01" step="0.01" formControlName="totalAmount" />
            </div>
            <div class="flex gap-2">
              <button type="button" class="btn-secondary flex-1" (click)="showPayable.set(false)">{{ locale.t('common.cancel') }}</button>
              <button type="submit" class="btn-primary flex-1">{{ locale.t('common.save') }}</button>
            </div>
          </form>
        </app-modal-overlay>
      }

      @if (paymentTarget()) {
        <app-modal-overlay panelClass="txn-modal-card max-w-md w-full p-6" (close)="paymentTarget.set(null)">
          <h2 class="font-display text-lg font-bold">{{ locale.t('suppliers.recordPayment') }}</h2>
          <p class="text-sm text-slate-500">{{ paymentTarget()!.supplierName }}</p>
          <form [formGroup]="paymentForm" (ngSubmit)="savePayment()" class="mt-4 space-y-4">
            <div>
              <label class="input-label">{{ locale.t('transactions.amount') }}</label>
              <input class="input-field" type="number" min="0.01" step="0.01" formControlName="amount" />
            </div>
            <app-payment-method-select formControlName="paymentMethod" [label]="locale.t('common.paymentMethod')" />
            <div class="flex gap-2">
              <button type="button" class="btn-secondary flex-1" (click)="paymentTarget.set(null)">{{ locale.t('common.cancel') }}</button>
              <button type="submit" class="btn-primary flex-1">{{ locale.t('common.save') }}</button>
            </div>
          </form>
        </app-modal-overlay>
      }
    </div>
  `,
})
export class SuppliersComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly business = inject(BusinessContextService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmDialogService);

  readonly locale = inject(LocaleService);
  readonly planFeatures = inject(PlanFeatureService);

  readonly suppliers = signal<Supplier[]>([]);
  readonly payables = signal<SupplierPayable[]>([]);
  readonly showSupplier = signal(false);
  readonly editingSupplier = signal<Supplier | null>(null);
  readonly savingSupplier = signal(false);
  readonly deletingId = signal<string | null>(null);
  readonly showPayable = signal(false);
  readonly paymentTarget = signal<SupplierPayable | null>(null);

  supplierForm = this.fb.group({ name: ['', Validators.required], phone: [''], contactPerson: [''], notes: [''] });
  payableForm = this.fb.group({ supplierId: ['', Validators.required], totalAmount: ['', Validators.required], description: [''] });
  paymentForm = this.fb.group({ amount: ['', Validators.required], paymentMethod: ['Cash', Validators.required] });

  private businessId = '';

  ngOnInit() {
    this.load();
    this.business.businessChanged$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.load());
  }

  load() {
    this.business.ensureBusinessId().subscribe({
      next: (bid) => {
        this.businessId = bid;
        this.http.get<ApiResponse<Supplier[]>>(`${environment.apiUrl}/businesses/${bid}/suppliers`).subscribe({
          next: (res) => this.suppliers.set(res.data ?? []),
        });
        this.http.get<ApiResponse<SupplierPayable[]>>(`${environment.apiUrl}/businesses/${bid}/suppliers/payables`).subscribe({
          next: (res) => this.payables.set(res.data ?? []),
        });
      },
    });
  }

  openSupplier() {
    this.editingSupplier.set(null);
    this.supplierForm.reset({ name: '', phone: '', contactPerson: '', notes: '' });
    this.showSupplier.set(true);
  }

  openEditSupplier(s: Supplier) {
    this.editingSupplier.set(s);
    this.supplierForm.reset({
      name: s.name,
      phone: s.phone ?? '',
      contactPerson: s.contactPerson ?? '',
      notes: s.notes ?? '',
    });
    this.showSupplier.set(true);
  }

  closeSupplierForm() {
    this.showSupplier.set(false);
    this.editingSupplier.set(null);
  }

  openPayable() {
    const first = this.suppliers()[0]?.id ?? '';
    this.payableForm.reset({ supplierId: first, totalAmount: '', description: '' });
    this.showPayable.set(true);
  }

  openPayment(p: SupplierPayable) {
    this.paymentTarget.set(p);
    this.paymentForm.reset({ amount: String(p.remainingAmount), paymentMethod: 'Cash' });
  }

  saveSupplier() {
    if (this.supplierForm.invalid) return;
    this.savingSupplier.set(true);
    const edit = this.editingSupplier();
    const req = edit
      ? this.http.put<ApiResponse<Supplier>>(
          `${environment.apiUrl}/businesses/${this.businessId}/suppliers/${edit.id}`,
          this.supplierForm.value
        )
      : this.http.post<ApiResponse<Supplier>>(
          `${environment.apiUrl}/businesses/${this.businessId}/suppliers`,
          this.supplierForm.value
        );
    req.subscribe({
      next: () => {
        this.savingSupplier.set(false);
        this.closeSupplierForm();
        this.load();
        this.toast.success(this.locale.t('toast.saved'));
      },
      error: (e) => {
        this.savingSupplier.set(false);
        this.toast.error(apiErrorMessage(e, 'Failed'));
      },
    });
  }

  async removeSupplier(s: Supplier) {
    const ok = await this.confirm.confirm({
      title: this.locale.t('confirm.deleteSupplierTitle'),
      message: this.locale.t('confirm.deleteSupplierMessage'),
      confirmLabel: this.locale.t('common.delete'),
      cancelLabel: this.locale.t('common.cancel'),
      danger: true,
    });
    if (!ok) return;
    this.deletingId.set(s.id);
    this.http.delete(`${environment.apiUrl}/businesses/${this.businessId}/suppliers/${s.id}`).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.load();
        this.toast.success(this.locale.t('toast.saved'));
      },
      error: (e) => {
        this.deletingId.set(null);
        this.toast.error(apiErrorMessage(e, 'Failed'));
      },
    });
  }

  savePayable() {
    if (this.payableForm.invalid) return;
    const v = this.payableForm.getRawValue();
    this.http.post(`${environment.apiUrl}/businesses/${this.businessId}/suppliers/payables`, {
      supplierId: v.supplierId,
      totalAmount: Number(v.totalAmount),
      description: v.description,
    }).subscribe({
      next: () => { this.showPayable.set(false); this.load(); this.toast.success(this.locale.t('toast.saved')); },
      error: (e) => this.toast.error(apiErrorMessage(e, 'Failed')),
    });
  }

  savePayment() {
    const target = this.paymentTarget();
    if (!target || this.paymentForm.invalid) return;
    const v = this.paymentForm.getRawValue();
    this.http.post(`${environment.apiUrl}/businesses/${this.businessId}/suppliers/payables/${target.id}/payments`, {
      amount: Number(v.amount),
      paymentMethod: v.paymentMethod,
    }).subscribe({
      next: () => { this.paymentTarget.set(null); this.load(); this.toast.success(this.locale.t('toast.saved')); },
      error: (e) => this.toast.error(apiErrorMessage(e, 'Failed')),
    });
  }
}
