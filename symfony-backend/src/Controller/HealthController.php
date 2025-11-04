<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

final class HealthController extends AbstractController
{
    #[Route('/api/health', name: 'api_health', methods: ['GET'])]
    public function __invoke(): Response
    {
        // Renderizar el Twig generado por defecto ayuda a verificar el flujo completo MVC.
        return $this->render('health/index.html.twig', [
            'controller_name' => 'HealthController',
        ]);
    }
}
