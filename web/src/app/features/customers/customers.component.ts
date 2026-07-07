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
import { ApiResponse, Customer, CustomerHistory } from '../../core/models/api.models';
import { apiErrorMessage } from '../../core/utils/http-error';
import { LocaleDatePipe } from '../../shared/locale-date.pipe';
import { ModalOverlayComponent } from '../../shared/modal-overlay.component';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe, LocaleDatePipe, ModalOverlayComponent],
  template: `
    <div class="space-y-6">
      <header class="page-header">
        <div>
          <h1 class="page-title">{{ locale.t('nav.customers') }}</h1>
          <p class="page-subtitle">{{ locale.t('customers.subtitle') }}</p>
        </div>
        <button type="button" class="btn-primary" [disabled]="!planFeatures.canWrite()" (click)="openAdd()">
          {{ locale.t('customers.add') }}
        </button>
      </header>

      @if (loading()) {
        <div class="card p-8 text-center text-slate-500">{{ locale.t('common.loading') }}</div>
      } @else if (!items().length) {
        <div class="card p-8 text-center text-slate-500">{{ locale.t('customers.empty') }}</div>
      } @else {
        <div class="grid gap-4 sm:grid-cols-2">
          @for (c of items(); track c.id) {
            <article class="card p-5">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <h2 class="font-semibold text-slate-900">{{ c.name }}</h2>
                  @if (c.phone) {
                    <p class="text-sm text-slate-500">{{ c.phone }}</p>
                  }
                </div>
                <span class="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-800">
                  {{ c.amountOwed | number: '1.2-2' }} ETB
                </span>
              </div>
              <p class="mt-2 text-xs text-slate-500">
                {{ c.activeDebtCount }} {{ locale.t('customers.activeDebts') }}
              </p>
              <button type="button" class="btn-secondary mt-4 w-full text-sm" (click)="openHistory(c.id)">
                {{ locale.t('customers.paymentHistory') }}
              </button>
            </article>
          }
        </div>
      }

      @if (showForm()) {
        <app-modal-overlay panelClass="txn-modal-card max-w-md w-full p-6" (close)="showForm.set(false)">
          <h2 class="font-display text-lg font-bold">{{ locale.t('customers.add') }}</h2>
          <form [formGroup]="form" (ngSubmit)="save()" class="mt-4 space-y-4">
            <div>
              <label class="input-label">{{ locale.t('customers.name') }}</label>
              <input class="input-field" formControlName="name" />
            </div>
            <div>
              <label class="input-label">{{ locale.t('customers.phone') }}</label>
              <input class="input-field" formControlName="phone" />
            </div>
            <div class="flex gap-2">
              <button type="button" class="btn-secondary flex-1" (click)="showForm.set(false)">
                {{ locale.t('common.cancel') }}
              </button>
              <button type="submit" class="btn-primary flex-1" [disabled]="saving()">
                {{ locale.t('common.save') }}
              </button>
            </div>
          </form>
        </app-modal-overlay>
      }

      @if (history()) {
        <app-modal-overlay panelClass="txn-modal-card max-w-lg w-full max-h-[90dvh] overflow-y-auto p-6" (close)="history.set(null)">
          <h2 class="font-display text-lg font-bold">{{ history()!.name }}</h2>
          <p class="text-sm text-slate-500">
            {{ locale.t('customers.amountOwed') }}: {{ history()!.totalOwed | number: '1.2-2' }} ETB
          </p>
          <h3 class="mt-4 text-sm font-semibold text-slate-700">{{ locale.t('customers.debts') }}</h3>
          <ul class="mt-2 space-y-2 text-sm">
            @for (d of history()!.debts; track d.id) {
              <li class="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                {{ d.totalAmount | number: '1.2-2' }} ETB — {{ locale.t('debts.remaining') }}
                {{ d.remainingAmount | number: '1.2-2' }}
                @if (d.dueDate) {
                  <span class="text-slate-500"> · {{ d.dueDate | localeDate }}</span>
                }
              </li>
            }
          </ul>
          <h3 class="mt-4 text-sm font-semibold text-slate-700">{{ locale.t('customers.paymentHistory') }}</h3>
          <ul class="mt-2 space-y-2 text-sm">
            @for (r of history()!.repayments; track r.id) {
              <li class="rounded-lg border border-emerald-100 bg-emerald-50/50 px-3 py-2">
                +{{ r.amount | number: '1.2-2' }} ETB · {{ r.repaymentDate | localeDate }}
                @if (r.paymentMethod) {
                  <span class="text-slate-500"> · {{ r.paymentMethod }}</span>
                }
              </li>
            } @empty {
              <li class="text-slate-500">{{ locale.t('customers.noPayments') }}</li>
            }
          </ul>
        </app-modal-overlay>
      }
    </div>
  `,
})
export class CustomersComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly business = inject(BusinessContextService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  readonly locale = inject(LocaleService);
  readonly planFeatures = inject(PlanFeatureService);

  readonly items = signal<Customer[]>([]);
  readonly history = signal<CustomerHistory | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly showForm = signal(false);

  form = this.fb.group({
    name: ['', Validators.required],
    phone: [''],
    notes: [''],
  });

  private businessId = '';

  ngOnInit() {
    this.load();
    this.business.businessChanged$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.load());
  }

  openAdd() {
    this.form.reset({ name: '', phone: '', notes: '' });
    this.showForm.set(true);
  }

  load() {
    this.loading.set(true);
    this.business.ensureBusinessId().subscribe({
      next: (bid) => {
        this.businessId = bid;
        this.http.get<ApiResponse<Customer[]>>(`${environment.apiUrl}/businesses/${bid}/customers`).subscribe({
          next: (res) => {
            this.items.set(res.data ?? []);
            this.loading.set(false);
          },
          error: () => this.loading.set(false),
        });
      },
      error: () => this.loading.set(false),
    });
  }

  save() {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.http
      .post<ApiResponse<Customer>>(`${environment.apiUrl}/businesses/${this.businessId}/customers`, this.form.value)
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.showForm.set(false);
          this.load();
          this.toast.success(this.locale.t('toast.saved'));
        },
        error: (e) => {
          this.saving.set(false);
          this.toast.error(apiErrorMessage(e, 'Failed'));
        },
      });
  }

  openHistory(id: string) {
    this.http
      .get<ApiResponse<CustomerHistory>>(`${environment.apiUrl}/businesses/${this.businessId}/customers/${id}/history`)
      .subscribe({
        next: (res) => this.history.set(res.data ?? null),
        error: (e) => this.toast.error(apiErrorMessage(e, 'Failed')),
      });
  }
}
