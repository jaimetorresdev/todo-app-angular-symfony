<?php

namespace App\Controller;

use App\Entity\Tarea;
use App\Entity\Usuario;
use App\Repository\TareaRepository;
use App\Service\TareaManager;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

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
        /** @var Usuario|null $usuario */
        $usuario = $this->getUser();
        $usuarioId = $usuario?->getId() ?? $request->query->getInt('usuarioId', 1);

        $filtros = [
            'estado'   => $request->query->get('estado'),
            'texto'    => $request->query->get('q'),
            'prioridad' => $request->query->get('prioridad'),
        ];

        $page  = max(1, $request->query->getInt('page', 1));
        $limit = min(50, max(1, $request->query->getInt('limit', 10)));

        $resultado = $this->tareaManager->listarPorUsuario($usuarioId, $filtros, $page, $limit);

        $data = array_map(fn (Tarea $tarea) => $this->serializeTask($tarea), $resultado['items']);

        return $this->json([
            'data' => $data,
            'meta' => [
                'total'      => $resultado['total'],
                'page'       => $resultado['page'],
                'limit'      => $resultado['limit'],
                'totalPages' => $resultado['totalPages'],
            ],
        ]);
    }

    #[Route('', name: 'api_tasks_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        /** @var Usuario|null $usuario */
        $usuario = $this->getUser();
        $usuarioId = $usuario?->getId() ?? $request->query->getInt('usuarioId', 1);

        $payload = json_decode($request->getContent(), true);

        if (json_last_error() !== JSON_ERROR_NONE || null === $payload) {
            throw new BadRequestHttpException('Formato de datos inválido.');
        }

        $usuarioRef = $this->entityManager->getReference(Usuario::class, $usuarioId);
        $tarea = $this->tareaManager->crear($payload, $usuarioRef);

        return $this->json($this->serializeTask($tarea), JsonResponse::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'api_tasks_update', methods: ['PUT'])]
    public function update(int $id, Request $request): JsonResponse
    {
        /** @var Usuario|null $usuario */
        $usuario = $this->getUser();
        $usuarioId = $usuario?->getId() ?? $request->query->getInt('usuarioId', 1);

        $tarea = $this->tareaManager->aseguraPerteneceAUsuario(
            $this->tareaRepository->find($id),
            $usuarioId
        );

        $payload = json_decode($request->getContent(), true) ?? [];
        $tareaActualizada = $this->tareaManager->actualizar($tarea, $payload);

        return $this->json([
            'message' => 'Tarea actualizada con éxito',
            'data' => $this->serializeTask($tareaActualizada),
        ]);
    }

    #[Route('/{id}/status', name: 'api_tasks_change_status', methods: ['PATCH'])]
    public function changeStatus(int $id, Request $request): JsonResponse
    {
        /** @var Usuario|null $usuario */
        $usuario = $this->getUser();
        $usuarioId = $usuario?->getId() ?? $request->query->getInt('usuarioId', 1);

        $tarea = $this->tareaManager->aseguraPerteneceAUsuario(
            $this->tareaRepository->find($id),
            $usuarioId
        );

        $payload = json_decode($request->getContent(), true);

        if (json_last_error() !== JSON_ERROR_NONE || null === $payload) {
            throw new BadRequestHttpException('JSON corrupto o mal formado.');
        }

        $tareaActualizada = $this->tareaManager->cambiarEstado($tarea, $payload['estado'] ?? '');

        return $this->json([
            'message' => 'Estado de la tarea actualizado',
            'data' => $this->serializeTask($tareaActualizada),
        ]);
    }

    #[Route('/{id}', name: 'api_tasks_delete', methods: ['DELETE'])]
    public function delete(int $id, Request $request): JsonResponse
    {
        /** @var Usuario|null $usuario */
        $usuario = $this->getUser();
        $usuarioId = $usuario?->getId() ?? $request->query->getInt('usuarioId', 1);

        $tarea = $this->tareaManager->aseguraPerteneceAUsuario(
            $this->tareaRepository->find($id),
            $usuarioId
        );

        $this->tareaManager->eliminar($tarea);

        return $this->json(['message' => 'Tarea eliminada satisfactoriamente']);
    }

    /**
     * Helper para transformar la entidad Tarea en un array estructurado para el Frontend.
     */
    private function serializeTask(Tarea $tarea): array
    {
        return [
            'id' => $tarea->getId(),
            'titulo' => $tarea->getTitulo(),
            'descripcion' => $tarea->getDescripcion(),
            'estado' => $tarea->getEstado(),
            'prioridad' => $tarea->getPrioridad(),
            'fechaCreacion' => $tarea->getFechaCreacion()?->format('Y-m-d H:i:s'),
            'fechaActualizacion' => $tarea->getFechaActualizacion()?->format('Y-m-d H:i:s'),
            'fechaLimite' => $tarea->getFechaLimite()?->format('Y-m-d'),
            'usuario' => $tarea->getUsuario() ? [
                'id' => $tarea->getUsuario()->getId(),
                'nombre' => $tarea->getUsuario()->getNombre(),
                'email' => $tarea->getUsuario()->getEmail(),
            ] : null,
        ];
    }
}