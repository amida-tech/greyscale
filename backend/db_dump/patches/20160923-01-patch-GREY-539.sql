DO
$do$
DECLARE
    schema_name text;
    trigger_sql text;
    db_user constant text := 'indaba'; -- HAVE TO SET CORRECT DB USER
    src_oid          oid;
		qry              text;
BEGIN

    FOR schema_name IN
        SELECT pg_catalog.pg_namespace.nspname
        FROM pg_catalog.pg_namespace
        INNER JOIN pg_catalog.pg_user
        ON (pg_catalog.pg_namespace.nspowner = pg_catalog.pg_user.usesysid)
        AND (pg_catalog.pg_user.usename = db_user)
    LOOP
        RAISE NOTICE 'db_user = %, schema = %', db_user, schema_name;

    -- Check that source_schema exists
        SELECT oid INTO src_oid
            FROM pg_namespace
         WHERE nspname = quote_ident(schema_name);
        IF NOT FOUND
            THEN
            RAISE NOTICE 'source schema % does not exist!', schema_name;
            RETURN ;
        END IF;


        EXECUTE $query$
            SET search_path TO $query$ || schema_name || $query$;
        $query$;

				RAISE NOTICE 'Execute: Delete duplicate';
        EXECUTE $query$
            DELETE FROM "TaskUserStates"
            WHERE "createdAt" NOT IN
            (SELECT MIN("createdAt")
                FROM "TaskUserStates"
                GROUP BY "taskId", "userId", "surveyVersion"
            )
        $query$;

    --  If PK exists - drop it
        PERFORM ''
            FROM pg_constraint ct
            JOIN pg_class rn ON rn.oid = ct.conrelid
         WHERE rn.relname = 'TaskUserStates'
             and connamespace = src_oid
             AND ct.contype = 'p';
        IF FOUND
            THEN
                RAISE NOTICE 'Execute: DROP';
                EXECUTE $query$
                        ALTER TABLE "TaskUserStates"
                        DROP CONSTRAINT "TaskUserStates_pkey"
                $query$;
        END IF;

    -- Add PK
        RAISE NOTICE 'Execute: ADD PK';
        EXECUTE $query$
            ALTER TABLE "TaskUserStates"
            ADD PRIMARY KEY ("taskId", "userId", "surveyVersion")
        $query$;

    END LOOP;

END
$do$
LANGUAGE plpgsql;
