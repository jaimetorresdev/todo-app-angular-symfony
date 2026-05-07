# TaskPro — Gestor de tareas full-stack (Symfony + Angular)

[![Stack](https://img.shields.io/badge/stack-Symfony%207.3%20%7C%20Angular%2020%20%7C%20PostgreSQL%2017-blue)](#tecnologías)
[![Status](https://img.shields.io/badge/estado-activo-success)]()
[![Origen](https://img.shields.io/badge/origen-CodeArts%20onboarding-lightgrey)]()

**TaskPro** es una aplicación web de gestión de tareas con autenticación JWT, panel de administración, vista kanban y notificaciones por email. Surge a partir del proyecto de **onboarding de CodeArts (DAW)** y se ha extendido como Trabajo de Fin de Grado, añadiendo nuevas funcionalidades, refactorizaciones y mejoras de UX/seguridad.

> 🪪 **Origen del proyecto**
> El esqueleto inicial (Symfony + Angular + Docker + base de datos PostgreSQL + estructura de directorios y este README de instalación) proviene del [onboarding de CodeArts](https://campus-codearts.com). A partir de ese punto de partida, el repositorio actual incluye una aplicación funcional completa: **TaskPro**.

---

## Índice

- [Qué es TaskPro](#qué-es-taskpro)
- [Funcionalidades](#funcionalidades)
- [Tecnologías](#tecnologías)
- [Arquitectura](#arquitectura)
- [Cómo levantarlo](#cómo-levantarlo)
- [Instalación desde cero (entorno local)](#instalación-desde-cero-entorno-local)
- [Ejecución completa con Docker Compose](#ejecución-completa-con-docker-compose)
- [Preguntas frecuentes](#preguntas-frecuentes)
- [Créditos](#créditos)

---

## Qué es TaskPro

Una aplicación SPA + API REST para la gestión personal y administrativa de tareas:

- Los usuarios crean cuenta, se autentican con JWT y gestionan sus tareas (CRUD, estados, prioridades, fechas).
- Existe un panel de administración para que los usuarios con rol `ROLE_ADMIN` gestionen al resto de usuarios.
- Hay una vista **Kanban** para arrastrar tareas entre estados, además del listado clásico con filtros.
- El backend envía emails (bienvenida y reset de contraseña) y aplica *rate limiting* a los endpoints sensibles.

## Funcionalidades

**Autenticación y seguridad**
- Registro y login con JWT (Lexik JWT Bundle).
- Guards de Angular para zonas autenticadas y de admin.
- *Rate limiter* en endpoints públicos (`/api/login`: 5 intentos/min por IP; `/api/auth/register`: 3 registros/h por IP).
- CORS configurado vía Nelmio CORS.

**Gestión de tareas**
- CRUD completo con título, descripción, estado, prioridad y fecha límite.
- Filtros por estado, prioridad, búsqueda libre y rango de fechas.
- Vista **Kanban** con columnas por estado.
- Vista listado con ordenación.

**Panel de administración**
- Listado de usuarios con búsqueda y paginación.
- Creación, edición, reset de contraseña y eliminación de usuarios.
- Registro de actividad (creaciones, ediciones, borrados, cambios de estado).

**Mailer**
- Plantillas Twig para email de bienvenida y reset de contraseña.
- El reset de contraseña se lanza desde el panel de administración (`POST /api/admin/users/{id}/reset-password`); el sistema genera una nueva contraseña y la envía al usuario por email.
- Comando `bin/console app:probar-mailer` (con flag `--dry-run` opcional) para verificar la configuración usando un usuario demo.

**Calidad / DX**
- Tests unitarios en componentes y servicios clave de Angular.
- Migraciones Doctrine versionadas.
- Healthchecks en Docker para asegurar el orden de arranque.
- Hot reload en frontend (`ng serve`) y backend con `symfony server:start`.

## Tecnologías

| Capa        | Stack                                                            |
| ----------- | ---------------------------------------------------------------- |
| Backend     | PHP 8.2+ (recomendado 8.3), Symfony 7.3, Doctrine ORM, Lexik JWT, Nelmio CORS |
| Frontend    | Angular 20, RxJS, Tailwind CSS, Karma + Jasmine                  |
| Base datos  | PostgreSQL 17                                                    |
| Despliegue  | Docker Compose (backend, frontend, db)                           |
| Mailer      | Symfony Mailer + Twig                                            |

## Arquitectura

```
┌──────────────┐      HTTP/JWT      ┌──────────────────┐      Doctrine     ┌──────────────┐
│  Angular 20  │  <-------------->  │   Symfony 7.3    │  <-------------->  │ PostgreSQL17 │
│  (frontend)  │     /api/...       │ Controllers →    │                    │              │
│              │                    │ Services →       │                    └──────────────┘
└──────────────┘                    │ Repositories →   │
                                    │ Entities         │
                                    └──────────────────┘
                                          │
                                          ▼
                                    Mailer (Twig)
```

- **Frontend**: módulos por feature (`auth`, `tasks-page`, `admin`, `settings`, `landing`) y carpeta `shared` para componentes/servicios reutilizables (toast, navbar, confirm-modal, etc.).
- **Backend**: capas bien separadas — *Controller* para HTTP, *Service* para lógica de negocio, *Repository* para acceso a datos, *Entity* para el modelo. *EventSubscribers* para *cross-cutting concerns* como el rate limiter.

---

## Cómo levantarlo

Tienes dos opciones según tu objetivo:

- **Docker Compose** (recomendado para probar la app rápido): empaqueta frontend, backend y base de datos. Todo arranca con un comando.
- **Entorno local**: instala Node, Angular CLI, PHP, Composer y Symfony CLI para desarrollar y depurar con tus herramientas habituales.

> Esta sección y las siguientes se basan en el material original del onboarding de CodeArts y se mantienen porque siguen siendo válidas para arrancar el proyecto.

### Trabajo en ramas (convenio del onboarding)

- Usa `main` solo al clonar el proyecto. No trabajes nunca directamente en `main`.
- Crea una rama por cambio o por ejercicio:

```bash
git fetch origin
git checkout -b feat/mi-cambio
git push -u origin feat/mi-cambio
```

---

## Instalación desde cero (entorno local)

### 1. Instala las herramientas base

**Git**
- Descarga desde [git-scm.com](https://git-scm.com/downloads) y acepta la instalación por defecto.
- Si vienes del campus de CodeArts, asegúrate de haber completado los primeros pasos (Dualboot/MacOS y clave SSH): https://campus-codearts.com/course/section.php?id=175
- En Ubuntu recién instalado:
  ```bash
  sudo apt update
  sudo apt install curl git build-essential -y
  ```

**Node.js + npm** (Angular necesita Node 20.19 o 22.x)
- Recomendado con [nvm](https://github.com/nvm-sh/nvm#installing-and-updating):
  ```bash
  nvm install 22
  nvm use 22
  ```
- `node -v` debe mostrar `v22.x`; `npm -v` la rama 10/11.
- Sin nvm (Debian/Ubuntu):
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  sudo apt install nodejs -y
  ```

**Angular CLI**
```bash
npm install -g @angular/cli@20
ng version
```

**PHP 8.3 + Composer**
```bash
sudo apt install php8.3-cli php8.3-common php8.3-xml php8.3-intl php8.3-mbstring php8.3-zip php8.3-pgsql unzip curl -y
curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
composer --version
```

**Symfony CLI**
```bash
curl -sS https://get.symfony.com/cli/installer | bash
mv ~/.symfony*/bin/symfony /usr/local/bin/symfony   # añade sudo si no eres root
symfony version
```
Más opciones en [symfony.com/download](https://symfony.com/download).

**Docker Desktop**
- [docs.docker.com/get-docker](https://docs.docker.com/desktop/setup/install/linux/debian/#install-docker-desktop)

### 2. Clona el repositorio

```bash
git clone git@github.com:jaimetorresdev/todo-app-angular-symfony.git
cd todo-app-angular-symfony
```

### 3. Levanta solo PostgreSQL con Docker

```bash
docker compose up db -d
```

### 4. Backend

```bash
cd symfony-backend
composer install
php bin/console doctrine:migrations:migrate -n
symfony server:start --no-tls --port=8000
```
- Sin Symfony CLI: `php -S 127.0.0.1:8000 -t public`
- Backend en `http://localhost:8000`. Detener con `symfony server:stop` o `Ctrl+C`.

### 5. Frontend

```bash
cd ../angular-frontend
npm install
ng serve
```
- Hot reload activado. UI en `http://localhost:4200`. Detener con `Ctrl+C`.

### 6. Crear un usuario admin

```bash
cd symfony-backend
php bin/console app:create-admin
```

### 7. (Opcional) Probar mailer

```bash
# Envía bienvenida + reset de password a un usuario demo (demo@example.com)
php bin/console app:probar-mailer

# Solo simulación, sin enviar correos reales
php bin/console app:probar-mailer --dry-run
```

Configura previamente `MAILER_DSN` en tu `.env` (Mailtrap, Mailcatcher u otro SMTP).

---

## Ejecución completa con Docker Compose

Si prefieres no instalar dependencias de desarrollo:

**Requisitos**
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

**Pasos**
```bash
docker compose up -d
docker ps        # debes ver: symfony_backend, angular_frontend, symfony_postgres
```

Acceso:
- Frontend: http://localhost:4200
- Backend: http://localhost:8000
- PostgreSQL: puerto `5432` (usuario `symfony`, password `password`)

**Gestión**
- Parar todo: `docker compose down`
- Parar + borrar volúmenes (elimina datos): `docker compose down -v`
- Logs en tiempo real: `docker compose logs -f backend frontend db`

---

## Preguntas frecuentes

**¿Por qué versiones tan concretas de Node y PHP?**
Angular 20 requiere Node ≥ 20.19 o 22.x. Symfony 7.3 funciona con PHP ≥ 8.2; el proyecto se ha desarrollado y probado con 8.3 para evitar sorpresas.

**¿Por qué `ng serve` y no `npm start`?**
El `npm start` definido en `package.json` usa `proxy.conf.json`, que apunta a `http://backend:8000` (el nombre del servicio Docker). Si arrancas el frontend en local **fuera de Docker**, ese host no resuelve. Usa `ng serve` y deja que CORS lo gestione (Nelmio CORS está habilitado en el backend). Si todo va por Docker, `npm start` también funciona.

**`ng serve` pide permisos**
Ajusta el propietario de la carpeta a tu usuario:
```bash
sudo chown -R $USER:$USER /ruta/al/proyecto
```
Evita `sudo npm install` en Linux/Mac.

**Docker dice que los puertos están en uso**
Usa Docker Desktop sin `sudo`. Si ya lo arrancaste con `sudo`:
1. `sudo docker compose down` y luego `docker compose down`.
2. Si los puertos 8000/4200/5432 siguen ocupados:
   ```bash
   lsof -i :8000
   kill PID    # o kill -9 PID
   ```

---

## Créditos

- **Base / esqueleto de onboarding**: equipo docente de [CodeArts](https://campus-codearts.com) (DAW).
- **Aplicación TaskPro y mejoras**: [Jaime Torres Pastor](https://github.com/jaimetorresdev) — Trabajo de Fin de Grado, curso 2025-2026.

Si reutilizas este repositorio como punto de partida para tu propio proyecto, conserva la atribución original al onboarding de CodeArts.
