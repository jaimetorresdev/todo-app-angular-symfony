# Solución · Ejercicio 05

## SQL de referencia

```sql
-- GET: consultas base
SELECT id, titulo, estado, fecha_limite
FROM tareas
ORDER BY fecha_creacion DESC
LIMIT 10 OFFSET 0;

SELECT id, titulo, estado
FROM tareas
WHERE usuario_id = 4;

SELECT id, titulo
FROM tareas
WHERE titulo ILIKE '%presentación%';

-- POST: crear usuario y tarea
INSERT INTO usuarios (nombre, email, password, roles)
VALUES ('Carla Coach', 'carla.coach@example.com', 'temporal', '["ROLE_USER"]')
RETURNING id, nombre, email, fecha_registro;
-- Supongamos que devuelve id = 7 (ajusta según tu resultado)

INSERT INTO tareas (titulo, descripcion, estado, usuario_id, fecha_limite)
VALUES ('Coaching inicial', 'Primera sesión de onboarding', 'pendiente', 7, CURRENT_DATE + INTERVAL '5 days')
RETURNING id, titulo, usuario_id;
-- Supongamos que devuelve id = 12 (ajusta según tu resultado)

-- PATCH: actualizar solo el estado
UPDATE tareas
SET estado = 'en_progreso'
WHERE id = 12
RETURNING id, titulo, estado;

UPDATE tareas
SET fecha_limite = CURRENT_DATE + INTERVAL '7 days'
WHERE id = 12
RETURNING id, titulo, fecha_limite;

-- PUT: actualizar información principal del usuario
UPDATE usuarios
SET nombre = 'Carla Coach (Senior)',
    email = 'carla.senior@example.com',
    roles = '["ROLE_USER","ROLE_MANAGER"]'
WHERE id = 7
RETURNING id, nombre, email, roles;

-- DELETE: eliminar una tarea
DELETE FROM tareas
WHERE id = 12
RETURNING id, titulo;

-- GET final para comprobar resultados
SELECT *
FROM vw_tareas_con_propietario
WHERE usuario_id = 7;
```

### Script de referencia para el reto

```sql
-- Paso 1: GET inicial
SELECT id, nombre, email
FROM usuarios
WHERE email ILIKE '%coach%';

SELECT id, titulo, estado
FROM tareas
WHERE titulo ILIKE '%coaching%';

-- Paso 2: POST usuario y tareas
INSERT INTO usuarios (nombre, email, password, roles)
VALUES ('Daniel Mentor', 'daniel.mentor@example.com', 'temporal', '["ROLE_USER","ROLE_MANAGER"]')
RETURNING id;
-- Guardar id_resultado → por ejemplo 8

INSERT INTO tareas (titulo, descripcion, estado, usuario_id)
VALUES
  ('Plan de bienvenida', 'Revisar checklist de onboarding', 'pendiente', 8),
  ('Seguimiento semana 1', 'Reunión de seguimiento con el nuevo miembro', 'pendiente', 8)
RETURNING id;
-- Guardar ids_resultado → por ejemplo 13 y 14

-- Paso 3: PATCH estado de una tarea
UPDATE tareas
SET estado = 'completada'
WHERE id = 13
RETURNING id, estado;

-- Paso 4: PUT datos del usuario
UPDATE usuarios
SET nombre = 'Daniel Mentor (Lead)',
    email = 'daniel.lead@example.com',
    roles = '["ROLE_ADMIN","ROLE_MANAGER"]'
WHERE id = 8
RETURNING id, nombre, email, roles;

-- Paso 5: DELETE de una tarea (deja la otra viva)
DELETE FROM tareas
WHERE id = 14
RETURNING id, titulo;

-- Paso 6: GET final de verificación
SELECT *
FROM vw_tareas_con_propietario
WHERE usuario_id = 8;
```

## Puntos clave

- Relacionar cada sentencia (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) con su verbo HTTP ayuda a depurar la API desde SQL.
- `RETURNING` es fundamental para encadenar operaciones: te da los `id` necesarios para los pasos posteriores sin depender del IDE.
- Los comentarios dentro del script (`-- Paso ...`) facilitan repetir la batería de pruebas en futuros sprints.
- Combinar `SELECT` de verificación con vistas como `vw_tareas_con_propietario` permite validar el flujo completo antes de ejecutar la misma lógica vía Postman o Symfony.
