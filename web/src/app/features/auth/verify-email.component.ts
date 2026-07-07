import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LocaleService } from '../../core/services/locale.service';
import { AuthLayoutComponent } from '../../shared/auth-layout.component';
import { BrandLogoComponent } from '../../shared/brand-logo.component';
import { apiErrorMessage } from '../../core/utils/http-error';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [RouterLink, AuthLayoutComponent, BrandLogoComponent],
  template: `
    <app-auth-layout
      heroTitle="Almost there"
      heroSubtitle="Confirm your email to start using mysuq."
    >
      <div class="auth-logo-mobile">
        <app-brand-logo [name]="locale.t('app.name')" size="lg" />
      </div>
      <div class="mb-8 text-center">
        <h1 class="font-display text-2xl font-bold text-slate-900">{{ locale.t('auth.verifyEmailTitle') }}</h1>
      </div>

      @if (status() === 'working') {
        <p class="text-center text-sm text-slate-600">{{ locale.t('auth.verifyEmailWorking') }}</p>
        <div class="mt-6 flex justify-center"><span class="spinner"></span></div>
      }
      @if (status() === 'success') {
        <div class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {{ locale.t('auth.verifyEmailSuccess') }}
        </div>
      }
      @if (status() === 'error') {
        <div class="alert-error">{{ error() }}</div>
        <p class="mt-6 text-center text-sm text-slate-500">
          <a routerLink="/login" class="link-brand">{{ locale.t('auth.backToLogin') }}</a>
        </p>
      }
    </app-auth-layout>
  `,
})
export class VerifyEmailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  readonly locale = inject(LocaleService);

  readonly status = signal<'working' | 'success' | 'error'>('working');
  readonly error = signal('');

  ngOnInit() {
    const token = this.route.snapshot.queryParamMap.get('token')?.trim();
    if (!token) {
      this.status.set('error');
      this.error.set(this.locale.t('auth.verifyEmailFailed'));
      return;
    }
    this.auth.verifyEmail(token).subscribe({
      next: () => this.status.set('success'),
      error: (e) => {
        this.status.set('error');
        this.error.set(apiErrorMessage(e, this.locale.t('auth.verifyEmailFailed')));
      },
    });
  }
}
