# Solución · Ejercicio 07

Esta solución refleja exactamente lo implementado en el repo: modelos y servicio de auth, interceptor de token, store con signals, guards funcionales en `app/guards`, rutas protegidas y una vista de administración inicial. Incluye además la solución del reto (CRUD básico de usuarios) al final.

## Flujo general

- Login guarda `token` y luego carga `/api/me` para obtener `id`, `email`, `roles`.
- El `authInterceptor` adjunta `Authorization: Bearer <token>` automáticamente.
- `AuthStore` conserva `token` y `user` con signals, expone `isLoggedIn`/`isAdmin`.
- `authGuard` exige token; `adminGuard` exige rol `ROLE_ADMIN` y, si hace falta, carga `/me` antes de decidir.
- Rutas: `/tasks` (privada) y `/admin` (solo admin). Post-login redirige a `/admin` si el user tiene `ROLE_ADMIN`.

## Modelos y servicio de autenticación

```ts
// angular-frontend/src/app/shared/interfaces/auth.ts
export interface AuthCredentials {
  email: string;
  password: string;
}
export interface RegisterPayload {
  email: string;
  password: string;
  nombre?: string;
}
export interface AuthResponse {
  token: string;
}
export interface AuthenticatedUser {
  id: number;
  email: string;
  roles: string[];
}
```

```ts
// angular-frontend/src/app/shared/services/auth-service.ts
import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, tap } from "rxjs";
import {
  AuthCredentials,
  RegisterPayload,
  AuthResponse,
  AuthenticatedUser,
} from "../interfaces/auth";

@Injectable({ providedIn: "root" })
export class AuthService {
  private http = inject(HttpClient);
  private API = "http://localhost:8000/api";

  login(payload: AuthCredentials): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.API}/login`, payload)
      .pipe(tap((res) => localStorage.setItem("token", res.token)));
  }

  register(payload: RegisterPayload): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.API}/auth/register`,
      payload
    );
  }

  me(): Observable<AuthenticatedUser> {
    return this.http.get<AuthenticatedUser>(`${this.API}/me`);
  }
}
```

## Interceptor de token

```ts
// angular-frontend/src/app/shared/interceptor/auth-interceptor.ts
import { HttpInterceptorFn } from "@angular/common/http";

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem("token");
  if (token && !req.headers.has("Authorization")) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(req);
};
```

Registrado en `app.config.ts` con `withInterceptors([authInterceptor])`.

## Store de sesión con signals

```ts
// angular-frontend/src/app/shared/services/auth-store.ts
import { Injectable, computed, signal } from "@angular/core";
import { AuthenticatedUser } from "../interfaces/auth";
import { AuthService } from "./auth-service";
import { tap } from "rxjs/operators";

@Injectable({ providedIn: "root" })
export class AuthStore {
  private readonly storageKey = "token";
  readonly token = signal<string | null>(null);
  readonly user = signal<AuthenticatedUser | null>(null);
  readonly isLoggedIn = computed(() => !!this.token());
  readonly isAdmin = computed(
    () => this.user()?.roles?.includes("ROLE_ADMIN") ?? false
  );

  constructor(private readonly authApi: AuthService) {
    const fromStorage = localStorage.getItem(this.storageKey);
    if (fromStorage) this.token.set(fromStorage);
  }

  setSession(token: string): void {
    this.token.set(token);
    localStorage.setItem(this.storageKey, token);
  }
  setUser(user: AuthenticatedUser | null): void {
    this.user.set(user);
  }
  clearSession(): void {
    this.token.set(null);
    this.user.set(null);
    localStorage.removeItem(this.storageKey);
  }
  loadMe() {
    return this.authApi.me().pipe(tap((u) => this.user.set(u)));
  }
}
```

En `AppComponent` hidratamos al arrancar y limpiamos si `/me` falla:

```ts
// angular-frontend/src/app/app.component.ts
export class AppComponent {
  constructor(private readonly authStore: AuthStore) {
    if (this.authStore.token()) {
      this.authStore
        .loadMe()
        .subscribe({ error: () => this.authStore.clearSession() });
    }
  }
}
```

## Login con redirección por rol

```ts
// angular-frontend/src/app/modules/auth/login-component/login-component.ts (extracto)
this.auth.login(this.form.getRawValue() as any).subscribe({
  next: (res) => {
    this.store.setSession(res.token);
    this.auth.me().subscribe({
      next: (user) => {
        this.store.setUser(user);
        const isAdmin = user.roles?.includes("ROLE_ADMIN");
        this.router.navigateByUrl(isAdmin ? "/admin" : "/tasks");
      },
      error: () => this.router.navigateByUrl("/tasks"),
    });
  },
});
```

## Guards funcionales

```ts
// angular-frontend/src/app/guards/auth.guard.ts
import { CanActivateFn, Router } from "@angular/router";
import { inject } from "@angular/core";
import { AuthStore } from "../shared/services/auth-store";
import { ToastService } from "../shared/services/toast-service";

export const authGuard: CanActivateFn = () => {
  const store = inject(AuthStore);
  const router = inject(Router);
  const toast = inject(ToastService);
  if (store.isLoggedIn()) return true;
  toast.info("Inicia sesión para continuar");
  return router.createUrlTree(["/login"]);
};
```

