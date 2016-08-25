DO
$do$
DECLARE
    schema_name text;
    trigger_sql text;
    db_user constant text := 'indaba'; -- HAVE TO SET CORRECT DB USER
BEGIN
	FOR schema_name IN
		SELECT pg_catalog.pg_namespace.nspname
		FROM pg_catalog.pg_namespace
		INNER JOIN pg_catalog.pg_user
		ON (pg_catalog.pg_namespace.nspowner = pg_catalog.pg_user.usesysid)
		AND (pg_catalog.pg_user.usename = db_user)
    LOOP
        RAISE NOTICE 'db_user = %, schema = %', db_user, schema_name;

        EXECUTE $query$
            SET search_path TO $query$ || schema_name || $query$;

            CREATE TABLE "SurveyMeta"
            (
              "surveyId" integer NOT NULL,
              "productId" integer NOT NULL,
              "editor" integer,
              "startEdit" timestamp with time zone,
              "socketId" character varying,
              CONSTRAINT "SurveyLocks_pkey" PRIMARY KEY ("surveyId"),
              CONSTRAINT "SurveyMeta_productId_fkey" FOREIGN KEY ("productId")
                  REFERENCES "Products" (id) MATCH SIMPLE
                  ON UPDATE NO ACTION ON DELETE NO ACTION,
              CONSTRAINT "SurveyMeta_productId_key" UNIQUE ("productId")
            )
            WITH (
              OIDS=FALSE
            );
            ALTER TABLE "SurveyMeta"
              OWNER TO $query$ || db_user || $query$;


            ALTER TABLE "Surveys"
                ADD COLUMN "creator" integer,
                --ADD COLUMN "created" timestamp without time zone NOT NULL DEFAULT now(),
                ADD COLUMN "surveyVersion" integer NOT NULL DEFAULT 0,
                --ADD COLUMN "productId" integer,
                DROP COLUMN "projectId",

