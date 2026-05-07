import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import {
  AuthCredentials,
  RegisterPayload,
  AuthResponse,
  AuthenticatedUser,
  UpdateProfilePayload,
  UpdateProfileResponse,
} from '../interfaces/auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private API = '/api';

  login(payload: AuthCredentials): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API}/login`, payload).pipe(
      tap((res) => localStorage.setItem('token', res.token))
    );
  }

  register(payload: RegisterPayload): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API}/auth/register`, payload);
  }

  me(): Observable<AuthenticatedUser> {
    return this.http.get<AuthenticatedUser>(`${this.API}/me`);
  }

  updateProfile(payload: UpdateProfilePayload): Observable<UpdateProfileResponse> {
    return this.http.patch<UpdateProfileResponse>(`${this.API}/me`, payload);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  logout(): void {
    localStorage.removeItem('token');
  }
}
