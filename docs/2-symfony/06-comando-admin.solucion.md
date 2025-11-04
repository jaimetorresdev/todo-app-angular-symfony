# Solución · Ejercicio 06

## Comando `app:create-admin`

```php
<?php
// src/Command/CreateAdminCommand.php

namespace App\Command;

use App\Entity\Usuario;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

#[AsCommand(
    name: 'app:create-admin',
    description: 'Crea un usuario administrador si no existe'
)]
class CreateAdminCommand extends Command
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private UserPasswordHasherInterface $passwordHasher,
        private string $defaultEmail = 'admin@tfg.local',
        private string $defaultPassword = 'admin123'
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $repo = $this->entityManager->getRepository(Usuario::class);

        $admin = $repo->findOneBy(['email' => $this->defaultEmail]);
        if ($admin) {
            $output->writeln(sprintf('El administrador %s ya existe.', $this->defaultEmail));

            return Command::SUCCESS;
        }

        $usuario = new Usuario();
        $usuario->setEmail($this->defaultEmail);
        $usuario->setRoles(['ROLE_ADMIN']);
        $usuario->setPassword(
            $this->passwordHasher->hashPassword($usuario, $this->defaultPassword)
        );

        $this->entityManager->persist($usuario);
        $this->entityManager->flush();

        $output->writeln(sprintf('Administrador %s creado correctamente.', $this->defaultEmail));

        return Command::SUCCESS;
    }
}
```

> Personaliza `$defaultEmail` y `$defaultPassword` con valores seguros. Para mayor flexibilidad, puedes leerlos de variables de entorno (`$_ENV['DEFAULT_ADMIN_EMAIL']`).

## EntryPoint de Docker

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


## Docker Compose (extracto)

```yaml
services:
  app:
    build: .
    entrypoint: ["/docker/entrypoint.sh"]
    depends_on:
      - db
  db:
    image: postgres:15
    environment:
      POSTGRES_USER: symfony
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: symfony_db
```

## Variaciones sugeridas

- **Parámetros opcionales**  
  Añade opciones al comando:
  ```php
  protected function configure(): void
  {
      $this
          ->addOption('email', null, InputOption::VALUE_OPTIONAL, 'Email del admin', $this->defaultEmail)
          ->addOption('password', null, InputOption::VALUE_OPTIONAL, 'Contraseña temporal', $this->defaultPassword)
          ->addOption('roles', null, InputOption::VALUE_OPTIONAL, 'Roles separados por coma', 'ROLE_ADMIN');
  }
  ```
  Dentro de `execute()` obtén las opciones y conviértelas según corresponda:
  ```php
  $email = (string) $input->getOption('email');
  $password = (string) $input->getOption('password');
  $roles = array_map('trim', explode(',', (string) $input->getOption('roles')));
  ```
  Usa `$roles` al asignar `setRoles($roles)` y reemplaza las referencias a `$this->defaultEmail` / `$this->defaultPassword` por las variables leídas.

  Para probarlo manualmente:
  ```bash
  php bin/console app:create-admin --email admin@demo.local --password Secret123! --roles "ROLE_ADMIN,ROLE_SUPER_ADMIN"
  ```
  Ajusta el texto en `--roles` para adaptar los perfiles que necesites.

- **Variables de entorno**  
  Lee las credenciales desde `.env` (por ejemplo `DEFAULT_ADMIN_EMAIL`, `DEFAULT_ADMIN_PASSWORD`) para cambiar las credenciales sin modificar el código.

## Evidencias a incluir en la tarea

- Captura de consola mostrando la ejecución del comando y los mensajes.
- Captura de DBeaver con el usuario administrador creado.
- Captura de los logs de Docker (si usas contenedores) donde se vea la secuencia del entrypoint.
- En el issue asociado, describe:
  - Email y rol del administrador creado.
  - Cómo cambiar la contraseña por defecto tras el arranque.
  - Qué problemas encontraste y cómo los resolviste.
