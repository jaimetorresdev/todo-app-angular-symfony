# Solución · Ejercicio 03

## SQL de referencia

```sql
CREATE TABLE IF NOT EXISTS tareas (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(180) NOT NULL,
  descripcion TEXT,
  estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_limite DATE,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE
);

INSERT INTO tareas (titulo, descripcion, estado, fecha_limite, usuario_id) VALUES
  ('Preparar presentación', 'Revisar diapositivas', 'en_progreso', CURRENT_DATE + INTERVAL '2 days', 2),
  ('Revisar pull requests', 'Validar MR pendientes', 'pendiente', CURRENT_DATE + INTERVAL '1 day', 1),
  ('Planificar roadmap', 'Objetivos del próximo mes', 'pendiente', NULL, 3),
  ('Actualizar documentación', 'Sincronizar README', 'completada', CURRENT_DATE - INTERVAL '1 day', 2);

CREATE OR REPLACE VIEW vw_tareas_con_propietario AS
SELECT
  t.id,
  t.titulo,
  t.estado,
  t.fecha_creacion,
  t.fecha_limite,
  u.id AS usuario_id,
  u.nombre AS usuario_nombre,
  u.email AS usuario_email
FROM tareas t
JOIN usuarios u ON u.id = t.usuario_id;

CREATE OR REPLACE VIEW vw_resumen_tareas AS
SELECT
  u.id AS usuario_id,
  u.nombre,
  t.estado,
  COUNT(t.id) AS total
FROM usuarios u
LEFT JOIN tareas t ON t.usuario_id = u.id
GROUP BY u.id, u.nombre, t.estado;
```

## Puntos clave

- Puedes añadir una restricción `CHECK` o un listado de constantes en Symfony para garantizar que solo se usen estados válidos (`pendiente`, `en_progreso`, `completada`).
- `ON DELETE CASCADE` asegura que al eliminar un usuario se eliminen sus tareas asociadas, lo cual simplifica la limpieza de datos.
- `vw_tareas_con_propietario` facilita depurar el listado de tareas combinado con datos de usuario en Postman o Symfony.
- `vw_resumen_tareas` puede alimentar paneles de administración o estadísticas rápidas en Angular.
