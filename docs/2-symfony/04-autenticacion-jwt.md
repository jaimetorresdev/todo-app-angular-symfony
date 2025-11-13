# Ejercicio 04 · Autenticación JWT con Lexik

## Objetivo

Configurar LexikJWTAuthenticationBundle para permitir registro y login de usuarios, emitiendo tokens JWT que protejan los endpoints `/api`.

## Ejercicios guiados

### Guía 1 · Instalar y generar claves

1. Ejecuta dentro del contenedor de backend `composer require lexik/jwt-authentication-bundle`.
2. Corre `php bin/console lexik:jwt:generate-keypair` y confirma que se crean `config/jwt/private.pem` y `public.pem`.
3. Añade `JWT_PASSPHRASE` a tu `.env`.
4. Asegúrate de que `.env` y los archivos `config/jwt/*.pem` NO estén ignorados en `.gitignore` ESTO ES IMPORTANTE, asegurate que los archivos pem se encuentran dentro del lista de archivos que cambian en la sección de Source Control de Visual Studio Code.

### Guía 2 · Reutilizar la entidad `Usuario`

1. No generes una entidad nueva: usa la misma `App\Entity\Usuario` creada en el ejercicio 02 (ya tiene `UserInterface` y `PasswordAuthenticatedUserInterface` implementados).
2. Comprueba solo que el constructor siga inicializando `fechaRegistro` y que los getters/setters estén al día.

### Guía 3 · Configurar firewalls y endpoints

1. Revisa `config/packages/security.yaml`: el esqueleto ya trae el provider `app_user_provider` y el firewall `api` marcado como `stateless`. No necesitas añadir más firewalls, solo asegurarte de que existen.

2. En `access_control`, deja explícito que `/api/login` y `/api/auth/register` son públicos:

   ```yaml
   access_control:
       - { path: ^/api/login, roles: PUBLIC_ACCESS }
       - { path: ^/api/auth/register, roles: PUBLIC_ACCESS }
       - { path: ^/api, roles: ROLE_USER }
   ```

3. Genera el controlador (`php bin/console make:controller AuthController`) y reemplaza su contenido por este código completo:

   ```php
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
           throw new \LogicException('La autenticación JWT la gestiona Lexik.');
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


### Guía 4 · Probar con Postman y validar en DBeaver

1. En Postman crea peticiones para:
   - `POST http://localhost:8000/api/auth/register` con body JSON:

     ```json
     {
       "email": "alumno@example.com",
       "password": "Secret123!",
       "nombre": "Alumno Demo",
       "roles": ["ROLE_USER"]
     }
     ```

   - `POST http://localhost:8000/api/login` con el mismo cuerpo (email y password). Si aún no activaste JWT, verás el mensaje de éxito sin token; después del paso extra recibirás el `token`.
   - Guarda la respuesta de `login` (campo `token`) y úsala en `GET http://localhost:8000/api/me` añadiendo el header `Authorization: Bearer <token>`.
2. Después del registro, refresca DBeaver y verifica que el usuario aparece en la tabla `usuarios` con el rol esperado.
3. Guarda la colección de postman.

### Paso extra · Activar el login JWT de Lexik

1. Instala el bundle si aún no lo hiciste: `composer require lexik/jwt-authentication-bundle`.
2. Genera las claves indicando la passphrase en el mismo comando:

   ```bash
   JWT_PASSPHRASE=SuperSecreto123 php bin/console lexik:jwt:generate-keypair
   ```

   Se crearán `config/jwt/private.pem` y `config/jwt/public.pem` usando esa passphrase.
3. Abre `.env` y rellena la variable: `JWT_PASSPHRASE=SuperSecreto123`.
   Después ejecuta `php bin/console cache:clear` para que Symfony cargue el valor actualizado.
4. Comprueba la clave privada con OpenSSL:

   ```bash
   openssl rsa -in config/jwt/private.pem -passin pass:SuperSecreto123 -check
   ```

   Si ves `RSA key ok`, la passphrase coincide y puedes continuar.
5. Abre `src/Controller/AuthController.php` y deja el método `login` así:

   ```php
   #[Route('/api/login', name: 'api_auth_login', methods: ['POST'])]
   public function login(): void
   {
       // Este método nunca debería ejecutarse. El firewall "login"
       // intercepta la petición y Lexik devuelve el JWT automáticamente.
       throw new \LogicException('El login JWT lo gestiona Lexik.');
   }
   ```

   El `throw` funciona como recordatorio: si ves esta excepción, significa que el firewall no está configurado correctamente.
6. Actualiza `config/packages/security.yaml` con los dos firewalls:

   ```yaml
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
   ```

7. En el mismo archivo, deja explícito el acceso público:

   ```yaml
   access_control:
       - { path: ^/api/login, roles: PUBLIC_ACCESS }
       - { path: ^/api/auth/register, roles: PUBLIC_ACCESS }
       - { path: ^/api, roles: ROLE_USER }
   ```
8. Declara la ruta en `config/routes.yaml`. Deja el bloque que ya existe para los controladores por atributos y añade debajo la ruta explícita para el login:

```yaml
controllers:
    resource:
        path: ../src/Controller/
        namespace: App\Controller
    type: attribute

api_auth_login:
    path: /api/login
```

9. Prueba la autenticación desde tu terminal:

```bash
   curl -X POST \
        http://localhost:8000/api/login \
        -H 'Content-Type: application/json' \
        -d '{"email":"alumno@example.com","password":"Secret123!"}'
```

   La respuesta JSON incluye el campo `token`. Guárdalo para usarlo en `Authorization: Bearer <token>` al llamar a `/api/me`.

   Ahora puedes probar a hacer la request desde Postman y ver cómo te devuelve un token al iniciar sesión con las credenciales de alumno que ya hemos registrado.

Consulta `04-autenticacion-jwt.solucion.md` al finalizar el reto.
