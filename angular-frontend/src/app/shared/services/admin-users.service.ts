import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AdminUser,
  CreateUserPayload,
  UpdateUserPayload,
  PaginatedUsersResponse,
  ResetPasswordResponse,
} from '../interfaces/admin-users';

@Injectable({ providedIn: 'root' })
export class AdminUsersService {
  private http = inject(HttpClient);
  private API = '/api/admin/users';

  getUsers(q?: string, page = 1, limit = 15): Observable<PaginatedUsersResponse> {
    let params = new HttpParams();

    if (q?.trim()) {
      params = params.set('q', q.trim());
    }
    params = params.set('page', page).set('limit', limit);

    return this.http.get<PaginatedUsersResponse>(this.API, { params });
  }

  createUser(payload: CreateUserPayload): Observable<AdminUser> {
    return this.http.post<AdminUser>(this.API, payload);
  }

  updateUser(id: number, payload: UpdateUserPayload): Observable<AdminUser> {
    return this.http.patch<AdminUser>(`${this.API}/${id}`, payload);
  }

  resetPassword(id: number): Observable<ResetPasswordResponse> {
    return this.http.post<ResetPasswordResponse>(`${this.API}/${id}/reset-password`, {});
  }

  /**
   * Elimina un usuario de forma permanente.
   * El backend se encarga de borrar sus tareas asociadas gracias al cascade remove.
   */
  deleteUser(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API}/${id}`);
  }
}