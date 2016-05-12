CREATE OR REPLACE FUNCTION public.patch_20160406_01_surveyQuestionOptions() RETURNS void AS
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
		    'ALTER TABLE "SurveyQuestionOptions" '
            || ' DROP CONSTRAINT "surveyQuestionOptions_questionId_fkey", '
            || ' ADD CONSTRAINT "surveyQuestionOptions_questionId_fkey" '
            || 'FOREIGN KEY ("questionId") REFERENCES "SurveyQuestions" ("id") ON DELETE CASCADE ON UPDATE CASCADE;';
	END LOOP;

END
$BODY$
LANGUAGE plpgsql;

SELECT public.patch_20160406_01_surveyQuestionOptions();
DROP FUNCTION IF EXISTS public.patch_20160406_01_surveyQuestionOptions();