```ts
// angular-frontend/src/app/guards/admin.guard.ts
import { CanActivateFn, Router } from "@angular/router";
import { inject } from "@angular/core";
import { AuthStore } from "../shared/services/auth-store";
import { ToastService } from "../shared/services/toast-service";
import { catchError, map, of } from "rxjs";

export const adminGuard: CanActivateFn = () => {
  const store = inject(AuthStore);
  const router = inject(Router);
  const toast = inject(ToastService);
  if (!store.token()) return router.createUrlTree(["/login"]);
  if (store.user())
    return store.isAdmin() ? true : router.createUrlTree(["/tasks"]);
  return store.loadMe().pipe(
    map(() => (store.isAdmin() ? true : router.createUrlTree(["/tasks"]))),
    catchError(() => {
      store.clearSession();
      toast.error("No se pudo verificar permisos");
      return of(router.createUrlTree(["/login"]));
    })
  );
};
```

## Rutas protegidas y panel admin

```ts
// angular-frontend/src/app/app.routes.ts
export const routes: Routes = [
  { path: "", component: LandingPageComponent },
  { path: "tasks", component: TasksPageComponent, canActivate: [authGuard] },
  {
    path: "admin",
    component: AdminDashboardComponent,
    canActivate: [authGuard, adminGuard],
  },
  { path: "login", component: LoginComponent },
  { path: "register", component: RegisterComponent },
];
```

```ts
// angular-frontend/src/app/modules/admin/dashboard-component/dashboard-component.ts
@Component({
  selector: "app-admin-dashboard",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./dashboard-component.html",
})
export class AdminDashboardComponent {
  constructor(public readonly store: AuthStore) {}
}
```

```html
<!-- angular-frontend/src/app/modules/admin/dashboard-component/dashboard-component.html -->
<section>
  <h1>Panel de administración</h1>
  <p>Bienvenido, {{ store.user()?.email }}.</p>
  <p>Roles: {{ store.user()?.roles?.join(', ') }}</p>
  <!-- En el reto práctico se extiende este panel con CRUD de usuarios -->
</section>
```

## Puntos clave

- Si existe `token` pero `/me` falla, limpia la sesión para evitar estados inconsistentes.
- Los guards funcionales devuelven `UrlTree` para redirecciones limpias.
- Interceptor + guards simplifican servicios de API (no hace falta adjuntar headers manualmente).

---

## Solución · Reto práctico: CRUD de usuarios (admin)

Objetivo: en `/admin`, listar usuarios, crear nuevos y resetear contraseñas usando los endpoints de Symfony (`/api/admin/users`).

### Servicio de API para usuarios de admin

```ts
// angular-frontend/src/app/shared/services/admin-users.service.ts
import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";

export interface AdminUser {
  id: number;
  email: string;
  roles: string[];
  nombre?: string | null;
}
export interface CreateUserPayload {
  email: string;
  password: string;
  nombre?: string;
  roles?: string[];
}
export interface ResetPasswordResponse {
  message: string;
  passwordTemporal: string;
}

@Injectable({ providedIn: "root" })
export class AdminUsersApiService {
  private readonly http = inject(HttpClient);
  private readonly API = "http://localhost:8000/api/admin/users";

  getUsers(q?: string): Observable<AdminUser[]> {
    let params = new HttpParams();
    if (q) params = params.set("q", q);
    return this.http.get<AdminUser[]>(this.API, { params });
  }

  createUser(payload: CreateUserPayload): Observable<AdminUser> {
    return this.http.post<AdminUser>(this.API, payload);
  }

  resetPassword(id: number): Observable<ResetPasswordResponse> {
    return this.http.post<ResetPasswordResponse>(
      `${this.API}/${id}/reset-password`,
      {}
    );
  }
}
```

### Extender el dashboard para CRUD

```ts
// angular-frontend/src/app/modules/admin/dashboard-component/dashboard-component.ts
import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  FormGroup,
  FormsModule,
} from "@angular/forms";
import { AuthStore } from "../../../shared/services/auth-store";
import {
  AdminUsersApiService,
  AdminUser,
} from "../../../shared/services/admin-users.service";
import { ToastService } from "../../../shared/services/toast-service";

@Component({
  selector: "app-admin-dashboard",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: "./dashboard-component.html",
})
export class AdminDashboardComponent implements OnInit {
  users: AdminUser[] = [];
  form!: FormGroup;
  q = "";

  constructor(
    public readonly store: AuthStore,
    private readonly api: AdminUsersApiService,
    private readonly fb: FormBuilder,
    private readonly toast: ToastService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      email: ["", [Validators.required, Validators.email]],
      password: ["", [Validators.required, Validators.minLength(6)]],
      nombre: [""],
      roles: [["ROLE_USER"] as string[]],
    }) as FormGroup;
    this.load();
  }
  load(): void {
    this.api.getUsers(this.q).subscribe({ next: (u) => (this.users = u) });
  }

  create(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.api.createUser(this.form.getRawValue() as any).subscribe({
      next: () => {
        this.toast.success("Usuario creado");
        this.form.reset({ roles: ["ROLE_USER"] });
        this.load();
      },
      error: () => this.toast.error("No se pudo crear el usuario"),
    });
  }

  resetPassword(id: number): void {
    this.api.resetPassword(id).subscribe({
      next: (res) =>
        this.toast.info(`Password temporal: ${res.passwordTemporal}`),
      error: () => this.toast.error("No se pudo resetear la password"),
    });
  }
}
```

