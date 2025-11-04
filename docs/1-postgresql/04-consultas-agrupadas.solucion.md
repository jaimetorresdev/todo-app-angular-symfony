# Solución · Ejercicio 04

## SQL de referencia

```sql
-- Conteo por estado
SELECT estado, COUNT(*) AS total
FROM tareas
GROUP BY estado
ORDER BY total DESC;

-- Usuarios con tareas vencidas (más de una)
SELECT usuario_id, COUNT(*) AS tareas_vencidas
FROM tareas
WHERE fecha_limite < CURRENT_DATE
GROUP BY usuario_id
HAVING COUNT(*) > 1
ORDER BY tareas_vencidas DESC;

-- Clasificación con CASE
SELECT
  estado,
  CASE
    WHEN estado = 'completada' THEN 'Completada'
    WHEN estado = 'pendiente' THEN 'Pendiente'
    ELSE 'En seguimiento'
  END AS etiqueta,
  COUNT(*) AS total
FROM tareas
GROUP BY estado, etiqueta
ORDER BY total DESC
LIMIT 5;

-- Reto: resumen por usuario
CREATE OR REPLACE VIEW vw_resumen_tareas AS
SELECT
  u.id AS usuario_id,
  u.nombre AS usuario_nombre,
  COUNT(t.id) AS total_tareas,
  SUM(CASE WHEN t.estado = 'completada' THEN 1 ELSE 0 END) AS tareas_completadas,
  SUM(CASE WHEN t.estado IS NULL OR t.estado <> 'completada' THEN 1 ELSE 0 END) AS tareas_pendientes,
  ROUND(
    CASE WHEN COUNT(t.id) = 0 THEN 0
         ELSE SUM(CASE WHEN t.estado = 'completada' THEN 1 ELSE 0 END)::numeric
              / NULLIF(COUNT(t.id), 0) * 100
    END,
    2
  ) AS porcentaje_completadas
FROM usuarios u
LEFT JOIN tareas t ON t.usuario_id = u.id
GROUP BY u.id, u.nombre
ORDER BY tareas_completadas DESC;

-- Puedes consultar la vista directamente con:
SELECT * FROM vw_resumen_tareas;
```

## Puntos clave

- `LEFT JOIN` asegura que todos los usuarios aparezcan, incluso sin tareas.
- Las expresiones `SUM(CASE WHEN ...)` permiten crear contadores condicionales sin duplicar consultas.
- `NULLIF` evita divisiones entre cero cuando un usuario no tiene tareas.
- Redondear con `ROUND(valor, 2)` deja listas las métricas para mostrarlas en dashboards o exports.
