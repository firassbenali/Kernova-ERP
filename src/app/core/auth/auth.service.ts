import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AuthResponse, LoginRequest, RegisterRequest, UserResponse } from '../../domain/models/auth.model';

const TOKEN_KEY = 'krenova_token';
const USER_KEY  = 'krenova_user';
const API_URL   = '/api';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _currentUser = signal<UserResponse | null>(this.loadUser());

  readonly currentUser = this._currentUser.asReadonly();

  constructor(private http: HttpClient, private router: Router) {}

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_URL}/auth/login`, request).pipe(
      tap(response => {
        this.storeAuth(response);
      })
    );
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_URL}/auth/register`, request).pipe(
      tap(response => {
        if (request.role && response.user) {
          response.user.role = request.role;
        }
        this.storeAuth(response);
      })
    );
  }

  private storeAuth(response: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, response.accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    this._currentUser.set(response.user);
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._currentUser.set(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  hasRole(...roles: string[]): boolean {
    const role = this._currentUser()?.role;
    return !!role && roles.some(r => r.toLowerCase() === role.toLowerCase());
  }

  isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private loadUser(): UserResponse | null {
    const stored = localStorage.getItem(USER_KEY);
    if (!stored) return null;
    try {
      return JSON.parse(stored) as UserResponse;
    } catch {
      return null;
    }
  }
}
