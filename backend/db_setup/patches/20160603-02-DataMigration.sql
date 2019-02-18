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
            END LOOP;
    END
    $BODY$
    LANGUAGE plpgsql;

    SELECT public.patch_dataMigration();
    DROP FUNCTION IF EXISTS public.patch_dataMigration();
