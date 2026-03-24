<?php

namespace App\Controller;

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
            'estado' => $request->query->get('estado'),
            'texto' => $request->query->get('q'),
        ];

        return $this->json($this->tareaManager->listarPorUsuario($usuarioId, $filtros));
    }

    #[Route('', name: 'api_tasks_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        /** @var Usuario|null $usuario */
        $usuario = $this->getUser();
        $usuarioId = $usuario?->getId() ?? $request->query->getInt('usuarioId', 1);

        $payload = json_decode($request->getContent(), true);
        
        // [RETO 3] Validación de JSON
        if (json_last_error() !== JSON_ERROR_NONE || null === $payload) {
            throw new BadRequestHttpException('Formato de datos inválido.');
        }

        $usuarioRef = $this->entityManager->getReference(Usuario::class, $usuarioId);
        $tarea = $this->tareaManager->crear($payload, $usuarioRef);

        return $this->json($tarea, JsonResponse::HTTP_CREATED);
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

        // [RETO 3] Mensaje de éxito personalizado
        return $this->json([
            'message' => 'Tarea actualizada con éxito',
            'data' => $tareaActualizada
        ]);
    }

    #[Route('/{id}/status', name: 'api_tasks_change_status', methods: ['PATCH'])]
    public function changeStatus(int $id, Request $request): JsonResponse
    {
        /** @var Usuario|null $usuario */
        $usuario = $this->getUser();
        $usuarioId = $usuario?->getId() ?? $request->query->getInt('usuarioId', 1);

        // Verificamos que la tarea exista y pertenezca al usuario
        $tarea = $this->tareaManager->aseguraPerteneceAUsuario(
            $this->tareaRepository->find($id),
            $usuarioId
        );

        $payload = json_decode($request->getContent(), true);

        // [RETO 3] Validación de JSON
        if (json_last_error() !== JSON_ERROR_NONE || null === $payload) {
            throw new BadRequestHttpException('JSON corrupto o mal formado.');
        }

        // Cambio de estado delegando en el servicio
        $tareaActualizada = $this->tareaManager->cambiarEstado($tarea, $payload['estado'] ?? '');

        return $this->json([
            'message' => 'Estado de la tarea actualizado',
            'data' => $tareaActualizada
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

        // [RETO 3] Respuesta limpia
        return $this->json(['message' => 'Tarea eliminada satisfactoriamente']);
    }
}