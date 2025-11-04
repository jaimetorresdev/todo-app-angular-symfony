# Ejercicio 03 · Controladores REST y servicios para usuarios y tareas

## Objetivo

Construir los endpoints principales de la To-Do App delegando la lógica en servicios de dominio. Al finalizar tendrás colecciones de Postman listas para probar los flujos de usuario y administrador y validarás que la API refleja los datos en PostgreSQL.

---

## Antes de empezar · Conceptos que necesitas

- **Servicios de dominio (carpeta `src/Service/`)**: clases simples que encapsulan reglas de negocio. Se inyectan en controladores y otros servicios por el contenedor de Symfony.
- **Repositorios Doctrine**: ya creaste consultas reutilizables en el ejercicio anterior (`TareaRepository::buscarPorFiltros`, `UsuarioRepository::contarTareasPorEstado`). Aquí las consumiremos.
- **EntityManagerInterface**: coordina `persist`, `flush`, `remove`… piensa en él como “guardar cambios” en base de datos.
- **Excepciones HTTP**: en controladores/servicios puedes lanzar `BadRequestHttpException`, `NotFoundHttpException`, etc. Symfony las transforma en respuestas JSON con el código correcto.
- **Controladores REST**: clases en `src/Controller/` con métodos que responden a rutas como `GET /api/tasks`. Cada método suele:
  1. Validar o normalizar la entrada (body, query params, usuario autenticado).
  2. Delegar la lógica en un servicio.
  3. Devolver una respuesta con `$this->json(...)`.
- **LoggerInterface**: servicio para escribir logs (`$logger->info('mensaje')`). Útil para auditoría.

---

## Trabajo guiado 1 · Servicio `TareaManager`

### Paso 1 · Crear el archivo

Crea manualmente el fichero `src/Service/TareaManager.php` (puedes usar tu editor o ejecutar `touch src/Service/TareaManager.php` dentro del contenedor `backend`).

### Paso 2 · Pega este esqueleto

