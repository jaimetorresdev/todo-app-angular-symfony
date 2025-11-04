# Solución · Ejercicio 02

## Entidades de referencia

```php
// src/Entity/Usuario.php
#[ORM\Entity(repositoryClass: UsuarioRepository::class)]
class Usuario implements UserInterface, PasswordAuthenticatedUserInterface
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 150, unique: true)]
    private string $email = '';

    #[ORM\Column(type: 'json')]
    private array $roles = ['ROLE_USER'];

    #[ORM\Column]
    private string $password = '';

    #[ORM\Column(length: 120)]
    private string $nombre = '';

    #[ORM\Column(type: 'datetimetz_immutable')]
    private DateTimeImmutable $fechaRegistro;

    public function __construct()
    {
        $this->fechaRegistro = new DateTimeImmutable();
    }

    public function getUserIdentifier(): string
    {
        return $this->email;
    }

    public function getRoles(): array
    {
        $roles = $this->roles;
        $roles[] = 'ROLE_USER';

        return array_unique($roles);
    }

    // setters/getters restantes omitidos por brevedad
}
```

```php
// src/Entity/Tarea.php
#[ORM\Entity(repositoryClass: TareaRepository::class)]
class Tarea
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 180)]
    private string $titulo = '';

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $descripcion = null;

    #[ORM\Column(length: 20)]
    private string $estado = 'pendiente';

    #[ORM\Column(type: 'datetimetz_immutable')]
    private DateTimeImmutable $fechaCreacion;

    #[ORM\Column(type: 'datetimetz', nullable: true)]
    private ?DateTimeInterface $fechaLimite = null;

    #[ORM\ManyToOne(inversedBy: 'tareas')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private Usuario $usuario;

    public function __construct()
    {
        $this->fechaCreacion = new DateTimeImmutable();
    }

    public function marcarComoCompletada(): void
    {
        $this->estado = 'completada';
    }

    // setters/getters restantes omitidos por brevedad
}
```

## Métodos de repositorio

```php
// src/Repository/TareaRepository.php
class TareaRepository extends ServiceEntityRepository
{
    public function findByUsuarioOrdenadas(int $usuarioId): array
    {
        return $this->createQueryBuilder('t')
            ->andWhere('t.usuario = :usuario')
            ->setParameter('usuario', $usuarioId)
            ->orderBy('t.fechaCreacion', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function buscarPorFiltros(
        int $usuarioId,
        ?string $estado,
        ?string $texto
    ): array {
        $qb = $this->createQueryBuilder('t')
            ->andWhere('t.usuario = :usuario')
            ->setParameter('usuario', $usuarioId);

        if ($estado) {
            $qb->andWhere('t.estado = :estado')
               ->setParameter('estado', $estado);
        }

        if ($texto) {
            $texto = '%' . strtolower($texto) . '%';
            $qb->andWhere('LOWER(t.titulo) LIKE :texto OR LOWER(t.descripcion) LIKE :texto')
               ->setParameter('texto', $texto);
        }

        return $qb
            ->orderBy('t.fechaCreacion', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findPendientesPorVencer(int $usuarioId, DateInterval $intervalo): array
    {
        $limite = (new DateTimeImmutable())->add($intervalo);

        return $this->createQueryBuilder('t')
            ->andWhere('t.usuario = :usuario')
            ->andWhere('t.estado = :estado')
            ->andWhere('t.fechaLimite IS NOT NULL')
            ->andWhere('t.fechaLimite <= :limite')
            ->setParameter('usuario', $usuarioId)
            ->setParameter('estado', 'pendiente')
            ->setParameter('limite', $limite)
            ->orderBy('t.fechaLimite', 'ASC')
            ->getQuery()
            ->getResult();
    }
}
```

```php
// src/Repository/UsuarioRepository.php
class UsuarioRepository extends ServiceEntityRepository
{
    public function buscarPorEmailONombre(?string $term): array
    {
        $qb = $this->createQueryBuilder('u')
            ->orderBy('u.fechaRegistro', 'DESC');

        if ($term) {
            $term = '%' . strtolower($term) . '%';
            $qb->andWhere('LOWER(u.email) LIKE :term OR LOWER(u.nombre) LIKE :term')
               ->setParameter('term', $term);
        }

        return $qb->getQuery()->getResult();
    }

    public function contarTareasPorEstado(): array
    {
        return $this->createQueryBuilder('u')
            ->select('u.id', 'u.nombre', 't.estado', 'COUNT(t.id) AS total')
            ->leftJoin('u.tareas', 't')
            ->groupBy('u.id', 'u.nombre', 't.estado')
            ->getQuery()
            ->getArrayResult();
    }
}
```

## Puntos clave

- Mantén la lógica de filtrado en los repositorios para que los controladores/servicios solo se encarguen del flujo.
- Asegúrate de inicializar `fechaCreacion` en el constructor para evitar valores nulos.
- `contarTareasPorEstado()` devolverá filas con `t.estado = NULL` para usuarios sin tareas; manéjalo en el servicio/DTO.
- Comprueba el SQL resultante de cada método con `php bin/console debug:query` y valida los resultados en DBeaver.
