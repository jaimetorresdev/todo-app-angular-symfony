# Solución · Ejercicio 02

## SQL de referencia

```sql
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  roles JSONB NOT NULL DEFAULT '["ROLE_USER"]',
  fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO usuarios (nombre, email, password, roles) VALUES
  ('Ana Admin', 'ana.admin@example.com', 'changeme', '["ROLE_ADMIN"]'),
  ('Luis Usuario', 'luis.user@example.com', 'changeme', '["ROLE_USER"]'),
  ('María Lider', 'maria.user@example.com', 'changeme', '["ROLE_USER","ROLE_MANAGER"]');

SELECT COUNT(*) AS total_admin
FROM usuarios
WHERE roles @> '["ROLE_ADMIN"]';

SELECT COUNT(*) AS total_user
FROM usuarios
WHERE roles @> '["ROLE_USER"]' AND roles <> '["ROLE_ADMIN"]';

-- Variante opcional con UNION ALL para ver ambos resultados juntos:
SELECT 'admin' AS rol, COUNT(*) AS total
FROM usuarios
WHERE roles @> '["ROLE_ADMIN"]'
UNION ALL
SELECT 'user' AS rol, COUNT(*) AS total
FROM usuarios
WHERE roles @> '["ROLE_USER"]' AND roles <> '["ROLE_ADMIN"]';
```

## Puntos clave

- `roles` se almacena como `JSONB`, un formato de columna que guarda JSON directamente en PostgreSQL. Esto permite guardar arreglos como `["ROLE_USER","ROLE_ADMIN"]` y consultar su contenido con operadores (`@>`, `?`, etc.) igual que lo hace la entidad `Usuario` en Symfony.
- Con filtros simples (`WHERE roles @> ...`) puedes obtener los totales por rol sin desnormalizar el arreglo.
- Si necesitas una única tabla de resultados, `UNION ALL` combina las consultas manteniendo cada etiqueta de rol explícita.
- Mientras practicas son contraseñas en texto plano; en Symfony se almacenarán hasheadas, así que reemplázalas por hashes reales cuando integres el backend (más adelante lo veremos).
