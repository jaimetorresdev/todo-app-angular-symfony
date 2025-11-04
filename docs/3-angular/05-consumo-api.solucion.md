# Solución · Ejercicio 05

## Servicio de referencia

```ts
// src/app/shared/services/task-service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Task, TaskFilters, TaskPayload } from '../interfaces/tasks';

@Injectable({ providedIn: 'root' })
export class TaskApiService {
  private readonly http = inject(HttpClient);
  private readonly API = 'http://localhost:8000/api'; // con proxy, usa '/api'

  private authOptions(extra?: { params?: HttpParams }) {
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    return { ...(extra ?? {}), headers } as { params?: HttpParams; headers?: any };
  }

  getTasks(filters: TaskFilters = {}): Observable<Task[]> {
    let params = new HttpParams();
    if (filters.q) params = params.set('q', filters.q);
    if (filters.estado) {
      const estadoApi = filters.estado === 'en progreso' ? 'en_progreso' : filters.estado;
      params = params.set('estado', estadoApi);
    }
    return this.http.get<Task[]>(`${this.API}/tasks`, this.authOptions({ params }));
  }

  createTask(payload: TaskPayload): Observable<Task> {
    const body = { ...payload, estado: payload.estado === 'en progreso' ? 'en_progreso' : payload.estado };
    return this.http.post<Task>(`${this.API}/tasks`, body, this.authOptions());
  }

  updateTask(id: number, payload: TaskPayload): Observable<Task> {
    const body = { ...payload, estado: payload.estado === 'en progreso' ? 'en_progreso' : payload.estado };
    return this.http.put<Task>(`${this.API}/tasks/${id}`, body, this.authOptions());
  }

  updateTaskStatus(id: number, status: Task['estado']): Observable<Task> {
    const estado = status === 'en progreso' ? 'en_progreso' : status;
    return this.http.patch<Task>(`${this.API}/tasks/${id}/status`, { estado }, this.authOptions());
  }

  deleteTask(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API}/tasks/${id}`, this.authOptions());
  }
}
```

## Listado con estados (BehaviorSubject)

```ts
// src/app/modules/tasks-page-component/components/task-list-component/task-list-component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { TaskApiService } from '../../../../shared/services/task-service';
import { Task, TaskFilters } from '../../../../shared/interfaces/tasks';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task-list-component.html',
})
export class TaskListComponent implements OnInit {
  loading$ = new BehaviorSubject<boolean>(false);
  error$ = new BehaviorSubject<string | null>(null);
  private tasksSubject = new BehaviorSubject<Task[]>([]);
  tasks$ = this.tasksSubject.asObservable();

  constructor(private readonly api: TaskApiService) {}

  ngOnInit(): void {
    this.loadTasks();
  }

  loadTasks(filters?: TaskFilters): void {
    this.loading$.next(true);
    this.error$.next(null);
    this.api
      .getTasks(filters)
      .pipe(
        finalize(() => this.loading$.next(false)),
        catchError((err) => {
          const msg = err?.error?.message || 'Error al cargar tareas';
          this.error$.next(msg);
          this.tasksSubject.next([]);
          return of([]);
        })
      )
      .subscribe((tasks) => this.tasksSubject.next(tasks));
  }
}
```

```html
<!-- src/app/modules/tasks-page-component/components/task-list-component/task-list-component.html -->
<section class="mt-10">
  @if ((loading$ | async)) {
    <p class="text-slate-500">Cargando tareas…</p>
  }

  @if ((error$ | async); as err) {
    <p class="text-red-600">{{ err }}</p>
  }

  @if ((tasks$ | async); as tasks) {
    @if (!tasks.length) {
      <p class="text-slate-500">No hay tareas.</p>
    }

    @if (tasks.length) {
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        <article *ngFor="let t of tasks" class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h3 class="text-lg font-semibold text-slate-900">{{ t.titulo }}</h3>
          <p class="text-sm text-slate-600">
            Estado:
            <span
              class="font-semibold capitalize"
              [class.text-blue-600]="t.estado === 'en progreso'"
              [class.text-emerald-600]="t.estado === 'completada'"
              [class.text-amber-600]="t.estado === 'pendiente'"
            >
              {{ t.estado }}
            </span>
          </p>
          <p class="text-sm text-slate-500">Fecha límite: {{ t.fechaLimite || 'Sin fecha definida' }}</p>
        </article>
      </div>
    }
  }
</section>
```

## Filtros (formulario reactivo)

```ts
// src/app/modules/tasks-page-component/components/task-filters-component/task-filters-component.ts
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { TaskFilters } from '../../../../shared/interfaces/tasks';

@Component({
  selector: 'app-task-filters',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './task-filters-component.html',
})
export class TaskFiltersComponent implements OnInit {
  form!: FormGroup;
  @Output() apply = new EventEmitter<TaskFilters & { fechaDesde?: string | null; fechaHasta?: string | null }>();
  @Output() reset = new EventEmitter<void>();

