CREATE OR REPLACE FUNCTION patch_20160530_01_comments() RETURNS void AS
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

		EXECUTE 'ALTER TABLE "Comments"'
|| ' ADD COLUMN "tags" varchar,'
|| ' ADD COLUMN "range" varchar;';

        END LOOP;

END
$BODY$
LANGUAGE plpgsql;

SELECT patch_20160530_01_comments();
DROP FUNCTION IF EXISTS public.patch_20160530_01_comments();
