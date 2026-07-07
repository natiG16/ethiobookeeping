import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  input,
  output,
  signal,
  ViewChild,
} from '@angular/core';
import { GoogleAuthService, GoogleCredentialResponse } from '../core/services/google-auth.service';

@Component({
  selector: 'app-google-sign-in-button',
  standalone: true,
  template: `
    <div class="w-full">
      @if (!configured() && configChecked()) {
        <div class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          Google Sign-In: add your Client ID to <code class="font-mono">web/public/app-config.json</code>
          (see <code class="font-mono">app-config.example.json</code>).
        </div>
      }

      <button
        type="button"
        class="btn-google w-full"
        [disabled]="loading() || (!configured() && configChecked())"
        (click)="onCustomClick()"
      >
        @if (loading()) {
          <span class="spinner"></span>
          <span>Connecting…</span>
        } @else {
          <svg class="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span>{{ label() }}</span>
        }
      </button>

      <div #googleHost class="sr-only absolute h-px w-px overflow-hidden opacity-0" aria-hidden="true"></div>
    </div>
  `,
})
export class GoogleSignInButtonComponent implements AfterViewInit {
  private readonly googleAuth = inject(GoogleAuthService);

  readonly label = input('Sign in with Google');
  readonly credential = output<GoogleCredentialResponse>();

  @ViewChild('googleHost') googleHost?: ElementRef<HTMLElement>;

  readonly configured = signal(false);
  readonly configChecked = signal(false);
  readonly loading = signal(false);

  private officialReady = false;

  async ngAfterViewInit() {
    const clientId = await this.googleAuth.ensureClientId();
    this.configured.set(!!clientId);
    this.configChecked.set(true);
    if (!clientId || !this.googleHost) return;

    try {
      await this.googleAuth.renderSignInButton(this.googleHost.nativeElement, (res) => {
        this.loading.set(false);
        this.credential.emit(res);
      });
      this.officialReady = true;
    } catch {
      // custom button still works for retry
    }
  }

  async onCustomClick() {
    if (!this.configured()) return;
    this.loading.set(true);
    try {
      if (this.officialReady && this.googleHost) {
        const btn = this.googleHost.nativeElement.querySelector('div[role=button]') as HTMLElement;
        if (btn) {
          btn.click();
          return;
        }
      }
      const google = await this.googleAuth.waitForGoogleScript();
      const clientId = await this.googleAuth.ensureClientId();
      google.accounts.id.initialize({
        client_id: clientId,
        callback: (res: GoogleCredentialResponse) => {
          this.loading.set(false);
          this.credential.emit(res);
        },
      });
      google.accounts.id.prompt();
      setTimeout(() => this.loading.set(false), 3000);
    } catch {
      this.loading.set(false);
    }
  }
}
