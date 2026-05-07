import { Component, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { BehaviorSubject, Subject } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, finalize, of, switchMap, takeUntil } from 'rxjs';
import { Router, ActivatedRoute } from '@angular/router';

import { TaskApiService } from '../../../../features/tasks/data/task-api';
import { ToastService } from '../../../../shared/services/toast-service';
import { Task, TaskFilters, TaskPayload, Estado, Prioridad } from '../../../../shared/interfaces/tasks';
import { ConfirmModalService } from '../../../../shared/components/confirm-modal/confirm-modal.service';
import { AdminUser } from '../../../../shared/interfaces/admin-users';
import { TaskFormComponent } from '../task-form-component/task-form-component';
import { TaskFilterService, SortBy, QuickFilter, KanbanColumns } from './task-filter.service';
import { KanbanColumnComponent, KanbanColumnDef } from './kanban-column/kanban-column.component';

@Component({
  selector: 'app-task-list-component',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, TaskFormComponent, KanbanColumnComponent],
  templateUrl: './task-list-component.html',
})
export class TaskListComponent implements OnInit, OnDestroy {

  // ── Inputs / Outputs ────────────────────────────────────────────────────────
  @Input() defaultView: 'kanban' | 'list' = 'kanban';
  @Input() hideViewToggle = false;
  @Input() users: AdminUser[] = [];

  @Output() taskDeleted      = new EventEmitter<Task>();
  @Output() taskUpdated      = new EventEmitter<Task>();
  @Output() taskStatusChanged = new EventEmitter<Task>();

  // ── Vista ───────────────────────────────────────────────────────────────────
  currentView: 'kanban' | 'list' = 'kanban';

  // ── Estado de carga ─────────────────────────────────────────────────────────
  loading$ = new BehaviorSubject<boolean>(false);
  error$   = new BehaviorSubject<string | null>(null);

  // ── Estado de operaciones ───────────────────────────────────────────────────
  updatingTaskId:  number | null = null;
  editingTaskId:   number | null = null;
  savingEdit = false;
  deletingTaskId:  number | null = null;

  // ── Drag & drop ─────────────────────────────────────────────────────────────
  draggingTask: Task | null = null;
  dropTarget:   string | null = null;

  // ── Formulario de edición inline ────────────────────────────────────────────
  editForm!: FormGroup;

  // ── Filtros y orden ──────────────────────────────────────────────────────────
  sortBy: SortBy = 'recentes';
  quickFilter: QuickFilter = 'todas';
  searchText = '';
  filterEstado:    Estado | '' = '';
  filterPrioridad: Prioridad | '' = '';

  // ── Paginación ───────────────────────────────────────────────────────────────
  currentPage = 1;
  totalPages  = 1;
  totalItems  = 0;
  readonly PAGE_SIZE = 10;

  // ── Datos ────────────────────────────────────────────────────────────────────
  private rawTasks: Task[] = [];
  private tasksSubject = new BehaviorSubject<Task[]>([]);
  tasks$ = this.tasksSubject.asObservable();

  private currentFilters?: TaskFilters;
  private readonly searchSubject  = new Subject<string>();
  private readonly destroy$       = new Subject<void>();
  private readonly loadTasksTrigger$ = new Subject<{ filters?: TaskFilters; page: number }>();

