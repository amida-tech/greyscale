CREATE OR REPLACE FUNCTION patch_20160510_01_attachments() RETURNS void AS
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

  		EXECUTE 'CREATE TABLE "Attachments"'
          || '('
          || '  id serial NOT NULL,'
          || '  "essenceId" integer,'
          || '  "entityId" integer,'
          || '  filename character varying,'
          || '  size integer,'
          || '  mimetype character varying,'
          || '  body bytea,'
          || '  created timestamp with time zone,'
          || '  owner integer,'
          || '  CONSTRAINT "Attachments_pkey" PRIMARY KEY (id)'
          || ')'
          || 'WITH ('
          || '  OIDS=FALSE'
          || ');'
          || 'ALTER TABLE "Attachments"'
          || 'OWNER TO indaba;'; -- HAVE TO SET CORRECT DB USER
  	END LOOP;

  END
  $BODY$
  LANGUAGE plpgsql;

  SELECT patch_20160510_01_attachments();
  DROP FUNCTION IF EXISTS public.patch_20160510_01_attachments();


