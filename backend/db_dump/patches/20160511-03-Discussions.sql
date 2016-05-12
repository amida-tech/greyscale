CREATE OR REPLACE FUNCTION public.patch_20160511_03_discussions() RETURNS void AS
$BODY$
DECLARE
    schema_name text;
    taskId bigint;
    userId bigint;
    uoaId bigint;
    productId bigint;
    entryId bigint;
    stepId bigint;
    stepIdColumn text;
BEGIN
	FOR schema_name IN
		SELECT pg_catalog.pg_namespace.nspname
		FROM pg_catalog.pg_namespace
		INNER JOIN pg_catalog.pg_user
		ON (pg_catalog.pg_namespace.nspowner = pg_catalog.pg_user.usesysid)
		AND (pg_catalog.pg_user.usename = 'indaba') -- HAVE TO SET CORRECT DB USER
	LOOP
		EXECUTE 'SET search_path TO ' || quote_ident(schema_name);
        RAISE NOTICE 'SET search_path TO %', quote_ident(schema_name);
		EXECUTE 'ALTER TABLE "Discussions" '
		|| 'DROP CONSTRAINT "Discussions_userId_fkey", '
		|| 'ALTER COLUMN "userId" DROP NOT NULL, '
        || 'ADD COLUMN "stepId" int4, '
        || 'ADD FOREIGN KEY ("stepId") REFERENCES "WorkflowSteps" ("id");';
--        RAISE NOTICE 'ALTER TABLE "Discussions" %', 1;

        -- Update stepId for existing records
        -- 1st - get task $ user Ids (and discussion entry Id)
        FOR taskId, userId, entryId IN
            SELECT "taskId", "userId", "id"
            FROM "Discussions"
        LOOP
--            RAISE NOTICE 'taskId %, userId % (discussionId %)', taskId, userId, entryId;
            -- 2nd - get uoa $ product Ids
            FOR uoaId, productId IN
                SELECT "uoaId", "productId"
                FROM "Tasks"
                WHERE "id" = taskId
            LOOP
--                RAISE NOTICE '----- uoaId %, productId %', uoaId, productId;
                -- 3rd - get step Id
                FOR stepId IN
                    SELECT min("stepId")
                    FROM "Tasks"
                    WHERE "productId" = productId
                    AND "uoaId" = uoaId
                    AND "userId" = userId
                LOOP
--                    RAISE NOTICE '===== Update stepId =  %', stepId;
                    EXECUTE 'UPDATE "Discussions" '
                    || 'SET "stepId" = ' || stepId
                    || ' WHERE "id" = ' || entryId;
                END LOOP;
            END LOOP;
        END LOOP;

        EXECUTE 'ALTER TABLE "Discussions" '
        || 'ALTER COLUMN "stepId" SET NOT NULL;';
--        RAISE NOTICE 'ALTER TABLE "Discussions" %', 3;

	END LOOP;
END;
$BODY$
LANGUAGE plpgsql;

SELECT public.patch_20160511_03_discussions();
DROP FUNCTION IF EXISTS public.patch_20160511_03_discussions();

