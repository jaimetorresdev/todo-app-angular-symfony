# Ejercicio 05 · Consumo de API, filtros y manejo de estados

Nota: Antes de continuar, completa el Ejercicio 04 (Login y Registro) para obtener el token JWT. A partir de ahora, las peticiones a `/api/tasks` requieren autenticación.

## Objetivo

Integrar el frontend con la API de Symfony para listar tareas, crear nuevas, actualizar su estado y aplicar filtros/búsquedas, manejando estados de carga y errores.

## Backend listo (contexto rápido)

En este repositorio ya tienes un backend Symfony operativo y preparado para recibir peticiones desde Angular.

- Arranque con Docker Compose:
  - `docker-compose up -d` levanta Postgres (5432), Symfony (8000) y Angular (4200).
- Backend base URL: `http://localhost:8000`
  - Healthcheck: `GET /api/health` (útil para comprobar que el backend responde).

> Nota sobre 401 con JWT en dev
>
> Si ves `{"code":401,"message":"JWT Token not found"}` al llamar a `/api/health`, es porque el firewall protege todas las rutas `/api/**` por defecto. Para poder avanzar en este ejercicio sin JWT (la autenticación llega en el 06), permite estas rutas como públicas en desarrollo.
>
> 1) Edita `symfony-backend/config/packages/security.yaml` y añade estas reglas antes de la línea que protege `^/api`:
>
> ```yaml
>     - { path: ^/api/health, roles: PUBLIC_ACCESS }
> ```
>
> 2) Reinicia el backend si es necesario: `docker-compose restart backend`.
>
> 3) Verifica:
>
> - `curl -i http://localhost:8000/api/health` → 200 OK
>
> Más adelante, en el ejercicio 07, volverás a exigir JWT quitando la línea pública de `^/api/tasks` (puedes dejar pública solo `/api/health`).
- Endpoints disponibles (sin autenticación estricta todavía):
  - `GET /api/tasks` — Lista tareas. Query params opcionales: `estado` (`pendiente|en_progreso|completada`), `q` (búsqueda texto).
  - `POST /api/tasks` — Crea tarea. Body JSON: `{ titulo: string, descripcion?: string, estado?: 'pendiente'|'en_progreso'|'completada', fechaLimite?: 'YYYY-MM-DD' }`.
  - `PUT /api/tasks/{id}` — Actualiza campos de la tarea (mismo shape que POST, campos opcionales).
  - `PATCH /api/tasks/{id}/status` — Cambia solo el estado. Body JSON: `{ estado: 'pendiente'|'en_progreso'|'completada' }`.
  - `DELETE /api/tasks/{id}` — Elimina tarea.
- Notas importantes para este ejercicio:
  - Estados válidos en la API: `pendiente`, `en_progreso`, `completada`. En la UI mostramos “en progreso”; mapea a `en_progreso` al enviar.

## Ejercicios guiados

### Guía 1 · Construir el servicio de datos (paso a paso)

0) Habilita `HttpClient` en la app (una sola vez)

```ts
// src/app/app.config.ts
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withFetch()), // habilita HttpClient
  ],
};
```

1) Crea los modelos

```ts
// src/app/shared/interfaces/tasks.ts
export type Estado = 'pendiente' | 'en progreso' | 'completada';

export interface Task {
  id: number;
  titulo: string;
  descripcion?: string | null;
  estado: Estado; // en UI usamos "en progreso"; al API se envía "en_progreso"
  fechaLimite?: string | null; // YYYY-MM-DD
  fechaCreacion?: string;      // opcional según respuesta
}

export interface TaskPayload {
  titulo: string;
  descripcion?: string | null;
  estado?: Estado;
  fechaLimite?: string | null; // YYYY-MM-DD
}

export interface TaskFilters {
  estado?: Estado;
  q?: string;
}
```

2) Genera el servicio

```bash
ng g service features/tasks/data/task-api
```

3) Implementa el servicio