```php
<?php

namespace App\Service;

use App\Entity\Tarea;
use App\Entity\Usuario;
use App\Repository\TareaRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class TareaManager
{
    /**
     * Estados permitidos; evita repetir strings mágicos por toda la aplicación.
     */
    private const ESTADOS_VALIDOS = ['pendiente', 'en_progreso', 'completada'];

    public function __construct(
        private readonly TareaRepository $tareaRepository,      // reutilizamos las consultas personalizadas
        private readonly EntityManagerInterface $entityManager  // coordina los INSERT/UPDATE/DELETE
    ) {
    }

    /**
     * Devuelve las tareas del usuario aplicando filtros opcionales (estado y texto).
     */
    public function listarPorUsuario(int $usuarioId, array $filtros = []): array
    {
        return $this->tareaRepository->buscarPorFiltros(
            $usuarioId,
            $filtros['estado'] ?? null,
            $filtros['texto'] ?? null
        );
    }

    /**
     * Crea una nueva tarea y la persiste en base de datos.
     */
    public function crear(array $payload, Usuario $usuario): Tarea
    {
        $titulo = $payload['titulo'] ?? null;           // título obligatorio
        $estado = $payload['estado'] ?? 'pendiente';    // valor por defecto cuando no llega del cliente

        if (!$titulo) {
            throw new BadRequestHttpException('El título es obligatorio.');
        }

        if (!in_array($estado, self::ESTADOS_VALIDOS, true)) {
            throw new BadRequestHttpException('Estado no válido.');
        }

        $tarea = (new Tarea())
            ->setTitulo($titulo)
            ->setDescripcion($payload['descripcion'] ?? null)
            ->setEstado($estado)
            ->setFechaCreacion(new \DateTimeImmutable())
            ->setFechaLimite(isset($payload['fechaLimite']) ? new \DateTime($payload['fechaLimite']) : null)
            ->setUsuario($usuario); // asociamos la tarea al dueño

        $this->entityManager->persist($tarea); // prepara el INSERT
        $this->entityManager->flush();         // ejecuta la consulta en la base de datos

        return $tarea;
    }

    /**
     * Actualiza los datos principales de una tarea existente.
     */
    public function actualizar(Tarea $tarea, array $payload): Tarea
    {
        if (isset($payload['titulo']) && $payload['titulo'] === '') {
            throw new BadRequestHttpException('El título no puede quedar vacío.');
        }

        if (isset($payload['estado']) && !in_array($payload['estado'], self::ESTADOS_VALIDOS, true)) {
            throw new BadRequestHttpException('Estado no válido.');
        }

        $tarea
            ->setTitulo($payload['titulo'] ?? $tarea->getTitulo())
            ->setDescripcion($payload['descripcion'] ?? $tarea->getDescripcion())
            ->setEstado($payload['estado'] ?? $tarea->getEstado())
            ->setFechaLimite(isset($payload['fechaLimite']) ? new \DateTime($payload['fechaLimite']) : $tarea->getFechaLimite());

        $this->entityManager->flush(); // sincroniza los cambios mediante UPDATE

        return $tarea;
    }

    /**
     * Cambia únicamente el estado de la tarea.
     */
    public function cambiarEstado(Tarea $tarea, string $estado): Tarea
    {
        if (!in_array($estado, self::ESTADOS_VALIDOS, true)) {
            throw new BadRequestHttpException('Estado no válido.');
        }

        $tarea->setEstado($estado);
        $this->entityManager->flush();

        return $tarea;
    }

    /**
     * Elimina la tarea de la base de datos.
     */
    public function eliminar(Tarea $tarea): void
    {
        $this->entityManager->remove($tarea);
        $this->entityManager->flush();
    }

    /**
     * Garantiza que la tarea existe y pertenece al usuario que hace la petición.
     */
    public function aseguraPerteneceAUsuario(?Tarea $tarea, int $usuarioId): Tarea
    {
        if (!$tarea || $tarea->getUsuario()?->getId() !== $usuarioId) {
            throw new NotFoundHttpException('Tarea no encontrada para este usuario.');
        }

        return $tarea;
    }
}
```

### Paso 3 · Preguntas de comprensión, si las puedes responder significa que vamos bien!

1. ¿Qué excepción lanza el método `crear()` cuando no llega el campo `titulo`?
2. ¿Por qué guardamos los estados válidos en la constante `ESTADOS_VALIDOS` en lugar de escribirlos a mano cada vez?
3. ¿En qué momento se ejecuta realmente el INSERT o el UPDATE en la base de datos?
4. ¿Qué pasaría si llamáramos a `aseguraPerteneceAUsuario` con una tarea que pertenece a otro usuario?
5. ¿Cómo se transforma una fecha que llega en texto (`fechaLimite`) en un objeto `\DateTime`?

### Mini reto 1

- Añade validación opcional para que la fecha límite nunca sea anterior a la fecha de creación.
- Implementa un método `listarPendientes(int $usuarioId): array` que llame a `buscarPorFiltros` pasando el estado `'pendiente'`.

---

## Trabajo guiado 2 · Servicio `AdministradorUsuarioService`

### Paso 1 · Crear el servicio

Crea el archivo `src/Service/AdministradorUsuarioService.php`.

### Paso 2 · Pega este bloque completo

