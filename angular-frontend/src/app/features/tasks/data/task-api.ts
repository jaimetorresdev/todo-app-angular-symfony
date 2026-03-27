import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import {
  Estado,
  EstadoApi,
  Task,
  TaskApi,
  TaskFilters,
  TaskPayload,
} from '../../../shared/interfaces/tasks';

@Injectable({
  providedIn: 'root',
})
export class TaskApiService {
  private readonly http = inject(HttpClient);
  private readonly API = '/api';

  private toApiEstado(estado?: Estado | null): EstadoApi | undefined {
    if (!estado) return undefined;
    return estado === 'en progreso' ? 'en_progreso' : estado;
  }

  private fromApiEstado(estado: EstadoApi): Estado {
    return estado === 'en_progreso' ? 'en progreso' : estado;
  }

  private mapTask(task: TaskApi): Task {
    return {
      ...task,
      estado: this.fromApiEstado(task.estado),
    };
  }

  private authOptions(extra?: { params?: HttpParams }) {
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    return { ...(extra ?? {}), headers };
  }

  getTasks(filters?: TaskFilters): Observable<Task[]> {
    let params = new HttpParams();

    if (filters?.q?.trim()) {
      params = params.set('q', filters.q.trim());
    }

    if (filters?.estado) {
      params = params.set('estado', this.toApiEstado(filters.estado)!);
    }

    return this.http
      .get<TaskApi[]>(`${this.API}/tasks`, this.authOptions({ params }))
      .pipe(map((tasks) => tasks.map((task) => this.mapTask(task))));
  }

  createTask(payload: TaskPayload): Observable<Task> {
    const body = {
      ...payload,
      estado: this.toApiEstado(payload.estado),
    };

    return this.http
      .post<TaskApi>(`${this.API}/tasks`, body, this.authOptions())
      .pipe(map((task) => this.mapTask(task)));
  }

  updateTask(id: number, payload: TaskPayload): Observable<Task> {
    const body = {
      ...payload,
      estado: this.toApiEstado(payload.estado),
    };

    return this.http
      .put<TaskApi>(`${this.API}/tasks/${id}`, body, this.authOptions())
      .pipe(map((task) => this.mapTask(task)));
  }

  updateTaskStatus(id: number, estado: Task['estado']): Observable<Task> {
    return this.http
      .patch<TaskApi>(
        `${this.API}/tasks/${id}/status`,
        { estado: this.toApiEstado(estado) },
        this.authOptions()
      )
      .pipe(map((task) => this.mapTask(task)));
  }

  deleteTask(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API}/tasks/${id}`, this.authOptions());
  }
}