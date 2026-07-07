import { Component, HostListener, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { AuthService } from '../core/services/auth.service';
import { BusinessContextService } from '../core/services/business-context.service';
import { LocaleService } from '../core/services/locale.service';
import { ApiResponse, Business } from '../core/models/api.models';
import { mediaUrl } from '../core/utils/media-url';

@Component({
  selector: 'app-business-switcher',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="biz-switcher" [class.biz-switcher-open]="open()">
      <button
        type="button"
        class="biz-switcher-trigger"
        (click)="toggle()"
        [attr.aria-expanded]="open()"
        aria-haspopup="listbox"
      >
        @if (activeLogo()) {
          <img [src]="activeLogo()!" alt="" class="biz-switcher-logo" />
        } @else {
          <span class="biz-switcher-fallback" aria-hidden="true">{{ activeInitial() }}</span>
        }
        <span class="biz-switcher-text">
          <span class="biz-switcher-label">{{ locale.t('nav.activeBusiness') }}</span>
          <span class="biz-switcher-name">{{ active()?.name || locale.t('app.name') }}</span>
        </span>
        <svg
          class="biz-switcher-chevron"
          [class.rotate-180]="open()"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      @if (open()) {
        <div class="biz-switcher-menu" role="listbox">
          @for (b of businesses(); track b.id) {
            <button
              type="button"
              class="biz-switcher-option"
              [class.biz-switcher-option-active]="b.id === active()?.id"
              role="option"
              [attr.aria-selected]="b.id === active()?.id"
              (click)="select(b)"
            >
              @if (logoFor(b); as src) {
                <img [src]="src" alt="" class="biz-switcher-option-logo" />
              } @else {
                <span class="biz-switcher-option-fallback">{{ b.name.slice(0, 1).toUpperCase() }}</span>
              }
              <span class="min-w-0 flex-1 truncate text-left font-medium">{{ b.name }}</span>
              @if (b.id === active()?.id) {
                <svg class="h-5 w-5 shrink-0 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              }
            </button>
          }
          <a routerLink="/app/settings" class="biz-switcher-manage" (click)="close()">
            {{ locale.t('settings.manageBusinesses') }}
          </a>
        </div>
      }
    </div>
  `,
})
export class BusinessSwitcherComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly businessContext = inject(BusinessContextService);
  readonly locale = inject(LocaleService);

  readonly open = signal(false);
  readonly businesses = signal<Business[]>([]);

  ngOnInit(): void {
    this.load();
  }

  active(): Business | undefined {
    const id = this.auth.businessId();
    return this.businesses().find((b) => b.id === id) ?? this.businesses()[0];
  }

  activeLogo(): string | null {
    return mediaUrl(this.active()?.logoUrl ?? this.auth.businessLogoUrl());
  }

  activeInitial(): string {
    return (this.active()?.name || 'B').slice(0, 1).toUpperCase();
  }

  logoFor(b: Business): string | null {
    return mediaUrl(b.logoUrl);
  }

  toggle(): void {
    this.open.update((v) => !v);
  }

  close(): void {
    this.open.set(false);
  }

  select(b: Business): void {
    this.businessContext.switchBusiness(b);
    this.close();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.biz-switcher')) {
      this.close();
    }
  }

  private load(): void {
    this.http.get<ApiResponse<Business[]>>(`${environment.apiUrl}/businesses`).subscribe({
      next: (res) => {
        const list = res.data ?? [];
        this.businesses.set(list);
        const active = list.find((b) => b.id === this.auth.businessId()) ?? list[0];
        if (active) {
          this.auth.syncBusinessFromApi(active);
        }
      },
      error: () => this.businesses.set([]),
    });
  }
}
