import { Component, inject, signal } from '@angular/core';
import { UpgradePlanModalService } from '../core/services/upgrade-plan-modal.service';
import { LocaleService } from '../core/services/locale.service';
import { AuthService } from '../core/services/auth.service';
import { UpgradePlansComponent } from './upgrade-plans.component';
import { PlanId } from '../core/config/subscription.config';
import { ModalOverlayComponent } from './modal-overlay.component';

@Component({
  selector: 'app-upgrade-plan-modal',
  standalone: true,
  imports: [UpgradePlansComponent, ModalOverlayComponent],
  template: `
    @if (modal.open()) {
      <app-modal-overlay
        panelClass="modal-card modal-card-wide animate-scale-in max-h-[min(92vh,900px)] overflow-y-auto text-left"
        (close)="modal.close()"
      >
        <div class="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 class="modal-title !text-left">{{ locale.t('plan.upgrade.title') }}</h2>
            <p class="modal-message !text-left">{{ locale.t('plan.upgrade.subtitle') }}</p>
            <p class="mt-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              {{ locale.t('plan.current') }}:
              <span class="font-semibold text-brand-800">{{ locale.t(planLabelKey(auth.subscriptionPlan())) }}</span>
            </p>
          </div>
          <button type="button" class="logo-menu-btn shrink-0" (click)="modal.close()" aria-label="Close">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <app-upgrade-plans
          [selectedPlanId]="selectedPlan()"
          (selectPlan)="onSelectPlan($event)"
        />
      </app-modal-overlay>
    }
  `,
})
export class UpgradePlanModalComponent {
  readonly modal = inject(UpgradePlanModalService);
  readonly locale = inject(LocaleService);
  readonly auth = inject(AuthService);
  readonly selectedPlan = signal<PlanId | null>(null);

  planLabelKey(plan: PlanId): string {
    return `plan.${plan}.name`;
  }

  onSelectPlan(id: PlanId) {
    this.selectedPlan.set(id);
    setTimeout(() => {
      document.querySelector('.payment-instructions')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 80);
  }
}
