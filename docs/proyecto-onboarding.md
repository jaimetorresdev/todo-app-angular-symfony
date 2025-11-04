# Proyecto Onboarding · To-Do App Colaborativa

## Propósito

Todos los alumnos construirán la misma aplicación: una lista de tareas con autenticación.  
Hay dos perfiles:

- **Usuario**: se registra, inicia sesión y gestiona sus propias tareas (CRUD + estados + filtros).
- **Administrador**: puede listar y gestionar usuarios, resetear contraseñas y ver estadísticas básicas de tareas.

La meta del onboarding es dejar la aplicación funcionando con este alcance mínimo, completamente documentada y lista para que cualquier alumno la continúe como base de su TFG.

## 1. Modelo funcional

### Entidades principales

- `Usuario`
  - `id`, `email`, `password`, `roles`, `nombre`, `fecha_registro`.
  - Roles permitidos: `ROLE_USER`, `ROLE_ADMIN`.
- `Tarea`
  - `id`, `titulo`, `descripcion`, `estado` (`pendiente`, `en_progreso`, `completada`), `fecha_creacion`, `fecha_limite` (opcional).
  - Relación `ManyToOne` con `Usuario` (propietario).

### Casos de uso

1. **Landing + Registro/Login**
   - Landing simple que explique la app y enlace a `login` y `register`.
   - Registro crea usuarios con rol `ROLE_USER`.
   - Login devuelve JWT y redirige al panel de tareas.
2. **Gestión de tareas (ROLE_USER)**
   - Crear, listar, editar y eliminar tareas propias.
   - Cambiar estado y filtrar por estado/fecha.
3. **Panel de administración (ROLE_ADMIN)**
   - Listar usuarios, buscar por email/nombre.
  - Crear usuarios admins/usuarios.
  - Resetear contraseña (generar temporal) y ver estadísticas simples de tareas por estado.

## 2. Ruta de aprendizaje guiada

| Bloque | Qué aprenderás | Entregable dentro de la app |
| --- | --- | --- |
| PostgreSQL + DBeaver | Levantar la base de datos, crear tablas `usuarios` y `tareas`, practicar consultas. | Esquema sincronizado y consultas útiles para la app. |
| Symfony | Entidades Doctrine, servicios, controladores REST, autenticación JWT, mailer y comandos. | API `usuarios`/`tareas` completa, mail de bienvenida y comando para crear admin. |
| Angular | SPA con Tailwind, formularios reactivos, consumo de API, toasts, guards y roles. | Frontend con landing, login/register, tablero de tareas y panel admin. |
| GitLab | Flujo de trabajo, issues, MR, CI. | Backlog importado y documentado + prácticas de colaboración. |

## 3. Entregable mínimo

### Backend (Symfony)
- Entidades `Usuario` y `Tarea` con relaciones y migraciones aplicadas.
- Endpoints JWT:
  - `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/me`.
- Endpoints `usuarios` (solo admin):
  - CRUD básico + reset de contraseña (`POST /api/admin/users/{id}/reset-password`).
- Endpoints `tareas` (usuario autenticado):
  - `GET /api/tasks` filtrable por estado/fecha.
  - `POST /api/tasks`, `PUT /api/tasks/{id}`, `PATCH /api/tasks/{id}/status`, `DELETE /api/tasks/{id}`.
- Mailer:
  - envío de bienvenida tras registro.
  - envío opcional cuando un admin resetea contraseña (con temporal).
- Comando `app:create-admin` para crear admin por defecto.

### Base de datos (PostgreSQL)
- Tablas `usuarios` y `tareas` sincronizadas.
- Índices útiles (`usuarios.email`, `tareas.usuario_id`, `tareas.estado`).
- Consultas guardadas o vistas para:
  - Conteo de tareas por estado.
  - Listado de tareas próximas a vencer.

### Frontend (Angular)
- Landing pública (`/`).
- Formularios de login y registro (reactive forms, validaciones).
- Dashboard de tareas:
  - Lista con filtros/orden.
  - Formulario para crear/editar.
  - Acciones para marcar como completada y eliminar.
- Panel admin:
  - Tabla de usuarios, botón para crear y resetear contraseñas.
  - Visualización rápida de tareas por estado (chart o resumen).
- Guards y rutas protegidas (`ROLE_USER`, `ROLE_ADMIN`).
- Toasts globales para feedback.

### Flujo a demostrar
1. Usuario se registra → recibe email de bienvenida.
2. Inicia sesión → ve sus tareas (vacías al principio).
3. Crea/edita/borra tareas y cambia estados; se reflejan en la API y base de datos.
4. Un admin inicia sesión → gestiona usuarios y ve estadísticas.
5. Admin resetea contraseña de un usuario → el usuario puede iniciar sesión con la nueva contraseña y debe cambiarla manualmente después.

## 4. Evaluación continua y flujo de git

- Trabaja siempre en ramas feature, nunca directamente en `main` o `develop`. Para cada bloque usa un prefijo claro e incluye tu nombre o alias (por ejemplo `feature/postgresql-ej01-fran`, `feature/angular-auth-lucia`, `feature/symfony-mailer-carlos`). Incluso cuando el ejercicio solo actualice documentación o scripts de PostgreSQL, mantén el mismo flujo para que el histórico quede ordenado.
- Antes de iniciar un ejercicio:
  1. Ejecuta `git status`. Si la salida indica _working tree clean_, puedes continuar. Si hay cambios pendientes, decide si los subirás (`git add . && git commit -m "..."`), los guardarás (`git stash`) o los descartarás.
  2. Crea la rama correspondiente: `git checkout -b feature/<modulo>-<tarea>-<tu-nombre>` (ej.: `git checkout -b feature/postgresql-usuarios-fran`).
- Durante el ejercicio:
  - Revisa `git status` con frecuencia para asegurarte de que solo modificas los archivos esperados.
  - Guarda tu avance con `git add . && git commit -m "feat(<modulo>): <resumen>"` empleando mensajes descriptivos.
  - Sube la rama con `git push -u origin feature/<modulo>-<tarea>-<tu-nombre>` y enlázala en la issue del tablero.
- Al terminar cada guía:
  - Ejecuta los comandos clave del bloque (Docker, Symfony, Angular) y documenta resultados.
  - Valida en Postman y DBeaver que los datos coinciden con lo esperado.
  - Adjunta capturas y notas en la issue correspondiente.
- Antes de pedir asistencia o hacer un merge request, asegúrate de que `git status` muestre _nothing to commit, working tree clean_. Esto facilita las revisiones y evita conflictos.
- Mantén un README personal con:
  - URL de endpoints relevantes.
  - Usuarios de prueba (emails/roles/contraseñas temporales).
  - Pendientes o ideas de mejora.

## 5. Extensiones sugeridas (post-onboarding)

- Tests automatizados (PHPUnit para servicios/repositories, Pest o Jest para Angular).
- Recordatorios de tareas vía Mailer.
- Etiquetas o prioridades para tareas.
- Exportación de tareas (CSV/ICS).
- Widget de estadísticas más avanzado (gráficas por fecha, comparativas).

> Todos trabajamos sobre la misma app. Usa las guías como referencia, pero documenta cualquier ajuste que realices para que tu rama siga siendo reproducible por el resto del equipo.
