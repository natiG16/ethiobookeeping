import { Component, inject, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LocaleService } from '../core/services/locale.service';
import { PAYMENT_ACCOUNTS, PlanId, SUBSCRIPTION_PLANS } from '../core/config/subscription.config';
import { SupportContactComponent } from './support-contact.component';
import { PaymentMethodLogoComponent } from './payment-method-logo.component';

@Component({
  selector: 'app-upgrade-plans',
  standalone: true,
  imports: [RouterLink, SupportContactComponent, PaymentMethodLogoComponent],
  template: `
    <div class="space-y-8">
      <div class="grid gap-5 lg:grid-cols-3">
        @for (plan of plans; track plan.id) {
          <div class="pricing-plan-card" [class.pricing-plan-featured]="plan.featured">
            @if (plan.featured) {
              <span class="pricing-plan-badge">{{ locale.t('plan.popular') }}</span>
            }
            <h3 class="font-semibold text-slate-900">{{ locale.t(plan.nameKey) }}</h3>
            <p class="mt-2 text-3xl font-bold text-slate-900">{{ locale.t(plan.priceKey) }}</p>
            <p class="mt-1 text-sm text-slate-500">{{ locale.t(plan.descKey) }}</p>
            <ul class="mt-6 flex-1 space-y-2.5 text-sm text-slate-700">
              @for (fk of plan.featureKeys; track fk) {
                <li class="flex gap-2">
                  <svg class="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {{ locale.t(fk) }}
                </li>
              }
            </ul>
            @if (plan.amountEtb) {
              <button
                type="button"
                class="mt-6 w-full"
                [class]="plan.featured ? 'btn-primary' : 'btn-secondary'"
                (click)="selectPlan.emit(plan.id)"
              >
                {{ locale.t('plan.choose') }}
              </button>
            } @else if (showRegisterLink()) {
              <a routerLink="/register" class="btn-secondary mt-6 w-full">{{ locale.t('landing.getStarted') }}</a>
            }
          </div>
        }
      </div>

      @if (selectedPlanId()) {
        <div class="payment-instructions animate-fade-in">
          <div class="flex items-start gap-3">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="min-w-0 flex-1">
              <h3 class="font-semibold text-slate-900">{{ locale.t('plan.payment.title') }}</h3>
              <p class="mt-1 text-sm text-slate-600">{{ locale.t('plan.payment.subtitle') }}</p>
            </div>
          </div>

          <div class="mt-6 grid gap-4 sm:grid-cols-2">
            <div class="payment-method-card">
              <div class="flex items-center gap-3">
                <app-payment-method-logo methodId="Telebirr" alt="Telebirr" size="lg" />
                <div>
                  <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">Telebirr</p>
                  <p class="mt-1 font-mono text-lg font-bold text-slate-900">{{ accounts.telebirr }}</p>
                </div>
              </div>
              <button type="button" class="btn-ghost mt-3 w-full text-xs" (click)="copy(accounts.telebirr)">
                {{ copied() === accounts.telebirr ? locale.t('plan.payment.copied') : locale.t('plan.payment.copy') }}
              </button>
            </div>
            <div class="payment-method-card">
              <div class="flex items-center gap-3">
                <app-payment-method-logo methodId="CBE" alt="CBE" size="lg" />
                <div>
                  <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">CBE</p>
                  <p class="mt-1 font-mono text-lg font-bold text-slate-900">{{ accounts.cbe }}</p>
                </div>
              </div>
              <button type="button" class="btn-ghost mt-3 w-full text-xs" (click)="copy(accounts.cbe)">
                {{ copied() === accounts.cbe ? locale.t('plan.payment.copied') : locale.t('plan.payment.copy') }}
              </button>
            </div>
          </div>

          <p class="mt-4 rounded-xl bg-amber-50/80 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-100">
            {{ locale.t('plan.payment.note') }}
          </p>
          <app-support-contact />
        </div>
      }
    </div>
  `,
})
export class UpgradePlansComponent {
  readonly locale = inject(LocaleService);
  readonly plans = SUBSCRIPTION_PLANS;
  readonly accounts = PAYMENT_ACCOUNTS;

  readonly showRegisterLink = input(false);
  readonly selectedPlanId = input<PlanId | null>(null);
  readonly selectPlan = output<PlanId>();

  readonly copied = signal<string | null>(null);

  copy(value: string) {
    navigator.clipboard?.writeText(value).catch(() => {});
    this.copied.set(value);
    setTimeout(() => this.copied.set(null), 2000);
  }
}
