# Solución · Ejercicio 03

Esta solución refleja el mismo flujo que trabajas en la guía: servicios delgados con lógica centralizada, controladores que sirven JSON y un uso explícito de `usuarioId` mientras no existe autenticación real.

---

## Servicio `TareaManager`

```php
// src/Service/TareaManager.php
namespace App\Service;

use App\Entity\Tarea;
use App\Entity\Usuario;
use App\Repository\TareaRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class TareaManager
{
    private const ESTADOS_VALIDOS = ['pendiente', 'en_progreso', 'completada'];

    public function __construct(
        private readonly TareaRepository $tareaRepository,
        private readonly EntityManagerInterface $entityManager
    ) {
    }

    public function listarPorUsuario(int $usuarioId, array $filtros = []): array
    {
        return $this->tareaRepository->buscarPorFiltros(
            $usuarioId,
            $filtros['estado'] ?? null,
            $filtros['texto'] ?? null
        );
    }

    public function crear(array $payload, Usuario $usuario): Tarea
    {
        $titulo = $payload['titulo'] ?? null;
        $estado = $payload['estado'] ?? 'pendiente';

        if (!$titulo) {
            throw new BadRequestHttpException('El título es obligatorio.');
        }

        if (!\in_array($estado, self::ESTADOS_VALIDOS, true)) {
            throw new BadRequestHttpException('Estado no válido.');
        }

        $tarea = (new Tarea())
            ->setTitulo($titulo)
            ->setDescripcion($payload['descripcion'] ?? null)
            ->setEstado($estado)
            ->setFechaCreacion(new \DateTimeImmutable())
            ->setFechaLimite(isset($payload['fechaLimite']) ? new \DateTime($payload['fechaLimite']) : null)
            ->setUsuario($usuario);

        $this->entityManager->persist($tarea);
        $this->entityManager->flush();

        return $tarea;
    }

    public function actualizar(Tarea $tarea, array $payload): Tarea
    {
        if (isset($payload['titulo']) && $payload['titulo'] === '') {
            throw new BadRequestHttpException('El título no puede quedar vacío.');
        }

        if (isset($payload['estado']) && !\in_array($payload['estado'], self::ESTADOS_VALIDOS, true)) {
            throw new BadRequestHttpException('Estado no válido.');
        }

        $tarea
            ->setTitulo($payload['titulo'] ?? $tarea->getTitulo())
            ->setDescripcion($payload['descripcion'] ?? $tarea->getDescripcion())
            ->setEstado($payload['estado'] ?? $tarea->getEstado())
            ->setFechaLimite(isset($payload['fechaLimite']) ? new \DateTime($payload['fechaLimite']) : $tarea->getFechaLimite());

        $this->entityManager->flush();

        return $tarea;
    }

    public function cambiarEstado(Tarea $tarea, string $estado): Tarea
    {
        if (!\in_array($estado, self::ESTADOS_VALIDOS, true)) {
            throw new BadRequestHttpException('Estado no válido.');
        }

        $tarea->setEstado($estado);
        $this->entityManager->flush();

        return $tarea;
    }

    public function eliminar(Tarea $tarea): void
    {
        $this->entityManager->remove($tarea);
        $this->entityManager->flush();
    }

    public function aseguraPerteneceAUsuario(?Tarea $tarea, int $usuarioId): Tarea
    {
        if (!$tarea || $tarea->getUsuario()?->getId() !== $usuarioId) {
            throw new NotFoundHttpException('Tarea no encontrada para este usuario.');
        }

        return $tarea;
    }
}
```

---

## Servicio `AdministradorUsuarioService`

