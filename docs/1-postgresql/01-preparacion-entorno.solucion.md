# Solución · Ejercicio 01

## Validaciones recomendadas

- **Estado del contenedor**: `docker compose ps db` debe mostrar `healthy`. Si no lo está, revisa los logs con `docker compose logs db`.
- **Disponibilidad del puerto**: `lsof -i :5432` (o el puerto configurado) comprueba si hay conflictos.
- **¿El puerto está ocupado?**
  - Ejecuta `docker ps` y `sudo docker ps` para comprobar si otro contenedor está usando el puerto 5432.
  - Si encuentras un servicio PostgreSQL previo, detenlo con `docker stop <container>` o `docker compose stop` en ese proyecto.
  - Cuando no haya contenedores en uso (puedes confirmarlo con `docker ps` vacío), vuelve a lanzar `docker compose up -d`.
- **Prueba rápida con psql**:

```bash
docker compose exec db psql -U <usuario> -d <base_de_datos>
```

Si ves el prompt de `psql`, la base de datos está lista.

## Configuración típica en DBeaver

- **Host**: `localhost`
- **Puerto**: el expuesto en `docker-compose.yml` (por defecto 5432)
- **Base de datos**: nombre en la variable `POSTGRES_DB`
- **Usuario**: `POSTGRES_USER`
- **Contraseña**: `POSTGRES_PASSWORD`
