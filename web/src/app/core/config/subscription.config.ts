export type PlanId = 'starter' | 'business' | 'pro';

export interface SubscriptionPlan {
  id: PlanId;
  nameKey: string;
  priceKey: string;
  descKey: string;
  amountEtb: number | null;
  featureKeys: string[];
  featured?: boolean;
}

/** Manual payment — update these numbers when your accounts change. */
export const PAYMENT_ACCOUNTS = {
  telebirr: '0945529709',
  cbe: '1000138430611',
} as const;

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'starter',
    nameKey: 'plan.starter.name',
    priceKey: 'plan.starter.price',
    descKey: 'plan.starter.desc',
    amountEtb: null,
    featureKeys: ['plan.starter.f1', 'plan.starter.f2', 'plan.starter.f3'],
  },
  {
    id: 'business',
    nameKey: 'plan.business.name',
    priceKey: 'plan.business.price',
    descKey: 'plan.business.desc',
    amountEtb: 299,
    featureKeys: ['plan.business.f1', 'plan.business.f2', 'plan.business.f3'],
    featured: true,
  },
  {
    id: 'pro',
    nameKey: 'plan.pro.name',
    priceKey: 'plan.pro.price',
    descKey: 'plan.pro.desc',
    amountEtb: 599,
    featureKeys: ['plan.pro.f1', 'plan.pro.f2', 'plan.pro.f3'],
  },
];
