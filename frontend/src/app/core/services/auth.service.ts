import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { User, UserRole } from '../models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:5000/api/auth';
  private tokenKey = 'gov_budget_jwt_token';
  private userKey = 'gov_budget_user_data';

  public currentUser = signal<User | null>(this.getStoredUser());
  public isAuthenticated = computed(() => !!this.currentUser());
  public userRole = computed(() => this.currentUser()?.role || null);

  public isAdmin = computed(() => this.userRole() === 'ADMIN');
  public isFinanceOfficer = computed(() => this.userRole() === 'FINANCE_OFFICER');
  public isDeptHead = computed(() => this.userRole() === 'DEPARTMENT_HEAD');

  constructor(private http: HttpClient, private router: Router) {}

  public login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap((res) => {
        if (res.success && res.data.token) {
          localStorage.setItem(this.tokenKey, res.data.token);
          localStorage.setItem(this.userKey, JSON.stringify(res.data.user));
          this.currentUser.set(res.data.user);
        }
      })
    );
  }

  public fetchProfile(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/me`).pipe(
      tap((res) => {
        if (res.success && res.data) {
          this.currentUser.set(res.data);
          localStorage.setItem(this.userKey, JSON.stringify(res.data));
        }
      })
    );
  }

  public logout(): void {
    const token = this.getToken();
    if (token) {
      this.http.post(`${this.apiUrl}/logout`, {}).subscribe({
        error: () => {},
      });
    }
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  public getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  private getStoredUser(): User | null {
    const userStr = localStorage.getItem(this.userKey);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  public hasAnyRole(roles: UserRole[]): boolean {
    const current = this.currentUser();
    if (!current) return false;
    return roles.includes(current.role);
  }
}