--                ADD CONSTRAINT "Surveys_productId_fkey" FOREIGN KEY ("productId")
--                    REFERENCES "Products" (id) MATCH SIMPLE
--                    ON UPDATE NO ACTION ON DELETE NO ACTION,

                ADD CONSTRAINT "Surveys_creator_fkey" FOREIGN KEY ("creator")
                    REFERENCES "Users" (id) MATCH SIMPLE
                    ON UPDATE NO ACTION ON DELETE NO ACTION;

            INSERT INTO "SurveyMeta" ("surveyId", "productId") (
                SELECT DISTINCT ON ("surveyId") "surveyId",id FROM "Products" WHERE "Products"."surveyId" IS NOT NULL
            );

            ALTER TABLE "Products"
                ADD COLUMN "organizationId" integer,
                ADD CONSTRAINT "Surveys_organizationId_fkey" FOREIGN KEY ("organizationId")
                    REFERENCES "Organizations" (id) MATCH SIMPLE
                    ON UPDATE NO ACTION ON DELETE NO ACTION;

            UPDATE "Products" SET "organizationId" = (
                SELECT "Organizations".id
                FROM "Projects"
                JOIN "Organizations"
                ON "Projects"."organizationId" = "Organizations".id
                WHERE "Projects".id = "Products"."projectId"
            );

            -- DROP OLD LINKS TO SURVEY TABLE
            ALTER TABLE "Products"
                DROP COLUMN "surveyId",
                DROP COLUMN "projectId",
                DROP COLUMN "originalLangId";
            DROP TABLE "Projects"; -- legacy table
            ALTER TABLE "SurveyAnswers" DROP CONSTRAINT "SurveyAnswers_surveyId_fkey";
            ALTER TABLE "SurveyQuestions" DROP CONSTRAINT "SurveyQuestions_surveyId_fkey";

            ALTER TABLE "Surveys"
                DROP CONSTRAINT "Surveys_pkey", -- DROP OLD PK
                ADD CONSTRAINT "Surveys_pkey" PRIMARY KEY (id, "surveyVersion"); -- CREATE NEW COMPOSITE PK

            ALTER TABLE "Policies"
                ADD COLUMN "surveyId" integer,
                ADD COLUMN "surveyVersion" integer NOT NULL DEFAULT 0,
                ADD CONSTRAINT "Policies_surveyId_version_fkey" FOREIGN KEY ("surveyId","surveyVersion")
                    REFERENCES "Surveys" ("id","surveyVersion") MATCH SIMPLE
                    ON UPDATE NO ACTION ON DELETE NO ACTION;

            UPDATE "Policies" SET "surveyId" = (
                SELECT id FROM "Surveys" WHERE "policyId" = "Policies".id LIMIT 1)
            ;

            ALTER TABLE "Surveys" DROP COLUMN "policyId";

            ALTER TABLE "SurveyQuestions"
                ADD COLUMN "surveyVersion" integer NOT NULL DEFAULT 0,
                ALTER COLUMN id SET NOT NULL,
                ADD CONSTRAINT "SurveyQuestions_surveyId_fkey" FOREIGN KEY ("surveyId", "surveyVersion")
                    REFERENCES "Surveys" (id, "surveyVersion") MATCH SIMPLE
                    ON UPDATE NO ACTION ON DELETE NO ACTION;

            -- DROP OLD LINKS TO SURVEY QUESTION TABLE

            ALTER TABLE "Comments"
                ADD COLUMN "surveyVersion" integer NOT NULL DEFAULT 0,
                DROP CONSTRAINT "Comments_questionId_fkey";

            ALTER TABLE "Discussions"
                ADD COLUMN "surveyVersion" integer NOT NULL DEFAULT 0,
                DROP CONSTRAINT "Discussions_questionId_fkey";

            ALTER TABLE "IndexQuestionWeights"
                ADD COLUMN "surveyVersion" integer NOT NULL DEFAULT 0,
                DROP CONSTRAINT "IndexQuestionWeights_questionId_fkey";

            ALTER TABLE "SubindexWeights"
                ADD COLUMN "surveyVersion" integer NOT NULL DEFAULT 0,
                DROP CONSTRAINT "SubindexWeights_questionId_fkey";

            ALTER TABLE "SurveyAnswers"
                ADD COLUMN "surveyVersion" integer NOT NULL DEFAULT 0,
                DROP CONSTRAINT "SurveyAnswers_questionId_fkey";

            ALTER TABLE "SurveyQuestionOptions"
                ADD COLUMN "surveyVersion" integer NOT NULL DEFAULT 0,
                DROP CONSTRAINT "surveyQuestionOptions_questionId_fkey";



            ALTER TABLE "SurveyQuestions"
                DROP CONSTRAINT "SurveyQuestions_pkey", -- DROP OLD PK
                ADD CONSTRAINT "SurveyQuestions_pkey" PRIMARY KEY (id, "surveyVersion"); -- CREATE NEW COMPOSITE PK

            -- CREATE NEW COMPOSITE FOREIGN KEYS FOR TABLES LINKED WITH SURVEY QUESTIONS

            ALTER TABLE "Comments"
                ADD CONSTRAINT "Comments_questionId_surveyVersion_fkey" FOREIGN KEY ("questionId", "surveyVersion")
                    REFERENCES "SurveyQuestions" (id, "surveyVersion") MATCH SIMPLE
                    ON UPDATE NO ACTION ON DELETE NO ACTION;

            ALTER TABLE "Discussions"
                ADD CONSTRAINT "Discussions_questionId_surveyVersion_fkey" FOREIGN KEY ("questionId", "surveyVersion")
                    REFERENCES "SurveyQuestions" (id, "surveyVersion") MATCH SIMPLE
                    ON UPDATE NO ACTION ON DELETE NO ACTION;

            ALTER TABLE "IndexQuestionWeights"
                ADD CONSTRAINT "IndexQuestionWeights_questionId_surveyVersion_fkey" FOREIGN KEY ("questionId", "surveyVersion")
                    REFERENCES "SurveyQuestions" (id, "surveyVersion") MATCH SIMPLE
                    ON UPDATE NO ACTION ON DELETE NO ACTION;

            ALTER TABLE "SubindexWeights"
                ADD CONSTRAINT "SubindexWeights_questionId_surveyVersion_fkey" FOREIGN KEY ("questionId", "surveyVersion")
                    REFERENCES "SurveyQuestions" (id, "surveyVersion") MATCH SIMPLE
                    ON UPDATE NO ACTION ON DELETE NO ACTION;

            ALTER TABLE "SurveyAnswers"
                ADD CONSTRAINT "SurveyAnswers_questionId_surveyVersion_fkey" FOREIGN KEY ("questionId", "surveyVersion")
                    REFERENCES "SurveyQuestions" (id, "surveyVersion") MATCH SIMPLE
                    ON UPDATE NO ACTION ON DELETE NO ACTION;

            ALTER TABLE "SurveyQuestionOptions"
                ADD CONSTRAINT "SurveyQuestionOptions_questionId_surveyVersion_fkey" FOREIGN KEY ("questionId", "surveyVersion")
                    REFERENCES "SurveyQuestions" (id, "surveyVersion") MATCH SIMPLE
                    ON UPDATE NO ACTION ON DELETE NO ACTION;

            -- ADD version column to attachments

            ALTER TABLE "AttachmentLinks"
                ADD COLUMN "version" integer NOT NULL DEFAULT 0,
                DROP CONSTRAINT IF EXISTS  "AttachmentLinks_pkey",
                ADD CONSTRAINT "AttachmentLinks_pkey" PRIMARY KEY ("essenceId", "entityId", version),
                ADD CONSTRAINT "AttachmentLinks_essenceId_entityId_version_key" UNIQUE ("essenceId", "entityId", "version");

            -- CREATE TRIGGER ON INSERT FOR SURVEYS TO CONTROL SURVEY ID AND VERSION

            CREATE OR REPLACE FUNCTION generate_survey_pk()
                RETURNS trigger AS
                $BODY$
                    DECLARE
                        _rel_id int;
                        _quest_id int;
                        _version int;
                    BEGIN

                    SELECT oid
                    INTO _rel_id
                    FROM pg_class
                    WHERE relname = 'Surveys'
                    AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = '$query$||schema_name||$query$');

                    IF NEW.id IS NOT NULL THEN
                        PERFORM pg_advisory_xact_lock(_rel_id, NEW.id);

                        IF NEW."surveyVersion" <> -1 THEN
                            SELECT  COALESCE(MAX("surveyVersion") + 1, 1)
                            INTO    NEW."surveyVersion"
                            FROM    "Surveys"
                            WHERE id = NEW.id;
                        END IF;
                    ELSE
                        PERFORM pg_advisory_xact_lock(_rel_id);
                        NEW."surveyVersion" := 0;

                        SELECT  COALESCE(MAX(id) + 1, 1)
                        INTO    NEW.id
                        FROM    $query$ || schema_name || $query$."Surveys";
                    END IF;

                    RETURN NEW;
                    END;
                $BODY$
                LANGUAGE plpgsql VOLATILE STRICT
                COST 100;
                ALTER FUNCTION generate_survey_pk() OWNER TO $query$ || db_user || $query$;

                CREATE TRIGGER generate_survey_pk
                    BEFORE INSERT
                    ON "Surveys"
                    FOR EACH ROW
                    EXECUTE PROCEDURE generate_survey_pk();

            -- CREATE TRIGGER ON INSERT FOR QUESTIONS TO CONTROL QUESTION ID

            CREATE OR REPLACE FUNCTION generate_question_pk()
                RETURNS trigger AS
                $BODY$
                    DECLARE
                        _rel_id int;
                        _quest_id int;
                        _version int;
                    BEGIN
                    IF NEW."surveyVersion" IS NULL THEN
                        NEW."surveyVersion" := 0;
                    END IF;

                    SELECT oid
                    INTO _rel_id
                    FROM pg_class
                    WHERE relname = 'SurveyQuestions'
                    AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = '$query$||schema_name||$query$');

                    IF NEW.id IS NOT NULL THEN
                        IF NOT EXISTS (
                            SELECT  id FROM $query$ || schema_name || $query$."SurveyQuestions"
                        ) THEN
                            RAISE EXCEPTION 'id not allowed %', NEW.id;
                        END IF;
                    ELSE
                        PERFORM pg_advisory_xact_lock(_rel_id);

                        SELECT  COALESCE(MAX(id) + 1, 1)
                        INTO    NEW.id
                        FROM    $query$ || schema_name || $query$."SurveyQuestions";
                    END IF;

                    RETURN NEW;
                    END;
                $BODY$
                LANGUAGE plpgsql VOLATILE STRICT
                COST 100;
                ALTER FUNCTION generate_question_pk() OWNER TO $query$ || db_user || $query$;

                CREATE TRIGGER generate_question_pk
                    BEFORE INSERT
                    ON "SurveyQuestions"
                    FOR EACH ROW
                    EXECUTE PROCEDURE generate_question_pk();
        $query$;

         -- delete sequence to prevent autoincrement for survey id
        DROP SEQUENCE IF EXISTS "JSON_id_seq" CASCADE; -- messy name, but true
        -- delete sequence to prevent autoincrement for question id
        DROP SEQUENCE IF EXISTS "SurveyQuestions_id_seq" CASCADE;

    END LOOP;

END
$do$
LANGUAGE plpgsql;
