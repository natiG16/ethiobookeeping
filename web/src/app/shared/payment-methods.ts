export type PaymentMethodId = string;

export interface PaymentMethodOption {
  id: string;
  labelKey: string;
  label: string;
  /** File slug under public/payment-methods/ (cash, telebirr, cbe, bank). */
  assetSlug?: string;
  logo: string;
  logoFallback: string;
  logoUrl?: string | null;
  builtIn?: boolean;
}

export const BUILTIN_PAYMENT_NAMES = ['Cash', 'Telebirr', 'CBE', 'Other Bank'] as const;

const base = '/payment-methods';

/** Built-in brand images: prefer PNG/JPG in public/payment-methods/, then SVG placeholder. */
function logos(slug: string): { logo: string; logoFallback: string } {
  return {
    logo: `${base}/${slug}.png`,
    logoFallback: `${base}/${slug}.svg`,
  };
}

/** Optional .jpg assets (e.g. bank.jpg) — used when PNG is missing. */
export function builtinLogoJpg(slug: string): string {
  return `${base}/${slug}.jpg`;
}

export function paymentMethodInitial(name?: string | null): string {
  const trimmed = (name ?? '').trim();
  if (!trimmed) return '?';
  return trimmed.charAt(0).toUpperCase();
}

export function isBuiltInPaymentMethod(name?: string | null): boolean {
  if (!name) return false;
  const n = name.trim().toLowerCase();
  return BUILTIN_PAYMENT_NAMES.some((b) => b.toLowerCase() === n);
}

export const PAYMENT_METHODS: PaymentMethodOption[] = [
  { id: 'Cash', assetSlug: 'cash', labelKey: 'payment.cash', label: 'Cash', builtIn: true, ...logos('cash') },
  { id: 'Telebirr', assetSlug: 'telebirr', labelKey: 'payment.telebirr', label: 'Telebirr', builtIn: true, ...logos('telebirr') },
  { id: 'CBE', assetSlug: 'cbe', labelKey: 'payment.cbe', label: 'CBE', builtIn: true, ...logos('cbe') },
  { id: 'Other Bank', assetSlug: 'bank', labelKey: 'payment.otherBank', label: 'Other Bank', builtIn: true, ...logos('bank') },
];

export function paymentMethodLogoSources(idOrLabel?: string | null): { primary: string; fallback: string } {
  const m = findPaymentMethod(idOrLabel);
  if (!m) {
    return { primary: '', fallback: '' };
  }
  return { primary: m.logo, fallback: m.logoFallback };
}

export function findPaymentMethod(value?: string | null): PaymentMethodOption | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  return PAYMENT_METHODS.find(
    (m) =>
      m.id.toLowerCase() === normalized ||
      m.label.toLowerCase() === normalized ||
      (normalized === 'cbe birr' && m.id === 'CBE')
  );
}

export function paymentMethodLabel(value?: string | null): string {
  return findPaymentMethod(value)?.label ?? value ?? '—';
}

export function paymentMethodLogo(value?: string | null): string {
  return paymentMethodLogoSources(value).primary;
}
