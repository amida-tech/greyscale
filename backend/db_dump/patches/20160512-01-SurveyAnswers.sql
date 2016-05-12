CREATE OR REPLACE FUNCTION public.patch_20160512_01_surveyAnswers() RETURNS void AS
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
		EXECUTE 'ALTER TABLE "SurveyAnswers" ADD COLUMN "updated" timestamp with time zone';
	END LOOP;

END
$BODY$
LANGUAGE plpgsql;

SELECT public.patch_20160512_01_surveyAnswers();
DROP FUNCTION IF EXISTS public.patch_20160512_01_surveyAnswers();

