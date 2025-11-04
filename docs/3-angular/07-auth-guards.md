# Ejercicio 07 · Autenticación JWT y guards por rol

## Objetivo

Consumir los endpoints de autenticación de Symfony, almacenar el token JWT, exponer el estado del usuario autenticado y proteger rutas con guards que distingan entre `ROLE_USER` y `ROLE_ADMIN`.

## Antes de empezar · mini‑intro Angular

- Componentes: piezas de UI con plantilla (HTML) y clase (TS).
- Servicios: clases reutilizables (sin UI) que encapsulan lógica/HTTP y se inyectan donde se usan.
- Interceptores: “filtros” que envuelven todas las peticiones HTTP para añadir cabeceras o gestionar errores.
- Guards: funciones que permiten o bloquean la navegación a una ruta (p. ej. exigir login o rol admin).
- Router: define rutas (`path → componente`) y aplica guards en `canActivate`.
- Signals (estado): variables reactivas simples de Angular para guardar y derivar estado (`token`, `user`).

## Ejercicios guiados

### Guía 1 · Servicio de autenticación

1. Genera `AuthApiService` en `src/app/core/auth/` con métodos `login`, `register` y `me`.
2. Inyecta `HttpClient` y usa el interceptor del ejercicio 04 para adjuntar el token cuando exista.
3. Define interfaces `AuthCredentials`, `RegisterPayload`, `AuthResponse` y `AuthenticatedUser` en `core/auth/models.ts` para tipar las respuestas.
4. Prueba los métodos con `HttpClientTestingModule` o directamente con Postman para asegurarte de que coinciden con el backend.

Nota (repo actual):
- Ya existe `AuthService` en `angular-frontend/src/app/shared/services/auth-service.ts`. No crees un servicio nuevo; tipa el existente y añade `me()`.
- Crea los modelos en `angular-frontend/src/app/shared/interfaces/auth.ts` con: `AuthCredentials`, `RegisterPayload`, `AuthResponse`, `AuthenticatedUser`.
- Añade `me(): Observable<AuthenticatedUser>` en `AuthService` apuntando a `GET /api/me`.
- Implementa un interceptor de token en `angular-frontend/src/app/shared/interceptor/auth-interceptor.ts` que añada `Authorization: Bearer <token>` si existe en `localStorage`.
- Registra el interceptor en `angular-frontend/src/app/app.config.ts` usando `provideHttpClient(withFetch(), withInterceptors([authInterceptor]))`.
- Endpoints backend usados: `POST /api/login` (devuelve `{ token }`), `POST /api/auth/register`, `GET /api/me`.
- Pruebas rápidas: usa Postman o `HttpClientTestingModule` para mockear las respuestas y verificar que se guarda el token y que `me()` devuelve `{ id, email, roles }`.

#### Pasos detallados (repo actual)

