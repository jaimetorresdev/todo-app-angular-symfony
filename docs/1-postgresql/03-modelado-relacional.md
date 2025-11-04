# Ejercicio 03 · Tabla de tareas y consultas con JOIN

## Objetivo

Crear la tabla `tareas` de la To-Do App, relacionarla con `usuarios` y practicar consultas combinadas (`JOIN`) y vistas reutilizables usando DBeaver.

## Ejercicios guiados

### Guía 1 · Crear la tabla `tareas`

1. Crea la tabla ejecutando:
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
   ```
3. Refresca el esquema, entrando en la pestaña "public" en Dbeaver y pulsando f5 para verificar la relación `usuario_id → usuarios.id`.

### Guía 2 · Insertar datos de ejemplo

1. Usa los usuarios creados en el ejercicio anterior y agrega tareas:
   ```sql
  INSERT INTO tareas (titulo, descripcion, estado, fecha_limite, usuario_id) VALUES
    ('Preparar presentación', 'Revisar diapositivas y ejemplos', 'en_progreso', CURRENT_DATE + INTERVAL '2 days', 2),
    ('Revisar pull requests', 'Validar MR pendientes del sprint', 'pendiente', CURRENT_DATE + INTERVAL '1 day', 1),
    ('Planificar roadmap', 'Definir objetivos del próximo mes', 'pendiente', NULL, 3),
    ('Actualizar documentación', 'Sincronizar README y notas', 'completada', CURRENT_DATE - INTERVAL '1 day', 2);
   ```
2. Ejecuta `SELECT * FROM tareas;` para confirmar los datos.

### Guía 3 · Consultas combinadas y vistas

1. Construye un `JOIN` para mostrar tareas junto al nombre del usuario:
   ```sql
   SELECT
     t.id,
     t.titulo,
     t.estado,
     t.fecha_limite,
     u.nombre AS propietario
   FROM tareas t
   JOIN usuarios u ON u.id = t.usuario_id;
   ```
2. Crea una vista reutilizable para el dashboard de admin:
   ```sql
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
   ```
   Una vista (`VIEW`) es una consulta guardada que puedes reutilizar como si fuera una tabla virtual. En DBeaver la encontrarás dentro del esquema, en la carpeta **Views**: pulsa F5 para refrescar y luego haz doble clic sobre `vw_tareas_con_propietario` para ver su definición o `SELECT * FROM vw_tareas_con_propietario;` para visualizar los datos.
3. Ejecuta `SELECT * FROM vw_tareas_con_propietario ORDER BY fecha_creacion DESC;` y valida que el resultado coincide con tus expectativas.

## Reto práctico

Formula una consulta que muestre para cada usuario cuántas tareas tiene en cada estado, ordenada de mayor a menor cantidad. Requerimientos:
- Incluye en el resultado el nombre del usuario, el estado de la tarea y el total de tareas para esa combinación.
- Asegúrate de que los usuarios sin tareas sigan apareciendo (consulta exterior). Pista: ¿`LEFT JOIN` suena familiar?
- Ordena por el total en orden descendente. Pista: `ORDER BY total DESC`.
- Recuerda agrupar (`GROUP BY`) los campos que estás seleccionando para poder usar `COUNT(*)`.

Cuando la tengas lista, conviértela en la vista `vw_resumen_tareas` y compárala con `03-modelado-relacional.solucion.md`.

## Antes de ver la solución

- ¿Qué sucede con las tareas cuando eliminas un usuario? ¿Necesitas `ON DELETE CASCADE`?
- ¿Qué índice agregarías para acelerar filtros por estado o fecha límite?
- ¿Cómo usarías la vista en Postman o Symfony para depurar rápidamente?

Consulta `03-modelado-relacional.solucion.md` solo después de intentar el reto.
