# Ejercicio 01 · Preparar el entorno y conectar DBeaver

## Objetivo

Arrancar la base de datos PostgreSQL con Docker, confirmar que el contenedor está listo y configurar la conexión en DBeaver.

## Ejercicios guiados

### Guía 1 · Verificar Docker y levantar la base

1. Ejecuta `docker compose config --services` para confirmar que el servicio `db` está definido en el `docker-compose.yml`.
2. Arranca los contenedores con `docker compose up -d`.
3. Comprueba el estado del contenedor: `docker compose ps db` debe mostrar `healthy`.

### Guía 2 · Identificar credenciales

1. Abre `docker-compose.yml` y ubica la sección del servicio `db`.
2. Anota host (`localhost`), puerto expuesto, usuario, contraseña y nombre de la base (`POSTGRES_*`).

### Guía 3 · Configurar DBeaver

1. Inicia DBeaver y selecciona **New Connection → PostgreSQL**.
2. Completa host, puerto, base, usuario y contraseña con los valores anteriores.
3. Prueba la conexión con el botón **Test Connection** y guarda si es exitosa.
4. Navega a la vista de esquemas y verifica que el esquema por defecto aparece.
5. Clic derecho sobre la conexión recién creada → **SQL Editor → New SQL Script**, pega `SELECT 1;` y pulsa **Run** (Ctrl+Enter) para confirmar que puedes ejecutar consultas.

## Reto práctico

Usando el mismo editor SQL, ejecuta `SELECT NOW();` desde DBeaver para validar que puedes interactuar con el servidor.

## Antes de ver la solución

- ¿Cómo validarías desde la terminal que PostgreSQL responde antes de abrir DBeaver?
- ¿Qué harías si el puerto configurado ya está ocupado en tu máquina?

Consulta `01-preparacion-entorno.solucion.md` solo para confirmar tus respuestas o desbloquearte.
