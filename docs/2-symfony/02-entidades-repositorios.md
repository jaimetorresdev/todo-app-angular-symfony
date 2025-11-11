# Ejercicio 02 · Entidades del dominio y repositorios personalizados

## Objetivo

Modelar en Symfony las mismas tablas que preparaste en PostgreSQL (`usuarios`, `tareas`), generar las migraciones y crear métodos de repositorio que utilizarás en los servicios y controladores posteriores.

## Ejercicios guiados

### Guía 0 · Crear/actualizar la entidad `Usuario`

1. Levanta los servicios necesarios desde la raíz del proyecto: `docker compose up -d backend db`. Si usas Docker Desktop y ya has desplegado la app antes, abre la vista de contenedores, selecciona `onboarding-daw-v2` y pulsa **Start** (botón de play) en `backend` y `db`.
2. Abre una consola dentro del contenedor PHP para evitar problemas de DNS:
   - Terminal: `docker compose exec backend bash`, para salir escribe `exit`. Desde aquí puedes pegar comandos y usar tu editor sin restricciones.
   - Docker Desktop: entra a la pestaña dentro del contenedor del backend **Exec**.
   Dentro de esa shell ejecuta `php bin/console make:user Usuario` y responde paso a paso (solo para familiarizarte con el asistente; más adelante generaremos la entidad completa):
   - `Do you want to store user data in the database (via Doctrine)?` → `yes`.
   - `Enter a property name that will be the unique identifier for this user` → `email`.
   - `Will this app need to hash/check user passwords?` → `yes`.
   - `Enter the property name that will store hashed passwords` → `password`.
   - `Do you want to add support for Doctrine's password hasher (argon2i, bcrypt, sodium)` → deja la opción por defecto (`yes`).
   - `Do you want to add support for username/password form login?` → `no` (lo configuraremos posteriormente con JWT).
3. Genera la entidad definitiva ampliando los prompts paso a paso:
   ```bash
   php bin/console make:entity Usuario
   ```
   Symfony mostrará los prompts en inglés. Puedes responder así:
   - ` New property name (press <return> to stop adding fields):` → escribe `nombre`.
   - ` Field type (enter ? to see all types) [string]:` → pulsa Enter (deja `string`).
   - ` Field length [255]:` → escribe `120`.
   - ` Can this field be null in the database (nullable) (yes/no) [no]:` → pulsa Enter para dejar `no`.

   - ` New property name (press <return> to stop adding fields):` → escribe `fechaRegistro`.
   - ` Field type (enter ? to see all types) [string]:` → escribe `datetime_immutable`.
   - ` Can this field be null in the database (nullable) (yes/no) [no]:` → pulsa Enter.
   - ` New property name (press <return> to stop adding fields):` → pulsa Enter para terminar.

   Con eso Doctrine generará los getters/setters automáticamente. Después abre `src/Entity/Usuario.php` y pega estos ajustes. Coloca el constructor inmediatamente después de la lista de propiedades privadas (antes de cualquier getter/setter):
   ```php
   public function __construct()
   {
       $this->fechaRegistro = new \DateTimeImmutable();
   }
   ```
   
   > Importante: sin este constructor la columna `fecha_registro` quedará a `NULL` y obtendrás un error de base de datos cuando intentes crear usuarios desde los servicios en el ejercicio 03.

### Guía 1 · Crear la entidad `Tarea`

1. Ejecuta `php bin/console make:entity Tarea` y añade los campos exactamente con estos tipos:
   - `titulo` → `string`, longitud 180, obligatorio.
   - `descripcion` → `text`, marcar como `nullable`.
   - `estado` → `string`, longitud 20, obligatorio (usaremos los valores `pendiente`, `en_progreso`, `completada`).
   - `fechaCreacion` → `datetime_immutable`, obligatorio.
   - `fechaLimite` → `datetime`, marcar como `nullable`.
2. Abre `src/Entity/Tarea.php` y define la relación con el usuario (el `ManyToOne` significa que muchas tareas pertenecen a un único usuario; `inversedBy` apunta al array `tareas` que tendrás en la entidad `Usuario` cuando la generes; `onDelete='CASCADE'` indica que si se borra un usuario se eliminan sus tareas automáticamente):
   ```php
   #[ORM\ManyToOne(inversedBy: 'tareas')]
   #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
   private ?Usuario $usuario = null;
   ```
   Añade también los métodos para acceder y modificar el usuario:
   ```php
   public function getUsuario(): ?Usuario
   {
       return $this->usuario;
   }

   public function setUsuario(?Usuario $usuario): self
   {
       $this->usuario = $usuario;

       return $this;
   }
   ```

### Guía 2 · Generar migraciones y validar en DBeaver

1. Ejecuta en el contenedor del backend `php bin/console make:migration` y revisa que se crean:
   - Tabla `usuario` con columnas `nombre`, `email`, `password`, `roles` (json), `fecha_registro`.
   - Tabla `tarea` con FK a `usuario`.
