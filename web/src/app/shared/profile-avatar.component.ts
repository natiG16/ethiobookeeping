import { Component, computed, effect, input, signal } from '@angular/core';
import { isExternalMediaUrl, mediaUrl } from '../core/utils/media-url';

@Component({
  selector: 'app-profile-avatar',
  standalone: true,
  template: `
    @if (resolvedSrc(); as src) {
      <img
        [src]="src"
        alt=""
        [class]="imgClass()"
        referrerpolicy="no-referrer"
        (error)="onError()"
      />
    } @else {
      <span [class]="fallbackClass()" aria-hidden="true">{{ initials() }}</span>
    }
  `,
})
export class ProfileAvatarComponent {
  readonly pictureUrl = input<string | null | undefined>(null);
  readonly name = input('?');
  readonly imgClass = input('h-full w-full rounded-full object-cover');
  readonly fallbackClass = input(
    'flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-700 text-xs font-bold text-white'
  );
  readonly cacheBust = input<number | string | undefined>(undefined);

  private readonly loadFailed = signal(false);

  constructor() {
    effect(() => {
      this.pictureUrl();
      this.cacheBust();
      this.loadFailed.set(false);
    });
  }

  readonly resolvedSrc = computed(() => {
    if (this.loadFailed()) return null;
    return mediaUrl(this.pictureUrl(), this.cacheBust());
  });

  initials(): string {
    const n = this.name().trim() || '?';
    return n
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  onError(): void {
    const url = mediaUrl(this.pictureUrl());
    if (url && isExternalMediaUrl(url)) {
      this.loadFailed.set(true);
      return;
    }
    this.loadFailed.set(true);
  }
}
