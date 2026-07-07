import { Component, HostListener, inject, OnDestroy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LocaleService } from '../../core/services/locale.service';
import { BrandLogoComponent } from '../../shared/brand-logo.component';
import { ScrollRevealDirective } from '../../shared/directives/scroll-reveal.directive';
import { LandingHeroVisualComponent } from '../../shared/landing-hero-visual.component';
import { LandingHowVisualComponent } from '../../shared/landing-how-visual.component';
import { LandingBenefitsVisualComponent } from '../../shared/landing-benefits-visual.component';
import { LandingFeatureIconComponent } from '../../shared/landing-feature-icon.component';
import { UpgradePlansComponent } from '../../shared/upgrade-plans.component';
import { SupportContactComponent } from '../../shared/support-contact.component';
import { PlanId } from '../../core/config/subscription.config';

const FAQ_IDS = ['q1', 'q2', 'q3', 'q4'] as const;

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    RouterLink,
    BrandLogoComponent,
    ScrollRevealDirective,
    LandingHeroVisualComponent,
    LandingHowVisualComponent,
    LandingBenefitsVisualComponent,
    LandingFeatureIconComponent,
    UpgradePlansComponent,
    SupportContactComponent,
  ],
  template: `
    <div class="landing-page">
      <header class="landing-header">
        <div class="landing-header-bar mx-auto max-w-6xl px-4 sm:px-6">
          <a routerLink="/" class="landing-nav-brand" (click)="closeMobileNav()">
            <app-brand-logo
              [name]="locale.t('app.name')"
              [subtitle]="locale.t('app.tagline')"
              size="sm"
              [compactMobile]="true"
            />
          </a>

          <nav class="landing-desktop-nav" aria-label="Primary">
            <a href="#features" class="landing-nav-link">{{ locale.t('landing.nav.features') }}</a>
            <a href="#how" class="landing-nav-link">{{ locale.t('landing.nav.how') }}</a>
            <a href="#benefits" class="landing-nav-link">{{ locale.t('landing.nav.benefits') }}</a>
            <a href="#pricing" class="landing-nav-link">{{ locale.t('landing.nav.pricing') }}</a>
            <a href="#faq" class="landing-nav-link">{{ locale.t('landing.nav.faq') }}</a>
          </nav>

          <div class="landing-header-actions">
            <button type="button" class="landing-lang-btn" (click)="toggleLang()">
              {{ locale.t('lang.switch') }}
            </button>
            <a routerLink="/login" class="landing-header-link hidden sm:inline-flex">
              {{ locale.t('landing.signIn') }}
            </a>
            <a routerLink="/register" class="btn-primary landing-header-cta hidden min-[420px]:inline-flex">
              {{ locale.t('landing.getStarted') }}
            </a>
            <button
              type="button"
              class="landing-menu-btn"
              (click)="toggleMobileNav()"
              [attr.aria-expanded]="mobileNavOpen()"
              [attr.aria-label]="mobileNavOpen() ? locale.t('landing.nav.close') : locale.t('landing.nav.menu')"
            >
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                @if (mobileNavOpen()) {
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                } @else {
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                }
              </svg>
            </button>
          </div>
        </div>

        @if (mobileNavOpen()) {
          <div class="landing-mobile-backdrop" (click)="closeMobileNav()" aria-hidden="true"></div>
          <nav class="landing-mobile-drawer" aria-label="Mobile">
            <a href="#features" class="landing-mobile-nav-link" (click)="closeMobileNav()">
              {{ locale.t('landing.nav.features') }}
            </a>
            <a href="#how" class="landing-mobile-nav-link" (click)="closeMobileNav()">
              {{ locale.t('landing.nav.how') }}
            </a>
            <a href="#benefits" class="landing-mobile-nav-link" (click)="closeMobileNav()">
              {{ locale.t('landing.nav.benefits') }}
            </a>
            <a href="#pricing" class="landing-mobile-nav-link" (click)="closeMobileNav()">
              {{ locale.t('landing.nav.pricing') }}
            </a>
            <a href="#faq" class="landing-mobile-nav-link" (click)="closeMobileNav()">
              {{ locale.t('landing.nav.faq') }}
            </a>
            <div class="landing-mobile-drawer-cta">
              <a routerLink="/login" class="btn-secondary w-full justify-center" (click)="closeMobileNav()">
                {{ locale.t('landing.signIn') }}
              </a>
              <a routerLink="/register" class="btn-primary w-full justify-center" (click)="closeMobileNav()">
                {{ locale.t('landing.getStarted') }}
              </a>
            </div>
          </nav>
        }
      </header>

      <main class="landing-main mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <section class="landing-hero">
          <div class="landing-hero-copy" appScrollReveal>
            <span class="landing-hero-badge">
              <span class="landing-hero-badge-dot"></span>
              {{ locale.t('landing.hero.badge') }}
            </span>
            <h1 class="landing-hero-title">{{ locale.t('landing.hero.title') }}</h1>
            <p class="landing-hero-subtitle">{{ locale.t('landing.hero.subtitle') }}</p>
            <div class="landing-hero-highlights">
              @for (h of heroHighlights; track h) {
                <span class="landing-hero-highlight">{{ locale.t(h) }}</span>
              }
            </div>
            <div class="landing-hero-cta">
              <a routerLink="/register" class="btn-primary landing-hero-cta-primary">
                {{ locale.t('landing.getStarted') }}
              </a>
              <a routerLink="/login" class="btn-secondary landing-hero-cta-secondary">
                {{ locale.t('landing.signIn') }}
              </a>
            </div>
            <p class="landing-hero-note">{{ locale.t('landing.hero.signInNote') }}</p>
          </div>
          <div class="landing-hero-visual-wrap" appScrollReveal [revealDelay]="120">
            <app-landing-hero-visual />
          </div>
        </section>

        <section id="features" class="landing-section scroll-mt-28" appScrollReveal>
          <div class="landing-section-intro">
            <p class="landing-section-label">{{ locale.t('landing.nav.features') }}</p>
            <h2 class="landing-section-title">{{ locale.t('landing.features.title') }}</h2>
            <p class="landing-section-desc">{{ locale.t('landing.features.subtitle') }}</p>
          </div>
          <div class="landing-features-grid">
            @for (f of featureItems; track f.icon; let i = $index) {
              <article class="landing-feature-card" appScrollReveal [revealDelay]="i * 80">
                <app-landing-feature-icon [icon]="f.icon" />
                <h3 class="landing-feature-card-title">{{ locale.t(f.titleKey) }}</h3>
                <p class="landing-feature-card-desc">{{ locale.t(f.descKey) }}</p>
              </article>
            }
          </div>
        </section>

        <section class="landing-section" appScrollReveal>
          <div class="landing-compare-grid">
            <article class="landing-compare-card landing-compare-problem">
              <div class="landing-compare-icon landing-compare-icon-problem" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p class="landing-section-label text-red-500">{{ locale.t('landing.problem.label') }}</p>
              <h3 class="landing-compare-title">{{ locale.t('landing.problem.title') }}</h3>
              <p class="landing-compare-body">{{ locale.t('landing.problem.body') }}</p>
            </article>
            <article class="landing-compare-card landing-compare-solution">
              <div class="landing-compare-icon landing-compare-icon-solution" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p class="landing-section-label">{{ locale.t('landing.solution.label') }}</p>
              <h3 class="landing-compare-title">{{ locale.t('landing.solution.title') }}</h3>
              <p class="landing-compare-body">{{ locale.t('landing.solution.body') }}</p>
            </article>
          </div>
        </section>

        <section id="how" class="landing-section scroll-mt-28" appScrollReveal>
          <div class="landing-section-intro">
            <p class="landing-section-label">{{ locale.t('landing.how.label') }}</p>
            <h2 class="landing-section-title">{{ locale.t('landing.how.title') }}</h2>
            <p class="landing-section-desc">{{ locale.t('landing.how.subtitle') }}</p>
          </div>
          <app-landing-how-visual />
          <div class="landing-how-grid">
            @for (step of howSteps; track step.titleKey; let i = $index) {
              <article class="landing-how-card" appScrollReveal [revealDelay]="i * 70">
                <span class="landing-how-card-num">{{ step.n }}</span>
                <h3 class="landing-how-card-title">{{ locale.t(step.titleKey) }}</h3>
                <p class="landing-how-card-desc">{{ locale.t(step.descKey) }}</p>
              </article>
            }
          </div>
        </section>

        <section id="benefits" class="landing-section scroll-mt-28" appScrollReveal>
          <div class="landing-benefits-panel">
            <div class="landing-benefits-content">
              <p class="landing-section-label">{{ locale.t('landing.benefits.label') }}</p>
              <h2 class="landing-section-title">{{ locale.t('landing.benefits.title') }}</h2>
              <p class="landing-section-desc">{{ locale.t('landing.benefits.subtitle') }}</p>
              <div class="landing-benefits-list">
                @for (b of benefitItems; track b.titleKey; let i = $index) {
                  <div class="landing-benefit-item" appScrollReveal [revealDelay]="i * 50">
                    <span class="landing-benefit-check" aria-hidden="true">✓</span>
                    <div>
                      <h3 class="landing-benefit-title">{{ locale.t(b.titleKey) }}</h3>
                      <p class="landing-benefit-desc">{{ locale.t(b.descKey) }}</p>
                    </div>
                  </div>
                }
              </div>
            </div>
            <div class="landing-benefits-art">
              <app-landing-benefits-visual />
            </div>
          </div>
        </section>

        <section class="landing-section" appScrollReveal>
          <div class="landing-section-intro">
            <p class="landing-section-label">{{ locale.t('landing.testimonials.label') }}</p>
            <h2 class="landing-section-title">{{ locale.t('landing.testimonials.title') }}</h2>
          </div>
          <div class="landing-testimonials-grid">
            @for (t of testimonials; track t.name) {
              <blockquote class="landing-testimonial-card">
                <svg class="landing-quote-icon" viewBox="0 0 32 32" aria-hidden="true">
                  <path fill="currentColor" d="M10 8c-2.2 0-4 1.8-4 4v8h8v-8H8c0-1.1.9-2 2-2V8zm14 0c-2.2 0-4 1.8-4 4v8h8v-8h-2c0-1.1.9-2 2-2V8z" opacity="0.15" />
                </svg>
                <p class="landing-testimonial-quote">“{{ t.quote }}”</p>
                <footer class="landing-testimonial-footer">
                  <span class="landing-testimonial-avatar">{{ t.initials }}</span>
                  <div>
                    <cite class="landing-testimonial-name">{{ t.name }}</cite>
                    <span class="landing-testimonial-role">{{ t.role }}</span>
                  </div>
                </footer>
              </blockquote>
            }
          </div>
        </section>

        <section id="pricing" class="landing-section scroll-mt-28" appScrollReveal>
          <div class="landing-section-intro">
            <p class="landing-section-label">{{ locale.t('landing.pricing.label') }}</p>
            <h2 class="landing-section-title">{{ locale.t('landing.pricing.title') }}</h2>
            <p class="landing-section-desc">{{ locale.t('landing.pricing.subtitle') }}</p>
          </div>
          <app-upgrade-plans
            [showRegisterLink]="true"
            [selectedPlanId]="selectedPlan()"
            (selectPlan)="onSelectPlan($event)"
          />
        </section>

        <section id="faq" class="landing-section scroll-mt-28" appScrollReveal>
          <div class="landing-section-intro">
            <p class="landing-section-label">{{ locale.t('landing.faq.label') }}</p>
            <h2 class="landing-section-title">{{ locale.t('landing.faq.title') }}</h2>
          </div>
          <div class="landing-faq-list">
            @for (id of faqIds; track id) {
              <details class="landing-faq-item">
                <summary class="landing-faq-question">{{ locale.t('landing.faq.' + id) }}</summary>
                <p class="landing-faq-answer">{{ locale.t('landing.faq.a' + id.slice(1)) }}</p>
              </details>
            }
          </div>
        </section>

        <section class="landing-section" appScrollReveal>
          <div class="landing-cta-panel">
            <div class="landing-cta-pattern" aria-hidden="true"></div>
            <h2 class="landing-cta-title">{{ locale.t('landing.cta.title') }}</h2>
            <p class="landing-cta-subtitle">{{ locale.t('landing.cta.subtitle') }}</p>
            <div class="landing-cta-actions">
              <a routerLink="/register" class="landing-cta-btn-primary">{{ locale.t('landing.cta.create') }}</a>
              <a routerLink="/login" class="landing-cta-btn-secondary">{{ locale.t('landing.signIn') }}</a>
            </div>
          </div>
        </section>
      </main>

      <footer class="landing-footer">
        <div class="landing-footer-grid mx-auto max-w-6xl px-4 sm:px-6">
          <div>
            <app-brand-logo [name]="locale.t('app.name')" size="sm" />
            <p class="landing-footer-tagline">{{ locale.t('landing.footer.tagline') }}</p>
          </div>
          <div>
            <p class="landing-footer-heading">{{ locale.t('landing.footer.product') }}</p>
            <ul class="landing-footer-links">
              <li><a href="#features">{{ locale.t('landing.nav.features') }}</a></li>
              <li><a href="#pricing">{{ locale.t('landing.nav.pricing') }}</a></li>
            </ul>
          </div>
          <div>
            <p class="landing-footer-heading">{{ locale.t('landing.footer.company') }}</p>
            <ul class="landing-footer-links">
              <li><a routerLink="/login">{{ locale.t('landing.signIn') }}</a></li>
              <li><a routerLink="/register">{{ locale.t('landing.getStarted') }}</a></li>
            </ul>
          </div>
          <div>
            <p class="landing-footer-heading">{{ locale.t('landing.footer.contact') }}</p>
            <app-support-contact [compact]="true" />
          </div>
        </div>
        <p class="landing-footer-copy">
          © {{ year }} {{ locale.t('app.name') }}. {{ locale.t('landing.footer.rights') }}
        </p>
      </footer>
    </div>
  `,
})
export class LandingComponent implements OnDestroy {
  readonly locale = inject(LocaleService);
  readonly year = new Date().getFullYear();
  readonly faqIds = FAQ_IDS;
  readonly selectedPlan = signal<PlanId | null>(null);
  readonly mobileNavOpen = signal(false);

