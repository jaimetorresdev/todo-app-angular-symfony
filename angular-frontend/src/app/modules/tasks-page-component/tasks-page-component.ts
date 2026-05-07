import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { TaskFormComponent } from './components/task-form-component/task-form-component';
import { TaskListComponent } from './components/task-list-component/task-list-component';
import { TaskApiService } from '../../features/tasks/data/task-api';
import { TaskPayload } from '../../shared/interfaces/tasks';
import { ToastService } from '../../shared/services/toast-service';
import { AuthStore } from '../../shared/services/auth-store';

@Component({
  selector: 'app-tasks-page',
  standalone: true,
  imports: [
    CommonModule,
    TaskFormComponent,
    TaskListComponent,
  ],
  templateUrl: './tasks-page-component.html'
})
export class TasksPageComponent implements OnInit, OnDestroy {
  @ViewChild(TaskListComponent) list?: TaskListComponent;

  creatingTask = false;
  showForm = false;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly api: TaskApiService,
    private readonly toast: ToastService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    public readonly authStore: AuthStore
  ) {}

  ngOnInit(): void {
    this.route.queryParams.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      if (params['nueva'] === 'true') {
        this.showForm = true;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

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
        this.creatingTask = false;
        this.showForm = false;
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'No se pudo guardar la tarea');
        this.creatingTask = false;
      }
    });
  }

  onFormCancelled(): void {
    this.showForm = false;
  }
}