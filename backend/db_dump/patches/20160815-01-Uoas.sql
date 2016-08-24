DO
$do$
DECLARE
    schema_name text;
BEGIN
	FOR schema_name IN
		SELECT pg_catalog.pg_namespace.nspname
		FROM pg_catalog.pg_namespace
		INNER JOIN pg_catalog.pg_user
		ON (pg_catalog.pg_namespace.nspowner = pg_catalog.pg_user.usesysid)
		AND (pg_catalog.pg_user.usename = 'indaba') -- HAVE TO SET CORRECT DB USER
	LOOP
		EXECUTE 'SET search_path TO ' || quote_ident(schema_name);
		EXECUTE 'ALTER TABLE "UnitOfAnalysis" '
		|| 'ALTER COLUMN "creatorId" DROP NOT NULL, '
		|| 'ALTER COLUMN "ownerId" DROP NOT NULL, '
		|| 'DROP CONSTRAINT "UnitOfAnalysis_ownerId_fkey", '
		|| 'DROP CONSTRAINT "UnitOfAnalysis_creatorId_fkey";';

	END LOOP;
END
$do$
LANGUAGE plpgsql;