1) Modelos de autenticación

   Crea `angular-frontend/src/app/shared/interfaces/auth.ts` con los tipos usados por el servicio:

   ```ts
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

   Explicación:
   - Estos son solo tipos TypeScript; no ejecutan nada. Ayudan al autocompletado y a detectar errores.
   - `AuthResponse` refleja la respuesta del backend en login: un objeto con `token`.
   - `AuthenticatedUser` modela lo que devuelve `/api/me` (id, email y roles).

2) Actualiza `AuthService` con tipos y `me()`

   Edita `angular-frontend/src/app/shared/services/auth-service.ts` para tipar `login`/`register` y añadir `me()`:

   ```ts
   import { inject, Injectable } from '@angular/core';
   import { HttpClient } from '@angular/common/http';
   import { Observable, tap } from 'rxjs';
   import { AuthCredentials, RegisterPayload, AuthResponse, AuthenticatedUser } from '../interfaces/auth';

   @Injectable({ providedIn: 'root' })
   export class AuthService {
     private http = inject(HttpClient);
     private API = 'http://localhost:8000/api'; // con proxy, usa '/api'

     login(payload: AuthCredentials): Observable<AuthResponse> {
       return this.http.post<AuthResponse>(`${this.API}/login`, payload).pipe(
         tap((res) => localStorage.setItem('token', res.token))
       );
     }

     register(payload: RegisterPayload): Observable<{ message: string }> {
       return this.http.post<{ message: string }>(`${this.API}/auth/register`, payload);
     }

     me(): Observable<AuthenticatedUser> {
       return this.http.get<AuthenticatedUser>(`${this.API}/me`);
     }

     getToken(): string | null {
       return localStorage.getItem('token');
     }

     logout(): void {
       localStorage.removeItem('token');
     }
   }
   ```

   Explicación:
   - `inject(HttpClient)` obtiene el cliente HTTP sin necesidad de constructor.
   - `login` tipa entrada/salida y guarda el token con `tap` si la petición tiene éxito.
   - `register` y `me` llaman a los endpoints del backend y devuelven `Observable` tipado.
   - `getToken/logout` centralizan el acceso a `localStorage`.

3) Interceptor para adjuntar el token

   Crea `angular-frontend/src/app/shared/interceptor/auth-interceptor.ts` para añadir el header `Authorization` automáticamente:

   ```ts
   import { HttpInterceptorFn } from '@angular/common/http';

   export const authInterceptor: HttpInterceptorFn = (req, next) => {
     const token = localStorage.getItem('token');
     if (token && !req.headers.has('Authorization')) {
       req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
     }
     return next(req);
   };
   ```

   Explicación:
   - Un interceptor puede leer/modificar cada petición: aquí añade `Authorization` si hay `token`.
   - `req.clone` crea una copia inmutable con la cabecera añadida.
   - Si la petición ya trae `Authorization`, no la pisa.

4) Registra el interceptor en la app

   Edita `angular-frontend/src/app/app.config.ts` para registrar el interceptor con `provideHttpClient`:

   ```ts
   import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
   import { provideRouter } from '@angular/router';
   import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
   import { routes } from './app.routes';
   import { authInterceptor } from './shared/interceptor/auth-interceptor';

   export const appConfig: ApplicationConfig = {
     providers: [
       provideZoneChangeDetection({ eventCoalescing: true }),
       provideRouter(routes),
       provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
     ],
   };
   ```

   Explicación:
   - `provideHttpClient` configura el cliente HTTP de Angular.
   - `withInterceptors([authInterceptor])` registra nuestro interceptor globalmente.

5) Verificación rápida

   - Postman:
     - `POST http://localhost:8000/api/login` con `{ email, password }` → guarda `token` en `localStorage` (o inicia sesión desde tu UI).
     - `GET http://localhost:8000/api/me` sin headers → añade `Authorization: Bearer <token>` y devuelve `{ id, email, roles }`.

### Guía 2 · Gestión del estado de sesión

1. Crea un servicio `AuthStore` (puede usar `signal`, `BehaviorSubject` o `ComponentStore`) que mantenga:
   - El token JWT.
   - El usuario autenticado (`AuthenticatedUser` con roles).
   - Métodos `setSession`, `clearSession` y `isAdmin`.
2. Persiste el token en `localStorage` (clave `auth.token`) y recupéralo al iniciar la app.
3. Expone un `computed`/`Observable` `isLoggedIn` para que componentes y guards reaccionen a los cambios.

Nota (repo actual):
- Actualmente se persiste el token en `localStorage` con la clave `token` desde `AuthService`. Puedes mantener esa clave o adaptar el store para usar `auth.token`, pero sé consistente en toda la app.
- Cuando implementes el store, lee el token inicial desde `localStorage` y considera cargar `me()` para poblar `AuthenticatedUser` y roles.

#### Pasos detallados (repo actual)

