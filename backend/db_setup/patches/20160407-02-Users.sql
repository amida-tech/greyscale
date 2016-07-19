CREATE OR REPLACE FUNCTION public.patch_20160407_01_users() RETURNS void AS
$BODY$
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
		EXECUTE
		    'ALTER TABLE "Users" ALTER COLUMN "notifyLevel" SET DEFAULT 2,  ADD COLUMN "salt" varchar';
	END LOOP;
	EXECUTE 'ALTER TABLE public."Users" ALTER COLUMN "notifyLevel" SET DEFAULT 2,  ADD COLUMN "salt" varchar'; -- also for public

END
$BODY$
LANGUAGE plpgsql;

SELECT public.patch_20160407_01_users();
DROP FUNCTION IF EXISTS public.patch_20160407_01_users();


