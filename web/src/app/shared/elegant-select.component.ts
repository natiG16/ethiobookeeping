import { DOCUMENT, NgStyle } from '@angular/common';

import {

  Component,

  computed,

  DestroyRef,

  effect,

  ElementRef,

  forwardRef,

  HostListener,

  inject,

  input,

  signal,

  viewChild,

} from '@angular/core';

import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { paymentMethodInitial } from './payment-methods';



export interface ElegantSelectOption {

  value: string;

  label: string;

  iconSrc?: string;

  iconFallbackSrc?: string;

}



const VIEWPORT_PAD = 8;

const MENU_GAP = 6;

const MENU_MAX_HEIGHT = 256;



@Component({

  selector: 'app-elegant-select',

  standalone: true,

  imports: [FormsModule, NgStyle],

  template: `

    <div class="select-root" [class.select-root-open]="open()" #root>

      @if (label()) {

        <label class="input-label">{{ label() }}</label>

      }

      <button

        #trigger

        type="button"

        class="select-trigger"

        [class.select-trigger-sm]="size() === 'sm'"

        [disabled]="isDisabled()"

        [attr.aria-expanded]="open()"

        aria-haspopup="listbox"

        (click)="toggle()"

      >

        <span class="flex min-w-0 flex-1 items-center gap-2 text-left sm:gap-3">

          @if (selectedOption(); as opt) {

            @if (iconUrl(opt); as src) {
              <img
                [class]="iconSizeClass()"
                class="shrink-0 rounded-lg object-contain"
                [src]="src"
                alt=""
                (error)="onIconError(opt)"
              />
            } @else if (opt.value) {
              <span [class]="optionLetterClass()">{{ optionLetter(opt) }}</span>
            }
            <span class="truncate">{{ opt.label }}</span>

          } @else {

            <span class="truncate text-slate-400">{{ placeholder() }}</span>

          }

        </span>

        <svg

          class="h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200"

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

        <div #menu class="select-menu" role="listbox" [ngStyle]="menuStyle()">

          @for (opt of options(); track opt.value) {

            <button

              type="button"

              class="select-option"

              [class.select-option-sm]="size() === 'sm'"

              [class.select-option-active]="opt.value === value()"

              role="option"

              [attr.aria-selected]="opt.value === value()"

              (click)="pick(opt.value)"

            >

              @if (iconUrl(opt); as src) {
                <img
                  [class]="iconSizeClass()"
                  class="shrink-0 rounded-lg object-contain"
                  [src]="src"
                  alt=""
                  (error)="onIconError(opt)"
                />
              } @else if (opt.value) {
                <span [class]="optionLetterClass()">{{ optionLetter(opt) }}</span>
              }
              <span class="min-w-0 flex-1 truncate">{{ opt.label }}</span>

              @if (opt.value === value()) {

                <svg

                  class="h-5 w-5 shrink-0 text-brand-600"

                  fill="none"

                  viewBox="0 0 24 24"

                  stroke="currentColor"

                  stroke-width="2.5"

                  aria-hidden="true"

                >

                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />

                </svg>

              }

            </button>

          }

        </div>

      }

    </div>

  `,

  providers: [

    {

      provide: NG_VALUE_ACCESSOR,

      useExisting: forwardRef(() => ElegantSelectComponent),

      multi: true,

    },

  ],

})

export class ElegantSelectComponent implements ControlValueAccessor {

  private readonly doc = inject(DOCUMENT);

  private readonly destroyRef = inject(DestroyRef);



  readonly root = viewChild<ElementRef<HTMLElement>>('root');

  readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');

  readonly menu = viewChild<ElementRef<HTMLElement>>('menu');



  readonly label = input('');

  readonly placeholder = input('Select…');

  readonly options = input<ElegantSelectOption[]>([]);

  readonly size = input<'md' | 'sm'>('md');

  /** below | above: fixed side; auto: flip when there is not enough room below. */

  readonly placement = input<'below' | 'above' | 'auto'>('auto');



  readonly open = signal(false);

  readonly menuStyle = signal<Record<string, string>>({});

  private readonly disabledFromForm = signal(false);

  readonly disabledInput = input(false, { alias: 'disabled' });

  readonly isDisabled = computed(() => this.disabledFromForm() || this.disabledInput());

  readonly value = signal('');



  readonly iconSizeClass = computed(() =>

    this.size() === 'sm' ? 'h-6 w-6' : 'h-8 w-8'

  );



  private readonly failedIcons = signal(new Set<string>());

  private scrollListener: (() => void) | null = null;

  private menuPortaled = false;



  private onChange: (v: string) => void = () => {};

  private onTouched: () => void = () => {};



  constructor() {

    effect(() => {

      if (this.open()) {

        queueMicrotask(() => {

          this.portalMenuToBody();

          this.positionMenu();

          this.bindScrollReposition();

          if (this.placement() === 'above') {

            requestAnimationFrame(() => {

              if (this.open()) {

                this.positionMenu();

              }

            });

          }

        });

      } else {

        this.unbindScrollReposition();

        this.restoreMenuFromBody();

      }

    });



    this.destroyRef.onDestroy(() => {

      this.unbindScrollReposition();

      this.restoreMenuFromBody();

    });

  }



  selectedOption(): ElegantSelectOption | undefined {

    return this.options().find((o) => o.value === this.value());

  }



