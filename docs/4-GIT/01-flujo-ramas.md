# Ejercicio 01 · Flujo de ramas y commits

## Objetivo

Reproducir el flujo de ramas del proyecto: `main` estable, ramas de feature y commits pequeños y descriptivos.

## Ejercicios guiados

### Guía 1 · Crear la rama de trabajo

1. Asegúrate de estar en `main` y actualizado: `git checkout main && git pull`.
2. Nombra tu rama siguiendo el estándar del curso:
   - Ramas de ejercicio: `exerciseN-yourname` (ej.: `exercise1-juanperez`).
   - Ramas de issue/funcionalidad: `[type]-slug-yourname` (ej.: `feature-login-mariagonzalez`).
3. Crea la rama (ejemplos):
   ```bash
   # Ejercicio 1 por "juanperez"
   git checkout -b exercise1-juanperez

   # Funcionalidad login por "mariagonzalez"
   git checkout -b feature-login-mariagonzalez
   ```

### Guía 2 · Realizar un cambio atómico

1. Modifica un archivo sencillo (por ejemplo, añade una nota al README).
2. Revisa qué cambió:
   ```bash
   git status
   git diff               # cambios sin agregar
   ```
3. Añade los cambios y haz commit siguiendo Conventional Commits (en inglés, imperativo y sin punto final):
   ```bash
   git add .
   git commit -m "docs: clarify installation steps"
   # otros ejemplos válidos:
   # feat: add login form validation
   # fix: correct admin table layout on mobile
   # refactor: extract user api service
   # test: add unit tests for auth store
   ```

### Guía 3 · Publicar y revisar el historial

1. Empuja la rama a GitLab con `git push -u origin feature/...`.
2. Usa `git log --oneline --graph --decorate --all` para visualizar cómo tu rama diverge de `main`.

> Consejo: si creaste una rama de ejercicio, haz push así:
> ```bash
> git push -u origin exercise1-juanperez
> ```

Consulta `01-flujo-ramas.solucion.md` al finalizar el reto.

---

## Guía de Nomenclatura para Ramas y Commits

Esta guía establece un estándar simplificado para asegurar consistencia y claridad.

### Nomenclatura de ramas
- Ejercicios: `exerciseN-yourname`  (ej.: `exercise1-juanperez`).
- Issues/funcionalidades: `[type]-slug-yourname`  (ej.: `feature-login-mariagonzalez`).
  - Tipos: `feature`, `bugfix`, `hotfix`, `refactor`, `docs`, `chore`.

### Nomenclatura de commits (Conventional Commits simplificado)
- Formato: `type: description`
- Tipos: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `build`, `ci`, `chore`.
- Reglas: en inglés, modo imperativo, sin punto final.
- Ejemplos:
  - `feat: implement pagination in product list`
  - `fix: resolve browser cache issue`
  - `docs: update README with installation instructions`
  - `style: format code according to style guides`
  - `refactor: extract business logic to service`
  - `test: add unit tests for validation function`
  - `build: update angular dependencies`
  - `ci: configure github actions workflow`
  - `chore: clean temporary files`

### ¿Por qué en inglés?
- Estandarización global y colaboración internacional.
- Claridad y consistencia entre equipos.
- Profesionaliza tu repositorio y CV.

---

## Actividad práctica: GitLab (aplicado a este proyecto)

Objetivos

- Practicar un flujo de trabajo colaborativo con Git y GitLab.
- Entender qué hace cada comando y por qué es necesario.
- Crear ramas, commits y una Merge Request (MR) siguiendo buenas prácticas.
- Trabajar de forma aislada: la MR será de tu rama personal a otra rama tuya (no a `main`).

Introducción rápida

- Git: sistema de control de versiones distribuido (historial completo local y remoto).
- Repositorio: carpeta con archivos + historial (local y remoto/GitLab).
- GitLab: plataforma para alojar repos y colaborar (MR, issues, CI/CD, tableros, wiki).
- Rama: línea de trabajo paralela a `main`.
- MR: propuesta de cambios para revisión antes de fusionar.

Requisitos previos

- Git instalado y configurado: `git config user.name`, `git config user.email`.
- Acceso al repo y clave SSH (o credenciales HTTPS).
- Haber leído estas normas de naming (sección anterior).

Flujo recomendado (paso a paso)

1) Preparar tu entorno local

```bash
git clone <URL-del-repo-clase>
cd onboarding-daw-v2
git remote -v
git branch
git status
```

- `git clone`: descarga la copia del repo remoto.
- `git remote -v`: confirma a qué servidor subirás cambios.
- `git branch` y `git status`: revisa rama actual y si hay cambios locales.

2) Actualizar `main` antes de trabajar

```bash
git checkout main
git fetch origin
git pull origin main
```

- `checkout`: moverte a `main` local.
- `fetch`: trae historial remoto sin mezclar.
- `pull`: integra cambios remotos en tu `main` local.

3) Crear una rama base personal (tu “sandbox”)

```bash
git checkout -b exercise-gitlab-<tu-nombre>
```

- Ejemplo: `exercise-gitlab-juanperez`.
- Esta rama nace de `main` y será tu rama “destino” de la MR.

4) Crear una rama de trabajo desde tu rama base

```bash
git checkout -b feature-presentation-<tu-nombre>
```

- Ejemplo: `feature-presentation-juanperez`.
- Esta rama será el “origen” de la MR.

5) Añadir un cambio sencillo (documentación)

- Crea el archivo `docs/participantes.md` con tu presentación (nombre y breve bio).

6) Revisar lo que cambió

```bash
git diff
```

7) Preparar y crear un commit claro

```bash
git add docs/participantes.md
git status
git commit -m "docs: add presentation for Juan Perez"
git log --oneline -5
```

- `add`: selecciona qué entra al snapshot.
- `commit`: crea el snapshot. Mensaje en inglés, imperativo y sin punto.
- `log`: comprueba que se creó correctamente.

8) Publicar tus ramas personales

```bash
git push -u origin exercise-gitlab-<tu-nombre>
git push -u origin feature-presentation-<tu-nombre>
```

9) Crear una MR “de tu rama a tu rama” en GitLab

Accede a GitLab, sección de Merge Request

- Origen (source): `feature-presentation-<tu-nombre>`
- Destino (target): `exercise-gitlab-<tu-nombre>`
- Título: `docs: add presentation for <Tu Nombre>`
- Descripción: contexto, pasos de prueba y, si aplica, referencia a issue.
- Labels: “documentation”, “practice”.
- Asignado: tú. Reviewer: compañero/tutor.
- Marca como “Draft” si falta trabajo.

10) Merge y limpieza

- Haz merge de la MR a TU rama destino (no a `main`).
- Actualiza localmente y elimina la rama de trabajo:

```bash
git checkout exercise-gitlab-<tu-nombre>
git pull origin exercise-gitlab-<tu-nombre>
git branch -d feature-presentation-<tu-nombre> #esto borra la rama
git push origin --delete feature-presentation-<tu-nombre>
```

Buenas prácticas rápidas

- Comunicación: usa issues/comentarios/labels.
- Ramas cortas y commits atómicos.
- Revisión respetuosa y explicando el porqué.
- Documenta decisiones en la MR o wiki.
- Rebase/merge frecuente para evitar conflictos grandes.
- Nunca pushes directos a `main` sin MR.
