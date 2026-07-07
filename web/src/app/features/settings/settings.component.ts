import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { BusinessContextService } from '../../core/services/business-context.service';
import { LocaleService } from '../../core/services/locale.service';
import { CalendarPreferenceService } from '../../core/services/calendar-preference.service';
import { PlanFeatureService } from '../../core/services/plan-feature.service';
import { UpgradePlanModalService } from '../../core/services/upgrade-plan-modal.service';
import { ConfirmDialogService } from '../../core/services/confirm-dialog.service';
import { ApiResponse, Business, Category, User } from '../../core/models/api.models';
import { CategoryContextService } from '../../core/services/category-context.service';
import { ToastService } from '../../core/services/toast.service';
import {
  BusinessPaymentMethod,
  PaymentMethodContextService,
} from '../../core/services/payment-method-context.service';
import { PaymentMethodLogoComponent } from '../../shared/payment-method-logo.component';
import { ProfileAvatarComponent } from '../../shared/profile-avatar.component';
import { environment } from '../../../environments/environment';
import { apiErrorMessage } from '../../core/utils/http-error';
import { validateImageFile } from '../../core/utils/upload-image';
import { isBuiltInPaymentMethod, paymentMethodInitial } from '../../shared/payment-methods';
import { mediaUrl } from '../../core/utils/media-url';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, PaymentMethodLogoComponent, ProfileAvatarComponent],
  template: `
    <div class="space-y-6">
      <header class="page-header">
        <div>
          <h1 class="page-title">{{ locale.t('nav.settings') }}</h1>
          <p class="page-subtitle">Account & preferences</p>
        </div>
      </header>

      <div class="card overflow-hidden p-0">
        <div class="h-24 bg-gradient-to-r from-brand-600 via-brand-700 to-brand-900"></div>
        <div class="relative px-6 pb-6">
          <div class="absolute -top-10">
            <app-profile-avatar
              [pictureUrl]="auth.user()?.profilePictureUrl"
              [name]="auth.user()?.fullName || '?'"
              [cacheBust]="auth.avatarCacheBust()"
              imgClass="h-20 w-20 rounded-2xl border-4 border-white object-cover shadow-lg"
              fallbackClass="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-br from-brand-400 to-brand-700 text-2xl font-bold text-white shadow-lg"
            />
          </div>
          <div class="pt-12">
            <p class="text-xl font-bold">{{ auth.user()?.fullName }}</p>
            <p class="text-sm text-slate-500">{{ auth.user()?.email }}</p>
            <div class="mt-4">
              <p class="input-label">{{ locale.t('settings.profilePhoto') }}</p>
              <p class="mt-1 text-xs text-slate-500">{{ locale.t('settings.profilePhotoHint') }}</p>
              <label class="btn-secondary mt-2 inline-flex cursor-pointer text-sm">
                <input
                  type="file"
                  class="sr-only"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  (change)="onAvatarSelected($event)"
                  [disabled]="uploadingAvatar()"
                />
                {{ uploadingAvatar() ? locale.t('settings.uploading') : locale.t('settings.changePhoto') }}
              </label>
              @if (avatarError()) {
                <p class="mt-1 text-xs text-red-600">{{ avatarError() }}</p>
              }
            </div>
          </div>
        </div>
      </div>

      @if (businesses().length) {
        <div class="card p-6 space-y-4">
          <h2 class="text-xs font-bold uppercase tracking-widest text-slate-400">{{ locale.t('settings.businesses') }}</h2>

          @if (activeBusiness(); as biz) {
            <div class="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
              @if (businessLogoSrc()) {
                <img [src]="businessLogoSrc()!" alt="" class="h-14 w-14 shrink-0 rounded-xl border border-white object-cover shadow-sm" />
              } @else {
                <div
                  class="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-white bg-brand-100 text-lg font-bold text-brand-800 shadow-sm"
                >
                  {{ biz.name.slice(0, 1).toUpperCase() }}
                </div>
              }
              <div class="min-w-0 flex-1">
                <p class="font-semibold text-slate-900">{{ biz.name }}</p>
                <label class="btn-secondary mt-2 inline-flex cursor-pointer text-xs">
                  <input
                    type="file"
                    class="sr-only"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    (change)="onLogoSelected($event, biz.id)"
                    [disabled]="uploadingLogo()"
                  />
                  {{ uploadingLogo() ? locale.t('settings.uploading') : locale.t('settings.businessLogo') }}
                </label>
                @if (logoError()) {
                  <p class="mt-1 text-xs text-red-600">{{ logoError() }}</p>
                }
              </div>
            </div>
          }

          <p class="input-label">{{ locale.t('settings.switchBusiness') }}</p>
          <div class="space-y-2">
            @for (b of businesses(); track b.id) {
              <button
                type="button"
                class="biz-switcher-option w-full rounded-xl border border-slate-100"
                [class.biz-switcher-option-active]="b.id === auth.businessId()"
                (click)="switchBusiness(b.id)"
              >
                @if (logoFor(b); as src) {
                  <img [src]="src" alt="" class="biz-switcher-option-logo" />
                } @else {
                  <span class="biz-switcher-option-fallback">{{ b.name.slice(0, 1).toUpperCase() }}</span>
                }
                <span class="min-w-0 flex-1 truncate text-left font-medium">{{ b.name }}</span>
                @if (b.id === auth.businessId()) {
                  <svg class="h-5 w-5 shrink-0 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                }
              </button>
            }
          </div>
          <p class="text-xs text-slate-500">
            {{ businessLimitText() }}
          </p>
          @if (showAddBusiness()) {
            @if (!addOpen()) {
              <button type="button" class="btn-secondary w-full text-sm" (click)="addOpen.set(true)">
                + {{ locale.t('settings.addBusiness') }}
              </button>
            } @else {
              <form [formGroup]="addForm" (ngSubmit)="createBusiness()" class="space-y-3 border-t border-slate-100 pt-4">
                <input class="input-field" [placeholder]="locale.t('auth.businessName')" formControlName="name" />
                @if (businessError()) {
                  <div class="alert-error text-xs">{{ businessError() }}</div>
                }
                <div class="flex gap-2">
                  <button type="submit" class="btn-primary flex-1 text-sm" [disabled]="savingBusiness()">
                    {{ savingBusiness() ? locale.t('common.loading') : locale.t('common.save') }}
                  </button>
                  <button type="button" class="btn-secondary text-sm" (click)="addOpen.set(false)">{{ locale.t('common.cancel') }}</button>
                </div>
              </form>
            }
          } @else if (!planFeatures.canAddBusiness(businesses().length)) {
            <button type="button" class="link-brand text-sm font-semibold" (click)="upgradeModal.show()">
              {{ locale.t('feature.upgrade') }}
            </button>
          }

          @if (activeBusiness(); as biz) {
            @if (businesses().length > 1) {
              <div class="border-t border-slate-100 pt-4">
                <p class="text-xs text-slate-500">{{ locale.t('settings.deleteBusinessHint') }}</p>
                <button
                  type="button"
                  class="mt-2 w-full rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 sm:w-auto"
                  [disabled]="deletingBusiness()"
                  (click)="confirmDeleteBusiness(biz)"
                >
                  {{ deletingBusiness() ? locale.t('common.loading') : locale.t('settings.deleteBusiness') }}
                </button>
              </div>
            }
          }
        </div>
      }

      @if (activeBusiness(); as biz) {
        <form class="card space-y-4 p-6" [formGroup]="profileForm" (ngSubmit)="saveProfile()">
          <h2 class="text-xs font-bold uppercase tracking-widest text-slate-400">{{ locale.t('settings.businessProfile') }}</h2>
          <div>
            <label class="input-label" for="biz-name">{{ locale.t('auth.businessName') }}</label>
            <input id="biz-name" class="input-field" formControlName="name" />
          </div>
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="input-label" for="biz-type">{{ locale.t('settings.businessType') }}</label>
              <input id="biz-type" class="input-field" formControlName="businessType" placeholder="Retail, Services…" />
            </div>
            <div>
              <label class="input-label" for="biz-tin">{{ locale.t('settings.tin') }}</label>
              <input id="biz-tin" class="input-field" formControlName="tinNumber" />
            </div>
          </div>
          <div>
            <label class="input-label" for="biz-address">{{ locale.t('settings.address') }}</label>
            <input id="biz-address" class="input-field" formControlName="address" />
          </div>
          <div>
            <label class="input-label" for="biz-city">{{ locale.t('settings.city') }}</label>
            <input id="biz-city" class="input-field" formControlName="city" />
          </div>
          @if (profileError()) {
            <div class="alert-error text-xs">{{ profileError() }}</div>
          }
          <button type="submit" class="btn-primary w-full sm:w-auto" [disabled]="savingProfile()">
            {{ savingProfile() ? locale.t('common.loading') : locale.t('common.save') }}
          </button>
        </form>

        <div class="card space-y-5 p-6">
          <div>
            <h2 class="text-xs font-bold uppercase tracking-widest text-slate-400">{{ locale.t('settings.paymentMethods') }}</h2>
            <p class="mt-1 text-sm text-slate-600">{{ locale.t('settings.paymentMethodsHint') }}</p>
          </div>

          <section class="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
            <h3 class="text-xs font-bold uppercase tracking-wide text-slate-500">{{ locale.t('settings.paymentMethodsDefault') }}</h3>
            <ul class="mt-3 space-y-2">
              @for (m of defaultPaymentMethods(); track m.id) {
                <li class="flex items-center gap-3 rounded-lg bg-white px-3 py-2.5 shadow-sm ring-1 ring-slate-100">
                  <app-payment-method-logo [methodId]="m.name" [logoUrl]="m.logoUrl" [alt]="m.name" size="md" />
                  <span class="font-medium text-slate-800">{{ m.name }}</span>
                  <span class="ml-auto text-[10px] font-semibold uppercase text-slate-400">{{ locale.t('settings.paymentBuiltIn') }}</span>
                </li>
              }
            </ul>
          </section>

          <section>
            <div class="flex flex-wrap items-center justify-between gap-2">
              <h3 class="text-xs font-bold uppercase tracking-wide text-slate-500">{{ locale.t('settings.paymentMethodsCustom') }}</h3>
              <button type="button" class="btn-secondary text-sm" (click)="openAddPaymentMethod()">
                + {{ locale.t('settings.addPaymentMethod') }}
              </button>
            </div>

            @if (paymentMethodOpen()) {
              <form [formGroup]="paymentMethodForm" (ngSubmit)="addPaymentMethod()" class="mt-3 space-y-4 rounded-xl border border-brand-200 bg-brand-50/30 p-4">
                <div>
                  <label class="input-label" for="pm-name">{{ locale.t('settings.paymentMethodName') }}</label>
                  <input id="pm-name" class="input-field mt-1" [placeholder]="locale.t('settings.paymentMethodNameExample')" formControlName="name" />
                </div>
                <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div class="payment-method-preview">
                    @if (paymentMethodLogoPreview()) {
                      <img [src]="paymentMethodLogoPreview()!" alt="" class="h-14 w-14 rounded-xl border-2 border-white object-cover shadow-sm" />
                    } @else {
                      <span class="payment-method-preview-letter">{{ paymentMethodPreviewInitial() }}</span>
                    }
                  </div>
                  <div class="min-w-0 flex-1 text-sm text-slate-600">
                    <p class="font-medium text-slate-800">{{ locale.t('settings.paymentMethodLogoHintShort') }}</p>
                    <label class="btn-secondary mt-2 inline-flex cursor-pointer text-xs">
                      <input type="file" class="sr-only" accept="image/jpeg,image/png,image/webp,image/gif" (change)="onPaymentMethodLogoSelected($event)" />
                      {{ locale.t('settings.paymentMethodLogoOptional') }}
                    </label>
                  </div>
                </div>
                <div class="flex gap-2">
                  <button type="submit" class="btn-primary text-sm" [disabled]="savingPaymentMethod()">
                    {{ savingPaymentMethod() ? locale.t('common.loading') : locale.t('settings.addPaymentMethod') }}
                  </button>
                  <button type="button" class="btn-ghost text-sm" (click)="closeAddPaymentMethod()">{{ locale.t('common.cancel') }}</button>
                </div>
              </form>
            }

            @if (customPaymentMethods().length === 0 && !paymentMethodOpen()) {
              <p class="mt-3 text-sm text-slate-500">{{ locale.t('settings.paymentMethodsCustomEmpty') }}</p>
            } @else {
              <ul class="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-100 bg-white">
                @for (m of customPaymentMethods(); track m.id) {
                  <li class="flex flex-wrap items-center justify-between gap-3 px-3 py-3 text-sm">
                    <div class="flex min-w-0 items-center gap-3">
                      <app-payment-method-logo [methodId]="m.name" [logoUrl]="m.logoUrl" [alt]="m.name" size="md" />
                      <span class="truncate font-medium text-slate-800">{{ m.name }}</span>
                    </div>
                    <div class="flex shrink-0 items-center gap-2">
                      <label class="cursor-pointer text-xs font-semibold text-brand-700">
                        <input type="file" class="sr-only" accept="image/jpeg,image/png,image/webp,image/gif" (change)="onPaymentMethodLogoUpdate($event, m.id)" />
                        {{ locale.t('settings.paymentMethodChangeLogo') }}
                      </label>
                      <button type="button" class="text-xs font-semibold text-red-600" (click)="confirmDeletePaymentMethod(m.id, m.name)">
                        {{ locale.t('common.delete') }}
                      </button>
                    </div>
                  </li>
                }
              </ul>
            }
          </section>
        </div>

        <div class="card space-y-5 p-6">
          <div>
            <h2 class="text-xs font-bold uppercase tracking-widest text-slate-400">{{ locale.t('settings.categories') }}</h2>
            <p class="mt-1 text-sm text-slate-600">{{ locale.t('settings.categoriesHint') }}</p>
          </div>

          <section class="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
            <h3 class="text-xs font-bold uppercase tracking-wide text-slate-500">{{ locale.t('settings.categoriesDefault') }}</h3>
            <ul class="mt-3 space-y-2">
              @for (c of defaultCategories(); track c.id) {
                <li class="flex items-center gap-3 rounded-lg bg-white px-3 py-2.5 shadow-sm ring-1 ring-slate-100">
                  <span class="h-2.5 w-2.5 shrink-0 rounded-full" [style.background-color]="c.color || '#94a3b8'"></span>
                  <span class="font-medium text-slate-800">{{ c.name }}</span>
                </li>
              }
            </ul>
          </section>

          <section>
            <div class="flex flex-wrap items-center justify-between gap-2">
              <h3 class="text-xs font-bold uppercase tracking-wide text-slate-500">{{ locale.t('settings.categoriesCustom') }}</h3>
              <button type="button" class="btn-secondary text-sm" (click)="openAddCategory()">
                + {{ locale.t('settings.addCategory') }}
              </button>
            </div>

            @if (categoryOpen()) {
              <form [formGroup]="categoryForm" (ngSubmit)="addCategory()" class="mt-3 space-y-4 rounded-xl border border-brand-200 bg-brand-50/30 p-4">
                <div>
                  <label class="input-label" for="cat-name">{{ locale.t('settings.categoryName') }}</label>
                  <input id="cat-name" class="input-field mt-1" formControlName="name" />
                </div>
                <div class="flex gap-2">
                  <button type="submit" class="btn-primary text-sm" [disabled]="savingCategory()">
                    {{ savingCategory() ? locale.t('common.loading') : locale.t('settings.addCategory') }}
                  </button>
                  <button type="button" class="btn-ghost text-sm" (click)="closeAddCategory()">{{ locale.t('common.cancel') }}</button>
                </div>
              </form>
            }

            @if (customCategories().length === 0 && !categoryOpen()) {
              <p class="mt-3 text-sm text-slate-500">{{ locale.t('settings.categoriesCustomEmpty') }}</p>
            } @else if (customCategories().length) {
              <ul class="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-100 bg-white">
                @for (c of customCategories(); track c.id) {
                  <li class="flex flex-wrap items-center justify-between gap-3 px-3 py-3 text-sm">
                    <div class="flex min-w-0 items-center gap-3">
                      <span class="h-2.5 w-2.5 shrink-0 rounded-full" [style.background-color]="c.color || '#94a3b8'"></span>
                      <span class="truncate font-medium text-slate-800">{{ c.name }}</span>
                    </div>
                    <button type="button" class="text-xs font-semibold text-red-600" (click)="confirmDeleteCategory(c)">
                      {{ locale.t('common.delete') }}
                    </button>
                  </li>
                }
              </ul>
            }
          </section>
        </div>
      }

      <div class="card p-6">
        <h2 class="text-xs font-bold uppercase tracking-widest text-slate-400">{{ locale.t('settings.language') }}</h2>
        <div class="mt-4 grid grid-cols-2 gap-3">
          <button type="button" [class]="locale.locale() === 'en' ? 'lang-pill-active' : 'lang-pill-inactive'" (click)="setLanguage('en')">English</button>
          <button type="button" [class]="locale.locale() === 'am' ? 'lang-pill-active' : 'lang-pill-inactive'" (click)="setLanguage('am')">አማርኛ</button>
        </div>
      </div>

      <div class="card p-6">
        <h2 class="text-xs font-bold uppercase tracking-widest text-slate-400">{{ locale.t('settings.calendar') }}</h2>
        <p class="mt-2 text-sm text-slate-600">{{ locale.t('settings.calendarHint') }}</p>
        <div class="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            [class]="calendar.calendarSystem() === 'ethiopian' ? 'lang-pill-active' : 'lang-pill-inactive'"
            (click)="setCalendar('ethiopian')"
          >
            {{ locale.t('settings.calendarEthiopian') }}
          </button>
          <button
            type="button"
            [class]="calendar.calendarSystem() === 'gregorian' ? 'lang-pill-active' : 'lang-pill-inactive'"
            (click)="setCalendar('gregorian')"
          >
            {{ locale.t('settings.calendarGregorian') }}
          </button>
        </div>
      </div>

      <button type="button" class="btn-secondary w-full !border-red-200 !text-red-600 hover:!bg-red-50" (click)="auth.logout()">
        {{ locale.t('auth.logout') }}
      </button>
    </div>
  `,
})
export class SettingsComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  readonly auth = inject(AuthService);
  private readonly businessContext = inject(BusinessContextService);
  readonly locale = inject(LocaleService);
  readonly calendar = inject(CalendarPreferenceService);
  readonly planFeatures = inject(PlanFeatureService);
  readonly upgradeModal = inject(UpgradePlanModalService);
  private readonly toast = inject(ToastService);
  private readonly paymentMethodContext = inject(PaymentMethodContextService);
  private readonly categoryContext = inject(CategoryContextService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly businesses = signal<Business[]>([]);
  readonly paymentMethods = signal<BusinessPaymentMethod[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly paymentMethodOpen = signal(false);
  readonly categoryOpen = signal(false);
  readonly savingCategory = signal(false);
  readonly savingProfile = signal(false);
  readonly savingPaymentMethod = signal(false);
  readonly profileError = signal('');
  readonly defaultPaymentMethods = computed(() =>
    this.paymentMethods().filter((m) => isBuiltInPaymentMethod(m.name))
  );
  readonly customPaymentMethods = computed(() =>
    this.paymentMethods().filter((m) => !isBuiltInPaymentMethod(m.name))
  );
  readonly defaultCategories = computed(() => this.categories().filter((c) => c.isDefault));
  readonly customCategories = computed(() => this.categories().filter((c) => !c.isDefault));
  readonly addOpen = signal(false);
  readonly savingBusiness = signal(false);
  readonly deletingBusiness = signal(false);
  readonly businessError = signal('');
  readonly uploadingAvatar = signal(false);
  readonly uploadingLogo = signal(false);
  readonly avatarError = signal('');
  readonly logoError = signal('');
  readonly paymentMethodLogoPreview = signal<string | null>(null);
  private paymentMethodLogoFile: File | null = null;

  addForm = this.fb.group({
    name: ['', Validators.required],
  });

  profileForm = this.fb.group({
    name: ['', Validators.required],
    businessType: [''],
    tinNumber: [''],
    address: [''],
    city: [''],
  });

  paymentMethodForm = this.fb.group({
    name: ['', Validators.required],
  });

  categoryForm = this.fb.group({
    name: ['', Validators.required],
  });

  ngOnInit() {
    this.loadBusinesses();
    this.calendar.applyFromUser(this.auth.user());
    this.auth.refreshAccountStatus().subscribe();
  }

  paymentMethodPreviewInitial(): string {
    const name = this.paymentMethodForm.get('name')?.value as string;
    return paymentMethodInitial(name);
  }

  onPaymentMethodLogoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const err = validateImageFile(file);
    if (err) {
      this.toast.error(err);
      input.value = '';
      return;
    }
    this.paymentMethodLogoFile = file;
    const reader = new FileReader();
    reader.onload = () => this.paymentMethodLogoPreview.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  setLanguage(loc: 'en' | 'am') {
    this.locale.setLocale(loc);
    this.http.patch<ApiResponse<User>>(`${environment.apiUrl}/users/me`, { locale: loc }).subscribe({
      next: (res) => {
        this.auth.user.set(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
      },
    });
  }

  setCalendar(system: 'ethiopian' | 'gregorian') {
    this.calendar.setCalendarSystem(system);
  }

  activeBusiness(): Business | undefined {
    const id = this.auth.businessId();
    return this.businesses().find((b) => b.id === id);
  }

  businessLogoSrc(): string | null {
    return mediaUrl(this.activeBusiness()?.logoUrl);
  }

  logoFor(b: Business): string | null {
    return mediaUrl(b.logoUrl);
  }

  onAvatarSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.uploadingAvatar.set(true);
    this.avatarError.set('');
    const body = new FormData();
    body.append('file', file);
    this.http.post<ApiResponse<User>>(`${environment.apiUrl}/users/me/avatar`, body).subscribe({
      next: (res) => {
        const u = res.data;
        this.auth.user.set(u);
        localStorage.setItem('user', JSON.stringify(u));
        this.auth.avatarCacheBust.set(Date.now());
        this.uploadingAvatar.set(false);
        input.value = '';
      },
      error: (e) => {
        this.avatarError.set(apiErrorMessage(e, 'Upload failed'));
        this.uploadingAvatar.set(false);
        input.value = '';
      },
    });
  }

  onLogoSelected(event: Event, businessId: string) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const validationError = validateImageFile(file);
    if (validationError) {
      this.logoError.set(validationError);
      input.value = '';
      return;
    }
    this.uploadingLogo.set(true);
    this.logoError.set('');
    const body = new FormData();
    body.append('file', file);
    this.http
      .post<ApiResponse<Business>>(`${environment.apiUrl}/businesses/${businessId}/logo`, body)
      .subscribe({
        next: (res) => {
          const updated = res.data;
          this.businesses.update((list) => list.map((b) => (b.id === updated.id ? updated : b)));
          if (this.auth.businessId() === updated.id) {
            this.auth.syncBusinessFromApi(updated);
          }
          this.uploadingLogo.set(false);
          input.value = '';
        },
        error: (e) => {
          this.logoError.set(apiErrorMessage(e, 'Upload failed'));
          this.uploadingLogo.set(false);
          input.value = '';
        },
      });
  }

  showAddBusiness(): boolean {
    return this.planFeatures.canAddBusiness(this.businesses().length);
  }

  loadBusinesses() {
    this.http.get<ApiResponse<Business[]>>(`${environment.apiUrl}/businesses`).subscribe({
      next: (res) => {
        const list = res.data ?? [];
        this.businesses.set(list);
        const active = list.find((b) => b.id === this.auth.businessId());
        if (active) {
          if (active.logoUrl) {
            this.auth.syncBusinessFromApi(active);
          }
          this.patchProfileForm(active);
          this.loadPaymentMethods(active.id);
          this.loadCategories(active.id);
        }
      },
      error: () => this.businesses.set([]),
    });
  }

  loadCategories(businessId: string) {
    this.http
      .get<ApiResponse<Category[]>>(`${environment.apiUrl}/businesses/${businessId}/categories`)
      .subscribe({
        next: (res) => {
          this.categories.set(res.data ?? []);
          this.categoryContext.invalidate();
          this.categoryContext.loadForBusiness(businessId);
        },
        error: () => this.categories.set([]),
      });
  }

  openAddCategory() {
    this.categoryForm.reset({ name: '' });
    this.categoryOpen.set(true);
  }

  closeAddCategory() {
    this.categoryOpen.set(false);
    this.categoryForm.reset({ name: '' });
  }

  addCategory() {
    const biz = this.activeBusiness();
    const name = (this.categoryForm.get('name')?.value as string)?.trim();
    if (!biz || !name) return;
    this.savingCategory.set(true);
    this.http
      .post<ApiResponse<Category>>(
        `${environment.apiUrl}/businesses/${biz.id}/categories`,
        { name }
      )
      .subscribe({
        next: () => {
          this.savingCategory.set(false);
          this.closeAddCategory();
          this.loadCategories(biz.id);
          this.toast.success(this.locale.t('settings.categorySaved'));
        },
        error: (e) => {
          this.savingCategory.set(false);
          this.toast.error(apiErrorMessage(e, 'Could not add category'));
        },
      });
  }

  async confirmDeleteCategory(c: Category) {
    const confirmed = await this.confirmDialog.confirm({
      title: this.locale.t('confirm.deleteCategoryTitle'),
      message: this.locale.t('confirm.deleteCategoryMessage').replace('{name}', c.name),
      confirmLabel: this.locale.t('common.delete'),
      cancelLabel: this.locale.t('common.cancel'),
      danger: true,
    });
    if (!confirmed) return;
    const biz = this.activeBusiness();
    if (!biz) return;
    this.http.delete(`${environment.apiUrl}/businesses/${biz.id}/categories/${c.id}`).subscribe({
      next: () => {
        this.loadCategories(biz.id);
        this.toast.success(this.locale.t('settings.categoryDeleted'));
      },
      error: (e) => this.toast.error(apiErrorMessage(e, 'Could not delete')),
    });
  }

  openAddPaymentMethod() {
    this.paymentMethodForm.reset({ name: '' });
    this.paymentMethodLogoFile = null;
    this.paymentMethodLogoPreview.set(null);
    this.paymentMethodOpen.set(true);
  }

  closeAddPaymentMethod() {
    this.paymentMethodOpen.set(false);
    this.paymentMethodForm.reset({ name: '' });
    this.paymentMethodLogoFile = null;
    this.paymentMethodLogoPreview.set(null);
  }

  private patchProfileForm(biz: Business) {
    this.profileForm.patchValue({
      name: biz.name ?? '',
      businessType: biz.businessType ?? '',
      tinNumber: biz.tinNumber ?? '',
      address: biz.address ?? '',
      city: biz.city ?? '',
    });
  }

  saveProfile() {
    const biz = this.activeBusiness();
    if (!biz || this.profileForm.invalid) return;
    this.savingProfile.set(true);
    this.profileError.set('');
    this.http
      .put<ApiResponse<Business>>(`${environment.apiUrl}/businesses/${biz.id}`, this.profileForm.getRawValue())
      .subscribe({
        next: (res) => {
          const updated = res.data;
          this.businesses.update((list) => list.map((b) => (b.id === updated.id ? updated : b)));
          this.auth.syncBusinessFromApi(updated);
          this.toast.success(this.locale.t('settings.profileSaved'));
          this.savingProfile.set(false);
        },
        error: (e) => {
          this.profileError.set(apiErrorMessage(e, 'Save failed'));
          this.savingProfile.set(false);
        },
      });
  }

  loadPaymentMethods(businessId: string) {
    this.http
      .get<ApiResponse<BusinessPaymentMethod[]>>(
        `${environment.apiUrl}/businesses/${businessId}/payment-methods`
      )
      .subscribe({
        next: (res) => {
          this.paymentMethods.set(res.data ?? []);
          this.paymentMethodContext.invalidate();
          this.paymentMethodContext.loadForBusiness(businessId);
        },
        error: () => this.paymentMethods.set([]),
      });
  }

  addPaymentMethod() {
    const biz = this.activeBusiness();
    if (!biz || this.paymentMethodForm.invalid) return;
    this.savingPaymentMethod.set(true);
    const name = this.paymentMethodForm.get('name')?.value as string;
    const body = new FormData();
    body.append('name', name.trim());
    if (this.paymentMethodLogoFile) {
      body.append('file', this.paymentMethodLogoFile);
    }
    this.http
      .post<ApiResponse<BusinessPaymentMethod>>(
        `${environment.apiUrl}/businesses/${biz.id}/payment-methods`,
        body
      )
      .subscribe({
        next: () => {
          this.paymentMethodForm.reset({ name: '' });
          this.paymentMethodLogoFile = null;
          this.paymentMethodLogoPreview.set(null);
          this.closeAddPaymentMethod();
          this.loadPaymentMethods(biz.id);
          this.toast.success(this.locale.t('settings.paymentMethodSaved'));
          this.savingPaymentMethod.set(false);
        },
        error: (e) => {
          this.toast.error(apiErrorMessage(e, 'Could not add payment method'));
          this.savingPaymentMethod.set(false);
        },
      });
  }

  onPaymentMethodLogoUpdate(event: Event, methodId: string) {
    const biz = this.activeBusiness();
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!biz || !file) return;
    const err = validateImageFile(file);
    if (err) {
      this.toast.error(err);
      input.value = '';
      return;
    }
    const body = new FormData();
    body.append('file', file);
    this.http
      .post<ApiResponse<BusinessPaymentMethod>>(
        `${environment.apiUrl}/businesses/${biz.id}/payment-methods/${methodId}/logo`,
        body
      )
      .subscribe({
        next: () => {
          this.loadPaymentMethods(biz.id);
          this.toast.success(this.locale.t('settings.paymentMethodLogoSaved'));
          input.value = '';
        },
        error: (e) => this.toast.error(apiErrorMessage(e, 'Could not update logo')),
      });
  }

  async confirmDeletePaymentMethod(methodId: string, methodName: string) {
    const confirmed = await this.confirmDialog.confirm({
      title: this.locale.t('confirm.deletePaymentMethodTitle'),
      message: this.locale.t('confirm.deletePaymentMethodMessage').replace('{name}', methodName),
      confirmLabel: this.locale.t('common.delete'),
      cancelLabel: this.locale.t('common.cancel'),
      danger: true,
    });
    if (!confirmed) return;
    this.deletePaymentMethod(methodId);
  }

  deletePaymentMethod(methodId: string) {
    const biz = this.activeBusiness();
    if (!biz) return;
    this.http
      .delete(`${environment.apiUrl}/businesses/${biz.id}/payment-methods/${methodId}`)
      .subscribe({
        next: () => {
          this.paymentMethodContext.invalidate();
          this.paymentMethodContext.loadForBusiness(biz.id);
          this.loadPaymentMethods(biz.id);
          this.toast.success(this.locale.t('settings.paymentMethodDeleted'));
        },
        error: (e) => this.toast.error(apiErrorMessage(e, 'Could not delete')),
      });
  }

  switchBusiness(id: string) {
    const biz = this.businesses().find((b) => b.id === id);
    if (biz) {
      this.businessContext.switchBusiness(biz);
      this.patchProfileForm(biz);
      this.loadPaymentMethods(biz.id);
      this.loadCategories(biz.id);
    }
  }

  async confirmDeleteBusiness(biz: Business) {
    const confirmed = await this.confirmDialog.confirm({
      title: this.locale.t('confirm.deleteBusinessTitle'),
      message: this.locale.t('settings.deleteBusinessConfirm').replace('{name}', biz.name),
      confirmLabel: this.locale.t('settings.deleteBusiness'),
      cancelLabel: this.locale.t('common.cancel'),
      danger: true,
    });
    if (!confirmed) {
      return;
    }
    this.deletingBusiness.set(true);
    this.http.delete(`${environment.apiUrl}/businesses/${biz.id}`).subscribe({
      next: () => {
        this.deletingBusiness.set(false);
        this.toast.success(this.locale.t('settings.businessDeleted'));
        const remaining = this.businesses().filter((b) => b.id !== biz.id);
        this.businesses.set(remaining);
        if (this.auth.businessId() === biz.id && remaining.length) {
          this.businessContext.switchBusiness(remaining[0]);
          this.patchProfileForm(remaining[0]);
          this.loadPaymentMethods(remaining[0].id);
          this.loadCategories(remaining[0].id);
        } else {
          this.loadBusinesses();
        }
      },
      error: (e) => {
        this.deletingBusiness.set(false);
        this.toast.error(apiErrorMessage(e, 'Could not delete business'));
      },
    });
  }

  createBusiness() {
    if (this.addForm.invalid) return;
    this.savingBusiness.set(true);
    this.businessError.set('');
    const name = this.addForm.getRawValue().name!;
    this.http
      .post<ApiResponse<Business>>(`${environment.apiUrl}/businesses`, { name })
      .subscribe({
        next: (res) => {
          this.savingBusiness.set(false);
          this.addOpen.set(false);
          this.addForm.reset();
          this.loadBusinesses();
          if (res.data) {
            this.businessContext.switchBusiness(res.data);
          }
        },
        error: (e) => {
          this.businessError.set(apiErrorMessage(e, 'Could not create business'));
          this.savingBusiness.set(false);
        },
      });
  }

  businessLimitText(): string {
    return this.locale.t('settings.businessLimit').replace('{max}', `${this.planFeatures.maxBusinesses()}`);
  }

  initials(): string {
    const name = this.auth.user()?.fullName || '?';
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
}
