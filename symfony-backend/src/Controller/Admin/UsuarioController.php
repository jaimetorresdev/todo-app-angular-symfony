<?php

namespace App\Controller\Admin;

use App\Entity\Usuario;
use App\Repository\UsuarioRepository;
use App\Service\AdministradorUsuarioService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/admin/users')]
#[IsGranted('ROLE_ADMIN')]
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
        $term  = $request->query->get('q');
        $page  = max(1, $request->query->getInt('page', 1));
        $limit = min(50, max(1, $request->query->getInt('limit', 15)));

        $resultado = $this->adminUsuarios->listar($term, $page, $limit);

        $data = array_map(fn (Usuario $usuario) => $this->serializeUser($usuario), $resultado['items']);

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

    #[Route('', name: 'api_admin_users_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $payload = json_decode($request->getContent(), true) ?? [];
        $usuario = $this->adminUsuarios->crear($payload);

        return $this->json($this->serializeUser($usuario), JsonResponse::HTTP_CREATED);
    }

    #[Route('/{id}/reset-password', name: 'api_admin_users_reset_password', methods: ['POST'])]
    public function resetPassword(int $id): JsonResponse
    {
        $usuario = $this->usuarioRepository->find($id);

        if (!$usuario) {
            return $this->json(['message' => 'Usuario no encontrado'], JsonResponse::HTTP_NOT_FOUND);
        }

        $this->adminUsuarios->resetearPassword($usuario);

        return $this->json([
            'message' => 'Password reseteada correctamente. Se ha enviado al correo del usuario.',
            'usuario' => $this->serializeUser($usuario),
        ]);
    }

    #[Route('/{id}', name: 'api_admin_users_delete', methods: ['DELETE'])]
    public function delete(int $id, EntityManagerInterface $em): JsonResponse
    {
        $usuario = $this->usuarioRepository->find($id);

        if (!$usuario) {
            return $this->json(['message' => 'Usuario no encontrado'], JsonResponse::HTTP_NOT_FOUND);
        }

        // Seguridad: Evitar que el administrador se borre a sí mismo
        if ($usuario === $this->getUser()) {
            return $this->json(['message' => 'No puedes eliminar tu propia cuenta de administrador.'], JsonResponse::HTTP_BAD_REQUEST);
        }

        // Al tener cascade: ['remove'] en la entidad Usuario, 
        // Doctrine eliminará automáticamente sus tareas relacionadas.
        $em->remove($usuario);
        $em->flush();

        return $this->json(['message' => 'Usuario eliminado correctamente']);
    }

    private function serializeUser(Usuario $usuario): array
    {
        return [
            'id' => $usuario->getId(),
            'nombre' => $usuario->getNombre(),
            'email' => $usuario->getEmail(),
            'roles' => $usuario->getRoles(),
        ];
    }
}