# Solución · Ejercicio 01

## Puntos clave

- `bootstrapApplication` en `main.ts` sustituye al antiguo `AppModule`. Ahí se combinan `AppComponent` y la configuración global (`appConfig`, `provideRouter`, `provideHttpClient`, etc.).
- `AppComponent` es standalone (`standalone: true`) y define el layout base. Si hay elementos como `navbar` o `footer`, van en su plantilla para que aparezcan en toda la SPA.
- Tailwind se inicializa en `styles.css` con `@tailwind base; @tailwind components; @tailwind utilities;`. Cada componente puede usar clases utilitarias directamente en su HTML.
- Los estilos globales afectan a toda la app; los estilos de componente (`styleUrls`) se encapsulan gracias al `ViewEncapsulation` por defecto.
- El layout compartido se logra declarando los contenedores en `app.component.html`, envolviendo al `<router-outlet>` o al componente que renderice las rutas standalone.
- El título de la pestaña se controla en `src/index.html`; modifica la etiqueta `<title>` y, tras guardar, ejecuta un hard reload (`Ctrl+Shift+R`) para evitar que el navegador use la versión cacheada.
- Para mostrar título y subtítulo en la cabecera, declara las propiedades en `app.component.ts` y pínchalas en el template de `app.component.html`. Si el navegador mantiene valores anteriores, fuerza un hard reload (`Ctrl+Shift+R`). Ejemplos:

```html
<!-- src/index.html -->
<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>Onboarding Angular · Demo</title>
    <base href="/" />
  </head>
  <body class="font-sans bg-slate-100">
    <app-root></app-root>
  </body>
</html>
```
Solución reto práctico:

```ts
// src/app/app.component.ts
export class AppComponent {
  title = 'Onboarding Angular · Demo';
  subtitle = 'Tu primera SPA conectada al backend Symfony';
  description = 'Explora la estructura standalone, Tailwind y los primeros flujos de la aplicación.';
}
```

```html
<!-- src/app/app.component.html -->
<header class="px-6 py-8 bg-slate-900 text-white">
  <h1 class="text-2xl font-semibold">{{ title }}</h1>
  <h2 class="mt-2 text-lg font-medium text-slate-200">{{ subtitle }}</h2>
  <p class="mt-4 max-w-2xl text-sm text-slate-300">
    {{ description }}
  </p>
</header>
```
