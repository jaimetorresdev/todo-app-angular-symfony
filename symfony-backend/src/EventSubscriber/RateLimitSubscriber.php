<?php

namespace App\EventSubscriber;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\RateLimiter\RateLimiterFactory;

class RateLimitSubscriber implements EventSubscriberInterface
{
    public function __construct(
        private readonly RateLimiterFactory $loginLimiter,
        private readonly RateLimiterFactory $registerLimiter,
    ) {}

    public static function getSubscribedEvents(): array
    {
        return [
            // Prioridad 10: se ejecuta antes que el firewall de seguridad
            KernelEvents::REQUEST => ['onKernelRequest', 10],
        ];
    }

    public function onKernelRequest(RequestEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $request = $event->getRequest();
        $path = $request->getPathInfo();
        $ip = $request->getClientIp() ?? 'unknown';

        $limiter = match (true) {
            $path === '/api/login' && $request->isMethod('POST')           => $this->loginLimiter->create($ip),
            $path === '/api/auth/register' && $request->isMethod('POST')   => $this->registerLimiter->create($ip),
            default                                                         => null,
        };

        if ($limiter === null) {
            return;
        }

        $limit = $limiter->consume();

        if (!$limit->isAccepted()) {
            $retryAfter = $limit->getRetryAfter()->getTimestamp() - time();

            $event->setResponse(new JsonResponse(
                ['message' => 'Demasiados intentos. Inténtalo de nuevo más tarde.'],
                JsonResponse::HTTP_TOO_MANY_REQUESTS,
                ['Retry-After' => max(0, $retryAfter)]
            ));
        }
    }
}