  readonly heroHighlights = [
    'landing.hero.highlight1',
    'landing.hero.highlight2',
    'landing.hero.highlight3',
  ] as const;

  readonly featureItems = [
    { icon: 'income' as const, titleKey: 'landing.features.income', descKey: 'landing.features.incomeDesc' },
    { icon: 'expense' as const, titleKey: 'landing.features.expense', descKey: 'landing.features.expenseDesc' },
    { icon: 'debts' as const, titleKey: 'landing.features.debts', descKey: 'landing.features.debtsDesc' },
    { icon: 'reports' as const, titleKey: 'landing.features.reports', descKey: 'landing.features.reportsDesc' },
  ];

  readonly howSteps = [
    { n: '1', titleKey: 'landing.how.s1', descKey: 'landing.how.s1d' },
    { n: '2', titleKey: 'landing.how.s2', descKey: 'landing.how.s2d' },
    { n: '3', titleKey: 'landing.how.s3', descKey: 'landing.how.s3d' },
    { n: '4', titleKey: 'landing.how.s4', descKey: 'landing.how.s4d' },
  ];

  readonly benefitItems = [
    { titleKey: 'landing.benefits.b1', descKey: 'landing.benefits.b1d' },
    { titleKey: 'landing.benefits.b2', descKey: 'landing.benefits.b2d' },
    { titleKey: 'landing.benefits.b3', descKey: 'landing.benefits.b3d' },
    { titleKey: 'landing.benefits.b4', descKey: 'landing.benefits.b4d' },
  ];

  readonly testimonials = [
    { quote: 'Now I know profit every day. The UI feels premium and fast.', name: 'Aster', role: 'Retail', initials: 'A' },
    { quote: 'Debt tracking is clean. Reports are ready when I need them.', name: 'Samuel', role: 'Services', initials: 'S' },
    { quote: 'Simple. Professional. I stopped using notebooks.', name: 'Mekdes', role: 'Cafe', initials: 'M' },
  ];

  @HostListener('document:keydown.escape')
  onEscape() {
    this.closeMobileNav();
  }

  ngOnDestroy() {
    document.body.classList.remove('landing-nav-open');
  }

  onSelectPlan(id: PlanId) {
    this.selectedPlan.set(id);
    setTimeout(() => {
      document.querySelector('.payment-instructions')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 80);
  }

  toggleMobileNav() {
    this.mobileNavOpen.update((v) => {
      const next = !v;
      document.body.classList.toggle('landing-nav-open', next);
      return next;
    });
  }

  closeMobileNav() {
    this.mobileNavOpen.set(false);
    document.body.classList.remove('landing-nav-open');
  }

  toggleLang() {
    this.locale.setLocale(this.locale.locale() === 'en' ? 'am' : 'en');
  }
}