```html
<!-- angular-frontend/src/app/modules/admin/dashboard-component/dashboard-component.html -->
<main class="mx-auto max-w-7xl px-4 py-10">
  <h1 class="mb-6 text-2xl font-semibold text-slate-900">
    Panel de administración
  </h1>

  <!-- Card: Crear usuario -->
  <section class="rounded-lg border bg-white p-6 shadow-sm">
    <form
      (ngSubmit)="create()"
      [formGroup]="form"
      class="grid grid-cols-1 gap-4 md:grid-cols-12 md:items-end"
    >
      <div class="md:col-span-4">
        <label class="block text-sm font-medium text-slate-700">Email</label>
        <input
          placeholder="email@empresa.com"
          formControlName="email"
          class="mt-1 w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div class="md:col-span-3">
        <label class="block text-sm font-medium text-slate-700"
          >Contraseña</label
        >
        <input
          placeholder="••••••••"
          type="password"
          formControlName="password"
          class="mt-1 w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div class="md:col-span-3">
        <label class="block text-sm font-medium text-slate-700">Nombre</label>
        <input
          placeholder="Nombre"
          formControlName="nombre"
          class="mt-1 w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div class="md:col-span-2">
        <label class="block text-sm font-medium text-slate-700">Roles</label>
        <select
          formControlName="roles"
          multiple
          class="mt-1 w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ROLE_USER">ROLE_USER</option>
          <option value="ROLE_ADMIN">ROLE_ADMIN</option>
        </select>
      </div>
      <div class="md:col-span-12 flex justify-end">
        <button
          type="submit"
          [disabled]="form.invalid"
          class="inline-flex h-10 items-center rounded-md bg-blue-600 px-5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Crear usuario
        </button>
      </div>
    </form>
  </section>

  <!-- Search -->
  <div class="mt-6">
    <input
      placeholder="Buscar..."
      [(ngModel)]="q"
      (ngModelChange)="load()"
      class="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 md:w-80"
    />
  </div>

  <!-- Tabla usuarios -->
  <div class="mt-4 overflow-hidden rounded-lg border bg-white shadow-sm">
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-slate-200">
        <thead class="bg-slate-50">
          <tr>
            <th
              class="px-4 py-2 text-left text-sm font-semibold text-slate-700"
            >
              ID
            </th>
            <th
              class="px-4 py-2 text-left text-sm font-semibold text-slate-700"
            >
              Email
            </th>
            <th
              class="px-4 py-2 text-left text-sm font-semibold text-slate-700"
            >
              Roles
            </th>
            <th
              class="px-4 py-2 text-left text-sm font-semibold text-slate-700"
            >
              Acciones
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200 bg-white">
          <tr *ngFor="let u of users" class="hover:bg-slate-50">
            <td class="px-4 py-2 text-sm text-slate-700">{{ u.id }}</td>
            <td class="px-4 py-2 text-sm text-slate-700">{{ u.email }}</td>
            <td class="px-4 py-2 text-sm text-slate-700">
              {{ u.roles.join(', ') }}
            </td>
            <td class="px-4 py-2 text-sm">
              <button
                type="button"
                (click)="resetPassword(u.id)"
                class="rounded border px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-50"
              >
                Reset password
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</main>
```

Para que la tabla de usuario en la página de admin muestre los usuarios guardados, tendremos que actualizar UsuarioRepository.php en Symfony, actualiza la función de buscarPorEmailONombre:

```


    public function buscarPorEmailONombre(?string $term): array
    {
        // Si no se indica término, devolvemos todos los usuarios ordenados por id ascendente
        if ($term === null || trim($term) === '') {
            return $this->createQueryBuilder('u')
                ->orderBy('u.id', 'ASC')
                ->getQuery()
                ->getResult();
        }

        $normalizado = '%' . mb_strtolower($term) . '%';

        return $this->createQueryBuilder('u')
            ->andWhere('LOWER(u.email) LIKE :term OR LOWER(u.nombre) LIKE :term')
            ->setParameter('term', $normalizado)
            ->orderBy('u.nombre', 'ASC')
            ->getQuery()
            ->getResult();
    }
```

Notas:

- El interceptor adjunta el token; no hace falta añadir headers manualmente.
- Usa toasts para feedback; considera copiar la contraseña temporal al portapapeles con `navigator.clipboard.writeText`.
- Para listas extensas, añade paginación en backend y frontend con parámetros `page`/`limit`.
