CREATE OR REPLACE FUNCTION public.patch_dataMigration() RETURNS void AS
    $BODY$
    DECLARE
        old_id int;
        new_id int;
        filename text;
        size int;
        mimetype text;
        body bytea;
        created timestamp;
        owner int;
        amazonKey text;
        answer_id int;
        schema_name text;
    BEGIN
    	FOR schema_name IN
        		SELECT pg_catalog.pg_namespace.nspname
        		FROM pg_catalog.pg_namespace
        		INNER JOIN pg_catalog.pg_user
        		ON (pg_catalog.pg_namespace.nspowner = pg_catalog.pg_user.usesysid)
        		AND (pg_catalog.pg_user.usename = 'indaba') -- HAVE TO SET CORRECT DB USER'
        	LOOP
        		EXECUTE 'SET search_path TO ' || quote_ident(schema_name);


                ALTER TABLE "Attachments" ADD COLUMN "amazonKey" character varying; -- add new column to Attachments table

                -- copy all links to AttachmentLinks with empty attachments array
                INSERT INTO "AttachmentLinks" ("essenceId", "entityId", "attachments")
                    SELECT
                        (SELECT "id" FROM "Essences" WHERE "tableName" = 'SurveyAnswers') as essenceId,
                        "id" as entityId,
                        ARRAY[]::integer[]
                    FROM "SurveyAnswers"
                    WHERE array_upper(attachments, 1) is not null;

                -- copy attachment links (from universal table) to AttachmentLinks table
                INSERT INTO "AttachmentLinks" ("essenceId", "entityId", "attachments")
                    SELECT
                        "essenceId",
                        "entityId",
                        array_agg("id")
                    FROM "Attachments"
                    GROUP BY "essenceId","entityId";

                ALTER TABLE "Attachments" DROP COLUMN "essenceId", DROP COLUMN "entityId"; -- DROP "essenceId" and "entityId" columns, now they are in "AttachmentLinks"

                FOR old_id, filename, size, mimetype, body, created, owner, amazonKey IN
                    SELECT
                        aa."id", aa."filename",aa."size",aa."mimetype",aa."body",
                        aa."created",aa."owner",aa."amazonKey"
                    FROM "AnswerAttachments" aa
                LOOP
                    FOR new_id IN
                        INSERT INTO "Attachments" (
                            "filename",
                            "size",
                            "mimetype",
                            "body",
                            "created",
                            "owner",
                            "amazonKey"
                        )
                        VALUES (

                            filename,
                            size,
                            mimetype,
                            body,
                            created,
                            owner,
                            amazonKey

                        ) RETURNING id
                    LOOP
                    RAISE NOTICE 'SELECT sa."id" FROM "SurveyAnswers" sa WHERE sa.attachments @> ARRAY[%]', old_id;
                        FOR answer_id IN
                            SELECT sa."id" FROM "SurveyAnswers" sa WHERE sa.attachments @> ARRAY[old_id]
                        LOOP
                        UPDATE "AttachmentLinks" SET attachments = array_append(attachments, new_id) WHERE "entityId" = answer_id AND "essenceId" IN
                            (SELECT "id" FROM "Essences" WHERE "tableName" = 'SurveyAnswers');
                            RAISE NOTICE 'UPDATE "AttachmentLinks" SET attachments = array_append(attachments, new_id) WHERE "entityId" = % AND "essenceId" IN
                            (SELECT "id" FROM "Essences" WHERE "tableName" =''SurveyAnswers'')', answer_id;
                        END LOOP;

                    END LOOP;
                END LOOP;
            END LOOP;
    END
    $BODY$
    LANGUAGE plpgsql;

    SELECT public.patch_dataMigration();
    DROP FUNCTION IF EXISTS public.patch_dataMigration();