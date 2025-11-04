# Ruta Symfony

Aprenderás a estructurar un proyecto Symfony desde cero, creando entidades, repositorios, servicios y controladores REST. Terminaremos con autenticación JWT usando LexikJWTAuthenticationBundle, envío de emails con el Mailer y un comando de arranque.

> Todas las guías están pensadas para la To-Do App: entidades `Usuario` y `Tarea`, roles `ROLE_USER`/`ROLE_ADMIN` y endpoints alineados con Angular. Después de cada ejercicio prueba los endpoints con Postman y valida los cambios en DBeaver para mantener la coherencia del modelo.

## Prerrequisitos

- PHP >= 8.1 y Composer instalados.
- `symfony-backend` del proyecto clonado.
- Contenedor de base de datos activo.

## Itinerario

1. [Explorar la estructura base del proyecto](01-estructura-proyecto.md)
2. [Crear entidades y repositorios](02-entidades-repositorios.md)
3. [Controladores y servicios de dominio](03-controladores-servicios.md)
4. [Autenticación con JWT (Lexik)](04-autenticacion-jwt.md)
5. [Mailer: envío de correos transaccionales](05-mailer.md)
6. [Comando para crear administrador por defecto](06-comando-admin.md)

Cada ejercicio tiene una guía y una solución. Trata de avanzar sin mirar la solución hasta que lo necesites.
