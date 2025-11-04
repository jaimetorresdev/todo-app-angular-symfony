# Solución · Ejercicio 04

Asegúrate de que todos los archivos clave coinciden con los ejemplos siguientes. Si falta algo o cambia un valor (especialmente la passphrase), Lexik no podrá firmar el token JWT.

## 1. Variables de entorno y claves

```env
# .env (o .env.local)
JWT_SECRET_KEY=%kernel.project_dir%/config/jwt/private.pem
JWT_PUBLIC_KEY=%kernel.project_dir%/config/jwt/public.pem
JWT_PASSPHRASE=SuperSecreto123
```

Genera el par de claves con la misma passphrase y limpia la caché:

```bash
JWT_PASSPHRASE=SuperSecreto123 php bin/console lexik:jwt:generate-keypair
php bin/console cache:clear
```

Puedes verificar la clave privada con OpenSSL (opcional pero recomendable):

```bash
openssl rsa -in config/jwt/private.pem -passin pass:SuperSecreto123 -check
```

## 2. Controlador `AuthController`

```php
<?php

namespace App\Controller;

use App\Entity\Usuario;
use Doctrine\ORM\EntityManagerInterface;
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
        private readonly EntityManagerInterface $entityManager
    ) {
    }

    #[Route('/api/auth/register', name: 'api_auth_register', methods: ['POST'])]
    public function register(Request $request): JsonResponse
    {
        $payload = json_decode($request->getContent(), true) ?? [];

        if (!isset($payload['email'], $payload['password'])) {
            throw new BadRequestHttpException('Faltan campos obligatorios.');
        }

        $usuario = (new Usuario())
            ->setEmail($payload['email'])
            ->setNombre($payload['nombre'] ?? 'Nuevo usuario')
            ->setRoles($payload['roles'] ?? ['ROLE_USER']);

        $usuario->setPassword($this->passwordHasher->hashPassword($usuario, $payload['password']));

        $this->entityManager->persist($usuario);
        $this->entityManager->flush();

        return $this->json(['message' => 'Usuario registrado correctamente']);
    }

    #[Route('/api/login', name: 'api_auth_login', methods: ['POST'])]
    public function login(): void
    {
        // Este método no debería ejecutarse: el firewall "login" de Lexik responde antes.
        throw new \LogicException('El login JWT lo gestiona Lexik.');
    }

    #[Route('/api/me', name: 'api_auth_me', methods: ['GET'])]
    public function me(): JsonResponse
    {
        $usuario = $this->getUser();

        return $this->json([
            'id' => $usuario?->getId(),
            'email' => $usuario?->getUserIdentifier(),
            'roles' => $usuario?->getRoles(),
        ]);
    }
}
```

## 3. Configuración de seguridad (`config/packages/security.yaml`)

```yaml
security:
    password_hashers:
        Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface: 'auto'

    providers:
        app_user_provider:
            entity:
                class: App\Entity\Usuario
                property: email

    firewalls:
        dev:
            pattern: ^/(_(profiler|wdt)|css|images|js)/
            security: false
        login:
            pattern: ^/api/login
            stateless: true
            provider: app_user_provider
            json_login:
                check_path: api_auth_login
                username_path: email
                password_path: password
                success_handler: lexik_jwt_authentication.handler.authentication_success
                failure_handler: lexik_jwt_authentication.handler.authentication_failure
        api:
            pattern: ^/api
            stateless: true
            provider: app_user_provider
            jwt: ~

    access_control:
        - { path: ^/api/login, roles: PUBLIC_ACCESS }
        - { path: ^/api/auth/register, roles: PUBLIC_ACCESS }
        - { path: ^/api, roles: ROLE_USER }
```

## 4. Rutas (`config/routes.yaml`)

```yaml
controllers:
    resource:
        path: ../src/Controller/
        namespace: App\Controller
    type: attribute

api_auth_login:
    path: /api/login
```

## 5. Probar el flujo con `curl`

Registro de usuario:

```bash
curl -X POST \
     http://localhost:8000/api/auth/register \
     -H 'Content-Type: application/json' \
     -d '{"email":"alumno@example.com","password":"Secret123!","nombre":"Alumno Demo"}'
```

En Postman (carpeta **Auth** → `register`): método `POST`, URL `http://localhost:8000/api/auth/register`, body `raw` → `JSON` con el mismo payload.

Login y obtención del token JWT:

```bash
curl -X POST \
     http://localhost:8000/api/login \
     -H 'Content-Type: application/json' \
     -d '{"email":"alumno@example.com","password":"Secret123!"}'
```

Postman (`login`): método `POST`, URL `http://localhost:8000/api/login`, body `raw` → `JSON` con email y password. La respuesta debe incluir `token`.

Usar el token devuelto para consultar `/api/me`:

```bash
curl -X GET \
     http://localhost:8000/api/me \
     -H 'Authorization: Bearer <token-devuelto>'
```

Postman (`me`): método `GET`, URL `http://localhost:8000/api/me`, añade header `Authorization` con valor `Bearer <token-devuelto>`.

Si todas las respuestas coinciden, la configuración de JWT está completa.
