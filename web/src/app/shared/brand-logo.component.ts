import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-brand-logo',
  standalone: true,
  template: `
    <div class="inline-flex items-center gap-3" [class]="size() === 'lg' ? 'gap-4' : 'gap-3'">
      <div
        class="relative flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 via-brand-600 to-brand-800 font-bold text-white shadow-lg shadow-brand-600/30 ring-2 ring-white/20"
        [class]="size() === 'lg' ? 'h-14 w-14 text-2xl' : size() === 'sm' ? 'h-9 w-9 text-sm' : 'h-11 w-11 text-lg'"
      >
        <span class="relative z-10">{{ initial() }}</span>
        <span class="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/10 to-transparent"></span>
      </div>
      @if (showText()) {
        <div class="min-w-0">
          <p
            class="font-display font-bold leading-tight tracking-tight"
            [class]="size() === 'lg' ? 'text-2xl' : compactMobile() ? 'text-sm sm:text-base' : 'text-base'"
          >
            {{ name() }}
          </p>
          @if (subtitle()) {
            <p class="truncate text-xs text-slate-500" [class]="compactMobile() ? 'hidden sm:block' : ''">{{ subtitle() }}</p>
          }
        </div>
      }
    </div>
  `,
})
export class BrandLogoComponent {
  readonly name = input('mysuq');
  readonly subtitle = input<string | undefined>(undefined);
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly showText = input(true);
  /** Hides tagline on small screens; keeps app name readable in mobile navbars */
  readonly compactMobile = input(false);

  readonly initial = computed(() => (this.name()?.charAt(0) || 'M').toUpperCase());
}
