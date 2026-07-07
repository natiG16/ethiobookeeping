export function blockQtyDecimalKey(e: KeyboardEvent): void {
  if (e.key === '.' || e.key === ',' || e.key === 'e' || e.key === 'E' || e.key === '-' || e.key === '+') {
    e.preventDefault();
  }
}

/** Positive whole-number quantity; falls back when empty or invalid. */
export function parseWholeQty(value: unknown, fallback = 1): number {
  const n = typeof value === 'number' ? Math.trunc(value) : parseInt(String(value ?? '').trim(), 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return n;
}

export function sanitizeQtyInput(el: HTMLInputElement): void {
  const raw = el.value.trim();
  if (!raw) return;
  if (/[.,]/.test(raw) || !/^\d+$/.test(raw)) {
    const n = parseWholeQty(raw, 0);
    el.value = n > 0 ? String(n) : '';
  }
}
