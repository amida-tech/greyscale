SET search_path TO schema; --need to execute for all schemas
ALTER TABLE "SurveyQuestions" ADD COLUMN "hasComments" boolean NOT NULL DEFAULT false;
ALTER TABLE "SurveyAnswers" ADD COLUMN "answerComment" character varying;