# Guía de Onboarding Técnico

Este directorio contiene rutas de aprendizaje guiadas y retos prácticos para el stack del proyecto: PostgreSQL, Symfony, Angular, GitLab y Docker. Cada bloque se divide en:

- **Guía**: contexto y pasos guiados para entender la herramienta o concepto.
- **Ejercicios**: actividades para practicar. Cada ejercicio termina con una sección “Piensa antes de ver la solución”.
- **Soluciones** (`*.solucion.md`): referencia opcional para validar lo que hiciste o desbloquearte.

Antes de empezar, revisa el [Proyecto Onboarding](proyecto-onboarding.md). Allí se describe la aplicación única que construiremos entre todos: una **To-Do App** con usuarios y roles (`ROLE_USER`, `ROLE_ADMIN`). Todas las guías y ejercicios se han adaptado a ese dominio; mantén siempre la nomenclatura propuesta (`usuarios`, `tareas`) para que el equipo trabaje en la misma base de código.

Si trabajas con tableros o issues, importa [`tasks-gitlab.csv`](tasks-gitlab.csv) en GitLab para generar las tareas del onboarding (duplica cada issue añadiendo tu nombre al título y documenta el avance con capturas).

## Rutas disponibles

- [PostgreSQL](postgresql/README.md): conexión con DBeaver, consultas básicas y modelado inicial.
- [Symfony](symfony/README.md): estructura del proyecto, entidades, servicios, JWT y mailer.
- [Angular](angular/README.md): estructura SPA, Tailwind, componentes, formularios reactivos y consumo de API.
- [GitLab & Flujo de trabajo](gitlab/README.md): ramas, commits, issues y tableros.

> Recomendación: avanza en orden. Cada bloque prepara el contexto del siguiente y reproduce la forma de trabajo del equipo.
