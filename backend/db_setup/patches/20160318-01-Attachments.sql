ALTER TABLE "SurveyAnswers" ADD COLUMN "attachments" integer[];
UPDATE "SurveyAnswers" SET "attachments" = array((
SELECT "AnswerAttachments"."id" FROM "AnswerAttachments" WHERE "answerId" = "SurveyAnswers"."id"
))