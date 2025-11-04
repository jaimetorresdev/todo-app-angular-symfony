# Ruta Angular & Tailwind

Aprenderás la estructura del `angular-frontend`, cómo funciona una SPA, el rol de Tailwind en los estilos y cómo conectar componentes con la API de Symfony.

> Toda la ruta está alineada con la To-Do App descrita en [Proyecto Onboarding](../proyecto-integrador.md). Construirás la landing, formularios de autenticación, tablero de tareas y panel de administración sobre la misma API.

## Prerrequisitos

- Node.js LTS instalado.
- Dependencias del proyecto (`npm install` en `angular-frontend`).
- Backend Symfony levantado para consumir la API.
- Si ves un error de permisos al ejecutar `npm install` dentro de `angular-frontend`, corrige la propiedad de la carpeta con `sudo chown -R $USER .` y vuelve a intentarlo.

## Itinerario

1. [Entender la estructura base y AppComponent](01-estructura-spa.md)
2. [Componentes standalone y reutilización](02-componentes-modulos.md)
3. [Formularios reactivos y validaciones](03-formularios-reactivos.md)
4. [Login y Registro (JWT)](04-login-register.md)
5. [Consumo de API y manejo de estados](05-consumo-api.md)
6. [Toasts, navegación y UX con Tailwind](06-toasts-navegacion.md)
7. [Autenticación JWT y guards por rol](07-auth-guards.md)
8. [Extras](08-mejoras-ux-logout.md)

Cada ejercicio incluye paso a paso, un reto final y la solución asociada.
