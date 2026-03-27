import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { TaskApiService } from '../../../../features/tasks/data/task-api';
import { Task, TaskFilters } from '../../../../shared/interfaces/tasks';

@Component({
  selector: 'app-task-list-component',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task-list-component.html',
})
export class TaskListComponent implements OnInit {
  loading$ = new BehaviorSubject<boolean>(false);
  error$ = new BehaviorSubject<string | null>(null);
  updatingTaskId: number | null = null;

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

  onStatusChange(id: number, estado: Task['estado']): void {
    this.updatingTaskId = id;
    this.error$.next(null);

    this.api
      .updateTaskStatus(id, estado)
      .pipe(
        finalize(() => {
          this.updatingTaskId = null;
        })
      )
      .subscribe({
        next: () => {
          this.loadTasks();
        },
        error: (err) => {
          const msg = err?.error?.message || 'Error al actualizar el estado';
          this.error$.next(msg);
        }
      });
  }
}