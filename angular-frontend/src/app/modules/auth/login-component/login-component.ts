import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../shared/services/auth-service';
import { AuthStore } from '../../../shared/services/auth-store';
import { ToastService } from '../../../shared/services/toast-service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login-component.html',
})
export class LoginComponent implements OnInit {
  loading = false;
  form!: FormGroup;

  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: AuthService,
    private readonly store: AuthStore,
    private readonly toast: ToastService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;

    const { email, password } = this.form.getRawValue();

    this.auth.login({
      email: email ?? '',
      password: password ?? '',
    }).subscribe({
      next: (res) => {
        this.store.setSession(res.token);

        this.store.loadMe().subscribe({
          next: (user) => {
            this.toast.success('Sesión iniciada correctamente');
            this.loading = false;
            this.store.setUser(user);
            this.router.navigateByUrl('/');
          },
          error: () => {
            this.loading = false;
            this.toast.error('No se pudo cargar el usuario autenticado');
          },
        });
      },
      error: (err) => {
        this.loading = false;
        const msg = err?.error?.message || 'Credenciales incorrectas';
        this.toast.error(msg);
      },
    });
  }
}
