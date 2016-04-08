SET search_path to schema; --need to execute for all schemas, incl. public
ALTER TABLE "Users"
ALTER COLUMN "notifyLevel" SET DEFAULT 2;
