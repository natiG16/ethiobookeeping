import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LocaleService } from '../../core/services/locale.service';
import { GoogleSignInButtonComponent } from '../../shared/google-sign-in-button.component';
import { AuthLayoutComponent } from '../../shared/auth-layout.component';
import { BrandLogoComponent } from '../../shared/brand-logo.component';
import { GoogleCredentialResponse } from '../../core/services/google-auth.service';
import { apiErrorMessage, isServiceDeactivatedError } from '../../core/utils/http-error';
import { SupportContactComponent } from '../../shared/support-contact.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    GoogleSignInButtonComponent,
    AuthLayoutComponent,
    BrandLogoComponent,
    SupportContactComponent,
  ],
  template: `
    <app-auth-layout heroTitle="Welcome back" heroSubtitle="Sign in to manage income, expenses, and customer debts in one place.">
      <div class="auth-logo-mobile">
        <app-brand-logo [name]="locale.t('app.name')" size="lg" />
      </div>
      <div class="mb-8 hidden text-center lg:block">
        <h1 class="font-display text-2xl font-bold text-brand-900">{{ locale.t('auth.login') }}</h1>
        <p class="mt-2 text-sm text-slate-500">{{ locale.t('app.tagline') }}</p>
      </div>

      @if (sessionExpired()) {
        <div class="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {{ locale.t('auth.sessionExpired') }}
        </div>
      }
      @if (serviceDeactivated()) {
        <div class="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          <p>{{ locale.t('auth.serviceDeactivated') }}</p>
          <app-support-contact [compact]="true" />
        </div>
      }

      <app-google-sign-in-button [label]="locale.t('auth.googleSignIn')" (credential)="onGoogleCredential($event)" />

      <div class="my-7 flex items-center gap-4">
        <div class="h-px flex-1 bg-gradient-to-r from-transparent via-brand-200 to-transparent"></div>
        <span class="divider-text">{{ locale.t('auth.orEmail') }}</span>
        <div class="h-px flex-1 bg-gradient-to-r from-transparent via-brand-200 to-transparent"></div>
      </div>

      <form [formGroup]="form" (ngSubmit)="submit()" class="form-stack animate-fade-in">
        <div>
          <label class="input-label" for="email">{{ locale.t('auth.email') }}</label>
          <input id="email" class="input-field" type="email" formControlName="email" autocomplete="email" />
        </div>
        <div>
          <label class="input-label" for="password">{{ locale.t('auth.password') }}</label>
          <input id="password" class="input-field" type="password" formControlName="password" autocomplete="current-password" />
        </div>
        @if (error()) {
          <div class="alert-error">{{ error() }}</div>
        }
        @if (showResendVerification()) {
          <div class="rounded-xl border border-brand-200/80 bg-brand-50/80 px-4 py-3 text-sm text-brand-900">
            <p class="mb-2">{{ locale.t('auth.resendVerification') }}</p>
            @if (resendNotice()) {
              <p class="text-brand-700">{{ resendNotice() }}</p>
            } @else {
              <button type="button" class="btn-primary w-full" [disabled]="resendLoading()" (click)="resendVerification()">
                {{ resendLoading() ? locale.t('common.loading') : locale.t('auth.resendVerification') }}
              </button>
            }
          </div>
        }
        @if (needsBusinessName()) {
          <div class="rounded-xl border border-brand-200/80 bg-brand-50/80 p-4">
            <p class="mb-2 text-sm font-medium text-brand-800">{{ locale.t('auth.googleBusinessPrompt') }}</p>
            <input
              class="input-field"
              [value]="pendingBusinessName()"
              (input)="pendingBusinessName.set($any($event.target).value)"
              [placeholder]="locale.t('auth.businessName')"
            />
            <button type="button" class="btn-primary mt-3 w-full" (click)="completeGoogleSignup()">
              {{ locale.t('auth.completeSignUp') }}
            </button>
          </div>
        }
        <button type="submit" class="btn-primary w-full" [disabled]="loading()">
          {{ loading() ? locale.t('common.loading') : locale.t('auth.login') }}
        </button>
      </form>

      <p class="mt-8 text-center text-sm text-slate-500">
        {{ locale.t('auth.noAccount') }}
        <a routerLink="/register" class="link-brand">{{ locale.t('auth.register') }}</a>
      </p>
    </app-auth-layout>
  `,
})
export class LoginComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly auth = inject(AuthService);
  readonly locale = inject(LocaleService);

  readonly loading = signal(false);
  readonly error = signal('');
  readonly sessionExpired = signal(false);
  readonly serviceDeactivated = signal(false);
  readonly needsBusinessName = signal(false);
  readonly pendingBusinessName = signal('');
  readonly showResendVerification = signal(false);
  readonly resendLoading = signal(false);
  readonly resendNotice = signal('');
  private pendingGoogleToken = '';

  ngOnInit() {
    this.sessionExpired.set(this.auth.consumeSessionExpiredFlag());
    this.serviceDeactivated.set(this.auth.consumeServiceDeactivatedFlag());
    if (this.auth.isLoggedIn()) {
      this.auth.navigateAfterLogin();
    }
  }

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  onGoogleCredential(res: GoogleCredentialResponse) {
    this.error.set('');
    this.loading.set(true);
    this.auth.googleAuth(res.credential).subscribe({
      next: () => {},
      error: (e) => {
        const msg = apiErrorMessage(e, 'Google sign-in failed');
        if (msg.toLowerCase().includes('businessname')) {
          this.pendingGoogleToken = res.credential;
          this.needsBusinessName.set(true);
          this.error.set('');
        } else {
          this.error.set(msg);
        }
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }

  completeGoogleSignup() {
    const name = this.pendingBusinessName().trim();
    if (!name || !this.pendingGoogleToken) return;
    this.loading.set(true);
    this.auth.googleAuth(this.pendingGoogleToken, name).subscribe({
      next: () => {},
      error: (e) => this.error.set(apiErrorMessage(e, 'Registration failed')),
      complete: () => this.loading.set(false),
    });
  }

  submit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');
    this.showResendVerification.set(false);
    this.resendNotice.set('');
    const { email, password } = this.form.getRawValue();
    this.auth.login(email!, password!).subscribe({
      next: () => {},
      error: (e) => {
        const msg = this.authErrorMessage(e, 'Login failed');
        this.error.set(msg);
        if (msg.toLowerCase().includes('verify')) {
          this.showResendVerification.set(true);
        }
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }

  resendVerification() {
    const email = this.form.get('email')?.value?.trim();
    if (!email) return;
    this.resendLoading.set(true);
    this.resendNotice.set('');
    this.auth.resendVerification(email).subscribe({
      next: () => {
        this.resendNotice.set(this.locale.t('auth.resendVerificationSent'));
        this.resendLoading.set(false);
      },
      error: (e) => {
        this.resendNotice.set(apiErrorMessage(e, this.locale.t('auth.resendVerificationFailed')));
        this.resendLoading.set(false);
      },
    });
  }

  private authErrorMessage(e: unknown, fallback: string): string {
    if ((e as Error)?.message === 'SERVICE_DEACTIVATED') {
      this.serviceDeactivated.set(this.auth.consumeServiceDeactivatedFlag());
      return this.locale.t('auth.serviceDeactivated');
    }
    if (isServiceDeactivatedError(e)) {
      return apiErrorMessage(e, this.locale.t('auth.serviceDeactivated'));
    }
    return apiErrorMessage(e, fallback);
  }
}
