import { Component, inject, input } from '@angular/core';
import {
  SUPPORT,
  hasSupportContact,
  supportPhoneHref,
  supportTelegramHref,
} from '../core/config/support.config';
import { LocaleService } from '../core/services/locale.service';

@Component({
  selector: 'app-support-contact',
  standalone: true,
  template: `
    @if (hasContact()) {
      <div
        class="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-left text-sm text-slate-700"
        [class.mt-6]="!compact()"
      >
        <p class="font-medium text-slate-900">{{ locale.t('support.contactTitle') }}</p>
        <ul class="mt-2 space-y-1.5">
          @if (support.email) {
            <li>
              <span class="text-slate-500">{{ locale.t('support.email') }}:</span>
              <a class="link-brand ml-1 font-medium" [href]="'mailto:' + support.email">{{ support.email }}</a>
            </li>
          }
          @if (support.phone) {
            <li>
              <span class="text-slate-500">{{ locale.t('support.phone') }}:</span>
              @if (phoneHref(); as href) {
                <a class="link-brand ml-1 font-medium" [href]="href">{{ support.phone }}</a>
              } @else {
                <span class="ml-1 font-medium">{{ support.phone }}</span>
              }
            </li>
          }
          @if (support.telegram) {
            <li>
              <span class="text-slate-500">{{ locale.t('support.telegram') }}:</span>
              @if (telegramHref(); as href) {
                <a class="link-brand ml-1 font-medium" [href]="href" target="_blank" rel="noopener noreferrer">
                  {{ telegramLabel() }}
                </a>
              } @else {
                <span class="ml-1 font-medium">{{ support.telegram }}</span>
              }
            </li>
          }
          @if (support.centerUrl) {
            <li>
              <a
                class="link-brand inline-flex items-center gap-1 font-medium"
                [href]="support.centerUrl"
                target="_blank"
                rel="noopener noreferrer"
              >
                {{ locale.t('support.center') }}
                <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </li>
          }
        </ul>
      </div>
    }
  `,
})
export class SupportContactComponent {
  readonly locale = inject(LocaleService);
  readonly support = SUPPORT;
  readonly compact = input(false);

  hasContact = hasSupportContact;

  phoneHref(): string | null {
    return supportPhoneHref(this.support.phone);
  }

  telegramHref(): string | null {
    return supportTelegramHref(this.support.telegram);
  }

  telegramLabel(): string {
    const t = this.support.telegram?.trim() ?? '';
    if (t.startsWith('http')) {
      try {
        return new URL(t).pathname.replace(/^\//, '') || t;
      } catch {
        return t;
      }
    }
    return t.startsWith('@') ? t : `@${t.replace(/^@/, '')}`;
  }
}
