CREATE OR REPLACE FUNCTION patch_20160525_02_comments() RETURNS void AS
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

		EXECUTE 'CREATE SEQUENCE "Comments_id_seq"'
|| ' INCREMENT 1'
|| ' MINVALUE 1'
|| ' MAXVALUE 9223372036854775807'
|| ' START 1'
|| ' CACHE 1;';
		EXECUTE 'ALTER TABLE "Comments_id_seq" OWNER TO "indaba";';
		EXECUTE 'DROP TABLE IF EXISTS "Comments";';
		EXECUTE 'CREATE TABLE "Comments" ('
|| '"id" int4 DEFAULT nextval(' || chr(39) || '"Comments_id_seq"' || chr(39) || '::regclass) NOT NULL,'
|| '"taskId" int4 NOT NULL,'
|| '"questionId" int4 NOT NULL,'
|| '"userId" int4,'
|| '"entry" text COLLATE "default" NOT NULL,'
|| '"isReturn" bool DEFAULT false NOT NULL,'
|| '"created" timestamptz(6) DEFAULT now() NOT NULL,'
|| '"updated" timestamptz(6),'
|| '"isResolve" bool DEFAULT false NOT NULL,'
|| '"order" int2 DEFAULT 1 NOT NULL,'
|| '"returnTaskId" int4,'
|| '"userFromId" int4 NOT NULL,'
|| '"stepId" int4 NOT NULL,'
|| '"stepFromId" int4,'
|| '"activated" bool DEFAULT false NOT NULL'
|| ')'
|| 'WITH (OIDS=FALSE)'
|| ';';
		EXECUTE 'ALTER TABLE "Comments" ADD PRIMARY KEY ("id");';
		EXECUTE 'ALTER TABLE "Comments" ADD FOREIGN KEY ("taskId") REFERENCES "Tasks" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION;';
		EXECUTE 'ALTER TABLE "Comments" ADD FOREIGN KEY ("userFromId") REFERENCES "Users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION;';
		EXECUTE 'ALTER TABLE "Comments" ADD FOREIGN KEY ("questionId") REFERENCES "SurveyQuestions" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION;';
		EXECUTE 'ALTER TABLE "Comments" ADD FOREIGN KEY ("returnTaskId") REFERENCES "Tasks" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION;';
		EXECUTE 'ALTER TABLE "Comments" ADD FOREIGN KEY ("stepId") REFERENCES "WorkflowSteps" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION;';
		EXECUTE 'ALTER TABLE "Comments" ADD FOREIGN KEY ("stepFromId") REFERENCES "WorkflowSteps" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION;';

        END LOOP;

END
$BODY$
LANGUAGE plpgsql;

SELECT patch_20160525_02_comments();
DROP FUNCTION IF EXISTS public.patch_20160525_02_comments();
