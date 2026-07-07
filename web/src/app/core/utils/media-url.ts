import { environment } from '../../../environments/environment';

/** Resolve API upload path or external URL for use in img src. */
export function mediaUrl(path?: string | null, cacheBust?: number | string): string | null {
  if (!path?.trim()) return null;
  const trimmed = path.trim();
  let url: string;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    url = trimmed;
  } else {
    const apiBase = environment.apiUrl.replace(/\/$/, '');
    const normalized = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    if (apiBase.startsWith('http://') || apiBase.startsWith('https://')) {
      url = `${apiBase}${normalized}`;
    } else if (typeof window !== 'undefined') {
      url = `${window.location.origin}${apiBase}${normalized}`;
    } else {
      url = `${apiBase}${normalized}`;
    }
  }
  if (cacheBust != null && cacheBust !== '') {
    const sep = url.includes('?') ? '&' : '?';
    url = `${url}${sep}v=${cacheBust}`;
  }
  return url;
}

export function isExternalMediaUrl(url: string | null): boolean {
  return !!url && (url.startsWith('http://') || url.startsWith('https://'));
}
