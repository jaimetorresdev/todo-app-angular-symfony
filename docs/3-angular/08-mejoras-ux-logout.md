# Ejercicio 08 · Extras

## Objetivo

Proponer mejoras de experiencia de usuario y pequeñas funcionalidades que consoliden lo hecho: personalizar colores y tipografías, añadir logout visible en páginas clave y sugerir ideas extra (p. ej., integrar emails con Symfony Mailer).

## Propuestas de trabajo

- Tema y tipografías con Tailwind
  - Define una paleta propia en `angular-frontend/tailwind.config.js` (`theme.extend.colors`) y una fuente base en `theme.extend.fontFamily`.
  - Importa una fuente (Google Fonts o local) en `angular-frontend/src/styles.css` y aplícala al `body`.
  - Aplica la nueva paleta a botones, inputs y cabeceras de:
    - `angular-frontend/src/app/modules/tasks-page-component/tasks-page-component.html`
    - `angular-frontend/src/app/modules/admin/dashboard-component/dashboard-component.html`
  - Criterios: contraste AA, estados hover/focus accesibles, consistencia entre vistas.

- Cabecera común y acción de logout
  - Crea un pequeño header (navbar) en `shared/components` con enlaces a `/tasks` y, si el usuario es admin, a `/admin`.
  - Añade un botón “Cerrar sesión” que borre el token y regrese al home (`/`). Puedes reutilizar `AuthStore.clearSession()` y `Router.navigateByUrl('/')`.
  - Inserta la navbar en `angular-frontend/src/app/app.component.html` para que aparezca en todas las páginas privadas.
  - Añade el botón de logout también dentro de:
    - `tasks-page-component` (zona superior)
    - `admin/dashboard-component` (barra superior de la tarjeta)

- Pulido visual de formularios y tablas
  - Inputs con `focus:ring`, tamaños consistentes (`h-10`, `text-sm`), errores de validación visibles.
  - Tablas con `divide-y`, `bg-slate-50` en cabecera, filas con `hover:bg-slate-50`, acciones alineadas a la derecha.
  - Añade feedback con toasts en acciones (crear usuario, reset password, crear/editar tareas).

- Detalles UX rápidos
  - Loading states: deshabilita botones mientras se envían peticiones.
  - Vacíos de datos: muestra mensajes cuando no existan usuarios/tareas en lugar de una tabla vacía.
  - Accesibilidad: `aria-label` en botones icónicos y foco visible.

- Logout técnico
  - Asegúrate de limpiar sesión también ante `401` global (opcional si no lo hiciste en el 07): en el interceptor, al detectar `401`, llamar a `AuthStore.clearSession()` y redirigir a `/login` mostrando un toast.

- Ideas extra (opcional)
  - Symfony Mailer: envía un correo al crear un usuario desde admin con una plantilla más cuidada (logo, colores del tema). Revisa `symfony-backend/src/Service/NotificacionUsuario.php` si quieres centralizar o mejorar plantillas.
  - Preferencias de tema: añade selector claro/oscuro y guarda la elección en `localStorage`.
  - Copiar al portapapeles: al resetear password desde admin, ofrece botón para copiar la contraseña temporal (`navigator.clipboard.writeText`).
  - Tests: añade pruebas de logout (unitario en store e integración con RouterTestingModule) y de visibilidad condicional del enlace “Admin”.

## Sugerencias de implementación (orientativas)

- Tailwind (colores + tipografía):
  - `tailwind.config.js`
    - `theme.extend.colors.primary = { DEFAULT: '#2563eb', 600: '#2563eb', 700: '#1d4ed8' }`
    - `theme.extend.fontFamily.sans = ['Inter', 'system-ui', 'sans-serif']`
  - `styles.css`
    - `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');`
    - `body { @apply font-sans text-slate-800 bg-slate-50; }`

- Logout en componentes (idea):
  - Inyecta `AuthStore` y `Router` y crea un método `logout()` que haga `store.clearSession(); router.navigateByUrl('/')`.

- Navbar mínima:
  - Coloca el email del usuario y el botón de logout a la derecha; muestra el enlace a “Admin” solo si `store.isAdmin()`.

## Resultado esperado

- Interfaz con colores y tipografía personalizada, coherente en login, tareas y admin.
- Botón de logout accesible en `tasks` y `admin` que limpia sesión y te devuelve al home.
- Opcional: emails más cuidados, preferencia de tema, pequeños toques de UX y tests básicos de navegación/guard.


