import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AdminUser,
  CreateUserPayload,
  ResetPasswordResponse,
} from '../interfaces/admin-users';

@Injectable({ providedIn: 'root' })
export class AdminUsersService {
  private http = inject(HttpClient);
  private API = '/api/admin/users';

  getUsers(q?: string): Observable<AdminUser[]> {
    let params = new HttpParams();

    if (q?.trim()) {
      params = params.set('q', q.trim());
    }

    return this.http.get<AdminUser[]>(this.API, { params });
  }

  createUser(payload: CreateUserPayload): Observable<AdminUser> {
    return this.http.post<AdminUser>(this.API, payload);
  }

  resetPassword(id: number): Observable<ResetPasswordResponse> {
    return this.http.post<ResetPasswordResponse>(`${this.API}/${id}/reset-password`, {});
  }
}