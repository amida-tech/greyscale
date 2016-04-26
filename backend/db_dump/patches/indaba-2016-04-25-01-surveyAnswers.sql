CREATE OR REPLACE FUNCTION patch_20160425_01_survey_questions() RETURNS void AS
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
		EXECUTE 'ALTER TABLE "SurveyQuestions" ADD COLUMN "withLinks" boolean DEFAULT false';
		EXECUTE 'ALTER TABLE "SurveyAnswers" ADD COLUMN "links" character varying[]';
	END LOOP;

END
$BODY$
LANGUAGE plpgsql;

SELECT patch_20160425_01_survey_questions();
DROP FUNCTION IF EXISTS patch_20160425_01_survey_questions();

