import { Component } from '@angular/core';

@Component({
  selector: 'app-landing-how-visual',
  standalone: true,
  template: `
    <div class="landing-how-visual" aria-hidden="true">
      <svg viewBox="0 0 800 120" fill="none" class="landing-how-line hidden lg:block">
        <path
          d="M80 60 H200 M200 60 H360 M360 60 H520 M520 60 H680"
          stroke="#a7f3d0"
          stroke-width="3"
          stroke-linecap="round"
          stroke-dasharray="8 8"
        />
      </svg>
      <div class="landing-how-steps">
        <div class="landing-how-step">
          <div class="landing-how-step-icon landing-how-step-icon-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <span class="landing-how-step-num">1</span>
        </div>
        <div class="landing-how-step">
          <div class="landing-how-step-icon landing-how-step-icon-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span class="landing-how-step-num">2</span>
        </div>
        <div class="landing-how-step">
          <div class="landing-how-step-icon landing-how-step-icon-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <span class="landing-how-step-num">3</span>
        </div>
        <div class="landing-how-step">
          <div class="landing-how-step-icon landing-how-step-icon-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span class="landing-how-step-num">4</span>
        </div>
      </div>
    </div>
  `,
})
export class LandingHowVisualComponent {}
