import { Component } from '@angular/core';

@Component({
  selector: 'app-landing-hero-visual',
  standalone: true,
  template: `
    <div class="hero-visual" aria-hidden="true">
      <div class="hero-visual-glow"></div>
      <svg class="hero-visual-svg" viewBox="0 0 520 420" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="heroCard" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#ecfdf5" />
            <stop offset="100%" stop-color="#fffbeb" />
          </linearGradient>
          <linearGradient id="heroBarUp" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stop-color="#047857" />
            <stop offset="100%" stop-color="#34d399" />
          </linearGradient>
          <linearGradient id="heroBarDown" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stop-color="#c2410c" />
            <stop offset="100%" stop-color="#fb923c" />
          </linearGradient>
          <filter id="heroShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#059669" flood-opacity="0.12" />
          </filter>
        </defs>
        <rect x="24" y="20" width="472" height="380" rx="28" fill="white" stroke="#e2e8f0" filter="url(#heroShadow)" />
        <rect x="24" y="20" width="472" height="380" rx="28" fill="url(#heroCard)" fill-opacity="0.55" />
        <circle cx="460" cy="52" r="6" fill="#10b981" />
        <circle cx="476" cy="52" r="6" fill="#fbbf24" />
        <circle cx="492" cy="52" r="6" fill="#f87171" />
        <rect x="52" y="48" width="140" height="14" rx="7" fill="#cbd5e1" />
        <rect x="52" y="70" width="96" height="9" rx="4.5" fill="#e2e8f0" />
        <rect x="318" y="44" width="154" height="48" rx="16" fill="#ecfdf5" stroke="#6ee7b7" stroke-width="1.5" />
        <text x="395" y="74" text-anchor="middle" fill="#047857" font-size="15" font-weight="700" font-family="system-ui,sans-serif">+ ETB 12,480</text>
        <text x="395" y="58" text-anchor="middle" fill="#059669" font-size="10" font-weight="600" font-family="system-ui,sans-serif">Today profit</text>
        <rect x="52" y="108" width="416" height="120" rx="20" fill="#f8fafc" stroke="#f1f5f9" />
        <text x="72" y="132" fill="#64748b" font-size="11" font-weight="600" font-family="system-ui,sans-serif">This week</text>
        <rect x="88" y="168" width="44" height="44" rx="10" fill="url(#heroBarUp)" />
        <rect x="148" y="148" width="44" height="64" rx="10" fill="url(#heroBarUp)" />
        <rect x="208" y="158" width="44" height="54" rx="10" fill="url(#heroBarDown)" />
        <rect x="268" y="142" width="44" height="70" rx="10" fill="url(#heroBarUp)" />
        <rect x="328" y="152" width="44" height="60" rx="10" fill="url(#heroBarDown)" />
        <rect x="388" y="138" width="44" height="74" rx="10" fill="url(#heroBarUp)" />
        <rect x="52" y="248" width="196" height="56" rx="16" fill="white" stroke="#e2e8f0" />
        <rect x="68" y="264" width="28" height="28" rx="14" fill="#d1fae5" />
        <path d="M78 279l6 6 12-14" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        <rect x="108" y="266" width="120" height="8" rx="4" fill="#e2e8f0" />
        <rect x="108" y="280" width="72" height="6" rx="3" fill="#f1f5f9" />
        <rect x="272" y="248" width="196" height="56" rx="16" fill="white" stroke="#e2e8f0" />
        <rect x="288" y="264" width="28" height="28" rx="14" fill="#ffedd5" />
        <path d="M302 274v10M297 279h10" stroke="#ea580c" stroke-width="2" stroke-linecap="round" />
        <rect x="328" y="266" width="120" height="8" rx="4" fill="#e2e8f0" />
        <rect x="328" y="280" width="80" height="6" rx="3" fill="#f1f5f9" />
        <rect x="52" y="322" width="416" height="62" rx="18" fill="white" stroke="#e2e8f0" />
        <rect x="72" y="342" width="120" height="8" rx="4" fill="#a7f3d0" />
        <rect x="72" y="358" width="200" height="6" rx="3" fill="#e2e8f0" />
        <rect x="300" y="338" width="148" height="30" rx="12" fill="#059669" fill-opacity="0.12" />
        <text x="374" y="358" text-anchor="middle" fill="#047857" font-size="12" font-weight="600" font-family="system-ui,sans-serif">Export PDF</text>
      </svg>
      <div class="hero-float hero-float-a"></div>
      <div class="hero-float hero-float-b"></div>
      <div class="hero-float-card hero-float-card-1">
        <span class="hero-float-card-icon text-emerald-600">↑</span>
        <span class="hero-float-card-text">Income</span>
      </div>
      <div class="hero-float-card hero-float-card-2">
        <span class="hero-float-card-icon text-amber-600">ቀ</span>
        <span class="hero-float-card-text">Ethiopian dates</span>
      </div>
    </div>
  `,
})
export class LandingHeroVisualComponent {}
