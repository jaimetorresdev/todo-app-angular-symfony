# Solución · Ejercicio 04 · Login y Registro (JWT)

## Resultado esperado

- Formularios standalone de Login y Registro funcionando.
- Token JWT guardado en `localStorage` tras login.
- Peticiones desde Angular sin problemas de CORS gracias al proxy (o Nelmio, alternativa documentada).

## Paso 0 · Evitar CORS en desarrollo

habilitar CORS en Symfony con Nelmio

1) Instala el bundle:

```bash
docker compose exec backend composer require nelmio/cors-bundle
```

2) Asegura el registro en `symfony-backend/config/bundles.php`:

```php
Nelmio\\CorsBundle\\NelmioCorsBundle::class => ['all' => true],
```

3) Crea `symfony-backend/config/packages/nelmio_cors.yaml`:

```yaml
nelmio_cors:
  defaults:
    allow_origin: ['http://localhost:4200', 'http://127.0.0.1:4200']
    allow_methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
    allow_headers: ['Content-Type', 'Authorization']
    allow_credentials: true
    max_age: 3600
  paths:
    '^/api/': ~
```

4) Reinicia backend y prueba `GET /api/health`.

## Paso 1 · Servicio de autenticación

```ts
// src/app/shared/services/auth-service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

type LoginPayload = { email: string; password: string };
type RegisterPayload = { email: string; password: string; nombre?: string };
type LoginResponse = { token: string };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private API = '/api'; // con proxy

  login(payload: LoginPayload): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API}/login`, payload).pipe(
      tap((res) => localStorage.setItem('token', res.token))
    );
  }

  register(payload: RegisterPayload): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API}/auth/register`, payload);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  logout(): void {
    localStorage.removeItem('token');
  }
}
```

## Paso 2 · LoginComponent (standalone)

```ts
// src/app/modules/auth/login-component/login-component.ts
import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../shared/services/auth-service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login-component.html',
})
export class LoginComponent implements OnInit {
  form!: FormGroup;
  loading = false;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.auth.login(this.form.getRawValue() as any).subscribe({
      next: () => this.router.navigateByUrl('/tasks'),
      error: () => (this.loading = false),
    });
  }
}
```

```html
<!-- src/app/modules/auth/login-component/login-component.html -->
<form [formGroup]="form" (ngSubmit)="onSubmit()" class="mx-auto mt-12 max-w-md space-y-4">
  <h1 class="text-2xl font-semibold">Iniciar sesión</h1>

  <div>
    <label class="block text-sm font-medium">Email</label>
    <input type="email" formControlName="email" class="mt-1 w-full rounded border px-3 py-2" />
  </div>

  <div>
    <label class="block text-sm font-medium">Contraseña</label>
    <input type="password" formControlName="password" class="mt-1 w-full rounded border px-3 py-2" />
  </div>

  <p class="text-sm text-slate-600">
    ¿No tienes cuenta?
    <a routerLink="/register" class="text-blue-600 hover:text-blue-700">Crea una aquí</a>
  </p>

  <button [disabled]="loading || form.invalid" class="h-11 rounded-md bg-blue-600 px-5 text-sm font-semibold text-white">Entrar</button>
  </form>
```

## Paso 3 · RegisterComponent (standalone)

```ts
// src/app/modules/auth/register-component/register-component.ts
import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../shared/services/auth-service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './register-component.html',
})
export class RegisterComponent implements OnInit {
  form!: FormGroup;
  loading = false;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      nombre: [''],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.auth.register(this.form.getRawValue() as any).subscribe({
      next: () => this.router.navigateByUrl('/login'),
      error: () => (this.loading = false),
    });
  }
}
```

```html
<!-- src/app/modules/auth/register-component/register-component.html -->
<form [formGroup]="form" (ngSubmit)="onSubmit()" class="mx-auto mt-12 max-w-md space-y-4">
  <h1 class="text-2xl font-semibold">Crear cuenta</h1>

  <div>
    <label class="block text-sm font-medium">Email</label>
    <input type="email" formControlName="email" class="mt-1 w-full rounded border px-3 py-2" />
  </div>

  <div>
    <label class="block text-sm font-medium">Contraseña</label>
    <input type="password" formControlName="password" class="mt-1 w-full rounded border px-3 py-2" />
  </div>

  <div>
    <label class="block text-sm font-medium">Nombre</label>
    <input type="text" formControlName="nombre" class="mt-1 w-full rounded border px-3 py-2" />
  </div>

  <p class="text-sm text-slate-600">
    ¿Ya tienes cuenta?
    <a routerLink="/login" class="text-blue-600 hover:text-blue-700">Inicia sesión</a>
  </p>

  <button [disabled]="loading || form.invalid" class="h-11 rounded-md bg-blue-600 px-5 text-sm font-semibold text-white">Registrarme</button>
  </form>
```

## Paso 4 · Rutas

```ts
// src/app/app.routes.ts (fragmento)
import { Routes } from '@angular/router';
import { LoginComponent } from './modules/auth/login-component/login-component';
import { RegisterComponent } from './modules/auth/register-component/register-component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  // { path: 'tasks', component: TasksPageComponent }
];
```

## Paso 5 · Enlaces en la landing

```html
<!-- src/app/modules/landing-page-component/landing-page-component.html (fragmento) -->
<div class="mt-6 flex items-center justify-center gap-4 text-sm sm:justify-start">
  <a routerLink="/login" class="text-blue-600 hover:text-blue-700">Entrar</a>
  <span class="text-slate-400">·</span>
  <a routerLink="/register" class="text-slate-600 hover:text-slate-800">Registrarme</a>
  </div>
```

## Paso 6 · Verificación y troubleshooting

- Admin por defecto: `admin@example.com / password123` (se crea al levantar el backend).
- Comprueba el proxy o Nelmio:
  - Proxy: las peticiones deben ir a `/api/...` (mismo origen 4200).
  - Nelmio: con URLs `http://localhost:8000/api/...`, revisa que responda `GET /api/health` y que existan cabeceras CORS.
- 401 tras login: valida email/password, revisa que `token` aparece en `localStorage`.
- Rutas públicas para auth (security.yaml): `^/api/login` y `^/api/auth/register` deben ser `PUBLIC_ACCESS`.

Con esto, el ejercicio 05 (Consumo de API) puede usar el token adjuntándolo en `Authorization: Bearer <token>`.

