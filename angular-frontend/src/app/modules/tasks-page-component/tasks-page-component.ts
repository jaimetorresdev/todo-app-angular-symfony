import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BackToLandingButtonComponent } from '../../shared/components/back-to-landing-button/back-to-landing-button';
import { PageTitleComponent } from '../../shared/components/page-title/page-title';
import { TaskFormComponent } from './components/task-form-component/task-form-component';
import { TaskListComponent } from './components/task-list-component/task-list-component';
import { TaskFiltersComponent } from './components/task-filters-component/task-filters-component';
import { TaskApiService } from '../../features/tasks/data/task-api';
import { TaskPayload } from '../../shared/interfaces/tasks';
import { ToastService } from '../../shared/services/toast-service';
import { AuthStore } from '../../shared/services/auth-store';

@Component({
  selector: 'app-tasks-page',
  standalone: true,
  imports: [
    CommonModule,
    BackToLandingButtonComponent,
    PageTitleComponent,
    TaskFormComponent,
    TaskListComponent,
    TaskFiltersComponent
  ],
  templateUrl: './tasks-page-component.html'
})
export class TasksPageComponent {
  @ViewChild(TaskListComponent) list?: TaskListComponent;

  creatingTask = false;

  constructor(
    private readonly api: TaskApiService,
    private readonly toast: ToastService,
    private readonly router: Router,
    public readonly authStore: AuthStore
  ) {}

  logout(): void {
    this.authStore.clearSession();
    this.router.navigateByUrl('/');
  }

  onTaskSubmitted(payload: TaskPayload): void {
    this.creatingTask = true;

    this.api.createTask(payload).subscribe({
      next: () => {
        this.toast.success('Tarea guardada');
        this.list?.loadTasks();
        this.router.navigate(['/tasks']);
        this.creatingTask = false;
      },
      error: (err) => {
        console.error('Error al crear la tarea', err);
        this.toast.error('No se pudo guardar la tarea');
        this.creatingTask = false;
      }
    });
  }

  onFiltersApply(f: {
    q?: string;
    estado?: 'pendiente' | 'en progreso' | 'completada';
    fechaDesde?: string | null;
    fechaHasta?: string | null;
  }): void {
    const noHayFiltros =
      !f.q &&
      !f.estado &&
      !f.fechaDesde &&
      !f.fechaHasta;

    if (noHayFiltros) {
      this.toast.warning('No has aplicado ningún filtro');
    }

    this.list?.loadTasks({
      q: f.q,
      estado: f.estado
    });
  }

  onFiltersReset(): void {
    this.list?.loadTasks();
    this.toast.info('Filtros restablecidos');
  }
}