import { Injectable, inject, signal, DestroyRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, map, tap } from 'rxjs/operators';
import { EMPTY, Observable } from 'rxjs';
import { isServiceDeactivatedError } from '../utils/http-error';
import { CalendarPreferenceService } from './calendar-preference.service';
import { environment } from '../../../environments/environment';
import { ApiResponse, AuthResponse, RegisterResponse, SubscriptionPlan, User } from '../models/api.models';
import { PlanId } from '../config/subscription.config';
import { getTokenExpiryMs, getTokenRole, isTokenExpired } from '../utils/jwt';

const SESSION_EXPIRED_KEY = 'sessionExpired';
const SESSION_DEACTIVATED_KEY = 'serviceDeactivated';
const SESSION_ROLE_KEY = 'sessionRole';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly calendarPref = inject(CalendarPreferenceService);
  private readonly base = environment.apiUrl;

  private sessionTimer: ReturnType<typeof setTimeout> | null = null;
  private sessionInterval: ReturnType<typeof setInterval> | null = null;

  readonly user = signal<User | null>(null);
  readonly businessId = signal<string | null>(null);
  readonly businessName = signal<string | null>(null);
  readonly businessLogoUrl = signal<string | null>(null);
  readonly subscriptionPlan = signal<PlanId>('starter');
  readonly subscriptionActive = signal<boolean>(true);
  /** Bumped after avatar upload so img src cache-busts. */
  readonly avatarCacheBust = signal(0);

  constructor() {
    const stored = localStorage.getItem('user');
    const bid = localStorage.getItem('businessId');
    const bname = localStorage.getItem('businessName');
    const blogo = localStorage.getItem('businessLogoUrl');
    const plan = localStorage.getItem('subscriptionPlan') as PlanId | null;
    const subActive = localStorage.getItem('subscriptionActive');
    if (stored) {
      try {
        const u = JSON.parse(stored) as User;
        this.user.set(u);
        this.calendarPref.applyFromUser(u);
        const subInactive = subActive === 'false';
        if (u.role !== 'ADMIN' && (u.active === false || subInactive)) {
          queueMicrotask(() => this.handleServiceDeactivated());
        }
      } catch {
        /* ignore */
      }
    }
    const sessionRole = localStorage.getItem(SESSION_ROLE_KEY);
    if (sessionRole === 'ADMIN' && stored) {
      try {
        const u = JSON.parse(stored) as User;
        if (u.role !== 'ADMIN') {
          const fixed = { ...u, role: 'ADMIN' };
          this.user.set(fixed);
          localStorage.setItem('user', JSON.stringify(fixed));
        }
      } catch {
        /* ignore */
      }
    }
    if (bid) this.businessId.set(bid);
    if (bname) this.businessName.set(bname);
    if (blogo) this.businessLogoUrl.set(blogo);
    if (plan === 'starter' || plan === 'business' || plan === 'pro') {
      this.subscriptionPlan.set(plan);
    }
    if (subActive != null) {
      this.subscriptionActive.set(subActive === 'true');
    }
    this.syncRoleFromToken();
    this.startSessionMonitor();
    if (this.isLoggedIn() && !this.isAdmin()) {
      queueMicrotask(() => this.refreshAccountStatus().subscribe());
    }
  }

  /** Role from stored user or JWT (JWT wins when they differ — e.g. after token refresh). */
  currentRole(): string | null {
    const jwtRole = getTokenRole(this.token);
    if (jwtRole) return jwtRole;
    return this.user()?.role ?? null;
  }

  isAdmin(): boolean {
    if (localStorage.getItem(SESSION_ROLE_KEY) === 'ADMIN') {
      return true;
    }
    if (this.currentRole() === 'ADMIN') {
      return true;
    }
    try {
      const stored = localStorage.getItem('user');
      if (stored && (JSON.parse(stored) as User).role === 'ADMIN') {
        return true;
      }
    } catch {
      /* ignore */
    }
    return false;
  }

  homeRoute(): string {
    return this.isAdmin() ? '/admin/accounts' : '/app/dashboard';
  }

  private setSessionRole(role: string | undefined) {
    if (role === 'ADMIN') {
      localStorage.setItem(SESSION_ROLE_KEY, 'ADMIN');
    } else {
      localStorage.removeItem(SESSION_ROLE_KEY);
    }
  }

  /** Keep user.role in sync with JWT claims. */
  syncRoleFromToken(): void {
    const role = getTokenRole(this.token);
    if (!role) return;
    const current = this.user();
    if (!current) {
      return;
    }
    if (current.role !== role) {
      const updated = { ...current, role };
      this.user.set(updated);
      localStorage.setItem('user', JSON.stringify(updated));
    }
  }

  /** Navigate to admin or customer home after sign-in. */
  navigateAfterLogin(): void {
    this.syncRoleFromToken();
    const url = this.isAdmin() ? '/admin/accounts' : '/app/dashboard';
    void this.router.navigateByUrl(url, { replaceUrl: true });
  }

  setSubscriptionPlan(plan: SubscriptionPlan | string | undefined) {
    const normalized = this.normalizePlan(plan);
    this.subscriptionPlan.set(normalized);
    localStorage.setItem('subscriptionPlan', normalized);
  }

  private normalizePlan(plan: SubscriptionPlan | string | undefined): PlanId {
    if (plan === 'business' || plan === 'pro') return plan;
    return 'starter';
  }

  get token(): string | null {
    return localStorage.getItem('accessToken');
  }

  isLoggedIn(): boolean {
    return !!this.token && !isTokenExpired(this.token);
  }

  /** False when admin deactivated the user or the business subscription is inactive. */
  isServiceActive(): boolean {
    if (this.isAdmin()) return true;
    const u = this.user();
    if (u?.active === false) return false;
    return this.subscriptionActive();
  }

  /** Sync user.active from the server; logs out if admin deactivated the account. */
  refreshAccountStatus(): Observable<User | null> {
    if (!this.token || this.isAdmin()) {
      return EMPTY;
    }
    return this.http.get<ApiResponse<User>>(`${this.base}/users/me`).pipe(
      tap((res) => {
        const u = res.data;
        if (u.active === false) {
          this.handleServiceDeactivated();
          return;
        }
        const current = this.user();
        const updated = current
          ? { ...current, ...u, active: u.active }
          : { ...u, active: u.active };
        this.user.set(updated);
        localStorage.setItem('user', JSON.stringify(updated));
        if (u.profilePictureUrl) {
          this.avatarCacheBust.set(Date.now());
        }
      }),
      map((res) => res.data),
      catchError((err) => {
        if (isServiceDeactivatedError(err)) {
          this.handleServiceDeactivated();
        }
        return EMPTY;
      })
    );
  }

  handleServiceDeactivated() {
    sessionStorage.setItem(SESSION_DEACTIVATED_KEY, '1');
    this.clearSessionAndState();
    void this.router.navigate(['/login']);
  }

  consumeServiceDeactivatedFlag(): boolean {
    const v = sessionStorage.getItem(SESSION_DEACTIVATED_KEY) === '1';
    if (v) sessionStorage.removeItem(SESSION_DEACTIVATED_KEY);
    return v;
  }

  hasValidSession(): boolean {
    return this.isLoggedIn();
  }

  /** Call after login or on app bootstrap when tokens exist. */
  startSessionMonitor(): void {
    this.clearSessionMonitor();
    const token = this.token;
    if (!token) return;

    if (isTokenExpired(token)) {
      this.handleSessionExpired();
      return;
    }

    const exp = getTokenExpiryMs(token);
    if (exp) {
      const msUntilExpiry = Math.max(0, exp - Date.now());
      this.sessionTimer = setTimeout(() => this.handleSessionExpired(), msUntilExpiry);
    }

    this.sessionInterval = setInterval(() => {
      if (isTokenExpired(this.token)) {
        this.handleSessionExpired();
        return;
      }
      if (!this.isAdmin()) {
        this.refreshAccountStatus().subscribe();
      }
    }, 30_000);

    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      if (isTokenExpired(this.token)) {
        this.handleSessionExpired();
        return;
      }
      if (!this.isAdmin()) {
        this.refreshAccountStatus().subscribe();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    this.destroyRef.onDestroy(() => document.removeEventListener('visibilitychange', onVisible));
  }

  handleSessionExpired(): void {
    if (!this.token && !localStorage.getItem('refreshToken')) return;
    sessionStorage.setItem(SESSION_EXPIRED_KEY, '1');
    this.clearSessionAndState();
    this.router.navigate(['/login']);
  }

  consumeSessionExpiredFlag(): boolean {
    const v = sessionStorage.getItem(SESSION_EXPIRED_KEY) === '1';
    if (v) sessionStorage.removeItem(SESSION_EXPIRED_KEY);
    return v;
  }

  register(body: Record<string, unknown>) {
    return this.http.post<ApiResponse<RegisterResponse>>(`${this.base}/auth/register`, body);
  }

  verifyEmail(token: string) {
    return this.http
      .post<ApiResponse<AuthResponse>>(`${this.base}/auth/verify-email`, { token })
      .pipe(tap((res) => this.persistAuth(res.data)));
  }

  resendVerification(email: string) {
    return this.http.post<ApiResponse<unknown>>(`${this.base}/auth/resend-verification`, { email });
  }

  login(email: string, password: string) {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.base}/auth/login`, { email, password }).pipe(
      tap((res) => this.persistAuth(res.data))
    );
  }

  googleAuth(idToken: string, businessName?: string) {
    return this.http
      .post<ApiResponse<AuthResponse>>(`${this.base}/auth/google`, { idToken, businessName })
      .pipe(tap((res) => this.persistAuth(res.data)));
  }

  requestPhoneOtp(phone: string, channel: 'TELEGRAM' | 'WHATSAPP' = 'TELEGRAM') {
    return this.http.post<ApiResponse<{ existingUser: boolean }>>(`${this.base}/auth/otp/request`, {
      phone,
      channel,
    });
  }

  verifyPhoneOtp(body: {
    phone: string;
    code: string;
    fullName?: string;
    businessName?: string;
    businessType?: string;
    locale?: string;
  }) {
    return this.http
      .post<ApiResponse<AuthResponse>>(`${this.base}/auth/otp/verify`, body)
      .pipe(tap((res) => this.persistAuth(res.data)));
  }

  private persistAuth(data: AuthResponse) {
    const jwtRole = getTokenRole(data.accessToken);
    const role = data.user?.role === 'ADMIN' || jwtRole === 'ADMIN' ? 'ADMIN' : (data.user?.role ?? jwtRole ?? 'OWNER');
    const user: User = {
      ...data.user,
      role,
      active: data.user?.active ?? true,
    };

    if (role !== 'ADMIN' && (user.active === false || data.subscriptionActive === false)) {
      sessionStorage.setItem(SESSION_DEACTIVATED_KEY, '1');
      throw new Error('SERVICE_DEACTIVATED');
    }

    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    this.user.set(user);
    this.calendarPref.applyFromUser(user);
    if (user.profilePictureUrl) {
      this.avatarCacheBust.set(Date.now());
    }
    this.setSessionRole(role);

    const admin = role === 'ADMIN';
    if (admin) {
      localStorage.removeItem('businessId');
      localStorage.removeItem('businessName');
      this.businessId.set(null);
      this.businessName.set(null);
    } else if (data.businessId) {
      localStorage.setItem('businessId', data.businessId);
      this.businessId.set(data.businessId);
    } else {
      this.loadBusiness();
    }

    if (!admin && data.businessName) {
      localStorage.setItem('businessName', data.businessName);
      this.businessName.set(data.businessName);
    }
    if (data.subscriptionPlan) {
      this.setSubscriptionPlan(data.subscriptionPlan);
    }
    if (data.subscriptionActive != null) {
      this.setSubscriptionActive(data.subscriptionActive);
    }
    this.syncRoleFromToken();
    this.startSessionMonitor();
    if (admin) {
      void this.router.navigateByUrl('/admin/accounts', { replaceUrl: true });
    } else {
      void this.router.navigateByUrl('/app/dashboard', { replaceUrl: true });
    }
  }

  setSubscriptionActive(active: boolean) {
    this.subscriptionActive.set(active);
    localStorage.setItem('subscriptionActive', String(active));
  }

  syncBusinessFromApi(business: {
    id?: string;
    name?: string;
    logoUrl?: string | null;
    subscriptionPlan?: string;
    subscriptionActive?: boolean;
  }) {
    if (business.id) {
      localStorage.setItem('businessId', business.id);
      this.businessId.set(business.id);
    }
    if (business.name) {
      localStorage.setItem('businessName', business.name);
      this.businessName.set(business.name);
    }
    if (business.logoUrl !== undefined) {
      const url = business.logoUrl || '';
      if (url) {
        localStorage.setItem('businessLogoUrl', url);
        this.businessLogoUrl.set(url);
      } else {
        localStorage.removeItem('businessLogoUrl');
        this.businessLogoUrl.set(null);
      }
    }
    if (business.subscriptionPlan) {
      this.setSubscriptionPlan(business.subscriptionPlan);
    }
    if (business.subscriptionActive != null) {
      this.setSubscriptionActive(business.subscriptionActive);
    }
  }

  loadBusiness() {
    this.http
      .get<
        ApiResponse<
          { id: string; name: string; subscriptionPlan?: string; subscriptionActive?: boolean }[]
        >
      >(`${this.base}/businesses`)
      .subscribe({
        next: (res) => {
          const biz = res.data?.[0];
          if (biz) this.syncBusinessFromApi(biz);
        },
        error: (err) => {
          if (isServiceDeactivatedError(err)) {
            this.handleServiceDeactivated();
          }
        },
      });
  }

  logout() {
    this.clearSessionAndState();
    this.router.navigate(['/login']);
  }

  private clearSessionAndState() {
    this.clearSessionMonitor();
    localStorage.clear();
    this.user.set(null);
    this.businessId.set(null);
    this.businessName.set(null);
    this.subscriptionPlan.set('starter');
    this.subscriptionActive.set(true);
  }

  private clearSessionMonitor() {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }
    if (this.sessionInterval) {
      clearInterval(this.sessionInterval);
      this.sessionInterval = null;
    }
  }
}
