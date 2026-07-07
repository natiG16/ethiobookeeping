import { Component, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LocaleService } from '../core/services/locale.service';
import {
  SUBSCRIPTION_PAYMENT,
  SUBSCRIPTION_PLANS,
  SubscriptionPlan,
} from '../core/config/subscription.config';

@Component({
  selector: 'app-upgrade-plans-panel',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="space-y-8">
      <div class="grid gap-5 lg:grid-cols-3">
        @for (plan of plans; track plan.id) {
          <div
            class="upgrade-plan-card"
            [class.upgrade-plan-card-featured]="plan.featured"
          >
            @if (plan.featured) {
              <span class="upgrade-plan-badge">{{ locale.t('plans.popular') }}</span>
            }
            <h3 class="font-semibold text-slate-900">{{ planLabel(plan) }}</h3>
            <p class="mt-2 text-3xl font-bold text-slate-900">{{ planPrice(plan) }}</p>
            <p class="mt-1 text-sm text-slate-500">{{ locale.t(plan.descKey) }}</p>
            <ul class="mt-6 flex-1 space-y-2 text-sm text-slate-700">
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
                class="btn-primary mt-6 w-full"
                (click)="selectPlan(plan)"
              >
                {{ locale.t('plans.choose') }} — {{ planPrice(plan) }}
              </button>
            } @else {
              <p class="mt-6 rounded-xl bg-slate-50 px-4 py-3 text-center text-sm text-slate-600">
                {{ locale.t('plans.starter.active') }}
              </p>
            }
          </div>
        }
      </div>

      @if (selectedPlan()) {
        <div class="payment-instructions animate-fade-in" appScrollReveal>
          <div class="flex items-start gap-3">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="min-w-0 flex-1">
              <h3 class="font-display text-lg font-bold text-slate-900">{{ locale.t('plans.payment.title') }}</h3>
              <p class="mt-1 text-sm text-slate-600">
                {{ locale.t('plans.payment.subtitle', { plan: planLabel(selectedPlan()!), amount: planPrice(selectedPlan()!) }) }}
              </p>
            </div>
          </div>

          <div class="mt-6 grid gap-4 sm:grid-cols-2">
            <div class="payment-method-card">
              <div class="flex items-center gap-2">
                <span class="payment-method-icon payment-method-telebirr">T</span>
                <span class="font-semibold text-slate-900">Telebirr</span>
              </div>
              <p class="payment-number mt-3">{{ payment.telebirr }}</p>
              <p class="mt-1 text-xs text-slate-500">{{ locale.t('plans.payment.telebirrHint') }}</p>
            </div>
            <div class="payment-method-card">
              <div class="flex items-center gap-2">
                <span class="payment-method-icon payment-method-cbe">CBE</span>
                <span class="font-semibold text-slate-900">{{ locale.t('payment.cbe') }}</span>
              </div>
              <p class="payment-number mt-3">{{ payment.cbe }}</p>
              <p class="mt-1 text-xs text-slate-500">{{ locale.t('plans.payment.cbeHint') }}</p>
            </div>
          </div>

          <p class="mt-4 rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
            {{ locale.t('plans.payment.manualNote') }}
          </p>
        </div>
      }

      @if (showGuestCta()) {
        <p class="text-center text-sm text-slate-600">
          <a routerLink="/register" class="font-semibold text-brand-700 hover:underline">{{ locale.t('landing.getStarted') }}</a>
          {{ locale.t('plans.guestSuffix') }}
        </p>
      }
    </div>
  `,
})
export class UpgradePlansPanelComponent {
  readonly locale = inject(LocaleService);
  readonly plans = SUBSCRIPTION_PLANS;
  readonly payment = SUBSCRIPTION_PAYMENT;

  readonly showGuestCta = input(false);
  readonly planSelected = output<SubscriptionPlan>();

  readonly selectedPlan = input<SubscriptionPlan | null>(null);

  planLabel(plan: SubscriptionPlan): string {
    return this.locale.t(`plans.${plan.id}.name`);
  }

  planPrice(plan: SubscriptionPlan): string {
    return this.locale.locale() === 'am' ? plan.priceDisplay.am : plan.priceDisplay.en;
  }

  selectPlan(plan: SubscriptionPlan) {
    this.planSelected.emit(plan);
  }
}
