import { Component, HostListener, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { LocaleService } from '../core/services/locale.service';
import { ProfileAvatarComponent } from './profile-avatar.component';

@Component({
  selector: 'app-user-menu',
  standalone: true,
  imports: [RouterLink, ProfileAvatarComponent],
  template: `
    <div class="navbar-profile-group">
      <button
        type="button"
        class="navbar-lang-btn"
        (click)="toggleLang()"
        [attr.aria-label]="locale.t('lang.switch')"
      >
        {{ locale.t('lang.switch') }}
      </button>

      <div class="user-menu" [class.user-menu-open]="open()">
        <button
          type="button"
          class="user-menu-trigger"
          (click)="toggle()"
          [attr.aria-expanded]="open()"
          [attr.aria-label]="auth.user()?.fullName || locale.t('nav.settings')"
          aria-haspopup="menu"
        >
          <app-profile-avatar
            [pictureUrl]="auth.user()?.profilePictureUrl"
            [name]="auth.user()?.fullName || '?'"
            [cacheBust]="auth.avatarCacheBust()"
            imgClass="user-menu-avatar"
            fallbackClass="user-menu-fallback"
          />        </button>

        @if (open()) {
          <div class="user-menu-dropdown" role="menu">
            <div class="user-menu-header">
              <app-profile-avatar
                [pictureUrl]="auth.user()?.profilePictureUrl"
                [name]="auth.user()?.fullName || '?'"
                [cacheBust]="auth.avatarCacheBust()"
                imgClass="user-menu-header-avatar"
                fallbackClass="user-menu-header-fallback"
              />              <div class="min-w-0">
                <p class="truncate font-semibold text-slate-900">{{ auth.user()?.fullName }}</p>
                <p class="truncate text-xs text-slate-500">{{ auth.user()?.email }}</p>
              </div>
            </div>
            <a routerLink="/app/settings" class="user-menu-item" (click)="close()">
            {{ locale.t('nav.settings') }}
          </a>
            <button type="button" class="user-menu-item user-menu-logout" (click)="logout()">
              {{ locale.t('auth.logout') }}
            </button>
          </div>
        }
      </div>
    </div>
  `,
})
export class UserMenuComponent {
  readonly auth = inject(AuthService);
  readonly locale = inject(LocaleService);

  readonly open = signal(false);

  toggle(): void {
    this.open.update((v) => !v);
  }

  close(): void {
    this.open.set(false);
  }

  toggleLang(): void {
    this.locale.setLocale(this.locale.locale() === 'en' ? 'am' : 'en');
  }

  logout(): void {
    this.close();
    this.auth.logout();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.navbar-profile-group')) {
      this.close();
    }
  }
}