  iconUrl(opt: ElegantSelectOption | undefined): string | undefined {

    if (!opt?.iconSrc) return undefined;

    const key = opt.value;

    if (this.failedIcons().has(key) && opt.iconFallbackSrc) {

      return opt.iconFallbackSrc;

    }

    if (this.failedIcons().has(key)) {

      return undefined;

    }

    return opt.iconSrc;

  }



  onIconError(opt: ElegantSelectOption) {
    this.failedIcons.update((set) => {
      const next = new Set(set);
      next.add(opt.value);
      return next;
    });
  }

  optionLetter(opt: ElegantSelectOption): string {
    return paymentMethodInitial(opt.label || opt.value);
  }

  optionLetterClass(): string {
    const size = this.iconSizeClass();
    return `inline-flex shrink-0 items-center justify-center rounded-lg border border-brand-200 bg-brand-50 font-bold text-brand-800 ${size}`;
  }



  toggle() {

    if (this.isDisabled()) return;

    this.open.update((v) => !v);

  }



  private portalMenuToBody(): void {

    const menuEl = this.menu()?.nativeElement;

    if (!menuEl || menuEl.parentElement === this.doc.body) {

      return;

    }

    this.doc.body.appendChild(menuEl);

    this.menuPortaled = true;

  }



  private restoreMenuFromBody(): void {

    const menuEl = this.menu()?.nativeElement;

    const rootEl = this.root()?.nativeElement;

    if (!this.menuPortaled || !menuEl || !rootEl) {

      return;

    }

    if (menuEl.parentElement === this.doc.body) {

      rootEl.appendChild(menuEl);

    }

    this.menuPortaled = false;

  }



  private positionMenu(): void {

    const btn = this.trigger()?.nativeElement;

    const menuEl = this.menu()?.nativeElement;

    if (!btn) return;



    const rect = btn.getBoundingClientRect();

    const menuHeight = menuEl?.offsetHeight || 200;

    const spaceBelow = window.innerHeight - rect.bottom - MENU_GAP - VIEWPORT_PAD;

    const spaceAbove = rect.top - MENU_GAP - VIEWPORT_PAD;



    let top = rect.bottom + MENU_GAP;

    let maxHeight = MENU_MAX_HEIGHT;

    let openAbove = false;



    if (this.placement() === 'above') {

      maxHeight = Math.min(MENU_MAX_HEIGHT, Math.max(120, spaceAbove));

      const measured = menuEl?.offsetHeight ?? 0;

      const usedHeight = measured > 0 ? Math.min(measured, maxHeight) : maxHeight;

      top = Math.max(VIEWPORT_PAD, rect.top - MENU_GAP - usedHeight);

      if (measured > 0) {

        maxHeight = Math.min(maxHeight, rect.top - MENU_GAP - top);

      }

    } else if (this.placement() === 'below') {

      maxHeight = Math.min(MENU_MAX_HEIGHT, Math.max(120, spaceBelow));

      if (top + maxHeight > window.innerHeight - VIEWPORT_PAD) {

        maxHeight = Math.max(120, window.innerHeight - VIEWPORT_PAD - top);

      }

    } else {

      openAbove = spaceBelow < menuHeight && spaceAbove > spaceBelow;

      if (openAbove) {

        maxHeight = Math.min(MENU_MAX_HEIGHT, spaceAbove);

        top = Math.max(VIEWPORT_PAD, rect.top - MENU_GAP - maxHeight);

      } else {

        maxHeight = Math.min(MENU_MAX_HEIGHT, spaceBelow);

        if (top + maxHeight > window.innerHeight - VIEWPORT_PAD) {

          maxHeight = Math.max(120, window.innerHeight - VIEWPORT_PAD - top);

        }

      }

    }



    let left = rect.left;

    const width = rect.width;

    if (left + width > window.innerWidth - VIEWPORT_PAD) {

      left = window.innerWidth - width - VIEWPORT_PAD;

    }

    left = Math.max(VIEWPORT_PAD, left);



    this.menuStyle.set({

      position: 'fixed',

      top: `${top}px`,

      left: `${left}px`,

      width: `${width}px`,

      minWidth: `${width}px`,

      maxHeight: `${Math.max(120, maxHeight)}px`,

      zIndex: '13000',

    });

  }



  @HostListener('window:resize')

  onResize(): void {

    if (this.open()) {

      this.positionMenu();

    }

  }



  private bindScrollReposition(): void {

    this.unbindScrollReposition();

    const handler = () => {

      if (this.open()) {

        this.positionMenu();

      }

    };

    window.addEventListener('scroll', handler, true);

    this.scrollListener = () => window.removeEventListener('scroll', handler, true);

  }



  private unbindScrollReposition(): void {

    this.scrollListener?.();

    this.scrollListener = null;

  }



  pick(v: string) {

    this.value.set(v);

    this.onChange(v);

    this.onTouched();

    this.open.set(false);

  }



  @HostListener('document:click', ['$event'])

  onDocumentClick(event: MouseEvent) {

    if (!this.open()) return;

    const target = event.target as Node;

    const root = this.root()?.nativeElement;

    const menuEl = this.menu()?.nativeElement;

    if (root?.contains(target) || menuEl?.contains(target)) {

      return;

    }

    this.open.set(false);

  }



  writeValue(v: string | null): void {

    this.value.set(v ?? '');

  }



  registerOnChange(fn: (v: string) => void): void {

    this.onChange = fn;

  }



  registerOnTouched(fn: () => void): void {

    this.onTouched = fn;

  }



  setDisabledState(isDisabled: boolean): void {

    this.disabledFromForm.set(isDisabled);

  }

}


