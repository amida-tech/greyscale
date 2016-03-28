ALTER TABLE "public"."Discussions"
DROP CONSTRAINT "Discussions_userFromId_fkey",
ADD CONSTRAINT "Discussions_userFromId_fkey" FOREIGN KEY ("userFromId") REFERENCES "public"."Users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