  // ── Definición de columnas del kanban ────────────────────────────────────────
  readonly kanbanDefs: KanbanColumnDef[] = [
    {
      key: 'pendiente',
      label: 'Pendiente',
      isDropTarget: true,
      colors: {
        accent:   'bg-slate-400',
        iconBg:   'bg-slate-100 dark:bg-slate-800',
        icon:     'text-slate-500 dark:text-slate-400',
        label:    'text-slate-600 dark:text-slate-300',
        badge:    'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
        dropRing: 'ring-2 ring-blue-400 ring-offset-2 dark:ring-offset-slate-950 border-blue-300',
        headerBg: '',
      },
      iconPath:    'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      emptyText:   'Arrastra tareas aquí',
      emptyIsGood: false,
    },
    {
      key: 'en progreso',
      label: 'En progreso',
      isDropTarget: true,
      colors: {
        accent:   'bg-blue-500',
        iconBg:   'bg-blue-50 dark:bg-blue-900/20',
        icon:     'text-blue-600 dark:text-blue-400',
        label:    'text-blue-700 dark:text-blue-400',
        badge:    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
        dropRing: 'ring-2 ring-blue-400 ring-offset-2 dark:ring-offset-slate-950 border-blue-300',
        headerBg: '',
      },
      iconPath:    'M13 10V3L4 14h7v7l9-11h-7z',
      emptyText:   'Arrastra tareas aquí',
      emptyIsGood: false,
    },
    {
      key: 'completada',
      label: 'Completada',
      isDropTarget: true,
      colors: {
        accent:   'bg-emerald-400',
        iconBg:   'bg-emerald-50 dark:bg-emerald-900/20',
        icon:     'text-emerald-600 dark:text-emerald-400',
        label:    'text-emerald-700 dark:text-emerald-400',
        badge:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
        dropRing: 'ring-2 ring-emerald-400 ring-offset-2 dark:ring-offset-slate-950 border-emerald-300',
        headerBg: '',
      },
      iconPath:    'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      emptyText:   'Arrastra tareas aquí',
      emptyIsGood: false,
    },
    {
      key: 'vencidas',
      label: 'Vencidas',
      isDropTarget: false,
      colors: {
        accent:   'bg-rose-400',
        iconBg:   'bg-rose-50 dark:bg-rose-900/20',
        icon:     'text-rose-500 dark:text-rose-400',
        label:    'text-rose-600 dark:text-rose-400',
        badge:    'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300',
        dropRing: '',
        headerBg: '',
      },
      iconPath:    'M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z',
      emptyText:   'Sin tareas vencidas',
      emptyIsGood: true,
    },
  ];

  // ── Computed ─────────────────────────────────────────────────────────────────

  get today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  get kanbanColumns(): KanbanColumns {
    return this.filterService.buildKanbanColumns(
      this.rawTasks,
      this.searchText,
      this.filterPrioridad,
      this.filterEstado,
      this.quickFilter,
      this.sortBy
    );
  }

  isColumnDimmed(key: string): boolean {
    return this.quickFilter !== 'todas' && this.quickFilter !== key;
  }

  constructor(
    private readonly api:           TaskApiService,
    private readonly toast:         ToastService,
    private readonly router:        Router,
    private readonly route:         ActivatedRoute,
    private readonly fb:            FormBuilder,
    private readonly confirmModal:  ConfirmModalService,
    public  readonly filterService: TaskFilterService,
  ) {}

  @HostListener('document:click')
  onDocumentClick(): void { /* cierra menús flotantes si los hubiera */ }

  // ── Ciclo de vida ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.currentView = this.defaultView;
    this.initEditForm();
    this.initSearchDebounce();
    this.initLoadTasksPipeline();
    this.readUrlParams();
    this.loadTasks();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Inicialización privada ────────────────────────────────────────────────────

  private initEditForm(): void {
    this.editForm = this.fb.group({
      titulo:      ['', [Validators.required, Validators.minLength(3)]],
      descripcion: ['', [Validators.maxLength(500)]],
      estado:      ['pendiente'],
      prioridad:   ['media'],
      fechaLimite: [null],
      userId:      [null],
    });
  }

  private initLoadTasksPipeline(): void {
    this.loadTasksTrigger$.pipe(
      switchMap(({ filters, page }) =>
        this.api.getTasks({ ...filters, page, limit: 999 }).pipe(
          catchError((err) => {
            const msg = err?.error?.message || 'Error al cargar tareas';
            this.error$.next(msg);
            this.toast.error(msg);
            this.rawTasks = [];
            this.tasksSubject.next([]);
            this.totalItems = 0;
            this.totalPages = 1;
            return of({ data: [] as Task[], meta: { total: 0, page: 1, limit: 999, totalPages: 1 } });
          }),
          finalize(() => this.loading$.next(false))
        )
      ),
      takeUntil(this.destroy$)
    ).subscribe((response) => {
      this.rawTasks    = response.data;
      this.totalItems  = response.meta.total;
      this.totalPages  = response.meta.totalPages;
      this.currentPage = response.meta.page;
      this.applyFiltersAndSort();
    });
  }

