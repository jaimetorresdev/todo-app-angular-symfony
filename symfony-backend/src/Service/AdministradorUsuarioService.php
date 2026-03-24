<?php

namespace App\Service;

use App\Entity\Usuario;
use App\Repository\UsuarioRepository;
use App\Service\NotificacionUsuario;
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
        private readonly LoggerInterface $logger,
        private readonly NotificacionUsuario $notificacionUsuario
    ) {
    }

    /**
     * Devuelve usuarios filtrando por nombre o email si se indica.
     */
    public function listar(?string $busqueda = null): array
    {
        return $this->usuarioRepository->buscarPorEmailONombre($busqueda);
    }

    /**
     * Crea un usuario con los datos proporcionados.
     */
    public function crear(array $payload): Usuario
    {
        $email = $payload['email'] ?? null;
        $password = $payload['password'] ?? null;

        if (!$email || !$password) {
            throw new BadRequestHttpException('Email y password son obligatorios.');
        }

        $usuarioExistente = $this->usuarioRepository->findOneBy(['email' => $email]);
        if ($usuarioExistente) {
            throw new BadRequestHttpException('El email ya está registrado.');
        }

        $usuario = (new Usuario())
            ->setEmail($email)
            ->setNombre($payload['nombre'] ?? 'Usuario sin nombre')
            ->setRoles($payload['roles'] ?? ['ROLE_USER']);

        $usuario->setPassword($this->passwordHasher->hashPassword($usuario, $password));

        $this->entityManager->persist($usuario);
        $this->entityManager->flush();

        $this->logger->info('Usuario creado por admin.', ['email' => $email]);

        if (!$this->notificacionUsuario->enviarBienvenida($usuario)) {
            $this->logger->warning('No se pudo enviar la bienvenida al usuario creado.', [
                'usuarioId' => $usuario->getId(),
                'email' => $usuario->getEmail(),
            ]);
        }

        return $usuario;
    }

    /**
     * Genera una contraseña temporal y la guarda hasheada.
     */
    public function resetearPassword(Usuario $usuario): string
    {
        $passwordTemporal = bin2hex(random_bytes(4));
        $usuario->setPassword($this->passwordHasher->hashPassword($usuario, $passwordTemporal));

        $this->entityManager->flush();

        $this->logger->info('Password reseteada por admin.', ['usuarioId' => $usuario->getId()]);

        if (!$this->notificacionUsuario->enviarResetPassword($usuario, $passwordTemporal)) {
            $this->logger->warning('No se pudo enviar el correo de reset al usuario.', [
                'usuarioId' => $usuario->getId(),
                'email' => $usuario->getEmail(),
            ]);
        }

        return $passwordTemporal;
    }
}