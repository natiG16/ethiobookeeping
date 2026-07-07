import { DecimalPipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NavigationEnd, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { filter } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { BusinessContextService } from '../../core/services/business-context.service';
import { LocaleService } from '../../core/services/locale.service';
import { PlanFeatureService } from '../../core/services/plan-feature.service';
import { ToastService } from '../../core/services/toast.service';
import { ProductContextService } from '../../core/services/product-context.service';
import { ApiResponse, Product } from '../../core/models/api.models';
import { apiErrorMessage } from '../../core/utils/http-error';
import { ModalOverlayComponent } from '../../shared/modal-overlay.component';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe, ModalOverlayComponent],
  template: `
    <div class="page-shell">
      <header class="page-header !mb-0">
        <div>
          <h1 class="page-title">{{ locale.t('nav.inventory') }}</h1>
          <p class="page-subtitle">{{ locale.t('inventory.subtitle') }}</p>
        </div>
        <button type="button" class="btn-primary" [disabled]="!planFeatures.canWrite()" (click)="openAdd()">
          {{ locale.t('inventory.add') }}
        </button>
      </header>

      @if (lowStock().length) {
        <div class="rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm font-medium text-amber-950">
          {{ locale.t('inventory.lowStockAlert') }}: {{ lowStock().length }}
        </div>
      }

      <div class="data-table-card overflow-x-auto">
        @if (items().length) {
          <table class="data-table">
            <thead>
              <tr>
                <th>{{ locale.t('inventory.product') }}</th>
                <th>{{ locale.t('inventory.available') }}</th>
                <th>{{ locale.t('inventory.sold') }}</th>
                <th>{{ locale.t('inventory.buyPrice') }}</th>
                <th>{{ locale.t('inventory.sellPrice') }}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (p of items(); track p.id) {
                <tr [class.bg-amber-50]="p.lowStock">
                  <td class="font-medium text-slate-900">
                    {{ p.name }}
                    @if (p.lowStock) {
                      <span class="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-800">
                        {{ locale.t('inventory.low') }}
                      </span>
                    }
                  </td>
                  <td>
                    <div class="flex items-center gap-2">
                      <span class="font-semibold tabular-nums text-slate-900">
                        {{ p.quantityOnHand | number: '1.0-3' }} {{ p.unit }}
                      </span>
                      @if (planFeatures.canWrite()) {
                        <button type="button" class="text-xs text-brand-700 hover:underline" (click)="openAdjust(p)">
                          {{ locale.t('inventory.adjust') }}
                        </button>
                      }
                    </div>
                  </td>
                  <td class="tabular-nums text-slate-600">
                    {{ (p.quantitySold ?? 0) | number: '1.0-3' }} {{ p.unit }}
                  </td>
                  <td>{{ p.buyPrice != null ? (p.buyPrice | number: '1.2-2') : '—' }}</td>
                  <td>{{ p.sellPrice != null ? (p.sellPrice | number: '1.2-2') : '—' }}</td>
                  <td class="text-right">
                    <button type="button" class="btn-ghost !px-2 !py-1.5 text-sm" (click)="openEdit(p)">{{ locale.t('common.edit') }}</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        } @else {
          <div class="empty-state !shadow-none !ring-0">
            <div class="empty-state-icon" aria-hidden="true">
              <svg class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <p class="empty-state-title">{{ locale.t('inventory.emptyTitle') }}</p>
            <p class="empty-state-text">{{ locale.t('inventory.empty') }}</p>
            <button type="button" class="btn-primary mt-5" [disabled]="!planFeatures.canWrite()" (click)="openAdd()">
              {{ locale.t('inventory.add') }}
            </button>
          </div>
        }
      </div>

      @if (adjusting()) {
        <app-modal-overlay panelClass="txn-modal-card max-w-sm w-full p-6" (close)="closeAdjust()">
          <h2 class="font-display text-lg font-bold">{{ locale.t('inventory.adjustStock') }}</h2>
          <p class="mt-1 text-sm text-slate-500">{{ adjusting()!.name }} — {{ adjusting()!.quantityOnHand | number: '1.0-3' }} {{ adjusting()!.unit }}</p>
          <form [formGroup]="adjustForm" (ngSubmit)="submitAdjust()" class="mt-4 space-y-4">
            <div>
              <label class="input-label">{{ locale.t('inventory.adjustDelta') }}</label>
              <input class="input-field" type="number" step="0.001" formControlName="delta" />
              <p class="mt-1 text-xs text-slate-500">{{ locale.t('inventory.adjustHint') }}</p>
            </div>
            <div class="flex gap-2">
              <button type="button" class="btn-secondary flex-1" (click)="closeAdjust()">{{ locale.t('common.cancel') }}</button>
              <button type="submit" class="btn-primary flex-1" [disabled]="adjustingSaving()">{{ locale.t('common.save') }}</button>
            </div>
          </form>
        </app-modal-overlay>
      }

      @if (showForm()) {
        <app-modal-overlay panelClass="txn-modal-card max-w-md w-full p-6" (close)="closeForm()">
          <h2 class="font-display text-lg font-bold">
            {{ editing() ? locale.t('common.edit') : locale.t('inventory.add') }}
          </h2>
          <form [formGroup]="form" (ngSubmit)="save()" class="mt-4 space-y-4">
            <div>
              <label class="input-label">{{ locale.t('inventory.product') }}</label>
              <input class="input-field" formControlName="name" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="input-label">{{ locale.t('inventory.quantity') }}</label>
                <input class="input-field" type="number" min="0" step="0.001" formControlName="quantityOnHand" />
              </div>
              <div>
                <label class="input-label">{{ locale.t('inventory.lowStockAt') }}</label>
                <input class="input-field" type="number" min="0" step="0.001" formControlName="lowStockThreshold" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="input-label">{{ locale.t('inventory.buyPrice') }}</label>
                <input class="input-field" type="number" min="0" step="0.01" formControlName="buyPrice" />
              </div>
              <div>
                <label class="input-label">{{ locale.t('inventory.sellPrice') }}</label>
                <input class="input-field" type="number" min="0" step="0.01" formControlName="sellPrice" />
              </div>
            </div>
            <div class="flex gap-2">
              <button type="button" class="btn-secondary flex-1" (click)="closeForm()">{{ locale.t('common.cancel') }}</button>
              <button type="submit" class="btn-primary flex-1" [disabled]="saving()">{{ locale.t('common.save') }}</button>
            </div>
          </form>
        </app-modal-overlay>
      }
    </div>
  `,
})
export class InventoryComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly business = inject(BusinessContextService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  private readonly productContext = inject(ProductContextService);

  readonly locale = inject(LocaleService);
  readonly planFeatures = inject(PlanFeatureService);

  readonly items = signal<Product[]>([]);
  readonly lowStock = signal<Product[]>([]);
  readonly showForm = signal(false);
  readonly editing = signal<Product | null>(null);
  readonly saving = signal(false);
  readonly adjusting = signal<Product | null>(null);
  readonly adjustingSaving = signal(false);

  form = this.fb.group({
    name: ['', Validators.required],
    quantityOnHand: [0, Validators.required],
    buyPrice: [null as number | null],
    sellPrice: [null as number | null],
    lowStockThreshold: [null as number | null],
    unit: ['pcs'],
  });

  adjustForm = this.fb.group({
    delta: [0, Validators.required],
  });

  private businessId = '';

  ngOnInit() {
    this.load();
    this.business.businessChanged$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.load());
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        filter((e) => e.urlAfterRedirects.includes('/inventory')),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.load());
  }

  load() {
    this.business.ensureBusinessId().subscribe({
      next: (bid) => {
        this.businessId = bid;
        this.productContext.loadForBusiness(bid);
        this.http.get<ApiResponse<Product[]>>(`${environment.apiUrl}/businesses/${bid}/products`).subscribe({
          next: (res) => this.items.set(res.data ?? []),
        });
        this.http.get<ApiResponse<Product[]>>(`${environment.apiUrl}/businesses/${bid}/products/low-stock`).subscribe({
          next: (res) => this.lowStock.set(res.data ?? []),
        });
      },
    });
  }

  openAdd() {
    this.editing.set(null);
    this.form.reset({ name: '', quantityOnHand: 0, buyPrice: null, sellPrice: null, lowStockThreshold: null, unit: 'pcs' });
    this.showForm.set(true);
  }

  openEdit(p: Product) {
    this.editing.set(p);
    this.form.reset({
      name: p.name,
      quantityOnHand: p.quantityOnHand,
      buyPrice: p.buyPrice ?? null,
      sellPrice: p.sellPrice ?? null,
      lowStockThreshold: p.lowStockThreshold ?? null,
      unit: p.unit,
    });
    this.showForm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
    this.editing.set(null);
  }

  openAdjust(p: Product) {
    this.adjusting.set(p);
    this.adjustForm.reset({ delta: 0 });
  }

  closeAdjust() {
    this.adjusting.set(null);
  }

  submitAdjust() {
    const p = this.adjusting();
    if (!p || this.adjustForm.invalid) return;
    const delta = Number(this.adjustForm.getRawValue().delta);
    if (!Number.isFinite(delta) || delta === 0) {
      this.toast.error(this.locale.t('inventory.adjustInvalid'));
      return;
    }
    this.adjustingSaving.set(true);
    this.http
      .post(`${environment.apiUrl}/businesses/${this.businessId}/products/${p.id}/adjust`, { delta })
      .subscribe({
        next: () => {
          this.adjustingSaving.set(false);
          this.closeAdjust();
          this.productContext.loadForBusiness(this.businessId);
          this.load();
          this.toast.success(this.locale.t('toast.saved'));
        },
        error: (e) => {
          this.adjustingSaving.set(false);
          this.toast.error(apiErrorMessage(e, 'Failed'));
        },
      });
  }

  save() {
    if (this.form.invalid) return;
    this.saving.set(true);
    const v = this.form.getRawValue();
    const body = {
      name: v.name,
      quantityOnHand: Number(v.quantityOnHand),
      buyPrice: v.buyPrice != null ? Number(v.buyPrice) : null,
      sellPrice: v.sellPrice != null ? Number(v.sellPrice) : null,
      lowStockThreshold: v.lowStockThreshold != null ? Number(v.lowStockThreshold) : null,
      unit: v.unit,
    };
    const edit = this.editing();
    const req = edit
      ? this.http.put(`${environment.apiUrl}/businesses/${this.businessId}/products/${edit.id}`, body)
      : this.http.post(`${environment.apiUrl}/businesses/${this.businessId}/products`, body);
    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeForm();
        this.productContext.loadForBusiness(this.businessId);
        this.load();
        this.toast.success(this.locale.t('toast.saved'));
      },
      error: (e) => {
        this.saving.set(false);
        this.toast.error(apiErrorMessage(e, 'Failed'));
      },
    });
  }
}
