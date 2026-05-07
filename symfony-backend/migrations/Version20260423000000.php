<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260423000000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Añade la columna fecha_actualizacion a la tabla tarea para ordenar por fecha de modificación/completado';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE tarea ADD fecha_actualizacion TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE tarea DROP fecha_actualizacion');
    }
}