```ts
// src/app/features/tasks/data/task-api.service.ts
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

  getTasks(filters?: TaskFilters): Observable<Task[]> {
    let params = new HttpParams();
    if (filters?.q) params = params.set('q', filters.q);
    if (filters?.estado) {
      const estadoApi = filters.estado === 'en progreso' ? 'en_progreso' : filters.estado;
      params = params.set('estado', estadoApi);
    }
    // opcional en dev mientras no haya auth
    params = params.set('usuarioId', 1);

    return this.http.get<Task[]>(`${this.API}/tasks`, this.authOptions({ params }));
  }

  createTask(payload: TaskPayload): Observable<Task> {
    const body = {
      ...payload,
      estado: payload.estado === 'en progreso' ? 'en_progreso' : payload.estado,
    };
    return this.http.post<Task>(`${this.API}/tasks`, body, this.authOptions());
  }

  updateTask(id: number, payload: TaskPayload): Observable<Task> {
    const body = {
      ...payload,
      estado: payload.estado === 'en progreso' ? 'en_progreso' : payload.estado,
    };
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

Explicación del código (qué hace cada parte)

- Imports clave: `HttpClient` para las peticiones, `HttpParams` para query params, y los tipos `Task`, `TaskPayload`, `TaskFilters` para tipado fuerte.
- Servicio inyectable: `@Injectable({ providedIn: 'root' })` lo hace disponible en toda la app sin declararlo en módulos.
- Inyección sin constructor: `private readonly http = inject(HttpClient)` evita escribir un constructor solo para inyectar.
- URL base: `API = 'http://localhost:8000/api'`; más adelante puedes moverlo a `environments`.
  - Si usas proxy (`proxy.conf.json`), usa mejor `API = '/api'` para evitar CORS en dev.

Qué es `environments` y por qué usarlo

- Qué es: un conjunto de archivos de configuración que Angular reemplaza en tiempo de build según el modo (desarrollo, producción, staging…). Sirve para centralizar constantes como URLs de API, flags de logging, etc.
- Por qué usarlo: evita hardcodear URLs en el código, facilita tener una URL distinta por entorno sin tocar el código fuente, y mantiene tipado y consistencia.

4) Comprobación rápida (opcional)

En cualquier componente, inyecta el servicio y haz una llamada de prueba para ver datos en consola:

```ts
// en un componente de prueba
import { inject } from '@angular/core';
import { TaskApiService } from '../../features/tasks/data/task-api.service';

const api = inject(TaskApiService);
api.getTasks().subscribe(console.log);
```

En la Guía 2 integrarás este servicio con la vista, estados de carga y manejo de errores.

### Guía 2 · Gestionar estados en el componente (paso a paso)

1) Crea el componente de lista

```bash
ng g component modules/tasks-page-component/components/task-list-component
```

2) Implementa la lógica con `BehaviorSubject`

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

Explicación del código (TS)

- Objetivo: cargar tareas desde la API y exponer estados reactivos (cargando, error, datos) fáciles de pintar en plantilla.
- `BehaviorSubject`:
  - `loading$`: emite `true/false` para mostrar un loader.
  - `error$`: guarda el mensaje de error actual o `null`.
  - `tasksSubject` y `tasks$`: `tasksSubject` almacena la lista, `tasks$` la expone como `Observable` para el template.
- `ngOnInit()`: llama a `loadTasks()` al montar el componente, se ejecuta cuando se inicia el componente.
- `loadTasks(filters?)`:
  - Marca `loading = true` y limpia errores.
  - Llama a `api.getTasks(filters)`.
  - `finalize(...)`: se ejecuta siempre (éxito o error) para poner `loading = false`.
  - `catchError(...)`: si falla, muestra un mensaje, vacía la lista y devuelve `of([])` para que la app no se rompa.
  - `subscribe(...)`: actualiza la lista con las tareas recibidas.

3) Añade el template

```html
<!-- src/app/modules/tasks-page-component/components/task-list-component/task-list-component.html -->
<section class="mt-10">
  <!-- Loading -->
  @if ((loading$ | async)) {
    <p class="text-slate-500">Cargando tareas…</p>
  }

  <!-- Error -->
  @if ((error$ | async); as err) {
    <p class="text-red-600">{{ err }}</p>
  }

  <!-- Contenido -->
  @if ((tasks$ | async); as tasks) {
    @if (!tasks.length) {
      <p class="text-slate-500">No hay tareas.</p>
    }

    @if (tasks.length) {
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
      <article
        *ngFor="let t of tasks"
        class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      >
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
        <p class="text-sm text-slate-500">
          Fecha límite: {{ t.fechaLimite || 'Sin fecha definida' }}
        </p>
      </article>
      </div>
    }
  }
  
