# Ruta PostgreSQL & DBeaver

El objetivo es aprender a levantar la base de datos en Docker, conectarse con DBeaver y practicar operaciones básicas con SQL. Trabajaremos sobre la instancia PostgreSQL que arranca con `docker-compose`, usando el modelo definido en la [To-Do App del Proyecto Onboarding](../proyecto-integrador.md): tablas `usuarios` y `tareas`.

## Prerrequisitos

- Docker y docker-compose instalados.
- Contenedor de la base de datos levantado (`docker compose up -d database`).
- DBeaver instalado.

## Itinerario

1. [Preparar la conexión y revisar el esquema](01-preparacion-entorno.md)
2. [Insertar y consultar datos básicos](02-consultas-basicas.md)
3. [Modelar una relación y usar JOINs](03-modelado-relacional.md)
4. [Crear métricas con agregaciones](04-consultas-agrupadas.md)
5. [Practicar CRUD completo desde SQL](05-transacciones-y-mantenimiento.md)

Cada ejercicio tiene su versión `*.solucion.md`. Intenta resolver primero por tu cuenta.
