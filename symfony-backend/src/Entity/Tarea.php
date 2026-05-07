<?php

namespace App\Entity;

use App\Repository\TareaRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: TareaRepository::class)]
class Tarea
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 180)]
    private ?string $titulo = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $descripcion = null;

    #[ORM\Column(length: 20)]
    private ?string $estado = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $fechaCreacion = null;

    #[ORM\Column(nullable: true)]
    private ?\DateTime $fechaLimite = null;

    #[ORM\Column(length: 10)]
    private ?string $prioridad = 'media';

    #[ORM\Column(nullable: true)]
    private ?\DateTime $fechaActualizacion = null;

    #[ORM\ManyToOne(inversedBy: 'tareas')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    // Normalmente el usuario no se envía en task:read para evitar bucles infinitos
    private ?Usuario $usuario = null;

    public function __construct()
    {
        $this->fechaCreacion = new \DateTimeImmutable();
        $this->prioridad = 'media';
    }

    // ... (El resto de getters y setters se mantienen igual)

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getTitulo(): ?string
    {
        return $this->titulo;
    }

    public function setTitulo(string $titulo): static
    {
        $this->titulo = $titulo;

        return $this;
    }

    public function getDescripcion(): ?string
    {
        return $this->descripcion;
    }

    public function setDescripcion(?string $descripcion): static
    {
        $this->descripcion = $descripcion;

        return $this;
    }

    public function getEstado(): ?string
    {
        return $this->estado;
    }

    public function setEstado(string $estado): static
    {
        $this->estado = $estado;

        return $this;
    }

    public function getFechaCreacion(): ?\DateTimeImmutable
    {
        return $this->fechaCreacion;
    }

    public function setFechaCreacion(\DateTimeImmutable $fechaCreacion): static
    {
        $this->fechaCreacion = $fechaCreacion;

        return $this;
    }

    public function getFechaLimite(): ?\DateTime
    {
        return $this->fechaLimite;
    }

    public function setFechaLimite(?\DateTime $fechaLimite): static
    {
        $this->fechaLimite = $fechaLimite;

        return $this;
    }

    public function getPrioridad(): ?string
    {
        return $this->prioridad;
    }

    public function setPrioridad(string $prioridad): static
    {
        $this->prioridad = $prioridad;

        return $this;
    }

    public function getFechaActualizacion(): ?\DateTime
    {
        return $this->fechaActualizacion;
    }

    public function setFechaActualizacion(?\DateTime $fechaActualizacion): static
    {
        $this->fechaActualizacion = $fechaActualizacion;

        return $this;
    }

    public function getUsuario(): ?Usuario
    {
        return $this->usuario;
    }

    public function setUsuario(?Usuario $usuario): self
    {
        $this->usuario = $usuario;

        return $this;
    }
}