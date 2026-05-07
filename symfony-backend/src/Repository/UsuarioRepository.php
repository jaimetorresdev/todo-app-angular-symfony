<?php

namespace App\Repository;

use App\Entity\Usuario;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Security\Core\Exception\UnsupportedUserException;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\PasswordUpgraderInterface;

/**
 * @extends ServiceEntityRepository<Usuario>
 */
class UsuarioRepository extends ServiceEntityRepository implements PasswordUpgraderInterface
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Usuario::class);
    }

    /**
     * Used to upgrade (rehash) the user's password automatically over time.
     */
    public function upgradePassword(PasswordAuthenticatedUserInterface $user, string $newHashedPassword): void
    {
        if (!$user instanceof Usuario) {
            throw new UnsupportedUserException(sprintf('Instances of "%s" are not supported.', $user::class));
        }

        $user->setPassword($newHashedPassword);
        $this->getEntityManager()->persist($user);
        $this->getEntityManager()->flush();
    }

    public function buscarPorEmailONombre(?string $term, int $limit = 15, int $offset = 0): array
    {
        $qb = $this->createQueryBuilder('u');

        if ($term) {
            $qb->andWhere('LOWER(u.email) LIKE :term OR LOWER(u.nombre) LIKE :term')
               ->setParameter('term', '%' . strtolower($term) . '%');
        }

        return $qb
            ->orderBy('u.nombre', 'ASC')
            ->setMaxResults($limit)
            ->setFirstResult($offset)
            ->getQuery()
            ->getResult();
    }

    public function countPorBusqueda(?string $term): int
    {
        $qb = $this->createQueryBuilder('u')->select('COUNT(u.id)');

        if ($term) {
            $qb->andWhere('LOWER(u.email) LIKE :term OR LOWER(u.nombre) LIKE :term')
               ->setParameter('term', '%' . strtolower($term) . '%');
        }

        return (int) $qb->getQuery()->getSingleScalarResult();
    }
}