</section>
```

Explicación del template (HTML)

- `@if ((loading$ | async)) { ... }`: muestra “Cargando…” mientras `loading$` sea `true` (nuevo control flow de Angular).
- `@if ((error$ | async); as err) { ... }`: si hay error, captura el valor en `err` y lo muestra.
- `@if ((tasks$ | async); as tasks) { ... }`: obtiene la lista de tareas; dentro, otro `@if` muestra “No hay tareas” cuando está vacía, o el grid cuando hay elementos.
- `*ngFor="let t of tasks"`: itera las tareas. Puedes cambiarlo por `@for (t of tasks; track t.id) { ... }` si quieres usar también el nuevo bucle.
- Colores por estado: clases condicionales para `pendiente`, `en progreso`, `completada`.
- Estilos: utilidades Tailwind (`grid`, `border`, `shadow-sm`, etc.) para una maquetación simple.

4) Uso rápido · Integra en TasksPage y limpia el mock

No basta con colocar el selector en el HTML. Debes:

- Importar `TaskListComponent` en `TasksPageComponent` (propiedad `imports`).
- Eliminar la lista mock del TS (propiedad `tasks` y tipos locales si los hubiera).
- Quitar el grid de tarjetas mock del HTML y dejar solo la lista real.

Ejemplo de integración:

```ts
// src/app/modules/tasks-page-component/tasks-page-component.ts
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { BackToLandingButtonComponent } from '../../shared/components/back-to-landing-button/back-to-landing-button';
import { PageTitleComponent } from '../../shared/components/page-title/page-title';
import { TaskFormComponent } from './components/task-form-component/task-form-component';
import { TaskListComponent } from './components/task-list-component/task-list-component';

@Component({
  selector: 'app-tasks-page',
  standalone: true,
  imports: [CommonModule, BackToLandingButtonComponent, PageTitleComponent, TaskFormComponent, TaskListComponent],
  templateUrl: './tasks-page-component.html',
})
export class TasksPageComponent {
  onTaskSubmitted(payload: any) {
    console.log('Tarea guardada', payload);
  }
}
```

```html
<!-- src/app/modules/tasks-page-component/tasks-page-component.html -->
<main class="mx-auto min-h-screen max-w-7xl bg-white px-4 py-24 sm:px-8 sm:py-32 lg:px-16">
  <!-- cabecera con botón volver y título -->
  <app-back-to-landing-button class="mb-6 inline-flex lg:hidden"></app-back-to-landing-button>

  <div class="flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
    <app-page-title
      class="w-full"
      title="Gestión de Tareas"
      subtitle="Organiza y administra tus pendientes con un vistazo rápido."
    ></app-page-title>

    <app-back-to-landing-button class="hidden lg:inline-flex"></app-back-to-landing-button>
  </div>

  <!-- formulario de creación -->
  <app-task-form-component (submitted)="onTaskSubmitted($event)"></app-task-form-component>

  <!-- listado real desde la API -->
  <app-task-list></app-task-list>

  <!-- elimina el grid mock anterior basado en *ngFor sobre tasks -->
</main>

