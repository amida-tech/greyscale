ALTER TABLE "UserGroups"
DROP CONSTRAINT "UserGroups_userId_fkey",
ADD CONSTRAINT "UserGroups_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

