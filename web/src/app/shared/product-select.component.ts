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
import { AbstractControl, ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Product } from '../core/models/api.models';
import { ProductContextService } from '../core/services/product-context.service';
import { LocaleService } from '../core/services/locale.service';

const VIEWPORT_PAD = 8;
const MENU_GAP = 6;
const MENU_MAX_HEIGHT = 256;

@Component({
  selector: 'app-product-select',
  standalone: true,
  imports: [FormsModule, NgStyle],
  template: `
    <div class="select-root product-select-root" [class.select-root-open]="open()" #root>
      @if (label()) {
        <label class="input-label">{{ label() }}</label>
      }
      <div
        class="select-trigger product-select-combo"
        [class.select-trigger-sm]="compact()"
        [class.product-select-combo-locked]="inventoryLocked()"
      >
        <input
          #textInput
          class="product-select-text"
          type="text"
          [readOnly]="inventoryLocked()"
          [disabled]="disabled()"
          [value]="inputText()"
          (input)="onTextInput($event)"
          (focus)="onTextFocus()"
          [placeholder]="locale.t('transactions.typeWhatSold')"
          [attr.aria-expanded]="open()"
          aria-haspopup="listbox"
        />
        <button
          type="button"
          class="product-select-toggle"
          [disabled]="disabled()"
          (mousedown)="$event.preventDefault()"
          (click)="toggleOpen()"
          [attr.aria-label]="locale.t('transactions.pickFromInventory')"
        >
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
      </div>
      @if (open()) {
        <div #menu class="select-menu" role="listbox" [ngStyle]="menuStyle()">
          <button
            type="button"
            class="select-option"
            [class.select-option-sm]="compact()"
            [class.select-option-active]="!inventoryLocked()"
            role="option"
            [attr.aria-selected]="!inventoryLocked()"
            (click)="pickCustom()"
          >
            <span class="min-w-0 flex-1 truncate">{{ locale.t('transactions.noProduct') }}</span>
          </button>
          @for (p of menuProducts(); track p.id) {
            <button
              type="button"
              class="select-option"
              [class.select-option-sm]="compact()"
              [class.select-option-active]="innerProductId() === p.id"
              role="option"
              [attr.aria-selected]="innerProductId() === p.id"
              (click)="pickProduct(p.id)"
            >
              <span class="min-w-0 flex-1 truncate">{{ p.name }} ({{ p.quantityOnHand }} {{ p.unit }})</span>
            </button>
          }
        </div>
      }
    </div>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ProductSelectComponent),
      multi: true,
    },
  ],
})
export class ProductSelectComponent implements ControlValueAccessor {
  private readonly doc = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly productContext = inject(ProductContextService);

  readonly root = viewChild<ElementRef<HTMLElement>>('root');
  readonly textInput = viewChild<ElementRef<HTMLInputElement>>('textInput');
  readonly menu = viewChild<ElementRef<HTMLElement>>('menu');

  readonly label = input('');
  readonly compact = input(false);
  readonly descriptionControl = input<AbstractControl | null>(null);
  readonly locale = inject(LocaleService);

  readonly products = computed(() => this.productContext.products());
  readonly innerProductId = signal('');
  readonly inputText = signal('');
  readonly open = signal(false);
  readonly menuStyle = signal<Record<string, string>>({});
  readonly disabled = signal(false);

  readonly inventoryLocked = computed(() => {
    const id = this.innerProductId();
    return !!id && this.products().some((p) => p.id === id);
  });

  readonly menuProducts = computed(() => {
    if (this.inventoryLocked()) return this.products();
    return this.filterProductsByQuery(this.inputText());
  });

  private menuPortaled = false;
  private scrollListener: (() => void) | null = null;
  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    effect(() => {
      this.productContext.products();
      this.refreshDisplay();
    });

    effect(() => {
      if (this.open()) {
        queueMicrotask(() => {
          this.portalMenuToBody();
          this.positionMenu();
          this.bindScrollReposition();
        });
      } else {
        this.unbindScrollReposition();
        this.restoreMenuFromBody();
      }
    });

    effect(() => {
      this.inputText();
      this.menuProducts();
      if (this.open()) {
        queueMicrotask(() => this.positionMenu());
      }
    });

    this.destroyRef.onDestroy(() => {
      this.unbindScrollReposition();
      this.restoreMenuFromBody();
    });
  }

  toggleOpen(): void {
    if (this.disabled()) return;
    this.open.update((v) => !v);
  }

  pickCustom(): void {
    this.setProductId('');
    this.open.set(false);
    queueMicrotask(() => this.textInput()?.nativeElement.focus());
  }

  pickProduct(id: string): void {
    const product = this.products().find((p) => p.id === id);
    this.setProductId(id);
    if (product) {
      this.inputText.set(product.name);
      this.patchDescription(product.name);
    }
    this.open.set(false);
  }

  onTextInput(event: Event): void {
    if (this.inventoryLocked()) return;
    const text = (event.target as HTMLInputElement).value;
    this.inputText.set(text);
    this.setProductId('');
    this.patchDescription(text);
    this.updateMenuForQuery(text);
  }

  onTextFocus(): void {
    if (this.inventoryLocked()) {
      this.open.set(true);
      return;
    }
    this.updateMenuForQuery(this.inputText());
  }

  private filterProductsByQuery(query: string): Product[] {
    const q = query.trim().toLowerCase();
    const all = this.products();
    if (!q) return all;
    return all.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.sku?.toLowerCase().includes(q) ?? false)
    );
  }

  private updateMenuForQuery(query: string): void {
    if (this.inventoryLocked()) return;
    const trimmed = query.trim();
    if (!trimmed) {
      this.open.set(this.products().length > 0);
      return;
    }
    this.open.set(this.filterProductsByQuery(query).length > 0);
  }

  writeValue(v: string | null): void {
    this.innerProductId.set((v ?? '').trim());
    this.refreshDisplay();
  }

  registerOnChange(fn: (v: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.open()) return;
    const target = event.target as Node;
    const root = this.root()?.nativeElement;
    const menuEl = this.menu()?.nativeElement;
    if (root?.contains(target) || menuEl?.contains(target)) return;
    this.open.set(false);
  }

  @HostListener('window:resize')
  onResize(): void {
    if (this.open()) this.positionMenu();
  }

  private setProductId(id: string): void {
    const value = id.trim();
    if (value === this.innerProductId()) return;
    this.innerProductId.set(value);
    this.onChange(value);
    this.onTouched();
  }

  private patchDescription(text: string): void {
    const ctrl = this.descriptionControl();
    if (!ctrl || ctrl.disabled) return;
    ctrl.setValue(text, { emitEvent: true });
    ctrl.markAsDirty();
  }

  private refreshDisplay(): void {
    const id = this.innerProductId();
    if (id) {
      const product = this.products().find((p) => p.id === id);
      if (product) {
        this.inputText.set(product.name);
        return;
      }
    }
    const desc = String(this.descriptionControl()?.value ?? '').trim();
    this.inputText.set(desc);
  }

  private portalMenuToBody(): void {
    const menuEl = this.menu()?.nativeElement;
    if (!menuEl || menuEl.parentElement === this.doc.body) return;
    this.doc.body.appendChild(menuEl);
    this.menuPortaled = true;
  }

  private restoreMenuFromBody(): void {
    const menuEl = this.menu()?.nativeElement;
    const rootEl = this.root()?.nativeElement;
    if (!this.menuPortaled || !menuEl || !rootEl) return;
    if (menuEl.parentElement === this.doc.body) {
      rootEl.appendChild(menuEl);
    }
    this.menuPortaled = false;
  }

  private positionMenu(): void {
    const combo = this.root()?.nativeElement.querySelector('.product-select-combo') as HTMLElement | null;
    const menuEl = this.menu()?.nativeElement;
    if (!combo) return;

    const rect = combo.getBoundingClientRect();
    const menuHeight = menuEl?.offsetHeight || 200;
    const spaceBelow = window.innerHeight - rect.bottom - MENU_GAP - VIEWPORT_PAD;
    const spaceAbove = rect.top - MENU_GAP - VIEWPORT_PAD;

    let top = rect.bottom + MENU_GAP;
    let maxHeight = Math.min(MENU_MAX_HEIGHT, Math.max(120, spaceBelow));
    if (spaceBelow < menuHeight && spaceAbove > spaceBelow) {
      maxHeight = Math.min(MENU_MAX_HEIGHT, spaceAbove);
      top = Math.max(VIEWPORT_PAD, rect.top - MENU_GAP - maxHeight);
    }

    let left = Math.max(VIEWPORT_PAD, Math.min(rect.left, window.innerWidth - rect.width - VIEWPORT_PAD));

    this.menuStyle.set({
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      width: `${rect.width}px`,
      minWidth: `${rect.width}px`,
      maxHeight: `${maxHeight}px`,
      zIndex: '13000',
    });
  }

  private bindScrollReposition(): void {
    this.unbindScrollReposition();
    const handler = () => {
      if (this.open()) this.positionMenu();
    };
    window.addEventListener('scroll', handler, true);
    this.scrollListener = () => window.removeEventListener('scroll', handler, true);
  }

  private unbindScrollReposition(): void {
    this.scrollListener?.();
    this.scrollListener = null;
  }
}
