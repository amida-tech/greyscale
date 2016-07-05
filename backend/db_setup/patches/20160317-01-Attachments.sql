ALTER TABLE "AnswerAttachments"
ADD COLUMN "created" timestamp with time zone NOT NULL DEFAULT now(),
ADD COLUMN "owner" integer,
ADD CONSTRAINT "AnswerAttachments_owner_fkey" FOREIGN KEY ("owner")
      REFERENCES "Users" (id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE NO ACTION