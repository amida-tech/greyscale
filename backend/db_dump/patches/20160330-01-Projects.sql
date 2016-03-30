-- Patch for specific schema and org_id. Need to define it.

SET search_path TO 'yandex'; -- here schema name
UPDATE "Projects" SET "organizationId" = 10; -- here org id (id of single record in schema)
