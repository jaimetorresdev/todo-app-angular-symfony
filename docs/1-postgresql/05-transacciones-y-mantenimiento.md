# Ejercicio 05 · CRUD completo desde DBeaver

## Objetivo

Practicar todas las operaciones CRUD sobre las tablas `usuarios` y `tareas` usando SQL puro en DBeaver, relacionando cada instrucción con los verbos HTTP más comunes (`GET`, `POST`, `PATCH`, `PUT`, `DELETE`). El objetivo es que puedas depurar la API del proyecto comprobando cada operación directamente en la base de datos.

## Ejercicios guiados

### Guía 1 · GET → Consultar información con `SELECT`

1. Ejecuta un listado paginado de tareas (simula `GET /tareas?limit=10&offset=0`):
   ```sql
   SELECT id, titulo, estado, fecha_limite
   FROM tareas
   ORDER BY fecha_creacion DESC
   LIMIT 10;
   ```
2. Añade un filtro para ver solo tareas de un usuario concreto (`WHERE usuario_id = 1`) y otra consulta que busque texto (`WHERE titulo ILIKE '%presentación%'`).
3. Guarda el script; estos SELECT serán útiles para comprobar el resultado de las operaciones siguientes.

### Guía 2 · POST → Crear registros con `INSERT ... RETURNING`

1. Inserta un usuario nuevo y revisa qué columnas se generan automáticamente:
   ```sql
   INSERT INTO usuarios (nombre, email, password, roles)
   VALUES ('Carla Coach', 'carla.coach@example.com', 'temporal', '["ROLE_USER"]')
   RETURNING id, nombre, email, fecha_registro;
   ```
   La cláusula `RETURNING` devuelve al instante las columnas que indiques sin necesidad de lanzar un `SELECT` aparte; es la forma más cómoda de recuperar el `id` generado o cualquier dato que quieras mostrar en la API después de un `INSERT`, `UPDATE` o `DELETE`.
   Anota el `id` devuelto; lo reutilizarás en los siguientes pasos.
2. Inserta una tarea asociada a ese usuario:
   ```sql
   INSERT INTO tareas (titulo, descripcion, estado, usuario_id, fecha_limite)
   VALUES ('Coaching inicial', 'Primera sesión de onboarding', 'pendiente', 4, CURRENT_DATE + INTERVAL '5 days')
   RETURNING id, titulo, usuario_id;
   ```
   (Sustituye `4` por el `id` real que hayas recibido en el paso anterior.)
3. Ejecuta un `SELECT` para verificar que la tarea aparece correctamente.

### Guía 3 · PATCH → Actualizaciones parciales con `UPDATE`

Usa `PATCH` cuando solo necesitas cambiar algunos campos puntuales de un registro existente; la API conserva los valores de las columnas que no envías en la petición. En SQL esto se traduce en un `UPDATE` que modifica únicamente las columnas presentes en la sentencia.

1. Simula la actualización de un campo concreto (por ejemplo `PATCH /tareas/{id}` para cambiar solo el estado):
   ```sql
   UPDATE tareas
   SET estado = 'en_progreso'
   WHERE id = 5
   RETURNING id, titulo, estado;
   ```
   Sustituye `5` por la tarea recién creada.
   Si necesitas el `id` exacto, vuelve a ejecutar el `SELECT` de la guía 1 filtrando por el título.
2. Cambia únicamente la fecha límite de la misma tarea. Observa que el `UPDATE` solo toca la columna indicada.
3. Consulta la tarea para confirmar el resultado.

### Guía 4 · PUT → Actualizaciones completas

`PUT` representa una actualización completa: la petición debe llevar todos los datos que definen al recurso, porque cualquier campo omitido suele considerarse “perdido” (o vuelve a un valor por defecto). En SQL, este enfoque equivale a sobrescribir todas las columnas relevantes en un único `UPDATE`, incluso aunque muchas queden exactamente igual.

1. Piensa en un `PUT /usuarios/{id}` que reemplaza la información principal (sin tocar la contraseña):
   ```sql
   UPDATE usuarios
   SET nombre = 'Carla Coach (Senior)',
       email = 'carla.senior@example.com',
       roles = '["ROLE_USER","ROLE_MANAGER"]'
   WHERE id = 4
   RETURNING id, nombre, email, roles;
   ```
   (Ajusta el `id` al usuario que creaste.)
2. Comprueba con un `SELECT` que los datos actuales coinciden con los valores nuevos; cualquier campo omitido seguirá con su valor previo.

### Guía 5 · DELETE → Eliminar registros con verificación

1. Solicita eliminar la tarea creada en los pasos anteriores:
   ```sql
   DELETE FROM tareas
   WHERE id = 5
   RETURNING id, titulo;
   ```
   Usa el `id` real de tu tarea.
2. Haz un `SELECT` para confirmar que la fila ya no existe.
3. Si también quieres eliminar el usuario de prueba, ejecuta el `DELETE` sobre `usuarios` comprobando antes que no tiene más tareas asociadas.

## Reto práctico

Construye un flujo completo para probar cualquier endpoint de la API desde SQL:

1. **Preparación (`GET`)**: listado de usuarios y tareas filtradas por correo o título.
2. **Simular `POST`**: inserta un usuario y dos tareas relacionadas usando `RETURNING` para obtener los `id`.
3. **Simular `PATCH`**: actualiza solamente el estado de una de las tareas a `'completada'`.
4. **Simular `PUT`**: actualiza el perfil del usuario (nombre, correo y roles) en una única sentencia `UPDATE`.
5. **Simular `DELETE`**: elimina una de las tareas; deja la otra para comprobar que el usuario sigue teniendo registros asociados.
6. **`GET` final**: usa la vista `vw_tareas_con_propietario` o un `SELECT` con `JOIN` para verificar el estado final de los datos.

Documenta el orden de ejecución en tu script (comentarios `-- Paso 1`, `-- Paso 2`, …) y compáralo con `05-transacciones-y-mantenimiento.solucion.md` para validar tu enfoque.

## Antes de ver la solución

- ¿Qué consultas guardarías como “favoritas” en DBeaver para repetir pruebas rápidamente?
- ¿Cómo te ayuda `RETURNING`? ¿Para qué lo usamos?
- ¿Qué validaciones adicionales harías antes de ejecutar un `DELETE`?