```php
// src/Service/AdministradorUsuarioService.php
namespace App\Service;

use App\Entity\Usuario;
use App\Repository\UsuarioRepository;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class AdministradorUsuarioService
{
    public function __construct(
        private readonly UsuarioRepository $usuarioRepository,
        private readonly UserPasswordHasherInterface $passwordHasher,
        private readonly EntityManagerInterface $entityManager,
        private readonly LoggerInterface $logger
    ) {
    }

    public function listar(?string $busqueda = null): array
    {
        return $this->usuarioRepository->buscarPorEmailONombre($busqueda);
    }

    public function crear(array $payload): Usuario
    {
        $email = $payload['email'] ?? null;
        $password = $payload['password'] ?? null;

        if (!$email || !$password) {
            throw new BadRequestHttpException('Email y password son obligatorios.');
        }

        $usuario = (new Usuario())
            ->setEmail($email)
            ->setNombre($payload['nombre'] ?? 'Usuario sin nombre')
            ->setRoles($payload['roles'] ?? ['ROLE_USER']);

        $usuario->setPassword($this->passwordHasher->hashPassword($usuario, $password));

        $this->entityManager->persist($usuario);
        $this->entityManager->flush();

        $this->logger->info('Usuario creado por admin.', ['email' => $email]);

        return $usuario;
    }

    public function resetearPassword(Usuario $usuario): string
    {
        $passwordTemporal = bin2hex(random_bytes(4));

        $usuario->setPassword($this->passwordHasher->hashPassword($usuario, $passwordTemporal));
        $this->entityManager->flush();

        $this->logger->info('Password reseteada por admin.', ['usuarioId' => $usuario->getId()]);

        return $passwordTemporal;
    }
}
```

---

## Controladores de referencia

```php
// src/Controller/TaskController.php
#[Route('/api/tasks')]
class TaskController extends AbstractController
{
    public function __construct(
        private readonly TareaManager $tareaManager,
        private readonly TareaRepository $tareaRepository,
        private readonly EntityManagerInterface $entityManager
    ) {
    }

    #[Route('', name: 'api_tasks_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $usuario = $this->getUser();
        $usuarioId = $usuario?->getId() ?? $request->query->getInt('usuarioId', 1);

        $filtros = [
            'estado' => $request->query->get('estado'),
            'texto' => $request->query->get('q'),
        ];

        return $this->json($this->tareaManager->listarPorUsuario($usuarioId, $filtros));
    }

    #[Route('', name: 'api_tasks_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $usuario = $this->getUser();
        $usuarioId = $usuario?->getId()
            ?? $request->query->getInt('usuarioId', $request->request->getInt('usuarioId', 1));

        $payload = json_decode($request->getContent(), true) ?? [];
        $usuarioRef = $this->entityManager->getReference(Usuario::class, $usuarioId);
        $tarea = $this->tareaManager->crear($payload, $usuarioRef);

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
        $tarea = $this->tareaManager->actualizar($tarea, $payload);

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
        $tarea = $this->tareaManager->cambiarEstado($tarea, $payload['estado'] ?? '');

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

        $this->tareaManager->eliminar($tarea);

        return $this->json(null, JsonResponse::HTTP_NO_CONTENT);
    }
}
```

```php
// src/Controller/Admin/UsuarioController.php
#[Route('/api/admin/users')]
class UsuarioController extends AbstractController
{
    public function __construct(
        private readonly AdministradorUsuarioService $adminUsuarios,
        private readonly UsuarioRepository $usuarioRepository
    ) {
    }

    #[Route('', name: 'api_admin_users_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $usuarios = $this->adminUsuarios->listar($request->query->get('q'));

        return $this->json($usuarios);
    }

    #[Route('', name: 'api_admin_users_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $payload = json_decode($request->getContent(), true) ?? [];
        $usuario = $this->adminUsuarios->crear($payload);

        return $this->json($usuario, JsonResponse::HTTP_CREATED);
    }

    #[Route('/{id}/reset-password', name: 'api_admin_users_reset_password', methods: ['POST'])]
    public function resetPassword(int $id): JsonResponse
    {
        $usuario = $this->usuarioRepository->find($id);

        if (!$usuario) {
            return $this->json(['message' => 'Usuario no encontrado'], JsonResponse::HTTP_NOT_FOUND);
        }

        $passwordTemporal = $this->adminUsuarios->resetearPassword($usuario);

        return $this->json([
            'message' => 'Password reseteada correctamente',
            'passwordTemporal' => $passwordTemporal,
        ]);
    }
}
```

---

## Recordatorios clave

- Mientras no exista JWT, pasa `usuarioId` en la query string o en el body; los controladores ya lo aceptan.
- `Usuario::__construct()` debe inicializar `fechaRegistro` para evitar errores `NOT NULL`.
- Usa Postman para crear primero un usuario de prueba (`POST /api/admin/users`) y reutiliza su `id` en las peticiones de tareas.
- Todos los métodos de los servicios lanzan excepciones HTTP adecuadas (`BadRequestHttpException`, `NotFoundHttpException`) para que el controlador devuelva códigos consistentes (`400`, `404`, `201`, `204`).
