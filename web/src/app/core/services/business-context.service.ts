import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, Subject, map, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, Business } from '../models/api.models';
import { AuthService } from './auth.service';
import { LocaleService } from './locale.service';
import { ToastService } from './toast.service';

@Injectable({ providedIn: 'root' })
export class BusinessContextService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly locale = inject(LocaleService);
  private readonly changed$ = new Subject<string>();

  /** Fires when the user selects a different business (not on initial page sync). */
  readonly businessChanged$ = this.changed$.asObservable();

  /** Updates active business and notifies listeners when the id changes. */
  switchBusiness(business: Business): void {
    const prev = this.auth.businessId();
    this.auth.syncBusinessFromApi(business);
    if (business.id && business.id !== prev) {
      this.changed$.next(business.id);
      this.toast.success(this.locale.t('toast.switchedBusiness', { name: business.name }));
    }
  }

  /** Resolves the current user's business id, validating cache against the API. */
  ensureBusinessId(): Observable<string> {
    return this.http.get<ApiResponse<Business[]>>(`${environment.apiUrl}/businesses`).pipe(
      map((res) => {
        const businesses = res.data ?? [];
        const cached = this.auth.businessId();
        const match = cached ? businesses.find((b) => b.id === cached) : businesses[0];
        const biz = match ?? businesses[0];
        if (biz) {
          this.auth.syncBusinessFromApi(biz);
        }
        return biz?.id ?? null;
      }),
      switchMap((id) => (id ? of(id) : throwError(() => new Error('No business found'))))
    );
  }
}
