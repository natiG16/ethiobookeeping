import { Component } from '@angular/core';

@Component({
  selector: 'app-landing-benefits-visual',
  standalone: true,
  template: `
    <div class="landing-benefits-visual" aria-hidden="true">
      <svg viewBox="0 0 280 360" fill="none" class="landing-phone-svg">
        <defs>
          <linearGradient id="phoneBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#f0fdf4" />
            <stop offset="100%" stop-color="#ffffff" />
          </linearGradient>
        </defs>
        <rect x="20" y="8" width="240" height="344" rx="36" fill="#0f172a" />
        <rect x="28" y="16" width="224" height="328" rx="30" fill="url(#phoneBg)" stroke="#e2e8f0" />
        <rect x="100" y="28" width="80" height="6" rx="3" fill="#cbd5e1" />
        <rect x="44" y="52" width="192" height="36" rx="12" fill="white" stroke="#e2e8f0" />
        <rect x="56" y="64" width="80" height="8" rx="4" fill="#d1fae5" />
        <rect x="56" y="76" width="120" height="6" rx="3" fill="#f1f5f9" />
        <rect x="44" y="100" width="92" height="72" rx="14" fill="#ecfdf5" stroke="#a7f3d0" />
        <text x="90" y="132" text-anchor="middle" fill="#047857" font-size="11" font-weight="700" font-family="system-ui">+8,200</text>
        <text x="90" y="148" text-anchor="middle" fill="#64748b" font-size="9" font-family="system-ui">Income</text>
        <rect x="144" y="100" width="92" height="72" rx="14" fill="#fff7ed" stroke="#fed7aa" />
        <text x="190" y="132" text-anchor="middle" fill="#c2410c" font-size="11" font-weight="700" font-family="system-ui">−3,100</text>
        <text x="190" y="148" text-anchor="middle" fill="#64748b" font-size="9" font-family="system-ui">Expense</text>
        <rect x="44" y="184" width="192" height="48" rx="14" fill="white" stroke="#e2e8f0" />
        <circle cx="68" cy="208" r="12" fill="#fef3c7" />
        <text x="68" y="212" text-anchor="middle" fill="#b45309" font-size="10" font-weight="700" font-family="system-ui">ቀ</text>
        <rect x="88" y="200" width="100" height="6" rx="3" fill="#e2e8f0" />
        <rect x="88" y="212" width="130" height="6" rx="3" fill="#f1f5f9" />
        <rect x="44" y="244" width="192" height="84" rx="14" fill="white" stroke="#e2e8f0" />
        <rect x="56" y="260" width="168" height="8" rx="4" fill="#d1fae5" />
        <rect x="56" y="276" width="140" height="6" rx="3" fill="#e2e8f0" />
        <rect x="56" y="290" width="100" height="6" rx="3" fill="#f1f5f9" />
        <rect x="56" y="304" width="168" height="8" rx="4" fill="#ffedd5" />
      </svg>
    </div>
  `,
})
export class LandingBenefitsVisualComponent {}