```

### Guía 3 · Integrar con el formulario (paso a paso)

1) Asegura imports en la página de tareas

```ts
// src/app/modules/tasks-page-component/tasks-page-component.ts
import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { BackToLandingButtonComponent } from '../../shared/components/back-to-landing-button/back-to-landing-button';
import { PageTitleComponent } from '../../shared/components/page-title/page-title';
import { TaskFormComponent } from './components/task-form-component/task-form-component';
import { TaskListComponent } from './components/task-list-component/task-list-component';
import { TaskApiService } from '../../shared/services/task-service';
import { TaskPayload } from '../../shared/interfaces/tasks';

@Component({
  selector: 'app-tasks-page',
  standalone: true,
  imports: [CommonModule, BackToLandingButtonComponent, PageTitleComponent, TaskFormComponent, TaskListComponent],
  templateUrl: './tasks-page-component.html',
})
export class TasksPageComponent {
  @ViewChild(TaskListComponent) list?: TaskListComponent; // referencia para refrescar la lista

  constructor(private readonly api: TaskApiService) {}

  onTaskSubmitted(payload: TaskPayload) {
    // 1) Crear en la API
    this.api.createTask(payload).subscribe({
      next: () => {
        // 2) Refrescar la lista
        this.list?.loadTasks();
        // 3) (Ej. 05) Aquí mostrarías un toast de éxito
      },
      error: (err) => {
        console.error('Error al crear la tarea', err);
        // (Ej. 05) Aquí mostrarías un toast de error
      },
    });
  }
}
```

2) Coloca el formulario y la lista en el HTML de la página y elimina el listado mock

```html
<!-- src/app/modules/tasks-page-component/tasks-page-component.html -->
<app-task-form-component (submitted)="onTaskSubmitted($event)"></app-task-form-component>
<app-task-list></app-task-list>
<!-- elimina el grid mock basado en *ngFor sobre tasks -->
```

### Guía 4 · Añadir filtros y buscador (paso a paso)

1) Genera el componente de filtros

```bash
ng g component modules/tasks-page-component/components/task-filters-component
```

2) Implementa el formulario reactivo y la salida de filtros

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
      estado: [''], // '', 'pendiente', 'en progreso', 'completada'
      mostrarSoloPendientes: [false],
      fechaDesde: [null], // YYYY-MM-DD
      fechaHasta: [null], // YYYY-MM-DD
    });
  }
  
  onApply(): void {
    const v = this.form.value;
    // Construimos los filtros mínimos que entiende la API: q y estado
    const filters: TaskFilters = {
      q: v.texto?.trim() || undefined,
      estado: v.mostrarSoloPendientes ? 'pendiente' : (v.estado || undefined),
    };
    // Emitimos también el rango de fechas para filtrado local opcional
    this.apply.emit({ ...filters, fechaDesde: v.fechaDesde || null, fechaHasta: v.fechaHasta || null });
  }

  onReset(): void {
    this.form.reset({ texto: '', estado: '', mostrarSoloPendientes: false, fechaDesde: null, fechaHasta: null });
    this.reset.emit();
  }
}

```

3) Añade la plantilla de filtros

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

4) Integra los filtros en la página y refresca la lista

```ts
// src/app/modules/tasks-page-component/tasks-page-component.ts (fragmento)
import { TaskFiltersComponent } from './components/task-filters-component/task-filters-component';

@Component({
  // ...
  imports: [/* ..., */ TaskFiltersComponent],
})
export class TasksPageComponent {
  @ViewChild(TaskListComponent) list?: TaskListComponent;

  onFiltersApply(f: { q?: string; estado?: 'pendiente' | 'en progreso' | 'completada'; fechaDesde?: string | null; fechaHasta?: string | null }) {
    // Llama al listado con los filtros que entiende la API (q, estado)
    this.list?.loadTasks({ q: f.q, estado: f.estado });
    // Si quieres filtrar por fechas en cliente, ver paso 5 (opcional)
  }
}
```

```html
<!-- src/app/modules/tasks-page-component/tasks-page-component.html (fragmento) -->
<app-task-filters (apply)="onFiltersApply($event)"></app-task-filters>
<app-task-list></app-task-list>
```

Consulta `04-consumo-api.solucion.md` una vez resuelto el reto.
