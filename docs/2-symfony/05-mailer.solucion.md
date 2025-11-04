# Solución · Ejercicio 05

## Servicio de notificación (referencia)

```php
// src/Service/NotificacionUsuario.php
namespace App\Service;

use App\Entity\Usuario;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Address;
use Twig\Environment;
use Psr\Log\LoggerInterface;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;

class NotificacionUsuario
{
    public function __construct(
        private readonly MailerInterface $mailer,
        private readonly Environment $twig,
        private readonly LoggerInterface $logger,
        private readonly string $frontendUrl = 'http://localhost:4200'
    ) {}

    public function enviarBienvenida(Usuario $usuario): void
    {
        $this->enviar(
            to: $usuario->getEmail(),
            subject: '¡Bienvenido a la To-Do App!',
            template: 'emails/bienvenida.html.twig',
            context: [
                'usuario' => $usuario,
                'frontendUrl' => $this->frontendUrl,
            ]
        );
    }

    public function enviarResetPassword(Usuario $usuario, string $passwordTemporal): void
    {
        $this->enviar(
            to: $usuario->getEmail(),
            subject: 'Tu contraseña temporal',
            template: 'emails/reset_password.html.twig',
            context: [
                'usuario' => $usuario,
                'passwordTemporal' => $passwordTemporal,
                'frontendUrl' => $this->frontendUrl,
            ]
        );
    }

    private function enviar(string $to, string $subject, string $template, array $context): void
    {
        try {
            $correo = (new TemplatedEmail())
                ->from(new Address('no-reply@todo-app.local', 'To-Do App'))
                ->to(new Address($to))
                ->subject($subject)
                ->htmlTemplate($template)
                ->context($context);

            $this->mailer->send($correo);
        } catch (TransportExceptionInterface $exception) {
            $this->logger->error('No se pudo enviar el correo', [
                'to' => $to,
                'subject' => $subject,
                'error' => $exception->getMessage(),
            ]);
        }
    }
}
```

## Plantillas base

```twig
{# templates/emails/bienvenida.html.twig #}
<h1>¡Hola {{ usuario.nombre ?: usuario.email }}!</h1>
<p>Tu cuenta en la To-Do App ya está activa. Empieza añadiendo tus primeras tareas.</p>
<p>
  <a href="{{ frontendUrl }}/login" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;">
    Ir al panel
  </a>
</p>
```

```twig
{# templates/emails/reset_password.html.twig #}
<h1>Contraseña temporal</h1>
<p>Hola {{ usuario.nombre ?: usuario.email }}, un administrador reseteó tu contraseña.</p>
<p>Contraseña temporal: <strong>{{ passwordTemporal }}</strong></p>
<p>Inicia sesión y cámbiala desde tu perfil: <a href="{{ frontendUrl }}/login">Abrir aplicación</a></p>
<p>Si no solicitaste este cambio, avisa al equipo inmediatamente.</p>
```

## Integración en los servicios

- En el controlador de autenticación (`register`):
  ```php
  $usuario = $authService->registrar($payload);
  $notificacionUsuario->enviarBienvenida($usuario);
  ```
- En `AdministradorUsuarioService::resetearPassword()` devuelve la contraseña temporal y, en el controlador admin, invoca:
  ```php
  $passwordTemporal = $adminService->resetearPassword($usuario);
  $notificacionUsuario->enviarResetPassword($usuario, $passwordTemporal);
  ```
- Envuelve las llamadas en `try/catch` para evitar que un fallo de correo bloquee la operación principal.

## Manejo de errores

- Registra el error con `logger` y continúa el flujo; puedes mostrar un toast en Angular informando al usuario.
- Considera añadir reintentos con Messenger si necesitas tolerancia a fallos.
- Nunca envíes contraseñas definitivas ni enlaces largos sin expiración por correo.

## Test de envío (reto)

- Usa Mailtrap para validar las plantillas y compartir la URL en tu issue.
- Con Symfony CLI (`symfony open:local:webmail`) puedes simular correos localmente sin depender de Mailtrap.
- Comando de prueba (`app:probar-mailer`):

  > Symfony generará este comando dentro de `src/Command/`. Ese directorio agrupa las tareas de consola personalizadas del proyecto. En el siguiente ejercicio crearás otro comando para dar de alta un administrador por defecto, así que guarda en mente esta ubicación.

  ```php
  #[AsCommand(name: 'app:probar-mailer')]
  final class ProbarMailerCommand extends Command
  {
      public function __construct(
          private readonly NotificacionUsuario $notificacionUsuario
      ) {
          parent::__construct();
      }

      protected function configure(): void
      {
          $this
              ->addOption('dry-run', null, InputOption::VALUE_NONE, 'Muestra la salida sin enviar correos');
      }

      protected function execute(InputInterface $input, OutputInterface $output): int
      {
          $usuario = (new Usuario())
              ->setEmail('demo@example.com')
              ->setNombre('Usuario Demo')
              ->setRoles(['ROLE_USER']);

          if ($input->getOption('dry-run')) {
              $output->writeln('Dry-run: se generarían bienvenida y reset.');
              return Command::SUCCESS;
          }

          $bienvenida = $this->notificacionUsuario->enviarBienvenida($usuario);
          $reset = $this->notificacionUsuario->enviarResetPassword($usuario, 'Temp123!');

          $output->writeln(sprintf('Bienvenida: %s', $bienvenida ? 'OK' : 'FALLO'));
          $output->writeln(sprintf('Reset: %s', $reset ? 'OK' : 'FALLO'));
          $output->writeln('Revisa Mailtrap y copia la URL del mensaje para adjuntarla al informe.');

          return Command::SUCCESS;
      }
  }
  ```

- Cómo probarlo:
  1. `php bin/console app:probar-mailer --dry-run` muestra qué correos se enviarían sin contactar con Mailtrap.
  2. Para ver el correo en Mailtrap, `php bin/console app:probar-mailer` envía los mensajes reales (puedes personalizar email/nombre con `--email` y `--nombre`).
  3. Abre tu sandbox en Mailtrap y comprueba que los dos correos aparecen con el HTML esperado.
