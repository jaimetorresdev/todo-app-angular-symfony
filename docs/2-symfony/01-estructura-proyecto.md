# Ejercicio 01 · Reconocer la estructura de un proyecto Symfony

## Objetivo

Familiarizarte con la estructura básica del `symfony-backend`, identificando los directorios clave y la configuración de entorno.

## Ejercicios guiados

### Guía única · Mapa rápido del proyecto

1. En `config/` identifica los ficheros imprescindibles:
   - `config/bundles.php` para ver qué bundles se cargan.
   - `config/packages/doctrine.yaml` y `config/packages/security.yaml` como ejemplos de ajustes de infraestructura.
   - `config/routes.yaml` para entender cómo se descubren las rutas y cómo enlazan con las plantillas Twig.
   Resume en una frase qué aporta cada uno.
2. En `src/` observa las subcarpetas que vienen de serie:
   - `Controller/HealthController.php` muestra cómo se definen rutas con atributos y se renderiza `templates/health/index.html.twig`.
   - `Kernel.php` centraliza la carga de bundles y configuración.
   Anota qué carpetas están pendientes de poblar (`Entity`, `Repository`) y qué tipo de archivos vivirán allí.
3. Explora la carpeta `templates/`:
   - `base.html.twig` sirve como layout principal; define bloques (`{% block title %}`, `{% block body %}`) que otras vistas pueden sobrescribir.
   - `templates/health/index.html.twig` hereda de `base.html.twig` usando `{% extends %}` y muestra un mensaje que recibe variables (`{{ controller_name }}`) desde el controlador.
   Identifica cómo Twig separa HTML de lógica con sus etiquetas (`{% ... %}` para instrucciones, `{{ ... }}` para imprimir valores) y toma nota de qué variables llegan a la vista del health check.
3. Revisa `public/` y `var/`:
   - `public/index.php` es el front controller que arranca la app.
   - `var/` almacena caché y logs; fíjate en cómo se subdivide por entorno (`dev`, `prod`).

## Reto práctico

Redacta en una issue en GitLab un glosario con dos columnas: **ubicación** y **responsabilidad**. Incluye al menos:

- `config/bundles.php`
- `config/routes.yaml`
- `src/Kernel.php`
- `src/Controller/HealthController.php`
- `public/index.php`
- Una nota sobre qué irá en `src/Entity/` y `src/Repository/`

Si alguna parte no queda clara, pregúntala; la resolveremos paso a paso. El objetivo de este ejercicio es comprender que rol va a tener symfony en la aplicación de tareas.
Recuerda que Symfony es un mundo, es normal que se nos haga complejo al principio, no hay que entenderlo todo desde ya, por eso estamos haciendo este onboarding. Comprueba tu glosario visitando `http://localhost:8000/api/health` y observando cómo el controlador renderiza la plantilla Twig.

Consulta `01-estructura-proyecto.solucion.md` solo después de completar el reto.
