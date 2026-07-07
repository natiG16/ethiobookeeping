import { Component, computed, effect, input, signal } from '@angular/core';
import { mediaUrl } from '../core/utils/media-url';
import {
  builtinLogoJpg,
  findPaymentMethod,
  isBuiltInPaymentMethod,
  paymentMethodInitial,
  paymentMethodLogoSources,
} from './payment-methods';

@Component({
  selector: 'app-payment-method-logo',
  standalone: true,
  template: `
    @if (showUploadedImage()) {
      <img
        [src]="uploadedSrc()!"
        [alt]="alt()"
        [class]="imgClass()"
        (error)="onUploadError()"
      />
    } @else if (showBuiltInImage()) {
      <img
        [src]="builtInSrc()!"
        [alt]="alt()"
        [class]="imgClass()"
        (error)="onBuiltInError()"
      />
    } @else {
      <span [class]="letterClass()" [attr.aria-label]="alt()" role="img">{{ initial() }}</span>
    }
  `,
})
export class PaymentMethodLogoComponent {
  readonly methodId = input.required<string>();
  readonly logoUrl = input<string | null | undefined>(undefined);
  readonly alt = input('');
  readonly size = input<'sm' | 'md' | 'lg'>('md');

  private readonly uploadFailed = signal(false);
  private readonly builtInFailed = signal(false);
  private readonly builtInFallbackStep = signal(0);

  readonly imgClass = computed(() => {
    const base = 'shrink-0 rounded-lg object-contain';
    const sizes =
      this.size() === 'lg' ? 'h-10 w-10' : this.size() === 'sm' ? 'h-5 w-5' : 'h-8 w-8';
    return `${base} ${sizes}`;
  });

  readonly letterClass = computed(() => {
    const sizes =
      this.size() === 'lg'
        ? 'h-10 w-10 text-base'
        : this.size() === 'sm'
          ? 'h-5 w-5 text-[10px]'
          : 'h-8 w-8 text-sm';
    return `inline-flex shrink-0 items-center justify-center rounded-lg border border-brand-200 bg-brand-50 font-bold text-brand-800 ${sizes}`;
  });

  readonly uploadedSrc = computed(() => {
    if (this.uploadFailed()) return null;
    return mediaUrl(this.logoUrl());
  });

  readonly builtInSrc = computed(() => {
    if (this.builtInFailed() || !isBuiltInPaymentMethod(this.methodId())) return null;
    const sources = paymentMethodLogoSources(this.methodId());
    const slug = this.builtinSlug();
    const step = this.builtInFallbackStep();
    if (step === 0) return sources.primary;
    if (step === 1 && slug) return builtinLogoJpg(slug);
    return sources.fallback;
  });

  readonly showUploadedImage = computed(() => !!this.uploadedSrc());

  readonly showBuiltInImage = computed(
    () => !this.showUploadedImage() && !!this.builtInSrc()
  );

  readonly initial = computed(() => paymentMethodInitial(this.displayName()));

  private displayName(): string {
    return findPaymentMethod(this.methodId())?.label ?? this.methodId();
  }

  onUploadError(): void {
    this.uploadFailed.set(true);
  }

  onBuiltInError(): void {
    const step = this.builtInFallbackStep();
    if (step < 2) {
      this.builtInFallbackStep.set(step + 1);
    } else {
      this.builtInFailed.set(true);
    }
  }

  private builtinSlug(): string | null {
    return findPaymentMethod(this.methodId())?.assetSlug ?? null;
  }

  constructor() {
    effect(() => {
      this.methodId();
      this.logoUrl();
      this.uploadFailed.set(false);
      this.builtInFailed.set(false);
      this.builtInFallbackStep.set(0);
    });
  }
}
