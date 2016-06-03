CREATE OR REPLACE FUNCTION public.patch_20160603_02_dataMigration() RETURNS void AS
$BODY$
DECLARE
    schema_name text;
    new
BEGIN
	FOR schema_name IN
		SELECT pg_catalog.pg_namespace.nspname
		FROM pg_catalog.pg_namespace
		INNER JOIN pg_catalog.pg_user
		ON (pg_catalog.pg_namespace.nspowner = pg_catalog.pg_user.usesysid)
		AND (pg_catalog.pg_user.usename = 'indaba') -- HAVE TO SET CORRECT DB USER'
	LOOP
		EXECUTE 'SET search_path TO ' || quote_ident(schema_name);
		EXECUTE 'INSERT INTO "AttachmentLinks" ("essenceId", "entityId") ' ||
        	'SELECT ' ||
        		''(SELECT "id" FROM "Essences" WHERE "tableName" = 'SurveyAnswers') as essenceId, ' ||
        		''"id" as entityId ' ||
        	'FROM "SurveyAnswers" ' ||
        	'WHERE array_upper(attachments, 1) is not null; ';

        	--SET search_path TO google;

            --SELECT
            --(SELECT "id" FROM "Essences" WHERE "tableName" = 'SurveyAnswers'),
            --""
           -- FROM "AnswerAttachments"



	END LOOP;
END
$BODY$
LANGUAGE plpgsql;

SELECT public.patch_20160603_02_dataMigration();
DROP FUNCTION IF EXISTS public.patch_20160603_02_dataMigration();


