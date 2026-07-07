import { Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleAccountsId {
  initialize: (config: object) => void;
  renderButton: (parent: HTMLElement, options: object) => void;
  prompt: (momentListener?: (n: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean }) => void) => void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
  }
}

@Injectable({ providedIn: 'root' })
export class GoogleAuthService {
  private clientId = '';
  readonly configured = signal(false);
  private configLoaded = false;

  async ensureClientId(): Promise<string> {
    if (this.configLoaded) return this.clientId;
    this.clientId = environment.googleClientId?.trim() || '';
    if (!this.clientId) {
      try {
        const res = await fetch('/app-config.json');
        if (res.ok) {
          const cfg = await res.json();
          this.clientId = (cfg.googleClientId || '').trim();
        }
      } catch {
        // ignore
      }
    }
    this.configured.set(!!this.clientId);
    this.configLoaded = true;
    return this.clientId;
  }

  async waitForGoogleScript(): Promise<NonNullable<Window['google']>> {
    if (window.google?.accounts?.id) {
      return window.google;
    }
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const timer = setInterval(() => {
        attempts++;
        if (window.google?.accounts?.id) {
          clearInterval(timer);
          resolve(window.google);
        } else if (attempts > 100) {
          clearInterval(timer);
          reject(new Error('Google Sign-In script failed to load'));
        }
      }, 50);
    });
  }

  async renderSignInButton(
    container: HTMLElement,
    onCredential: (response: GoogleCredentialResponse) => void
  ): Promise<void> {
    const clientId = await this.ensureClientId();
    if (!clientId) {
      return;
    }
    const google = await this.waitForGoogleScript();
    container.innerHTML = '';
    google.accounts.id.initialize({
      client_id: clientId,
      callback: onCredential,
      auto_select: false,
    });
    google.accounts.id.renderButton(container, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      shape: 'rectangular',
      text: 'signin_with',
      width: Math.min(container.offsetWidth || 320, 400),
      logo_alignment: 'left',
    });
  }
}
