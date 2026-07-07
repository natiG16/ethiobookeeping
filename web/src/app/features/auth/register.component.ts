import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LocaleService } from '../../core/services/locale.service';
import { GoogleSignInButtonComponent } from '../../shared/google-sign-in-button.component';
import { AuthLayoutComponent } from '../../shared/auth-layout.component';
import { BrandLogoComponent } from '../../shared/brand-logo.component';
import { GoogleCredentialResponse } from '../../core/services/google-auth.service';
import { apiErrorMessage } from '../../core/utils/http-error';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    GoogleSignInButtonComponent,
    AuthLayoutComponent,
    BrandLogoComponent,
  ],
  template: `
    <app-auth-layout
      heroTitle="Start in minutes"
      heroSubtitle="Create your account and get a clear picture of your business finances from day one."
    >
      <div class="auth-logo-mobile">
        <app-brand-logo [name]="locale.t('app.name')" size="lg" />
      </div>
      <div class="mb-8 hidden text-center lg:block">
        <h1 class="font-display text-2xl font-bold text-slate-900">{{ locale.t('auth.register') }}</h1>
        <p class="mt-2 text-sm text-slate-500">{{ locale.t('app.tagline') }}</p>
      </div>

      <app-google-sign-in-button [label]="locale.t('auth.googleSignUp')" (credential)="onGoogleCredential($event)" />

      <div class="my-7 flex items-center gap-4">
        <div class="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
        <span class="divider-text">{{ locale.t('auth.orEmail') }}</span>
        <div class="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
      </div>

      @if (registeredEmail()) {
        <div class="rounded-xl border border-brand-200 bg-brand-50/90 px-5 py-6 text-center">
          <h2 class="font-display text-lg font-semibold text-brand-900">{{ locale.t('auth.checkEmailTitle') }}</h2>
          <p class="mt-3 text-sm text-slate-600">
            {{ locale.t('auth.checkEmailBody').replace('{email}', registeredEmail()!) }}
          </p>
          <a routerLink="/login" class="btn-primary mt-6 inline-block w-full">{{ locale.t('auth.backToLogin') }}</a>
        </div>
      } @else {
      <form [formGroup]="form" (ngSubmit)="submitEmail()" class="form-stack animate-fade-in">
        <div>
          <label class="input-label" for="fullName">{{ locale.t('auth.fullName') }}</label>
          <input id="fullName" class="input-field" formControlName="fullName" autocomplete="name" />
        </div>
        <div>
          <label class="input-label" for="businessName">{{ locale.t('auth.businessName') }}</label>
          <input id="businessName" class="input-field" formControlName="businessName" />
        </div>
        <div>
          <label class="input-label" for="email">{{ locale.t('auth.email') }}</label>
          <input id="email" class="input-field" type="email" formControlName="email" autocomplete="email" />
        </div>
        <div>
          <label class="input-label" for="phoneOpt">{{ locale.t('auth.phoneOptional') }}</label>
          <input id="phoneOpt" class="input-field" formControlName="phone" autocomplete="tel" />
        </div>
        <div>
          <label class="input-label" for="password">{{ locale.t('auth.password') }}</label>
          <input id="password" class="input-field" type="password" formControlName="password" autocomplete="new-password" />
        </div>
        @if (error()) {
          <div class="alert-error">{{ error() }}</div>
        }
        <button type="submit" class="btn-primary w-full" [disabled]="loading()">
          @if (loading()) {
            <span class="spinner"></span>
            {{ locale.t('common.loading') }}
          } @else {
            {{ locale.t('auth.createAccount') }}
          }
        </button>
      </form>
      }

      <p class="mt-8 text-center text-sm text-slate-500">
        {{ locale.t('auth.haveAccount') }}
        <a routerLink="/login" class="link-brand">{{ locale.t('auth.login') }}</a>
      </p>
    </app-auth-layout>
  `,
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  readonly locale = inject(LocaleService);

  readonly loading = signal(false);
  readonly error = signal('');
  readonly registeredEmail = signal<string | null>(null);

  form = this.fb.group({
    fullName: ['', Validators.required],
    businessName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  onGoogleCredential(res: GoogleCredentialResponse) {
    const businessName = this.form.get('businessName')?.value?.trim();
    if (!businessName) {
      this.error.set(this.locale.t('auth.businessNameRequired'));
      return;
    }
    this.error.set('');
    this.loading.set(true);
    this.auth.googleAuth(res.credential, businessName).subscribe({
      next: () => {},
      error: (e) => {
        this.error.set(apiErrorMessage(e, 'Google sign-up failed'));
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }

  submitEmail() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');
    this.auth.register(this.form.getRawValue() as Record<string, unknown>).subscribe({
      next: (res) => {
        this.registeredEmail.set(res.data?.email ?? this.form.get('email')?.value ?? '');
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(apiErrorMessage(e, 'Registration failed'));
        this.loading.set(false);
      },
    });
  }
}