  private initSearchDebounce(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => this.applyFiltersAndSort());
  }

  private readUrlParams(): void {
    const params = this.route.snapshot.queryParams;
    if (params['filtro'] && this.filterService.isValidQuickFilter(params['filtro'])) {
      this.quickFilter = params['filtro'];
    }
    if (params['orden'] && this.filterService.isValidSort(params['orden'])) {
      this.sortBy = params['orden'];
    }
  }

  // ── Carga de datos ────────────────────────────────────────────────────────────

  loadTasks(filters?: TaskFilters, page = this.currentPage): void {
    this.currentFilters = filters;
    this.currentPage    = page;
    this.loading$.next(true);
    this.error$.next(null);
    this.loadTasksTrigger$.next({ filters, page });
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;
    this.loadTasks(this.currentFilters, page);
  }

  // ── Filtros ───────────────────────────────────────────────────────────────────

  onSearchInput(): void {
    this.searchSubject.next(this.searchText);
  }

  onFilterChange(): void {
    this.applyFiltersAndSort();
  }

  clearSearch(): void {
    this.searchText = '';
    this.applyFiltersAndSort();
  }

  resetAllFilters(): void {
    this.searchText      = '';
    this.filterEstado    = '';
    this.filterPrioridad = '';
    this.quickFilter     = 'todas';
    this.applyFiltersAndSort();
  }

  setSort(value: SortBy): void {
    this.sortBy = value;
    this.updateUrlParams();
    this.applyFiltersAndSort();
  }

  setQuickFilter(value: QuickFilter): void {
    this.quickFilter = value;
    this.updateUrlParams();
    this.applyFiltersAndSort();
  }

  private applyFiltersAndSort(): void {
    const filtered = this.filterService.applyListFilter(
      this.rawTasks,
      this.searchText,
      this.filterPrioridad,
      this.filterEstado,
      this.quickFilter,
      this.sortBy
    );
    this.tasksSubject.next(filtered);
  }

  private updateUrlParams(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        filtro: this.quickFilter === 'todas' ? null : this.quickFilter,
        orden:  this.sortBy === 'recentes'   ? null : this.sortBy,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────────

  onStatusChange(id: number, estado: Task['estado']): void {
    this.updatingTaskId = id;
    this.api.updateTaskStatus(id, estado).pipe(
      finalize(() => { this.updatingTaskId = null; })
    ).subscribe({
      next: (updatedTask) => {
        this.toast.success('Estado actualizado');
        this.rawTasks = this.rawTasks.map(t => t.id === id ? updatedTask : t);
        this.taskStatusChanged.emit(updatedTask);
        this.applyFiltersAndSort();
      },
      error: (err) => {
        const msg = err?.error?.message || 'Error al actualizar el estado';
        this.error$.next(msg);
        this.toast.error(msg);
      },
    });
  }

  startEdit(task: Task): void {
    this.editingTaskId = task.id;
    this.error$.next(null);
    this.editForm.reset({
      titulo:      task.titulo,
      descripcion: task.descripcion || '',
      estado:      task.estado,
      prioridad:   task.prioridad || 'media',
      fechaLimite: task.fechaLimite ? String(task.fechaLimite).slice(0, 10) : null,
      userId:      task.userId ?? null,
    });
  }

  cancelEdit(): void {
    if (this.savingEdit) return;
    this.editingTaskId = null;
  }

  submitInlineEdit(taskId: number): void {
    if (this.editForm.invalid) { this.editForm.markAllAsTouched(); return; }
    const raw = this.editForm.getRawValue();
    const payload: TaskPayload = {
      titulo:      raw.titulo?.trim() ?? '',
      descripcion: raw.descripcion?.trim() || '',
      estado:      raw.estado,
      prioridad:   raw.prioridad,
      fechaLimite: raw.fechaLimite || null,
      userId:      raw.userId ? Number(raw.userId) : null,
    };
    this.saveEdit(taskId, payload);
  }

  private saveEdit(taskId: number, payload: TaskPayload): void {
    this.savingEdit = true;
    this.api.updateTask(taskId, payload).pipe(
      finalize(() => { this.savingEdit = false; })
    ).subscribe({
      next: (updatedTask) => {
        this.toast.success('Tarea actualizada');
        this.editingTaskId = null;
        this.taskUpdated.emit(updatedTask ?? { id: taskId, titulo: payload.titulo } as Task);
        this.loadTasks(this.currentFilters, this.currentPage);
      },
      error: (err) => {
        const msg = err?.error?.message || 'Error al actualizar la tarea';
        this.error$.next(msg);
        this.toast.error(msg);
      },
    });
  }

  async deleteTask(task: Task): Promise<void> {
    const ok = await this.confirmModal.confirm(`¿Eliminar la tarea "${task.titulo}"?`);
    if (!ok) return;
    this.deletingTaskId = task.id;
    this.api.deleteTask(task.id).pipe(
      finalize(() => { this.deletingTaskId = null; })
    ).subscribe({
      next: () => {
        this.toast.success('Tarea eliminada');
        this.taskDeleted.emit(task);
        if (this.editingTaskId === task.id) this.editingTaskId = null;
        const newPage = this.rawTasks.length === 1 && this.currentPage > 1
          ? this.currentPage - 1 : this.currentPage;
        this.loadTasks(this.currentFilters, newPage);
      },
      error: (err) => {
        const msg = err?.error?.message || 'Error al eliminar la tarea';
        this.error$.next(msg);
        this.toast.error(msg);
      },
    });
  }

  // ── Drag & drop ───────────────────────────────────────────────────────────────

  onDragStart(event: DragEvent, task: Task): void {
    this.draggingTask = task;
    event.dataTransfer?.setData('text/plain', String(task.id));
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  }

  onDragOver(event: DragEvent, estado: string): void {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    this.dropTarget = estado;
  }

  onDragLeave(): void {
    this.dropTarget = null;
  }

  onDrop(event: DragEvent, columnKey: string): void {
    event.preventDefault();
    this.dropTarget = null;
    const estado = columnKey as Task['estado'];
    if (this.draggingTask && this.draggingTask.estado !== estado) {
      this.onStatusChange(this.draggingTask.id, estado);
    }
    this.draggingTask = null;
  }

  onDragEnd(): void {
    this.draggingTask = null;
    this.dropTarget   = null;
  }

  // ── Helper badge de estado ────────────────────────────────────────────────────

  getStatusBadge(task: Task): { label: string; bg: string; dot: string } {
    if (this.filterService.isOverdue(task)) {
      return { label: 'Vencida',     bg: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',         dot: 'bg-rose-500' };
    }
    switch (task.estado) {
      case 'en progreso': return { label: 'En progreso', bg: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',           dot: 'bg-sky-500 animate-ping-dot' };
      case 'completada':  return { label: 'Completada',  bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', dot: 'bg-emerald-500' };
      default:            return { label: 'Pendiente',   bg: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',    dot: 'bg-amber-500' };
    }
  }

  // ── Helpers de usuario ────────────────────────────────────────────────────────

  getUserLabel(userId: number | null | undefined): string {
    if (!userId) return '';
    const u = this.users.find(u => u.id === userId);
    return u ? (u.nombre || u.email || '') : '';
  }

  getUserInitials(userId: number | null | undefined): string {
    const label = this.getUserLabel(userId);
    if (!label) return '?';
    const parts = label.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return label.slice(0, 2).toUpperCase();
  }

  private readonly avatarPalette = [
    'bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500',
    'bg-rose-500',   'bg-cyan-500',  'bg-pink-500',   'bg-indigo-500',
  ];

  getAvatarColor(userId: number | null | undefined): string {
    if (!userId) return 'bg-slate-400';
    return this.avatarPalette[userId % this.avatarPalette.length];
  }
}
