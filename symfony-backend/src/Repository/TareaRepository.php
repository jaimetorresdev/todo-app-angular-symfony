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
 * Devuelve todas las tareas de un usuario ordenadas de la más reciente a la más antigua.
 *
 * @return Tarea[]
 */
    public function findByUsuarioOrdenadas(int $usuarioId): array
    {
        $qb = $this->createQueryBuilder('t');

        return $qb
        ->andWhere('t.usuario = :usuarioId')
        ->setParameter('usuarioId', $usuarioId)
        ->orderBy('t.fechaCreacion', 'DESC')
        ->getQuery()
        ->getResult();
    }
    
    /**
     * Busca tareas por usuario, estado y texto (título o descripción).
     */
    public function buscarPorFiltros(int $usuarioId, ?string $estado, ?string $texto): array
    {
        $qb = $this->createQueryBuilder('t')
            ->andWhere('t.usuario = :usuario')
            ->setParameter('usuario', $usuarioId);

        if ($estado) {
            $qb->andWhere('t.estado = :estado')
               ->setParameter('estado', $estado);
        }

        if ($texto) {
            $textoBusqueda = '%' . strtolower($texto) . '%';
            $qb->andWhere('LOWER(t.titulo) LIKE :texto OR LOWER(t.descripcion) LIKE :texto')
               ->setParameter('texto', $textoBusqueda);
        }

        return $qb->orderBy('t.fechaCreacion', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * RETO: Busca tareas pendientes cuya fecha límite esté dentro del intervalo indicado.
     * * @param int $usuarioId El ID del dueño de las tareas.
     * @param \DateInterval $intervalo Tiempo máximo (ej: "en las próximas 48h").
     * @return Tarea[]
     */
    public function findPendientesPorVencer(int $usuarioId, \DateInterval $intervalo): array
    {
        // 1. Calculamos el momento límite: "Ahora mismo" + el intervalo
        $limite = (new \DateTimeImmutable())->add($intervalo);

        // 2. Construimos la consulta con QueryBuilder
        return $this->createQueryBuilder('t')
            ->andWhere('t.usuario = :usuario')      // Que sea del usuario
            ->andWhere('t.estado = :estado')        // Que esté 'pendiente'
            ->andWhere('t.fechaLimite IS NOT NULL') // Que tenga una fecha límite puesta
            ->andWhere('t.fechaLimite <= :limite')  // Que venza ANTES del límite calculado
            ->setParameter('usuario', $usuarioId)
            ->setParameter('estado', 'pendiente')
            ->setParameter('limite', $limite)
            ->orderBy('t.fechaLimite', 'ASC')       // Ordenamos por la que venza antes
            ->getQuery()
            ->getResult();
    }

    //    /**
    //     * @return Tarea[] Returns an array of Tarea objects
    //     */
    //    public function findByExampleField($value): array
    //    {
    //        return $this->createQueryBuilder('t')
    //            ->andWhere('t.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->orderBy('t.id', 'ASC')
    //            ->setMaxResults(10)
    //            ->getQuery()
    //            ->getResult()
    //        ;
    //    }

    //    public function findOneBySomeField($value): ?Tarea
    //    {
    //        return $this->createQueryBuilder('t')
    //            ->andWhere('t.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->getQuery()
    //            ->getOneOrNullResult()
    //        ;
    //    }
}
