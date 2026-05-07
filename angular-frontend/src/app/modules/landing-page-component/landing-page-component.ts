import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageTitleComponent } from '../../shared/components/page-title/page-title';
import { AuthStore } from '../../shared/services/auth-store';
import { DecimalPipe, NgIf } from '@angular/common';
import { TaskApiService } from '../../features/tasks/data/task-api';
import { Task } from '../../shared/interfaces/tasks';
import { EMPTY, Subject, expand, last, map, reduce, takeUntil } from 'rxjs';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [RouterLink, PageTitleComponent, NgIf, DecimalPipe],
  templateUrl: './landing-page-component.html'
})
export class LandingPageComponent implements OnInit, OnDestroy {
  readonly store = inject(AuthStore);
  private readonly taskApi = inject(TaskApiService);
  private readonly destroy$ = new Subject<void>();

  statsLoading = false;
  statsError = false;
  stats = {
    total: 0,
    pendientes: 0,
    enProgreso: 0,
    completadas: 0,
    vencidas: 0,
    proximasAVencer: 0,
  };

  get completionRate(): number {
    if (!this.stats.total) return 0;
    return Math.round((this.stats.completadas / this.stats.total) * 100);
  }

  ngOnInit(): void {
    if (!this.store.isLoggedIn()) {
      return;
    }

    this.loadTaskStats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadTaskStats(): void {
    this.statsLoading = true;
    this.statsError = false;

    this.taskApi.getTasks({ page: 1, limit: 50 }).pipe(
      expand(response =>
        response.meta.page < response.meta.totalPages
          ? this.taskApi.getTasks({ page: response.meta.page + 1, limit: 50 })
          : EMPTY
      ),
      reduce((all, response) => [...all, ...response.data], [] as Task[]),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (tasks) => {
        this.stats = this.buildStats(tasks);
        this.statsLoading = false;
      },
      error: () => {
        this.statsLoading = false;
        this.statsError = true;
      },
    });
  }

  private buildStats(tasks: Task[]): typeof this.stats {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const in3Days = new Date(today); in3Days.setDate(today.getDate() + 3);

    return {
      total: tasks.length,
      pendientes: tasks.filter((t) => t.estado === 'pendiente').length,
      enProgreso: tasks.filter((t) => t.estado === 'en progreso').length,
      completadas: tasks.filter((t) => t.estado === 'completada').length,
      vencidas: tasks.filter((t) => this.isOverdue(t)).length,
      proximasAVencer: tasks.filter((t) => {
        if (!t.fechaLimite || t.estado === 'completada') return false;
        const due = new Date(t.fechaLimite); due.setHours(0, 0, 0, 0);
        return due >= today && due <= in3Days;
      }).length,
    };
  }

  private isOverdue(task: Task): boolean {
    if (!task.fechaLimite || task.estado === 'completada') {
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDate = new Date(task.fechaLimite);
    dueDate.setHours(0, 0, 0, 0);

    return dueDate < today;
  }
}
