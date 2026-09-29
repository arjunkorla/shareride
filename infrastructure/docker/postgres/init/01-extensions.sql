-- Runs once, on first container start with an EMPTY data volume (the
-- postgis/postgis image's /docker-entrypoint-initdb.d convention). An
-- existing volume is never re-initialized; recreate it to pick up changes.
--
-- PostGIS goes into a dedicated `extensions` schema, mirroring Supabase's
-- recommended layout (Supabase projects already have this schema). The
-- baseline migration (packages/database/prisma/migrations/20260101000000_init)
-- runs `CREATE EXTENSION IF NOT EXISTS "postgis" WITH SCHEMA "extensions"`
-- and declares its columns as `extensions.geometry(Point, 4326)`, and every
-- raw PostGIS call in apps/api / seed.ts is schema-qualified
-- (`extensions.ST_*`, `::extensions.geography`) — so nothing depends on
-- `extensions` being on the search_path. Prisma does not emit
-- `CREATE SCHEMA` for an extension's schema, hence creating it here.
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;

-- Unchanged, deliberately left in their original (public) location: nothing
-- in this codebase uses either (Prisma generates ids client-side; no SQL
-- calls uuid_generate_*, gen_random_uuid, crypt/digest/pgp_*), so there is
-- no consumer whose expectations moving them would satisfy.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;