  constructor(private readonly fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      texto: [''],
      estado: [''],
      mostrarSoloPendientes: [false],
      fechaDesde: [null],
      fechaHasta: [null],
    });
  }

  onApply(): void {
    const v = this.form.value;
    const filters: TaskFilters = {
      q: v.texto?.trim() || undefined,
      estado: v.mostrarSoloPendientes ? 'pendiente' : (v.estado || undefined),
    };
    this.apply.emit({ ...filters, fechaDesde: v.fechaDesde || null, fechaHasta: v.fechaHasta || null });
  }

  onReset(): void {
    this.form.reset({ texto: '', estado: '', mostrarSoloPendientes: false, fechaDesde: null, fechaHasta: null });
    this.reset.emit();
  }
}
```

```html
<!-- src/app/modules/tasks-page-component/components/task-filters-component/task-filters-component.html -->
<form (ngSubmit)="onApply()" [formGroup]="form" class="mt-8 grid grid-cols-1 gap-4 md:grid-cols-4">
  <div class="md:col-span-2">
    <label class="block text-sm font-medium">Buscar</label>
    <input type="text" formControlName="texto" class="mt-1 w-full rounded border px-3 py-2" placeholder="Título o descripción" />
  </div>

  <div>
    <label class="block text-sm font-medium">Estado</label>
    <select formControlName="estado" class="mt-1 w-full rounded border px-3 py-2">
      <option value="">Todos</option>
      <option value="pendiente">Pendiente</option>
      <option value="en progreso">En progreso</option>
      <option value="completada">Completada</option>
    </select>
  </div>

  <div class="flex items-end gap-3">
    <label class="inline-flex items-center gap-2 text-sm">
      <input type="checkbox" formControlName="mostrarSoloPendientes" /> Solo pendientes
    </label>
  </div>

  <div>
    <label class="block text-sm font-medium">Desde</label>
    <input type="date" formControlName="fechaDesde" class="mt-1 w-full rounded border px-3 py-2" />
  </div>
  <div>
    <label class="block text-sm font-medium">Hasta</label>
    <input type="date" formControlName="fechaHasta" class="mt-1 w-full rounded border px-3 py-2" />
  </div>

  <div class="md:col-span-2 flex items-end gap-3">
    <button type="submit" class="h-11 rounded-md bg-blue-600 px-5 text-sm font-semibold text-white">Aplicar filtros</button>
    <button type="button" (click)="onReset()" class="h-11 rounded-md border px-5 text-sm font-semibold">Limpiar</button>
  </div>
</form>
```

## Integración en la página de tareas

```ts
// src/app/modules/tasks-page-component/tasks-page-component.ts (resumen)
import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { BackToLandingButtonComponent } from '../../shared/components/back-to-landing-button/back-to-landing-button';
import { PageTitleComponent } from '../../shared/components/page-title/page-title';
import { TaskFormComponent } from './components/task-form-component/task-form-component';
import { TaskListComponent } from './components/task-list-component/task-list-component';
import { TaskFiltersComponent } from './components/task-filters-component/task-filters-component';
import { TaskApiService } from '../../shared/services/task-service';
import { TaskPayload } from '../../shared/interfaces/tasks';

@Component({
  selector: 'app-tasks-page',
  standalone: true,
  imports: [CommonModule, BackToLandingButtonComponent, PageTitleComponent, TaskFormComponent, TaskListComponent, TaskFiltersComponent],
  templateUrl: './tasks-page-component.html',
})
export class TasksPageComponent {
  @ViewChild(TaskListComponent) list?: TaskListComponent;

  constructor(private readonly api: TaskApiService) {}

  onTaskSubmitted(payload: TaskPayload) {
    this.api.createTask(payload).subscribe({
      next: () => this.list?.loadTasks(),
      error: (e) => console.error('Error al crear tarea', e),
    });
  }

  onFiltersApply(f: { q?: string; estado?: 'pendiente' | 'en progreso' | 'completada'; fechaDesde?: string | null; fechaHasta?: string | null }) {
    this.list?.loadTasks({ q: f.q, estado: f.estado });
  }
}
```

```html
<!-- src/app/modules/tasks-page-component/tasks-page-component.html (resumen) -->
<app-back-to-landing-button class="mb-6 inline-flex lg:hidden"></app-back-to-landing-button>
<div class="flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
  <app-page-title class="w-full" title="Gestión de Tareas" subtitle="Organiza y administra tus pendientes con un vistazo rápido."></app-page-title>
  <app-back-to-landing-button class="hidden lg:inline-flex"></app-back-to-landing-button>
  </div>

<app-task-form-component (submitted)="onTaskSubmitted($event)"></app-task-form-component>
<app-task-filters (apply)="onFiltersApply($event)"></app-task-filters>
<app-task-list></app-task-list>
```

## Puntos clave

- Mapea “en progreso” (UI) → `en_progreso` (API) en el servicio.
- Usa el nuevo control flow `@if` de Angular para estados de carga y error; conserva `*ngFor` o cambia a `@for` si lo prefieres.
- Refresca la lista tras crear/actualizar/quitar llamando a `loadTasks()` del listado.
- Los filtros `q` y `estado` van a la API; `fechaDesde/fechaHasta` puedes aplicarlos en cliente si aún no existen en backend.
