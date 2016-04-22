SET search_path TO google; -- need to patch all the schemas excluding public
ALTER TABLE "SurveyQuestions" ADD COLUMN "withLinks" boolean DEFAULT false;
ALTER TABLE "SurveyAnswers" ADD COLUMN "links" character varying[];