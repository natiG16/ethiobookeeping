/** Maps HttpClient errors to user-visible messages (including CORS / network). */
export function apiErrorMessage(err: unknown, fallback: string): string {
  const e = err as {
    status?: number;
    error?: { message?: string; errors?: Record<string, string> } | Blob;
  };
  if (e.status === 0) {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'your app URL';
    return (
      `Cannot reach the API. Start the backend on port 8080, restart \`ng serve\` ` +
      `(so /api is proxied), use ${origin} in the browser, and keep images under 2 MB.`
    );
  }
  if (e.status === 413) {
    return 'Image must be 2 MB or smaller.';
  }
  if (e.status === 502 || e.status === 504) {
    return 'API server unavailable. Start the backend on port 8080.';
  }
  if (e.error instanceof Blob) {
    return fallback;
  }
  const fieldErrors = e.error?.errors;
  if (fieldErrors && typeof fieldErrors === 'object') {
    const first = Object.values(fieldErrors)[0];
    if (first) return first;
  }
  if (e.error && typeof e.error === 'object' && 'message' in e.error && e.error.message) {
    return String(e.error.message);
  }
  return fallback;
}

export async function apiErrorMessageAsync(err: unknown, fallback: string): Promise<string> {
  const e = err as { status?: number; error?: unknown };
  if (e.error instanceof Blob) {
    try {
      const text = await e.error.text();
      const parsed = JSON.parse(text) as { message?: string };
      if (parsed.message) {
        return parsed.message;
      }
    } catch {
      /* not JSON */
    }
  }
  return apiErrorMessage(err, fallback);
}

export function isServiceDeactivatedError(err: unknown): boolean {
  return apiErrorMessage(err, '').toLowerCase().includes('deactivated');
}
