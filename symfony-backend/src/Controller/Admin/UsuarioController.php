<?php

namespace App\Controller\Admin;

use App\Entity\Usuario;
use App\Repository\UsuarioRepository;
use App\Service\AdministradorUsuarioService;
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
        $term = $request->query->get('q');
        $usuarios = $this->adminUsuarios->listar($term);

        $data = array_map(fn (Usuario $usuario) => $this->serializeUser($usuario), $usuarios);

        return $this->json($data);
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

        $passwordTemporal = $this->adminUsuarios->resetearPassword($usuario);

        return $this->json([
            'message' => 'Password reseteada correctamente',
            'passwordTemporal' => $passwordTemporal,
            'usuario' => $this->serializeUser($usuario),
        ]);
    }

    private function serializeUser(Usuario $usuario): array
    {
        return [
            'id' => $usuario->getId(),
            'nombre' => $usuario->getNombre(),
            'email' => $usuario->getEmail(),
            'roles' => $usuario->getRoles(),
            'fechaRegistro' => $usuario->getFechaRegistro()?->format('Y-m-d H:i:s'),
            'totalTareas' => count($usuario->getTareas()),
        ];
    }
}