DO $$
DECLARE  qry              text;
BEGIN
  RAISE NOTICE 'Current schema: %', current_schema;

--  change FK constraint
  qry := 'ALTER TABLE ' || quote_ident(current_schema) || '."SurveyQuestionOptions"'
                          || ' DROP CONSTRAINT "surveyQuestionOptions_questionId_fkey", ' 
                          || ' ADD CONSTRAINT "surveyQuestionOptions_questionId_fkey" ' 
                          || 'FOREIGN KEY ("questionId") REFERENCES '|| quote_ident(current_schema) ||'."SurveyQuestions" ("id") ON DELETE CASCADE ON UPDATE CASCADE;';
  RAISE NOTICE '%', qry;
  EXECUTE qry;

END $$;