```php
<?php

namespace App\Service;

use App\Entity\Usuario;
use App\Repository\UsuarioRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Psr\Log\LoggerInterface;

class AdministradorUsuarioService
{
    public function __construct(
        private readonly UsuarioRepository $usuarioRepository,            // consultas reutilizables
        private readonly UserPasswordHasherInterface $passwordHasher,     // encripta las contraseñas
        private readonly EntityManagerInterface $entityManager,           // gestiona persistencia
        private readonly LoggerInterface $logger                          // registra acciones de auditoría
    ) {
    }

    /**
     * Devuelve usuarios filtrando por nombre o email si se indica.
     */
    public function listar(?string $busqueda = null): array
    {
        return $this->usuarioRepository->buscarPorEmailONombre($busqueda); // delegamos la búsqueda
    }

    /**
     * Crea un usuario con los datos proporcionados y devuelve la entidad resultante.
     */
    public function crear(array $payload): Usuario
    {
        $email = $payload['email'] ?? null;       // campos obligatorios
        $password = $payload['password'] ?? null;

        if (!$email || !$password) {
            throw new BadRequestHttpException('Email y password son obligatorios.');
        }

        $usuario = (new Usuario())
            ->setEmail($email)
            ->setNombre($payload['nombre'] ?? 'Usuario sin nombre')
            ->setRoles($payload['roles'] ?? ['ROLE_USER']); // garantiza al menos ROLE_USER

        // Importante: jamás guardes la contraseña sin hashear
        $usuario->setPassword($this->passwordHasher->hashPassword($usuario, $password));

        $this->entityManager->persist($usuario);
        $this->entityManager->flush();

        $this->logger->info('Usuario creado por admin.', ['email' => $email]); // auditoría

        return $usuario;
    }

    /**
     * Genera una contraseña temporal, la guarda hasheada y devuelve la versión en texto claro.
     */
    public function resetearPassword(Usuario $usuario): string
    {
        $passwordTemporal = bin2hex(random_bytes(4)); // 8 caracteres hexadecimales

        $usuario->setPassword($this->passwordHasher->hashPassword($usuario, $passwordTemporal));
        $this->entityManager->flush();

        $this->logger->info('Password reseteada por admin.', ['usuarioId' => $usuario->getId()]);

        return $passwordTemporal; // el controlador la devolverá para comunicarla al usuario
    }
}
```

### Paso 3 · Preguntas de comprensión

1. ¿Qué pasaría si llamamos a `crear()` sin `email` o sin `password`?
2. ¿Por qué es importante usar `UserPasswordHasherInterface` en lugar de guardar la contraseña en texto plano?
3. ¿Qué información queda registrada cada vez que se crea o se resetea un usuario?
4. ¿Qué formato tiene la contraseña temporal generada por `random_bytes`?

### Mini reto 2

- Evita crear dos usuarios con el mismo email (comprueba con `findOneBy(['email' => $email])`).

---

## Trabajo guiado 3 · Controladores y rutas

>  Reglas generales:
>
> - Mantén los controladores muy delgados.
> - Responde siempre JSON.
> - Reusa los servicios recién creados.

### Paso 1 · Controlador de tareas

```bash
php bin/console make:controller TaskController
```

Reemplaza el contenido por:

