CREATE OR REPLACE FUNCTION patch_20160511_02_logs() RETURNS void AS
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
		    'ALTER TABLE "Logs" '
            ||'DROP CONSTRAINT IF EXISTS "Logs_user_fkey", '
            ||'DROP CONSTRAINT IF EXISTS "Logs_essence_fkey",
            ||'ADD CONSTRAINT "Logs_essence_fkey" FOREIGN KEY ("essence") REFERENCES "Essences" ("id") ON DELETE SET NULL ON UPDATE NO ACTION,
            ||'ADD CONSTRAINT "Logs_user_fkey" FOREIGN KEY ("user") REFERENCES "Users" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;
            ||'ALTER COLUMN "user" DROP NOT NULL; '
            ||'ALTER TABLE "Logs" RENAME "user" TO "userid"';
	END LOOP;

END
$BODY$
LANGUAGE plpgsql;

SELECT patch_20160511_02_logs();
DROP FUNCTION IF EXISTS public.patch_20160511_02_logs();