2. Lanza `php bin/console doctrine:migrations:migrate`. (Are you sure you wish to continue? (yes/no) [yes] contestar como "yes")

   Nota (si te aparece un error porque ya existía una migración previa):
   - Elimina las migraciones generadas anteriormente: `rm -f migrations/*.php` (o bórralas manualmente en la carpeta `migrations/`).
   - En DBeaver, elimina las tablas `usuario` y `tarea` del esquema de la base de datos (si existe, puedes eliminar también `doctrine_migration_versions`).
   - Vuelve a crear la migración: `php bin/console make:migration`.
   - Ejecuta de nuevo: `php bin/console doctrine:migrations:migrate`.

3. En DBeaver, refresca el esquema y verifica que las tablas coinciden con las creadas en los ejercicios PostgreSQL.

Si ves dos tablas extra (`doctrine_migration_versions` y `messenger_messages`), no te alarmes: son de Symfony y sirven para llevar el control de las migraciones y la cola de Messenger; no forman parte de tu modelo.

### Guía 3 · Métodos en los repositorios

1. En `TareaRepository` (`src/Repository/TareaRepository.php`), pega este método completo. Así puedes copiarlo tal cual y luego leer cada línea para entender qué hace:

   ```php
   /**
    * Devuelve todas las tareas de un usuario ordenadas de la más reciente a la más antigua.
   *
   * @return Tarea[]
   */
   public function findByUsuarioOrdenadas(int $usuarioId): array
   {
       $qb = $this->createQueryBuilder('t'); // creamos el QueryBuilder con alias t

       return $qb
           ->andWhere('t.usuario = :usuarioId')    // filtramos por el usuario indicado
           ->setParameter('usuarioId', $usuarioId) // enlazamos el valor del parámetro
           ->orderBy('t.fechaCreacion', 'DESC')    // ordenamos por fecha de creación descendente
           ->getQuery()
           ->getResult();
   }
   ```

   - `createQueryBuilder('t')` genera la consulta partiendo de la entidad `Tarea` y la llama `t`.
   - `andWhere` añade condiciones `WHERE`. Usamos `:usuarioId` (con dos puntos) porque es un parámetro que reemplazamos con `setParameter`.
   - `orderBy` ordena los resultados.
   - `getQuery()->getResult()` ejecuta la consulta y devuelve un array de entidades `Tarea`.

   Ahora crea `buscarPorFiltros(int $usuarioId, ?string $estado, ?string $texto)` haciendo algo **muy parecido**:
   1. Copia el método anterior, cambia el nombre y firma.
   2. Mantén la línea que filtra por usuario (siempre queremos solo sus tareas).
   3. Añade `if ($estado) { ... }` para incluir un `andWhere('t.estado = :estado')` con su `setParameter`.
   4. Añade `if ($texto) { ... }` para buscar por título o descripción (usa `LIKE` y `LOWER(...)` con `%` delante y detrás del texto).
   5. Termina igual con `getQuery()->getResult()`.

2. En `UsuarioRepository` (`src/Repository/UsuarioRepository.php`):

   ```php
   /**
    * Busca usuarios cuyo email o nombre contenga el término indicado (ignorando mayúsculas/minúsculas).
   *
   * @return Usuario[]
   */
   public function buscarPorEmailONombre(?string $term): array
   {
       if ($term === null || $term === '') {
           return [];
       }

       $normalizado = '%' . mb_strtolower($term) . '%';

       return $this->createQueryBuilder('u')
           ->andWhere('LOWER(u.email) LIKE :term OR LOWER(u.nombre) LIKE :term')
           ->setParameter('term', $normalizado)
           ->orderBy('u.nombre', 'ASC')
           ->getQuery()
           ->getResult();
   }
   ```

   - Controlamos primero el caso de término vacío para evitar consultas innecesarias.
   - `mb_strtolower` convierte el término a minúsculas para compararlo con `LOWER(...)` en SQL.
   - El `%` al inicio y final permite que Doctrine genere un `LIKE '%texto%'`.

   Para `contarTareasPorEstado(): array` haz algo similar al patrón anterior, pero esta vez:
   1. Empieza con `createQueryBuilder('u')`.
   2. Haz `innerJoin('u.tareas', 't')`.
   3. Selecciona `select('t.estado AS estado, COUNT(t.id) AS total')`.
   4. Agrupa con `groupBy('t.estado')`.
   5. Devuelve el resultado con `getQuery()->getArrayResult()` para obtener arrays asociativos.


## Reto práctico

Implementa en `TareaRepository` un método `findPendientesPorVencer(int $usuarioId, \DateInterval $intervalo)` que devuelva tareas pendientes cuya `fechaLimite` esté dentro del intervalo indicado. Valida la consulta en Symfony y DBeaver. Compárala con `02-entidades-repositorios.solucion.md`.

Consulta `02-entidades-repositorios.solucion.md` solo después de implementar el reto.
