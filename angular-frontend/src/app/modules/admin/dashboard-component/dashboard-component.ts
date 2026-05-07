import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthStore } from '../../../shared/services/auth-store';
import { AdminUsersService } from '../../../shared/services/admin-users.service';
import { ToastService } from '../../../shared/services/toast-service';
import { AdminUser } from '../../../shared/interfaces/admin-users';
import { TaskFormComponent } from '../../tasks-page-component/components/task-form-component/task-form-component';
import { TaskListComponent } from '../../tasks-page-component/components/task-list-component/task-list-component';
import { TaskApiService } from '../../../features/tasks/data/task-api';
import { TaskPayload, Task } from '../../../shared/interfaces/tasks';
import { TaskFilterService } from '../../tasks-page-component/components/task-list-component/task-filter.service';
import { ConfirmModalService } from '../../../shared/components/confirm-modal/confirm-modal.service';

interface ActivityEntry {
  type: 'user_created' | 'user_updated' | 'user_deleted' | 'task_created' | 'task_deleted' | 'task_updated' | 'task_status_changed' | 'password_reset';
  message: string;
  time: Date;
}

interface AdminStats {
  totalTareas: number;
  pendientes: number;
  enProgreso: number;
  completadas: number;
  vencidas: number;
  estasSemana: number;
  totalUsuarios: number;
  usuariosAdmin: number;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, TaskFormComponent, TaskListComponent],
  templateUrl: './dashboard-component.html',
})
export class AdminDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(TaskListComponent) taskList?: TaskListComponent;

  readonly Math = Math;

  get today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  // ── Sidebar ──
  activeSection = 'usuarios';
  private observer?: IntersectionObserver;
  private isScrollingProgrammatically = false;
  private scrollEndTimeout?: ReturnType<typeof setTimeout>;

  // ── Estadísticas ──
  selectedStat: string | null = null;
  statsLoading = false;
  statDetailPage = 1;
  readonly STAT_DETAIL_PAGE_SIZE = 10;
  private statsInterval?: ReturnType<typeof setInterval>;
  allTasks: Task[] = [];
  allUsers: AdminUser[] = [];
  stats: AdminStats = {
    totalTareas: 0, pendientes: 0, enProgreso: 0,
    completadas: 0, vencidas: 0, estasSemana: 0,
    totalUsuarios: 0, usuariosAdmin: 0,
  };

  // ── Actividad reciente ──
  activityLog: ActivityEntry[] = [];
  activityTab: 'admin' | 'sistema' | 'usuarios' = 'sistema';

  // ── Actividad por usuario (pestaña) ──
  userStatsSearch = '';
  userStatsPage = 1;
  readonly USER_STATS_PAGE_SIZE = 10;

  get filteredUserStats() {
    const q = this.userStatsSearch.trim().toLowerCase();
    const all = this.userTaskStats;
    const filtered = q
      ? all.filter(r =>
          (r.user.nombre ?? '').toLowerCase().includes(q) ||
          (r.user.email ?? '').toLowerCase().includes(q)
        )
      : all;
    return filtered;
  }

  get pagedUserStats() {
    const start = (this.userStatsPage - 1) * this.USER_STATS_PAGE_SIZE;
    return this.filteredUserStats.slice(start, start + this.USER_STATS_PAGE_SIZE);
  }

  get userStatsTotalPages() {
    return Math.max(1, Math.ceil(this.filteredUserStats.length / this.USER_STATS_PAGE_SIZE));
  }

  onUserStatsSearch(): void {
    this.userStatsPage = 1;
  }

  // ── Usuarios ──
  users: AdminUser[] = [];
  filteredSuggestions: AdminUser[] = [];
  loadingUsers = false;
  creatingUser = false;
  showCreateUserForm = false;
  resettingUserId: number | null = null;
  deletingUserId: number | null = null;
  search = '';
  roleFilter: 'all' | 'admin' | 'user' = 'all';
  private searchTimeout?: ReturnType<typeof setTimeout>;
  currentPage = 1;
  totalPages = 1;
  totalUsers = 0;
  readonly PAGE_SIZE = 10;
  createForm!: ReturnType<FormBuilder['group']>;

  // ── Edición de usuario ──
  editingUser: AdminUser | null = null;
  editUserForm!: ReturnType<FormBuilder['group']>;
  savingUser = false;

  // ── Tareas ──
  showCreateTaskForm = false;
  creatingTask = false;

  constructor(
    public readonly store: AuthStore,
    private readonly fb: FormBuilder,
    private readonly adminUsersService: AdminUsersService,
    private readonly taskApi: TaskApiService,
    private readonly toast: ToastService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
    private readonly confirmModal: ConfirmModalService,
    public readonly filterService: TaskFilterService,
  ) {}

  get filteredUsers(): AdminUser[] {
    if (this.roleFilter === 'admin') return this.users.filter(u => u.roles?.includes('ROLE_ADMIN'));
    if (this.roleFilter === 'user')  return this.users.filter(u => !u.roles?.includes('ROLE_ADMIN'));
    return this.users;
  }

  ngOnInit(): void {
    this.createForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      nombre: [''],
      isAdmin: [false],
    });

    this.editUserForm = this.fb.group({
      nombre: [''],
      email: ['', [Validators.required, Validators.email]],
      isAdmin: [false],
    });
    this.loadStats();
    this.loadUsers();
    this.loadActivityLog();
    // Auto-refresh stats every 30 s
    this.statsInterval = setInterval(() => this.loadStats(), 30_000);
    // Actualiza los tiempos relativos de actividad cada 30 s
    this.activityInterval = setInterval(() => { this.activityTick++; }, 30_000);
  }

  ngAfterViewInit(): void {
    this.observer = new IntersectionObserver(
      (entries) => {
        if (this.isScrollingProgrammatically) return;
        entries.forEach(entry => {
          if (entry.isIntersecting) this.activeSection = entry.target.id;
        });
      },
      { threshold: 0.15, rootMargin: '-80px 0px -50% 0px' }
    );
    ['estadisticas', 'actividad', 'usuarios', 'tareas'].forEach(id => {
      const el = document.getElementById(id);
      if (el) this.observer?.observe(el);
    });
  }

  // Fuerza re-render del tiempo relativo en actividad cada 30 s
  activityTick = 0;
  private activityInterval?: ReturnType<typeof setInterval>;

  ngOnDestroy(): void {
    this.observer?.disconnect();
    clearInterval(this.statsInterval);
    clearInterval(this.activityInterval);
    clearTimeout(this.searchTimeout);
    clearTimeout(this.scrollEndTimeout);
  }

  scrollToSection(id: string): void {
    this.activeSection = id;
    this.isScrollingProgrammatically = true;

    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    clearTimeout(this.scrollEndTimeout);
    this.scrollEndTimeout = setTimeout(() => {
      this.isScrollingProgrammatically = false;
    }, 800);
  }

  toggleStat(key: string): void {
    this.selectedStat = this.selectedStat === key ? null : key;
    this.statDetailPage = 1;
  }

  get pagedStatDetailTasks(): Task[] {
    const start = (this.statDetailPage - 1) * this.STAT_DETAIL_PAGE_SIZE;
    return this.statDetailTasks.slice(start, start + this.STAT_DETAIL_PAGE_SIZE);
  }

  get statDetailTotalPages(): number {
    return Math.max(1, Math.ceil(this.statDetailTasks.length / this.STAT_DETAIL_PAGE_SIZE));
  }

  get statDetailUsers(): AdminUser[] {
    if (this.selectedStat === 'usuariosAdmin') {
      return this.allUsers.filter(u => u.roles?.includes('ROLE_ADMIN'));
    }
    return this.allUsers;
  }

  get pagedStatDetailUsers(): AdminUser[] {
    const start = (this.statDetailPage - 1) * this.STAT_DETAIL_PAGE_SIZE;
    return this.statDetailUsers.slice(start, start + this.STAT_DETAIL_PAGE_SIZE);
  }

  get statDetailUsersTotalPages(): number {
    return Math.max(1, Math.ceil(this.statDetailUsers.length / this.STAT_DETAIL_PAGE_SIZE));
  }

  statDetailLastItem(total: number): number {
    return Math.min(this.statDetailPage * this.STAT_DETAIL_PAGE_SIZE, total);
  }

  get statDetailTasks(): Task[] {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7); weekAgo.setHours(0, 0, 0, 0);
    switch (this.selectedStat) {
      case 'pendientes':   return this.allTasks.filter(t => t.estado === 'pendiente');
      case 'enProgreso':   return this.allTasks.filter(t => t.estado === 'en progreso');
      case 'completadas':  return this.allTasks.filter(t => t.estado === 'completada');
      case 'vencidas':     return this.allTasks.filter(t => {
        if (!t.fechaLimite || t.estado === 'completada') return false;
        const due = new Date(t.fechaLimite); due.setHours(0, 0, 0, 0);
        return due < today;
      });
      case 'estasSemana':  return this.allTasks.filter(t => {
        if (!t.fechaCreacion) return false;
        return new Date(t.fechaCreacion) >= weekAgo;
      });
      case 'totalTareas':  return this.allTasks;
      default:             return [];
    }
  }

  // ── Estadísticas ──

  loadStats(): void {
    this.statsLoading = true;
    forkJoin({
      tasks: this.taskApi.getTasks({ limit: 999 }),
      users: this.adminUsersService.getUsers('', 1, 999),
    }).subscribe({
      next: ({ tasks, users }) => {
        if (!tasks?.meta || !users?.meta) {
          this.statsLoading = false;
          this.toast.error('Error al cargar las estadísticas');
          return;
        }
        this.allTasks = tasks.data;
        this.allUsers = users.data;
        const allTasks: Task[] = tasks.data;
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7); weekAgo.setHours(0, 0, 0, 0);

        this.stats = {
          totalTareas: tasks.meta.total ?? 0,
          pendientes: allTasks.filter(t => t.estado === 'pendiente').length,
          enProgreso: allTasks.filter(t => t.estado === 'en progreso').length,
          completadas: allTasks.filter(t => t.estado === 'completada').length,
          vencidas: allTasks.filter(t => {
            if (!t.fechaLimite || t.estado === 'completada') return false;
            const due = new Date(t.fechaLimite); due.setHours(0, 0, 0, 0);
            return due < today;
          }).length,
          estasSemana: allTasks.filter(t => {
            if (!t.fechaCreacion) return false;
            return new Date(t.fechaCreacion) >= weekAgo;
          }).length,
          totalUsuarios: users.meta.total ?? 0,
          usuariosAdmin: users.data.filter(u => u.roles?.includes('ROLE_ADMIN')).length,
        };
        this.statsLoading = false;
      },
      error: () => { this.statsLoading = false; },
    });
  }

  // ── Timeline del sistema (derivado de allTasks) ──

  get systemTimeline(): Array<{ task: Task; tipo: 'creada' | 'vencida' | 'completada' | 'en_progreso'; fecha: Date }> {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const entries: Array<{ task: Task; tipo: 'creada' | 'vencida' | 'completada' | 'en_progreso'; fecha: Date }> = [];

    for (const t of this.allTasks) {
      const fechaCreacion = t.fechaCreacion ? new Date(t.fechaCreacion) : null;
      if (fechaCreacion) {
        entries.push({ task: t, tipo: 'creada', fecha: fechaCreacion });
      }
      if (t.estado === 'completada' && t.fechaActualizacion) {
        entries.push({ task: t, tipo: 'completada', fecha: new Date(t.fechaActualizacion) });
      }
    }

    return entries
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
      .slice(0, 40);
  }

  formatSystemTime(date: Date): string {
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return 'Ahora mismo';
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
    if (diff < 86400 * 7) return `Hace ${Math.floor(diff / 86400)} días`;
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  }

  // ── Estadísticas por usuario ──

  get userTaskStats(): Array<{ user: AdminUser; total: number; pendientes: number; enProgreso: number; completadas: number; vencidas: number }> {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return this.allUsers.map(u => {
      const tasks = this.allTasks.filter(t => t.userId === u.id || t.user?.id === u.id);
      return {
        user: u,
        total: tasks.length,
        pendientes: tasks.filter(t => t.estado === 'pendiente').length,
        enProgreso: tasks.filter(t => t.estado === 'en progreso').length,
        completadas: tasks.filter(t => t.estado === 'completada').length,
        vencidas: tasks.filter(t => {
          if (!t.fechaLimite || t.estado === 'completada') return false;
          const due = new Date(t.fechaLimite); due.setHours(0, 0, 0, 0);
          return due < today;
        }).length,
      };
    }).sort((a, b) => b.total - a.total);
  }

  // ── Actividad reciente ──

  private readonly ACTIVITY_KEY = 'admin_activity_log';

  private loadActivityLog(): void {
    try {
      const stored = localStorage.getItem(this.ACTIVITY_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.activityLog = parsed.map((e: any) => ({ ...e, time: new Date(e.time) }));
      }
    } catch { this.activityLog = []; }
  }

  private addActivity(type: ActivityEntry['type'], message: string): void {
    this.activityLog = [{ type, message, time: new Date() }, ...this.activityLog].slice(0, 30);
    try {
      localStorage.setItem(this.ACTIVITY_KEY, JSON.stringify(this.activityLog));
    } catch { /* quota exceeded — ignorar */ }
  }

  clearActivityLog(): void {
    this.activityLog = [];
    localStorage.removeItem(this.ACTIVITY_KEY);
  }

  formatActivityTime(time: Date): string {
    const diff = Math.floor((Date.now() - time.getTime()) / 1000);
    if (diff < 60) return 'Ahora mismo';
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
    return time.toLocaleDateString('es-ES');
  }

  // ── Usuarios ──

  loadUsers(page = this.currentPage): void {
    this.loadingUsers = true;
    this.adminUsersService.getUsers(this.search, page, this.PAGE_SIZE).subscribe({
      next: (response) => {
        this.users = response.data;
        this.totalUsers = response.meta.total;
        this.totalPages = response.meta.totalPages;
        this.currentPage = response.meta.page;
        this.filteredSuggestions = [];
        this.loadingUsers = false;
      },
      error: () => { this.toast.error('No se pudieron cargar los usuarios'); this.loadingUsers = false; },
    });
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;
    this.loadUsers(page);
  }

  get pageEnd(): number {
    return Math.min(this.currentPage * this.PAGE_SIZE, this.totalUsers);
  }

  updateSuggestions(): void {
    const term = this.search.trim().toLowerCase();
    if (!term) { this.filteredSuggestions = []; return; }
    this.filteredSuggestions = this.users
      .filter(u => (u.email?.toLowerCase().includes(term) ?? false) || (u.nombre?.toLowerCase().includes(term) ?? false))
      .slice(0, 5);
  }

  selectSuggestion(user: AdminUser): void {
    this.search = user.email || user.nombre || '';
    this.filteredSuggestions = [];
  }

  onSearch(): void {
    this.filteredSuggestions = [];
    this.loadUsers(1);
  }

  onSearchInput(): void {
    this.updateSuggestions();
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.onSearch(), 400);
  }

  onCreateUser(): void {
    if (this.createForm.invalid) { this.createForm.markAllAsTouched(); return; }
    this.creatingUser = true;
    const raw = this.createForm.getRawValue();
    const payload = {
      email: raw.email ?? '', password: raw.password ?? '',
      nombre: raw.nombre ?? '',
      roles: raw.isAdmin ? ['ROLE_ADMIN', 'ROLE_USER'] : ['ROLE_USER'],
    };
    this.adminUsersService.createUser(payload).subscribe({
      next: () => {
        this.toast.success('Usuario creado correctamente');
        this.addActivity('user_created', `Usuario ${raw.email} creado`);
        this.createForm.reset({ email: '', password: '', nombre: '', isAdmin: false });
        this.creatingUser = false;
        this.showCreateUserForm = false;
        this.loadUsers(1);
        this.loadStats();
      },
      error: () => { this.toast.error('No se pudo crear el usuario'); this.creatingUser = false; },
    });
  }

  onResetPassword(user: AdminUser): void {
    this.resettingUserId = user.id;
    this.adminUsersService.resetPassword(user.id).subscribe({
      next: () => {
        this.toast.success(`Contraseña reseteada para ${user.email}`);
        this.addActivity('password_reset', `Contraseña reseteada para ${user.email}`);
        this.resettingUserId = null;
      },
      error: () => { this.toast.error('No se pudo resetear la contraseña'); this.resettingUserId = null; },
    });
  }

  openEditUser(user: AdminUser): void {
    this.editingUser = user;
    this.editUserForm.reset({
      nombre: user.nombre ?? '',
      email: user.email,
      isAdmin: user.roles?.includes('ROLE_ADMIN') ?? false,
    });
  }

  cancelEditUser(): void {
    if (this.savingUser) return;
    this.editingUser = null;
  }

  saveEditUser(): void {
    if (!this.editingUser || this.editUserForm.invalid) {
      this.editUserForm.markAllAsTouched();
      return;
    }
    this.savingUser = true;
    const raw = this.editUserForm.getRawValue();
    const payload = {
      nombre: raw.nombre ?? '',
      email: raw.email ?? '',
      roles: raw.isAdmin ? ['ROLE_ADMIN', 'ROLE_USER'] : ['ROLE_USER'],
    };
    this.adminUsersService.updateUser(this.editingUser.id, payload).subscribe({
      next: (updated) => {
        this.toast.success(`Usuario ${updated.email} actualizado`);
        this.addActivity('user_updated', `Usuario ${updated.email} actualizado`);
        this.savingUser = false;
        this.editingUser = null;
        this.loadUsers(this.currentPage);
        this.loadStats();
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'No se pudo actualizar el usuario');
        this.savingUser = false;
      },
    });
  }

  async onDeleteUser(user: AdminUser): Promise<void> {
    const ok = await this.confirmModal.confirm(
      `¿Eliminar permanentemente a ${user.nombre || user.email}?`,
      { confirmLabel: 'Eliminar' }
    );
    if (!ok) return;
    this.deletingUserId = user.id;
    this.adminUsersService.deleteUser(user.id).subscribe({
      next: () => {
        this.toast.success('Usuario eliminado correctamente');
        this.addActivity('user_deleted', `Usuario ${user.email} eliminado`);
        this.deletingUserId = null;
        const newPage = this.users.length === 1 && this.currentPage > 1 ? this.currentPage - 1 : this.currentPage;
        this.loadUsers(newPage);
        this.loadStats();
      },
      error: (err) => { this.toast.error(err.error?.message || 'Error al eliminar usuario'); this.deletingUserId = null; },
    });
  }

  // ── Tareas ──

  onTaskSubmitted(payload: TaskPayload): void {
    this.creatingTask = true;
    this.taskApi.createTask(payload).subscribe({
      next: () => {
        this.toast.success('Tarea creada correctamente');
        this.addActivity('task_created', `Tarea "${payload.titulo}" creada`);
        this.taskList?.loadTasks();
        this.creatingTask = false;
        this.showCreateTaskForm = false;
        this.loadStats();
      },
      error: (err) => { this.toast.error(err?.error?.message || 'No se pudo crear la tarea'); this.creatingTask = false; },
    });
  }

  onTaskDeleted(task: Task): void {
    this.addActivity('task_deleted', `Tarea "${task.titulo}" eliminada`);
    this.taskList?.loadTasks();
    this.loadStats();
  }

  onTaskUpdated(task: Task): void {
    this.addActivity('task_updated', `Tarea "${task.titulo}" actualizada`);
    this.taskList?.loadTasks();
    this.loadStats();
  }

  onTaskStatusChanged(task: Task): void {
    const estados: Record<string, string> = { pendiente: 'Pendiente', 'en progreso': 'En progreso', completada: 'Completada' };
    this.addActivity('task_status_changed', `"${task.titulo}" → ${estados[task.estado] ?? task.estado}`);
    this.taskList?.loadTasks();
    this.loadStats();
  }

  // ── TrackBy functions ──

  trackByUserId(_index: number, user: AdminUser): number {
    return user.id;
  }

  trackByTaskId(_index: number, task: Task): number {
    return task.id;
  }

  trackByIndex(index: number): number {
    return index;
  }

  trackByUserStat(_index: number, row: { user: AdminUser }): number {
    return row.user.id;
  }

}
