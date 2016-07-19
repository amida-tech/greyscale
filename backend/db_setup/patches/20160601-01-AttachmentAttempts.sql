CREATE OR REPLACE FUNCTION public.patch_20160601_01_answerAttachments() RETURNS void AS
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
		EXECUTE 'CREATE TABLE "AttachmentAttempts"' ||
                 '(' ||
                   'key character varying NOT NULL,' ||
                   'filename character varying,' ||
                   'mimetype character varying,' ||
                   'size integer,' ||
                   'created timestamp without time zone NOT NULL DEFAULT now(),' ||
                   'CONSTRAINT "AttachmentAttempts_pkey" PRIMARY KEY (key)' ||
                 ')' ||
                 'WITH (' ||
                 '  OIDS=FALSE' ||
                 ');' ||
                 'ALTER TABLE "AttachmentAttempts"' ||
                   'OWNER TO indaba;'; -- HAVE TO SET CORRECT DB USER
	END LOOP;
END
$BODY$
LANGUAGE plpgsql;

SELECT public.patch_20160601_01_answerAttachments();
DROP FUNCTION IF EXISTS public.patch_20160601_01_answerAttachments();