1) Crea el store de sesión

   Archivo: `angular-frontend/src/app/shared/services/auth-store.ts`

   ```ts
   import { Injectable, computed, signal } from '@angular/core';
   import { AuthenticatedUser } from '../interfaces/auth';
   import { AuthService } from './auth-service';
   import { tap } from 'rxjs/operators';

   @Injectable({ providedIn: 'root' })
   export class AuthStore {
     private readonly storageKey = 'token';

     readonly token = signal<string | null>(null);
     readonly user = signal<AuthenticatedUser | null>(null);

     readonly isLoggedIn = computed(() => !!this.token());
     readonly isAdmin = computed(() => this.user()?.roles?.includes('ROLE_ADMIN') ?? false);

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

   Explicación:
   - `signal` guarda estado reactivo (aquí `token` y `user`).
   - `computed` deriva estado (`isLoggedIn` e `isAdmin`).
   - `setSession/clearSession` sincronizan con `localStorage` para persistencia entre recargas.
   - `loadMe()` llama a `/api/me` y guarda el usuario; devuelve un `Observable` para encadenar.

2) Hidratar el usuario al iniciar la app (opcional recomendado)

   Archivo: `angular-frontend/src/app/app.component.ts`

   ```ts
   import { Component } from '@angular/core';
   import { RouterOutlet } from '@angular/router';
   import { ToastComponent } from './shared/components/toast-component/toast-component';
   import { AuthStore } from './shared/services/auth-store';

   @Component({
     selector: 'app-root',
     standalone: true,
     imports: [RouterOutlet, ToastComponent],
     templateUrl: './app.component.html',
     styleUrls: ['./app.component.css'],
   })
   export class AppComponent {
     constructor(private readonly authStore: AuthStore) {
       if (this.authStore.token()) {
         this.authStore.loadMe().subscribe();
       }
     }
   }
   ```

   Explicación:
   - Al arrancar la SPA, si hay `token` persistido intenta cargar `/me`.
   - Cargar el usuario al inicio evita pantallazos incongruentes y permite que los guards decidan con datos reales.

3) Clave de `localStorage`

   - En este repo se usa `token`. Mantén la misma clave en todo el proyecto para coherencia.

### Guía 3 · Componentes de login y registro

1. Genera componentes standalone `LoginPageComponent` y `RegisterPageComponent` en `features/auth/pages/`.
2. Crea formularios reactivos con validaciones (email, contraseña mínima, confirmación).
3. Al enviar:
   - Llama al servicio correspondiente (`AuthApiService.login` o `.register`).
   - En `login`, guarda la sesión con `AuthStore.setSession(response)` y redirige al panel adecuado (`/tasks` para usuarios, `/admin` para administradores).
4. Muestra mensajes de error con los toasts del ejercicio 06 cuando falle la autenticación.

Nota (repo actual):
- Ya existen `LoginComponent` y `RegisterComponent` en `angular-frontend/src/app/modules/auth/` que consumen `AuthService`. Puedes reutilizarlos y, tras implementar el store, conectar el guardado de sesión/redirecciones.

#### Pasos detallados (repo actual)

1) Conectar `LoginComponent` con `AuthStore` y redirección de admin

   Archivo: `angular-frontend/src/app/modules/auth/login-component/login-component.ts`

   ```ts
   import { Component, OnInit } from '@angular/core';
   import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
   import { Router } from '@angular/router';
   import { AuthService } from '../../../shared/services/auth-service';
   import { AuthStore } from '../../../shared/services/auth-store';
   import { ToastService } from '../../../shared/services/toast-service';

   @Component({
     selector: 'app-login',
     standalone: true,
     imports: [ReactiveFormsModule],
     templateUrl: './login-component.html',
   })
   export class LoginComponent implements OnInit {
     form!: FormGroup;
     loading = false;

     constructor(
       private fb: FormBuilder,
       private auth: AuthService,
       private store: AuthStore,
       private toast: ToastService,
       private router: Router
     ) {}

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
         next: (res) => {
           this.store.setSession(res.token);
           this.auth.me().subscribe({
             next: (user) => {
               this.store.setUser(user);
               this.toast.success('Sesión iniciada');
               const isAdmin = user.roles?.includes('ROLE_ADMIN');
               this.router.navigateByUrl(isAdmin ? '/admin' : '/tasks');
             },
             error: () => {
               this.toast.success('Sesión iniciada');
               this.router.navigateByUrl('/tasks');
             },
           });
         },
         error: () => {
           this.toast.error('Credenciales inválidas');
           this.loading = false;
         },
       });
     }
   }
   ```

   Explicación:
   - `FormBuilder` crea el formulario con validaciones (`required`, `email`).
   - En `onSubmit`, si es válido: `login` → guarda `token` en el store → `me()` → guarda `user`.
   - Redirección: si el usuario tiene `ROLE_ADMIN` va a `/admin`; si no, a `/tasks`.
   - Toasts informan éxito/fracaso; en caso de error al cargar `/me`, se usa `/tasks` como fallback.

2) Conectar `RegisterComponent` con toasts

   Archivo: `angular-frontend/src/app/modules/auth/register-component/register-component.ts`

   ```ts
   import { Component, OnInit } from '@angular/core';
   import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
   import { Router } from '@angular/router';
   import { AuthService } from '../../../shared/services/auth-service';
   import { ToastService } from '../../../shared/services/toast-service';

   @Component({
     selector: 'app-register',
     standalone: true,
     imports: [ReactiveFormsModule],
     templateUrl: './register-component.html',
   })
   export class RegisterComponent implements OnInit {
     form!: FormGroup;
     loading = false;

     constructor(
       private fb: FormBuilder,
       private auth: AuthService,
       private toast: ToastService,
       private router: Router
     ) {}

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
         next: () => {
           this.toast.success('Usuario registrado. Inicia sesión');
           this.router.navigateByUrl('/login');
         },
         error: () => {
           this.toast.error('No se pudo registrar');
           this.loading = false;
         },
       });
     }
   }
   ```

   Explicación:
   - Formulario reactivo con validaciones básicas.
   - Llama a `register` y usa toasts para mostrar el resultado.
   - Tras registrarse, navega a `/login` para que el usuario inicie sesión.

3) Redirección post-login

   - Actualmente no hay área de administración en las rutas del frontend; redirige a `/tasks` tras login.
   - Cuando añadas `/admin`, podrás condicionar con `this.store.isAdmin()`.


### Guía 4 · Implementar guards por rol

1. Crea un guard con `ng g guard guards/auth --functional` (o clase) que:
   - Verifique si existe token y usuario cargado.
   - Si no, redirija a `/login` mostrando un toast informativo.
2. Crea un guard adicional `guards/admin.guard.ts` que compruebe `AuthStore.isAdmin()`. Si el usuario no tiene rol `ROLE_ADMIN`, redirige a `/tasks` y muestra un toast de error.
3. En `app.routes.ts`, aplica:
   - `canActivate: [authGuard]` en todas las rutas privadas.
   - `canActivate: [adminGuard]` en el módulo/página de administración.
4. Añade un `CanMatch` opcional para impedir cargar módulos innecesarios cuando el guard falla.

#### Pasos detallados (repo actual)

1) Crear guard de autenticación (entrada requerida)

   Archivo: `angular-frontend/src/app/guards/auth.guard.ts`

   ```ts
   import { CanActivateFn, Router } from '@angular/router';
   import { inject } from '@angular/core';
   import { AuthStore } from '../shared/services/auth-store';
   import { ToastService } from '../shared/services/toast-service';

   export const authGuard: CanActivateFn = () => {
     const store = inject(AuthStore);
     const router = inject(Router);
     const toast = inject(ToastService);

     if (store.isLoggedIn()) {
       return true;
     }

     toast.info('Inicia sesión para continuar');
     return router.createUrlTree(['/login']);
   };
   ```

   Explicación:
   - Si hay sesión (`isLoggedIn`), permite la navegación devolviendo `true`.
   - Si no, muestra un aviso y devuelve un `UrlTree` para redirigir limpiamente a `/login`.

2) Crear guard de administrador (rol requerido)

   Archivo: `angular-frontend/src/app/guards/admin.guard.ts`

   ```ts
   import { CanActivateFn, Router } from '@angular/router';
   import { inject } from '@angular/core';
   import { AuthStore } from '../shared/services/auth-store';
   import { ToastService } from '../shared/services/toast-service';
   import { catchError, map, of } from 'rxjs';

   export const adminGuard: CanActivateFn = () => {
     const store = inject(AuthStore);
     const router = inject(Router);
     const toast = inject(ToastService);

     if (!store.token()) {
       toast.info('Inicia sesión para continuar');
       return router.createUrlTree(['/login']);
     }

     if (store.user()) {
       if (store.isAdmin()) return true;
       toast.error('No tienes permisos de administrador');
       return router.createUrlTree(['/tasks']);
     }

     return store.loadMe().pipe(
       map(() => (store.isAdmin() ? true : router.createUrlTree(['/tasks']))),
       catchError(() => {
         toast.error('No se pudo verificar permisos');
         return of(router.createUrlTree(['/tasks']));
       })
     );
   };
   ```

   Explicación:
   - Si no hay `token`, redirige a `/login`.
   - Si ya hay `user`, permite solo si `isAdmin` es true; si no, redirige a `/tasks`.
   - Si hay `token` pero falta `user`, llama a `/me` y decide; ante error, redirige (y en el repo limpiamos sesión).

3) Crear página de administración

   - Componente standalone `AdminDashboardComponent`.
   - Muestra el email y roles del usuario autenticado.

   Archivos:

   `angular-frontend/src/app/modules/admin/dashboard-component/dashboard-component.ts`

   ```ts
   import { Component } from '@angular/core';
   import { CommonModule } from '@angular/common';
   import { AuthStore } from '../../../shared/services/auth-store';

   @Component({
     selector: 'app-admin-dashboard',
     standalone: true,
     imports: [CommonModule],
     templateUrl: './dashboard-component.html',
   })
   export class AdminDashboardComponent {
     constructor(public readonly store: AuthStore) {}
   }
   ```

   Explicación:
   - Componente standalone simple: inyecta el store para leer `user` y mostrar sus datos.
   - En el reto ampliarás esta vista con CRUD de usuarios (listado, alta, reset password).

   `angular-frontend/src/app/modules/admin/dashboard-component/dashboard-component.html`

   ```html
   <section>
     <h1>Panel de administración</h1>
     <p>Bienvenido, {{ store.user()?.email }}.</p>
     <p>Roles: {{ store.user()?.roles?.join(', ') }}</p>
   </section>
   ```

   Explicación:
   - Interpolación `{{ ... }}` muestra valores del store en la plantilla.
   - Si aún no hay usuario cargado, el operador `?.` evita errores de acceso a `null`/`undefined`.

4) Proteger rutas

   Edita `angular-frontend/src/app/app.routes.ts` para proteger `/tasks` y añadir `/admin` restringido a administradores:

   ```ts
   import { Routes } from '@angular/router';
   import { LandingPageComponent } from './modules/landing-page-component/landing-page-component';
   import { TasksPageComponent } from './modules/tasks-page-component/tasks-page-component';
   import { LoginComponent } from './modules/auth/login-component/login-component';
   import { RegisterComponent } from './modules/auth/register-component/register-component';
   import { AdminDashboardComponent } from './modules/admin/dashboard-component/dashboard-component';
   import { authGuard } from './guards/auth.guard';
   import { adminGuard } from './guards/admin.guard';

   export const routes: Routes = [
     { path: '', component: LandingPageComponent },
     { path: 'tasks', component: TasksPageComponent, canActivate: [authGuard] },
     { path: 'admin', component: AdminDashboardComponent, canActivate: [authGuard, adminGuard] },
     { path: 'login', component: LoginComponent },
     { path: 'register', component: RegisterComponent }
   ];
   ```

   Explicación:
   - `canActivate` aplica los guards a cada ruta.
   - `/tasks` exige sesión; `/admin` exige sesión y rol admin.
   - Las rutas públicas (`/login`, `/register`) no tienen guards.

### Guía 5 · Probar el flujo completo

1. Regístrate y haz login desde Angular usando usuarios creados en Symfony/Postman.
   - Antes de probar, comprueba que no hay un token previo en `localStorage`.
     - En el navegador: abre las DevTools → pestaña Application/Almacenamiento → Local Storage → selecciona tu dominio → elimina la clave `token`.
     - O desde consola del navegador: `localStorage.removeItem('token')`.
2. Abre el panel de usuario (`/tasks`) y verifica que ves solo tus tareas. Refresca el navegador para confirmar que el token persiste.
3. Intenta navegar directamente a `/admin/users`. Comprueba que el guard bloquea a usuarios sin `ROLE_ADMIN`.
4. Inicia sesión con un administrador y valida que puede acceder tanto a `/tasks` como a `/admin`.

#### Pasos detallados (repo actual)

1) Crear un usuario ADMIN (Postman)

   - Endpoint: `POST http://localhost:8000/api/auth/register`
   - Body (JSON):
   ```json
   {
     "email": "admin@example.com",
     "password": "secret123",
     "nombre": "Admin",
     "roles": ["ROLE_ADMIN"]
   }
   ```

