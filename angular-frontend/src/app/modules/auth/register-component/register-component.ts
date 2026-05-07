import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../shared/services/auth-service';
import { ToastService } from '../../../shared/services/toast-service';

const passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  if (!confirmPassword) {
    return null;
  }

  return password === confirmPassword ? null : { passwordMismatch: true };
};

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register-component.html',
})
export class RegisterComponent implements OnInit {
  loading = false;
  form!: FormGroup;
  passwordVisible = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: AuthService,
    private readonly toast: ToastService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      nombre: ['', [Validators.required]],
      confirmPassword: ['', [Validators.required]],
    }, { validators: passwordMatchValidator });
  }

  get passwordValue(): string {
    return this.form?.get('password')?.value ?? '';
  }

  get passwordRequirements(): Array<{ label: string; met: boolean }> {
    const password = this.passwordValue;

    return [
      { label: 'Al menos 6 caracteres', met: password.length >= 6 },
      { label: 'Una mayúscula o un número', met: /[A-Z]/.test(password) || /[0-9]/.test(password) },
      { label: 'Un símbolo especial', met: /[^A-Za-z0-9]/.test(password) },
    ];
  }

  get passwordStrength(): { label: string; tone: string; width: string } {
    const password = this.passwordValue;

    if (!password) {
      return {
        label: 'Empieza con una clave segura',
        tone: 'text-slate-400 dark:text-slate-500',
        width: 'w-0',
      };
    }

    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 10) score += 1;
    if (/[A-Z]/.test(password) || /[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 1) {
      return {
        label: 'Seguridad baja',
        tone: 'text-rose-500 dark:text-rose-400',
        width: 'w-1/4',
      };
    }

    if (score <= 3) {
      return {
        label: 'Seguridad media',
        tone: 'text-amber-500 dark:text-amber-400',
        width: 'w-2/3',
      };
    }

    return {
      label: 'Seguridad alta',
      tone: 'text-emerald-500 dark:text-emerald-400',
      width: 'w-full',
    };
  }

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  hasFieldError(fieldName: string, errorCode?: string): boolean {
    const field = this.form.get(fieldName);

    if (!field || !field.touched) {
      return false;
    }

    return errorCode ? field.hasError(errorCode) : field.invalid;
  }

  hasPasswordMismatch(): boolean {
    const confirmPassword = this.form.get('confirmPassword');
    return !!confirmPassword?.touched && this.form.hasError('passwordMismatch');
  }

  hasPasswordMatch(): boolean {
    const confirmPassword = this.form.get('confirmPassword');

    return !!confirmPassword?.touched
      && !!confirmPassword?.value
      && !confirmPassword.hasError('required')
      && !this.form.hasError('passwordMismatch');
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;

    const { email, password, nombre } = this.form.getRawValue();

    this.auth.register({
      email: email ?? '',
      password: password ?? '',
      nombre: nombre ?? '',
    }).subscribe({
      next: () => {
        this.loading = false;
        this.toast.success('Cuenta creada correctamente');
        this.router.navigateByUrl('/login');
      },
      error: (err) => {
        this.loading = false;
        const msg = err?.error?.message || 'No se pudo crear la cuenta';
        this.toast.error(msg);
      },
    });
  }
}
