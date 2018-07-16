<!-- Don't forget to add a "testorg." prefix before "ProjectUsers" "Users" "Groups" and "ProjectUserGroups" -->

ALTER TABLE "ProjectUsers"
ADD CONSTRAINT "ProjectUsers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;

ALTER TABLE "ProjectUsers"
ADD CONSTRAINT "ProjectUsers_pkey" PRIMARY KEY ("projectId", "userId");

ALTER TABLE "ProjectUserGroups"
ADD CONSTRAINT "ProjectUserGroups_userId_fkey" FOREIGN KEY ("groupId") REFERENCES "Groups" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;

ALTER TABLE "ProjectUserGroups"
ADD CONSTRAINT "ProjectUserGroups_pkey" PRIMARY KEY ("projectId", "groupId");
