import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AdminAccount, ApiResponse } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/admin`;

  listAccounts() {
    return this.http.get<ApiResponse<AdminAccount[]>>(`${this.base}/accounts`);
  }

  setUserActive(userId: string, active: boolean) {
    return this.http.patch<ApiResponse<AdminAccount>>(`${this.base}/users/${userId}/status`, { active });
  }

  updateSubscription(
    businessId: string,
    body: { subscriptionPlan: string; subscriptionActive: boolean; supportNotes?: string }
  ) {
    return this.http.patch<ApiResponse<AdminAccount>>(`${this.base}/businesses/${businessId}/subscription`, body);
  }
}
