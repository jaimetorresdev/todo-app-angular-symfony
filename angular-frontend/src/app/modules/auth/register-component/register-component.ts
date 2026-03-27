import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../shared/services/auth-service';
import { ToastService } from '../../../shared/services/toast-service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register-component.html',
})
export class RegisterComponent implements OnInit {
  loading = false;
  form!: FormGroup;

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
    });
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