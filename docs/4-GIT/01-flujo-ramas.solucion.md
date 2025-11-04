# Solución · Ejercicio 01

Esta solución aplica el flujo acordado en el proyecto de Onboarding: cada alumno trabaja en ramas personales y crea una MR de su propia rama de trabajo a su propia rama base (sin tocar `main`).

## Paso a paso (comandos de referencia)

1) Actualiza `main` local y crea tu rama base personal

```
git checkout main
git fetch origin
git pull origin main
git checkout -b exercise-gitlab-<tu-nombre>
git push -u origin exercise-gitlab-<tu-nombre>
```

2) Crea tu rama de trabajo desde tu rama base

```
git checkout -b feature-presentation-<tu-nombre>
```

3) Aplica un cambio pequeño y atómico

- Archivo sugerido: `docs/participantes.md` con tu presentación.

```
git add docs/participantes.md
git status
git commit -m "docs: add presentation for <Tu Nombre>"
git log --oneline -5
```

4) Sincroniza si hubo cambios en `main` (opcional)

```
git fetch origin
git rebase origin/main    # o git merge origin/main
```

5) Publica tu rama de trabajo y abre la MR “rama tuya → rama tuya”

```
git push -u origin feature-presentation-<tu-nombre>
```

- Crea la MR en GitLab:
  - Source: `feature-presentation-<tu-nombre>`
  - Target: `exercise-gitlab-<tu-nombre>`
  - Título: `docs: add presentation for <Tu Nombre>`
  - Descripción: contexto breve + cómo validar + etiquetas recomendadas (`documentation`, `practice`).

6) Fusiona y limpia

```
git checkout exercise-gitlab-<tu-nombre>
git pull origin exercise-gitlab-<tu-nombre>
git branch -d feature-presentation-<tu-nombre>
git push origin --delete feature-presentation-<tu-nombre>
```

## Nomenclatura de ramas y commits (resumen)

- Ramas de ejercicio: `exerciseN-yourname` (ej.: `exercise1-juanperez`).
- Ramas de funcionalidad/issue: `[type]-slug-yourname` (ej.: `feature-login-mariagonzalez`).
- Commits (Conventional Commits simplificado): `type: description`.
  - Tipos: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `build`, `ci`, `chore`.
  - Ejemplos:
    - `feat: add login form validation`
    - `fix: correct admin table overflow on mobile`
    - `docs: update README with setup instructions`
    - `refactor: extract user api service`

## Rebase vs merge (recomendación)

- Preferible rebase sobre `origin/main` en ramas personales para un historial lineal:

```
git fetch origin
git rebase origin/main
```

- Si hay conflictos complejos o la rama es compartida, puedes usar merge:

```
git merge origin/main
```

## Plantilla de MR (sugerida)

```
## Summary
- Add personal presentation page/entry

## Test Plan
- Open docs/participantes.md and verify my entry is present and correctly formatted

## Notes
- This MR targets my personal base branch to avoid touching `main`
```

## Checklist previo al push

1. `git status` sin archivos pendientes accidentales.
2. Mensajes de commit claros, en inglés e imperativo.
3. Rama publicada con `-u` para facilitar futuros push/pull.

Verifica con `git log --oneline --graph --decorate --all` y `git branch -a` que tanto tu rama base como tu rama de trabajo existen en remoto y local.
