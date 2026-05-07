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
    // Ajustamos a 'en progreso' para que coincida exactamente con tu Angular
    private const ESTADOS_VALIDOS = ['pendiente', 'en progreso', 'completada'];
    private const PRIORIDADES_VALIDAS = ['baja', 'media', 'alta'];

    public function __construct(
        private readonly TareaRepository $tareaRepository,
        private readonly EntityManagerInterface $entityManager
    ) {
    }

    /**
     * Lista las tareas aplicando los filtros recibidos desde el Controlador.
     */
    public function listarPorUsuario(int $usuarioId, array $filtros = [], int $page = 1, int $limit = 10): array
    {
        $estado   = $filtros['estado'] ?? null;
        $texto    = $filtros['texto'] ?? null;
        $prioridad = $filtros['prioridad'] ?? null;
        $offset   = ($page - 1) * $limit;

        $items = $this->tareaRepository->buscarPorFiltros($usuarioId, $estado, $texto, $prioridad, $limit, $offset);
        $total = $this->tareaRepository->countPorFiltros($usuarioId, $estado, $texto, $prioridad);

        return [
            'items'      => $items,
            'total'      => $total,
            'page'       => $page,
            'limit'      => $limit,
            'totalPages' => $total > 0 ? (int) ceil($total / $limit) : 1,
        ];
    }

    public function listarPendientes(int $usuarioId): array
    {
        return $this->listarPorUsuario($usuarioId, ['estado' => 'pendiente']);
    }

    public function crear(array $payload, Usuario $usuario): Tarea
    {
        $titulo = $payload['titulo'] ?? null;
        $estado = $payload['estado'] ?? 'pendiente';
        $prioridad = $payload['prioridad'] ?? 'media';

        if (!$titulo) {
            throw new BadRequestHttpException('El título es obligatorio.');
        }

        if (!in_array($estado, self::ESTADOS_VALIDOS, true)) {
            throw new BadRequestHttpException('Estado no válido.');
        }

        if (!in_array($prioridad, self::PRIORIDADES_VALIDAS, true)) {
            throw new BadRequestHttpException('Prioridad no válida.');
        }

        // fechaCreacion ya se inicializa en el constructor de Tarea
        $fechaLimite = null;

        if (isset($payload['fechaLimite']) && $payload['fechaLimite'] !== null && $payload['fechaLimite'] !== '') {
            try {
                $fechaLimite = new \DateTime($payload['fechaLimite']);
            } catch (\Exception) {
                throw new BadRequestHttpException('La fecha límite no es válida.');
            }
        }

        $tarea = (new Tarea())
            ->setTitulo($titulo)
            ->setDescripcion($payload['descripcion'] ?? null)
            ->setEstado($estado)
            ->setPrioridad($prioridad)
            ->setFechaLimite($fechaLimite)
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

        if (isset($payload['estado']) && !in_array($payload['estado'], self::ESTADOS_VALIDOS, true)) {
            throw new BadRequestHttpException('Estado no válido.');
        }

        if (isset($payload['prioridad']) && !in_array($payload['prioridad'], self::PRIORIDADES_VALIDAS, true)) {
            throw new BadRequestHttpException('Prioridad no válida.');
        }

        $fechaLimite = $tarea->getFechaLimite();

        if (array_key_exists('fechaLimite', $payload)) {
            if ($payload['fechaLimite'] === null || $payload['fechaLimite'] === '') {
                $fechaLimite = null;
            } else {
                try {
                    $fechaLimite = new \DateTime($payload['fechaLimite']);
                } catch (\Exception) {
                    throw new BadRequestHttpException('La fecha límite no es válida.');
                }
            }
        }

        $tarea
            ->setTitulo($payload['titulo'] ?? $tarea->getTitulo())
            ->setDescripcion($payload['descripcion'] ?? $tarea->getDescripcion())
            ->setEstado($payload['estado'] ?? $tarea->getEstado())
            ->setPrioridad($payload['prioridad'] ?? $tarea->getPrioridad())
            ->setFechaLimite($fechaLimite)
            ->setFechaActualizacion(new \DateTime());

        $this->entityManager->flush();

        return $tarea;
    }

    public function cambiarEstado(Tarea $tarea, string $estado): Tarea
    {
        if (!in_array($estado, self::ESTADOS_VALIDOS, true)) {
            throw new BadRequestHttpException('Estado no válido.');
        }

        $tarea->setEstado($estado)->setFechaActualizacion(new \DateTime());
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