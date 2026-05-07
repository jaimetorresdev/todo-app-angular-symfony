<?php

namespace App\Controller;

use App\Entity\Usuario;
use App\Service\NotificacionUsuario;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Annotation\Route;

final class AuthController extends AbstractController
{
    public function __construct(
        private readonly UserPasswordHasherInterface $passwordHasher,
        private readonly EntityManagerInterface $entityManager,
        private readonly NotificacionUsuario $notificacionUsuario,
        private readonly LoggerInterface $logger
    ) {
    }

    #[Route('/api/auth/register', name: 'api_auth_register', methods: ['POST'])]
    public function register(Request $request): JsonResponse
    {
        $payload = json_decode($request->getContent(), true) ?? [];

        $email = $payload['email'] ?? null;
        $password = $payload['password'] ?? null;

        if (!$email || !$password) {
            throw new BadRequestHttpException('Faltan campos obligatorios.');
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new BadRequestHttpException('El formato del email no es válido.');
        }

        $usuarioExistente = $this->entityManager->getRepository(Usuario::class)->findOneBy(['email' => $email]);
        if ($usuarioExistente) {
            throw new BadRequestHttpException('El email ya está registrado.');
        }

        // Los roles se asignan siempre como ROLE_USER en el registro público,
        // ignorando cualquier valor que el cliente intente enviar.
        $usuario = (new Usuario())
            ->setEmail($email)
            ->setNombre($payload['nombre'] ?? 'Nuevo usuario')
            ->setRoles(['ROLE_USER']);

        $usuario->setPassword($this->passwordHasher->hashPassword($usuario, $password));

        $this->entityManager->persist($usuario);
        $this->entityManager->flush();

        try {
            if (!$this->notificacionUsuario->enviarBienvenida($usuario)) {
                $this->logger->warning('No se pudo enviar la bienvenida tras el registro.', [
                    'usuarioId' => $usuario->getId(),
                    'email' => $usuario->getEmail(),
                ]);
            }
        } catch (\Throwable $exception) {
            $this->logger->error('Fallo inesperado al enviar la bienvenida.', [
                'usuarioId' => $usuario->getId(),
                'exception' => $exception,
            ]);
        }

        return $this->json(['message' => 'Usuario registrado correctamente']);
    }

    #[Route('/api/login', name: 'api_auth_login', methods: ['POST'])]
    public function login(): void
    {
        throw new \LogicException('El login JWT lo gestiona Lexik.');
    }

    #[Route('/api/me', name: 'api_auth_me', methods: ['GET'])]
    public function me(): JsonResponse
    {
        /** @var Usuario|null $usuario */
        $usuario = $this->getUser();

        return $this->json($this->serializeUser($usuario));
    }

    #[Route('/api/me', name: 'api_auth_update_me', methods: ['PATCH'])]
    public function updateMe(Request $request): JsonResponse
    {
        /** @var Usuario|null $usuario */
        $usuario = $this->getUser();

        if (!$usuario instanceof Usuario) {
            return $this->json(['message' => 'Usuario no autenticado'], JsonResponse::HTTP_UNAUTHORIZED);
        }

        $payload = json_decode($request->getContent(), true) ?? [];

        if (array_key_exists('nombre', $payload)) {
            $nombre = trim((string) $payload['nombre']);

            if ($nombre === '') {
                throw new BadRequestHttpException('El nombre es obligatorio.');
            }

            $usuario->setNombre($nombre);
        }

        if (array_key_exists('email', $payload)) {
            $email = trim((string) $payload['email']);

            if ($email === '') {
                throw new BadRequestHttpException('El email es obligatorio.');
            }

            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                throw new BadRequestHttpException('El formato del email no es válido.');
            }

            $usuarioExistente = $this->entityManager->getRepository(Usuario::class)->findOneBy(['email' => $email]);
            if ($usuarioExistente && $usuarioExistente->getId() !== $usuario->getId()) {
                throw new BadRequestHttpException('El email ya está registrado.');
            }

            $usuario->setEmail($email);
        }

        $currentPassword = (string) ($payload['currentPassword'] ?? '');
        $newPassword = (string) ($payload['newPassword'] ?? '');

        if ($currentPassword !== '' && $newPassword === '') {
            throw new BadRequestHttpException('Debes indicar la nueva contraseña.');
        }

        if ($newPassword !== '') {
            if (strlen($newPassword) < 6) {
                throw new BadRequestHttpException('La nueva contraseña debe tener al menos 6 caracteres.');
            }

            if ($currentPassword === '') {
                throw new BadRequestHttpException('Debes indicar tu contraseña actual.');
            }

            if (!$this->passwordHasher->isPasswordValid($usuario, $currentPassword)) {
                throw new BadRequestHttpException('La contraseña actual no es correcta.');
            }

            $usuario->setPassword($this->passwordHasher->hashPassword($usuario, $newPassword));
        }

        $this->entityManager->flush();

        return $this->json([
            'message' => 'Perfil actualizado correctamente',
            'user' => $this->serializeUser($usuario),
        ]);
    }

    private function serializeUser(?Usuario $usuario): array
    {
        return [
            'id' => $usuario?->getId(),
            'nombre' => $usuario?->getNombre(),
            'email' => $usuario?->getUserIdentifier(),
            'roles' => $usuario?->getRoles() ?? [],
        ];
    }
}
