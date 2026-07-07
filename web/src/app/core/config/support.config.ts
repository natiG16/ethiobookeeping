import { environment } from '../../../environments/environment';

/** Customer-facing support channels — update via environment files. */
export const SUPPORT = {
  email: environment.supportEmail,
  phone: environment.supportPhone,
  /** Telegram @username or full https://t.me/… URL */
  telegram: environment.supportTelegram,
  /** Help center / support portal URL */
  centerUrl: environment.supportCenterUrl,
} as const;

export function supportTelegramHref(telegram: string | undefined): string | null {
  if (!telegram?.trim()) return null;
  const t = telegram.trim();
  if (t.startsWith('http://') || t.startsWith('https://')) return t;
  const handle = t.replace(/^@/, '');
  return `https://t.me/${handle}`;
}

export function supportPhoneHref(phone: string | undefined): string | null {
  if (!phone?.trim()) return null;
  const digits = phone.replace(/[^\d+]/g, '');
  return digits ? `tel:${digits}` : null;
}

export function hasSupportContact(): boolean {
  return !!(SUPPORT.email || SUPPORT.phone || SUPPORT.telegram || SUPPORT.centerUrl);
}
