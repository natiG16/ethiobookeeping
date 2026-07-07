import { Component, input } from '@angular/core';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  template: `
    <div class="auth-shell">
      <aside class="auth-hero">
        <div class="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl"></div>
        <div class="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-white/10 blur-2xl"></div>

        <div class="relative z-10">
          <div class="flex items-center gap-4">
            <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl font-bold text-brand-700 shadow-md">M</div>
            <div>
              <p class="font-display text-2xl font-bold text-white">mysuq</p>
              <p class="text-sm text-brand-100">Bookkeeping for Ethiopia</p>
            </div>
          </div>
        </div>

        <div class="relative z-10 space-y-6">
          <h2 class="font-display text-3xl font-bold leading-tight tracking-tight text-white">
            {{ heroTitle() }}
          </h2>
          <p class="max-w-sm text-sm leading-relaxed text-brand-50">{{ heroSubtitle() }}</p>
          <ul class="space-y-3 text-sm text-white/95">
            <li class="flex items-center gap-3 rounded-xl bg-white/10 px-3 py-2.5 backdrop-blur-sm">
              <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-white/25 text-base">📊</span>
              Income, expenses & profit at a glance
            </li>
            <li class="flex items-center gap-3 rounded-xl bg-white/10 px-3 py-2.5 backdrop-blur-sm">
              <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-white/25 text-base">🤝</span>
              Track customer debts & repayments
            </li>
            <li class="flex items-center gap-3 rounded-xl bg-white/10 px-3 py-2.5 backdrop-blur-sm">
              <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-white/25 text-base">📄</span>
              PDF reports in English & Amharic
            </li>
          </ul>
        </div>

        <p class="relative z-10 text-xs text-brand-100/80">© mysuq · Built for small businesses</p>
      </aside>

      <div class="auth-panel">
        <div class="auth-card">
          <ng-content />
        </div>
      </div>
    </div>
  `,
})
export class AuthLayoutComponent {
  readonly heroTitle = input('Grow your business with clarity');
  readonly heroSubtitle = input(
    'Simple bookkeeping for shops, services, and small enterprises across Ethiopia.'
  );
}
