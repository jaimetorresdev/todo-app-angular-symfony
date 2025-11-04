# Ejercicio 05 · Envío de correos con Symfony Mailer

## Objetivo

Configurar el Mailer de Symfony para enviar correos transaccionales cuando se registra un usuario o un administrador resetea una contraseña. Usaremos Mailtrap y plantillas Twig específicas de la To-Do App.

## Ejercicios guiados

### Guía 1 · Configurar el transporte

1. Ejecuta `composer require symfony/mailer` en el contenedor del backend y confirma que no hay errores.
2. En tu `.env`, define `MAILER_DSN` apuntando a un sandbox como Mailtrap.
   - Si nunca has usado Mailtrap: ve a <https://mailtrap.io>, crea una cuenta gratuita y entra al panel principal.
   - Durante el registro Mailtrap te pedirá un dominio de referencia; puedes escribir uno ficticio de tu proyecto como `todo-app.local` o `miempresa.test`, no necesita estar registrado.
   - En la pantalla principal, haz clic en el menú lateral **Sandboxes** y pulsa **Add Sandbox** (botón azul arriba a la derecha) para crear la bandeja de pruebas que necesitas, llama a tu sandbox como prefieras.
   - Dentro de la sandbox abre la pestaña **Integration**. Desplázate hasta la sección **Code Samples**, selecciona **PHP → Symfony 5+** y copia la línea que aparece, por ejemplo `MAILER_DSN="smtp://USUARIO:PASS@sandbox.smtp.mailtrap.io:2525"`.
   - Copia el valor completo que te muestran (incluye usuario, contraseña, host y puerto) sin dejar espacios y pégalo en tu `.env`.
   - Vuelve a levantar `symfony serve` o limpia la caché (`php bin/console cache:clear`) para asegurarte de que la nueva variable se cargue.
3. Ejecuta `php bin/console debug:config framework mailer` desde el contenedor del backend para verificar que Symfony lee la configuración correcta.
   - El resultado esperado debe mostrar `dsn: '%env(MAILER_DSN)%'`. Si ves otro valor o aparece vacío, revisa que el `.env` adecuado se esté cargando y que el contenedor use la misma variable de entorno.

### Guía 2 · Crear la notificación

1. Implementa `src/Service/NotificacionUsuario.php` paso a paso. Copia y pega cada bloque en el orden indicado, y deja un espacio entre bloques para que el archivo quede legible.
   - **Cabecera y declaración de la clase:** crea el archivo, pega este bloque completo y deja la llave abierta; define el namespace, las dependencias y las constantes con las rutas de las plantillas.

     ```php
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
     ```

   - **Constructor e inyección de dependencias:** pega este bloque dentro de la clase, justo después de las constantes. Inyecta el mailer, Twig, un logger opcional y define el remitente por defecto.

     ```php
         public function __construct(
             private readonly MailerInterface $mailer,
             private readonly Environment $twig,
             private readonly ?LoggerInterface $logger = null,
             private readonly string $fromEmail = 'tucorreoprueba@todo-app.local',
             private readonly string $fromName = 'To-Do App'
         ) {
         }
     ```

   - **Método `enviarBienvenida`:** añade este método debajo del constructor. Prepara el contexto con el usuario y delega en el método privado `enviarCorreo`.

     ```php
         public function enviarBienvenida(Usuario $usuario): bool
         {
             $context = [
                 'usuario' => $usuario,
             ];

             return $this->enviarCorreo(
                 usuario: $usuario,
                 asunto: 'Bienvenido a To-Do App',
                 template: self::TEMPLATE_BIENVENIDA,
                 contexto: $context
             );
         }
     ```

   - **Método `enviarResetPassword`:** pega este bloque después de `enviarBienvenida`. Añade la contraseña temporal al contexto antes de llamar al método privado.

     ```php
         public function enviarResetPassword(Usuario $usuario, string $passwordTemporal): bool
         {
             $context = [
                 'usuario' => $usuario,
                 'passwordTemporal' => $passwordTemporal,
             ];

             return $this->enviarCorreo(
                 usuario: $usuario,
                 asunto: 'Instrucciones para restablecer tu contraseña',
                 template: self::TEMPLATE_RESET_PASSWORD,
                 contexto: $context
             );
         }
     ```

   - **Método privado `enviarCorreo`:** copia este bloque al final de la clase. Renderiza la plantilla Twig, construye el correo, lo envía y registra el error si algo falla. Observa que las dos llaves de cierre (`}`) del final clausuran el método y la clase.

     ```php
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
                     'exception' => $exception,
                 ]);

                 return false;
             }
         }
     }
     ```

