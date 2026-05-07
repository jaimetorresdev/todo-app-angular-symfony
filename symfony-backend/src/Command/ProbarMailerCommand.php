<?php

namespace App\Command;

use App\Entity\Usuario;
use App\Service\NotificacionUsuario;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:probar-mailer',
    description: 'Prueba el envío de correos de bienvenida y reset con un usuario ficticio.'
)]
class ProbarMailerCommand extends Command
{
    public function __construct(
        private readonly NotificacionUsuario $notificacionUsuario
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addOption(
            'dry-run',
            null,
            InputOption::VALUE_NONE,
            'Muestra la simulación sin enviar correos reales.'
        );
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $dryRun = (bool) $input->getOption('dry-run');

        $usuario = (new Usuario())
            ->setEmail('demo@example.com')
            ->setNombre('Usuario Demo')
            ->setRoles(['ROLE_USER']);

        $passwordTemporal = 'Demo1234';

        $io->title('Prueba de Symfony Mailer');
        $io->section('Datos del usuario ficticio');
        $io->listing([
            'Nombre: Usuario Demo',
            'Email: demo@example.com',
            'Password temporal de prueba: Demo1234',
        ]);

        if ($dryRun) {
            $io->warning('Modo dry-run activado: no se enviará ningún correo real.');
            $io->text('Se habrían ejecutado estas acciones:');
            $io->listing([
                'Enviar correo de bienvenida',
                'Enviar correo de reseteo de contraseña',
            ]);
            $io->success('Simulación completada correctamente.');

            return Command::SUCCESS;
        }

        $io->section('Enviando correo de bienvenida...');
        $bienvenidaEnviada = $this->notificacionUsuario->enviarBienvenida($usuario);

        if ($bienvenidaEnviada) {
            $io->success('Correo de bienvenida enviado correctamente.');
        } else {
            $io->error('No se pudo enviar el correo de bienvenida.');
        }

        $io->text('Esperando 11 segundos para evitar el límite de Mailtrap...');
        sleep(11);

        $io->section('Enviando correo de reseteo de contraseña...');
        $resetEnviado = $this->notificacionUsuario->enviarResetPassword($usuario, $passwordTemporal);

        if ($resetEnviado) {
            $io->success('Correo de reseteo enviado correctamente.');
        } else {
            $io->error('No se pudo enviar el correo de reseteo.');
        }

        $io->section('Comprobación manual');
        $io->text([
            'Abre Mailtrap y revisa la sandbox configurada en MAILER_DSN.',
            'Deberías ver dos mensajes:',
            '1. Bienvenido a To-Do App',
            '2. Instrucciones para restablecer tu contraseña',
        ]);

        $io->note('Si quieres mostrar la URL exacta del mensaje en Mailtrap, habría que consumir su API con un token personal y HttpClient.');

        return ($bienvenidaEnviada && $resetEnviado)
            ? Command::SUCCESS
            : Command::FAILURE;
    }
}