2) Iniciar sesión como ADMIN

   - Endpoint: `POST http://localhost:8000/api/login`
   - Body: `{ "email": "admin@example.com", "password": "secret123" }`
   - Verifica que `localStorage` contiene la clave `token` y que `/api/me` devuelve roles con `ROLE_ADMIN`.

3) Acceso permitido a `/admin`

   - Navega a `/admin`: debe mostrarse “Panel de administración” con email y roles.

4) Usuario normal bloqueado en `/admin`

   - Registra/inicia sesión un usuario sin rol admin (por UI o Postman).
   - Navega a `/admin`: debe redirigir a `/tasks` y mostrarse toast “No tienes permisos de administrador”.

5) Acceso protegido a `/tasks`

   - Cierra sesión (elimina `token` del `localStorage`).
   - Navega a `/tasks`: debe redirigir a `/login` con toast “Inicia sesión para continuar”.

6) Limpieza automática si el token es inválido

   - Si existe `token` pero `/api/me` devuelve error, limpia la sesión automáticamente para evitar estados inconsistentes.
   - Código aplicado en `angular-frontend/src/app/app.component.ts`:

   ```ts
   export class AppComponent {
     constructor(private readonly authStore: AuthStore) {
       if (this.authStore.token()) {
         this.authStore.loadMe().subscribe({
           error: () => this.authStore.clearSession(),
         });
       }
     }
   }
   ```

   - El `adminGuard` también limpia la sesión si `/me` falla y redirige a `/login`.

