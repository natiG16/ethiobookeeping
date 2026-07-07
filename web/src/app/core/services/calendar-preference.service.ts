import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiResponse, User } from '../models/api.models';

export type CalendarSystem = 'ethiopian' | 'gregorian';

const STORAGE_KEY = 'calendarSystem';

@Injectable({ providedIn: 'root' })
export class CalendarPreferenceService {
  private readonly http = inject(HttpClient);

  readonly calendarSystem = signal<CalendarSystem>(this.readStored());

  isEthiopian(): boolean {
    return this.calendarSystem() === 'ethiopian';
  }

  isGregorian(): boolean {
    return this.calendarSystem() === 'gregorian';
  }

  applyFromUser(user: User | null | undefined): void {
    if (!user?.calendarSystem) {
      return;
    }
    const value = normalize(user.calendarSystem);
    this.calendarSystem.set(value);
    localStorage.setItem(STORAGE_KEY, value);
  }

  setCalendarSystem(system: CalendarSystem): void {
    this.calendarSystem.set(system);
    localStorage.setItem(STORAGE_KEY, system);
    this.http
      .patch<ApiResponse<User>>(`${environment.apiUrl}/users/me`, { calendarSystem: system })
      .subscribe({ error: () => {} });
  }

  private readStored(): CalendarSystem {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'gregorian' ? 'gregorian' : 'ethiopian';
  }
}

function normalize(raw: string): CalendarSystem {
  return raw.toLowerCase() === 'gregorian' ? 'gregorian' : 'ethiopian';
}