2. Crea las plantillas Twig en `templates/emails/`. Usa estos ejemplos como base y ajusta enlaces o estilos a tu proyecto. Cada bloque puede copiarse tal cual en un archivo `.twig`.

   - **Plantilla de bienvenida (`templates/emails/bienvenida.html.twig`):** muestra un saludo personalizado y un botón para ir al frontend.

     ```twig
     <!DOCTYPE html>
     <html lang="es">
       <head>
         <meta charset="UTF-8" />
         <title>Bienvenido a To-Do App</title>
         <style>
           body {
             font-family: Arial, sans-serif;
             background-color: #f5f7fa;
             margin: 0;
             padding: 0;
           }
           .container {
             background-color: #ffffff;
             padding: 24px;
             margin: 0 auto;
             max-width: 640px;
             border-radius: 8px;
             border: 1px solid #dde6f2;
           }
           .cta {
             display: inline-block;
             background-color: #2563eb;
             color: #ffffff !important;
             text-decoration: none;
             padding: 12px 20px;
             border-radius: 6px;
             margin-top: 20px;
           }
           p {
             color: #1f2937;
             line-height: 1.5;
           }
         </style>
       </head>
       <body>
         <div class="container">
           <h1>¡Hola {{ usuario.nombre }}!</h1>
           <p>
             Gracias por registrarte en To-Do App. A partir de ahora podrás organizar tus tareas
             y compartirlas con tu equipo sin complicaciones.
           </p>
           <p>
             Haz clic en el siguiente botón para acceder a tu panel e iniciar tu primera lista
             de tareas.
           </p>
           <a class="cta" href="{{ frontend_url|default('https://todo-app.local/login') }}">
             Ir a To-Do App
           </a>
           <p style="margin-top:24px;">
             Si no esperabas este correo, ignóralo. Puedes escribirnos respondiendo a este mensaje si
             necesitas ayuda.
           </p>
           <p style="margin-top:32px;color:#6b7280;">El equipo de To-Do App</p>
         </div>
       </body>
     </html>
     ```

   - **Plantilla de reset (`templates/emails/reset_password.html.twig`):** incluye la contraseña temporal y una llamada a la acción.

     ```twig
     <!DOCTYPE html>
     <html lang="es">
       <head>
         <meta charset="UTF-8" />
         <title>Restablece tu contraseña</title>
         <style>
           body {
             font-family: Arial, sans-serif;
             background-color: #f5f7fa;
             margin: 0;
             padding: 0;
           }
           .container {
             background-color: #ffffff;
             padding: 24px;
             margin: 0 auto;
             max-width: 640px;
             border-radius: 8px;
             border: 1px solid #dde6f2;
           }
           .cta {
             display: inline-block;
             background-color: #2563eb;
             color: #ffffff !important;
             text-decoration: none;
             padding: 12px 20px;
             border-radius: 6px;
             margin-top: 20px;
           }
           p {
             color: #1f2937;
             line-height: 1.5;
           }
           .code {
             display: inline-block;
             background-color: #1f2937;
             color: #f8fafc;
             padding: 8px 12px;
             border-radius: 6px;
             font-weight: bold;
             margin: 16px 0;
           }
         </style>
       </head>
       <body>
         <div class="container">
           <h1>Hola {{ usuario.nombre }}</h1>
           <p>
             Un administrador ha restablecido tu contraseña temporalmente. Utiliza el código de
             abajo para iniciar sesión y, por seguridad, recuerda cambiarla en cuanto entres en la
             aplicación.
           </p>
           <div class="code">{{ passwordTemporal }}</div>
           <p>
             Después de iniciar sesión, ve a tu perfil y define una contraseña que sólo tú conozcas.
             Si no solicitaste este cambio, contacta con soporte lo antes posible.
           </p>
           <a class="cta" href="{{ frontend_url|default('https://todo-app.local/login') }}">
             Ir a To-Do App
           </a>
           <p style="margin-top:24px;">
             ¿Tienes dudas? Responde a este correo y te ayudaremos.
           </p>
           <p style="margin-top:32px;color:#6b7280;">El equipo de To-Do App</p>
         </div>
       </body>
     </html>
     ```

   - Verifica que las variables (`{{ usuario.nombre }}`, `{{ passwordTemporal }}`, `{{ frontend_url }}`) coincidan con las que envías desde `NotificacionUsuario`.
   - **Importante:** por ahora sólo tenemos el backend, por eso los ejemplos apuntan a `https://todo-app.local/login`. Cuando tengas el frontend en Angular listo, actualiza las URLs para que apunten al dominio real de la aplicación.

### Guía 3 · Integrar con la lógica de negocio