## Reto práctico

Crea un panel de administración con CRUD básico de usuarios aprovechando los endpoints del backend (`/api/admin/users`).

Objetivos mínimos:
- Listar usuarios con búsqueda opcional (`q`).
- Crear usuario con `email`, `password`, `nombre` y `roles` (`ROLE_USER`, `ROLE_ADMIN`).
- Resetear la contraseña de un usuario mostrando la contraseña temporal devuelta por el backend.

Sugerencias de implementación:
- Servicio `AdminUsersApiService` en `angular-frontend/src/app/shared/services/admin-users.service.ts` con:
  - `getUsers(q?: string)` → `GET /api/admin/users`
  - `createUser(payload)` → `POST /api/admin/users`
  - `resetPassword(id: number)` → `POST /api/admin/users/{id}/reset-password`
- Tipos `AdminUser`, `CreateUserPayload`, `ResetPasswordResponse` en `shared/interfaces`.
- Extiende `AdminDashboardComponent` para mostrar la lista, formulario de alta y acción de reset.
- Usa toasts para feedback y apóyate en los guards ya añadidos.
- Recuerda importar `FormsModule` si usas `[(ngModel)]` y `ReactiveFormsModule` para formularios reactivos.

Consulta `07-auth-guards.solucion.md` al terminar el reto.