```php
<?php

namespace App\Controller;

use App\Repository\TareaRepository;
use App\Service\TareaManager;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/tasks')]
class TaskController extends AbstractController
{
    public function __construct(
        private readonly TareaManager $tareaManager,            // lógica de negocio
        private readonly TareaRepository $tareaRepository,      // consultas directas
        private readonly EntityManagerInterface $entityManager  // referencias rápidas a entidades
    ) {
    }

    #[Route('', name: 'api_tasks_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $usuario = $this->getUser(); // en el ejercicio 04 estará autenticado
        $usuarioId = $usuario?->getId() ?? (int) $request->query->get('usuarioId', 1); // fallback temporal

        $filtros = [
            'estado' => $request->query->get('estado'),
            'texto' => $request->query->get('q'),
        ];

        $tareas = $this->tareaManager->listarPorUsuario($usuarioId, $filtros); // delega al servicio

        return $this->json($tareas);
    }

    #[Route('', name: 'api_tasks_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $usuario = $this->getUser();
        $usuarioId = $usuario?->getId()
            ?? $request->query->getInt('usuarioId', $request->request->getInt('usuarioId', 1)); // provisional

        $payload = json_decode($request->getContent(), true) ?? []; // convertimos el body a array

        $usuarioObj = $this->entityManager->getReference('App\Entity\Usuario', $usuarioId); // evita SELECT completo
        $tarea = $this->tareaManager->crear($payload, $usuarioObj); // utiliza el servicio para validar y guardar

        return $this->json($tarea, JsonResponse::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'api_tasks_update', methods: ['PUT'])]
    public function update(int $id, Request $request): JsonResponse
    {
        $usuario = $this->getUser();
        $usuarioId = $usuario?->getId()
            ?? $request->query->getInt('usuarioId', $request->request->getInt('usuarioId', 1));

        $tarea = $this->tareaManager->aseguraPerteneceAUsuario(
            $this->tareaRepository->find($id),
            $usuarioId
        );

        $payload = json_decode($request->getContent(), true) ?? [];
        $tarea = $this->tareaManager->actualizar($tarea, $payload); // actualiza campos permitidos

        return $this->json($tarea);
    }

    #[Route('/{id}/status', name: 'api_tasks_change_status', methods: ['PATCH'])]
    public function changeStatus(int $id, Request $request): JsonResponse
    {
        $usuario = $this->getUser();
        $usuarioId = $usuario?->getId()
            ?? $request->query->getInt('usuarioId', $request->request->getInt('usuarioId', 1));

        $tarea = $this->tareaManager->aseguraPerteneceAUsuario(
            $this->tareaRepository->find($id),
            $usuarioId
        );

        $payload = json_decode($request->getContent(), true) ?? [];
        $tarea = $this->tareaManager->cambiarEstado($tarea, $payload['estado'] ?? ''); // controla valores válidos

        return $this->json($tarea);
    }

    #[Route('/{id}', name: 'api_tasks_delete', methods: ['DELETE'])]
    public function delete(int $id, Request $request): JsonResponse
    {
        $usuario = $this->getUser();
        $usuarioId = $usuario?->getId()
            ?? $request->query->getInt('usuarioId', $request->request->getInt('usuarioId', 1));

        $tarea = $this->tareaManager->aseguraPerteneceAUsuario(
            $this->tareaRepository->find($id),
            $usuarioId
        );

        $this->tareaManager->eliminar($tarea); // borra la tarea y responde 204

        return $this->json(null, JsonResponse::HTTP_NO_CONTENT);
    }
}
```

> En el ejercicio 04 reemplazarás los `usuarioId` ficticios por el usuario autenticado mediante JWT.

### Paso 2 · Preguntas de comprensión

1. ¿Por qué usamos `getReference` en lugar de `find` al crear una tarea?
2. ¿Qué devolvería la acción `list` si no llega ningún filtro?
3. ¿Qué ocurre si el JSON del body es inválido y `json_decode` devuelve `null`?
4. ¿Por qué validamos la pertenencia de la tarea dentro del servicio y no en el controlador?

### Mini reto 3

- Añade validaciones para que los `payload` sin JSON válido devuelvan 400.
- Devuelve mensajes personalizados cuando se actualiza o elimina una tarea (`['message' => 'Tarea eliminada']`).

### Paso 2 · Controlador de administración

```bash
php bin/console make:controller Admin/UsuarioController
```

Sustituye el contenido por:

```php
<?php

namespace App\Controller\Admin;

use App\Repository\UsuarioRepository;
use App\Service\AdministradorUsuarioService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/admin/users')]
class UsuarioController extends AbstractController
{
    public function __construct(
        private readonly AdministradorUsuarioService $adminUsuarios, // capa de negocio
        private readonly UsuarioRepository $usuarioRepository        // acceso directo para finds
    ) {
    }

    #[Route('', name: 'api_admin_users_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $term = $request->query->get('q'); // parámetro opcional de búsqueda
        $usuarios = $this->adminUsuarios->listar($term); // reutiliza el servicio

        return $this->json($usuarios);
    }

    #[Route('', name: 'api_admin_users_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $payload = json_decode($request->getContent(), true) ?? []; // payload de creación
        $usuario = $this->adminUsuarios->crear($payload);          // valida, hashea y persiste

        return $this->json($usuario, JsonResponse::HTTP_CREATED);
    }

    #[Route('/{id}/reset-password', name: 'api_admin_users_reset_password', methods: ['POST'])]
    public function resetPassword(int $id): JsonResponse
    {
        $usuario = $this->usuarioRepository->find($id); // buscamos el usuario objetivo

        if (!$usuario) {
            return $this->json(['message' => 'Usuario no encontrado'], JsonResponse::HTTP_NOT_FOUND);
        }

        $passwordTemporal = $this->adminUsuarios->resetearPassword($usuario); // devuelve la contraseña temporal

        return $this->json([
            'message' => 'Password reseteada correctamente',
            'passwordTemporal' => $passwordTemporal,
        ]);
    }
}
```

