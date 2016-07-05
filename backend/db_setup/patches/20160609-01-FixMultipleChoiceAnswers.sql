CREATE OR REPLACE FUNCTION public.patch_20160609_01_FixMultipleChoiceAnswers() RETURNS void AS
$BODY$
DECLARE
    schema_name text;
    answerValue text;
    questionId bigint;
    answerId bigint;
    optionId text;
BEGIN
	FOR schema_name IN
		SELECT pg_catalog.pg_namespace.nspname
		FROM pg_catalog.pg_namespace
		INNER JOIN pg_catalog.pg_user
		ON (pg_catalog.pg_namespace.nspowner = pg_catalog.pg_user.usesysid)
		AND (pg_catalog.pg_user.usename = 'indaba') -- HAVE TO SET CORRECT DB USER
	LOOP
		EXECUTE 'SET search_path TO ' || quote_ident(schema_name);
        RAISE NOTICE 'SET search_path TO %', quote_ident(schema_name);

        FOR answerId, answerValue, questionId IN
            SELECT
                "SurveyAnswers"."id",
                "SurveyAnswers"."value",
                "SurveyAnswers"."questionId"
            FROM
                "SurveyQuestions"
                INNER JOIN "SurveyAnswers" ON "SurveyAnswers"."questionId" = "SurveyQuestions"."id"
                WHERE "SurveyQuestions"."type" = 3
        LOOP
            IF answerValue IS NOT NULL AND answerValue <> ''
              THEN
                RAISE NOTICE '--- SurveyAnswer for "multiple choice" question id = % with value = %', questionId, answerValue;
              -- Get optionId
                FOR optionId IN
                    SELECT
                        "SurveyQuestionOptions"."id"
                    FROM
                        "SurveyQuestionOptions"
                    WHERE "questionId" = questionId
                    AND "value" = answerValue
                LOOP
                    RAISE NOTICE '===== Update Answer with id =  % ==== Set optionId to {%}', answerId, optionId;
                    EXECUTE 'UPDATE "SurveyAnswers" '
                    || 'SET "optionId" = ' || quote_literal('{' || optionId || '}')
                    || ' WHERE "id" = ' || answerId;
                END LOOP;

            END IF;

        END LOOP;
	END LOOP;
END;
$BODY$
LANGUAGE plpgsql;

SELECT public.patch_20160609_01_FixMultipleChoiceAnswers();
DROP FUNCTION IF EXISTS public.patch_20160609_01_FixMultipleChoiceAnswers();

