<?php

namespace App\Repository;

use App\Entity\Tarea;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Tarea>
 */
class TareaRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Tarea::class);
    }

    /**
     * Busca tareas por usuario, estado, texto (título o descripción) y prioridad, con paginación.
     *
     * @return Tarea[]
     */
    public function buscarPorFiltros(
        int $usuarioId,
        ?string $estado,
        ?string $texto,
        ?string $prioridad = null,
        int $limit = 10,
        int $offset = 0
    ): array {
        $qb = $this->createQueryBuilder('t')
            ->andWhere('t.usuario = :usuario')
            ->setParameter('usuario', $usuarioId);

        if ($estado) {
            $qb->andWhere('t.estado = :estado')
               ->setParameter('estado', $estado);
        }

        if ($prioridad) {
            $qb->andWhere('t.prioridad = :prioridad')
               ->setParameter('prioridad', $prioridad);
        }

        if ($texto) {
            $textoBusqueda = '%' . strtolower($texto) . '%';
            $qb->andWhere('LOWER(t.titulo) LIKE :texto OR LOWER(t.descripcion) LIKE :texto')
               ->setParameter('texto', $textoBusqueda);
        }

        return $qb->orderBy('t.fechaCreacion', 'DESC')
            ->setMaxResults($limit)
            ->setFirstResult($offset)
            ->getQuery()
            ->getResult();
    }

    /**
     * Cuenta el total de tareas que coinciden con los filtros (sin paginación).
     */
    public function countPorFiltros(int $usuarioId, ?string $estado, ?string $texto, ?string $prioridad = null): int
    {
        $qb = $this->createQueryBuilder('t')
            ->select('COUNT(t.id)')
            ->andWhere('t.usuario = :usuario')
            ->setParameter('usuario', $usuarioId);

        if ($estado) {
            $qb->andWhere('t.estado = :estado')
               ->setParameter('estado', $estado);
        }

        if ($prioridad) {
            $qb->andWhere('t.prioridad = :prioridad')
               ->setParameter('prioridad', $prioridad);
        }

        if ($texto) {
            $textoBusqueda = '%' . strtolower($texto) . '%';
            $qb->andWhere('LOWER(t.titulo) LIKE :texto OR LOWER(t.descripcion) LIKE :texto')
               ->setParameter('texto', $textoBusqueda);
        }

        return (int) $qb->getQuery()->getSingleScalarResult();
    }

    /**
     * Busca tareas pendientes cuya fecha límite esté dentro del intervalo indicado.
     * * @param int $usuarioId El ID del dueño de las tareas.
     * @param \DateInterval $intervalo Tiempo máximo (ej: "en las próximas 48h").
     * @return Tarea[]
     */
    public function findPendientesPorVencer(int $usuarioId, \DateInterval $intervalo): array
    {
        $limite = (new \DateTimeImmutable())->add($intervalo);

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