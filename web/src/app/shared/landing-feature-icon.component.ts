import { NgClass } from '@angular/common';
import { Component, input } from '@angular/core';

export type LandingFeatureIcon = 'income' | 'expense' | 'debts' | 'reports';

@Component({
  selector: 'app-landing-feature-icon',
  standalone: true,
  imports: [NgClass],
  template: `
    <div class="feature-icon-wrap" [ngClass]="toneClass()">
      @switch (icon()) {
        @case ('income') {
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        }
        @case ('expense') {
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
          </svg>
        }
        @case ('debts') {
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        }
        @case ('reports') {
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        }
      }
    </div>
  `,
})
export class LandingFeatureIconComponent {
  readonly icon = input.required<LandingFeatureIcon>();

  toneClass() {
    return `feature-icon-${this.icon()}`;
  }
}
