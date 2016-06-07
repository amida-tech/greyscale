CREATE OR REPLACE FUNCTION patch_20160506_02_surveys() RETURNS void AS
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

		EXECUTE 'ALTER TABLE "Surveys" ADD COLUMN "policyId" integer';
		EXECUTE 'ALTER TABLE "Surveys" ADD CONSTRAINT "Surveys_policyId_fkey" FOREIGN KEY ("policyId")'
                 || 'REFERENCES "Policies" (id) MATCH SIMPLE'
                 || 'ON UPDATE NO ACTION ON DELETE NO ACTION';
    END LOOP;

END
$BODY$
LANGUAGE plpgsql;

SELECT patch_20160506_02_surveys();
DROP FUNCTION IF EXISTS public.patch_20160506_02_surveys();

