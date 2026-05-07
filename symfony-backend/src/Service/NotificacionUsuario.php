<?php

namespace App\Service;

use App\Entity\Usuario;
use Psr\Log\LoggerInterface;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\Email;
use Twig\Environment;

class NotificacionUsuario
{
    private const TEMPLATE_BIENVENIDA = 'emails/bienvenida.html.twig';
    private const TEMPLATE_RESET_PASSWORD = 'emails/reset_password.html.twig';

    public function __construct(
        private readonly MailerInterface $mailer,
        private readonly Environment $twig,
        private readonly ?LoggerInterface $logger = null,
        private readonly string $fromEmail = 'tucorreoprueba@todo-app.local',
        private readonly string $fromName = 'To-Do App'
    ) {
    }

    public function enviarBienvenida(Usuario $usuario): bool
    {
        return $this->enviarCorreo(
            usuario: $usuario,
            asunto: 'Bienvenido a To-Do App · Tu cuenta ya está lista',
            template: self::TEMPLATE_BIENVENIDA,
            contexto: $this->buildBaseContext($usuario)
        );
    }

    public function enviarResetPassword(Usuario $usuario, string $passwordTemporal): bool
    {
        return $this->enviarCorreo(
            usuario: $usuario,
            asunto: 'To-Do App · Restablecimiento de contraseña',
            template: self::TEMPLATE_RESET_PASSWORD,
            contexto: array_merge(
                $this->buildBaseContext($usuario),
                [
                    'passwordTemporal' => $passwordTemporal,
                ]
            )
        );
    }

    private function buildBaseContext(Usuario $usuario): array
    {
        return [
            'usuario' => $usuario,
            'appName' => 'To-Do App',
            'supportEmail' => $this->fromEmail,
            'year' => (int) date('Y'),
            'theme' => [
                'primary' => '#2563eb',
                'primaryDark' => '#1d4ed8',
                'accent' => '#0f172a',
                'bg' => '#f8fafc',
                'panel' => '#ffffff',
                'text' => '#0f172a',
                'muted' => '#475569',
                'border' => '#e2e8f0',
            ],
        ];
    }

    private function enviarCorreo(
        Usuario $usuario,
        string $asunto,
        string $template,
        array $contexto
    ): bool {
        $to = new Address(
            address: (string) $usuario->getEmail(),
            name: $usuario->getNombre() ?? ''
        );

        try {
            $html = $this->twig->render($template, $contexto);

            $email = (new Email())
                ->from(new Address($this->fromEmail, $this->fromName))
                ->to($to)
                ->subject($asunto)
                ->html($html);

            $this->mailer->send($email);

            return true;
        } catch (TransportExceptionInterface|\Throwable $exception) {
            $this->logger?->error('No se pudo enviar el correo al usuario.', [
                'usuarioId' => $usuario->getId(),
                'email' => $usuario->getEmail(),
                'template' => $template,
                'exceptionMessage' => $exception->getMessage(),
            ]);

            return false;
        }
    }
}