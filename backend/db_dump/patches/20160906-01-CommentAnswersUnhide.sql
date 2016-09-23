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
            UPDATE "Comments" SET "isHidden" = false
            WHERE "Comments"."parentId" IS NOT NULL
            AND "Comments".activated = true
            AND "Comments"."isHidden" = true
            AND "Comments"."parentId" in
            (
            SELECT "Comments"."id" FROM "Comments"
            WHERE "Comments".activated = true
            AND "Comments"."isHidden" = false
            )
            RETURNING "id"
        $query$;

    END LOOP;

END
$do$
LANGUAGE plpgsql;