1. Inyecta `NotificacionUsuario` en `AdministradorUsuarioService`.
   - Abre `src/Service/AdministradorUsuarioService.php`, añade la sentencia `use App\Service\NotificacionUsuario;` y reemplaza el constructor por este bloque que incluye el nuevo servicio:

     ```php
     public function __construct(
         private readonly UsuarioRepository $usuarioRepository,
         private readonly UserPasswordHasherInterface $passwordHasher,
         private readonly EntityManagerInterface $entityManager,
         private readonly LoggerInterface $logger,
         private readonly NotificacionUsuario $notificacionUsuario
     ) {
     }
     ```

   - Después de crear el usuario, pega este fragmento para disparar el correo de bienvenida y registrar un aviso si falla:

     ```php
     $this->logger->info('Usuario creado por admin.', ['email' => $email]);

     if (!$this->notificacionUsuario->enviarBienvenida($usuario)) {
         $this->logger->warning('No se pudo enviar la bienvenida al usuario creado.', [
             'usuarioId' => $usuario->getId(),
             'email' => $usuario->getEmail(),
         ]);
     }
     ```

   - En el método `resetearPassword`, pega este bloque después de guardar la nueva contraseña para avisar al usuario con la clave temporal:

     ```php
     $this->logger->info('Password reseteada por admin.', ['usuarioId' => $usuario->getId()]);

     if (!$this->notificacionUsuario->enviarResetPassword($usuario, $passwordTemporal)) {
         $this->logger->warning('No se pudo enviar el correo de reset al usuario.', [
             'usuarioId' => $usuario->getId(),
             'email' => $usuario->getEmail(),
         ]);
     }
     ```

2. Llama al servicio en `AuthController` tras el registro web.
   - Añade `use App\Service\NotificacionUsuario;` y `use Psr\Log\LoggerInterface;` en el encabezado del controlador.
   - Sustituye el constructor por el siguiente para recibir el servicio y el logger:

     ```php
     public function __construct(
         private readonly UserPasswordHasherInterface $passwordHasher,
         private readonly EntityManagerInterface $entityManager,
         private readonly NotificacionUsuario $notificacionUsuario,
         private readonly LoggerInterface $logger
     ) {}
     ```

   - Después de `flush()`, pega este bloque para enviar el correo y registrar cualquier problema sin interrumpir la API:

     ```php
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
     ```

3. Verifica el flujo extremo a extremo.
   - **Entrega inmediata durante el desarrollo:** si no quieres levantar un worker de Messenger, ve a `config/packages/messenger.yaml` y elimina (o comenta) la línea `Symfony\Component\Mailer\Messenger\SendEmailMessage: async`. Después ejecuta `php bin/console cache:clear`. De este modo, el mailer enviará los mensajes en el acto cuando llames a `NotificacionUsuario`.

   - Con Postman, lanza:
     - `POST /api/auth/register` con email y password para confirmar que llega el correo de bienvenida.
     - `POST /api/admin/users/{id}/reset-password` (cambia `{id}` por un usuario real) y revisa la bandeja de Mailtrap para comprobar el correo con la contraseña temporal.
     - Si expones el reset público (por ejemplo, `POST /api/admin/users/{id}/reset-password` sin autenticación de admin), recuerda añadir en `config/packages/security.yaml` una regla de `access_control` como `- { path: ^/api/admin/users/\d+/reset-password, roles: PUBLIC_ACCESS }`.
   - Comprueba los logs (ej. `docker compose logs backend`) si quieres validar que las advertencias y errores se registran correctamente cuando falla el envío.
   - Revisa en Mailtrap que el HTML, los enlaces y la información del correo sean correctos antes de dar por finalizada la integración.

## Reto práctico opcional

Crea un comando `php bin/console app:probar-mailer` que construya un usuario ficticio, dispare los dos correos (bienvenida y reset) y muestre por consola la URL del correo en Mailtrap. Compara tu solución con `05-mailer.solucion.md` para asegurarte de que cubres buenas prácticas.
1. Genera el comando con `php bin/console make:command` y guarda la referencia a `NotificacionUsuario` mediante inyección en el constructor.
2. Dentro de `execute`, crea un usuario ficticio (puedes reutilizar una fábrica o instanciarlo directamente) y llama a ambos métodos del servicio.
3. Muestra por consola si el envío se produjo correctamente y cómo acceder al mensaje en Mailtrap. Si quieres la URL exacta, consume la API de Mailtrap con un token personal y la clase `HttpClient`.
4. Añade una opción `--dry-run` para omitir el envío real cuando estés en local sin Mailtrap disponible.
5. Ejecuta `php bin/console app:probar-mailer` para probar envíos reales o `php bin/console app:probar-mailer --dry-run` si solo quieres verificar la configuración sin contactar con Mailtrap.

Consulta `05-mailer.solucion.md` solo después de completar el reto.
