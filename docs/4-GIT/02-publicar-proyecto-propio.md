# Ejercicio extra (opcional) · Publica tu proyecto

## Objetivo

Hacer tuyo el proyecto: crear un repositorio personal en GitLab o GitHub y subir el código. Este repositorio puede servirte como base para tu TFG o portfolio.

## Pasos

1) Crear el repositorio remoto
- GitLab: crea un proyecto vacío (sin README) desde tu espacio personal.
- GitHub: crea un repo vacío (público o privado) sin inicializar con README.
- Copia la URL SSH o HTTPS del remoto (ej.: `git@gitlab.com:usuario/mi-proyecto.git`).

2) Preparar el repo local
- Asegúrate de que todo está committeado: `git status` debe estar limpio.
- Opcional: borra el remoto actual si apunta a otro origen:
  - `git remote -v` para ver remotos.
  - `git remote remove origin` para quitarlo.

3) Añadir tu remoto y empujar ramas
- Añade tu remoto: `git remote add origin <URL>`
- Sube `main`: `git push -u origin main`
- Sube ramas activas si quieres mantenerlas: `git push origin feature/lo-que-sea`

4) Ajustar la rama por defecto (si procede)
- En GitLab/GitHub, ve a Settings → Branches y marca `main` como rama por defecto si no lo está.

5) Revisar el proyecto en tu espacio
- Comprueba que los archivos están en el remoto (Angular, Symfony y docs).
- Opcional: añade una descripción del proyecto y un README con tu presentación.

## Consejos para TFG/portfolio
- Explica el objetivo del proyecto y qué problemas resuelve.
- Resume el stack: Angular, Tailwind, Symfony, PostgreSQL, JWT, etc.
- Incluye capturas de pantalla del flujo completo (login, tareas, admin).
- Añade un apartado “Próximos pasos” (ideas de mejora y roadmap).
- Si el repo es público, cuida secretos: no subas `.env` con credenciales reales.

## Comandos útiles
- Cambiar URL del remoto: `git remote set-url origin <URL>`
- Ver historial compacto: `git log --oneline --graph --decorate --all`
- Subir tags (si creas versiones): `git push --tags`

## Resultado esperado
- Un repositorio personal con el código del onboarding, listo para compartir.
- Posible base para tu TFG: puedes ampliar módulos, añadir features y documentar decisiones.

