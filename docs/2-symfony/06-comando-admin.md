# Ejercicio 06 · Comando para crear un administrador por defecto

## Objetivo

Crear un comando de consola que inserte un usuario administrador si no existe, integrarlo en el flujo de arranque (Docker o entorno local) y documentar el proceso con capturas. Con esto garantizas que cualquier compañero pueda iniciar el proyecto con credenciales administrativas mínimas.

## Ejercicios guiados

### Guía 1 · Generar el comando

1. Desde `symfony-backend`, ejecuta `php bin/console make:command app:create-admin`.  
   - Revisa la documentación oficial: <https://symfony.com/doc/current/console.html>.
2. Lanza el comando `php bin/console make:command app:create-admin` y verifica que se haya creado el archivo `src/Command/CreateAdminCommand.php` dentro de la carpeta `src/Command/`.

### Guía 2 · Implementar la lógica de creación

1. Inyecta dependencias y configura opciones del comando paso a paso:
   - Abre `src/Command/CreateAdminCommand.php` y reemplaza la cabecera por este bloque. Define el namespace, `use` necesarios e inyecta `EntityManagerInterface` y `UserPasswordHasherInterface`.

     ```php
     <?php

     namespace App\Command;

     use App\Entity\Usuario;
     use Doctrine\ORM\EntityManagerInterface;
     use Symfony\Component\Console\Attribute\AsCommand;
     use Symfony\Component\Console\Command\Command;
     use Symfony\Component\Console\Input\InputInterface;
     use Symfony\Component\Console\Input\InputOption;
     use Symfony\Component\Console\Output\OutputInterface;
     use Symfony\Component\Console\Style\SymfonyStyle;
     use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

     #[AsCommand(
         name: 'app:create-admin',
         description: 'Crea un usuario administrador por defecto si no existe.'
     )]
     final class CreateAdminCommand extends Command
     {
         public function __construct(
             private readonly EntityManagerInterface $entityManager,
             private readonly UserPasswordHasherInterface $passwordHasher
         ) {
             parent::__construct();
         }
     ```

   - Dentro de la clase, deja valores por defecto para email y contraseña (no se personalizarán desde la consola):

     ```php
         private const ADMIN_EMAIL = 'admin@example.com';
         private const ADMIN_PASSWORD = 'password123';
     ```

2. Implementa el método `execute()` con lógica de idempotencia y persistencia:
   - Pega este bloque debajo de `configure()`. Busca el usuario por email; si existe, muestra aviso y termina. Si no, crea la entidad, asigna roles, hashea la contraseña y guarda.

     ```php
         protected function execute(InputInterface $input, OutputInterface $output): int
         {
             $io = new SymfonyStyle($input, $output);

             $email = (string) $input->getOption('email');
             $passwordPlano = (string) $input->getOption('password');
             $nombre = (string) $input->getOption('nombre');

             $io->title('Creación de administrador por defecto');
             $io->text(sprintf('Email objetivo: %s', $email));

             $usuarioExistente = $this->entityManager
                 ->getRepository(Usuario::class)
                 ->findOneBy(['email' => $email]);

             if ($usuarioExistente) {
                 $io->warning('Ya existe un usuario con ese email. No se realizaron cambios.');
                 return Command::SUCCESS;
             }

             $usuario = (new Usuario())
                 ->setEmail($email)
                 ->setNombre($nombre)
                 ->setRoles(['ROLE_ADMIN', 'ROLE_USER']);

             $usuario->setPassword($this->passwordHasher->hashPassword($usuario, $passwordPlano));

             $this->entityManager->persist($usuario);
             $this->entityManager->flush();

             $io->success('Administrador creado correctamente. Cambia la contraseña al iniciar sesión.');

             return Command::SUCCESS;
         }
     }
     ```

3. Personaliza email, contraseña y roles a tu dominio:
   - Ajusta los valores por defecto en `configure()` (por ejemplo `admin@empresa.com`, contraseña temporal más robusta y nombre completo del equipo).

### Guía 3 · Probar el comando manualmente

1. Ejecuta `php bin/console app:create-admin` en local.
2. Verifica en DBeaver que se creó el registro en `usuarios` con los roles esperados.
3. Crea un usuario administrador distinto y vuelve a ejecutar el comando; debería indicar que ya existe.
4. Guarda capturas de la consola y de la tabla `usuarios`. Añade las capturas a la documentación de tu tarea (issue del curso).

### Guía 4 · Automatizar en el arranque (Docker)

Nuestro stack ya incluye `symfony-backend/docker/php/docker-entrypoint.sh`. Vamos a modificarlo para que, cada vez que el contenedor del backend arranque, ejecute las migraciones y el comando de creación del admin.

1. Abre `symfony-backend/docker/php/docker-entrypoint.sh` y deja el bloque así:
```bash
#!/bin/bash

set -e

APP_DIR="/var/www/app"

echo "STARTING APACHE"

if [ -d "$APP_DIR" ]; then
    cd "$APP_DIR"
    php bin/console doctrine:database:create --if-not-exists --no-interaction
    php bin/console doctrine:schema:update --force --no-interaction
    php bin/console app:create-admin || true
else
    echo "WARN: Application directory $APP_DIR not found. Skipping schema update and admin creation."
fi

exec "$@"
```
2. En `docker-compose.yml`, verifica que el servicio del backend use el entrypoint empaquetado (`docker-entrypoint.sh`). Si no, deja explícito:
   ```yaml
   services:
     backend:
       build:
         context: ./symfony-backend
       entrypoint: ["docker-entrypoint.sh"]
       depends_on:
         - db
   ```
3. Levanta los contenedores con `docker compose up --build`. En los logs deberías ver la actualización del esquema (`doctrine:schema:update`) y el mensaje de `app:create-admin`.


## Reto práctico

Modifica el comando para que acepte parámetros opcionales (`--email`, `--password`, `--roles`) y documenta cómo usarlo. Comprueba que los valores por defecto siguen funcionando. Compara tu implementación con `06-comando-admin.solucion.md`.

Consulta `06-comando-admin.solucion.md` solo después de terminar tu versión.
