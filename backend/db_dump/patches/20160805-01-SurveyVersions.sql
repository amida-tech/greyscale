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
        EXECUTE 'SET search_path TO ' || quote_ident(schema_name);

        EXECUTE 'CREATE TABLE "SurveyVersions"'
               ||' ('
               ||'   id serial NOT NULL,'
               ||'   "surveyId" integer,'
               ||'   created timestamp without time zone NOT NULL DEFAULT now(),'
               ||'   author integer,'
               ||'   version integer NOT NULL DEFAULT 0,'
               ||'   CONSTRAINT "SurveyVersions_pkey" PRIMARY KEY (id),'
               ||'   CONSTRAINT "SurveyVersions_author_fkey" FOREIGN KEY (author)'
               ||'       REFERENCES "Users" (id) MATCH SIMPLE'
               ||'       ON UPDATE NO ACTION ON DELETE NO ACTION,'
               ||'   CONSTRAINT "SurveyVersions_surveyId_fkey" FOREIGN KEY ("surveyId")'
               ||'       REFERENCES "Surveys" (id) MATCH SIMPLE'
               ||'       ON UPDATE NO ACTION ON DELETE NO ACTION,'
               ||'   CONSTRAINT "SurveyVersions_surveyId_version_key" UNIQUE ("surveyId", version)'
               ||' )'
               ||' WITH ('
               ||'   OIDS=FALSE'
               ||' );'
               ||' ALTER TABLE "SurveyVersions"'
               ||'   OWNER TO ' || db_user;

        -- Fill the SurveyVersions table
        EXECUTE 'INSERT INTO "SurveyVersions" ("surveyId", "version")'
              || ' SELECT  a.id, 0'
              || ' FROM "Surveys" a'
              || ' LEFT JOIN "SurveyVersions" b'
              || ' ON a."id" = b."surveyId" AND b.version = 0'
              || ' WHERE b.id IS NULL';


        -- Set new unique key for questions: id + surveyVersion (after need to delete old pk and autoincrement sequence)
        EXECUTE 'ALTER TABLE "SurveyQuestions" '
                || 'ADD COLUMN "surveyVersion" integer NOT NULL DEFAULT 0,'
                || 'ALTER COLUMN id SET NOT NULL,'
                || 'ADD CONSTRAINT "SurveyQuestions_id_surveyVersion_key" UNIQUE (id, "surveyVersion")';

        -- Set new composite foreign key for comments (questionId + surveyVersion instead of just question id)
        EXECUTE 'ALTER TABLE "Comments" '
                || 'ADD COLUMN "surveyVersion" integer NOT NULL DEFAULT 0, '
                || 'ADD CONSTRAINT "Comments_questionId_surveyVersion_fkey" FOREIGN KEY ("questionId", "surveyVersion")'
                || '          REFERENCES "SurveyQuestions" (id, "surveyVersion") MATCH SIMPLE'
                || '          ON UPDATE NO ACTION ON DELETE NO ACTION,'
                || 'DROP CONSTRAINT "Comments_questionId_fkey";';

        -- Set new composite foreign key for discussions (questionId + surveyVersion instead of just question id)
        EXECUTE 'ALTER TABLE "Discussions" '
                || 'ADD COLUMN "surveyVersion" integer NOT NULL DEFAULT 0, '
                || 'ADD CONSTRAINT "Discussions_questionId_surveyVersion_fkey" FOREIGN KEY ("questionId", "surveyVersion")'
                || '          REFERENCES "SurveyQuestions" (id, "surveyVersion") MATCH SIMPLE'
                || '          ON UPDATE NO ACTION ON DELETE NO ACTION,'
                || 'DROP CONSTRAINT "Discussions_questionId_fkey";';

        -- Set new composite foreign key for IndexQuestionWeights (questionId + surveyVersion instead of just question id)
        EXECUTE 'ALTER TABLE "IndexQuestionWeights" '
                || 'ADD COLUMN "surveyVersion" integer NOT NULL DEFAULT 0, '
                || 'ADD CONSTRAINT "IndexQuestionWeights_questionId_surveyVersion_fkey" FOREIGN KEY ("questionId", "surveyVersion")'
                || '          REFERENCES "SurveyQuestions" (id, "surveyVersion") MATCH SIMPLE'
                || '          ON UPDATE NO ACTION ON DELETE NO ACTION,'
                || 'DROP CONSTRAINT "IndexQuestionWeights_questionId_fkey";';

        -- Set new composite foreign key for SubindexWeights (questionId + surveyVersion instead of just question id)
        EXECUTE 'ALTER TABLE "SubindexWeights" '
                || 'ADD COLUMN "surveyVersion" integer NOT NULL DEFAULT 0, '
                || 'ADD CONSTRAINT "SubindexWeights_questionId_surveyVersion_fkey" FOREIGN KEY ("questionId", "surveyVersion")'
                || '          REFERENCES "SurveyQuestions" (id, "surveyVersion") MATCH SIMPLE'
                || '          ON UPDATE NO ACTION ON DELETE NO ACTION,'
                || 'DROP CONSTRAINT "SubindexWeights_questionId_fkey";';

        -- Set new composite foreign key for SurveyAnswers (questionId + surveyVersion instead of just question id)
        EXECUTE 'ALTER TABLE "SurveyAnswers" '
                || 'ADD COLUMN "surveyVersion" integer NOT NULL DEFAULT 0, '
                || 'ADD CONSTRAINT "SurveyAnswers_questionId_surveyVersion_fkey" FOREIGN KEY ("questionId", "surveyVersion")'
                || '          REFERENCES "SurveyQuestions" (id, "surveyVersion") MATCH SIMPLE'
                || '          ON UPDATE NO ACTION ON DELETE NO ACTION,'
                || 'DROP CONSTRAINT "SurveyAnswers_questionId_fkey";';

        -- Set new composite foreign key for SurveyAnswers (questionId + surveyVersion instead of just question id)
        EXECUTE 'ALTER TABLE "SurveyQuestionOptions" '
                || 'ADD COLUMN "surveyVersion" integer NOT NULL DEFAULT 0, '
                || 'ADD CONSTRAINT "SurveyQuestionOptions_questionId_surveyVersion_fkey" FOREIGN KEY ("questionId", "surveyVersion")'
                || '          REFERENCES "SurveyQuestions" (id, "surveyVersion") MATCH SIMPLE'
                || '          ON UPDATE NO ACTION ON DELETE NO ACTION,'
                || 'DROP CONSTRAINT "surveyQuestionOptions_questionId_fkey";';

        EXECUTE 'DROP SEQUENCE IF EXISTS "SurveyQuestions_id_seq" CASCADE';

        EXECUTE 'ALTER TABLE "SurveyQuestions" '
        || 'DROP CONSTRAINT "SurveyQuestions_pkey", '
        || 'ADD CONSTRAINT "SurveyQuestion_surveyId_version_fkey" FOREIGN KEY ("surveyId", "surveyVersion")'
                           || '          REFERENCES "SurveyVersions" ("surveyId", "version") MATCH SIMPLE'
                           || '          ON UPDATE NO ACTION ON DELETE NO ACTION,'
        || 'ADD CONSTRAINT "SurveyQuestions_pkey" PRIMARY KEY (id, "surveyVersion")';

    trigger_sql :=
    	$functionquery$
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
            	AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = '$functionquery$||schema_name||$functionquery$');

            	IF NEW.id IS NOT NULL THEN
            		IF NOT EXISTS (
            			SELECT  id FROM $functionquery$||schema_name||$functionquery$."SurveyQuestions" WHERE id = NEW.id AND "surveyVersion" = 0
            		) THEN
            			RAISE EXCEPTION 'id not allowed %', NEW.id;
            		END IF;
            	ELSE
            		PERFORM pg_advisory_xact_lock(_rel_id);

            		SELECT  COALESCE(MAX(id) + 1, 1)
            		INTO    NEW.id
            		FROM    $functionquery$||schema_name||$functionquery$."SurveyQuestions";


            	END IF;

                RETURN NEW;
            END;
            $BODY$
              LANGUAGE plpgsql VOLATILE STRICT
              COST 100;
            ALTER FUNCTION generate_question_pk()
              OWNER TO $functionquery$||db_user||$functionquery$;



            CREATE TRIGGER generate_question_pk
                       BEFORE INSERT
                       ON "SurveyQuestions"
                       FOR EACH ROW
                       EXECUTE PROCEDURE generate_question_pk();
    	$functionquery$;

    	EXECUTE trigger_sql;

    END LOOP;

END
$do$
LANGUAGE plpgsql;
