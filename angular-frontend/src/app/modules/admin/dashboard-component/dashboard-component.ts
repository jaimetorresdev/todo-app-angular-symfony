import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthStore } from '../../../shared/services/auth-store';
import { AdminUsersService } from '../../../shared/services/admin-users.service';
import { ToastService } from '../../../shared/services/toast-service';
import { AdminUser } from '../../../shared/interfaces/admin-users';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './dashboard-component.html',
})
export class AdminDashboardComponent implements OnInit {
  users: AdminUser[] = [];
  filteredSuggestions: AdminUser[] = [];
  loadingUsers = false;
  creatingUser = false;
  searchingUsers = false;
  resettingUserId: number | null = null;
  search = '';

  createForm!: ReturnType<FormBuilder['group']>;

  constructor(
    public readonly store: AuthStore,
    private readonly fb: FormBuilder,
    private readonly adminUsersService: AdminUsersService,
    private readonly toast: ToastService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.createForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      nombre: [''],
      isAdmin: [false],
    });

    this.loadUsers();
  }

  logout(): void {
    this.store.clearSession();
    this.router.navigateByUrl('/');
  }

  loadUsers(): void {
    this.loadingUsers = true;

    this.adminUsersService.getUsers(this.search).subscribe({
      next: (users) => {
        this.users = users;
        this.filteredSuggestions = [];
        this.loadingUsers = false;
      },
      error: () => {
        this.toast.error('No se pudieron cargar los usuarios');
        this.loadingUsers = false;
      },
    });
  }

  updateSuggestions(): void {
    const term = this.search.trim().toLowerCase();

    if (!term) {
      this.filteredSuggestions = [];
      return;
    }

    this.filteredSuggestions = this.users
      .filter(
        (user) =>
          (user.email?.toLowerCase().includes(term) ?? false) ||
          (user.nombre?.toLowerCase().includes(term) ?? false)
      )
      .slice(0, 5);
  }

  selectSuggestion(user: AdminUser): void {
    this.search = user.email || user.nombre || '';
    this.filteredSuggestions = [];
  }

  onSearch(): void {
    this.searchingUsers = true;
    this.loadingUsers = true;
    this.filteredSuggestions = [];

    this.adminUsersService.getUsers(this.search).subscribe({
      next: (users) => {
        this.users = users;
        this.loadingUsers = false;
        this.searchingUsers = false;
      },
      error: () => {
        this.toast.error('No se pudieron cargar los usuarios');
        this.loadingUsers = false;
        this.searchingUsers = false;
      },
    });
  }

  onCreateUser(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    this.creatingUser = true;

    const raw = this.createForm.getRawValue();

    const payload = {
      email: raw.email ?? '',
      password: raw.password ?? '',
      nombre: raw.nombre ?? '',
      roles: raw.isAdmin ? ['ROLE_ADMIN', 'ROLE_USER'] : ['ROLE_USER'],
    };

    this.adminUsersService.createUser(payload).subscribe({
      next: () => {
        this.toast.success('Usuario creado correctamente');
        this.createForm.reset({
          email: '',
          password: '',
          nombre: '',
          isAdmin: false,
        });
        this.creatingUser = false;
        this.loadUsers();
      },
      error: () => {
        this.toast.error('No se pudo crear el usuario');
        this.creatingUser = false;
      },
    });
  }

  onResetPassword(user: AdminUser): void {
    this.resettingUserId = user.id;

    this.adminUsersService.resetPassword(user.id).subscribe({
      next: async (res) => {
        try {
          await navigator.clipboard.writeText(res.passwordTemporal);
          this.toast.success(`Contraseña temporal: ${res.passwordTemporal}. Copiada al portapapeles.`);
        } catch {
          this.toast.success(`Contraseña temporal: ${res.passwordTemporal}`);
        }

        this.resettingUserId = null;
      },
      error: () => {
        this.toast.error('No se pudo resetear la contraseña');
        this.resettingUserId = null;
      },
    });
  }
}