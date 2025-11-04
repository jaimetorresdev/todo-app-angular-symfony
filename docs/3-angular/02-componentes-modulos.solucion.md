# Solución · Ejercicio 02

## App Component y Routing

```ts
// src/app/app.component.ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {}
```

```html
<!-- src/app/app.component.html -->
<router-outlet></router-outlet>
```

```ts
// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { LandingPageComponent } from './modules/landing-page-component/landing-page-component';
import { TasksPageComponent } from './modules/tasks-page-component/tasks-page-component';

export const routes: Routes = [
  { path: '', component: LandingPageComponent },
  { path: 'tasks', component: TasksPageComponent },
];
```

## Componentes compartidos

```ts
// src/app/shared/components/page-title/page-title.ts
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-page-title',
  standalone: true,
  templateUrl: './page-title.html',
})
export class PageTitleComponent {
  @Input() title = '';
  @Input() subtitle?: string;
}
```

```html
<!-- src/app/shared/components/page-title/page-title.html -->
<header class="space-y-3 text-center sm:text-left">
  <h1 class="text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
    {{ title }}
  </h1>

  @if (subtitle) {
    <p class="text-base leading-7 text-slate-600 sm:text-lg">
      {{ subtitle }}
    </p>
  }
</header>
```

```ts
// src/app/shared/components/back-to-landing-button/back-to-landing-button.ts
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-back-to-landing-button',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './back-to-landing-button.html',
})
export class BackToLandingButtonComponent {}
```

```html
<!-- src/app/shared/components/back-to-landing-button/back-to-landing-button.html -->
<a
  routerLink="/"
  class="inline-flex h-11 items-center gap-2 rounded-md px-4 text-sm font-medium text-blue-600 transition hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke-width="2"
    stroke="currentColor"
    class="h-4 w-4"
    aria-hidden="true"
  >
    <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0L10.5 4.5M3 12h18" />
  </svg>
  Volver al inicio
</a>
```

## Landing page standalone

```ts
// src/app/modules/landing-page-component/landing-page-component.ts
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageTitleComponent } from '../../shared/components/page-title/page-title';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [RouterLink, PageTitleComponent],
  templateUrl: './landing-page-component.html',
  styleUrls: ['./landing-page-component.css'],
})
export class LandingPageComponent {}
```

```html
<!-- src/app/modules/landing-page-component/landing-page-component.html -->
<main
  class="mx-auto flex min-h-screen max-w-7xl flex-col justify-center gap-10 bg-white px-4 py-24 sm:px-8 sm:py-32 lg:px-16"
>
  <app-page-title
    title="Gestiona tus tareas de forma eficiente"
    subtitle="Una aplicación ligera para crear, actualizar y completar tareas sin complicaciones."
  ></app-page-title>

  <p class="text-base leading-7 text-slate-600 text-center sm:max-w-xl sm:text-left">
    Esta landing será el punto de partida de la To-Do App. Más adelante añadiremos formularios, autenticación
    y datos reales, pero hoy nos centramos en estructurar y reutilizar componentes.
  </p>

  <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
    <a
      routerLink="/tasks"
      class="inline-flex h-12 w-full items-center justify-center rounded-md bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 sm:w-auto"
    >
      Comenzar ahora
    </a>
    <span class="text-sm text-slate-500 sm:pl-4">
      * Todavía no persistimos tareas. Ese flujo llegará en los ejercicios 3 y 4.
    </span>
  </div>
</main>
```

## Vista de tareas mock

```ts
// src/app/modules/tasks-page-component/tasks-page-component.ts
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { BackToLandingButtonComponent } from '../../shared/components/back-to-landing-button/back-to-landing-button';
import { PageTitleComponent } from '../../shared/components/page-title/page-title';

interface Task {
  title: string;
  status: 'pendiente' | 'en progreso' | 'completada';
  dueDate: string | null;
}

@Component({
  selector: 'app-tasks-page',
  standalone: true,
  imports: [CommonModule, BackToLandingButtonComponent, PageTitleComponent],
  templateUrl: './tasks-page-component.html',
})
export class TasksPageComponent {
  tasks: Task[] = [
    { title: 'Aprender Angular', status: 'en progreso', dueDate: '2025-11-15' },
    { title: 'Practicar con TypeScript', status: 'pendiente', dueDate: '2025-11-20' },
    { title: 'Estudiar Tailwind', status: 'completada', dueDate: null },
    { title: 'Preparar presentaciones', status: 'pendiente', dueDate: '2025-12-05' },
    { title: 'Revisar pull requests', status: 'en progreso', dueDate: null },
  ];
}
```

```html
<!-- src/app/modules/tasks-page-component/tasks-page-component.html -->
<main
  class="mx-auto min-h-screen max-w-7xl bg-white px-4 py-24 sm:px-8 sm:py-32 lg:px-16"
>
  <app-back-to-landing-button class="mb-6 inline-flex lg:hidden"></app-back-to-landing-button>

  <div class="flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
    <app-page-title
      class="w-full"
      title="Gestión de Tareas"
      subtitle="Organiza y administra tus pendientes con un vistazo rápido."
    ></app-page-title>

    <app-back-to-landing-button class="hidden lg:inline-flex"></app-back-to-landing-button>
  </div>

  <button
    type="button"
    class="mt-8 inline-flex h-12 items-center justify-center rounded-md bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
  >
    Crear nueva tarea
  </button>

  <section class="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
    <article
      *ngFor="let task of tasks"
      class="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
    >
      <div class="space-y-3">
        <h3 class="text-lg font-semibold text-slate-900">{{ task.title }}</h3>
        <p class="text-sm text-slate-600">
          Estado:
          <span
            class="font-semibold capitalize"
            [class.text-blue-600]="task.status === 'en progreso'"
            [class.text-emerald-600]="task.status === 'completada'"
            [class.text-amber-600]="task.status === 'pendiente'"
          >
            {{ task.status }}
          </span>
        </p>
        <p class="text-sm text-slate-500">
          Fecha límite:
          {{ task.dueDate ? (task.dueDate | date : 'longDate') : 'Sin fecha definida' }}
        </p>
      </div>
    </article>
  </section>
</main>
```

## Puntos clave

- Todos los componentes son standalone y reutilizan `PageTitleComponent` y `BackToLandingButtonComponent` tal como se solicita en el ejercicio.
- Las vistas comparten contenedores responsivos (`max-w-7xl`, `px-4 sm:px-8 lg:px-16`) y CTA accesibles con altura mínima de 44 px.
- `PageTitleComponent` centra el título en móvil y lo alinea a la izquierda en escritorio mediante utilidades responsivas, sin props adicionales.
- `BackToLandingButtonComponent` mantiene navegación móvil persistente y ofrece alternativa de escritorio (`lg:hidden`/`lg:inline-flex`).
- El listado de tareas muestra un grid responsivo (1/2/3 columnas) con estados destacados y datos mock listos para evolucionar en ejercicios posteriores.
