export interface JwtPayload {
  exp?: number;
  sub?: string;
  role?: string;
  email?: string;
  [key: string]: unknown;
}

function base64UrlDecode(segment: string): string {
  const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  return atob(padded);
}

export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const json = base64UrlDecode(part);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export function getTokenExpiryMs(token: string | null): number | null {
  const payload = decodeJwtPayload(token ?? '');
  if (!payload?.exp) return null;
  return payload.exp * 1000;
}

export function isTokenExpired(token: string | null, skewMs = 5000): boolean {
  const exp = getTokenExpiryMs(token);
  if (exp == null) return true;
  return Date.now() >= exp - skewMs;
}

export function getTokenRole(token: string | null): string | null {
  const payload = decodeJwtPayload(token ?? '');
  const role = payload?.role;
  return role != null ? String(role) : null;
}
