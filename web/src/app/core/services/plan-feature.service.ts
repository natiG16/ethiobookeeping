import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { PlanId } from '../config/subscription.config';

export type GatedFeature = 'pdfReports' | 'advancedFilters' | 'advancedDashboard';

@Injectable({ providedIn: 'root' })
export class PlanFeatureService {
  private readonly auth = inject(AuthService);

  canWrite(): boolean {
    return this.auth.subscriptionActive();
  }

  canPdfReports(): boolean {
    return this.auth.subscriptionActive() && this.planRank() >= 2;
  }

  /** Search, type, and date range — Business and Pro */
  canAdvancedFilters(): boolean {
    return this.auth.subscriptionActive() && this.planRank() >= 2;
  }

  /** Payment method filter — Business and Pro (same as date/type filters) */
  canPaymentMethodFilter(): boolean {
    return this.canAdvancedFilters();
  }

  /** @deprecated Use canPaymentMethodFilter — kept for dashboard-only Pro features */
  canProTransactionFilters(): boolean {
    return this.canPaymentMethodFilter();
  }

  /** Payment breakdown & extended insights — Pro only */
  canAdvancedDashboard(): boolean {
    return this.auth.subscriptionActive() && this.planRank() >= 3;
  }

  maxBusinesses(): number {
    const plan = this.auth.subscriptionPlan();
    if (plan === 'pro') return 5;
    if (plan === 'business') return 3;
    return 1;
  }

  canAddBusiness(currentCount: number): boolean {
    return currentCount < this.maxBusinesses();
  }

  requiredPlan(feature: GatedFeature): PlanId {
    if (feature === 'advancedFilters') {
      return 'business';
    }
    if (feature === 'advancedDashboard') {
      return 'pro';
    }
    return 'business';
  }

  private planRank(): number {
    const plan = this.auth.subscriptionPlan();
    if (plan === 'pro') return 3;
    if (plan === 'business') return 2;
    return 1;
  }
}
