CREATE OR REPLACE FUNCTION patch_20160506_01_policies() RETURNS void AS
$BODY$
DECLARE
    schema_name text;
BEGIN
	FOR schema_name IN
		SELECT pg_catalog.pg_namespace.nspname
		FROM pg_catalog.pg_namespace
		INNER JOIN pg_catalog.pg_user
		ON (pg_catalog.pg_namespace.nspowner = pg_catalog.pg_user.usesysid)
		AND (pg_catalog.pg_user.usename = 'indaba') -- HAVE TO SET CORRECT DB USER
	LOOP
		EXECUTE 'SET search_path TO ' || quote_ident(schema_name);

		EXECUTE 'CREATE TABLE "Policies"'
        || '('
        || '  id serial NOT NULL,'
        || 'section character varying,'
        || 'subsection character varying,'
        || 'author integer,'
        || '"number" character varying,'
        || 'CONSTRAINT "Policies_pkey" PRIMARY KEY (id),'
        || 'CONSTRAINT "Policies_author_fkey" FOREIGN KEY (author)'
        || '              REFERENCES "Users" (id) MATCH SIMPLE'
        || '              ON UPDATE NO ACTION ON DELETE NO ACTION'
        || '        )'
        || '        WITH ('
        || '          OIDS=FALSE'
        || '        );'
        || '        ALTER TABLE "Policies"'
        || '          OWNER TO indaba;' -- HAVE TO SET CORRECT DB USER
	END LOOP;

END
$BODY$
LANGUAGE plpgsql;

SELECT patch_20160506_01_policies();
DROP FUNCTION IF EXISTS public.patch_20160506_01_policies();

