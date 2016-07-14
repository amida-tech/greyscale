CREATE OR REPLACE FUNCTION public.patch_20160701_01_WorkflowTemplates() RETURNS void AS
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
		EXECUTE 'CREATE TABLE "WorkflowTemplates" '
            || '( '
            || '  id serial NOT NULL, '
              || 'body json, '
              || 'CONSTRAINT "WorkflowTemplates_pkey" PRIMARY KEY (id) '
            || ') '
            || 'WITH ( '
            || '  OIDS=FALSE '
            || '); '
            || 'ALTER TABLE "WorkflowTemplates" '
            || '  OWNER TO indaba; '; -- HAVE TO SET CORRECT DB USER
	END LOOP;
END
$BODY$
LANGUAGE plpgsql;

SELECT public.patch_20160701_01_WorkflowTemplates();
DROP FUNCTION IF EXISTS public.patch_20160701_01_WorkflowTemplates();