### Paso 3 · Preguntas de comprensión

1. ¿Qué ventaja tiene delegar la creación en `AdministradorUsuarioService` en vez de hacerlo aquí?
2. ¿Qué respuesta se devuelve si `resetearPassword` no encuentra al usuario?
3. ¿Dónde podrías añadir un log o métrica adicional para auditar los listados?
4. ¿Qué cambios harías para exigir autenticación a todas estas rutas?

### Mini reto 4

- Valida que solo usuarios con rol `ROLE_ADMIN` puedan acceder (usa anotaciones `#[IsGranted('ROLE_ADMIN')]`).

---

## Trabajo guiado 4 · Colección Postman y comprobaciones

1. **Crea la colección** llamada “Onboarding DAW API” (base URL: `http://localhost:8000`).
2. Añade carpetas `Admin` (primero), `Tasks`, `Auth`.
3. En la carpeta `Admin`, crea dos peticiones para preparar datos:
   - `POST http://localhost:8000/api/admin/users` con body:

     ```json
     {
       "email": "demo@example.com",
       "password": "Secret123!",
       "nombre": "Usuario Demo"
     }
     ```

     Guarda la respuesta y anota el `id` del usuario creado (lo usaremos para las tareas).
     > Si recibes un error sobre `fecha_registro` nula, asegúrate de que tu entidad `Usuario` tenga en el constructor `__construct()` la línea `\$this->fechaRegistro = new \DateTimeImmutable();`.
   - `GET http://localhost:8000/api/admin/users?q=demo` para comprobar que aparece en la lista.
4. Dentro de `Tasks`, crea las peticiones usando el `usuarioId` que acabas de anotar:
   - `GET http://localhost:8000/api/tasks`. Debe aparece vacío.
   - `POST http://localhost:8000/api/tasks?usuarioId=ID_DEL_USUARIO` con body JSON:

     ```json
     {
       "titulo": "Primera tarea",
       "descripcion": "Texto opcional",
       "fechaLimite": "2024-06-30 15:00:00"
     }
     ```

   - `PUT http://localhost:8000/api/tasks/ID_DE_LA_TAREA?usuarioId=ID_DEL_USUARIO` con JSON similar.
   - `PATCH http://localhost:8000/api/tasks/ID_DE_LA_TAREA/status?usuarioId=ID_DEL_USUARIO` con:

     ```json
     { "estado": "en_progreso" }
     ```

   - `DELETE http://localhost:8000/api/tasks/ID_DE_LA_TAREA?usuarioId=ID_DEL_USUARIO`
5. Añade también `POST http://localhost:8000/api/admin/users/{id}/reset-password` para practicar la regeneración de contraseñas.
6. Documenta cada request (qué hace, campos obligatorios) y guarda capturas de las respuestas.
7. Verifica en DBeaver que los cambios se reflejan en las tablas `usuario` y `tarea`.

---

## Retos prácticos

1. **Mapa de rutas**  
   Ejecuta `php bin/console debug:router api` y localiza las rutas de `TaskController` y `Admin/UsuarioController`. Anota en tu cuaderno nombre, método HTTP y path; rellena la tabla de Postman usando esa información.

2. **Flujo de errores**  
   Simula qué pasa cuando `buscarPorEmailONombre` recibe `null`, una cadena vacía o un término largo. Explica en qué capa se corta el flujo y qué respuesta obtiene el cliente.

---

Consulta `03-controladores-servicios.solucion.md` después de implementar el reto.
