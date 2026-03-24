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

    /**
     * Mini Reto 1: Listar solo las pendientes
     */
    public function listarPendientes(int $usuarioId): array
    {
        return $this->listarPorUsuario($usuarioId, ['estado' => 'pendiente']);
    }

    public function crear(array $payload, Usuario $usuario): Tarea
    {
        $titulo = $payload['titulo'] ?? null;
        $estado = $payload['estado'] ?? 'pendiente';

        if (!$titulo) {
            throw new BadRequestHttpException('El título es obligatorio.');
        }

        if (!in_array($estado, self::ESTADOS_VALIDOS, true)) {
            throw new BadRequestHttpException('Estado no válido.');
        }

        $fechaCreacion = new \DateTimeImmutable();
        $fechaLimite = isset($payload['fechaLimite']) ? new \DateTime($payload['fechaLimite']) : null;

        // Mini Reto 1: Validación de fecha límite
        if ($fechaLimite && $fechaLimite < $fechaCreacion) {
            throw new BadRequestHttpException('La fecha límite no puede ser anterior a la creación.');
        }

        $tarea = (new Tarea())
            ->setTitulo($titulo)
            ->setDescripcion($payload['descripcion'] ?? null)
            ->setEstado($estado)
            ->setFechaCreacion($fechaCreacion)
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
        if (!in_array($estado, self::ESTADOS_VALIDOS, true)) {
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