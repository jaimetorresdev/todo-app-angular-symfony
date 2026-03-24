import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

type LoginPayload = { email: string; password: string };
type RegisterPayload = { email: string; password: string; nombre?: string };
type LoginResponse = { token: string };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private API = '/api';

  login(payload: LoginPayload): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API}/login`, payload).pipe(
      tap((res) => localStorage.setItem('token', res.token))
    );
  }

  register(payload: RegisterPayload): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API}/auth/register`, payload);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  logout(): void {
    localStorage.removeItem('token');
  }
}