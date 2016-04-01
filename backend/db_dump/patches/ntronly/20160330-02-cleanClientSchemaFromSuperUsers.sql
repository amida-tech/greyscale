SET search_path TO 'yandex';

DELETE FROM "Logs" WHERE "user" IN (SELECT "id" FROM "Users" WHERE "roleID" = 1);
UPDATE "Projects" SET "adminUserId" = NULL WHERE "adminUserId" IN (SELECT "id" FROM "Users" WHERE "roleID" = 1);
UPDATE "UnitOfAnalysis" SET "creatorId" = (SELECT "id" FROM "Users" WHERE "roleID"=2 LIMIT 1);
UPDATE "UnitOfAnalysis" SET "ownerId" = (SELECT "id" FROM "Users" WHERE  "roleID"=2 LIMIT 1);
DROP TABLE IF EXISTS "EssenceRoles";
DROP TABLE IF EXISTS "Token";
DROP TABLE IF EXISTS "SurveyAnswerVersions";

DELETE FROM "AnswerAttachments" WHERE "owner" IN (SELECT "id" FROM "Users" WHERE "roleID" = 1);

DELETE FROM "Tasks" WHERE "userId" IN (SELECT "id" FROM "Users" WHERE "roleID" = 1);

DELETE FROM "Tasks" WHERE "userId" IN (SELECT "id" FROM "Users" WHERE "roleID" = 1);

DELETE FROM "Discussions" WHERE "userId" IN (SELECT "id" FROM "Users" WHERE "roleID" = 1);

DELETE FROM "SurveyAnswers" WHERE "userId" IN (SELECT "id" FROM "Users" WHERE "roleID" = 1);

DELETE FROM "Users" WHERE "roleID" = 1;