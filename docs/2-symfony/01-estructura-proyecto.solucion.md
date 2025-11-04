# Solución · Ejercicio 01

## Puntos clave

- `config/bundles.php`: lista los bundles y el entorno en el que se activan. Si añades un bundle nuevo (ej. Mailer), aquí verás la entrada correspondiente.
- `config/routes.yaml`: importa automáticamente los controladores de `src/Controller/` usando atributos (`type: attribute`). Por eso `HealthController` aparece sin tocar YAML extra y puede renderizar `templates/health/index.html.twig`.
- `src/Kernel.php`: orquesta la carga de bundles (`registerBundles()`) y de configuración/rutas (`configureContainer()`, `configureRoutes()`).
- `src/Controller/HealthController.php`: ejemplo mínimo de endpoint; renderiza la plantilla de Twig en `/api/health` y sirve como plantilla para futuros controladores.
- `public/index.php`: front controller que arranca el runtime de Symfony. Toda petición HTTP entra por aquí antes de pasar por el kernel.
- `src/Entity/` y `src/Repository/`: actualmente vacías, pero reservarás estos directorios para las entidades Doctrine (`Usuario`, `Tarea`) y las consultas personalizadas.
- Contexto de la aplicación de tareas: Symfony actuará como backend de la API REST. Las rutas definidas en `src/Controller/` expondrán operaciones CRUD sobre `Usuario` y `Tarea`, mientras Doctrine (entidades/repositorios) persistirá los datos que consumirá Angular.
- Twig: `base.html.twig` define la estructura general (bloques `title`, `body`) y `health/index.html.twig` hereda de ella para mostrar el mensaje. `{{ controller_name }}` imprime la variable que el controlador pasa a la vista y `{% block %}` delimita cada sección personalizable.
