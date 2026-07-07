import { Component, computed, inject, input, output } from '@angular/core';
import { LocaleService } from '../core/services/locale.service';

@Component({
  selector: 'app-pagination',
  standalone: true,
  template: `
    @if (totalPages() > 1 || totalElements() > pageSize()) {
      <nav class="pagination-bar" aria-label="Pagination">
        <p class="text-sm text-slate-500">{{ rangeLabel() }}</p>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="btn-secondary !py-1.5 !px-3 text-sm"
            [disabled]="!hasPrevious()"
            (click)="goToPage(page() - 1)"
          >
            {{ locale.t('common.previous') }}
          </button>
          <span class="min-w-[4.5rem] text-center text-sm font-medium text-slate-600 tabular-nums">
            {{ page() + 1 }} / {{ totalPages() }}
          </span>
          <button
            type="button"
            class="btn-secondary !py-1.5 !px-3 text-sm"
            [disabled]="!hasNext()"
            (click)="goToPage(page() + 1)"
          >
            {{ locale.t('common.next') }}
          </button>
        </div>
      </nav>
    }
  `,
})
export class PaginationComponent {
  readonly locale = inject(LocaleService);

  readonly page = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly totalElements = input.required<number>();
  readonly pageSize = input.required<number>();

  readonly pageChange = output<number>();

  readonly hasPrevious = computed(() => this.page() > 0);
  readonly hasNext = computed(() => this.page() < this.totalPages() - 1);

  readonly rangeLabel = computed(() => {
    const total = this.totalElements();
    if (total === 0) return '';
    const from = this.page() * this.pageSize() + 1;
    const to = Math.min(total, (this.page() + 1) * this.pageSize());
    return this.locale.t('pagination.range', { from, to, total });
  });

  goToPage(next: number) {
    if (next < 0 || next >= this.totalPages() || next === this.page()) return;
    this.pageChange.emit(next);
  }
}
