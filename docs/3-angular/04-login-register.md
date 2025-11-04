# Ejercicio 04 · Login y Registro (JWT)

## Objetivo

Implementar Login y Registro en el frontend, obtener el JWT y almacenarlo para que el consumo de API del ejercicio 05 funcione sin errores 401/CORS.

## Requisitos previos

- Backend corriendo en `http://localhost:8000`.
- Rutas públicas en dev para autenticación (ya configuradas en `security.yaml`):
  - `POST /api/login` (Lexik JWT)
  - `POST /api/auth/register`
  - Opcional: `GET /api/health`

## Preparación anti‑CORS (imprescindible en dev)

Para evitar errores CORS (No 'Access-Control-Allow-Origin') durante desarrollo, usa el proxy de Angular y apunta tus servicios a `"/api"` (mismo origen).

1) Crea `proxy.conf.json` en `angular-frontend` con:

```json
{
  "/api": {
    "target": "http://localhost:8000",
    "secure": false,
    "changeOrigin": true
  }
}
```

2) Arranca Angular con proxy:

```bash
ng serve --proxy-config proxy.conf.json
```

- Con Docker Compose de este repo, ya se pasa ese flag al `ng serve` del contenedor.
- Alternativa: añade el flag al script `start` en `package.json`.

3) A partir de ahora, usa `'/api'` como base URL en tus servicios. En este ejercicio ya lo verás aplicado en `AuthService`. En el ejercicio 05 haremos lo mismo en el servicio de tareas.

## Guía 1 · Servicio de autenticación

1) Crea `AuthService`

Comando CLI (crea el servicio en shared/services):

```bash
ng g service shared/services/auth-service 
```

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
  private API = '/api'; // base URL con proxy para evitar CORS

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

Explicación línea por línea (para arrancar sin base)

- `import { inject, Injectable } from '@angular/core';`
  - `Injectable` marca la clase para poder inyectarla como dependencia en otros sitios.
  - `inject` permite obtener dependencias sin usar constructor.
- `import { HttpClient } from '@angular/common/http';`
  - Cliente HTTP de Angular para hacer peticiones REST.
- `import { Observable, tap } from 'rxjs';`
  - `Observable` es el tipo asíncrono que devuelve `HttpClient`.
  - `tap` ejecuta efectos secundarios (guardar token) sin modificar la respuesta.
- `type LoginPayload`, `RegisterPayload`, `LoginResponse`
  - Tipos para documentar y tipar el body de envío y la respuesta del login.
- `@Injectable({ providedIn: 'root' })`
  - Hace el servicio singleton y disponible en toda la app sin declararlo en un módulo.
- `private http = inject(HttpClient);`
  - Obtiene una instancia de `HttpClient` para usarla dentro del servicio.
- `private API = 'http://localhost:8000/api'; // con proxy, usa '/api'`
  - URL base de la API. Si configuras un proxy de Angular en dev, usa `'/api'` para evitar CORS.
- `login(payload: LoginPayload)`
  - `POST /api/login` con email y password. Con `tap` guarda el `token` JWT en `localStorage`.
- `register(payload: RegisterPayload)`
  - `POST /api/auth/register` para crear usuario; devuelve un mensaje de confirmación.
- `getToken()` y `logout()`
  - Acceso rápido al token guardado y método para limpiar sesión.
```

## Guía 2 · Componentes Login y Registro

1) Genera componentes standalone

```bash
ng g component modules/auth/login-component
ng g component modules/auth/register-component
```

2) LoginComponent (TS + HTML)

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

  <button [disabled]="loading || form.invalid" class="h-11 rounded-md bg-blue-600 px-5 text-sm font-semibold text-white">Entrar</button>
</form>
```

3) RegisterComponent (TS + HTML)

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

  <button [disabled]="loading || form.invalid" class="h-11 rounded-md bg-blue-600 px-5 text-sm font-semibold text-white">Registrarme</button>
</form>
```

## Configurar CORS desde el backend con Nelmio

1) Instala el bundle:

```bash
docker compose exec backend composer require nelmio/cors-bundle
```

2) Registra el bundle (si Flex no lo hizo) en `symfony-backend/config/bundles.php`:

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

4) Reinicia backend y prueba `/api/health`. Con Nelmio activo, puedes dejar URLs absolutas (`http://localhost:8000/api`).

## Guía 3 · Rutas y navegación

1) Añade rutas en `src/app/app.routes.ts`:

```ts
import { Routes } from '@angular/router';
import { LoginComponent } from './modules/auth/login-component/login-component';
import { RegisterComponent } from './modules/auth/register-component/register-component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  // { path: 'tasks', component: TasksPageComponent } // ya creada en ejercicios previos
];
```

2) Añade enlaces en la landing o cabecera para acceder a “Entrar” y “Registrarme”.

Opción A · En la landing (recomendado para empezar)

```html
<!-- src/app/modules/landing-page-component/landing-page-component.html (fragmento) -->
<!-- ... tu hero ... -->
<div class="mt-6 flex items-center justify-center gap-4 text-sm sm:justify-start">
  <a routerLink="/login" class="text-blue-600 hover:text-blue-700">Entrar</a>
  <span class="text-slate-400">·</span>
  <a routerLink="/register" class="text-slate-600 hover:text-slate-800">Registrarme</a>
  
  <!-- Alternativa si prefieres botones
  <a routerLink="/login" class="rounded-md border px-4 py-2 text-sm">Entrar</a>
  <a routerLink="/register" class="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Registrarme</a>
  -->
</div>
```

Nota: Para que `routerLink` funcione en una standalone, el componente debe importar `RouterLink`. En la landing ya lo usamos en el CTA, así que no tienes que cambiar nada.

Opción B · En cabecera global (opcional)

Si más adelante creas un `HeaderComponent` compartido, añade ahí los enlaces y reutilízalo en páginas públicas. Mientras tanto, colocar los enlaces en la landing es suficiente para continuar el flujo.

Enlaces entre formularios (login ⇄ registro)

```html
<!-- src/app/modules/auth/login-component/login-component.html (debajo del botón) -->
<p class="text-sm text-slate-600">
  ¿No tienes cuenta?
  <a routerLink="/register" class="text-blue-600 hover:text-blue-700">Crea una aquí</a>
  .
  <a routerLink="/" class="ml-2 text-slate-600 hover:text-slate-800">Volver al inicio</a>
  
</p>
```

```html
<!-- src/app/modules/auth/register-component/register-component.html (debajo del botón) -->
<p class="text-sm text-slate-600">
  ¿Ya tienes cuenta?
  <a routerLink="/login" class="text-blue-600 hover:text-blue-700">Inicia sesión</a>
  .
  <a routerLink="/" class="ml-2 text-slate-600 hover:text-slate-800">Volver al inicio</a>
</p>
```

Recuerda que, al usar componentes standalone, debes importar `RouterLink` si un componente que no lo tenía empieza a usar enlaces. En estos ejemplos, `login` y `register` solo necesitan `ReactiveFormsModule`; añade `RouterLink` a `imports` si agregas enlaces dentro de ellos.
