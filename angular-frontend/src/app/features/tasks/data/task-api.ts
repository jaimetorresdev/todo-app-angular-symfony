import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Task,
  TaskFilters,
  TaskPayload,
  PaginatedResponse,
} from '../../../shared/interfaces/tasks';

// El backend PUT/PATCH devuelve { message, data } en lugar del objeto plano
interface TaskApiResponse {
  message: string;
  data: Task;
}

@Injectable({
  providedIn: 'root',
})
export class TaskApiService {
  private readonly http = inject(HttpClient);
  private readonly API = '/api';

  // La autorización se gestiona centralizadamente en auth-interceptor.ts.
  // No es necesario añadir cabeceras manualmente en cada petición.

  private unwrapTask(response: Task | TaskApiResponse): Task {
    return 'data' in response ? response.data : response;
  }

  getTasks(filters?: TaskFilters): Observable<PaginatedResponse<Task>> {
    let params = new HttpParams();

    if (filters?.q?.trim()) {
      params = params.set('q', filters.q.trim());
    }
    if (filters?.estado) {
      params = params.set('estado', filters.estado);
    }
    if (filters?.prioridad) {
      params = params.set('prioridad', filters.prioridad);
    }
    if (filters?.page) {
      params = params.set('page', filters.page);
    }
    if (filters?.limit) {
      params = params.set('limit', filters.limit);
    }

    return this.http.get<PaginatedResponse<Task>>(`${this.API}/tasks`, { params });
  }

  createTask(payload: TaskPayload): Observable<Task> {
    return this.http.post<Task>(`${this.API}/tasks`, payload);
  }

  updateTask(id: number, payload: TaskPayload): Observable<Task> {
    return this.http
      .put<Task | TaskApiResponse>(`${this.API}/tasks/${id}`, payload)
      .pipe(map((response) => this.unwrapTask(response)));
  }

  updateTaskStatus(id: number, estado: Task['estado']): Observable<Task> {
    return this.http
      .patch<Task | TaskApiResponse>(`${this.API}/tasks/${id}/status`, { estado })
      .pipe(map((response) => this.unwrapTask(response)));
  }

  deleteTask(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API}/tasks/${id}`);
  }
}
