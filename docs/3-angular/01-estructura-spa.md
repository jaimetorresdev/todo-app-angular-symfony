# Ejercicio 01 · Estructura base y AppComponent

## Objetivo

Comprender cómo Angular organiza una SPA, identificar los archivos clave del `AppComponent` y cómo Tailwind se integra en la capa de estilos.

## Ejercicios guiados

### Guía 1 · Arrancar el proyecto

1. Desde `angular-frontend`, ejecuta `npm start`. (asegurate que no tienes ningún contenedor corriendo)
2. Abre `http://localhost:4200` y confirma que la app inicia sin errores.
> Nota: si al ejecutar `npm install` en `angular-frontend` aparece un error de permisos, usa `sudo chown -R $USER .` dentro de esa carpeta y repite el comando.

### Guía 2 · Reconocer archivos principales

1. Abre `src/main.ts` y localiza la llamada a `bootstrapApplication(AppComponent, appConfig)`: `main.ts` es el punto de entrada que lanza la SPA y `appConfig` concentra la configuración global (router, interceptores HTTP, animaciones, etc.).
2. Explora `src/app/app.component.ts` y `app.component.html`. El primero define el componente raíz (`standalone: true`, imports disponibles, providers específicos) y el segundo describe el layout base sobre el que se renderizarán el resto de vistas (`<router-outlet>`, navbar, footer...).
3. Revisa `src/app/app.routes.ts` (o el archivo equivalente). Aquí se definen las rutas en formato standalone (`Routes` con `loadComponent`/`loadChildren`, guards, resolvers) que el router usará para mostrar cada pantalla.
4. Abre `src/styles.css`. Este archivo aporta los estilos globales de la SPA: incluye las directivas de Tailwind (`@tailwind base;`, `@tailwind components;`, `@tailwind utilities;`) y cualquier utilidad compartida, mientras que los estilos específicos viven en los `.css`/`.scss` de cada componente.

### Guía 3 · Modificar y observar cambios

1. Abre `src/index.html` y cambia el contenido de la etiqueta `<title>` por un texto identificativo. Guarda y fuerza un hard reload del navegador (`Ctrl+Shift+R`) para limpiar la caché y verificar el nuevo título de la pestaña.
2. Abre `src/app/app.component.ts` y localiza la propiedad o constante que define el título mostrado en la vista principal; actualiza el string por un texto propio (pista: suele llamarse `title` o aparece interpolado con `{{ }}` en el HTML).
3. Guarda y revisa `src/app/app.component.html` para asegurarte de que se renderiza tu nuevo texto. Angular recargará la SPA automáticamente; si el navegador mantiene el contenido previo, vuelve a aplicar un hard reload. Consulta `01-estructura-spa.solucion.md` para ver un ejemplo completo.

## Reto práctico

Investiga por tu cuenta cómo mostrar un mensaje sencillo en la cabecera usando los archivos que ya tocaste (`index.html`, `app.component.ts`, `app.component.html`). La idea es replicar el proceso de cambiar el título: define un texto nuevo, haz que aparezca en la interfaz y valida el resultado con un hard reload si es necesario. El objetivo final es que `app.component.html` muestre un título y un subtítulo (o descripción breve) cuyos valores provengan de propiedades declaradas en `app.component.ts`. Después contrasta tu propuesta con la guía en `01-estructura-spa.solucion.md`, donde encontrarás los bloques de código completos.

Consulta `01-estructura-spa.solucion.md` cuando hayas finalizado el reto.
