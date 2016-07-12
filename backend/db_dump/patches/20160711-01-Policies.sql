CREATE OR REPLACE FUNCTION public.patch_20160711_01_Policies() RETURNS void AS
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
            'ALTER TABLE "Policies" ' ||
            'ADD COLUMN "startEdit" timestamp with time zone, ' ||
            'ADD COLUMN "editor" integer , ' ||
            'ADD CONSTRAINT "Policies_editor_fkey" FOREIGN KEY ("editor") ' ||
            'REFERENCES "Users" (id) MATCH SIMPLE ' ||
            'ON UPDATE NO ACTION ON DELETE NO ACTION ';
	END LOOP;
END
$BODY$
LANGUAGE plpgsql;

SELECT public.patch_20160711_01_Policies();
DROP FUNCTION IF EXISTS public.patch_20160711_01_Policies();