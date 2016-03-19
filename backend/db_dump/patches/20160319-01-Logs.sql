ALTER TABLE "public"."Logs"
ADD COLUMN "result" varchar;

ALTER TABLE "public"."Essences"
ALTER COLUMN "name" SET NOT NULL;

--DROP INDEX "Essences_upper_idx";

CREATE UNIQUE INDEX "Essences_upper_idx" ON "Essences" (upper(name::text));
