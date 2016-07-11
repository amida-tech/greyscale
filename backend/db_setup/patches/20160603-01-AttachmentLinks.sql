CREATE OR REPLACE FUNCTION public.patch_20160603_01_attachmentLinks() RETURNS void AS
$BODY$
DECLARE
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
		EXECUTE 'CREATE TABLE "AttachmentLinks" ' ||
                 '( ' ||
                   '"essenceId" integer NOT NULL, ' ||
                   '"entityId" integer NOT NULL, ' ||
                   'attachments integer[], ' ||
                   'CONSTRAINT "AttachmentLinks_pkey" PRIMARY KEY ("essenceId", "entityId"),' ||
                   'CONSTRAINT "AttachmentLinks_essenceId_fkey" FOREIGN KEY ("essenceId") ' ||
                       'REFERENCES "Essences" (id) MATCH SIMPLE ' ||
                       'ON UPDATE NO ACTION ON DELETE NO ACTION' ||
                 ') ' ||
                 'WITH ( ' ||
                   'OIDS=FALSE ' ||
                 '); ' ||
                 'ALTER TABLE "AttachmentLinks" ' ||
                   'OWNER TO indaba;'; -- HAVE TO SET CORRECT DB USER'
	END LOOP;
END
$BODY$
LANGUAGE plpgsql;

SELECT public.patch_20160603_01_attachmentLinks();
DROP FUNCTION IF EXISTS public.patch_20160603_01_attachmentLinks();


