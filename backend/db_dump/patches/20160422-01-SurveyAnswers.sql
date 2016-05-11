CREATE OR REPLACE FUNCTION public.patch_20160422_01_SurveyAnswers() RETURNS void AS
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
		    'ALTER TABLE "SurveyQuestions" ADD COLUMN "withLinks" boolean DEFAULT false;'
            ||'ALTER TABLE "SurveyAnswers" ADD COLUMN "links" character varying[];';
	END LOOP;

END
$BODY$
LANGUAGE plpgsql;

SELECT public.patch_20160422_01_SurveyAnswers();
DROP FUNCTION IF EXISTS public.patch_20160422_01_SurveyAnswers();

