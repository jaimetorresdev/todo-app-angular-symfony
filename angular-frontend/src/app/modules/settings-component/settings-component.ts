import { CommonModule } from '@angular/common';
import { Component, OnInit, effect, inject } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../shared/services/auth-store';
import { AuthService } from '../../shared/services/auth-service';
import { ToastService } from '../../shared/services/toast-service';

const settingsSecurityValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const currentPassword = (control.get('currentPassword')?.value ?? '') as string;
  const newPassword = (control.get('newPassword')?.value ?? '') as string;
  const confirmPassword = (control.get('confirmPassword')?.value ?? '') as string;

  if (!currentPassword && !newPassword && !confirmPassword) {
    return null;
  }

  if ((newPassword || confirmPassword) && !currentPassword) {
    return { currentPasswordRequired: true };
  }

  if (currentPassword && !newPassword) {
    return { newPasswordRequired: true };
  }

  if (newPassword !== confirmPassword) {
    return { passwordMismatch: true };
  }

  return null;
};

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './settings-component.html',
})
export class SettingsComponent implements OnInit {
  readonly store = inject(AuthStore);

  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  saving = false;
  form!: FormGroup;
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  constructor() {
    effect(() => {
      const user = this.store.user();

      if (!user || !this.form) {
        return;
      }

      this.form.patchValue({
        nombre: user.nombre ?? '',
        email: user.email ?? '',
      }, { emitEvent: false });
    });
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      nombre: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      currentPassword: [''],
      newPassword: ['', [Validators.minLength(6)]],
      confirmPassword: [''],
    }, { validators: settingsSecurityValidator });

    const user = this.store.user();
    if (user) {
      this.form.patchValue({
        nombre: user.nombre ?? '',
        email: user.email ?? '',
      }, { emitEvent: false });
    }

    if (!user) {
      this.store.loadMe().subscribe({
        error: () => {
          this.toast.error('No se pudo cargar tu perfil');
          this.router.navigateByUrl('/');
        },
      });
    }
  }

  get userName(): string {
    return this.store.user()?.nombre || 'Tu cuenta';
  }

  get userEmail(): string {
    return this.store.user()?.email || '';
  }

  get userInitial(): string {
    const source = this.userName || this.userEmail || 'U';
    return source.charAt(0).toUpperCase();
  }

  hasFieldError(fieldName: string, errorCode?: string): boolean {
    const field = this.form.get(fieldName);

    if (!field || !field.touched) {
      return false;
    }

    return errorCode ? field.hasError(errorCode) : field.invalid;
  }

  hasSecurityError(errorCode: string): boolean {
    const currentPassword = this.form.get('currentPassword');
    const newPassword = this.form.get('newPassword');
    const confirmPassword = this.form.get('confirmPassword');
    const touched = !!currentPassword?.touched || !!newPassword?.touched || !!confirmPassword?.touched;

    return touched && this.form.hasError(errorCode);
  }

  onSubmit(): void {
    if (this.form.invalid || this.saving) {
      this.form.markAllAsTouched();
      return;
    }

    const currentUser = this.store.user();

    if (!currentUser) {
      this.toast.error('No se ha encontrado la sesión actual');
      this.router.navigateByUrl('/login');
      return;
    }

    const raw = this.form.getRawValue();
    const shouldRelogin = (raw.email ?? '') !== (currentUser.email ?? '') || !!raw.newPassword;

    this.saving = true;

    this.auth.updateProfile({
      nombre: raw.nombre ?? '',
      email: raw.email ?? '',
      currentPassword: raw.newPassword ? (raw.currentPassword ?? '') : undefined,
      newPassword: raw.newPassword ? (raw.newPassword ?? '') : undefined,
    }).subscribe({
      next: ({ user }) => {
        this.saving = false;

        if (shouldRelogin) {
          this.toast.success('Perfil actualizado. Inicia sesión de nuevo.');
          this.store.clearSession();
          this.router.navigateByUrl('/login');
          return;
        }

        this.store.setUser(user);
        this.form.patchValue({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }, { emitEvent: false });
        this.form.markAsPristine();
        this.form.markAsUntouched();
        this.toast.success('Ajustes guardados correctamente');
      },
      error: (err) => {
        this.saving = false;
        const msg = err?.error?.message || 'No se pudieron guardar los ajustes';
        this.toast.error(msg);
      },
    });
  }
}
