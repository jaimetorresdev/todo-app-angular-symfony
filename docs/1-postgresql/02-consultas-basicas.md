# Ejercicio 02 · Usuarios base y consultas esenciales

## Objetivo

Crear la tabla `usuarios` de la To-Do App, practicar instrucciones `INSERT`, `SELECT`, filtros con `WHERE` y ordenar resultados desde DBeaver. Usaremos tipos y restricciones compatibles con las migraciones que construiremos en Symfony (Doctrine generará más adelante estas tablas automáticamente, pero aquí aprenderás a manipularlas manualmente).

> Recuerda: el **backend** (Symfony + Doctrine) será quien cree y mantenga estas tablas cuando ejecutemos migraciones. En PostgreSQL estamos adelantando el trabajo para entender el modelo de datos y poder depurar desde DBeaver cuando algo falle.

### Antes de empezar

- Abre DBeaver, asegúrate de tener la conexión creada en el ejercicio 01 y expande el esquema `public`. Si no ves nada aún, no pasa nada: crearemos la tabla en esta guía.
- Para ejecutar SQL, usa `Ctrl+Enter` en el editor. Si no tienes un editor abierto, haz clic derecho sobre la conexión → **SQL Editor → New SQL Script**.

## Ejercicios guiados

### Guía 1 · Crear tabla y restricciones

1. En DBeaver abre la conexión creada en el ejercicio anterior.
2. Crea un script SQL (clic derecho sobre la conexión → **SQL Editor → New SQL Script**). Copia y ejecuta el siguiente bloque para crear la tabla `usuarios` con los campos necesarios:
   ```sql
   CREATE TABLE IF NOT EXISTS usuarios (
     id SERIAL PRIMARY KEY,
     nombre VARCHAR(120) NOT NULL,
     email VARCHAR(150) NOT NULL UNIQUE,
     password VARCHAR(255) NOT NULL,
     roles JSONB NOT NULL DEFAULT '["ROLE_USER"]',
     fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );
   ```
3. En el panel izquierdo, haz clic derecho sobre **public** y pulsa **Refresh** (o la tecla `F5`). Deberías ver la tabla `usuarios`. Si la expandes, verás las columnas que acabamos de crear.
4. Nota: cuando Doctrine ejecute migraciones, generará exactamente esta estructura. Saber crearla a mano te permite entender qué campos espera el backend y cómo depurar directamente en la base de datos cuando algo no funcione.
5. ¿Qué significa cada columna?
   - `id`: identificador autoincremental.
   - `nombre`: nombre visible del usuario.
  - `email`: se usará como identificador para el login, por eso es `UNIQUE`.
   - `password`: almacena el hash de la contraseña (jamás guardamos texto plano).
   - `roles`: array JSON donde Doctrine guardará los roles (`ROLE_USER`, `ROLE_ADMIN`, …).
   - `fecha_registro`: se completa automáticamente con la fecha y hora de creación.

### Guía 2 · Insertar datos y usar filtros

1. En el mismo editor (o en uno nuevo) pega el siguiente bloque para crear usuarios de prueba. El password es temporal (lo hashearemos más adelante desde Symfony):
   ```sql
   INSERT INTO usuarios (nombre, email, password, roles)
   VALUES
     ('Ana Admin', 'ana.admin@example.com', 'changeme', '["ROLE_ADMIN"]'),
     ('Luis Usuario', 'luis.user@example.com', 'changeme', '["ROLE_USER"]'),
     ('María Lider', 'maria.user@example.com', 'changeme', '["ROLE_USER","ROLE_MANAGER"]');
   ```
2. Ejecuta `SELECT id, nombre, email, roles, fecha_registro FROM usuarios;` para confirmar que los registros se insertaron correctamente. DBeaver mostrará una tabla con los datos. Si no aparece nada, asegúrate de haber ejecutado el `INSERT` (Ctrl+Enter sobre la sentencia, no sobre todo el archivo vacío).
3. Practica algunas consultas útiles que usarás desde el backend:
   - Mostrar solo administradores:  
     ```sql
     SELECT * FROM usuarios WHERE roles @> '["ROLE_ADMIN"]';
     ```
   - Ordenar por fecha de registro descendente:  
     ```sql
     SELECT * FROM usuarios ORDER BY fecha_registro DESC;
     ```
4. Dónde ver los resultados: cada consulta aparece en una pestaña inferior de resultados. Puedes cambiar entre ellas para comparar.

### Guía 3 · Exportar resultados y preparar datos semilla

1. Con el result set visible (por ejemplo el `SELECT * FROM usuarios`), haz clic derecho sobre la tabla de resultados y selecciona **Export Data → CSV** para generar un respaldo de usuarios.
2. Guarda el archivo en el repositorio (por ejemplo en carpeta /postgresql/csv).
3. Crea un archivo `postgresql/sql/seed-usuarios.sql` (opcional) con los `INSERT` de la línea 44 para repoblar rápidamente la tabla.
4. Verifica con `SELECT COUNT(*) FROM usuarios;` que el número de usuarios insertados coincide con lo esperado.

## Reto práctico

Diseña una consulta que devuelva dos filas: total de usuarios admin y total de usuarios normales. Requerimientos:
- Usa únicamente `SELECT`, `FROM usuarios` y filtros `WHERE` (puedes apoyarte en `roles @> ...`).
- Adecúa el resultado para que cada fila indique claramente el rol que está contando. Pista: puedes usar un literal (`'admin'`) o un `CASE` para nombrar la fila.
- Decide si prefieres ejecutar dos consultas separadas o combinarlas en una sola sentencia. Si las unes, recuerda operadores como `UNION ALL`.

Guarda tu versión y compárala con `02-consultas-basicas.solucion.md`.

Solo revisa `02-consultas-basicas.solucion.md` si necesitas desbloquearte o validar tu respuesta final.
