# Ejercicio 04 · Métricas con agregaciones y filtros avanzados

## Objetivo

Practicar funciones agregadas (`COUNT`, `SUM`), agrupar información con `GROUP BY`, filtrar resultados con `HAVING` y preparar reportes que sirvan como base para dashboards en la To-Do App.

## Ejercicios guiados

### Guía 1 · Contar tareas por estado

1. En un nuevo script de DBeaver ejecuta:

   ```sql
   SELECT estado, COUNT(*) AS total
   FROM tareas
   GROUP BY estado
   ORDER BY total DESC;
   ```

2. Observa cómo `GROUP BY` agrupa filas con el mismo estado y la función `COUNT(*)` suma cuántas hay en cada grupo.
3. Cambia el `ORDER BY` para ordenar por `estado` y nota la diferencia.

### Guía 2 · Filtrar con fechas y `HAVING`

1. Identifica cuántas tareas están vencidas:

   ```sql
   SELECT usuario_id, COUNT(*) AS tareas_vencidas
   FROM tareas
   WHERE fecha_limite < CURRENT_DATE
   GROUP BY usuario_id;
   ```

2. Añade un filtro `HAVING` para mostrar solo usuarios con más de una tarea vencida:

   ```sql
   SELECT usuario_id, COUNT(*) AS tareas_vencidas
   FROM tareas
   WHERE fecha_limite < CURRENT_DATE
   GROUP BY usuario_id
   HAVING COUNT(*) > 1
   ORDER BY tareas_vencidas DESC;
   ```

3. Refuerza la idea: `WHERE` filtra filas antes de agrupar, `HAVING` filtra grupos después de agregar.

### Guía 3 · Clasificar resultados con `CASE`

1. Crea categorías personalizadas para el estado:

   ```sql
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
   ```

2. Observa cómo `CASE` permite etiquetar cada grupo.
3. Si tus datos solo tienen tres estados, `LIMIT 5` no cambia el resultado. Prueba con `LIMIT 2` para ver el recorte o inserta más tareas con estados adicionales y vuelve a ejecutar la consulta.

## Reto práctico

Construye un informe que muestre, por cada usuario, un resumen de sus tareas con estas columnas:

- `usuario_id` y `usuario_nombre`.
- `total_tareas`, `tareas_completadas` y `tareas_pendientes`.
- `porcentaje_completadas` con dos decimales.

Requerimientos y pistas (síguelas en orden):

1. Comienza armando el esqueleto:
   ```sql
   SELECT u.id AS usuario_id, u.nombre AS usuario_nombre
   FROM usuarios u
   LEFT JOIN tareas t ON t.usuario_id = u.id;
   ```
   Verifica que los usuarios sin tareas sigan apareciendo (columnas `t.*` quedarán en `NULL`).
2. Agrega el total general con `COUNT(t.id) AS total_tareas`. Si notas `NULL`, envuélvelo con `COALESCE(..., 0)`.
3. Crea columnas condicionales:
   ```sql
   SUM(CASE WHEN t.estado = 'completada' THEN 1 ELSE 0 END) AS tareas_completadas,
   SUM(CASE WHEN t.estado IS NULL OR t.estado <> 'completada' THEN 1 ELSE 0 END) AS tareas_pendientes
   ```
4. Calcula el porcentaje:
   - Empieza con `SUM(...)::numeric / NULLIF(COUNT(t.id), 0) * 100`.
   - Después redondea con `ROUND(expr, 2)` y pon un `CASE` para devolver `0` cuando no haya tareas.
5. Cierra con:
   - `GROUP BY u.id, u.nombre`
   - `ORDER BY tareas_completadas DESC`

Cuando esté lista, guárdala en tu archivo y luego compárala con `04-consultas-agrupadas.solucion.md`; allí verás también cómo envolverla en un `CREATE VIEW`.

## Antes de ver la solución

- ¿Te sería útil convertir el informe en una vista (`CREATE VIEW`) para evitar repetir la lógica?
