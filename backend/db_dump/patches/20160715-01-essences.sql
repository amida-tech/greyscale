CREATE OR REPLACE FUNCTION patch_20160715_01_essences() RETURNS void AS
$BODY$
DECLARE
    schema_name text;
BEGIN
	FOR schema_name IN
		SELECT pg_catalog.pg_namespace.nspname
		FROM pg_catalog.pg_namespace
		INNER JOIN pg_catalog.pg_user
		ON (pg_catalog.pg_namespace.nspowner = pg_catalog.pg_user.usesysid)
		AND ((pg_catalog.pg_user.usename = 'indaba') -- HAVE TO SET CORRECT DB USER
			OR (pg_catalog.pg_namespace.nspname = 'public')
		)

		LOOP
		EXECUTE 'SET search_path TO ' || quote_ident(schema_name);

		EXECUTE 'UPDATE "Essences" SET "tableName"=''WorkflowSteps'' WHERE ("name"=''WorkflowSteps'');';
		EXECUTE 'UPDATE "Essences" SET "tableName"=''WorkflowStepGroups'' WHERE ("name"=''WorkflowStepGroups'');';

    END LOOP;

END
$BODY$
LANGUAGE plpgsql;

SELECT patch_20160715_01_essences();
DROP FUNCTION IF EXISTS public.patch_20160715_01_essences();
